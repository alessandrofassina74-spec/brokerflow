#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import time
import ssl

WORKSPACE_DIR = "/Users/alessandrofassina/Desktop/broker flow"
sys.path.append(os.path.join(WORKSPACE_DIR, "scripts"))

def main():
    print("=== AVVIO TEST END-TO-END CHAT & SICUREZZA ===")
    
    # 1. Start server locally in a test thread on port 8086
    from gui_launcher import ParserGUIHandler
    import http.server
    import threading
    
    def start_test_server():
        httpd = http.server.ThreadingHTTPServer(('', 8086), ParserGUIHandler)
        httpd.serve_forever()
    
    server_thread = threading.Thread(target=start_test_server, daemon=True)
    server_thread.start()
    
    time.sleep(2)  # Wait for server to boot
    
    # Load API key
    from manage_policies import load_env
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Errore: GEMINI_API_KEY non trovata.")
        sys.exit(1)
        
    url_start = "http://localhost:8086/api/chat/start"
    url_message = "http://localhost:8086/api/chat/message"
    
    # Test case: Permanent rule for BPER
    payload_start = {
        "text": "Per BPER il DSR massimo passa al 40%",
        "model": "gemini-3.6-flash"
    }
    
    print("\n1. Invio messaggio iniziale chat...")
    req = urllib.request.Request(
        url_start,
        data=json.dumps(payload_start).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    ctx = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            res = json.loads(response.read().decode('utf-8'))
            print("Risposta ricevuta:")
            print(json.dumps(res, indent=2, ensure_ascii=False))
            
            # Assert that the status is clarification_needed (must ask if permanent or temporary)
            assert res["status"] == "clarification_needed", "Dovrebbe chiedere conferma del tipo modifica!"
            assert "permanente" in res["question"].lower() and "temporanea" in res["question"].lower(), "Dovrebbe includere la domanda permanente/temporanea!"
            
            session_id = res["sessionId"]
    except Exception as e:
        print(f"Errore durante il test di avvio: {e}")
        sys.exit(1)
        
    # Send message to confirm it is permanent
    print("\n2. Invio risposta di conferma (Permanente)...")
    payload_msg = {
        "sessionId": session_id,
        "text": "È una modifica permanente",
        "model": "gemini-3.6-flash"
    }
    
    req_msg = urllib.request.Request(
        url_message,
        data=json.dumps(payload_msg).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req_msg, context=ctx) as response:
            res_msg = json.loads(response.read().decode('utf-8'))
            print("Risposta ricevuta:")
            print(json.dumps(res_msg, indent=2, ensure_ascii=False))
            
            assert res_msg["status"] == "ready_to_save", "Dovrebbe salvare la regola!"
            assert res_msg["extracted_updates"].get("maxDsr") == 0.40, "DSR estratto dovrebbe essere 0.40!"
            print("\n[OK] Test Modifica Permanente superato con successo!")
    except Exception as e:
        print(f"Errore durante il test di conferma permanente: {e}")
        sys.exit(1)
        
    # Test case 2: Temporary rule auto-cleanup
    print("\n3. Test auto-cleanup regole temporanee (scadute)...")
    from manage_policies import BANK_POLICIES_DIR, cmd_align
    
    bper_file = os.path.join(BANK_POLICIES_DIR, "bper_policy.json")
    with open(bper_file, "r") as f:
        bper_data = json.load(f)
        
    # Inject a manually expired promotion
    expired_promo = {
        "id": "promo_bper_test_expired",
        "description": "Fino al 15/08/2026 tasso fisso scontato al 3%",
        "expiresAt": "2026-08-15",
        "updates": {
            "maxDsr": 0.50
        }
    }
    bper_data["promotions"] = [expired_promo]
    with open(bper_file, "w") as f:
        json.dump(bper_data, f, indent=4)
        
    print("Iniezione promozione scaduta (15/08/2026) in BPER.")
    
    # Run alignment (which calls cleanup_expired_promotions)
    cmd_align()
    
    # Verify that the expired promotion was deleted
    with open(bper_file, "r") as f:
        bper_data_after = json.load(f)
        
    promos = bper_data_after.get("promotions", [])
    assert len(promos) == 0, "La promozione scaduta avrebbe dovuto essere eliminata!"
    print("[OK] Test Auto-Cleanup superato con successo!")
    
    print("\n=== TUTTI I TEST DELLA CHAT SONO STATI SUPERATI! ===")

if __name__ == "__main__":
    main()
