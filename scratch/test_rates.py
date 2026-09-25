#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import time
import ssl
import http.server
import threading

WORKSPACE_DIR = "/Users/alessandrofassina/Desktop/broker flow"
sys.path.append(os.path.join(WORKSPACE_DIR, "scripts"))

def main():
    print("=== AVVIO TEST END-TO-END IMPORTAZIONE TABELLE TASSI ===")
    
    # 1. Start isolated test server on port 8087
    from gui_launcher import ParserGUIHandler
    
    def start_test_server():
        httpd = http.server.ThreadingHTTPServer(('', 8087), ParserGUIHandler)
        httpd.serve_forever()
        
    server_thread = threading.Thread(target=start_test_server, daemon=True)
    server_thread.start()
    time.sleep(2)
    
    # Load API key
    from manage_policies import load_env
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Errore: GEMINI_API_KEY non trovata.")
        sys.exit(1)
        
    url_parse = "http://localhost:8087/api/rates/parse"
    url_chat = "http://localhost:8087/api/rates/chat"
    url_confirm = "http://localhost:8087/api/rates/confirm"
    
    # Test 1: Ambiguity in product type (fixed vs variable)
    ambiguous_text = "Offerta BPER Mutuo Promo Casa 2026: LTV max 80%, Durate: da 10 a 20 anni spread 0.25%, da 21 a 30 anni spread 0.35%."
    payload_parse = {
        "bankId": "bper",
        "rawText": ambiguous_text,
        "model": "gemini-3.7-flash"
    }
    
    print("\n1. Invio testo ambiguo all'endpoint /api/rates/parse...")
    req = urllib.request.Request(
        url_parse,
        data=json.dumps(payload_parse).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    ctx = ssl._create_unverified_context()
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            res = json.loads(response.read().decode('utf-8'))
            print("Risposta ricevuta:")
            print(json.dumps(res, indent=2, ensure_ascii=False))
            session_id = res["sessionId"]
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        print("Server error payload:", e.read().decode('utf-8'))
        sys.exit(1)
        
    # Test 2: If clarification was requested, respond to it
    if res.get("status") == "clarification_needed":
        print("\n[OK] L'AI ha correttamente rilevato l'ambiguità e chiesto chiarimenti:")
        print(f"Domanda: {res['question']}")
        
        print("\n2. Invio chiarimento via chat...")
        payload_chat = {
            "sessionId": session_id,
            "text": "Si tratta di un mutuo a Tasso Fisso indicizzato a IRS per finalità acquisto prima casa.",
            "model": "gemini-3.7-flash"
        }
        req_chat = urllib.request.Request(
            url_chat,
            data=json.dumps(payload_chat).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req_chat, context=ctx) as chat_res:
            res = json.loads(chat_res.read().decode('utf-8'))
            print("Risposta post-chiarimento:")
            print(json.dumps(res, indent=2, ensure_ascii=False))
            
    assert res.get("status") == "preview_ready", "Lo stato deve essere 'preview_ready' dopo il chiarimento!"
    assert len(res.get("products", [])) > 0, "Deve essere stato estratto almeno 1 prodotto!"
    print(f"\n[OK] Anteprima pronta con {len(res['products'])} prodotti!")
    
    # Test 3: Confirmation and saving
    print("\n3. Invio richiesta di conferma all'endpoint /api/rates/confirm...")
    payload_confirm = {
        "bankId": "bper",
        "products": res["products"]
    }
    req_confirm = urllib.request.Request(
        url_confirm,
        data=json.dumps(payload_confirm).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req_confirm, context=ctx) as confirm_res:
        res_conf = json.loads(confirm_res.read().decode('utf-8'))
        print("Risposta conferma:")
        print(json.dumps(res_conf, indent=2, ensure_ascii=False))
        assert res_conf.get("status") == "success", "Il salvataggio deve avere status success!"
        print("\n[OK] Sincronizzazione a sistema confermata con successo!")
        
    # Verify engine.js and products.json
    from manage_rates import PRODUCTS_JSON_PATH, ENGINE_JS_PATH
    with open(PRODUCTS_JSON_PATH, "r") as f:
        prods_data = json.load(f)
    assert "bper" in prods_data, "BPER deve essere presente in products.json!"
    
    with open(ENGINE_JS_PATH, "r") as f:
        engine_content = f.read()
    assert "bper" in engine_content and "Promo Casa" in engine_content, "Il nuovo prodotto deve essere sincronizzato in engine.js!"
    print("[OK] Sincronizzazione file verificata!")
    
    # Clean up: restore last_ok
    from manage_policies import restore_backup
    restore_backup("last_ok")
    print("\n=== TUTTI I TEST DEI TASSI SONO STATI SUPERATI CON SUCCESSO! ===")

if __name__ == "__main__":
    main()
