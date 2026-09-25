import urllib.request
import ssl
import re
import json
import os
from datetime import datetime

ssl_context = ssl._create_unverified_context()
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3'
}

def fetch_html(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ssl_context) as response:
        return response.read().decode('utf-8', errors='ignore')

def run_fetch_daily_rates():
    # 1. Fetch IRS rates
    irs_url = "https://mutuionline.24oreborsaonline.ilsole24ore.com/guide-mutui/irs.asp"
    irs_rates = {}
    try:
        html_irs = fetch_html(irs_url)
        tbody_start = html_irs.find("<tbody>", html_irs.find("<th>Descrizione</th>"))
        tbody_end = html_irs.find("</tbody>", tbody_start)
        if tbody_start != -1 and tbody_end != -1:
            tbody_content = html_irs[tbody_start:tbody_end]
            trs = re.findall(r'<tr>(.*?)</tr>', tbody_content, re.DOTALL)
            for tr in trs:
                tds = re.findall(r'<td>(.*?)</td>', tr, re.DOTALL)
                if len(tds) >= 2:
                    desc = re.sub(r'<.*?>', '', tds[0]).strip()
                    fixing = re.sub(r'<.*?>', '', tds[1]).strip()
                    fixing_val = float(fixing.replace("%", "").replace(",", ".").strip())
                    match = re.search(r'IRS\s+(\d+)A', desc)
                    if match:
                        years = int(match.group(1))
                        irs_rates[years] = fixing_val
        print(f"Fetched {len(irs_rates)} IRS rates successfully.", flush=True)
    except Exception as e:
        print(f"Error fetching IRS rates: {e}", flush=True)

    # 2. Fetch Euribor rates
    euribor_url = "https://mutuionline.24oreborsaonline.ilsole24ore.com/guide-mutui/euribor.asp"
    euribor_rates = {}
    try:
        html_eur = fetch_html(euribor_url)
        tbody_start = html_eur.find("<tbody>", html_eur.find("<th>Nome</th>"))
        tbody_end = html_eur.find("</tbody>", tbody_start)
        if tbody_start != -1 and tbody_end != -1:
            tbody_content = html_eur[tbody_start:tbody_end]
            trs = re.findall(r'<tr>(.*?)</tr>', tbody_content, re.DOTALL)
            for tr in trs:
                tds = re.findall(r'<td>(.*?)</td>', tr, re.DOTALL)
                if len(tds) >= 2:
                    desc = re.sub(r'<.*?>', '', tds[0]).strip()
                    fixing = re.sub(r'<.*?>', '', tds[1]).strip()
                    fixing_val = float(fixing.replace("%", "").replace(",", ".").strip())
                    match = re.search(r'Euribor\s+(\w+)', desc)
                    if match:
                        key = match.group(1).upper()
                        euribor_rates[key] = fixing_val
        print(f"Fetched {len(euribor_rates)} Euribor rates successfully.", flush=True)
    except Exception as e:
        print(f"Error fetching Euribor rates: {e}", flush=True)

    # Save to tassi_giornalieri.json
    output_data = {
        "last_updated": datetime.now().isoformat(),
        "irs": irs_rates,
        "euribor": euribor_rates
    }

    # Ensure data folder exists
    base_dir = "/Users/alessandrofassina/Desktop/broker flow"
    os.makedirs(os.path.join(base_dir, "data"), exist_ok=True)

    out_path = os.path.join(base_dir, "data", "tassi_giornalieri.json")
    try:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)
        print(f"Successfully updated daily rates in {out_path}!", flush=True)
    except Exception as e:
        print(f"Error writing output JSON: {e}", flush=True)

    # 3. Update historical_rates.json automatically
    hist_path = os.path.join(base_dir, "data", "historical_rates.json")
    if os.path.exists(hist_path):
        try:
            with open(hist_path, "r", encoding="utf-8") as f:
                hist_data = json.load(f)
            
            today_str = datetime.now().strftime("%Y-%m-%d")
            mapping = {
                "IRS_10Y": irs_rates.get(10),
                "IRS_15Y": irs_rates.get(15),
                "IRS_20Y": irs_rates.get(20),
                "IRS_25Y": irs_rates.get(25),
                "IRS_30Y": irs_rates.get(30),
                "EUR_1M": euribor_rates.get("1M"),
                "EUR_3M": euribor_rates.get("3M"),
                "EUR_6M": euribor_rates.get("6M"),
            }
            
            if today_str not in hist_data["dates"]:
                if any(val is not None for val in mapping.values()):
                    hist_data["dates"].append(today_str)
                    for key, val in mapping.items():
                        new_val = val if val is not None else (hist_data["rates"][key][-1] if hist_data["rates"][key] else 0.0)
                        hist_data["rates"][key].append(new_val)
                    
                    with open(hist_path, "w", encoding="utf-8") as f:
                        json.dump(hist_data, f, indent=4, ensure_ascii=False)
                    print(f"Successfully appended today's rates ({today_str}) to historical_rates.json!", flush=True)
            else:
                idx = hist_data["dates"].index(today_str)
                updated_any = False
                for key, val in mapping.items():
                    if val is not None:
                        hist_data["rates"][key][idx] = val
                        updated_any = True
                if updated_any:
                    with open(hist_path, "w", encoding="utf-8") as f:
                        json.dump(hist_data, f, indent=4, ensure_ascii=False)
                    print(f"Updated existing entry for {today_str} in historical_rates.json.", flush=True)
        except Exception as e:
            print(f"Error updating historical rates: {e}", flush=True)
    return output_data

if __name__ == "__main__":
    run_fetch_daily_rates()
