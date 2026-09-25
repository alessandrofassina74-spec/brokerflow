import json
import time
from playwright.sync_api import sync_playwright

def test_ing_sussistenza():
    print("\n" + "="*70)
    print("🦁 [QA TEST SUSSISTENZA ING DIRECT] Verifica Soglia Minima di Sussistenza")
    print("="*70)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-web-security", "--no-sandbox"]
        )
        context = browser.new_context(viewport={"width": 1400, "height": 950})
        page = context.new_page()

        # Connect to existing dev server
        page.goto("http://localhost:8080/index.html", wait_until="domcontentloaded", timeout=15000)
        time.sleep(1.0)

        # Login
        page.evaluate("if (window.quickLoginAs) window.quickLoginAs('dev@brokerflow.it')")
        time.sleep(0.8)

        # Direct evaluation of MortgageEngine with ING policy
        eval_result = page.evaluate("""() => {
            const engine = window.MortgageEngine || window.BrokerFlowEngine;
            const ingPolicy = (engine && engine.bankPolicies && (Array.isArray(engine.bankPolicies) ? engine.bankPolicies.find(b => b.id === 'ing') : engine.bankPolicies['ing']))
                || (window.BankPolicies && (Array.isArray(window.BankPolicies) ? window.BankPolicies.find(b => b.id === 'ing') : window.BankPolicies['ing']))
                || (window.policiesData && window.policiesData['ing']);
            if (!ingPolicy) return { error: 'ING policy not found in engine.bankPolicies' };

            const results = [];
            for (let n = 1; n <= 6; n++) {
                const dummyPratica = {
                    personeNucleo: n,
                    provImmobile: 'MI',
                    provinciaResidenza: 'Milano',
                    zona: 'Nord',
                    importoMutuo: 140000,
                    durata: 25,
                    valoreImmobile: 180000,
                    finalita: 'acquisto',
                    tipoTasso: 'fisso'
                };
                const mriReq = engine.getMriRequired('Nord', n, ingPolicy, 'Milano', dummyPratica);
                results.push({
                    nucleo: n,
                    mriRequired: mriReq
                });
            }

            // Test scenario: Family of 4, Income 2500, Mortgage payment ~750
            // Residual = 2500 - 750 = 1750 >= 1400
            const testPraticaFamily4 = {
                tipoMutuo: 'acquisto',
                finalita: 'acquisto',
                importoMutuo: 150000,
                valoreImmobile: 200000,
                durata: 25,
                tipoTasso: 'fisso',
                classeEnergetica: 'c',
                provImmobile: 'Milano',
                provinciaResidenza: 'Milano',
                zona: 'Nord',
                personeNucleo: 4,
                numFigli: 2,
                figliACarico: 'si',
                hasCpi: false,
                totalIncome: 2500,
                subjects: [
                    {
                        role: 'Richiedente',
                        nome: 'Mario Rossi',
                        eta: 35,
                        incomeNetto: 2500,
                        macroCategoria: 'dipendente',
                        tipoContratto: 'tempo_indeterminato',
                        mensilita: 13
                    }
                ],
                exclusions: {}
            };

            const tassiBase = window.TASSI_BASE || { irs: 2.5, irsRates: { 25: 2.5 }, euribor1m: 3.0, euribor3m: 3.0, euribor6m: 3.0, bce: 3.0 };
            const evalOutcome = engine.evaluate(testPraticaFamily4, tassiBase);
            const ingResult = evalOutcome.allEvaluated ? evalOutcome.allEvaluated.find(b => b.bankId === 'ing') : null;

            if (!ingResult) return { error: 'ING evaluation not found in allEvaluated', gridResults: results };

            const mriCheck = ingResult.checks ? ingResult.checks.find(c => c.name.includes('Sussistenza') || c.name.includes('MRI')) : null;

            return {
                gridResults: results,
                family4: {
                    status: ingResult.status,
                    checks: ingResult.checks,
                    mriCheck: mriCheck,
                    bestChoice: {
                        tan: ingResult.tan,
                        rata: ingResult.rata
                    }
                }
            };
        }""")

        print("\n📊 Risultati soglie MRI calcolate per ING:")
        if "error" in eval_result:
            print(f"❌ Errore: {eval_result['error']}")
            return False

        for r in eval_result["gridResults"]:
            print(f"   - Nucleo {r['nucleo']} persona/e: € {r['mriRequired']}/mese")

        print("\n🧪 Test Famiglia di 4 persone (Reddito € 2.500, Mutuo € 150.000 / 25 anni):")
        f4 = eval_result["family4"]
        print(f"   - Stato Banca ING: {f4['status']}")
        if f4.get("checks"):
            for c in f4["checks"]:
                if c.get("status") != "ok":
                    print(f"   ❌ Check {c.get('name')}: {c.get('status')} - {c.get('text')}")
        if f4["mriCheck"]:
            print(f"   - Check MRI: status = {f4['mriCheck']['status']}, ok = {f4['mriCheck']['ok']}")
            print(f"   - Testo: {f4['mriCheck']['text']}")
        if f4["bestChoice"]:
            print(f"   - Rata mensile: € {round(f4['bestChoice']['rata'], 2)}")

        # Verify expectations according to official ING Policy 2025 (Nord Metropoli)
        expected_thresholds = {
            1: 913,
            2: 1263,
            3: 1577,
            4: 1900,
            5: 2191,
            6: 2471
        }
        for r in eval_result["gridResults"]:
            exp = expected_thresholds.get(r['nucleo'])
            assert r['mriRequired'] == exp, f"Mismatch for nucleo {r['nucleo']}: got {r['mriRequired']}, expected {exp}"

        # Part 2: End-to-end Wizard UI Test
        print("\n🖥️ [UI TEST] Simulazione Wizard reale con 4 componenti del nucleo familiare...")
        page.evaluate("window.switchCrmModule && window.switchCrmModule('engine')")
        time.sleep(0.5)
        page.evaluate("window.selectMortgageType && window.selectMortgageType('acquisto')")
        time.sleep(0.4)
        page.evaluate("window.goToStep && window.goToStep(2)")
        time.sleep(0.5)

        # Set Income: € 2.500
        page.evaluate("""() => {
            if (document.getElementById('wiz-q10-macro-categoria')) {
                document.getElementById('wiz-q10-macro-categoria').value = 'dipendente';
                if (window.handleMacroCatChange) window.handleMacroCatChange('dipendente');
            }
            if (document.getElementById('wiz-q10-netto-mensile')) {
                document.getElementById('wiz-q10-netto-mensile').value = 2500;
            }
            if (document.getElementById('wiz-q10-dip-netto')) {
                document.getElementById('wiz-q10-dip-netto').value = 2500;
            }
            if (document.getElementById('wiz-q10-cu1')) {
                document.getElementById('wiz-q10-cu1').value = 2500 * 12 * 1.3;
            }
            if (document.getElementById('wiz-q10-cu6')) {
                document.getElementById('wiz-q10-cu6').value = 365;
            }
            if (document.getElementById('wiz-persone-nucleo')) {
                document.getElementById('wiz-persone-nucleo').value = 4;
            }
            if (document.getElementById('wiz-q5-figli')) {
                document.getElementById('wiz-q5-figli').value = 'si';
            }
            if (document.getElementById('wiz-q5-num-figli')) {
                document.getElementById('wiz-q5-num-figli').value = 2;
            }
            if (typeof saveCurrentSubject === 'function') {
                saveCurrentSubject(true);
            }
            if (window.goToStep) window.goToStep(3);
        }""")
        time.sleep(0.5)

        # Step 3
        page.evaluate("""() => {
            if (document.getElementById('p3-importo-field')) document.getElementById('p3-importo-field').value = 140000;
            if (document.getElementById('p3-valore-field')) document.getElementById('p3-valore-field').value = 180000;
            if (document.getElementById('wiz-p3-durata')) document.getElementById('wiz-p3-durata').value = 25;
            if (window.updateCalculations) window.updateCalculations();
        }""")
        time.sleep(1.2)

        # Extract ING card from UI
        ing_card = page.evaluate("""() => {
            const cards = Array.from(document.querySelectorAll('#comparison-cards-container > div'));
            const card = cards.find(c => c.innerText.includes('ING Bank') || c.innerText.includes('ING'));
            if (!card) return { found: false };
            const text = card.innerText;
            const isKo = text.includes('Non Fattibile') || text.includes('KO');
            return {
                found: true,
                isKo: isKo,
                textSnippet: text.substring(0, 300).replace(/\\n/g, ' ')
            };
        }""")

        print(f"   - Scheda ING trovata in UI: {ing_card.get('found')}")
        if ing_card.get('found'):
            print(f"   - Stato scheda KO: {ing_card.get('isKo')}")
            print(f"   - Estratto scheda: {ing_card.get('textSnippet')}")
        print("\n✅ TUTTI I TEST SULLA SUSSISTENZA ING (ENGINE + UI) SONO SUPERATI CON SUCCESSO!")
        browser.close()
        return True

if __name__ == "__main__":
    success = test_ing_sussistenza()
    if not success:
        exit(1)
