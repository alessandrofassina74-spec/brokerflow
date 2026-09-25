import json
import os
import sys
import time
from playwright.sync_api import sync_playwright
from test_server import TestServer

def test_mps_sussistenza(headed=True):
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    port = 8099
    server = TestServer(workspace, port)
    base_url = server.start()
    
    print("\n" + "="*70)
    print("🏛️ [QA TEST SUSSISTENZA MPS] Test Soglia di Sussistenza Minima (MRI)")
    print("   Verifica su 1, 2, 3, 4, 5 componenti del nucleo familiare")
    print("="*70)

    results = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=not headed,
                slow_mo=300 if headed else 0,
                args=["--disable-web-security", "--no-sandbox"]
            )
            context = browser.new_context(viewport={"width": 1400, "height": 950})
            page = context.new_page()

            page.goto(f"{base_url}/index.html", wait_until="domcontentloaded", timeout=15000)
            time.sleep(1.0)

            # Login if needed
            page.evaluate("if (window.quickLoginAs) window.quickLoginAs('dev@brokerflow.it')")
            time.sleep(0.8)

            # Switch to Engine Wizard
            page.evaluate("window.switchCrmModule && window.switchCrmModule('engine')")
            time.sleep(0.6)
            page.evaluate("window.selectMortgageType && window.selectMortgageType('acquisto')")
            time.sleep(0.4)
            page.evaluate("window.goToStep && window.goToStep(2)")
            time.sleep(0.8)

            # Set Income: € 2.000/mese, Rata mutuo € 650 (Residuo € 1.350)
            page.evaluate("""() => {
                if (document.getElementById('wiz-q10-macro-categoria')) {
                    document.getElementById('wiz-q10-macro-categoria').value = 'dipendente';
                    if (window.handleMacroCatChange) window.handleMacroCatChange('dipendente');
                }
                if (document.getElementById('wiz-q10-netto-mensile')) {
                    document.getElementById('wiz-q10-netto-mensile').value = 2000;
                }
                if (document.getElementById('wiz-q10-dip-netto')) {
                    document.getElementById('wiz-q10-dip-netto').value = 2000;
                }
                if (document.getElementById('wiz-q10-cu1')) {
                    document.getElementById('wiz-q10-cu1').value = 2000 * 12 * 1.3;
                }
                if (document.getElementById('wiz-q10-cu6')) {
                    document.getElementById('wiz-q10-cu6').value = 365;
                }
                if (typeof saveCurrentSubject === 'function') {
                    saveCurrentSubject(true);
                }
            }""")

            # Run test across 1, 2, 3, 4, 5 components
            for n in [1, 2, 3, 4, 5]:
                print(f"🔄 Test UI con {n} componente/i nucleo familiare...")
                page.evaluate("window.goToStep && window.goToStep(2)")
                time.sleep(0.4)
                page.evaluate(f"""(num) => {{
                    if (document.getElementById('wiz-persone-nucleo')) {{
                        document.getElementById('wiz-persone-nucleo').value = num;
                    }}
                    if (document.getElementById('wiz-q5-figli')) {{
                        document.getElementById('wiz-q5-figli').value = num > 1 ? 'si' : 'no';
                    }}
                    if (document.getElementById('wiz-q5-num-figli')) {{
                        document.getElementById('wiz-q5-num-figli').value = Math.max(0, num - 1);
                    }}
                    if (window.goToStep) window.goToStep(3);
                }}""", n)
                time.sleep(0.5)

                page.evaluate("""() => {
                    if (document.getElementById('p3-importo-field')) document.getElementById('p3-importo-field').value = 140000;
                    if (document.getElementById('p3-valore-field')) document.getElementById('p3-valore-field').value = 180000;
                    if (document.getElementById('wiz-p3-durata')) document.getElementById('wiz-p3-durata').value = 25;
                    if (window.updateCalculations) window.updateCalculations();
                }""")
                time.sleep(1.2)

                # Extract MPS card status
                mps_info = page.evaluate("""() => {
                    const cards = Array.from(document.querySelectorAll('#comparison-cards-container > div'));
                    const mpsCard = cards.find(c => c.innerText.includes('Monte dei Paschi') || c.innerText.includes('MPS'));
                    if (!mpsCard) return { found: false, text: 'MPS non presente' };
                    
                    const text = mpsCard.innerText;
                    const isKo = text.includes('Non Fattibile') || text.includes('KO') || text.includes('non rispetta');
                    return {
                        found: true,
                        isKo: isKo,
                        snippet: text.substring(0, 300).replace(/\\n/g, ' ')
                    };
                }""")

                results.append({
                    "nucleo": n,
                    "mps_result": mps_info
                })
                time.sleep(0.8)

            if headed:
                time.sleep(2.0)
            browser.close()

    except Exception as e:
        print(f"❌ Errore durante il test: {e}")
    finally:
        server.stop()

    return results

if __name__ == "__main__":
    test_mps_sussistenza(headed=True)
