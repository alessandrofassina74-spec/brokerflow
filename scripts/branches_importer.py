import urllib.request
import json
import os
import re

url = "https://raw.githubusercontent.com/nicogis/ABICAB/master/abi_cab.json"
comuni_path = "/Users/alessandrofassina/Desktop/broker flow/data/comuni.json"
branches_out_path = "/Users/alessandrofassina/Desktop/broker flow/data/branches.json"

def import_real_branches():
    if not os.path.exists(comuni_path):
        print("Error: comuni.json not found")
        return

    # Load comuni coordinates
    print("Loading comuni coordinates...")
    with open(comuni_path, "r", encoding="utf-8") as f:
        comuni = json.load(f)

    comuni_map = {}
    for c in comuni:
        name_upper = c.get("name", "").strip().upper()
        comuni_map[name_upper] = {
            "lat": c.get("lat"),
            "lng": c.get("lng"),
            "prov": c.get("sigla_provincia", "")
        }

    # Download the full ABICAB file
    print(f"Downloading full ABI/CAB database from {url}...")
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            content = response.read().decode("utf-8-sig")
            content_cleaned = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', content)
            data = json.loads(content_cleaned, strict=False)
    except Exception as e:
        print("Download failed:", e)
        return

    print(f"Total rows in ABI/CAB database: {len(data.get('abicab', []))}")

    # CONFIGURATION: Add any new banks here with their ABI code or name identifier
    bank_mapping = {
        "mps": {"abi": "01030", "keywords": ["MONTE DEI PASCHI"]},
        "bper": {"abi": "05387", "keywords": ["BPER BANCA", "BANCA POPOLARE DELL'EMILIA"]},
        "ing": {"abi": "03169", "keywords": ["ING BANK"]},
        "chebanca": {"abi": "03058", "keywords": ["CHEBANCA", "MEDIOBANCA PREMIER"]}
        # In future, add new banks here, e.g.:
        # "unicredit": {"abi": "02008", "keywords": ["UNICREDIT"]},
        # "intesa": {"abi": "03069", "keywords": ["INTESA SANPAOLO"]}
    }

    branches_db = {k: [] for k in bank_mapping.keys()}

    for item in data.get("abicab", []):
        abi = item.get("ABI", "").strip()
        ist = item.get("Istituto", "").strip().upper()
        citta = item.get("Citta", "").strip().upper()
        
        matched_key = None
        for key, config in bank_mapping.items():
            if abi == config["abi"] or any(kw in ist for kw in config["keywords"]):
                matched_key = key
                break
                
        if not matched_key:
            continue
            
        geo = comuni_map.get(citta)
        if not geo:
            for name_key, coords in comuni_map.items():
                if name_key in citta or citta in name_key:
                    geo = coords
                    break
                    
        if not geo:
            continue
            
        branch_name = item.get("Sportello", "").strip().title()
        indirizzo = item.get("Indirizzo", "").strip().title()
        cap = item.get("CAP", "").strip()
        citta_title = item.get("Citta", "").strip().title()
        prov_sigla = item.get("Provincia", "").strip().upper()
        
        generic_support = {
            "mps": "800 414080",
            "bper": "800 227788",
            "ing": "800 717273",
            "chebanca": "800 101030"
            # In future: "unicredit": "800 323285", etc.
        }
        phone = generic_support.get(matched_key, "800 123456")
        
        branches_db[matched_key].append({
            "name": f"{ist.title()} - {branch_name}",
            "prov": citta_title,
            "indirizzo": f"{indirizzo}, {citta_title} (CAP {cap}, {prov_sigla})",
            "telefono": phone,
            "lat": geo["lat"],
            "lng": geo["lng"]
        })

    with open(branches_out_path, "w", encoding="utf-8") as f:
        json.dump(branches_db, f, indent=4, ensure_ascii=False)

    print("\n--- IMPORT SUMMARY ---")
    print(f"File saved to: {branches_out_path}")
    for k, v in branches_db.items():
        print(f"Imported {len(v)} real branches for: {k.upper()}")

if __name__ == "__main__":
    import_real_branches()
