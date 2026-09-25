import os
import sys
import time

workspace = "/Users/alessandrofassina/Desktop/broker flow"
if workspace not in sys.path:
    sys.path.insert(0, workspace)
qa_path = os.path.join(workspace, "qa_suite")
if qa_path not in sys.path:
    sys.path.insert(0, qa_path)

import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

def run_ui_tests():
    port = 8998
    handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{port}"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
            page = browser.new_page()
            page.goto(base_url, wait_until="domcontentloaded")
            page.wait_for_timeout(1000)

            # Authenticate if login overlay is visible
            login_visible = page.evaluate("""() => {
                const el = document.getElementById('module-login');
                return el && window.getComputedStyle(el).display !== 'none';
            }""")
            if login_visible:
                page.evaluate("window.quickLoginAs && window.quickLoginAs('dev@brokerflow.it')")
                page.wait_for_timeout(800)

            # Switch to Engine module and go to Step 3
            page.evaluate("window.switchCrmModule && window.switchCrmModule('engine')")
            page.wait_for_timeout(500)
            page.evaluate("window.goToStep && window.goToStep(3)")
            page.wait_for_timeout(800)

            results = []
            def check(cond, desc):
                results.append({ "passed": bool(cond), "desc": desc })

            # 1. Test Pluri-Ipoteca checkbox toggle
            has_prop_cb = page.locator("#wiz-p3-has-second-property")
            box_second_prop = page.locator("#box-secondo-immobile")
            check(box_second_prop.is_hidden(), "Box secondo immobile is initially hidden")

            has_prop_cb.check()
            page.wait_for_timeout(200)
            check(box_second_prop.is_visible(), "Box secondo immobile becomes visible when checkbox checked")

            # 2. Test Second Property Mortgage details toggle
            second_mort_select = page.locator("#wiz-p3-second-has-mortgage")
            box_second_mort = page.locator("#box-second-mortgage-details")
            check(box_second_mort.is_hidden(), "Box second mortgage details is initially hidden")

            second_mort_select.select_option("si")
            page.wait_for_timeout(200)
            check(box_second_mort.is_visible(), "Box second mortgage details becomes visible when mortgage is 'si'")

            # 3. Test Acquisto + Sostituzione auto-opens second property and mortgage
            has_prop_cb.uncheck()
            page.wait_for_timeout(200)
            check(box_second_prop.is_hidden(), "Box secondo immobile hides when unchecked")

            fin_select = page.locator("#wiz-p3-finalita")
            fin_select.select_option("acquisto_sostituzione")
            page.wait_for_timeout(200)
            check(has_prop_cb.is_checked(), "Acquisto + Sostituzione auto-checks has-second-property")
            check(box_second_prop.is_visible(), "Acquisto + Sostituzione reveals box-secondo-immobile")
            check(box_second_mort.is_visible(), "Acquisto + Sostituzione reveals box-second-mortgage-details")

            # 4. Test Liquidità Pura > 50% warning banner
            val_input = page.locator("#p3-valore-field")
            mutuo_input = page.locator("#p3-importo-field")
            badge_suggerimento = page.locator("#badge-pluri-suggerimento")
            fin_select.select_option("liquidita")
            page.wait_for_timeout(200)
            liq_wrapper = page.locator("#group-p3-liquidita-pura-wrapper")
            check(liq_wrapper.is_visible(), "Liquidità pura input is visible for Sostituzione")

            liq_input = page.locator("#wiz-p3-liquidita-pura")
            mutuo_input.fill("100000")
            liq_input.fill("60000") # 60% > 50%
            liq_input.dispatch_event("input")
            page.wait_for_timeout(300)
            alert_liq = page.locator("#alert-liquidita-50-warning")
            check(alert_liq.is_visible(), "Warning alert appears when pure liquidity exceeds 50% of loan amount")

            # 5. Test LTV > 80% badge suggestion
            badge_suggerimento = page.locator("#badge-pluri-suggerimento")
            fin_select.select_option("acquisto")
            has_prop_cb.uncheck()
            val_input.fill("200000")
            mutuo_input.fill("180000") # 90% LTV
            mutuo_input.dispatch_event("input")
            page.wait_for_timeout(300)
            check(badge_suggerimento.is_visible(), "LTV > 80% shows Pluri-Ipoteca opportunity badge")

            # === Transition to Step 2 (Dati Anagrafici, Reddito, Risparmi, Coobbligati) ===
            page.evaluate("window.goToStep && window.goToStep(2)")
            page.wait_for_timeout(800)

            # 6. Test Patrimonio Mobiliare & closing costs display
            patrimonio_input = page.locator("#wiz-patrimonio-mobiliare")
            stima_spese = page.locator("#lbl-stima-spese-atto")
            badge_copertura = page.locator("#badge-copertura-spese")

            patrimonio_input.fill("20000")
            patrimonio_input.dispatch_event("input")
            page.wait_for_timeout(300)

            stima_text = stima_spese.inner_text()
            check("16.000" in stima_text or "16,000" in stima_text or "16000" in stima_text, f"Stima spese atto calculates ~8% (€16.000): got '{stima_text}'")
            badge_text = badge_copertura.inner_text()
            check("Copertura spese adeguata" in badge_text or "Copertura OK" in badge_text or "Capienza Totale" in badge_text, f"Badge copertura indicates adequate savings: got '{badge_text}'")

            # 7. Test Seasonal Worker fields in Question 10
            contratto_select = page.locator("#wiz-q10-dip-tipo-contratto")
            if contratto_select.count() > 0:
                contratto_select.select_option("tempo_determinato")
                page.wait_for_timeout(200)
                box_stagionale = page.locator("#group-q10-stagionale-box")
                check(box_stagionale.is_visible(), "Seasonal box appears for tempo determinato")

                stagionale_cb = page.locator("#wiz-q10-dip-is-stagionale")
                box_stagioni_consecutive = page.locator("#group-q10-stagioni-consecutive")
                stagionale_cb.check()
                page.wait_for_timeout(200)
                check(box_stagioni_consecutive.is_visible(), "Consecutive seasons input appears when seasonal worker is checked")

            # 8. Test Coapplicant Sibling toggle
            add_coapp_btn = page.locator("#btn-add-coapp")
            if add_coapp_btn.count() > 0:
                add_coapp_btn.click()
                page.wait_for_timeout(300)
                coapp_rel = page.locator(".wiz-coapp-relazione").first
                if coapp_rel.count() > 0:
                    coapp_rel.select_option("fratello_sorella")
                    page.wait_for_timeout(200)
                    sibling_box = page.locator(".coapp-fratello-nucleo-autonomo").first
                    check(sibling_box.is_visible(), "Sibling autonomous household toggle appears for fratello_sorella")

            browser.close()

            print("\n========================================================")
            print("          UI BRANCHING TEST EXECUTION RESULTS           ")
            print("========================================================\n")
            passed = sum(1 for r in results if r["passed"])
            total = len(results)
            for r in results:
                icon = "✅" if r["passed"] else "❌"
                print(f"{icon} {r['desc']}")

            print(f"\nSummary: {passed}/{total} UI tests passed.")
            if passed == total:
                print("\n🎉 ALL UI BRANCHING TESTS PASSED SUCCESSFULLY!")
                sys.exit(0)
            else:
                print("\n⚠️ SOME UI TESTS FAILED.")
                sys.exit(1)
    finally:
        httpd.shutdown()

if __name__ == "__main__":
    run_ui_tests()
