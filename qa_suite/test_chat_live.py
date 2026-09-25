import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKSPACE not in sys.path:
    sys.path.insert(0, WORKSPACE)

from qa_suite.test_server import TestServer

def run_chat_live_test():
    print("\n" + "="*75)
    print("🤖 [QA CHAT TEST] Avvio Collaudo Live Chat Policy Bancarie & AI Advisor")
    print("   Modalità: Browser Visibile a Schermo (--headed)")
    print("   Verifica: Connessione API ChatGPT / Multi-Banca, domande reali, streaming UI")
    print("="*75)

    server = TestServer(WORKSPACE, port=8099)
    base_url = server.start()
    print(f"📡 Server di test attivo su: {base_url}")

    screenshots_dir = os.path.join(WORKSPACE, "qa_suite", "reports", "screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)
    report_path = os.path.join(WORKSPACE, "qa_suite", "reports", "chat_policies_test_report.json")

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "RUNNING",
        "tests": []
    }

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=False,
                slow_mo=500,
                args=["--disable-web-security", "--no-sandbox", "--start-maximized"]
            )
            context = browser.new_context(viewport={"width": 1440, "height": 920})
            page = context.new_page()

            # Listen to console logs and errors
            page.on("console", lambda msg: print(f"  [Browser Console] {msg.type}: {msg.text}"))
            page.on("pageerror", lambda err: print(f"  [Browser Error] {err}"))

            print("\n🌐 [1/4] Apertura applicazione BrokerFlow...")
            page.goto(base_url)
            page.wait_for_load_state("networkidle")
            time.sleep(1.5)

            # ==========================================================
            # TEST 1: CHAT SCHEDA POLICY BANCA (ING BANK)
            # ==========================================================
            print("\n🏦 [2/4] Collaudo Chat Scheda Policy Singola Banca (ING)...")
            
            # Open bank policy modal for ING
            page.evaluate("window.openBankPolicyModal('ing')")
            page.wait_for_selector("#wiz-bank-policy-modal", state="visible", timeout=10000)
            time.sleep(1.5)

            questions_policy = [
                "Qual è l'età massima a fine mutuo per il richiedente e per il garante in ING?",
                "Qual è la percentuale massima LTV per l'acquisto prima casa con e senza Consap?"
            ]

            test1_results = {"suite": "Bank Policy Detail Chat (ING)", "questions": []}

            for idx, q in enumerate(questions_policy, 1):
                print(f"   💬 Domanda {idx}: '{q}'")
                chat_input = page.locator("#wiz-policy-chat-input")
                chat_input.fill(q)
                time.sleep(0.5)
                page.locator("#wiz-policy-chat-send").click()

                # Wait for response
                print("   ⏳ Attesa risposta dall'Assistente AI...")
                time.sleep(4.0)

                # Get all messages in chat
                msgs = page.locator("#wiz-policy-chat-messages > div").all_inner_texts()
                last_msg = msgs[-1] if msgs else "Nessun messaggio"
                print(f"   🤖 Risposta ricevuta:\n      {last_msg[:200]}...")

                test1_results["questions"].append({
                    "question": q,
                    "response": last_msg
                })
                time.sleep(2.0)

            screenshot1_path = os.path.join(screenshots_dir, "chat_policy_ing_screen.png")
            page.screenshot(path=screenshot1_path)
            test1_results["screenshot"] = screenshot1_path
            report["tests"].append(test1_results)

            # Close modal
            page.locator("button:has-text('✕')").first.click()
            time.sleep(1.0)

            # ==========================================================
            # TEST 2: CHAT GLOBAL MULTI-BANK AI ADVISOR
            # ==========================================================
            print("\n🤖 [3/4] Collaudo Global Multi-Bank AI Advisor Chat...")
            
            page.evaluate("window.openMultiBankChat()")
            page.wait_for_selector("#wiz-multibank-chat-modal", state="visible", timeout=10000)
            time.sleep(1.5)

            questions_multibank = [
                "Quali banche applicano la regola dell'età massima garante a 80 anni ai due terzi della durata del mutuo?",
                "Quali banche finanziano oltre l'80% LTV (es. 90%, 95% o 100%) per la prima casa senza Consap?"
            ]

            test2_results = {"suite": "Global Multi-Bank AI Advisor Chat", "questions": []}

            for idx, q in enumerate(questions_multibank, 1):
                print(f"   💬 Domanda Advisor {idx}: '{q}'")
                mb_input = page.locator("#wiz-multibank-chat-input")
                mb_input.fill(q)
                time.sleep(0.5)
                page.locator("#wiz-multibank-chat-send").click()

                print("   ⏳ Attesa elaborazione comparativa Multi-Banca...")
                time.sleep(4.5)

                msgs = page.locator("#wiz-multibank-chat-messages > div").all_inner_texts()
                last_msg = msgs[-1] if msgs else "Nessun messaggio"
                print(f"   🤖 Risposta Advisor:\n      {last_msg[:250]}...")

                test2_results["questions"].append({
                    "question": q,
                    "response": last_msg
                })
                time.sleep(2.0)

            screenshot2_path = os.path.join(screenshots_dir, "chat_multibank_advisor_screen.png")
            page.screenshot(path=screenshot2_path)
            test2_results["screenshot"] = screenshot2_path
            report["tests"].append(test2_results)

            # Keep window visible for inspection
            print("\n🔍 [4/4] Collaudo completato con successo. Finestra mantenuta aperta per revisione visiva...")
            time.sleep(3.0)
            browser.close()

            report["status"] = "PASSED"

    except Exception as e:
        print(f"\n❌ Errore durante il test live: {e}")
        report["status"] = "FAILED"
        report["error"] = str(e)
    finally:
        server.stop()
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"📄 Report salvato in: {report_path}\n")

if __name__ == "__main__":
    run_chat_live_test()
