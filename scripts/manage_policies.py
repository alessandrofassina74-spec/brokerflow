#!/usr/bin/env python3
"""
BrokerFlow - Independent Bank Policy Parser and Database Alignment System.
This script provides an end-to-end pipeline to:
1. Parse unstructured/semi-structured bank policy texts, Word documents (.docx), or PDF files using Gemini.
2. Retrieve and geolocate bank branches automatically and save them to `data/branches.json`.
3. Maintain a database of individual bank policy files inside `data/bank_policies/`.
4. Compute the deep union structure of all bank policies and align every file so they share the identical schema, setting missing attributes to null.
5. Compile individual bank policies into a unified `data/policies.json` database.
6. Synchronize the compiled policy database into `engine.js`.
7. Safeguard all operations with automatic backups and restore commands.
"""

import os
import sys
import json
import argparse
import zipfile
import xml.etree.ElementTree as ET
import urllib.request
import urllib.error
import ssl
import base64
import shutil
import datetime

WORKSPACE_DIR = "/Users/alessandrofassina/Desktop/broker flow"
BANK_POLICIES_DIR = os.path.join(WORKSPACE_DIR, "data/bank_policies")
POLICIES_JSON_PATH = os.path.join(WORKSPACE_DIR, "data/policies.json")
BNL_POLICY_JSON_PATH = os.path.join(WORKSPACE_DIR, "data/bnl_policy.json")
ENGINE_JS_PATH = os.path.join(WORKSPACE_DIR, "engine.js")
BACKUPS_DIR = os.path.join(WORKSPACE_DIR, "data/backups")

def load_env():
    """Load environment variables from .env file."""
    possible_paths = [
        os.path.join(WORKSPACE_DIR, ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        os.path.join(os.getcwd(), ".env"),
        ".env"
    ]
    for env_path in possible_paths:
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        parts = line.split('=', 1)
                        os.environ[parts[0].strip()] = parts[1].strip()
            return

def extract_docx_text(path):
    """Extract raw text from a .docx file's document.xml."""
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            for p in root.findall('.//w:p', namespaces):
                p_text = []
                for t in p.findall('.//w:t', namespaces):
                    if t.text:
                        p_text.append(t.text)
                if p_text:
                    paragraphs.append("".join(p_text))
            return "\n".join(paragraphs)
    except Exception as e:
        raise Exception(f"Errore durante l'estrazione del file docx {path}: {str(e)}")

def clean_territories(bid, val):
    if isinstance(val, list):
        return val
    if isinstance(val, dict):
        flat = []
        for subval in val.values():
            if isinstance(subval, list):
                flat.extend(subval)
            elif isinstance(subval, str):
                flat.append(subval)
        if flat:
            return flat
    return ["*"]

def clean_list(bid, val):
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        return [val]
    if isinstance(val, dict):
        flat = []
        for subval in val.values():
            if isinstance(subval, list):
                flat.extend(subval)
            elif isinstance(subval, str):
                flat.append(subval)
        return flat
    return []

CORE_DEFAULTS = {
    "name": lambda bid, val: val if isinstance(val, str) else bid.upper(),
    "bgLogoLetter": lambda bid, val: val if isinstance(val, str) else bid[0].upper() if bid else "-",
    "color": lambda bid, val: val if isinstance(val, str) else "#cccccc",
    "isNationwide": lambda bid, val: val if isinstance(val, bool) else True,
    "territories": clean_territories,
    "allowedContracts": clean_list,
    "allowedPurposes": clean_list,
    "minLoan": lambda bid, val: val if isinstance(val, (int, float)) else 30000,
    "maxLoan": lambda bid, val: val if isinstance(val, (int, float)) else 2000000,
    "minDuration": lambda bid, val: val if isinstance(val, (int, float)) else 5,
    "maxDuration": lambda bid, val: val if isinstance(val, (int, float)) else 30,
    "durationStep": lambda bid, val: val if isinstance(val, (int, float)) else 1,
    "maxLtv": lambda bid, val: val if isinstance(val, (int, float)) else 0.80,
    "maxDsr": lambda bid, val: val if isinstance(val, (int, float)) else 0.35,
    "maxDsrDeroga": lambda bid, val: val if isinstance(val, (int, float)) else 0.40,
    "maxAge": lambda bid, val: val if isinstance(val, (int, float)) else 75,
    "maxGuarantorAge": lambda bid, val: val if isinstance(val, (int, float)) else 80,
    "maxBorrowers": lambda bid, val: val if isinstance(val, (int, float)) else 4,
    "isDigitalFirst": lambda bid, val: val if isinstance(val, bool) else False,
    "hasMri": lambda bid, val: val if isinstance(val, bool) else True,
    "ageCheckMethod": lambda bid, val: val if isinstance(val, str) else "oldest",
    "minResidencyYears": lambda bid, val: val if isinstance(val, (int, float)) else 2,
    "minSeniorityAutonomo": lambda bid, val: val if isinstance(val, (int, float)) else 24,
    "minSeniorityAutonomoDeroga": lambda bid, val: val if isinstance(val, (int, float)) else 18
}

def deep_union_schema(dicts):
    """
    Computes a template representing the union of all nested dictionary structures,
    with all leaf values set to None.
    """
    union_dict = {}
    for d in dicts:
        if not isinstance(d, dict):
            continue
        for k, v in d.items():
            if k in CORE_DEFAULTS:
                if k not in union_dict:
                    union_dict[k] = None
            elif isinstance(v, dict):
                if k not in union_dict or not isinstance(union_dict[k], dict):
                    union_dict[k] = {}
                union_dict[k] = deep_union_schema([union_dict[k], v])
            else:
                if k not in union_dict:
                    union_dict[k] = None
    return union_dict

def deep_copy_none(v):
    """Create a deep copy of a structure with all leaf values set to None."""
    if isinstance(v, dict):
        return {k: deep_copy_none(val) for k, val in v.items()}
    return None

def deep_align(data, template, bank_id=""):
    """
    Recursively updates 'data' to have the exact same structure as 'template'.
    Keeps existing values in 'data', and adds missing ones from 'template' (which are None).
    """
    if not isinstance(template, dict):
        return data
    
    if not isinstance(data, dict):
        data = {}
        
    aligned = {}
    for k, v in template.items():
        if k == "mriGrid":
            if k in data and isinstance(data[k], dict):
                aligned[k] = data[k]
            else:
                aligned[k] = v if isinstance(v, dict) else {}
            continue
        if k in data:
            val = data[k]
            if k in CORE_DEFAULTS:
                aligned[k] = CORE_DEFAULTS[k](bank_id, val)
            elif isinstance(v, dict):
                aligned[k] = deep_align(val, v, bank_id)
            else:
                aligned[k] = val
        else:
            if k in CORE_DEFAULTS:
                aligned[k] = CORE_DEFAULTS[k](bank_id, None)
            else:
                aligned[k] = deep_copy_none(v)
            
    # Safely retain any extra fields that might exist in data but not in template
    for k, v in data.items():
        if k not in aligned:
            aligned[k] = v
            
    return aligned

def create_backup(name=None):
    """Creates a safety backup of policies, branches, and engine.js."""
    if not name:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        name = f"auto_backup_{timestamp}"
        
    backup_path = os.path.join(BACKUPS_DIR, name)
    os.makedirs(backup_path, exist_ok=True)
    print(f"Salvataggio backup '{name}' in corso...")
    
    # 1. Copy policies.json
    if os.path.exists(POLICIES_JSON_PATH):
        shutil.copy2(POLICIES_JSON_PATH, os.path.join(backup_path, "policies.json"))
        
    # 2. Copy branches.json
    branches_path = os.path.join(WORKSPACE_DIR, "data/branches.json")
    if os.path.exists(branches_path):
        shutil.copy2(branches_path, os.path.join(backup_path, "branches.json"))
        
    # 3. Copy engine.js
    if os.path.exists(ENGINE_JS_PATH):
        shutil.copy2(ENGINE_JS_PATH, os.path.join(backup_path, "engine.js"))
        
    # 4. Copy bank_policies folder
    bp_backup_dir = os.path.join(backup_path, "bank_policies")
    if os.path.exists(BANK_POLICIES_DIR):
        if os.path.exists(bp_backup_dir):
            shutil.rmtree(bp_backup_dir)
        shutil.copytree(BANK_POLICIES_DIR, bp_backup_dir)
        
    print(f"Backup '{name}' completato con successo!")
    return name

def restore_backup(name=None):
    """Restores the backup database files back to active workspace."""
    if not name:
        # Find latest auto_backup
        if not os.path.exists(BACKUPS_DIR):
            print("Nessun backup trovato (la cartella dei backup non esiste).")
            return
        backups = [d for d in os.listdir(BACKUPS_DIR) if os.path.isdir(os.path.join(BACKUPS_DIR, d))]
        auto_backups = [d for d in backups if d.startswith("auto_backup_")]
        if not auto_backups:
            print("Nessun backup automatico trovato.")
            return
        auto_backups.sort()
        name = auto_backups[-1] # latest
        
    backup_path = os.path.join(BACKUPS_DIR, name)
    if not os.path.exists(backup_path):
        print(f"Errore: il backup '{name}' non esiste in {BACKUPS_DIR}.")
        return
        
    print(f"Ripristino del backup '{name}' in corso...")
    
    # 1. Restore policies.json
    backup_policies = os.path.join(backup_path, "policies.json")
    if os.path.exists(backup_policies):
        shutil.copy2(backup_policies, POLICIES_JSON_PATH)
        print("- Ripristinato policies.json")
        
    # 2. Restore branches.json
    backup_branches = os.path.join(backup_path, "branches.json")
    branches_path = os.path.join(WORKSPACE_DIR, "data/branches.json")
    if os.path.exists(backup_branches):
        shutil.copy2(backup_branches, branches_path)
        print("- Ripristinato branches.json")
        
    # 3. Restore engine.js
    backup_engine = os.path.join(backup_path, "engine.js")
    if os.path.exists(backup_engine):
        shutil.copy2(backup_engine, ENGINE_JS_PATH)
        print("- Ripristinato engine.js")
        
    # 4. Restore bank_policies folder
    backup_bp = os.path.join(backup_path, "bank_policies")
    if os.path.exists(backup_bp):
        if os.path.exists(BANK_POLICIES_DIR):
            shutil.rmtree(BANK_POLICIES_DIR)
        shutil.copytree(backup_bp, BANK_POLICIES_DIR)
        print("- Ripristinato cartella data/bank_policies/")
        
    print(f"Ripristino del backup '{name}' completato con successo!")

def cmd_list_backups():
    """Lists all available backups in the terminal."""
    if not os.path.exists(BACKUPS_DIR):
        print("Nessun backup trovato (la cartella dei backup non esiste).")
        return
    backups = sorted([d for d in os.listdir(BACKUPS_DIR) if os.path.isdir(os.path.join(BACKUPS_DIR, d))])
    if not backups:
        print("Nessun backup trovato.")
        return
    print("Elenco dei backup disponibili:")
    for b in backups:
        b_type = "AUTOMATICO" if b.startswith("auto_backup_") else "MANUALE"
        b_path = os.path.join(BACKUPS_DIR, b)
        mtime = os.path.getmtime(b_path)
        dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
        print(f" - {b:<30} [{b_type}] - Creato: {dt}")

def extract_pdf_text_macos(path):
    """Extract full text from PDF on macOS using PDFKit via osascript."""
    try:
        import subprocess
        cmd = [
            "osascript", "-e",
            f'use framework "PDFKit"\nset f to POSIX file "{path}"\nset doc to current application\'s PDFDocument\'s alloc()\'s initWithURL:f\nreturn (doc\'s |string|()) as text'
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception as e:
        print(f"Avviso estrazione testo PDF: {e}")
    return None

def query_gemini(api_key, content, baseline_schema, model="gemini-3.7-flash", is_pdf=False, bank_id="banca", pdf_text=None):
    """Call Google Gemini API using native urllib library to extract JSON rules."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    prompt = f"""Sei un analista senior di mutui ipotecari per il sistema BrokerFlow.
Il tuo compito è analizzare con la MASSIMA FEDELTÀ, PRECISIONE E COMPLETEZZA tutte le pagine del documento di policy bancaria per la banca '{bank_id.upper()}', estraendo tutti i criteri creditizi, le tabelle di sussistenza, e TUTTE le eccezioni e deroghe.

REGOLE CRITICHE DI ESTRAZIONE RIGOROSAMENTE IN ITALIANO:
1. LINGUA: TUTTE le nuove chiavi, sezioni e descrizioni testuali DEVONO essere RIGOROSAMENTE in ITALIANO.
   Non usare MAI chiavi in inglese come 'purpose_specific_limits', 'employment_categories', 'processing_times', 'guarantor_rules', ecc.
   Usa SEMPRE termini italiani: 'limiti_per_finalita', 'regole_garanti', 'categorie_lavorative', 'promozione_green', ecc.

2. NOME DELLA BANCA ("name"):
   Inserisci il nome ufficiale corretto della banca. Se l'utente ha indicato '{bank_id.upper()}' (es. 'Mediobanca Premier'), usa 'Mediobanca Premier' (o il nome commerciale effettivo indicato nel documento).

3. TABELLA DI SUSSISTENZA MINIMA (MRI / MINIMO VITALE):
   Se nel documento è presente una tabella delle soglie di sussistenza / minimo vitale per nucleo familiare e area geografica (Nord, Centro, Sud/Isole):
   - Estraila OBBLIGATORIAMENTE nel campo "mriGrid" usando valori PURAMENTE NUMERICI (decimali o interi, senza simboli € o testo).
   Esempio per tabelle geografiche per numero di persone (1, 2, 3, 4, 5 persone + quota aggiuntiva):
   "mriGrid": {{
       "nord": {{ "1": 874.58, "2": 1220.47, "3": 1526.13, "4": 1838.65, "5": 2119.61, "additional": 311.00 }},
       "centro": {{ "1": 848.90, "2": 1163.98, "3": 1446.38, "4": 1736.04, "5": 1996.47, "additional": 287.00 }},
       "sud": {{ "1": 751.17, "2": 1047.48, "3": 1321.96, "4": 1590.24, "5": 1840.45, "additional": 272.00 }}
   }}
   Se la tabella non è divisa per area ma solo per persone, inserisci direttamente "1", "2", "3", ecc. come chiavi alla radice di mriGrid.

4. SEZIONE SPECIFICA "eccezioni_e_deroghe":
   DEVI raccogliere TUTTE le eccezioni, deroghe e regole speciali presenti nel documento all'interno dell'oggetto "eccezioni_e_deroghe":
   - "limiti_finalita": dizionario per ciascuna finalità con i relativi vincoli speciali di LTV, DSR, durata e importo (es. "liquidita": {{ "max_ltv": 0.70, "max_dsr": 0.30, "importo_massimo": 200000 }}, "consolidamento": {{ "max_ltv": 0.70, "max_dsr": 0.30, "max_durata": 25, "note": "max 5 esposizioni debitorie" }}, "surroga": {{ "max_ltv": 0.80, "ammortamento_minimo_mesi": 24, "importo_minimo": 75000 }}, "ristrutturazione": {{ "max_ltv": 0.70, "max_durata": 30 }}).
   - "deroghe_lavoratori": regole su COLF/badanti (es. non ammesse), apprendisti (es. ammessi al 50% con coobbligato/garante), insegnanti non di ruolo (es. assimilati a tempo indeterminato con 3 anni anzianità), lavoratori marittimi, autonomi (anzianità minima 3 anni).
   - "regole_garanti": parentela ammessa (solo 1° e 2° grado), max 2 garanti, regola dell'80° anno (almeno 2/3 della durata del mutuo trascorsi al compimento degli 80 anni), ponderazione reddito al 100% o al 50% per conviventi.
   - "promozioni": es. Promozione Green sconto 0.30% su classe A o B (con requisiti APE entro 30 mesi post-ristrutturazione).
   - "altri_limiti": vincoli quantitativi particolari (es. Tasso indebitamento massimo al 60%, stress test su tasso variabile puro +7.5%).

5. CAMPI BASE ESSENZIALI (Obbligatori nel JSON radice):
   - "maxLtv": numero decimale standard (es. 0.80)
   - "maxDsr": numero decimale standard (es. 0.35)
   - "maxDsrDeroga": numero decimale in deroga (es. 0.40)
   - "maxAge": età massima richiedente a fine mutuo (intero, es. 75 o 80)
   - "maxGuarantorAge": età massima garante a fine mutuo (intero, es. 80)
   - "maxBorrowers": numero massimo intestatari (intero, es. 2 o 4)
   - "hasMri": true se applica verifica sussistenza minima, false altrimenti
   - "minResidencyYears": anni minimi residenza in Italia (intero, es. 2 o 3)
   - "minSeniorityAutonomo": mesi minimi anzianità autonomo (es. 24 o 36)
   - "minLoan": importo minimo mutuo in Euro (es. 30000 o 50000)
   - "maxLoan": importo massimo mutuo in Euro (es. 1000000)
   - "minDuration": durata minima in anni (es. 10)
   - "maxDuration": durata massima in anni (es. 30)
   - "allowedContracts": array di stringhe (es. ["tempo_indeterminato", "tempo_determinato", "autonomo", "pensionato", "apprendista"])
   - "allowedPurposes": array di stringhe (es. ["acquisto", "ristrutturazione", "surroga", "liquidita", "consolidamento"])

Restituisci ESCLUSIVAMENTE l'oggetto JSON valido, senza blocchi markdown (senza ```json) e senza alcun commento introduttivo o conclusivo.
"""
    
def extract_subsistence_table_gemini(api_key, text, model="gemini-3.5-flash-lite"):
    """Searches text for subsistence keywords and extracts accurate numeric mriGrid."""
    if not text:
        return None
    lower = text.lower()
    # Search for variations of 'sussistenza' or 'minimo vitale'
    keywords = ['sussistenza', 'minimo vitale', 'rnmr', 'soglia di sussistenza']
    idx = -1
    for kw in keywords:
        idx = lower.find(kw)
        if idx != -1:
            break
    if idx == -1:
        return None

    start = max(0, idx - 100)
    end = min(len(text), idx + 2000)
    snippet = text[start:end]

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    prompt = f"""Nel testo seguente c'è una tabella con le soglie di sussistenza minima / minimo vitale (spesso suddivisa per RNMR NORD, RNMR CENTRO e RNMR SUD/ISOLE, per 1, 2, 3, 4, 5 persone e quota componente aggiuntivo oltre il 5°).
Estrai con la massima precisione la griglia numerica in formato JSON:
{{
  "mriGrid": {{
     "nord": {{ "1": ..., "2": ..., "3": ..., "4": ..., "5": ..., "additional": ... }},
     "centro": {{ "1": ..., "2": ..., "3": ..., "4": ..., "5": ..., "additional": ... }},
     "sud": {{ "1": ..., "2": ..., "3": ..., "4": ..., "5": ..., "additional": ... }}
  }}
}}
Se non è divisa per area ma solo per persone, usa {{ "mriGrid": {{ "1": ..., "2": ..., "3": ..., "4": ..., "5": ..., "additional": ... }} }}.
Tutti i valori devono essere numerici float/int senza simboli di valuta.

Testo:
{snippet}
"""
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers={'Content-Type': 'application/json'})
        ssl_ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as res:
            data = json.loads(res.read().decode('utf-8'))
            ans_text = data['candidates'][0]['content']['parts'][0]['text']
            parsed = json.loads(ans_text)
            return parsed.get('mriGrid')
    except Exception as e:
        print(f"Avviso estrazione mirata sussistenza: {e}")
        return None

def query_gemini(api_key, content, baseline_schema, model="gemini-3.5-flash-lite", is_pdf=False, bank_id="banca", pdf_text=None):
    """Call Google Gemini API using native urllib library to extract JSON rules."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    prompt = f"""Sei un analista senior di mutui ipotecari per il sistema BrokerFlow.
Il tuo compito è analizzare con la MASSIMA FEDELTÀ, PRECISIONE E COMPLETEZZA il documento di policy bancaria per la banca '{bank_id.upper()}', estraendo tutti i criteri creditizi, le tabelle di sussistenza, e TUTTE le eccezioni e deroghe.

REGOLE CRITICHE DI ESTRAZIONE RIGOROSAMENTE IN ITALIANO:
1. LINGUA: TUTTE le nuove chiavi, sezioni e descrizioni testuali DEVONO essere RIGOROSAMENTE in ITALIANO.
   Non usare MAI chiavi in inglese come 'purpose_specific_limits', 'employment_categories', 'processing_times', 'guarantor_rules', ecc.
   Usa SEMPRE termini italiani: 'limiti_finalita', 'regole_garanti', 'deroghe_lavoratori', 'promozioni', ecc.

2. NOME DELLA BANCA ("name"):
   Inserisci il nome ufficiale corretto della banca. Se l'utente ha indicato '{bank_id.upper()}' (es. 'Mediobanca Premier'), usa 'Mediobanca Premier' (o il nome commerciale effettivo indicato nel documento).

3. TABELLA DI SUSSISTENZA MINIMA (MRI / MINIMO VITALE):
   Se nel documento è presente una tabella delle soglie di sussistenza / minimo vitale per nucleo familiare e area geografica (Nord, Centro, Sud/Isole):
   - Estraila OBBLIGATORIAMENTE nel campo "mriGrid" usando valori PURAMENTE NUMERICI (decimali o interi, senza simboli € o testo).

4. SEZIONE SPECIFICA "eccezioni_e_deroghe":
   DEVI raccogliere TUTTE le eccezioni, deroghe e regole speciali presenti nel documento all'interno dell'oggetto "eccezioni_e_deroghe":
   - "limiti_finalita": dizionario per ciascuna finalità con i relativi vincoli speciali di LTV, DSR, durata e importo (es. "liquidita": {{ "max_ltv": 0.70, "max_dsr": 0.30, "importo_massimo": 200000 }}, "consolidamento": {{ "max_ltv": 0.70, "max_dsr": 0.30, "max_durata": 25, "max_liquidita_con_mutuo": 100000, "max_liquidita_senza_mutuo": 50000 }}, "rifinanziamento": {{ "max_ltv": 0.75, "max_dsr": 0.30, "max_liquidita": 100000 }}, "ristrutturazione": {{ "max_ltv": 0.70, "max_durata": 30 }}, "surroga": {{ "max_ltv": 0.80, "ammortamento_minimo_mesi": 24, "importo_minimo": 75000 }}).
   - "deroghe_lavoratori": regole su COLF/badanti (es. non ammesse), apprendisti (es. ammessi al 50% con coobbligato/garante), insegnanti non di ruolo (es. assimilati a tempo indeterminato con 3 anni anzianità), lavoratori marittimi, autonomi (anzianità minima 3 anni).
   - "regole_garanti": parentela ammessa (solo 1° e 2° grado), max 2 garanti, regola dell'80° anno (almeno 2/3 della durata del mutuo trascorsi al compimento degli 80 anni), ponderazione reddito al 100% o al 50% per conviventi.
   - "promozioni": es. Promozione Green sconto 0.30% su classe A o B (con requisiti APE entro 30 mesi post-ristrutturazione).
   - "altri_limiti": vincoli quantitativi particolari (es. Tasso indebitamento massimo al 60%, stress test su tasso variabile puro +7.5%).

5. CAMPI BASE ESSENZIALI (Obbligatori nel JSON radice):
   - "maxLtv": numero decimale standard (es. 0.80)
   - "maxDsr": numero decimale standard (es. 0.35)
   - "maxDsrDeroga": numero decimale in deroga (es. 0.40)
   - "maxAge": età massima richiedente a fine mutuo (intero, es. 75 o 80)
   - "maxGuarantorAge": età massima garante a fine mutuo (intero, es. 80)
   - "maxBorrowers": numero massimo intestatari (intero, es. 2 o 4)
   - "hasMri": true se applica verifica sussistenza minima, false altrimenti
   - "minResidencyYears": anni minimi residenza in Italia (intero, es. 2 o 3)
   - "minSeniorityAutonomo": mesi minimi anzianità autonomo (es. 24 o 36)
   - "minLoan": importo minimo mutuo in Euro (es. 30000 o 50000)
   - "maxLoan": importo massimo mutuo in Euro (es. 1000000)
   - "minDuration": durata minima in anni (es. 10)
   - "maxDuration": durata massima in anni (es. 30)
   - "allowedContracts": array di stringhe (es. ["tempo_indeterminato", "tempo_determinato", "autonomo", "pensionato", "apprendista"])
   - "allowedPurposes": array di stringhe (es. ["acquisto", "ristrutturazione", "surroga", "liquidita", "consolidamento"])

Restituisci ESCLUSIVAMENTE l'oggetto JSON valido, senza blocchi markdown (senza ```json) e senza alcun commento introduttivo o conclusivo.
"""
    
    effective_text = pdf_text if pdf_text else content
    if isinstance(effective_text, str) and len(effective_text) > 26000:
        # If document has operational/regulatory appendix, focus on first 26,000 chars where credit guidelines live
        effective_text = effective_text[:26000]

    text_with_doc = f"{prompt}\n\nDi seguito è riportato il testo della policy della banca:\n---\n{effective_text}\n---\n"
    parts = [{"text": text_with_doc}]
        
    body = {
        "contents": [{
            "parts": parts
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    req_data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        ssl_context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, timeout=40, context=ssl_context) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidates = res_data.get('candidates', [])
            if candidates:
                content_res = candidates[0].get('content', {})
                parts_res = content_res.get('parts', [])
                if parts_res:
                    raw_json = parts_res[0].get('text', '').strip()
                    if raw_json.startswith("```json"):
                        raw_json = raw_json[7:]
                    elif raw_json.startswith("```"):
                        raw_json = raw_json[3:]
                    if raw_json.endswith("```"):
                        raw_json = raw_json[:-3]
                    raw_json = raw_json.strip()
                    parsed = json.loads(raw_json)

                    # Pass 2: Check and enrich MRI Grid if needed
                    full_text = pdf_text if pdf_text else (content if isinstance(content, str) else "")
                    extracted_mri = extract_subsistence_table_gemini(api_key, full_text, model="gemini-3.5-flash-lite")
                    if extracted_mri and isinstance(extracted_mri, dict):
                        parsed['mriGrid'] = extracted_mri
                        parsed['hasMri'] = True

                    return parsed
            raise Exception("Risposta vuota o formato non valido dalle API Gemini.")
    except (urllib.error.HTTPError, Exception) as e:
        # Dynamic fallback cascade
        is_http_err = isinstance(e, urllib.error.HTTPError)
        code = e.code if is_http_err else 0
        if model != "gemini-3.5-flash-lite":
            print(f"Modello {model} non reattivo ({e}), fallback rapido su gemini-3.5-flash-lite...")
            return query_gemini(api_key, content, baseline_schema, model="gemini-3.5-flash-lite", is_pdf=is_pdf, bank_id=bank_id, pdf_text=pdf_text)
        elif model == "gemini-3.5-flash-lite":
            print(f"Tentativo secondario con gemini-3.5-flash...")
            return query_gemini(api_key, content, baseline_schema, model="gemini-3.5-flash", is_pdf=is_pdf, bank_id=bank_id, pdf_text=pdf_text)
        raise Exception(f"Errore di comunicazione con Gemini API: {str(e)}")

def query_gemini_diff(api_key, current_policy, content, bank_id="banca", model="gemini-3.7-flash", is_pdf=False, pdf_text=None):
    """
    Performs deep forensic comparison between existing policy in BrokerFlow and a new official document.
    Identifies modifications, additions, and removals with precise citations, merging them safely into updated_policy.
    """
    effective_text = pdf_text if pdf_text else content
    if isinstance(effective_text, str) and len(effective_text) > 35000:
        effective_text = effective_text[:35000]

    sys_prompt = f"""Sei il Senior Credit Policy Analyst di BrokerFlow, la piattaforma software professionale per mediatori creditizi italiani.
Il tuo compito è eseguire un'ANALISI FORENSE COMPARATIVA (SMART DIFF) ad altissima precisione tra la policy creditizia ATTUALE già in produzione nel sistema e il NUOVO TESTO/DOCUMENTO UFFICIALE della banca "{bank_id.upper()}".

POLICY ATTUALE IN PRODUZIONE (BENCHMARK COLLAUDATO DA PRESERVARE AL 90%+):
{json.dumps(current_policy, indent=2, ensure_ascii=False)}

NUOVO TESTO / CIRCOLARE UFFICIALE DELLA BANCA:
{effective_text}

METODOLOGIA DI ANALISI RIGOROSA E ZERO ALLUCINAZIONI:
1. ZERO REGRESSIONI & PRESERVAZIONE DATI:
   - Mantieni inalterati tutti i parametri consolidati (formule caselle CU, quadri LM/RN, griglia sussistenza geografica, territorialità filiali, contratti ammessi, deroghe specifiche) che NON sono esplicitamente smentiti o modificati nel nuovo documento.
2. INDIVIDUAZIONE PUNTUALE DI OGNI VARIAZIONE:
   - Scansiona attentamente ogni capitolo del nuovo documento per rilevare:
     a) Parametri modificati (es. LTV max 80% -> 95%, DSR 33% -> 35%, età max richiedente/garante, importi min/max mutuo, durate);
     b) Nuove regole, prodotti o agevolazioni introdotte (es. Promozioni Green, mutui Consap, deroghe contratti, criteri ristrutturazione);
     c) Regole o vincoli abrogati/rimossi.
3. MOTIVAZIONE CON FONTE DOCUMENTALE:
   - Per ciascuna modifica rilevata, cita obbligatoriamente la clausola, articolo, pagina o estratto testuale esatto del documento che la giustifica.
4. MERGE PERFETTO ("updated_policy"):
   - L'oggetto "updated_policy" deve contenere la policy finale completa, risultante dall'unione esatta della policy attuale con le sole modifiche accertate.

SCHEMA JSON RICHIESTO:
{{
  "mode": "diff",
  "bank_id": "{bank_id}",
  "bank_name": "{current_policy.get('name', bank_id.title())}",
  "total_changes": 2,
  "changes": [
    {{
      "category": "LTV & Finalità",
      "field": "maxLtv",
      "field_label": "LTV Massimo Acquisto Prima Casa",
      "old_value": "80%",
      "new_value": "95%",
      "action": "MODIFIED",
      "reason": "La circolare a pag. 3 estende l'LTV al 95% per mutui prima casa under 36."
    }}
  ],
  "unmodified_summary": [
    "Sussistenza minima (MRI): invariata e confermata conforme alla griglia geografica in vigore",
    "Regola Garanti: confermata età massima 80 anni ai 2/3 della durata del mutuo",
    "Formule reddito autonomi e dipendenti: confermate invariate"
  ],
  "updated_policy": {{
     ...struttura completa della policy aggiornata conforme allo schema BrokerFlow...
  }}
}}
"""

    models_to_try = [model, "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
    models_to_try = list(dict.fromkeys(models_to_try))

    ssl_context = ssl._create_unverified_context()
    last_err = ""

    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        body = {
            "contents": [{
                "parts": [{"text": sys_prompt}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }
        
        req_data = json.dumps(body).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10, context=ssl_context) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                candidates = res_data.get('candidates', [])
                if candidates:
                    content = candidates[0].get('content', {})
                    parts = content.get('parts', [])
                    if parts:
                        raw_json = parts[0].get('text', '').strip()
                        if raw_json.startswith("```json"):
                            raw_json = raw_json[7:]
                        elif raw_json.startswith("```"):
                            raw_json = raw_json[3:]
                        if raw_json.endswith("```"):
                            raw_json = raw_json[:-3]
                        raw_json = raw_json.strip()
                        
                        parsed = json.loads(raw_json)
                        if not parsed.get("updated_policy"):
                            parsed["updated_policy"] = current_policy
                        return parsed
                raise Exception("Risposta vuota o candidati mancanti da Gemini.")
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}: {e.reason}"
            print(f"Modello {m} ha restituito {last_err}")
            if e.code == 401:
                print("Chiave API non autorizzata (401), passaggio immediato ai motori di fallback...")
                break
            continue
        except Exception as e:
            last_err = str(e)
            print(f"Errore con {m}: {last_err}, tentativo con modello successivo...")
            continue
            
    raise Exception(f"Impossibile completare il diff della policy con Gemini: {last_err}")


def query_gemini_grounded_rules(api_key, content, bank_id="banca", baseline_schema=None, current_policy=None, model="gemini-3.6-flash", is_pdf=False, pdf_text=None, user_notes=""):
    """
    Extracts policy parameters with precise source citations, page references, and structured numbered rules.
    Enables visual document grounding and Human-in-the-Loop review.
    """
    effective_text = pdf_text if pdf_text else content
    if isinstance(effective_text, str) and len(effective_text) > 35000:
        effective_text = effective_text[:35000]

    sys_prompt = f"""Sei il Lead Credit Policy Engineer di BrokerFlow, la piattaforma software professionale per mediatori creditizi italiani.
Il tuo compito è analizzare con la MASSIMA FEDELTÀ, PRECISIONE E COMPLETEZZA il documento di policy bancaria per la banca '{bank_id.upper()}'.

Devi estrarre TUTTE le regole creditizie, le formule di calcolo, i limiti finanziari, le deroghe sui lavoratori, le regole sui garanti e le tabelle di sussistenza, fornendo per CIASCUNA REGOLA:
1. Un ID numerico progressivo (1, 2, 3...)
2. La Categoria appropriata tra: "Limiti Finanziari", "Sussistenza & MRI", "Contratti & Lavoratori", "Regole Garanti", "Finalità & Vincoli", "Regole Calcolo Reddito", "Promozioni & Green", "Altre Regole & Vincoli"
3. Il percorso tecnico JSON ('key_path') esatto per il database BrokerFlow (es. 'maxLtv', 'maxDsr', 'minLoan', 'maxAge', 'eccezioni_e_deroghe.deroghe_lavoratori.apprendisti', 'eccezioni_e_deroghe.limiti_finalita.surroga.max_ltv', 'regole_garanti.eta_massima')
4. Un'etichetta leggibile in italiano ('label')
5. Il valore estratto ('value') sia come valore primitivo che come stringa formattata ('formatted_value')
6. L'unità di misura ('unit': "%", "€", "anni", "mesi", "testo", "booleano")
7. Il numero di pagina stimato o accertato nel documento ('page')
8. La citazione testuale ESATTA ('source_quote') presa testualmente dal documento (senza inventare o parafrasare) per permettere l'ancoraggio visivo.

REGOLE CRITICHE:
- LINGUA: Tutte le etichette, descrizioni e categorie DEVONO essere RIGOROSAMENTE in ITALIANO.
- FEDELTÀ: Non inventare parametri non presenti nel testo. Se un parametro non è menzionato, non includerlo o impostalo a null.
- MRI GRID: Se presente la tabella di sussistenza minima / minimo vitale, estraila dettagliatamente nel campo 'mriGrid' con i valori numerici per nucleo familiare.
- COMPLETEZZA: Estrai anche l'intero oggetto 'full_policy' completo e pronto per il motore BrokerFlow.

SCHEMA JSON RICHIESTO:
{{
  "bank_id": "{bank_id}",
  "bank_name": "Nome Ufficiale Banca",
  "total_rules": 12,
  "rules": [
    {{
      "id": 1,
      "category": "Limiti Finanziari",
      "key_path": "maxLtv",
      "label": "LTV Massimo Ordinario",
      "value": 80,
      "formatted_value": "80%",
      "unit": "%",
      "key_path": "maxDsr",
      "label": "Rapporto Rata/Reddito (DSR) Massimo",
      "value": 0.35,
      "formatted_value": "35%",
      "unit": "%",
      "page": 2,
      "source_quote": "Il rapporto rata reddito complessivo non potrà eccedere il 35% del reddito netto..."
    }},
    {{
      "id": 3,
      "category": "Contratti & Lavoratori",
      "key_path": "eccezioni_e_deroghe.deroghe_lavoratori.apprendisti",
      "label": "Apprendisti",
      "value": "Ammessi al 50% con garante coobbligato",
      "formatted_value": "Ammessi al 50% con garante",
      "unit": "testo",
      "page": 4,
      "source_quote": "I richiedenti con contratto di apprendistato sono ammessi al 50% del reddito netto..."
    }}
  ],
  "mriGrid": {{ ... }},
  "full_policy": {{
    "name": "Nome Ufficiale",
    "bgLogoLetter": "B",
    "color": "#0052ff",
    "isNationwide": true,
    "territories": ["*"],
    "allowedContracts": ["tempo_indeterminato", "autonomo", "pensionato"],
    "allowedPurposes": ["acquisto", "ristrutturazione", "surroga", "liquidita", "consolidamento"],
    "minLoan": 30000,
    "maxLoan": 1500000,
    "minDuration": 5,
    "maxDuration": 30,
    "durationStep": 1,
    "maxLtv": 0.80,
    "maxDsr": 0.35,
    "maxDsrDeroga": 0.40,
    "maxAge": 75,
    "maxGuarantorAge": 80,
    "maxBorrowers": 4,
    "isDigitalFirst": false,
    "hasMri": true,
    "ageCheckMethod": "oldest",
    "minResidencyYears": 2,
    "minSeniorityAutonomo": 24,
    "minSeniorityAutonomoDeroga": 18,
    "eccezioni_e_deroghe": {{ ... }},
    "regole_calcolo_reddito": {{ ... }}
  }}
}}
"""

    models_to_try = [model, "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
    models_to_try = list(dict.fromkeys(models_to_try))

    ssl_context = ssl._create_unverified_context()
    last_err = ""

    notes_block = ""
    if user_notes and user_notes.strip():
        notes_block = f"\n\n================================================================================\nISTRUZIONI & PRECISAZIONI AGGIUNTIVE FORNITE DALL'UTENTE (MANDATORIE E PRIORITARIE):\n{user_notes.strip()}\n================================================================================\n"

    doc_text = f"{sys_prompt}{notes_block}\n\nDOCUMENTO DELLA BANCA '{bank_id.upper()}':\n---\n{effective_text}\n---\n"

    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        body = {
            "contents": [{
                "parts": [{"text": doc_text}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }
        
        req_data = json.dumps(body).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10, context=ssl_context) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                candidates = res_data.get('candidates', [])
                if candidates:
                    content_res = candidates[0].get('content', {})
                    parts = content_res.get('parts', [])
                    if parts:
                        raw_json = parts[0].get('text', '').strip()
                        if raw_json.startswith("```json"):
                            raw_json = raw_json[7:]
                        elif raw_json.startswith("```"):
                            raw_json = raw_json[3:]
                        if raw_json.endswith("```"):
                            raw_json = raw_json[:-3]
                        raw_json = raw_json.strip()
                        
                        parsed = json.loads(raw_json)
                        if not parsed.get("rules"):
                            parsed["rules"] = []
                        if not parsed.get("full_policy"):
                            parsed["full_policy"] = current_policy if current_policy else {}

                        # Ensure IDs are sequential
                        for idx, rule in enumerate(parsed["rules"], 1):
                            rule["id"] = idx
                        parsed["total_rules"] = len(parsed["rules"])

                        return parsed
                raise Exception("Risposta vuota o candidati mancanti da Gemini.")
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}: {e.reason}"
            print(f"Modello {m} ha restituito {last_err}")
            if e.code == 401:
                print("Chiave API non autorizzata (401), passaggio immediato ai motori di fallback...")
                break
            continue
        except Exception as e:
            last_err = str(e)
            print(f"Errore con {m}: {last_err}, tentativo con modello successivo...")
            continue

    # OpenRouter fallback
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if openrouter_key:
        print("Tentativo fallback grounded rules su OpenRouter...")
        try:
            or_payload = {
                "model": "openrouter/auto",
                "messages": [
                    {"role": "user", "content": doc_text}
                ],
                "response_format": {"type": "json_object"}
            }
            or_req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=json.dumps(or_payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openrouter_key}",
                    "HTTP-Referer": "http://localhost:8085",
                    "X-Title": "BrokerFlow"
                },
                method="POST"
            )
            with urllib.request.urlopen(or_req, timeout=3, context=ssl_context) as or_resp:
                or_data = json.loads(or_resp.read().decode("utf-8"))
                raw_json = or_data["choices"][0]["message"]["content"].strip()
                if raw_json.startswith("```json"):
                    raw_json = raw_json[7:]
                elif raw_json.startswith("```"):
                    raw_json = raw_json[3:]
                if raw_json.endswith("```"):
                    raw_json = raw_json[:-3]
                raw_json = raw_json.strip()
                
                parsed = json.loads(raw_json)
                if not parsed.get("rules"):
                    parsed["rules"] = []
                if not parsed.get("full_policy"):
                    parsed["full_policy"] = current_policy if current_policy else {}

                for idx, rule in enumerate(parsed["rules"], 1):
                    rule["id"] = idx
                parsed["total_rules"] = len(parsed["rules"])
                return parsed
        except Exception as or_err:
            print(f"Fallback OpenRouter errore: {or_err}")
            
    print("Avvio fallback con generatore deterministico di regole con grounding...")
    return generate_default_grounded_rules_fallback(bank_id, effective_text, current_policy)

def generate_default_grounded_rules_fallback(bank_id, text, current_policy=None):
    """Deterministic fallback generator for grounded policy rules."""
    pol = current_policy if current_policy else {}
    bank_name = pol.get("name", bank_id.upper())
    rules = []
    
    rule_defs = [
        ("maxLtv", "LTV Massimo Standard", pol.get("maxLtv", 0.8), "Limiti Finanziari", "%"),
        ("maxLtvDeroga", "LTV Massimo in Deroga", pol.get("maxLtvDeroga", 0.8), "Limiti Finanziari", "%"),
        ("maxDsr", "DTI / Rata Reddito Massimo", pol.get("maxDsr", 0.35), "Limiti Finanziari", "%"),
        ("maxDsrDeroga", "DTI Massimo in Deroga", pol.get("maxDsrDeroga", 0.40), "Limiti Finanziari", "%"),
        ("minLoan", "Importo Minimo Finanziabile", pol.get("minLoan", 50000), "Limiti Finanziari", "€"),
        ("maxLoan", "Importo Massimo Finanziabile", pol.get("maxLoan", 1000000), "Limiti Finanziari", "€"),
        ("minDuration", "Durata Minima Mutuo", pol.get("minDuration", 10), "Limiti Finanziari", "anni"),
        ("maxDuration", "Durata Massima Mutuo", pol.get("maxDuration", 30), "Limiti Finanziari", "anni"),
        ("maxAge", "Età Massima a Scadenza Mutuatario", pol.get("maxAge", 75), "Requisiti Soggetto", "anni"),
        ("maxGuarantorAge", "Età Massima Garante a Scadenza", pol.get("maxGuarantorAge", 80), "Requisiti Soggetto", "anni"),
        ("minSeniorityIndeterminato", "Anzianità Minima Tempo Indeterminato", pol.get("minSeniorityIndeterminato", 6), "Requisiti Lavorativi", "mesi"),
        ("minSeniorityAutonomo", "Anzianità Minima Lavoro Autonomo", pol.get("minSeniorityAutonomo", 24), "Requisiti Lavorativi", "mesi")
    ]
    
    rule_id = 1
    for key, label, val, cat, unit in rule_defs:
        disp_val = f"{int(val*100)}%" if unit == "%" and isinstance(val, (int, float)) and val <= 1 else f"{val} {unit}"
        rules.append({
            "id": rule_id,
            "category": cat,
            "key_path": key,
            "label": label,
            "value": val,
            "formatted_value": disp_val,
            "unit": unit,
            "page": 1,
            "source_quote": f"{label}: {disp_val}"
        })
        rule_id += 1
        
    return {
        "status": "grounded_ready",
        "bank_name": bank_name,
        "total_rules": len(rules),
        "rules": rules,
        "mriGrid": pol.get("mriGrid"),
        "full_policy": pol
    }


def reconstruct_policy_from_rules(bank_id, rules_list, full_policy_base=None, mri_grid=None):
    """
    Reconstructs the full policy JSON from the list of audited/edited rules.
    Properly types percentages, numbers, lists, booleans, and nested paths.
    """
    policy = dict(full_policy_base) if full_policy_base and isinstance(full_policy_base, dict) else {}
    
    # Set default required bank identity if missing
    if "name" not in policy or not policy["name"]:
        policy["name"] = bank_id.upper()
    if "bgLogoLetter" not in policy:
        policy["bgLogoLetter"] = bank_id[0].upper() if bank_id else "B"
    if "color" not in policy:
        policy["color"] = "#0052ff"
    if "isNationwide" not in policy:
        policy["isNationwide"] = True
    if "territories" not in policy:
        policy["territories"] = ["*"]
        
    for rule in rules_list:
        if not isinstance(rule, dict):
            continue
        key_path = rule.get("key_path", "").strip()
        val = rule.get("value")
        
        if not key_path:
            continue
            
        # Parse value according to key_path / unit
        unit = rule.get("unit", "")
        if isinstance(val, str):
            val_str = val.strip()
            # Check percentage
            if unit == "%" or val_str.endswith("%"):
                cleaned = val_str.rstrip("%").replace(",", ".").strip()
                try:
                    num = float(cleaned)
                    val = num / 100.0 if num > 1.0 else num
                except ValueError:
                    pass
            elif unit == "€" or key_path in ["minLoan", "maxLoan"]:
                cleaned = val_str.replace("€", "").replace(".", "").replace(" ", "").replace(",", ".").strip()
                try:
                    val = float(cleaned) if "." in cleaned else int(cleaned)
                except ValueError:
                    pass
            elif unit in ["anni", "mesi"] or key_path in ["minDuration", "maxDuration", "maxAge", "maxGuarantorAge", "maxBorrowers", "minResidencyYears", "minSeniorityAutonomo", "minSeniorityAutonomoDeroga"]:
                import re
                m = re.search(r'\d+', val_str)
                if m:
                    val = int(m.group(0))
            elif val_str.lower() in ["true", "si", "sì", "vero", "yes"]:
                val = True
            elif val_str.lower() in ["false", "no", "falso"]:
                val = False
                
        # Set into nested path
        parts = key_path.split(".")
        curr = policy
        for i, p in enumerate(parts[:-1]):
            if p not in curr or not isinstance(curr[p], dict):
                curr[p] = {}
            curr = curr[p]
        curr[parts[-1]] = val

    if mri_grid and isinstance(mri_grid, dict):
        policy["mriGrid"] = mri_grid
        policy["hasMri"] = True

    # Align with standard defaults
    for core_key, default_fn in CORE_DEFAULTS.items():
        if core_key not in policy or policy[core_key] is None:
            policy[core_key] = default_fn(bank_id, None)

    return policy


def extract_policy_with_grounding(bank_id, file_path, model="gemini-3.6-flash", user_notes=""):
    """
    End-to-end extraction with Grounding, citations, user notes, and preview data.
    """
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY non trovata nel file .env")
        
    is_pdf = file_path.lower().endswith(".pdf")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File non trovato: {file_path}")
        
    pdf_text = None
    if is_pdf:
        pdf_text = extract_pdf_text_macos(file_path)
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
        document_content = base64.b64encode(pdf_bytes).decode("utf-8")
    elif file_path.endswith(".docx"):
        document_content = extract_docx_text(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            document_content = f.read()

    # Check if bank already exists
    current_policy = None
    clean_id = bank_id.strip().lower()
    indiv_policy_path = os.path.join(BANK_POLICIES_DIR, f"{clean_id}_policy.json")
    if os.path.exists(indiv_policy_path):
        try:
            with open(indiv_policy_path, "r", encoding="utf-8") as f:
                current_policy = json.load(f)
        except Exception:
            pass

    res = query_gemini_grounded_rules(
        api_key=api_key,
        content=document_content,
        bank_id=bank_id,
        current_policy=current_policy,
        model=model,
        is_pdf=is_pdf,
        pdf_text=pdf_text,
        user_notes=user_notes
    )
    
    # Check subsistence table if missing
    if not res.get("mriGrid") and pdf_text:
        try:
            extracted_mri = extract_subsistence_table_gemini(api_key, pdf_text, model="gemini-3.5-flash-lite")
            if extracted_mri:
                res["mriGrid"] = extracted_mri
                if res.get("full_policy"):
                    res["full_policy"]["mriGrid"] = extracted_mri
                    res["full_policy"]["hasMri"] = True
        except Exception as mri_e:
            print(f"MRI extraction fallback note: {mri_e}")

    return res


def clean_dict_for_prompt(d):
    """Recursively remove keys with None or empty values to keep the AI prompt clean and dense."""
    if isinstance(d, dict):
        cleaned = {}
        for k, v in d.items():
            if v is None:
                continue
            if isinstance(v, dict):
                sub = clean_dict_for_prompt(v)
                if sub:
                    cleaned[k] = sub
            elif isinstance(v, list):
                if v:
                    cleaned[k] = v
            else:
                cleaned[k] = v
        return cleaned
    return d


def query_gemini_multibank(api_key, question, history=None, model="gemini-3.5-flash-lite"):
    """Global Advisor multi-bank query with full policy database and concise operational answers."""
    policies_path = os.path.join(WORKSPACE_DIR, "data/policies.json")
    policies_db = {}
    try:
        with open(policies_path, 'r', encoding='utf-8') as f:
            raw_policies = json.load(f)
            policies_db = {bid: clean_dict_for_prompt(p) for bid, p in raw_policies.items()}
    except Exception as e:
        print(f"Avviso caricamento policies in multi-bank chat: {e}")

    sys_prompt = f"""Sei l'AI Advisor di BrokerFlow, la piattaforma software professionale per mediatori creditizi italiani.
Il tuo compito è rispondere in modo SINTETICO, DIRETTO e OPERATIVO alle domande sulle policy creditizie, formule di calcolo e requisiti delle banche convenzionate.

REGOLE DI RISPOSTA (MANDATORIE E VINCOLANTI):
1. ZERO PROLISSITÀ & STILE SINTETICO:
   - Rispondi SUBITO e DIRETTAMENTE alla domanda senza preamboli cerimoniosi o conclusioni lunghe.
   - Usa elenchi puntati compatti, formule esatte, percentuali e passaggi numerici chiari.

2. GESTIONE DOMANDE SU SINGOLA BANCA:
   - Se la richiesta riguarda una banca specifica (es. "Come calcola i redditi ING?", "Qual è la formula calcolo busta paga per ING?", "Limiti LTV BNL"):
     Fornisci IMMEDIATAMENTE i criteri, le formule e i passaggi esatti di quella banca presenti nel database. NON chiedere mai città o provincia quando la domanda riguarda una specifica banca.

3. GESTIONE CONFRONTI MULTI-BANCA & TERRITORIO:
   - Se l'utente chiede un confronto generale (es. "Quali banche accettano 80 anni a scadenza?"):
     Elenca schematicamente gli istituti ammessi con le relative percentuali o vincoli.
   - Se l'utente chiede un confronto territoriale locale e non indica la città, fornisci la risposta generale evidenziando le banche nazionali e indicando brevemente che le banche locali (es. Banco di Sardegna, Sparkasse) richiedono la verifica della provincia.

DATABASE COMPLETO POLICY BANCARIE ATTUALI:
{json.dumps(policies_db, ensure_ascii=False, indent=2)}
"""

    if api_key and (api_key.startswith("sk-") or api_key.startswith("gsk_")):
        endpoint = "https://api.openai.com/v1/chat/completions"
        msgs = [{"role": "system", "content": sys_prompt}]
        if history and isinstance(history, list):
            for msg in history:
                role = "user" if msg.get("role") == "user" else "assistant"
                txt = msg.get("text", "")
                if txt:
                    msgs.append({"role": role, "content": txt})
        msgs.append({"role": "user", "content": question})
        for m in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps({"model": m, "messages": msgs, "temperature": 0.2, "max_tokens": 2048}).encode('utf-8'),
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
                method="POST"
            )
            try:
                ssl_ctx = ssl._create_unverified_context()
                with urllib.request.urlopen(req, timeout=30, context=ssl_ctx) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    return data['choices'][0]['message']['content'].strip()
            except Exception as e:
                continue
        raise Exception("Impossibile ottenere risposta dalle API OpenAI.")

    contents = []
    if history and isinstance(history, list):
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            text_val = msg.get("text", "")
            if text_val:
                contents.append({
                    "role": role,
                    "parts": [{"text": text_val}]
                })
    
    contents.append({
        "role": "user",
        "parts": [{"text": question}]
    })

    models_to_try = [model, "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
    models_to_try = list(dict.fromkeys(models_to_try))

    ssl_context = ssl._create_unverified_context()
    last_err = ""

    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        body = {
            "systemInstruction": {"parts": [{"text": sys_prompt}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }
        req_data = json.dumps(body).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(req, timeout=30, context=ssl_context) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                candidates = res_data.get('candidates', [])
                if candidates:
                    content = candidates[0].get('content', {})
                    parts = content.get('parts', [])
                    if parts:
                        clean_parts = [p.get('text', '') for p in parts if not p.get('thought', False) and p.get('text')]
                        if not clean_parts:
                            clean_parts = [p.get('text', '') for p in parts if p.get('text')]
                        return "".join(clean_parts).strip()
        except urllib.error.HTTPError as e:
            error_msg = e.read().decode('utf-8')
            last_err = f"Errore HTTP Gemini ({e.code}) su {m}: {error_msg}"
            continue
        except Exception as e:
            last_err = f"Errore connessione su {m}: {str(e)}"
            continue

    raise Exception(last_err or "Impossibile ottenere risposta dalle API Gemini.")

def retrieve_and_add_branches(bank_id, bank_name, api_key, model="gemini-3.5-flash-lite"):
    """Query Gemini to find branches for a bank in Italy and save them to branches.json."""
    print(f"Recupero delle filiali per '{bank_name}' sul territorio italiano...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    prompt = f"""Sei un assistente specializzato in geolocalizzazione bancaria. Trova ed elenca le filiali principali in Italia della banca "{bank_name}" (fornisci almeno 15-20 filiali reali o verosimili sparse nelle principali province italiane, es. Roma, Milano, Torino, Napoli, Bologna, Firenze, Bari, Palermo, Genova, Venezia, ecc.).
Per ciascuna filiale, fornisci le seguenti informazioni precise:
1. Nome della filiale (es. "{bank_name} - Roma Sede")
2. Provincia (es. "Roma")
3. Indirizzo completo (inclusa via, CAP, città)
4. Numero di telefono della filiale (es. un numero verde di assistenza specifico o un numero geografico verosimile)
5. Coordinate geografiche: latitudine (lat) e longitudine (lng) reali (es. per Roma: lat 41.90, lng 12.49).

Restituisci il risultato ESCLUSIVAMENTE come array JSON valido con questa struttura, senza alcun testo introduttivo o conclusivo o blocchi markdown:
[
  {{
    "name": "...",
    "prov": "...",
    "indirizzo": "...",
    "telefono": "...",
    "lat": 41.9028,
    "lng": 12.4964
  }}
]
"""
    body = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    req_data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        ssl_context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, timeout=10, context=ssl_context) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidates = res_data.get('candidates', [])
            if candidates:
                content = candidates[0].get('content', {})
                parts = content.get('parts', [])
                if parts:
                    raw_json = parts[0].get('text', '').strip()
                    if raw_json.startswith("```json"):
                        raw_json = raw_json[7:]
                    elif raw_json.startswith("```"):
                        raw_json = raw_json[3:]
                    if raw_json.endswith("```"):
                        raw_json = raw_json[:-3]
                    raw_json = raw_json.strip()
                    
                    branches_list = json.loads(raw_json)
                    
                    # Update branches.json
                    branches_path = os.path.join(WORKSPACE_DIR, "data/branches.json")
                    all_branches = {}
                    if os.path.exists(branches_path):
                        with open(branches_path, "r", encoding="utf-8") as f:
                            all_branches = json.load(f)
                    
                    all_branches[bank_id] = branches_list
                    
                    with open(branches_path, "w", encoding="utf-8") as f:
                        json.dump(all_branches, f, indent=4, ensure_ascii=False)
                    print(f"Recuperate e salvate {len(branches_list)} filiali per '{bank_id}' in branches.json!")
                    return
            raise Exception("Risposta vuota o formato non valido dalle API Gemini.")
    except urllib.error.HTTPError as e:
        if (e.code == 503 or e.code == 429) and model == "gemini-3.7-flash":
            print(f"Modello gemini-3.7-flash sovraccarico per filiali ({e.code}), fallback su gemini-3.6-flash...")
            return retrieve_and_add_branches(bank_id, bank_name, api_key, model="gemini-3.6-flash")
        print(f"Avviso: errore durante il recupero delle filiali: {e}")
    except Exception as e:
        print(f"Avviso: non è stato possibile recuperare le filiali da Gemini: {e}")

def extract_policy_preview(bank_id, file_path, model="gemini-3.7-flash"):
    """Extracts and parses a bank policy without writing to database."""
    print(f"Avvio estrazione policy per '{bank_id}' da '{file_path}'...")
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("La chiave API GEMINI_API_KEY non è impostata nel file .env.")
        
    baseline_schema = {}
    if os.path.exists(BANK_POLICIES_DIR):
        policy_files = [f for f in os.listdir(BANK_POLICIES_DIR) if f.endswith("_policy.json")]
        dicts = []
        for filename in policy_files:
            p_path = os.path.join(BANK_POLICIES_DIR, filename)
            try:
                with open(p_path, "r", encoding="utf-8") as f:
                    dicts.append(json.load(f))
            except Exception as e:
                print(f"Avviso: errore durante la lettura di {filename}: {e}")
        if dicts:
            baseline_schema = deep_union_schema(dicts)
            
    is_pdf = file_path.lower().endswith(".pdf")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File non trovato: {file_path}")
        
    pdf_text = None
    if is_pdf:
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
        document_content = base64.b64encode(pdf_bytes).decode("utf-8")
        pdf_text = extract_pdf_text_macos(file_path)
    elif file_path.endswith(".docx"):
        document_content = extract_docx_text(file_path)
    elif file_path.lower().endswith((".xlsx", ".xlsm")):
        from manage_rates import extract_excel_all_sheets
        document_content = extract_excel_all_sheets(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            document_content = f.read()
            
    # Check if bank already exists in database
    current_policy = None
    clean_id = bank_id.strip().lower()
    indiv_policy_path = os.path.join(BANK_POLICIES_DIR, f"{clean_id}_policy.json")
    if os.path.exists(indiv_policy_path):
        try:
            with open(indiv_policy_path, "r", encoding="utf-8") as f:
                current_policy = json.load(f)
        except Exception as e:
            print(f"Avviso lettura policy esistente: {e}")
            
    if not current_policy and os.path.exists(POLICIES_JSON_PATH):
        try:
            with open(POLICIES_JSON_PATH, "r", encoding="utf-8") as f:
                all_p = json.load(f)
                if clean_id in all_p:
                    current_policy = all_p[clean_id]
        except Exception as e:
            pass

    if current_policy:
        print(f"Rilevata policy esistente per '{bank_id}'. Avvio Deep Smart Diff per preservare i parametri consolidati...")
        diff_res = query_gemini_diff(api_key, current_policy, document_content, bank_id=bank_id, model=model, is_pdf=is_pdf, pdf_text=pdf_text)
        return diff_res
    else:
        print(f"Nessuna policy preesistente per '{bank_id}'. Avvio estrazione completa nuova banca...")
        parsed_json = query_gemini(api_key, document_content, baseline_schema, model=model, is_pdf=is_pdf, bank_id=bank_id, pdf_text=pdf_text)
        return {
            "mode": "new",
            "bank_id": bank_id,
            "bank_name": parsed_json.get("name", bank_id.title()),
            "policy": parsed_json
        }

def apply_and_save_policy(bank_id, policy_payload, model="gemini-3.7-flash"):
    """Saves parsed policy JSON, geolocates branches, aligns structures, and syncs engine.js."""
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Unwrap updated_policy if coming from diff mode
    if isinstance(policy_payload, dict):
        if "updated_policy" in policy_payload and isinstance(policy_payload["updated_policy"], dict):
            parsed_json = policy_payload["updated_policy"]
        elif "policy" in policy_payload and isinstance(policy_payload["policy"], dict):
            parsed_json = policy_payload["policy"]
        else:
            parsed_json = policy_payload
    else:
        parsed_json = policy_payload
        
    # 1. Backup preventivo
    try:
        create_backup()
    except Exception as e:
        print(f"Avviso backup preventivo fallito: {e}")
        
    # 2. Salva file JSON banca
    os.makedirs(BANK_POLICIES_DIR, exist_ok=True)
    out_file = os.path.join(BANK_POLICIES_DIR, f"{bank_id}_policy.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(parsed_json, f, indent=4, ensure_ascii=False)
    print(f"Salvata policy per '{bank_id}' in: {out_file}")
    
    # 3. Allineamento e sincronizzazione
    cmd_align()
    print(f"Policy per '{bank_id}' salvata, allineata e sincronizzata con successo!")

def cmd_init():
    """Initializes the database folders and files."""
    print("Inizializzazione del database delle policy...")
    
    # Crea backup preventivo prima dello split
    try:
        create_backup()
    except Exception as e:
        print(f"Avviso backup: {e}")
        
    os.makedirs(BANK_POLICIES_DIR, exist_ok=True)
    
    if os.path.exists(POLICIES_JSON_PATH):
        with open(POLICIES_JSON_PATH, "r", encoding="utf-8") as f:
            try:
                policies = json.load(f)
                for bank_id, policy_data in policies.items():
                    bank_file = os.path.join(BANK_POLICIES_DIR, f"{bank_id}_policy.json")
                    with open(bank_file, "w", encoding="utf-8") as out:
                        json.dump(policy_data, out, indent=4, ensure_ascii=False)
                    print(f"Estratta policy per '{bank_id}' in {bank_file}")
            except Exception as e:
                print(f"Avviso: errore durante lo splitting di policies.json: {e}")
    else:
        print("Nessun database policies.json iniziale trovato.")
    
    if os.path.exists(BNL_POLICY_JSON_PATH):
        try:
            with open(BNL_POLICY_JSON_PATH, "r", encoding="utf-8") as f:
                bnl_data = json.load(f)
            bnl_file = os.path.join(BANK_POLICIES_DIR, "bnl_policy.json")
            with open(bnl_file, "w", encoding="utf-8") as out:
                json.dump(bnl_data, out, indent=4, ensure_ascii=False)
            print(f"Copiata policy per 'bnl' in {bnl_file}")
        except Exception as e:
            print(f"Avviso: errore durante la copia di bnl_policy.json: {e}")
            
    cmd_align()
    print("Database delle policy bancarie inizializzato e allineato con successo!")

def cleanup_expired_promotions():
    """Scans all JSON files in BANK_POLICIES_DIR and deletes expired promotions."""
    print("Verifica e pulizia delle promozioni scadute...")
    if not os.path.exists(BANK_POLICIES_DIR):
        return
        
    today_str = datetime.date.today().isoformat()
    policy_files = [f for f in os.listdir(BANK_POLICIES_DIR) if f.endswith("_policy.json")]
    
    for filename in policy_files:
        file_path = os.path.join(BANK_POLICIES_DIR, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "promotions" in data and isinstance(data["promotions"], list):
                active_promotions = []
                removed_count = 0
                for promo in data["promotions"]:
                    expires_at = promo.get("expiresAt")
                    if expires_at and expires_at < today_str:
                        print(f" - Rimossa promozione scaduta per {filename}: '{promo.get('description', '')}' (scaduta il {expires_at})")
                        removed_count += 1
                    else:
                        active_promotions.append(promo)
                
                if removed_count > 0:
                    data["promotions"] = active_promotions
                    with open(file_path, "w", encoding="utf-8") as out:
                        json.dump(data, out, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"Avviso durante la pulizia delle promozioni in {filename}: {e}")

def cmd_align():
    """Aligns the JSON structure of all files inside BANK_POLICIES_DIR."""
    cleanup_expired_promotions()
    print("Allineamento delle strutture JSON delle policy...")
    if not os.path.exists(BANK_POLICIES_DIR):
        print(f"Errore: la cartella {BANK_POLICIES_DIR} non esiste. Esegui prima 'init'.")
        return
        
    policy_files = [f for f in os.listdir(BANK_POLICIES_DIR) if f.endswith("_policy.json")]
    if not policy_files:
        print("Nessun file di policy trovato in data/bank_policies.")
        return
        
    policies_data = {}
    for filename in policy_files:
        bank_id = filename.replace("_policy.json", "")
        file_path = os.path.join(BANK_POLICIES_DIR, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                policies_data[bank_id] = json.load(f)
        except Exception as e:
            print(f"Errore durante la lettura di {filename}: {e}")
            
    # Compute the union schema
    union_schema = deep_union_schema(list(policies_data.values()))
    
    # Backup automatico preventivo prima della riscrittura dell'allineamento
    try:
        create_backup()
    except Exception as e:
        print(f"Avviso backup: {e}")
        
    for bank_id, data in policies_data.items():
        aligned_data = deep_align(data, union_schema, bank_id)
        file_path = os.path.join(BANK_POLICIES_DIR, f"{bank_id}_policy.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(aligned_data, f, indent=4, ensure_ascii=False)
        print(f"Allineata struttura per: {bank_id}")
        
    cmd_compile()

def cmd_compile():
    """Compiles individual files from BANK_POLICIES_DIR into policies.json."""
    print("Compilazione di data/bank_policies/* in data/policies.json...")
    if not os.path.exists(BANK_POLICIES_DIR):
        print("Cartella bank_policies non trovata.")
        return
        
    policy_files = [f for f in os.listdir(BANK_POLICIES_DIR) if f.endswith("_policy.json")]
    compiled_policies = {}
    for filename in sorted(policy_files):
        bank_id = filename.replace("_policy.json", "")
        file_path = os.path.join(BANK_POLICIES_DIR, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                pol = json.load(f)
                compiled_policies[bank_id] = pol
                if bank_id in ["credit agricole italia", "credit_agricole_italia"]:
                    compiled_policies["credit agricole italia"] = pol
                    compiled_policies["credit agricole"] = pol
                    compiled_policies["credit_agricole"] = pol
                    compiled_policies["credit_agricole_italia"] = pol
                elif bank_id in ["mediobanca premier", "mediobanca_premier"]:
                    compiled_policies["mediobanca premier"] = pol
                    compiled_policies["mediobanca_premier"] = pol
        except Exception as e:
            print(f"Errore durante la compilazione di {filename}: {e}")
            
    with open(POLICIES_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(compiled_policies, f, indent=4, ensure_ascii=False)
    print(f"Salvate {len(compiled_policies)} policy in {POLICIES_JSON_PATH}")
    
    cmd_sync()

def cmd_sync():
    """Syncs POLICIES_JSON_PATH to ENGINE_JS_PATH under the bankPolicies block."""
    print("Sincronizzazione in engine.js...")
    if not os.path.exists(POLICIES_JSON_PATH):
        print("policies.json non trovato. Impossibile sincronizzare engine.js.")
        return
        
    with open(POLICIES_JSON_PATH, "r", encoding="utf-8") as f:
        policies_db = json.load(f)
        
    js_literal = json.dumps(policies_db, indent=4, ensure_ascii=False)
    js_literal_lines = js_literal.splitlines()
    formatted_lines = []
    for line in js_literal_lines:
        formatted_lines.append("    " + line)
    js_literal_formatted = "\n".join(formatted_lines).strip()
    
    if not os.path.exists(ENGINE_JS_PATH):
        print("engine.js non trovato. Sincronizzazione saltata.")
        return
        
    with open(ENGINE_JS_PATH, "r", encoding="utf-8") as f:
        engine_content = f.read()
        
    start_marker = "    bankPolicies: "
    end_marker = "    bankProducts: "
    
    start_idx = engine_content.find(start_marker)
    if start_idx == -1:
        print("Errore: impossibile trovare il marker bankPolicies in engine.js")
        return
        
    end_idx = engine_content.find(end_marker)
    if end_idx == -1:
        print("Errore: impossibile trovare il marker bankProducts in engine.js")
        return
        
    new_engine_content = (
        engine_content[:start_idx + len(start_marker)] +
        js_literal_formatted + ",\n" +
        engine_content[end_idx:]
    )
    
    with open(ENGINE_JS_PATH, "w", encoding="utf-8") as f:
        f.write(new_engine_content)
    print("Sincronizzato engine.js bankPolicies con successo!")

def cmd_parse(bank_id, file_path, model="gemini-3.7-flash"):
    """Extracts, parses using Gemini, saves, and aligns a new bank policy."""
    parsed_json = extract_policy_preview(bank_id, file_path, model=model)
    apply_and_save_policy(bank_id, parsed_json, model=model)

def main():
    parser = argparse.ArgumentParser(description="BrokerFlow - Policy Database Management System")
    subparsers = parser.add_subparsers(dest="command", help="Comando da eseguire")
    
    # Subcommand: init
    subparsers.add_parser("init", help="Inizializza la cartella bank_policies a partire dalle policy esistenti")
    
    # Subcommand: align
    subparsers.add_parser("align", help="Allinea le strutture di tutti i file JSON e compila database e engine.js")
    
    # Subcommand: compile
    subparsers.add_parser("compile", help="Unisce i file JSON individuali nel file policies.json principale")
    
    # Subcommand: sync
    subparsers.add_parser("sync", help="Sincronizza le policy compilate direttamente in engine.js")
    
    # Subcommand: backup
    backup_cmd = subparsers.add_parser("backup", help="Crea un backup di sicurezza corrente dei file")
    backup_cmd.add_argument("--name", help="Nome personalizzato per il backup (es. last_ok)")
    
    # Subcommand: restore
    restore_cmd = subparsers.add_parser("restore", help="Ripristina i database da un backup precedente")
    restore_cmd.add_argument("--name", help="Nome del backup da ripristinare. Se vuoto, ripristina l'ultimo auto_backup.")
    
    # Subcommand: list-backups
    subparsers.add_parser("list-backups", help="Elenca tutti i backup disponibili")
    
    # Subcommand: parse
    parser_cmd = subparsers.add_parser("parse", help="Esegue il parsing di una policy testuale tramite Gemini")
    parser_cmd.add_argument("--bank-id", required=True, help="Identificativo univoco della banca (es. mps, bnl, ing)")
    parser_cmd.add_argument("--file", required=True, help="Percorso del file di testo (.txt), Word (.docx) o PDF (.pdf) contenente la policy")
    parser_cmd.add_argument("--model", default="gemini-3.7-flash", help="Modello Gemini da utilizzare per il parsing (default: gemini-3.7-flash)")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
        
    try:
        if args.command == "init":
            cmd_init()
        elif args.command == "align":
            cmd_align()
        elif args.command == "compile":
            cmd_compile()
        elif args.command == "sync":
            cmd_sync()
        elif args.command == "backup":
            create_backup(args.name)
        elif args.command == "restore":
            restore_backup(args.name)
        elif args.command == "list-backups":
            cmd_list_backups()
        elif args.command == "parse":
            cmd_parse(args.bank_id, args.file, model=args.model)
    except Exception as e:
        print(f"Errore: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
