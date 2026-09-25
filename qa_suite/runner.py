import json
import os
import sys
import time
from playwright.sync_api import sync_playwright
from test_server import TestServer

class QARunner:
    def __init__(self, workspace_path="/Users/alessandrofassina/Desktop/broker flow", port=8099, headed=False):
        self.workspace_path = workspace_path
        self.port = port
        self.headed = headed
        self.server = None
        self.base_url = f"http://127.0.0.1:{self.port}"
        self.reports_dir = os.path.join(self.workspace_path, "qa_suite", "reports")
        self.screenshots_dir = os.path.join(self.reports_dir, "screenshots")
        os.makedirs(self.screenshots_dir, exist_ok=True)

    def start_server(self):
        self.server = TestServer(self.workspace_path, self.port)
        return self.server.start()

    def stop_server(self):
        if self.server:
            self.server.stop()

    def run_scenario(self, scenario_path):
        with open(scenario_path, "r", encoding="utf-8") as f:
            scenario = json.load(f)

        scenario_name = scenario.get("name", "Scenario")
        print(f"\n========================================================")
        print(f"🚀 [QA AGENT] Avvio Test: {scenario_name}")
        print(f"========================================================")

        console_logs = []
        page_errors = []

        self.start_server()
        report = {
            "scenario": scenario_name,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "UNKNOWN",
            "console_errors": [],
            "page_errors": [],
            "calculated_results": {},
            "banks_feasible": [],
            "banks_unfeasible": [],
            "screenshot_path": None,
            "error_details": None
        }

        delay_mult = 1.8 if self.headed else 0.4

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=not self.headed,
                    slow_mo=350 if self.headed else 0,
                    args=["--disable-web-security", "--no-sandbox"]
                )
                context = browser.new_context(viewport={"width": 1400, "height": 950})
                page = context.new_page()

                # Capture console messages
                def on_console(msg):
                    if msg.type in ["error"]:
                        console_logs.append(f"[{msg.type.upper()}] {msg.text}")
                page.on("console", on_console)

                # Capture uncaught page errors
                def on_page_error(err):
                    page_errors.append(str(err))
                page.on("pageerror", on_page_error)

                # 1. Open app
                print("🌐 [1/6] Apertura Chrome e caricamento BrokerFlow...")
                page.goto(f"{self.base_url}/index.html", wait_until="domcontentloaded", timeout=15000)
                time.sleep(1.0 * delay_mult)

                # 2. Authenticate if login overlay is visible
                print("🔑 [2/6] Verifica ed esecuzione Login...")
                login_visible = page.evaluate("""() => {
                    const el = document.getElementById('module-login');
                    return el && window.getComputedStyle(el).display !== 'none';
                }""")
                if login_visible:
                    page.evaluate("window.quickLoginAs && window.quickLoginAs('dev@brokerflow.it')")
                    time.sleep(0.8 * delay_mult)

                # 3. Switch to Engine Wizard
                print("⚙️ [3/6] Navigazione modulo Calcolo & Policy...")
                page.evaluate("window.switchCrmModule && window.switchCrmModule('engine')")
                time.sleep(0.8 * delay_mult)

                # 4. Fill Stage 1: Tipo Mutuo
                inputs = scenario.get("inputs", {})
                loan_inputs = inputs.get("loan", {})
                applicant_inputs = inputs.get("applicant", {})

                print("🏠 [4/6] Selezione tipologia operazione (Fase 1)...")
                m_type = inputs.get("mortgage_type", "acquisto")
                page.evaluate(f"window.selectMortgageType && window.selectMortgageType('{m_type}')")
                time.sleep(0.5 * delay_mult)
                page.evaluate("window.goToStep && window.goToStep(2)")
                time.sleep(0.8 * delay_mult)

                # 5. Fill Stage 2: Dati Richiedente & Reddito
                print(f"👤 [5/6] Compilazione dati cliente: {applicant_inputs.get('nome')} {applicant_inputs.get('cognome')} (Nascita: {applicant_inputs.get('data_nascita')}, Reddito: € {applicant_inputs.get('netto_mensile')}/mese)...")
                page.evaluate(f"""(app) => {{
                    if (document.getElementById('wiz-q1-nome')) document.getElementById('wiz-q1-nome').value = app.nome || 'Mario';
                    if (document.getElementById('wiz-q2-cognome')) document.getElementById('wiz-q2-cognome').value = app.cognome || 'Rossi';
                    if (document.getElementById('wiz-q3-data-nascita')) document.getElementById('wiz-q3-data-nascita').value = app.data_nascita || '1990-01-01';
                    
                    if (document.getElementById('wiz-q4-stato-civile')) {{
                        document.getElementById('wiz-q4-stato-civile').value = app.stato_civile || 'celibe';
                        if (window.toggleMarriageFields) window.toggleMarriageFields(app.stato_civile || 'celibe');
                    }}
                    
                    if (app.figli === 'si') {{
                        if (document.getElementById('wiz-q5-figli')) {{
                            document.getElementById('wiz-q5-figli').value = 'si';
                            const numFigliEl = document.getElementById('wiz-q5-num-figli');
                            if (numFigliEl) numFigliEl.value = app.num_figli || 1;
                            const grp = document.getElementById('group-figli-count');
                            if (grp) grp.style.display = 'block';
                        }}
                    }} else {{
                        if (document.getElementById('wiz-q5-figli')) {{
                            document.getElementById('wiz-q5-figli').value = 'no';
                            const grp = document.getElementById('group-figli-count');
                            if (grp) grp.style.display = 'none';
                        }}
                    }}

                    if (document.getElementById('wiz-persone-nucleo')) {{
                        document.getElementById('wiz-persone-nucleo').value = app.persone_nucleo || 1;
                    }}
                    if (document.getElementById('wiz-prov-immobile')) {{
                        document.getElementById('wiz-prov-immobile').value = app.comune_immobile || 'Milano';
                    }}
                    if (document.getElementById('wiz-prov-residenza')) {{
                        document.getElementById('wiz-prov-residenza').value = app.comune_residenza || 'Milano';
                    }}
                    if (document.getElementById('wiz-prov-lavoro')) {{
                        document.getElementById('wiz-prov-lavoro').value = app.comune_lavoro || 'Milano';
                    }}

                    // Imposta reddito ed inquadramento
                    const isAutonomo = app.tipo_contratto === 'autonomo';
                    if (document.getElementById('wiz-q10-macro-categoria')) {{
                        document.getElementById('wiz-q10-macro-categoria').value = isAutonomo ? 'autonomo' : 'dipendente';
                        if (window.handleMacroCatChange) window.handleMacroCatChange(isAutonomo ? 'autonomo' : 'dipendente');
                    }}
                    if (document.getElementById('wiz-q10-netto-mensile')) {{
                        document.getElementById('wiz-q10-netto-mensile').value = app.netto_mensile || 2000;
                    }}
                    if (document.getElementById('wiz-q10-dip-netto')) {{
                        document.getElementById('wiz-q10-dip-netto').value = app.netto_mensile || 2000;
                    }}
                    if (document.getElementById('wiz-q10-cu1')) {{
                        document.getElementById('wiz-q10-cu1').value = Math.round((app.netto_mensile || 2000) * 12 * 1.30);
                    }}
                    if (document.getElementById('wiz-q10-cu6')) {{
                        document.getElementById('wiz-q10-cu6').value = 365;
                    }}

                    if (typeof saveCurrentSubject === 'function') {{
                        saveCurrentSubject(true);
                    }}
                    
                    if (window.goToStep) window.goToStep(3);
                }}""", applicant_inputs)
                time.sleep(1.0 * delay_mult)

                # 6. Fill Stage 3: Dati Mutuo & Consap
                ltv_calc = (loan_inputs.get("importo", 100) / loan_inputs.get("valore_immobile", 100)) * 100
                is_consap_val = "si" if loan_inputs.get("is_consap", False) else "no"
                print(f"📊 [6/6] Impostazione Mutuo: Importo € {loan_inputs.get('importo'):,}, Valore immobile € {loan_inputs.get('valore_immobile'):,} (LTV {ltv_calc:.0f}%), Durata {loan_inputs.get('durata')} anni, Consap: {is_consap_val}...")
                
                page.evaluate(f"""(loan) => {{
                    if (document.getElementById('p3-importo-field')) {{
                        document.getElementById('p3-importo-field').value = loan.importo || 180000;
                    }}
                    if (document.getElementById('p3-valore-field')) {{
                        document.getElementById('p3-valore-field').value = loan.valore_immobile || 180000;
                    }}
                    if (document.getElementById('wiz-p3-durata')) {{
                        document.getElementById('wiz-p3-durata').value = loan.durata || 30;
                    }}
                    if (document.getElementById('wiz-p3-macro-tasso')) {{
                        document.getElementById('wiz-p3-macro-tasso').value = loan.tipo_tasso || 'any';
                    }}
                    if (document.getElementById('p3-consap-select')) {{
                        document.getElementById('p3-consap-select').value = loan.is_consap ? 'si' : 'no';
                    }}
                    if (window.updateCalculations) {{
                        window.updateCalculations();
                    }}
                }}""", loan_inputs)
                time.sleep(2.0 * delay_mult)

                # Scroll smoothly down to show results
                page.evaluate("window.scrollTo({ top: 500, behavior: 'smooth' })")
                time.sleep(2.0 * delay_mult)

                # Extract calculated metrics and bank cards
                results_data = page.evaluate("""() => {
                    const maxLoanEl = document.getElementById('phase4-max-loan');
                    const rataEl = document.getElementById('phase4-rata-sostenibile');
                    const scoreEl = document.getElementById('phase4-score-cliente');
                    
                    const cards = Array.from(document.querySelectorAll('#comparison-cards-container > div'));
                    const banks = cards.map(c => {
                        const titleEl = c.querySelector('strong, h3, h4, .bank-title');
                        const text = c.innerText;
                        const isKo = text.includes('Non Fattibile') || text.includes('KO') || text.includes('non rispetta') || text.includes('SCONSIGLIATO') || text.includes('Nessuna Banca Fattibile');
                        return {
                            title: titleEl ? titleEl.innerText.trim() : 'Banca',
                            feasible: !isKo,
                            raw: text
                        };
                    });

                    return {
                        max_loan: maxLoanEl ? maxLoanEl.innerText.trim() : null,
                        rata_sostenibile: rataEl ? rataEl.innerText.trim() : null,
                        score: scoreEl ? scoreEl.innerText.trim() : null,
                        banks: banks
                    };
                }""")

                # Take screenshot
                safe_name = "".join(c if c.isalnum() else "_" for c in scenario_name).lower()
                screenshot_file = os.path.join(self.screenshots_dir, f"{safe_name}.png")
                page.screenshot(path=screenshot_file, full_page=True)
                report["screenshot_path"] = screenshot_file

                # Populate report
                report["console_errors"] = console_logs
                report["page_errors"] = page_errors
                report["calculated_results"] = {
                    "max_loan": results_data.get("max_loan"),
                    "rata_sostenibile": results_data.get("rata_sostenibile"),
                    "score": results_data.get("score")
                }
                
                banks = results_data.get("banks", [])
                report["banks_feasible"] = [b for b in banks if b["feasible"]]
                report["banks_unfeasible"] = [b for b in banks if not b["feasible"]]

                has_fatal_errors = len(page_errors) > 0

                if not has_fatal_errors:
                    report["status"] = "PASSED"
                    print(f"✅ [TEST COMPLETATO] Risultati calcolati: Importo Max Finanziabile {report['calculated_results']['max_loan']} | Rata Sostenibile: {report['calculated_results']['rata_sostenibile']} | Score: {report['calculated_results']['score']}")
                    print(f"   🏛️ Banche idonee al 100%: {len(report['banks_feasible'])} | Banche escluse: {len(report['banks_unfeasible'])}")
                else:
                    report["status"] = "FAILED"
                    report["error_details"] = f"{len(page_errors)} errori critici JS: " + "; ".join(page_errors)
                    print(f"❌ [TEST FALLITO] {report['error_details']}")

                if self.headed:
                    time.sleep(2.5)

                browser.close()

        except Exception as e:
            report["status"] = "ERROR"
            report["error_details"] = str(e)
            print(f"💥 [ERRORE RUNNER] {e}")
        finally:
            self.stop_server()

        # Save last report
        last_report_path = os.path.join(self.reports_dir, "last_run.json")
        with open(last_report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        return report

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default="qa_suite/scenarios/100ltv_cliente1_under36_single.json")
    parser.add_argument("--headed", action="store_true", help="Mostra il browser a schermo")
    args = parser.parse_args()

    runner = QARunner(headed=args.headed)
    res = runner.run_scenario(args.scenario)
    print("\n--- REPORT SINTETICO ---")
    print(json.dumps(res, indent=2, ensure_ascii=False))
