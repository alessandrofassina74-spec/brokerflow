import re
import http.server
from ai_layer import get_ai_service, ResponseStatus
from ai_layer.monitoring.usage_tracker import get_usage_tracker
import json
import os
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
import urllib.request
import urllib.error
import threading
import time

PORT = int(os.environ.get("PORT", 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def extract_docx_text(path):
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
        return f"[Errore durante l'estrazione del file docx: {str(e)}]"

def get_all_bank_documents_map():
    workspace = BASE_DIR
    doc_folders = [
        os.path.join(workspace, "criteri banche template"),
        os.path.join(workspace, "documenti")
    ]
    docs_map = {} # filename -> text
    for folder in doc_folders:
        if os.path.exists(folder):
            for fname in os.listdir(folder):
                if fname.endswith(".docx") and not fname.startswith("~$"):
                    path = os.path.join(folder, fname)
                    txt = extract_docx_text(path)
                    if txt and txt.strip():
                        docs_map[fname] = txt
    return docs_map

def get_bank_context(bankId):
    policies_path = os.path.join(BASE_DIR, "data", "policies.json")
    structured_rules = ""
    bank_name = bankId
    try:
        with open(policies_path, 'r', encoding='utf-8') as f:
            policies = json.load(f)
            p = policies.get(bankId)
            if not p:
                for k, v in policies.items():
                    if k in bankId.lower() or bankId.lower() in k:
                        p = v
                        break
            if p:
                bank_name = p.get('name', bankId)
                structured_rules = f"=== PARAMETRI E REGOLE STRUTTURATE DI CONVENZIONE ({bank_name}) ===\n" + json.dumps(p, ensure_ascii=False, indent=2)
    except Exception as e:
        structured_rules = f"[Errore caricamento regole strutturate: {str(e)}]\n"

    # Search all documents matching this bank dynamically
    docs_map = get_all_bank_documents_map()
    doc_texts = []
    
    b_clean = bankId.lower().replace("_", " ").replace("-", " ")
    for fname, text in docs_map.items():
        fn_clean = fname.lower().replace("_", " ").replace("-", " ")
        # Check matching
        match = False
        if b_clean in fn_clean or bank_name.lower() in fn_clean:
            match = True
        elif ("monte" in b_clean or "mps" in b_clean) and ("mps" in fn_clean or "monte" in fn_clean or "paschi" in fn_clean):
            match = True
        elif ("chebanca" in b_clean or "mediobanca" in b_clean or "premier" in b_clean) and ("chebanca" in fn_clean or "mediobanca" in fn_clean or "premier" in fn_clean):
            match = True
        elif "sardegna" in b_clean and ("sardegna" in fn_clean or "bds" in fn_clean):
            match = True
        elif "bdm" in b_clean and ("bdm" in fn_clean or "mezzogiorno" in fn_clean or "bari" in fn_clean):
            match = True
        elif "ing" in b_clean and "ing" in fn_clean:
            match = True
            
        if match:
            doc_texts.append(f"=== TESTO INTEGRALE DOCUMENTO UFFICIALE ({fname}) ===\n" + text)

    context = structured_rules + "\n\n" + "\n\n".join(doc_texts)
    return context


def local_policy_analyst(bank_id, context, question):
    q_lower = question.lower()
    policies_path = os.path.join(BASE_DIR, "data", "policies.json")
    bank_data = {}
    bank_name = bank_id
    try:
        with open(policies_path, 'r', encoding='utf-8') as f:
            policies = json.load(f)
            p = policies.get(bank_id)
            if not p:
                for k, v in policies.items():
                    if k in bank_id.lower() or bank_id.lower() in k:
                        p = v
                        break
            if p:
                bank_data = p
                bank_name = p.get('name', bank_id)
    except Exception as e:
        pass

    results = []
    
    # 1. Age / Garante
    if any(k in q_lower for k in ["eta", "età", "garante", "anni", "limite"]):
        eta_rich = bank_data.get('eta_massima_fine_mutuo') or bank_data.get('max_age', '75-80')
        eta_gar = bank_data.get('eta_massima_garante') or "80 anni ai 2/3 della durata del mutuo"
        results.append(f"• **Età massima richiedente a fine mutuo**: **{eta_rich} anni**")
        results.append(f"• **Regola Età Garante**: **{eta_gar}** (oppure max 80 anni ai 2/3 della durata del mutuo se previsto dalle disposizioni della banca)")

    # 2. LTV & Finalità
    if any(k in q_lower for k in ["ltv", "percentuale", "importo", "prima casa", "seconda casa", "consap", "acquisto", "ristrutturazione"]):
        ltv_p1 = bank_data.get('ltv_max_prima_casa', 80)
        ltv_p2 = bank_data.get('ltv_max_seconda_casa', 70)
        ltv_consap = bank_data.get('ltv_max_consap', 100 if bank_data.get('consap_active', True) else 'Non attiva')
        results.append(f"• **LTV Max Prima Casa (Standard)**: **{ltv_p1}%**")
        results.append(f"• **LTV Max Prima Casa con Garanzia Consap**: **{ltv_consap}%**")
        results.append(f"• **LTV Max Seconda Casa**: **{ltv_p2}%**")

    # 3. Durata & Tasso
    if any(k in q_lower for k in ["durata", "anni mutuo", "tasso", "fisso", "variabile"]):
        dur_max = bank_data.get('durata_massima_anni', 30)
        results.append(f"• **Durata Massima del Mutuo**: fino a **{dur_max} anni**")

    # 4. Income / Reddito / Formule
    if any(k in q_lower for k in ["reddito", "busta", "forfettario", "unico", "cud", "cu", "autonomo", "formula"]):
        regole_red = bank_data.get('regole_calcolo_reddito', {})
        results.append("• **Regole Calcolo Reddito Ufficiali**:")
        if 'autonomi' in regole_red:
            results.append(f"  - **Autonomi/Forfettario**: media ultimi 2 Modelli Unici (Quadro LM/RN) secondo le direttive {bank_name}.")
        if 'dipendenti' in regole_red:
            results.append("  - **Dipendenti**: Certificazione Unica (Punto 1+2 al netto delle ritenute e addizionali) o media delle ultime 3 buste paga.")

    # 5. Search relevant excerpts from official text documents
    doc_map = get_all_bank_documents_map()
    doc_matches = []
    b_clean = bank_id.lower().replace("_", " ").replace("-", " ")
    
    q_words = [w for w in re.findall(r'\w+', q_lower) if len(w) > 3 and w not in ["della", "delle", "degli", "quale", "quali", "come", "cosa", "sono", "banca", "mutuo"]]
    
    for fname, text in doc_map.items():
        fn_clean = fname.lower().replace("_", " ").replace("-", " ")
        if b_clean in fn_clean or bank_name.lower() in fn_clean:
            paragraphs = text.split('\n')
            for p in paragraphs:
                p_str = p.strip()
                if len(p_str) > 30:
                    score = sum(1 for w in q_words if w in p_str.lower())
                    if score > 0:
                        doc_matches.append((score, p_str))

    doc_matches.sort(key=lambda x: x[0], reverse=True)
    if doc_matches:
        results.append("\n**Estratti dai Documenti Ufficiali di Convenzione:**")
        for score, match_text in doc_matches[:3]:
            results.append(f'> "{match_text}"')

    if not results:
        # Generic summary of bank
        results.append(f"### Parametri di Policy Ufficiali ({bank_name})")
        results.append(f"• **LTV Prima Casa**: **{bank_data.get('ltv_max_prima_casa', 80)}%**")
        results.append(f"• **LTV Seconda Casa**: **{bank_data.get('ltv_max_seconda_casa', 70)}%**")
        results.append(f"• **Età massima richiedente**: **{bank_data.get('eta_massima_fine_mutuo', 75)} anni**")
        results.append(f"• **Durata Massima**: **{bank_data.get('durata_massima_anni', 30)} anni**")
        results.append(f"• **Consap Attiva**: **{'Sì (fino al 100%)' if bank_data.get('consap_active') else 'No'}**")

    return "\n".join(results)

def local_multibank_analyst(question):
    q_lower = question.lower()
    policies_path = os.path.join(BASE_DIR, "data", "policies.json")
    all_policies = {}
    try:
        with open(policies_path, 'r', encoding='utf-8') as f:
            all_policies = json.load(f)
    except:
        pass

    results = []
    results.append("### 🏛️ Analisi Comparativa Multi-Banca")

    # Garante rule check
    if any(k in q_lower for k in ["garante", "eta garante", "età garante"]):
        results.append("\n**Regole Età Garante per Banca:**")
        results.append("• **Regola Standard (ING, MPS, Mediobanca Premier, BDM, BPER)**: Massimo **80 ANNI AI 2/3 DELLA DURATA DEL MUTUO** (es. su 30 anni, il garante deve avere max 80 anni al 20° anno, quindi max 60 anni alla stipula se applicata in forma rigida, oppure 80 anni a fine mutuo a seconda della deroga).")
        results.append("• **Intesa Sanpaolo / Crédit Agricole**: Valutazione fino a 75-80 anni a fine piano.")

    # LTV 100% / 95% / 90%
    if any(k in q_lower for k in ["100", "95", "90", "ltv", "senza consap", "consap", "giovani"]):
        results.append("\n**Classifica LTV Senza Consap (Prima Casa):**")
        results.append("• **ING Bank**: fino al **95% LTV** senza Consap (max 30 anni).")
        results.append("• **Monte dei Paschi di Siena (MPS)**: fino al **90% LTV** senza Consap (durata fino a **40 anni**).")
        results.append("• **Banco BPM / BPER / Crédit Agricole / Intesa**: **80% LTV** standard (fino al 100% con Fondo Garanzia Consap).")

    # Autonomi / 2 Modelli Unici
    if any(k in q_lower for k in ["autonomo", "forfettario", "p.iva", "unico"]):
        results.append("\n**Regole Lavoratori Autonomi e Partita IVA:**")
        results.append("• **Tutte le Banche Convenzionate**: Richiedono la media degli **ultimi 2 Modelli Unici** (Unico 2026 e Unico 2025) per stabilire la capacità reddituale.")
        results.append("• **Mediobanca Premier**: Anzianità P.IVA richiesta 36 mesi (ammessa deroga da 18 mesi con adeguata redditività).")
        results.append("• **ING Bank**: Calcolo su imponibile RN4 senza detrazione acconto RV17 per Ordinario, e Quadro LM con flat tax per Forfettario.")

    if len(results) == 1:
        results.append("\n**Istituti Convenzionati nel Sistema:**")
        for b_id, p in list(all_policies.items())[:8]:
            b_name = p.get('name', b_id)
            ltv = p.get('ltv_max_prima_casa', 80)
            dur = p.get('durata_massima_anni', 30)
            results.append(f"• **{b_name}**: LTV Prima Casa {ltv}%, Durata max {dur} anni, Consap {'Attiva' if p.get('consap_active') else 'Non attiva'}")

    return "\n".join(results)


def query_gemini(api_key, context, question, bank_id=None):
    """Delegate to AI Layer."""
    ai_service = get_ai_service()
    api_key_override = api_key if (api_key and not api_key.startswith("AQ.") and api_key.strip().lower() not in ("null", "undefined")) else None
    res = ai_service.ask_policy(
        bank_id=bank_id or "banca",
        question=question,
        context=context,
        api_key_override=api_key_override
    )
    if res.status == ResponseStatus.ERROR or (res.error and not res.answer):
        raise Exception(res.error or "Errore durante la chiamata AI Layer.")
    return res.answer

def query_gemini_multibank(api_key, question, history=None, model=None):
    """Delegate to AI Layer."""
    ai_service = get_ai_service()
    api_key_override = api_key if (api_key and not api_key.startswith("AQ.") and api_key.strip().lower() not in ("null", "undefined")) else None
    res = ai_service.ask_multibank(
        question=question,
        history=history,
        model=model,
        api_key_override=api_key_override
    )
    if res.status == ResponseStatus.ERROR or (res.error and not res.answer):
        raise Exception(res.error or "Errore durante la chiamata AI Layer.")
    return res.answer

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.json': 'application/json',
        '.js': 'application/javascript',
        '.css': 'text/css'
    }

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        if hasattr(self, 'path') and ('service-worker.js' in self.path or self.path.endswith('.html') or self.path.endswith('.js') or self.path.endswith('.css') or self.path == '/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/app-version'):
            try:
                core_files = ['index.html', 'app.js', 'engine.js', 'styles.css', 'service-worker.js']
                mtimes = [str(int(os.path.getmtime(f))) for f in core_files if os.path.exists(f)]
                build_id = "build_" + "_".join(mtimes)
                response = {
                    "status": "success",
                    "build": build_id,
                    "serverTime": int(time.time())
                }
            except Exception as e:
                response = {
                    "status": "success",
                    "build": "build_20260925_fixed",
                    "serverTime": int(time.time())
                }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        elif self.path == '/api/ai-metrics':
            try:
                metrics = get_usage_tracker().get_metrics_summary()
                response = {
                    "status": "success",
                    "data": metrics
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": f"Errore recupero metriche AI: {str(e)}"
                }
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/update-daily-rates':
            try:
                sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
                import fetch_daily_rates
                data = fetch_daily_rates.run_fetch_daily_rates()
                response = {
                    "status": "success",
                    "message": "Tassi giornalieri e storico aggiornati con successo da Il Sole 24 Ore / MutuiOnline!",
                    "data": data
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": f"Errore durante l'aggiornamento dei tassi: {str(e)}"
                }
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path.startswith('/api/bank-documents'):
            try:
                from urllib.parse import urlparse, parse_qs
                parsed = urlparse(self.path)
                params = parse_qs(parsed.query)
                bank_id = params.get('bankId', [''])[0].lower()
                
                workspace = BASE_DIR
                folders = [
                    ("Policy Ufficiale", "pdf policy banche", ["pdf policy banche"]),
                    ("Griglia Tassi", "tabelle tassi", ["tabelle tassi", "tabelle tassi/prodotti", "tabelle tassi/griglie tassi"])
                ]
                
                bank_id_clean = bank_id.replace("_", " ").replace("-", " ").strip()
                bank_keywords = {
                    "mps": [r"\bmps\b", r"\bmonte\b", r"\bpaschi\b", r"\bsiena\b"],
                    "ing": [r"\bing\b"],
                    "bper": [r"\bbper\b"],
                    "banco di sardegna": [r"\bsardegna\b", r"\bbds\b"],
                    "mediobanca premier": [r"\bmediobanca\b", r"\bpremier\b", r"\bchebanca\b"],
                    "credit agricole": [r"\bagricole\b", r"\bca\b", r"\bcredt\b"],
                    "credit agricole italia": [r"\bagricole\b", r"\bca\b", r"\bcredt\b"],
                    "bnl": [r"\bbnl\b", r"\bparibas\b"],
                    "bdm": [r"\bbdm\b", r"\bmezzogiorno\b", r"\bbari\b"],
                    "sparkasse": [r"\bsparkasse\b", r"\bbolzano\b"]
                }
                
                patterns = bank_keywords.get(bank_id_clean, bank_keywords.get(bank_id, [re.escape(bank_id_clean)]))
                if "agricole" in bank_id_clean:
                    patterns = [r"\bagricole\b", r"\bcredt\b"]
                elif "sardegna" in bank_id_clean:
                    patterns = [r"\bsardegna\b", r"\bbds\b"]
                elif "mediobanca" in bank_id_clean or "premier" in bank_id_clean or "chebanca" in bank_id_clean:
                    patterns = [r"\bmediobanca\b", r"\bpremier\b", r"\bchebanca\b"]
                
                matched_docs = []
                for cat_name, base_folder, subpaths in folders:
                    for sub in subpaths:
                        full_sub = os.path.join(workspace, sub)
                        if os.path.exists(full_sub):
                            for fname in sorted(os.listdir(full_sub)):
                                if fname.startswith(".") or fname.endswith(".json"): continue
                                fn_lower = fname.lower().replace("_", " ").replace("-", " ")
                                if any(re.search(pat, fn_lower) for pat in patterns):
                                    rel_url = f"/{sub}/{fname}"
                                    matched_docs.append({
                                        "category": cat_name,
                                        "name": fname,
                                        "url": rel_url,
                                        "folder": sub,
                                        "type": "pdf" if fname.lower().endswith(".pdf") else ("excel" if fname.lower().endswith((".xlsx", ".xls")) else "doc")
                                    })
                                    
                response = {
                    "status": "success",
                    "bankId": bank_id,
                    "documents": matched_docs
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        elif self.path == '/api/google-calendar-events':
            try:
                sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
                import sync_google_calendar
                cached = sync_google_calendar.get_cached_google_calendar()
                if not cached:
                    cached = sync_google_calendar.fetch_and_cache_google_calendar()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", **cached}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        elif self.path == '/api/crm/deals':
            try:
                path = os.path.join(BASE_DIR, "data", "deals.json")
                deals = []
                if os.path.exists(path):
                    with open(path, 'r', encoding='utf-8') as f:
                        deals = json.load(f)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "deals": deals}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        elif self.path == '/api/crm/clients':
            try:
                path = os.path.join(BASE_DIR, "data", "clients.json")
                clients = []
                if os.path.exists(path):
                    with open(path, 'r', encoding='utf-8') as f:
                        clients = json.load(f)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "clients": clients}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        elif self.path == '/api/crm/agenda':
            try:
                path = os.path.join(BASE_DIR, "data", "agenda_events.json")
                events = []
                if os.path.exists(path):
                    with open(path, 'r', encoding='utf-8') as f:
                        events = json.load(f)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "events": events}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/crm/deals':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                body = json.loads(post_data.decode('utf-8'))
                deals = body if isinstance(body, list) else body.get("deals", [])
                path = os.path.join(BASE_DIR, "data", "deals.json")
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(deals, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "count": len(deals)}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        elif self.path == '/api/crm/clients':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                body = json.loads(post_data.decode('utf-8'))
                clients = body if isinstance(body, list) else body.get("clients", [])
                path = os.path.join(BASE_DIR, "data", "clients.json")
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(clients, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "count": len(clients)}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        elif self.path == '/api/crm/agenda':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                body = json.loads(post_data.decode('utf-8'))
                events = body if isinstance(body, list) else body.get("events", [])
                path = os.path.join(BASE_DIR, "data", "agenda_events.json")
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(events, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "count": len(events)}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        elif self.path == '/api/sync-google-calendar':
            try:
                url_override = None
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length)
                    body = json.loads(post_data.decode('utf-8'))
                    url_override = body.get('url')
                sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
                import sync_google_calendar
                res = sync_google_calendar.fetch_and_cache_google_calendar(url_override)
                response = {
                    "status": "success",
                    "message": f"Sincronizzazione completata con successo! {res.get('count', 0)} appuntamenti importati da Google Calendar.",
                    **res
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": f"Errore durante la sincronizzazione Google Calendar: {str(e)}"
                }
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/update-daily-rates':
            try:
                sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
                import fetch_daily_rates
                data = fetch_daily_rates.run_fetch_daily_rates()
                response = {
                    "status": "success",
                    "message": "Tassi giornalieri e storico aggiornati con successo da Il Sole 24 Ore / MutuiOnline!",
                    "data": data
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": f"Errore durante l'aggiornamento dei tassi: {str(e)}"
                }
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/save-policies':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Path to policies.json
                policies_path = os.path.join(BASE_DIR, "data", "policies.json")
                
                # Write to policies.json
                with open(policies_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                
                # Run the synchronization script automatically to update engine.js
                sync_script = os.path.join(BASE_DIR, "scripts", "manage_policies.py")
                sync_status = ""
                if os.path.exists(sync_script):
                    subprocess.run([sys.executable, sync_script], check=True)
                    sync_status = "and synchronized to engine.js"
                else:
                    sync_status = "but sync script not found"
                
                response = {
                    "status": "success",
                    "message": f"Policies updated successfully {sync_status}!"
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/save-branches':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Path to branches.json
                branches_path = os.path.join(BASE_DIR, "data", "branches.json")
                
                # Write to branches.json
                with open(branches_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                
                response = {
                    "status": "success",
                    "message": "Branches database updated successfully!"
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/chat-policy':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                bank_id = params.get('bankId')
                question = params.get('question')
                api_key = params.get('apiKey')
                
                if not bank_id or not question:
                    raise Exception("Parametri bankId o question mancanti.")
                
                api_key_override = None
                if api_key and api_key.strip() and api_key.strip().lower() not in ("null", "undefined") and not api_key.startswith("AQ."):
                    api_key_override = api_key.strip()
                
                ai_service = get_ai_service()
                ai_res = ai_service.ask_policy(
                    bank_id=bank_id,
                    question=question,
                    api_key_override=api_key_override
                )
                
                if ai_res.status == ResponseStatus.ERROR or (ai_res.error and not ai_res.answer):
                    raise Exception(ai_res.error or "Errore durante l'elaborazione della richiesta AI")
                
                response = {
                    "status": "success",
                    "answer": ai_res.answer,
                    "citations": ai_res.citations,
                    "confidence": ai_res.confidence,
                    "provider": ai_res.provider,
                    "model": ai_res.model,
                    "usage": ai_res.usage,
                    "duration_ms": ai_res.duration_ms,
                    "request_id": ai_res.request_id
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/chat-multibank':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                question = params.get('question')
                history = params.get('history', [])
                api_key = params.get('apiKey')
                model = params.get('model')
                
                if not question:
                    raise Exception("Domanda mancante.")
                
                api_key_override = None
                if api_key and api_key.strip() and api_key.strip().lower() not in ("null", "undefined") and not api_key.startswith("AQ."):
                    api_key_override = api_key.strip()
                
                ai_service = get_ai_service()
                ai_res = ai_service.ask_multibank(
                    question=question,
                    history=history,
                    model=model,
                    api_key_override=api_key_override
                )
                
                if ai_res.status == ResponseStatus.ERROR or (ai_res.error and not ai_res.answer):
                    raise Exception(ai_res.error or "Errore durante l'elaborazione della richiesta AI")
                
                response = {
                    "status": "success",
                    "answer": ai_res.answer,
                    "citations": ai_res.citations,
                    "confidence": ai_res.confidence,
                    "provider": ai_res.provider,
                    "model": ai_res.model,
                    "usage": ai_res.usage,
                    "duration_ms": ai_res.duration_ms,
                    "request_id": ai_res.request_id
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                response = {
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/chat/start' or self.path == '/api/chat/message':
            try:
                from gui_launcher import ParserGUIHandler
                # Delegate to ParserGUIHandler's POST handler logic
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Import session management
                from gui_launcher import active_sessions, query_gemini_chat, apply_chat_updates
                data = json.loads(post_data.decode('utf-8'))
                
                api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    raise Exception("OPENAI_API_KEY non trovata nel file .env")
                    
                model = data.get('model', 'gemini-3.7-flash')
                if self.path == '/api/chat/start':
                    text = data.get('text', '').strip()
                    session_id = str(int(time.time() * 1000))
                    history = [{"role": "user", "parts": [{"text": text}]}]
                    res_json = query_gemini_chat(api_key, history, model=model)
                    
                    active_sessions[session_id] = {
                        "history": history + [{"role": "model", "parts": [{"text": json.dumps(res_json)}]}],
                        "extracted_updates": res_json.get("extracted_updates", {}),
                        "bank_id": res_json.get("bank_id"),
                        "is_temporary": res_json.get("is_temporary"),
                        "expires_at": res_json.get("expires_at"),
                        "original_text": text
                    }
                    
                    if res_json.get("status") == "ready_to_save":
                        bank_id = res_json.get("bank_id")
                        is_temp = res_json.get("is_temporary")
                        exp_at = res_json.get("expires_at")
                        upds = res_json.get("extracted_updates")
                        
                        apply_chat_updates(bank_id, is_temp, exp_at, upds, text)
                        res_json["message"] = f"Regola per '{bank_id}' salvata con successo!"
                        
                    res_json["sessionId"] = session_id
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(res_json).encode('utf-8'))
                else: # /api/chat/message
                    session_id = data.get('sessionId')
                    text = data.get('text', '').strip()
                    if not session_id or session_id not in active_sessions:
                        raise Exception("Sessione di chat scaduta o non valida.")
                    session = active_sessions[session_id]
                    session["history"].append({"role": "user", "parts": [{"text": text}]})
                    res_json = query_gemini_chat(api_key, session["history"], model=model)
                    session["history"].append({"role": "model", "parts": [{"text": json.dumps(res_json)}]})
                    
                    if "extracted_updates" in res_json and res_json["extracted_updates"]:
                        session["extracted_updates"].update(res_json["extracted_updates"])
                    if res_json.get("bank_id"):
                        session["bank_id"] = res_json.get("bank_id")
                    if res_json.get("is_temporary") is not None:
                        session["is_temporary"] = res_json.get("is_temporary")
                    if res_json.get("expires_at"):
                        session["expires_at"] = res_json.get("expires_at")
                        
                    if res_json.get("status") == "ready_to_save":
                        bank_id = session.get("bank_id")
                        is_temp = session.get("is_temporary")
                        exp_at = session.get("expires_at")
                        upds = session.get("extracted_updates")
                        orig_text = session.get("original_text", "")
                        apply_chat_updates(bank_id, is_temp, exp_at, upds, orig_text)
                        res_json["message"] = f"Regola per '{bank_id}' salvata con successo!"
                        
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(res_json).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def load_env():
    env_path = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    parts = line.split('=', 1)
                    os.environ[parts[0].strip()] = parts[1].strip()
        print("Loaded environment variables from .env")

def is_port_in_use(port):
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False

def background_rate_updater():
    # Wait 2 seconds for server to start, then run once immediately
    time.sleep(2)
    while True:
        try:
            print("[Rates Updater] Aggiornamento automatico tassi IRS ed Euribor in corso...", flush=True)
            sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
            import fetch_daily_rates
            fetch_daily_rates.run_fetch_daily_rates()
            print("[Rates Updater] Aggiornamento completato con successo.", flush=True)
        except Exception as e:
            print(f"[Rates Updater] Avviso/Errore durante aggiornamento tassi: {e}", flush=True)
        # Sleep for 3 hours (10800 seconds)
        time.sleep(10800)

# Run the server
if __name__ == '__main__':
    # Make sure we change directory to the project folder
    os.chdir(BASE_DIR)
    
    load_env()
    
    if is_port_in_use(PORT):
        print(f"✓ BrokerFlow è già attivo in background sulla porta {PORT}.")
        print(f"Apertura dell'applicazione nel browser: http://localhost:{PORT}")
        import webbrowser
        webbrowser.open(f"http://localhost:{PORT}")
        sys.exit(0)
    
    server_address = ('', PORT)
    
    class ReusableThreadingServer(http.server.ThreadingHTTPServer):
        allow_reuse_address = True
        
    # Start background rates updater daemon
    updater_thread = threading.Thread(target=background_rate_updater, daemon=True)
    updater_thread.start()
    
    print(f"Starting custom server on port {PORT}...", flush=True)
    httpd = ReusableThreadingServer(server_address, CustomHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.", flush=True)
        httpd.server_close()
