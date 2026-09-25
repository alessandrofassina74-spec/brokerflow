import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

def run_5_stress_tests():
    url = "http://localhost:8080/index.html"
    
    scenarios = [
        {
            "id": 1,
            "name": "Scenario 1: Giovane Professionista Under 36 (Single, LTV 100% Consap)",
            "setup": """() => {
                window.switchCrmModule('engine');
                window.initNuovaPratica();
                
                // Finalità
                window.selectMortgageType('acquisto');
                
                // Soggetto 1
                wizardSubjects = [{
                    role: 'Richiedente Principale',
                    nome: 'Marco',
                    cognome: 'Rossi',
                    dataNascita: '1997-03-10',
                    eta: 29,
                    sesso: 'M',
                    cittadinanza: 'IT',
                    statoCivile: 'celibe',
                    tipoContratto: 'indeterminato',
                    macroCategoria: 'dipendente',
                    netto: 2100,
                    mensilita: 13,
                    anzianitaMesi: 48,
                    incomes: [{
                        tipoContratto: 'indeterminato',
                        macroCategoria: 'dipendente',
                        netto: 2100,
                        mensilita: 13,
                        anzianitaMesi: 48,
                        cu1: 2100 * 13 * 1.3,
                        cu6: 365,
                        orarioLavoro: 'full_time'
                    }]
                }];
                window.userLoans = [];
                if (typeof renderSubjectsChips === 'function') renderSubjectsChips();
                if (typeof renderLoansCards === 'function') renderLoansCards();
                
                const persEl = document.getElementById('wiz-persone-nucleo');
                if (persEl) persEl.value = '1';
                
                document.getElementById('wiz-prov-immobile').value = 'Milano';
                document.getElementById('wiz-prov-residenza').value = 'Milano';
                document.getElementById('wiz-prov-lavoro').value = 'Milano';
                
                // Step 3
                document.getElementById('p3-valore-field').value = '180000';
                document.getElementById('p3-importo-field').value = '180000';
                document.getElementById('wiz-p3-durata').value = '30';
                document.getElementById('wiz-p3-finalita').value = 'acquisto';
                if (document.getElementById('p3-consap-select')) document.getElementById('p3-consap-select').value = 'si';
                
                // Run calculations
                window.goToStep(4);
                if (typeof updateCalculations === 'function') updateCalculations();
            }"""
        },
        {
            "id": 2,
            "name": "Scenario 2: Famiglia Monoreddito con 2 Figli (Nucleo 4 Persone, Prestito 250€, LTV 72%)",
            "setup": """() => {
                window.switchCrmModule('engine');
                window.initNuovaPratica();
                
                window.selectMortgageType('acquisto');
                
                wizardSubjects = [{
                    role: 'Richiedente Principale',
                    nome: 'Giuseppe',
                    cognome: 'Verdi',
                    dataNascita: '1984-05-15',
                    eta: 42,
                    sesso: 'M',
                    cittadinanza: 'IT',
                    statoCivile: 'sposato',
                    regime: 'separazione',
                    tipoContratto: 'indeterminato',
                    macroCategoria: 'dipendente',
                    netto: 2800,
                    mensilita: 13,
                    anzianitaMesi: 120,
                    incomes: [{
                        tipoContratto: 'indeterminato',
                        macroCategoria: 'dipendente',
                        netto: 2800,
                        mensilita: 13,
                        anzianitaMesi: 120,
                        cu1: 2800 * 13 * 1.3,
                        cu6: 365,
                        orarioLavoro: 'full_time'
                    }]
                }];
                
                // Prestito da 250€ attivo
                window.userLoans = [{
                    id: 'loan_1',
                    tipo: 'personale',
                    rata: 250,
                    debitoResiduo: 8000,
                    durataResidua: 36,
                    verraChiuso: false
                }];
                
                if (typeof renderSubjectsChips === 'function') renderSubjectsChips();
                if (typeof renderLoansCards === 'function') renderLoansCards();
                
                const persEl = document.getElementById('wiz-persone-nucleo');
                if (persEl) persEl.value = '4';
                
                document.getElementById('wiz-prov-immobile').value = 'Roma';
                document.getElementById('wiz-prov-residenza').value = 'Roma';
                document.getElementById('wiz-prov-lavoro').value = 'Roma';
                
                document.getElementById('p3-valore-field').value = '250000';
                document.getElementById('p3-importo-field').value = '180000';
                document.getElementById('wiz-p3-durata').value = '25';
                document.getElementById('wiz-p3-finalita').value = 'acquisto';
                if (document.getElementById('p3-consap-select')) document.getElementById('p3-consap-select').value = 'no';
                
                window.goToStep(4);
                if (typeof updateCalculations === 'function') updateCalculations();
            }"""
        },
        {
            "id": 3,
            "name": "Scenario 3: Coppia Entrambi Lavoratori (Dipendente 1.800€ + P.IVA Forfettaria 24.000€, LTV 74.3%)",
            "setup": """() => {
                window.switchCrmModule('engine');
                window.initNuovaPratica();
                
                window.selectMortgageType('acquisto');
                
                wizardSubjects = [
                    {
                        role: 'Richiedente Principale',
                        nome: 'Davide',
                        cognome: 'Ferrari',
                        dataNascita: '1990-08-20',
                        eta: 36,
                        sesso: 'M',
                        cittadinanza: 'IT',
                        statoCivile: 'coniugato',
                        regime: 'separazione',
                        tipoContratto: 'indeterminato',
                        macroCategoria: 'dipendente',
                        netto: 1800,
                        mensilita: 13,
                        incomes: [{
                            tipoContratto: 'indeterminato',
                            macroCategoria: 'dipendente',
                            netto: 1800,
                            mensilita: 13,
                            anzianitaMesi: 60,
                            cu1: 1800 * 13 * 1.3,
                            cu6: 365,
                            orarioLavoro: 'full_time'
                        }]
                    },
                    {
                        role: 'Cointestatario',
                        nome: 'Elena',
                        cognome: 'Bianchi',
                        dataNascita: '1992-04-12',
                        eta: 34,
                        sesso: 'F',
                        cittadinanza: 'IT',
                        statoCivile: 'coniugato',
                        regime: 'separazione',
                        tipoContratto: 'autonomo',
                        macroCategoria: 'autonomo',
                        netto: 2000,
                        incomes: [{
                            tipoContratto: 'autonomo',
                            macroCategoria: 'autonomo',
                            netto: 2000,
                            autRegime: 'forfettario',
                            autAnniAttivita: 3,
                            autRnlm: 24000,
                            autFatturato: 32000,
                            autSettore: 'servizi',
                            anniAttivita: 3
                        }]
                    }
                ];
                window.userLoans = [];
                if (typeof renderSubjectsChips === 'function') renderSubjectsChips();
                if (typeof renderLoansCards === 'function') renderLoansCards();
                
                const persEl = document.getElementById('wiz-persone-nucleo');
                if (persEl) persEl.value = '2';
                
                document.getElementById('wiz-prov-immobile').value = 'Bologna';
                document.getElementById('wiz-prov-residenza').value = 'Bologna';
                document.getElementById('wiz-prov-lavoro').value = 'Bologna';
                
                document.getElementById('p3-valore-field').value = '350000';
                document.getElementById('p3-importo-field').value = '260000';
                document.getElementById('wiz-p3-durata').value = '25';
                document.getElementById('wiz-p3-finalita').value = 'acquisto';
                if (document.getElementById('p3-consap-select')) document.getElementById('p3-consap-select').value = 'no';
                
                window.goToStep(4);
                if (typeof updateCalculations === 'function') updateCalculations();
            }"""
        },
        {
            "id": 4,
            "name": "Scenario 4: Richiedente Maturo 58 Anni (Dipendente Quadro 3.800€, LTV 50%, Durata 20 anni -> Scadenza 78 anni)",
            "setup": """() => {
                window.switchCrmModule('engine');
                window.initNuovaPratica();
                
                window.selectMortgageType('acquisto');
                
                wizardSubjects = [{
                    role: 'Richiedente Principale',
                    nome: 'Roberto',
                    cognome: 'Mancini',
                    dataNascita: '1968-02-14',
                    eta: 58,
                    sesso: 'M',
                    cittadinanza: 'IT',
                    statoCivile: 'coniugato',
                    regime: 'separazione',
                    tipoContratto: 'indeterminato',
                    macroCategoria: 'dipendente',
                    netto: 3800,
                    mensilita: 14,
                    incomes: [{
                        tipoContratto: 'indeterminato',
                        macroCategoria: 'dipendente',
                        netto: 3800,
                        mensilita: 14,
                        anzianitaMesi: 200,
                        cu1: 3800 * 14 * 1.35,
                        cu6: 365,
                        orarioLavoro: 'full_time'
                    }]
                }];
                window.userLoans = [];
                if (typeof renderSubjectsChips === 'function') renderSubjectsChips();
                if (typeof renderLoansCards === 'function') renderLoansCards();
                
                const persEl = document.getElementById('wiz-persone-nucleo');
                if (persEl) persEl.value = '2';
                
                document.getElementById('wiz-prov-immobile').value = 'Torino';
                document.getElementById('wiz-prov-residenza').value = 'Torino';
                document.getElementById('wiz-prov-lavoro').value = 'Torino';
                
                document.getElementById('p3-valore-field').value = '300000';
                document.getElementById('p3-importo-field').value = '150000';
                document.getElementById('wiz-p3-durata').value = '20';
                document.getElementById('wiz-p3-finalita').value = 'acquisto';
                if (document.getElementById('p3-consap-select')) document.getElementById('p3-consap-select').value = 'no';
                
                window.goToStep(4);
                if (typeof updateCalculations === 'function') updateCalculations();
            }"""
        },
        {
            "id": 5,
            "name": "Scenario 5: Lavoratore Extra-UE (32 anni, 1.650€, Permesso 1 anno, Anzianità 18m) + Garante Pensionato 68 anni (1.200€) (LTV 82%)",
            "setup": """() => {
                window.switchCrmModule('engine');
                window.initNuovaPratica();
                
                window.selectMortgageType('acquisto');
                
                wizardSubjects = [
                    {
                        role: 'Richiedente Principale',
                        nome: 'Ahmed',
                        cognome: 'Hassan',
                        dataNascita: '1994-06-10',
                        eta: 32,
                        sesso: 'M',
                        cittadinanza: 'extra',
                        statoCivile: 'celibe',
                        permScadenza: '2027-06-10',
                        anzianitaItaliaMesi: 24,
                        tipoContratto: 'indeterminato',
                        macroCategoria: 'dipendente',
                        netto: 1650,
                        mensilita: 13,
                        anzianitaMesi: 18,
                        incomes: [{
                            tipoContratto: 'indeterminato',
                            macroCategoria: 'dipendente',
                            netto: 1650,
                            mensilita: 13,
                            anzianitaMesi: 18,
                            cu1: 1650 * 13 * 1.3,
                            cu6: 365,
                            orarioLavoro: 'full_time'
                        }]
                    },
                    {
                        role: 'Garante',
                        nome: 'Ali',
                        cognome: 'Hassan',
                        dataNascita: '1958-01-10',
                        eta: 68,
                        sesso: 'M',
                        cittadinanza: 'extra',
                        permScadenza: '2035-01-01',
                        anzianitaItaliaMesi: 120,
                        statoCivile: 'coniugato',
                        tipoContratto: 'pensionato',
                        macroCategoria: 'pensionato',
                        netto: 1200,
                        mensilita: 13,
                        incomes: [{
                            tipoContratto: 'pensionato',
                            macroCategoria: 'pensionato',
                            netto: 1200,
                            mensilita: 13
                        }]
                    }
                ];
                window.userLoans = [];
                if (typeof renderSubjectsChips === 'function') renderSubjectsChips();
                if (typeof renderLoansCards === 'function') renderLoansCards();
                
                const persEl = document.getElementById('wiz-persone-nucleo');
                if (persEl) persEl.value = '1';
                
                document.getElementById('wiz-prov-immobile').value = 'Firenze';
                document.getElementById('wiz-prov-residenza').value = 'Firenze';
                document.getElementById('wiz-prov-lavoro').value = 'Firenze';
                
                document.getElementById('p3-valore-field').value = '140000';
                document.getElementById('p3-importo-field').value = '115000';
                document.getElementById('wiz-p3-durata').value = '25';
                document.getElementById('wiz-p3-finalita').value = 'acquisto';
                if (document.getElementById('p3-consap-select')) document.getElementById('p3-consap-select').value = 'no';
                
                window.goToStep(4);
                if (typeof updateCalculations === 'function') updateCalculations();
            }"""
        }
    ]

    results_output = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(url, wait_until="domcontentloaded")
        time.sleep(1.0)
        
        # Login
        page.evaluate("if (window.quickLoginAs) window.quickLoginAs('dev@brokerflow.it')")
        time.sleep(0.5)

        for sc in scenarios:
            print(f"\n========================================================")
            print(f"🚀 ESECUZIONE: {sc['name']}")
            print(f"========================================================")
            
            page.evaluate(sc["setup"])
            time.sleep(1.5)
            
            # Extract calculations and bank cards
            eval_data = page.evaluate("""() => {
                const res = window.lastEvaluationResult || {};
                const topKpis = {
                    maxFinanziabile: document.getElementById('p4-max-loan')?.innerText || '',
                    rataSostenibile: document.getElementById('p4-max-rata')?.innerText || '',
                    score: document.getElementById('p4-score-badge')?.innerText || '',
                    chosenBanner: document.querySelector('.chosen-bank-summary-banner')?.innerText || ''
                };
                
                const cards = [...document.querySelectorAll('.bank-card')].map(c => {
                    return {
                        title: c.querySelector('.bank-title')?.innerText || '',
                        statusClass: c.className,
                        statusBadge: c.querySelector('.status-badge')?.innerText || '',
                        rata: c.querySelector('.rate-value')?.innerText || '',
                        tan: c.querySelector('.tan-value')?.innerText || '',
                        taeg: c.querySelector('.taeg-value')?.innerText || '',
                        dsr: c.querySelector('.dsr-value')?.innerText || '',
                        reasons: [...c.querySelectorAll('.reason-item, .exclusion-reason, .deroga-item, .bank-alert-desc, .reason-badge')].map(r => r.innerText.trim()).filter(Boolean),
                        notes: [...c.querySelectorAll('.policy-bullet, .rule-desc, .condition-item')].map(n => n.innerText.trim()).filter(Boolean)
                    };
                });
                
                return {
                    feasible: res.feasible,
                    topKpis,
                    cards,
                    rawBanks: (res.allEvaluated || []).map(b => ({
                        bankId: b.bankId,
                        name: b.name,
                        status: b.status,
                        isNotFeasible: b.isNotFeasible,
                        rata: b.rata,
                        tan: b.tan,
                        dsr: b.dsr,
                        evaluatedLtv: b.evaluatedLtv,
                        maxLtvAllowed: b.maxLtvAllowed,
                        mriPassed: b.mriPassed,
                        reasons: b.reasons || [],
                        deroghe: b.deroghe || [],
                        notes: b.notes || []
                    }))
                };
            }""")
            
            print(f"   -> Top KPIs: Max Finanziabile={eval_data['topKpis']['maxFinanziabile']}, Rata Max={eval_data['topKpis']['rataSostenibile']}")
            print(f"   -> Banche estratte: {len(eval_data['rawBanks'])} banche")
            for b in eval_data["rawBanks"]:
                icon = "🟢" if b["status"] == "ok" else ("🟡" if b["status"] == "deroga" else "🔴")
                print(f"      {icon} {b['name']}: Status={b['status']}, Rata={b['rata']}€, TAN={b['tan']}%, DSR={b['dsr']}%, LTV={b['evaluatedLtv']}%")
                if b["reasons"]:
                    print(f"         └─ Motivi/Note: {b['reasons']}")
            
            results_output.append({
                "scenario": sc,
                "data": eval_data
            })

        browser.close()
        
    os.makedirs("qa_suite/reports", exist_ok=True)
    with open("qa_suite/reports/5_stress_tests_raw_results.json", "w", encoding="utf-8") as f:
        json.dump(results_output, f, indent=2, ensure_ascii=False)
    
    print("\n✅ TUTTI I 5 TEST SONO STATI ESEGUITI E I DATI GREZZI SONO STATI SALVATI.")

if __name__ == "__main__":
    run_5_stress_tests()
