#!/usr/bin/env python3
"""
BrokerFlow - GUI Local Server Launcher.
Starts a lightweight web server on http://localhost:8085 and automatically opens the browser.
Serves a drag-and-drop HTML dashboard to:
1. Upload, parse, and geolocate policy files
2. Safety backups & restores
3. Manual rule insertions & clarification chat
4. Rate tables (tabelle tassi & prodotti) extraction, visual preview, clarification chat, and confirmation
"""

import http.server
import json
import os
import sys
import base64
import ssl
import io
import datetime
import threading
import time
import webbrowser
import urllib.request

WORKSPACE_DIR = "/Users/alessandrofassina/Desktop/broker flow"
BACKUPS_DIR = os.path.join(WORKSPACE_DIR, "data/backups")
BANK_PRODUCTS_DIR = os.path.join(WORKSPACE_DIR, "data/bank_products")

# Add scripts directory to path to import manage_policies and manage_rates
sys.path.append(os.path.join(WORKSPACE_DIR, "scripts"))
from manage_policies import load_env
load_env()
from manage_rates import query_gemini_rates, cmd_compile_products, BANK_PRODUCTS_DIR

def normalize_bank_id(bank_id: str) -> str:
    if not bank_id:
        return ""
    s = str(bank_id).strip().lower().replace("_", " ").replace("-", " ")
    if "agricole" in s or "creval" in s or "cariparma" in s or "friuladria" in s:
        return "credit agricole italia"
    if "sardegna" in s or "bds" in s:
        return "banco_di_sardegna"
    if "mediobanca" in s or "chebanca" in s:
        return "mediobanca_premier"
    if "mps" in s or "paschi" in s:
        return "mps"
    if "bper" in s:
        return "bper"
    if "bnl" in s or "paribas" in s:
        return "bnl"
    if "ing" in s:
        return "ing"
    if "sparkasse" in s or "bolzano" in s:
        return "sparkasse"
    return bank_id.strip().lower()

# Global dictionary to track active chat sessions
active_sessions = {}
active_rate_sessions = {}

CHAT_SYSTEM_PROMPT = """Sei un assistente AI esperto per il sistema BrokerFlow. Il tuo compito è aiutare l'utente a codificare regole aggiuntive, eccezioni, formule di calcolo reddito o promozioni temporanee per una specifica banca.

Elenco delle banche supportate (ID ufficiali):
- credit agricole italia (accetta anche "credit agricole", "agricole", "cariparma", "creval")
- mediobanca_premier (accetta anche "mediobanca", "chebanca", "mediobanca premier")
- mps (Monte dei Paschi di Siena)
- ing (ING Bank)
- bper (BPER Banca)
- bnl (BNL BNP Paribas)
- sparkasse (Cassa di Risparmio di Bolzano)
- banco_di_sardegna (Banco di Sardegna)
- bdm (BDM Banca)

Il tuo comportamento deve seguire strettamente questi passaggi in conversazione con l'utente:

1. IDENTIFICAZIONE BANCA:
Rileva quale banca è menzionata nel testo. Se la banca non è menzionata o è ambigua, imposta 'status' a 'clarification_needed' e chiedi all'utente per quale banca inserire le regole.

2. ANALISI E STRUTTURAZIONE REGOLA:
Analizza le regole descritte e inseriscile nella corretta struttura JSON di BrokerFlow:
- Limiti finanziari: maxLtv, maxDsr, maxDsrDeroga, minLoan, maxLoan, minDuration, maxDuration, maxAge, maxGuarantorAge.
- Formule e calcolo redditi: inserisci sotto "regole_calcolo_reddito" (es. {"dipendente": {"metodo_cu": "...", "metodo_buste_paga": {...}}, "autonomi": {"ordinario": {...}, "forfettario": {...}}}).
- Criteri assegno unico o voci accessorie: inserisci sotto "criteri_reddito".
- Eccezioni e deroghe su finalità, contratti, garanti o territori: inserisci sotto "eccezioni_e_deroghe".

3. CONFERMA MODIFICA (PERMANENTE O TEMPORANEA):
- Se l'utente non ha specificato una data di scadenza o la regola riguarda criteri di calcolo strutturali o policy ordinarie, imposta 'is_temporary' a false.
- Se è esplicitamente una promozione temporanea, richiedi o estrai la data di scadenza precisa e imposta 'is_temporary' a true.

4. ESTRAZIONE E SALVATAGGIO:
Quando hai tutti i dati, imposta 'status' a 'ready_to_save' e inserisci in 'extracted_updates' un dizionario strutturato con le chiavi e i valori da aggiornare.

Rispondi SEMPRE esclusivamente in formato JSON con questo schema:
{
  "status": "clarification_needed" | "ready_to_save",
  "bank_id": "id_ufficiale_banca",
  "is_temporary": true | false,
  "expires_at": "YYYY-MM-DD" o null,
  "question": "Testo della domanda rivolta all'utente se clarification_needed",
  "extracted_updates": { ... }
}
"""

def query_gemini_chat(api_key, history, model="gpt-4o-mini"):
    ctx = ssl._create_unverified_context()
    
    # OpenAI ChatGPT Direct Path
    if api_key and (api_key.startswith("sk-") or api_key.startswith("gsk_")):
        endpoint = "https://api.openai.com/v1/chat/completions"
        msgs = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
        for item in history:
            role = "user" if item.get("role") == "user" else "assistant"
            txt = ""
            if "parts" in item:
                txt = " ".join(p.get("text", "") for p in item["parts"] if isinstance(p, dict))
            elif "text" in item:
                txt = item["text"]
            if txt:
                msgs.append({"role": role, "content": txt})
        
        for m in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]:
            payload = {
                "model": m,
                "messages": msgs,
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
                method='POST'
            )
            try:
                with urllib.request.urlopen(req, timeout=45, context=ctx) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    text_response = res_data['choices'][0]['message']['content']
                    return json.loads(text_response.strip())
            except Exception as e:
                print(f"query_gemini_chat OpenAI {m} error: {e}")
                continue
        raise Exception("Impossibile contattare le API OpenAI ChatGPT.")

    models_to_try = [model, "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
    models_to_try = list(dict.fromkeys(models_to_try))
    
    ctx = ssl._create_unverified_context()
    last_err = None
    
    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        payload = {
            "contents": history,
            "systemInstruction": {
                "parts": [{"text": CHAT_SYSTEM_PROMPT}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req, timeout=60, context=ctx) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                text_response = res_data['candidates'][0]['content']['parts'][0]['text']
                raw_clean = text_response.strip()
                if raw_clean.startswith("```json"):
                    raw_clean = raw_clean[7:]
                elif raw_clean.startswith("```"):
                    raw_clean = raw_clean[3:]
                if raw_clean.endswith("```"):
                    raw_clean = raw_clean[:-3]
                return json.loads(raw_clean.strip())
        except urllib.error.HTTPError as e:
            last_err = e
            print(f"query_gemini_chat: modello {m} ha restituito HTTP {e.code}: {e.reason}, tentativo con modello successivo...")
            continue
        except Exception as e:
            last_err = e
            print(f"query_gemini_chat: modello {m} errore {e}, tentativo con modello successivo...")
            continue
            
    # OpenRouter fallback
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if openrouter_key:
        print("query_gemini_chat: Tentativo fallback su OpenRouter...")
        try:
            or_messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
            for h in history:
                role = "user" if h.get("role") == "user" else "assistant"
                txt = ""
                for p in h.get("parts", []):
                    if "text" in p:
                        txt += p["text"]
                if txt:
                    or_messages.append({"role": role, "content": txt})

            or_payload = {
                "model": "openrouter/auto",
                "messages": or_messages,
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
            with urllib.request.urlopen(or_req, timeout=45, context=ctx) as or_resp:
                or_data = json.loads(or_resp.read().decode("utf-8"))
                or_text = or_data["choices"][0]["message"]["content"]
                return json.loads(or_text.strip())
        except Exception as or_err:
            print(f"Fallback OpenRouter errore in chat: {or_err}")

    if last_err:
        raise last_err
    raise Exception("Nessun modello AI disponibile.")

def deep_merge_dicts(target, source):
    for k, v in source.items():
        if k in target and isinstance(target[k], dict) and isinstance(v, dict):
            deep_merge_dicts(target[k], v)
        else:
            target[k] = v

def apply_chat_updates(bank_id, is_temporary, expires_at, updates, original_text):
    from manage_policies import create_backup, cmd_align, BANK_POLICIES_DIR
    
    # 1. Create safety backup
    try:
        create_backup()
    except Exception as e:
        print(f"Avviso backup preventivo: {e}")
        
    # 2. Resolve bank ID with aliases
    b_clean = bank_id.lower().strip().replace("-", "_").replace(" ", "_")
    alias_map = {
        "chebanca": "mediobanca_premier",
        "che_banca": "mediobanca_premier",
        "mediobanca": "mediobanca_premier",
        "mediobanca_premier": "mediobanca_premier",
        "sardegna": "banco_di_sardegna",
        "banco_sardegna": "banco_di_sardegna",
        "bds": "banco_di_sardegna",
        "bari": "bdm",
        "mezzogiorno": "bdm"
    }
    resolved_id = alias_map.get(b_clean, b_clean)
    
    file_path = os.path.join(BANK_POLICIES_DIR, f"{resolved_id}_policy.json")
    if not os.path.exists(file_path):
        # Fuzzy search
        matched = False
        for f in os.listdir(BANK_POLICIES_DIR):
            if f.endswith("_policy.json") and resolved_id in f:
                file_path = os.path.join(BANK_POLICIES_DIR, f)
                matched = True
                break
        if not matched:
            raise FileNotFoundError(f"File di policy non trovato per la banca '{bank_id}' in {BANK_POLICIES_DIR}")
        
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    # 3. Apply updates
    if is_temporary:
        promo = {
            "id": f"promo_{resolved_id}_{str(expires_at).replace('-', '')}_{int(time.time())}",
            "description": original_text,
            "expiresAt": expires_at,
            "updates": updates
        }
        if "promotions" not in data or not isinstance(data["promotions"], list):
            data["promotions"] = []
        data["promotions"].append(promo)
        print(f"Aggiunta promozione temporanea per '{resolved_id}': {original_text} (Scade il {expires_at})")
    else:
        # Deep merge permanently
        deep_merge_dicts(data, updates)
        print(f"Applicate modifiche permanenti per '{resolved_id}': {updates}")
        
    # 4. Save file
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        
    # 5. Run alignment & compilation & sync
    cmd_align()


class ParserGUIHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass
        
    def send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, message):
        self.send_json({"status": "error", "message": message}, status_code=500)

    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            html_path = os.path.join(WORKSPACE_DIR, 'scripts/gui/index.html')
            if os.path.exists(html_path):
                with open(html_path, 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
            else:
                self.wfile.write(b"Errore: File index.html non trovato.")
        elif self.path == '/api/backups':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            backups = []
            if os.path.exists(BACKUPS_DIR):
                for d in sorted(os.listdir(BACKUPS_DIR)):
                    b_path = os.path.join(BACKUPS_DIR, d)
                    if os.path.isdir(b_path):
                        b_type = "AUTOMATICO" if d.startswith("auto_backup_") else "MANUALE"
                        mtime = os.path.getmtime(b_path)
                        dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                        backups.append({
                            "name": d,
                            "type": b_type,
                            "date": dt
                        })
            backups.sort(key=lambda x: x['name'], reverse=True)
            self.wfile.write(json.dumps(backups).encode('utf-8'))
        elif self.path.startswith('/api/document_preview'):
            import urllib.parse
            parsed_url = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_url.query)
            doc_id = query.get('id', [''])[0].strip()
            
            scratch_docs = os.path.join(WORKSPACE_DIR, 'scratch', 'temp_docs')
            target_file = None
            if doc_id and os.path.exists(scratch_docs):
                for f in os.listdir(scratch_docs):
                    if f.startswith(doc_id):
                        target_file = os.path.join(scratch_docs, f)
                        break
                        
            if target_file and os.path.exists(target_file):
                self.send_response(200)
                if target_file.lower().endswith('.pdf'):
                    self.send_header('Content-Type', 'application/pdf')
                elif target_file.lower().endswith('.docx'):
                    self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                else:
                    self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Disposition', 'inline')
                self.end_headers()
                with open(target_file, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b"Documento non trovato.")
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Pagina non trovata.")
            
    def do_POST(self):
        if self.path == '/api/policy/parse_grounded':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                file_name = data.get('fileName', '').strip()
                file_content_b64 = data.get('fileContent', '')
                user_notes = data.get('userNotes', '').strip()
                model = data.get('model', 'gemini-3.6-flash')
                
                if not bank_id or not file_name or not file_content_b64:
                    raise Exception("Dati obbligatori mancanti (ID Banca, Nome file o contenuto file)")
                    
                doc_id = f"doc_{int(time.time() * 1000)}"
                scratch_docs = os.path.join(WORKSPACE_DIR, 'scratch', 'temp_docs')
                os.makedirs(scratch_docs, exist_ok=True)
                temp_path = os.path.join(scratch_docs, f"{doc_id}_{file_name}")
                
                with open(temp_path, 'wb') as f:
                    f.write(base64.b64decode(file_content_b64))
                    
                from manage_policies import extract_policy_with_grounding
                res = extract_policy_with_grounding(bank_id, temp_path, model=model, user_notes=user_notes)
                
                is_pdf = file_name.lower().endswith('.pdf')
                out_res = {
                    "status": "grounded_ready",
                    "bankId": bank_id,
                    "bankName": res.get("bank_name", bank_id.upper()),
                    "docId": doc_id,
                    "fileName": file_name,
                    "isPdf": is_pdf,
                    "totalRules": res.get("total_rules", len(res.get("rules", []))),
                    "rules": res.get("rules", []),
                    "mriGrid": res.get("mriGrid"),
                    "fullPolicy": res.get("full_policy", {}),
                    "message": f"Analisi completata: estratte {len(res.get('rules', []))} regole con ancoraggio documentale."
                }
                
                self.send_json(out_res)
                
            except Exception as e:
                self.send_error_json(str(e))

        elif self.path == '/api/policy/save_grounded':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                rules = data.get('rules', [])
                full_policy_base = data.get('fullPolicy', {})
                mri_grid = data.get('mriGrid')
                model = data.get('model', 'gemini-3.7-flash')
                
                if not bank_id or not rules:
                    raise Exception("Dati mancanti: ID Banca o elenco regole non fornito.")
                    
                from manage_policies import reconstruct_policy_from_rules, apply_and_save_policy
                reconstructed = reconstruct_policy_from_rules(bank_id, rules, full_policy_base=full_policy_base, mri_grid=mri_grid)
                
                old_stdout = sys.stdout
                sys.stdout = mystdout = io.StringIO()
                try:
                    apply_and_save_policy(bank_id, reconstructed, model=model)
                    success = True
                    msg = f"Policy per '{bank_id}' salvata e applicata con successo in BrokerFlow!"
                except Exception as e:
                    success = False
                    msg = f"Errore durante il salvataggio della policy: {str(e)}"
                finally:
                    sys.stdout = old_stdout
                    
                res = {
                    "status": "success" if success else "error",
                    "message": msg,
                    "logs": mystdout.getvalue(),
                    "bankId": bank_id
                }
                self.send_json(res, status_code=200 if success else 500)
            except Exception as e:
                self.send_error_json(str(e))

        elif self.path == '/api/policy/parse' or self.path == '/api/parse':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                file_name = data.get('fileName', '').strip()
                file_content_b64 = data.get('fileContent', '')
                model = data.get('model', 'gemini-3.7-flash')
                
                if not bank_id or not file_name or not file_content_b64:
                    raise Exception("Dati obbligatori mancanti (ID Banca, Nome file o contenuto file)")
                    
                scratch_dir = os.path.join(WORKSPACE_DIR, 'scratch')
                os.makedirs(scratch_dir, exist_ok=True)
                temp_path = os.path.join(scratch_dir, f"temp_upload_{file_name}")
                
                with open(temp_path, 'wb') as f:
                    f.write(base64.b64decode(file_content_b64))
                    
                from manage_policies import extract_policy_preview
                parsed_json = extract_policy_preview(bank_id, temp_path, model=model)
                
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    
                res = {
                    "status": "preview_ready",
                    "bankId": bank_id,
                    "policy": parsed_json,
                    "message": f"Policy per '{bank_id}' analizzata con successo. Verifica l'anteprima prima di confermare."
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
                
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/policy/confirm':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                policy = data.get('policy', {})
                model = data.get('model', 'gemini-3.7-flash')
                
                if not bank_id or not policy:
                    raise Exception("Dati mancanti per la conferma della policy.")
                    
                from manage_policies import apply_and_save_policy
                old_stdout = sys.stdout
                sys.stdout = mystdout = io.StringIO()
                try:
                    apply_and_save_policy(bank_id, policy, model=model)
                    success = True
                    msg = f"Policy per '{bank_id}' salvata, allineata e sincronizzata con successo!"
                except Exception as e:
                    success = False
                    msg = f"Errore durante il salvataggio della policy: {str(e)}"
                finally:
                    sys.stdout = old_stdout
                    
                res = {
                    "status": "success" if success else "error",
                    "message": msg,
                    "logs": mystdout.getvalue(),
                    "bankId": bank_id
                }
                self.send_response(200 if success else 500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/backup':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                name = data.get('name', '').strip()
                
                from manage_policies import create_backup
                saved_name = create_backup(name if name else None)
                
                res = {
                    "status": "success",
                    "message": f"Backup '{saved_name}' creato con successo!"
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/restore':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                name = data.get('name', '').strip()
                
                from manage_policies import restore_backup
                old_stdout = sys.stdout
                sys.stdout = mystdout = io.StringIO()
                
                try:
                    restore_backup(name if name else None)
                    success = True
                    error_msg = ""
                except Exception as e:
                    success = False
                    error_msg = str(e)
                finally:
                    sys.stdout = old_stdout
                    
                logs = mystdout.getvalue()
                
                if success:
                    res = {
                        "status": "success",
                        "message": f"Ripristino del backup '{name if name else 'ultimo automatico'}' completato!",
                        "logs": logs
                    }
                    self.send_response(200)
                else:
                    res = {
                        "status": "error",
                        "message": f"Errore durante il ripristino: {error_msg}",
                        "logs": logs
                    }
                    self.send_response(500)
                    
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/chat/start':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                text = data.get('text', '').strip()
                model = data.get('model', 'gemini-3.7-flash')
                
                from manage_policies import load_env
                load_env()
                api_key = os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    raise Exception("GEMINI_API_KEY non trovata nel file .env")
                    
                session_id = str(int(time.time() * 1000))
                history = [
                    {
                        "role": "user",
                        "parts": [{"text": text}]
                    }
                ]
                
                res_json = query_gemini_chat(api_key, history, model=model)
                
                # Save session state
                active_sessions[session_id] = {
                    "history": history + [{"role": "model", "parts": [{"text": json.dumps(res_json)}]}],
                    "extracted_updates": res_json.get("extracted_updates", {}),
                    "bank_id": res_json.get("bank_id"),
                    "is_temporary": res_json.get("is_temporary"),
                    "expires_at": res_json.get("expires_at"),
                    "original_text": text
                }
                
                # If ready to save, write it down!
                if res_json.get("status") == "ready_to_save":
                    bank_id = res_json.get("bank_id")
                    is_temp = res_json.get("is_temporary")
                    exp_at = res_json.get("expires_at")
                    upds = res_json.get("extracted_updates")
                    
                    old_stdout = sys.stdout
                    sys.stdout = mystdout = io.StringIO()
                    try:
                        apply_chat_updates(bank_id, is_temp, exp_at, upds, text)
                        success = True
                        msg = f"Regola per '{bank_id}' salvata con successo!"
                    except Exception as e:
                        success = False
                        msg = f"Errore durante l'applicazione delle modifiche: {str(e)}"
                    finally:
                        sys.stdout = old_stdout
                    
                    res_json["message"] = msg
                    res_json["logs"] = mystdout.getvalue()
                    
                res_json["sessionId"] = session_id
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res_json).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/chat/message':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                session_id = data.get('sessionId')
                text = data.get('text', '').strip()
                model = data.get('model', 'gemini-3.7-flash')
                
                if not session_id or session_id not in active_sessions:
                    raise Exception("Sessione di chat scaduta o non valida.")
                    
                from manage_policies import load_env
                load_env()
                api_key = os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    raise Exception("GEMINI_API_KEY non trovata nel file .env")
                    
                session = active_sessions[session_id]
                session["history"].append({
                    "role": "user",
                    "parts": [{"text": text}]
                })
                
                res_json = query_gemini_chat(api_key, session["history"], model=model)
                
                # Update session state with response
                session["history"].append({
                    "role": "model",
                    "parts": [{"text": json.dumps(res_json)}]
                })
                
                # Keep tracking updates
                if "extracted_updates" in res_json and res_json["extracted_updates"]:
                    session["extracted_updates"].update(res_json["extracted_updates"])
                if res_json.get("bank_id"):
                    session["bank_id"] = res_json.get("bank_id")
                if res_json.get("is_temporary") is not None:
                    session["is_temporary"] = res_json.get("is_temporary")
                if res_json.get("expires_at"):
                    session["expires_at"] = res_json.get("expires_at")
                    
                if res_json.get("status") == "ready_to_save":
                    bank_id = session["bank_id"]
                    is_temp = session["is_temporary"]
                    exp_at = session["expires_at"]
                    upds = session["extracted_updates"]
                    orig_text = session["original_text"]
                    
                    old_stdout = sys.stdout
                    sys.stdout = mystdout = io.StringIO()
                    try:
                        apply_chat_updates(bank_id, is_temp, exp_at, upds, orig_text)
                        success = True
                        msg = f"Regola per '{bank_id}' salvata con successo!"
                    except Exception as e:
                        success = False
                        msg = f"Errore durante l'applicazione delle modifiche: {str(e)}"
                    finally:
                        sys.stdout = old_stdout
                    
                    res_json["message"] = msg
                    res_json["logs"] = mystdout.getvalue()
                    res_json["extracted_updates"] = upds
                    
                res_json["sessionId"] = session_id
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res_json).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/chat-multibank':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                question = data.get('question')
                history = data.get('history', [])
                model = data.get('model', 'gemini-3.5-flash-lite')
                
                from manage_policies import load_env, query_gemini_multibank
                load_env()
                api_key = os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    raise Exception("GEMINI_API_KEY non configurata.")
                
                answer = query_gemini_multibank(api_key, question, history=history, model=model)
                response = {
                    "status": "success",
                    "answer": answer
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        # RATES / PRODUCTS IMPORT ENDPOINTS
        elif self.path == '/api/rates/parse':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                file_name = data.get('fileName', '').strip()
                file_content_b64 = data.get('fileContent', '')
                raw_text = data.get('rawText', '').strip()
                user_notes = data.get('userNotes', '').strip()
                model = data.get('model', 'gemini-3.6-flash')
                
                from manage_policies import load_env
                load_env()
                api_key = os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    raise Exception("GEMINI_API_KEY non trovata nel file .env")
                    
                session_id = str(int(time.time() * 1000))
                
                is_pdf = False
                content_for_ai = ""
                
                pdf_text = None
                if file_content_b64:
                    if file_name.lower().endswith('.pdf'):
                        is_pdf = True
                        content_for_ai = file_content_b64
                        scratch_dir = os.path.join(WORKSPACE_DIR, 'scratch')
                        os.makedirs(scratch_dir, exist_ok=True)
                        temp_pdf = os.path.join(scratch_dir, f"temp_{file_name}")
                        with open(temp_pdf, 'wb') as f:
                            f.write(base64.b64decode(file_content_b64))
                        from manage_rates import extract_pdf_rate_text
                        pdf_text = extract_pdf_rate_text(temp_pdf)
                        if os.path.exists(temp_pdf):
                            os.remove(temp_pdf)
                    elif file_name.lower().endswith('.docx'):
                        scratch_dir = os.path.join(WORKSPACE_DIR, 'scratch')
                        os.makedirs(scratch_dir, exist_ok=True)
                        temp_docx = os.path.join(scratch_dir, f"temp_{file_name}")
                        with open(temp_docx, 'wb') as f:
                            f.write(base64.b64decode(file_content_b64))
                        from manage_policies import extract_docx_text
                        content_for_ai = extract_docx_text(temp_docx)
                        if os.path.exists(temp_docx):
                            os.remove(temp_docx)
                    elif file_name.lower().endswith(('.xlsx', '.xlsm')):
                        scratch_dir = os.path.join(WORKSPACE_DIR, 'scratch')
                        os.makedirs(scratch_dir, exist_ok=True)
                        temp_xlsx = os.path.join(scratch_dir, f"temp_{file_name}")
                        with open(temp_xlsx, 'wb') as f:
                            f.write(base64.b64decode(file_content_b64))
                        from manage_rates import extract_excel_all_sheets
                        content_for_ai = extract_excel_all_sheets(temp_xlsx)
                        if os.path.exists(temp_xlsx):
                            os.remove(temp_xlsx)
                    else:
                        content_for_ai = base64.b64decode(file_content_b64).decode('utf-8', errors='ignore')
                elif raw_text:
                    content_for_ai = raw_text
                else:
                    raise Exception("Nessun file o testo fornito per l'analisi dei tassi.")
                    
                # If bank_id was provided explicitly, prepend it to help Gemini
                if bank_id and not is_pdf:
                    content_for_ai = f"[BANCA INDICATA DALL'UTENTE: {bank_id}]\n\n" + content_for_ai
                    
                from manage_rates import query_gemini_rates
                res_json = query_gemini_rates(api_key, content_for_ai, is_pdf=is_pdf, model=model, bank_id=bank_id, user_notes=user_notes, pdf_text=pdf_text)
                
                # Build initial history
                if is_pdf:
                    initial_history = [
                        {
                            "role": "user",
                            "parts": [
                                {"inlineData": {"mimeType": "application/pdf", "data": content_for_ai}},
                                {"text": f"Estrai tutti i prodotti mutuo e le tabelle tassi contenute in questo documento (Banca indicata: {bank_id or 'da identificare'})."}
                            ]
                        },
                        {
                            "role": "model",
                            "parts": [{"text": json.dumps(res_json)}]
                        }
                    ]
                else:
                    initial_history = [
                        {
                            "role": "user",
                            "parts": [{"text": f"Estrai tutti i prodotti mutuo e le tabelle tassi dal seguente testo:\n\n{content_for_ai}"}]
                        },
                        {
                            "role": "model",
                            "parts": [{"text": json.dumps(res_json)}]
                        }
                    ]
                    
                active_rate_sessions[session_id] = {
                    "history": initial_history,
                    "bank_id": res_json.get("bank_id") or bank_id,
                    "products": res_json.get("products", []),
                    "model": model
                }
                
                res_json["sessionId"] = session_id
                if not res_json.get("bank_id") and bank_id:
                    res_json["bank_id"] = bank_id
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res_json).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/rates/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                session_id = data.get('sessionId')
                text = data.get('text', '').strip()
                model = data.get('model', 'gemini-3.7-flash')
                
                if not session_id or session_id not in active_rate_sessions:
                    raise Exception("Sessione di analisi tassi scaduta o non valida.")
                    
                from manage_policies import load_env
                load_env()
                api_key = os.environ.get("GEMINI_API_KEY")
                if not api_key:
                    raise Exception("GEMINI_API_KEY non trovata nel file .env")
                    
                session = active_rate_sessions[session_id]
                session["history"].append({
                    "role": "user",
                    "parts": [{"text": text}]
                })
                
                res_json = query_gemini_rates(api_key, "", is_pdf=False, model=model, history=session["history"])
                
                session["history"].append({
                    "role": "model",
                    "parts": [{"text": json.dumps(res_json)}]
                })
                
                if res_json.get("bank_id"):
                    session["bank_id"] = res_json["bank_id"]
                if res_json.get("products"):
                    session["products"] = res_json["products"]
                    
                res_json["sessionId"] = session_id
                if not res_json.get("bank_id") and session.get("bank_id"):
                    res_json["bank_id"] = session.get("bank_id")
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res_json).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/rates/confirm':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                new_products = data.get('products', [])
                replace_all = data.get('replaceAll', False)
                
                if not bank_id or not new_products:
                    raise Exception("ID Banca o lista prodotti mancante.")
                    
                from manage_policies import create_backup
                try:
                    create_backup()
                except Exception as e:
                    print(f"Avviso backup preventivo: {e}")
                    
                from manage_rates import merge_bank_products, cmd_compile_products
                
                os.makedirs(BANK_PRODUCTS_DIR, exist_ok=True)
                out_path = os.path.join(BANK_PRODUCTS_DIR, f"{bank_id}_products.json")
                
                existing_products = []
                if os.path.exists(out_path):
                    try:
                        with open(out_path, "r", encoding="utf-8") as f:
                            existing_products = json.load(f)
                    except Exception:
                        existing_products = []
                        
                final_products = merge_bank_products(existing_products, new_products, replace_all=replace_all)
                
                with open(out_path, "w", encoding="utf-8") as out:
                    json.dump(final_products, out, indent=4, ensure_ascii=False)
                    
                old_stdout = sys.stdout
                sys.stdout = mystdout = io.StringIO()
                try:
                    cmd_compile_products()
                    success = True
                    msg = f"Salvati e sincronizzati {len(final_products)} prodotti per '{bank_id}' in BrokerFlow ({len(new_products)} nuovi/aggiornati, patrimonio esistente preservato al 100%)!"
                except Exception as e:
                    success = False
                    msg = f"Errore durante la compilazione/sincronizzazione dei prodotti: {str(e)}"
                finally:
                    sys.stdout = old_stdout
                    
                res = {
                    "status": "success" if success else "error",
                    "message": msg,
                    "logs": mystdout.getvalue(),
                    "bankId": bank_id,
                    "productCount": len(final_products),
                    "newCount": len(new_products)
                }
                
                self.send_response(200 if success else 500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))

        # BRANCHES / TERRITORY IMPORT ENDPOINTS
        elif self.path == '/api/branches/parse':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                file_name = data.get('fileName', '').strip()
                file_content_b64 = data.get('fileContent', '')
                raw_text = data.get('rawText', '').strip()
                model = data.get('model', 'gemini-3.5-flash-lite')
                
                if not bank_id:
                    raise Exception("ID Banca obbligatorio.")
                    
                from manage_branches import extract_branches_preview
                
                scratch_dir = os.path.join(WORKSPACE_DIR, 'scratch')
                os.makedirs(scratch_dir, exist_ok=True)
                
                if file_content_b64:
                    temp_file = os.path.join(scratch_dir, f"temp_branches_{file_name}")
                    with open(temp_file, 'wb') as f:
                        f.write(base64.b64decode(file_content_b64))
                    res_json = extract_branches_preview(bank_id, temp_file, file_name=file_name, is_raw_text=False, model=model)
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                elif raw_text:
                    res_json = extract_branches_preview(bank_id, raw_text, file_name="", is_raw_text=True, model=model)
                else:
                    raise Exception("Nessun file o testo fornito per l'analisi delle filiali.")
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res_json).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
                
        elif self.path == '/api/branches/confirm':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                bank_id = normalize_bank_id(data.get('bankId', ''))
                branches = data.get('branches', [])
                
                if not bank_id or not branches:
                    raise Exception("ID Banca o lista filiali mancante.")
                    
                from manage_branches import apply_and_save_branches
                old_stdout = sys.stdout
                sys.stdout = mystdout = io.StringIO()
                try:
                    apply_and_save_branches(bank_id, branches)
                    success = True
                    msg = f"Salvate con successo {len(branches)} filiali per '{bank_id}' e aggiornata la territorialità in BrokerFlow!"
                except Exception as e:
                    success = False
                    msg = f"Errore durante il salvataggio delle filiali: {str(e)}"
                finally:
                    sys.stdout = old_stdout
                    
                res = {
                    "status": "success" if success else "error",
                    "message": msg,
                    "logs": mystdout.getvalue(),
                    "bankId": bank_id,
                    "branchCount": len(branches)
                }
                
                self.send_response(200 if success else 500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
            except Exception as e:
                self.send_error_json(str(e))
        else:
            self.send_response(404)
            self.end_headers()

def is_port_in_use(port):
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False

def main():
    import argparse
    os.chdir(WORKSPACE_DIR)
    parser = argparse.ArgumentParser(description="BrokerFlow Parser Server")
    parser.add_argument("--open", action="store_true", help="Apri automaticamente il browser")
    args = parser.parse_args()

    if is_port_in_use(8085):
        print("✓ BrokerFlow Parser è già attivo in background sulla porta 8085.", flush=True)
        if args.open:
            webbrowser.open("http://localhost:8085")
        sys.exit(0)
        
    if args.open:
        def open_browser():
            time.sleep(0.8)
            webbrowser.open("http://localhost:8085")
        threading.Thread(target=open_browser, daemon=True).start()
    
    server_address = ('', 8085)
    
    class ReusableThreadingServer(http.server.ThreadingHTTPServer):
        allow_reuse_address = True
        
    print("Avvio del server Parser in background...", flush=True)
    print("Indirizzo locale: http://localhost:8085", flush=True)
    
    httpd = ReusableThreadingServer(server_address, ParserGUIHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer arrestato.", flush=True)
        sys.exit(0)

if __name__ == '__main__':
    main()
