# BrokerFlow - System Blueprint & Reconstruction Manual (v320)

Questo documento contiene tutte le linee guida, le specifiche di configurazione e il codice sorgente necessario per ricostruire interamente la piattaforma **BrokerFlow** allo stato attuale in caso di crash totale o per inizializzare una nuova sessione di chat/sviluppo.

---

## 1. Architettura del Sistema

BrokerFlow è composto da due moduli principali:
1. **Frontend (SPA)**: Un'applicazione web a pagina singola ([index.html](file:///Users/alessandrofassina/Desktop/broker%20flow/index.html) + [app.js](file:///Users/alessandrofassina/Desktop/broker%20flow/app.js) + [engine.js](file:///Users/alessandrofassina/Desktop/broker%20flow/engine.js)) che gestisce l'interfaccia, la navigazione a fasi del preventivatore, il calcolo delle rate/LTV e la chat client.
2. **Backend (Python HTTP Server)**: Un server leggero ([server.py](file:///Users/alessandrofassina/Desktop/broker%20flow/server.py)) che gira su porta `8080` e gestisce il salvataggio dei dati nel DB locale, l'estrazione XML nativa dei testi dai file di policy `.docx` e l'inoltro delle richieste all'API Google Gemini 3.7.

---

## 2. Configurazione dell'Ambiente (.env)

Il server carica automaticamente le variabili d'ambiente da un file `.env` posizionato nella cartella radice del progetto:
* **Percorso**: `/Users/alessandrofassina/Desktop/broker flow/.env`
* **Contenuto**:
  ```env
  GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
  ```

---

## 3. Codice Completo del Server (server.py)

Di seguito il codice sorgente completo di `server.py` comprensivo di parsing `.docx` e chiamata REST a Gemini 3.7:

```python
import http.server
import json
import os
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
import urllib.request
import urllib.error

PORT = 8080

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

def get_bank_context(bankId):
    policies_path = "/Users/alessandrofassina/Desktop/broker flow/data/policies.json"
    structured_rules = ""
    try:
        with open(policies_path, 'r', encoding='utf-8') as f:
            policies = json.load(f)
            if bankId in policies:
                p = policies[bankId]
                structured_rules = f"PARAMETRI STRUTTURATI BANCA {p.get('name', bankId)}:\n"
                for k, v in p.items():
                    if k != 'mriGrid':
                        structured_rules += f"- {k}: {v}\n"
    except Exception as e:
        structured_rules = f"[Errore caricamento regole strutturate: {str(e)}]\n"

    doc_texts = []
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    doc_paths = []
    if bankId == "mps":
        doc_paths = [
            os.path.join(workspace, "criteri banche template/Profilo_Operativo_Banca_MPS.docx"),
            os.path.join(workspace, "documenti/Motore documentale Monte dei paschi.docx")
        ]
    elif bankId == "ing":
        doc_paths = [
            os.path.join(workspace, "criteri banche template/Profilo_Operativo_Banca_ING.docx")
        ]
        
    for path in doc_paths:
        if os.path.exists(path):
            doc_texts.append(f"ESTRATTO DOCUMENTO UFFICIALE ({os.path.basename(path)}):\n" + extract_docx_text(path))

    context = structured_rules + "\n\n" + "\n\n".join(doc_texts)
    return context

def query_gemini(api_key, context, question):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key={api_key}"
    
    prompt = f"""
Sei l'AI Assistant di BrokerFlow. Rispondi alle domande dell'utente riguardanti la policy della banca selezionata basandoti sulle regole fornite di seguito.

REGOLE E POLICY DELLA BANCA DI RIFERIMENTO (CONTESTO):
{context}

DOMANDA UTENTE:
{question}

ISTRUZIONI PER LA RISPOSTA:
1. Rispondi in italiano in modo chiaro, conciso e professionale.
2. Rispondi basandoti esclusivamente sul contesto fornito sopra. Se il contesto non contiene le informazioni necessarie per rispondere alla domanda, dichiara onestamente che la policy in nostro possesso non specifica questo dettaglio.
3. Se appropriato, evidenzia i limiti massimi o minimi o requisiti specifici utilizzando il grassetto (**testo**).
4. Non inventare o ipotizzare regole non esplicitamente menzionate nel contesto.
"""
    
    body = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    req_data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=35) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidates = res_data.get('candidates', [])
            if candidates:
                content = candidates[0].get('content', {})
                parts = content.get('parts', [])
                if parts:
                    return parts[0].get('text', '')
            return "Errore: risposta vuota o formato non valido dalle API Gemini."
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode('utf-8')
        try:
            err_json = json.loads(error_msg)
            message = err_json.get('error', {}).get('message', str(e))
            return f"Errore HTTP delle API Gemini ({e.code}): {message}"
        except:
            return f"Errore HTTP delle API Gemini ({e.code}): {error_msg}"
    except Exception as e:
        return f"Errore di connessione o timeout: {str(e)}"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/save-policies':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                policies_path = "/Users/alessandrofassina/Desktop/broker flow/data/policies.json"
                with open(policies_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                
                sync_script = "/Users/alessandrofassina/.gemini/antigravity/brain/27f83c5d-a235-477c-a1ba-68263c4f1df0/scratch/sync_policies.py"
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
                branches_path = "/Users/alessandrofassina/Desktop/broker flow/data/branches.json"
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
                if not api_key or api_key.strip() == "" or api_key.strip().lower() in ("null", "undefined"):
                    api_key = os.environ.get('GEMINI_API_KEY')
                
                if not api_key:
                    raise Exception("Chiave API Google Gemini non configurata. Impostala cliccando su 'Imposta' in alto a destra nella chat.")
                if not bank_id or not question:
                    raise Exception("Parametri bankId o question mancanti.")
                
                context = get_bank_context(bank_id)
                answer = query_gemini(api_key, context, question)
                
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
                response = {
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def load_env():
    env_path = "/Users/alessandrofassina/Desktop/broker flow/.env"
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    parts = line.split('=', 1)
                    os.environ[parts[0].strip()] = parts[1].strip()
        print("Loaded environment variables from .env")

# Run the server
if __name__ == '__main__':
    # Make sure we change directory to the project folder
    os.chdir("/Users/alessandrofassina/Desktop/broker flow")
    
    load_env()
    
    server_address = ('', PORT)
    handler = CustomHandler
    
    print(f"Starting custom server on port {PORT}...")
    httpd = http.server.ThreadingHTTPServer(server_address, handler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()
```

---

## 4. Modifiche Chiave del Frontend

### 4.1 Modifiche in `index.html`
* **Query Caching**: Modificati i parametri di versione a `v320` per stylesheet e script (es. `styles.css?v=20260731_v320`, `engine.js?v=20260731_v320`, `app.js?v=20260731_v320`).
* **Sezione Secondo Reddito (Q10)**: Aggiunta la casella `#wiz-q10-has-second-income` e il contenitore `#group-second-income-container` contenente tutti i relativi campi duplicati suffissati da `-2` (es. `wiz-q10-cu1-2` fino a `wiz-q10-locazione-netto-2` per i canoni d'affitto).
* **Sezione Ulteriori Soggetti**: Racchiusa all'interno di un div identificato da `id="wiz-coapplicants-guarantors-section"` posizionato in fondo allo step 2.
* **Modale Policy & AI**: Aggiunto l'elemento `#wiz-bank-policy-modal` in fondo alla pagina (stile pop-up a schermo intero) strutturato a 2 colonne.

### 4.2 Modifiche in `app.js`
* **Visibilità Sezione Cointestatari**: Gestita all'interno della navigazione del wizard:
  ```javascript
  const coappGuar = document.getElementById("wiz-coapplicants-guarantors-section");
  if (coappGuar) {
      coappGuar.style.display = (stepNum === 2) ? "block" : "none";
  }
  ```
* **Calcolo del Secondo Reddito**: Aggiunto il parser analitico delle voci del secondo reddito (LM36, CUD, canoni affitto) all'interno di `saveCurrentSubject`, serializzando i dati nell'array `incomes` del soggetto e sommandoli al netto principale.
* **Tasto Apertura Policy & AI**: Aggiunto all'interno di `updateBancheListByComune` per caricare il modale `#wiz-bank-policy-modal` valorizzando i dati e attivando il chat assistant.
* **Gestione Stato API**: Gestita in `window.updateApiKeyStatus()` per colorare di verde l'indicatore mostrando `"Chiave Centralizzata"` se non sono presenti chiavi locali nel browser.

---

## 5. Modifiche al Database delle Policy (data/policies.json)
Per abilitare il secondo reddito da affitto nelle banche abilitate, è stata aggiunta la tipologia `"locazione"` all'elenco `allowedContracts` per le banche:
* **Monte dei Paschi di Siena (mps)**
* **BPER Banca (bper)**
* **Mediobanca Premier (chebanca)**

*Nota: Ricordarsi di eseguire `/scratch/sync_policies.py` dopo ogni modifica a `policies.json` per ri-sincronizzare `engine.js`.*

---

## 6. Procedura di Ripristino in Caso di Crash
In caso di reset totale dell'ambiente di lavoro:
1. Assicurarsi che il file `.env` esista e contenga la chiave Gemini valida.
2. Sostituire il codice di `server.py` con quello riportato nella **Sezione 3** di questo manuale.
3. Avviare il server in background tramite terminale:
   ```bash
   python3 server.py
   ```
4. Aprire `http://localhost:8080` nel browser per caricare l'interfaccia.
