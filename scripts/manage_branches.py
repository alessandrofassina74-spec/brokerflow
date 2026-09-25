#!/usr/bin/env python3
"""
BrokerFlow - Bank Branches Management & Territorial Geocoding System.
Handles parsing branch lists from Excel (.xlsx, .xls), PDF, Word (.docx), CSV, or text,
geocoding addresses via data/comuni.json, updating data/branches.json, and syncing
bank territories in data/bank_policies/ and engine.js.
"""

import os
import sys
import json
import base64
import datetime
import shutil
import urllib.request
import ssl
import re
import xml.etree.ElementTree as ET
import zipfile

WORKSPACE_DIR = "/Users/alessandrofassina/Desktop/broker flow"
BRANCHES_JSON_PATH = os.path.join(WORKSPACE_DIR, "data/branches.json")
COMUNI_JSON_PATH = os.path.join(WORKSPACE_DIR, "data/comuni.json")
BANK_POLICIES_DIR = os.path.join(WORKSPACE_DIR, "data/bank_policies")
POLICIES_JSON_PATH = os.path.join(WORKSPACE_DIR, "data/policies.json")
ENGINE_JS_PATH = os.path.join(WORKSPACE_DIR, "engine.js")
BACKUPS_DIR = os.path.join(WORKSPACE_DIR, "data/backups")

# Import helpers
sys.path.append(os.path.join(WORKSPACE_DIR, "scripts"))
from manage_policies import load_env, create_backup, cmd_sync
from manage_rates import extract_excel_all_sheets

PROV_SIGLA_MAP = {
    'AG': 'agrigento', 'AL': 'alessandria', 'AN': 'ancona', 'AO': 'aosta', 'AR': 'arezzo', 'AP': 'ascoli piceno',
    'AT': 'asti', 'AV': 'avellino', 'BA': 'bari', 'BT': 'barletta-andria-trani', 'BL': 'belluno', 'BN': 'benevento',
    'BG': 'bergamo', 'BI': 'biella', 'BO': 'bologna', 'BZ': 'bolzano', 'BS': 'brescia', 'BR': 'brindisi',
    'CA': 'cagliari', 'CL': 'caltanissetta', 'CB': 'campobasso', 'CI': 'carbonia-iglesias', 'CE': 'caserta',
    'CT': 'catania', 'CZ': 'catanzaro', 'CH': 'chieti', 'CO': 'como', 'CS': 'cosenza', 'CR': 'cremona',
    'KR': 'crotone', 'CN': 'cuneo', 'EN': 'enna', 'FM': 'fermo', 'FE': 'ferrara', 'FI': 'firenze',
    'FG': 'foggia', 'FC': 'forli-cesena', 'FR': 'frosinone', 'GE': 'genova', 'GO': 'gorizia', 'GR': 'grosseto',
    'IM': 'imperia', 'IS': 'isernia', 'SP': 'la spezia', 'AQ': "l'aquila", 'LT': 'latina', 'LE': 'lecce',
    'LC': 'lecco', 'LI': 'livorno', 'LO': 'lodi', 'LU': 'lucca', 'MC': 'macerata', 'MN': 'mantova',
    'MS': 'massa-carrara', 'MT': 'matera', 'ME': 'messina', 'MI': 'milano', 'MO': 'modena', 'MB': 'monza e brianza',
    'NA': 'napoli', 'NO': 'novara', 'NU': 'nuoro', 'OG': 'ogliastra', 'OT': 'olbia-tempio', 'OR': 'oristano',
    'PD': 'padova', 'PA': 'palermo', 'PR': 'parma', 'PV': 'pavia', 'PG': 'perugia', 'PU': 'pesaro e urbino',
    'PE': 'pescara', 'PC': 'piacenza', 'PI': 'pisa', 'PT': 'pistoia', 'PN': 'pordenone', 'PZ': 'potenza',
    'PO': 'prato', 'RG': 'ragusa', 'RA': 'ravenna', 'RC': 'reggio calabria', 'RE': 'reggio emilia', 'RI': 'rieti',
    'RN': 'rimini', 'RM': 'roma', 'RO': 'rovigo', 'SA': 'salerno', 'SS': 'sassari', 'SV': 'savona',
    'SI': 'siena', 'SR': 'siracusa', 'SO': 'sondrio', 'SU': 'sud sardegna', 'TA': 'taranto', 'TE': 'teramo',
    'TR': 'terni', 'TO': 'torino', 'TP': 'trapani', 'TN': 'trento', 'TV': 'treviso', 'TS': 'trieste',
    'UD': 'udine', 'VA': 'varese', 'VE': 'venezia', 'VB': 'verbano-cusio-ossola', 'VC': 'vercelli', 'VR': 'verona',
    'VV': 'vibo valentia', 'VI': 'vicenza', 'VS': 'medio campidano', 'VT': 'viterbo'
}

def load_comuni_database():
    """Loads comuni coordinates dictionary."""
    if not os.path.exists(COMUNI_JSON_PATH):
        return {}
    with open(COMUNI_JSON_PATH, "r", encoding="utf-8") as f:
        comuni = json.load(f)
    
    comuni_map = {}
    for c in comuni:
        name_clean = c.get("name", "").strip().upper()
        comuni_map[name_clean] = {
            "lat": c.get("lat"),
            "lng": c.get("lng"),
            "prov": c.get("sigla_provincia", "")
        }
    return comuni_map

def geocode_city(city_name, comuni_map):
    """Finds lat and lng for a municipality."""
    if not city_name or not comuni_map:
        return None, None, None
    city_upper = city_name.strip().upper()
    if city_upper in comuni_map:
        c = comuni_map[city_upper]
        return c["lat"], c["lng"], c["prov"]
    # Partial match
    for k, v in comuni_map.items():
        if k == city_upper or (len(city_upper) > 4 and (k in city_upper or city_upper in k)):
            return v["lat"], v["lng"], v["prov"]
    return None, None, None

def parse_branches_excel_direct(excel_path, bank_id, comuni_map):
    """Directly extracts branch rows from .xlsx file."""
    branches = []
    ns = {
        'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
        'rel': 'http://schemas.openxmlformats.org/package/2006/relationships',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }
    
    with zipfile.ZipFile(excel_path) as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in ss_tree.findall('.//main:si', ns):
                texts = [t.text for t in si.findall('.//main:t', ns) if t.text]
                shared_strings.append(''.join(texts))
                
        sheet_targets = {}
        if 'xl/_rels/workbook.xml.rels' in z.namelist():
            rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
            for rel in rels_tree.findall('.//rel:Relationship', ns):
                r_id = rel.attrib.get('Id')
                target = rel.attrib.get('Target')
                if not target.startswith('xl/'):
                    target = 'xl/' + target.lstrip('/')
                sheet_targets[r_id] = target
                
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = wb_tree.findall('.//main:sheet', ns)
        
        # Prioritize open branches and avoid closed ones
        target_sheets = []
        for s in sheets:
            s_name = s.attrib.get('name', '')
            if 'chius' in s_name.lower():
                continue
            target_sheets.append(s)
            
        if not target_sheets and sheets:
            target_sheets = [sheets[0]]
            
        for s in target_sheets:
            s_name = s.attrib.get('name', 'Foglio')
            r_id = s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            sheet_path = sheet_targets.get(r_id)
            if not sheet_path or sheet_path not in z.namelist():
                sheet_idx = s.attrib.get('sheetId', '1')
                sheet_path = f'xl/worksheets/sheet{sheet_idx}.xml'
                
            if sheet_path in z.namelist():
                sh_tree = ET.fromstring(z.read(sheet_path))
                rows = sh_tree.findall('.//main:row', ns)
                if not rows:
                    continue
                    
                parsed_rows = []
                for r in rows:
                    row_dict = {}
                    for c in r.findall('./main:c', ns):
                        ref = c.attrib.get('r', '')
                        col = ''.join([ch for ch in ref if ch.isalpha()])
                        v_el = c.find('main:v', ns)
                        t_attr = c.attrib.get('t')
                        val = ''
                        if v_el is not None and v_el.text:
                            val = shared_strings[int(v_el.text)] if t_attr == 's' else v_el.text
                        elif t_attr == 'inlineStr':
                            is_el = c.find('.//main:t', ns)
                            if is_el is not None and is_el.text:
                                val = is_el.text
                        row_dict[col] = val.strip()
                    if any(row_dict.values()):
                        parsed_rows.append(row_dict)
                        
                if len(parsed_rows) < 2:
                    continue
                    
                headers = parsed_rows[0]
                col_denom, col_comune, col_indirizzo, col_cap, col_prov, col_phone, col_email = None, None, None, None, None, None, None
                
                for col_letter, h_val in headers.items():
                    h_lower = h_val.lower().strip()
                    if 'denom' in h_lower or h_lower == 'sportello' or h_lower == 'filiale' or h_lower == 'agenzia':
                        if not col_denom: col_denom = col_letter
                    if 'comune' in h_lower or 'citt' in h_lower or 'localit' in h_lower:
                        if not col_comune: col_comune = col_letter
                    if 'indiriz' in h_lower or 'via' in h_lower or 'ubicazione' in h_lower:
                        if not col_indirizzo: col_indirizzo = col_letter
                    if 'cap' in h_lower:
                        if not col_cap: col_cap = col_letter
                    if 'prov' in h_lower:
                        col_prov = col_letter
                    if 'telefono' in h_lower or 'phone' in h_lower or h_lower.startswith('tel') or 'cell' in h_lower or 'recapito' in h_lower:
                        if not col_phone: col_phone = col_letter
                    if 'mail' in h_lower or 'email' in h_lower or 'e-mail' in h_lower or 'pec' in h_lower:
                        if not col_email: col_email = col_letter
                        
                for r in parsed_rows[1:]:
                    denom = r.get(col_denom, '') if col_denom else ''
                    comune = r.get(col_comune, '') if col_comune else ''
                    indirizzo = r.get(col_indirizzo, '') if col_indirizzo else ''
                    cap = r.get(col_cap, '') if col_cap else ''
                    prov = r.get(col_prov, '') if col_prov else ''
                    phone = r.get(col_phone, '') if col_phone else ''
                    email = r.get(col_email, '') if col_email else ''
                    
                    if not denom and not comune and not indirizzo:
                        continue
                        
                    clean_bank_title = bank_id.replace("_", " ").title()
                    if denom and not denom.lower().startswith(clean_bank_title.lower()):
                        branch_name = f"{clean_bank_title} - {denom.title()}"
                    else:
                        branch_name = denom.title() if denom else f"{clean_bank_title} - {comune.title()}"
                        
                    city_for_geo = comune or denom
                    lat, lng, found_prov = geocode_city(city_for_geo, comuni_map)
                    prov_final = prov or found_prov or ""
                    
                    addr_parts = []
                    if indirizzo: addr_parts.append(indirizzo)
                    if city_for_geo: addr_parts.append(city_for_geo.title())
                    cap_prov = []
                    if cap: cap_prov.append(f"CAP {cap}")
                    if prov_final: cap_prov.append(prov_final.upper())
                    if cap_prov: addr_parts.append(f"({', '.join(cap_prov)})")
                    full_address = ", ".join(addr_parts)
                    
                    branches.append({
                        "name": branch_name,
                        "prov": city_for_geo.title(),
                        "indirizzo": full_address,
                        "telefono": phone if phone else "800 227788",
                        "email": email if email else None,
                        "lat": lat,
                        "lng": lng,
                        "prov_code": prov_final.upper() if prov_final else "ALTRO"
                    })
    return branches

def query_gemini_branches(api_key, text_content, bank_id="", model="gemini-3.6-flash"):
    """Uses Gemini to parse unstructured branch text or documents."""
    models_to_try = [model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-lite"]
    models_to_try = list(dict.fromkeys(models_to_try))
    
    prompt = f"""Sei un analista dati specializzato nell'estrazione di reti di filiali bancarie in Italia per BrokerFlow.
Analizza il testo fornito ed estrai l'elenco COMPLETO di tutte le filiali/sportelli aperti per la banca "{bank_id}".

SCHEMA JSON RICHIESTO:
Restituisci ESCLUSIVAMENTE un array JSON di oggetti con questi campi:
[
  {{
    "name": "Nome Filiale (es. {bank_id.title()} - Roma Sede)",
    "prov": "Comune o Provincia (es. Roma)",
    "indirizzo": "Indirizzo completo con via, CAP e provincia (es. Via del Tritone 125, 00187 Roma RM)",
    "telefono": "Numero di telefono della filiale o numero verde",
    "email": "Email della filiale se presente o null"
  }}
]

REGOLE CRITICHE:
1. Estrai TUTTE le filiali presenti nel documento senza tralasciarne nessuna.
2. Escludi esplicitamente sportelli chiusi o dismessi se indicati.
3. Se non è presente il numero di telefono, inserisci un numero verde standard o null.
4. Restituisci SOLO il JSON valido senza blocchi markdown aggiuntivi.

TESTO FILIALI:
{text_content[:80000]}
"""
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    
    ctx = ssl._create_unverified_context()
    last_err = None
    
    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=60, context=ctx) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_resp = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_resp.strip())
        except urllib.error.HTTPError as e:
            last_err = e
            print(f"query_gemini_branches: modello {m} HTTP {e.code}: {e.reason}, fallback...")
            continue
        except Exception as e:
            last_err = e
            print(f"query_gemini_branches: modello {m} errore {e}, fallback...")
            continue
            
    if last_err:
        raise last_err
    raise Exception("Nessun modello Gemini disponibile per le filiali.")

def extract_branches_preview(bank_id, file_path_or_text, file_name="", is_raw_text=False, model="gemini-3.5-flash-lite"):
    """Main extraction coordinator for branch files."""
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    comuni_map = load_comuni_database()
    
    branches = []
    
    if not is_raw_text and file_path_or_text and file_name.lower().endswith(('.xlsx', '.xlsm', '.xls')):
        try:
            branches = parse_branches_excel_direct(file_path_or_text, bank_id, comuni_map)
        except Exception as e:
            print(f"Direct Excel parse fallback: {e}")
            
    if not branches:
        if is_raw_text:
            text_content = file_path_or_text
        elif file_name.lower().endswith(('.xlsx', '.xlsm', '.xls')):
            text_content = extract_excel_all_sheets(file_path_or_text)
        elif file_name.lower().endswith('.docx'):
            from manage_policies import extract_docx_text
            text_content = extract_docx_text(file_path_or_text)
        elif file_name.lower().endswith('.pdf'):
            from manage_policies import extract_pdf_text_macos
            text_content = extract_pdf_text_macos(file_path_or_text)
        else:
            with open(file_path_or_text, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()
                
        if not api_key:
            raise Exception("GEMINI_API_KEY non configurata nel file .env.")
            
        raw_branches = query_gemini_branches(api_key, text_content, bank_id=bank_id, model=model)
        for b in raw_branches:
            city_name = b.get("prov", "") or b.get("name", "")
            lat, lng, found_prov = geocode_city(city_name, comuni_map)
            branches.append({
                "name": b.get("name", f"{bank_id.title()} - Filiale"),
                "prov": city_name.title() if city_name else "Italia",
                "indirizzo": b.get("indirizzo", ""),
                "telefono": b.get("telefono", "800 227788"),
                "email": b.get("email"),
                "lat": lat,
                "lng": lng,
                "prov_code": found_prov.upper() if found_prov else "ALTRO"
            })
            
    prov_summary = {}
    for b in branches:
        p_code = b.get("prov_code")
        if not p_code or p_code == "ALTRO":
            p_name = b.get("prov", "").upper()
            for s, full in PROV_SIGLA_MAP.items():
                if full.upper() in p_name or p_name in full.upper():
                    p_code = s
                    break
            if not p_code:
                p_code = p_name[:2] if len(p_name) >= 2 else "ALTRO"
        prov_summary[p_code] = prov_summary.get(p_code, 0) + 1
        
    return {
        "status": "preview_ready",
        "bank_id": bank_id,
        "total_branches": len(branches),
        "provinces_summary": dict(sorted(prov_summary.items(), key=lambda x: -x[1])),
        "branches": branches
    }

def apply_and_save_branches(bank_id, branches_list):
    """Saves branches to data/branches.json, updates policy territories, and syncs engine.js."""
    if not bank_id or not isinstance(branches_list, list):
        raise ValueError("Parametri mancanti per il salvataggio delle filiali.")
        
    create_backup(f"pre_branches_update_{bank_id}")
    
    # Remove temporary internal keys like 'prov_code'
    clean_branches = []
    for b in branches_list:
        clean_b = {
            "name": b.get("name"),
            "prov": b.get("prov"),
            "indirizzo": b.get("indirizzo"),
            "telefono": b.get("telefono", "800 227788"),
            "email": b.get("email"),
            "lat": b.get("lat"),
            "lng": b.get("lng")
        }
        clean_branches.append(clean_b)
        
    branches_db = {}
    if os.path.exists(BRANCHES_JSON_PATH):
        with open(BRANCHES_JSON_PATH, "r", encoding="utf-8") as f:
            branches_db = json.load(f)
            
    branches_db[bank_id] = clean_branches
    with open(BRANCHES_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(branches_db, f, indent=4, ensure_ascii=False)
    print(f"Salvate {len(clean_branches)} filiali per '{bank_id}' in data/branches.json")
    
    distinct_territories = set()
    for b in clean_branches:
        city = b.get("prov", "").strip().lower()
        if city:
            distinct_territories.add(city)
        addr = b.get("indirizzo", "").lower()
        for sigla, prov_name in PROV_SIGLA_MAP.items():
            if f"({sigla.lower()})" in addr or f", {sigla.lower()}" in addr or prov_name in addr:
                distinct_territories.add(prov_name)
                distinct_territories.add(sigla.lower())
                
    territories_list = sorted(list(distinct_territories))
    
    indiv_policy_path = os.path.join(BANK_POLICIES_DIR, f"{bank_id}_policy.json")
    if os.path.exists(indiv_policy_path):
        with open(indiv_policy_path, "r", encoding="utf-8") as f:
            p_data = json.load(f)
        if p_data.get("isNationwide") is not True:
            p_data["isNationwide"] = False
            p_data["territories"] = territories_list
        with open(indiv_policy_path, "w", encoding="utf-8") as f:
            json.dump(p_data, f, indent=4, ensure_ascii=False)
            
    if os.path.exists(POLICIES_JSON_PATH):
        with open(POLICIES_JSON_PATH, "r", encoding="utf-8") as f:
            all_p = json.load(f)
        if bank_id in all_p:
            if all_p[bank_id].get("isNationwide") is not True:
                all_p[bank_id]["isNationwide"] = False
                all_p[bank_id]["territories"] = territories_list
            with open(POLICIES_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(all_p, f, indent=4, ensure_ascii=False)
                
    cmd_sync()
    print(f"Sincronizzazione completata con successo per '{bank_id}'!")
    return True

if __name__ == "__main__":
    print("BrokerFlow Branches Manager Loaded.")
