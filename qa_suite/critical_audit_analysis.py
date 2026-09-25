import math
import json
import time
from playwright.sync_api import sync_playwright

def calc_french_rata(loan, tan_annual_percent, years):
    r = (tan_annual_percent / 100.0) / 12.0
    n = years * 12
    if r == 0:
        return loan / n
    return loan * (r * math.pow(1 + r, n)) / (math.pow(1 + r, n) - 1)

def run_critical_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page()
        page.goto("http://localhost:8080/index.html", wait_until="domcontentloaded")
        time.sleep(1.0)
        
        audit_results = page.evaluate("""() => {
            const scenarios = [
              {
                id: 1,
                name: "Scenario 1: Giovane Professionista Under 36 (Single, LTV 100% Consap)",
                description: "Marco Rossi, 29 anni, dipendente indeterminato 2.100€ netti/mese (13 mensilità). Acquisto 180.000€, Mutuo 180.000€ (LTV 100%), 30 anni, Milano.",
                params: {
                  tipoTasso: "fisso",
                  importoMutuo: 180000,
                  valoreImmobile: 180000,
                  durata: 30,
                  finalita: "acquisto",
                  isConsap: true,
                  personeNucleo: 1,
                  zona: "nord",
                  subjects: [{
                    role: "Richiedente Principale",
                    nome: "Marco",
                    cognome: "Rossi",
                    eta: 29,
                    cittadinanza: "IT",
                    statoCivile: "celibe",
                    tipoContratto: "indeterminato",
                    macroCategoria: "dipendente",
                    netto: 2100,
                    mensilita: 13,
                    anzianitaMesi: 48,
                    incomes: [{
                      tipoContratto: "indeterminato",
                      macroCategoria: "dipendente",
                      netto: 2100,
                      mensilita: 13,
                      anzianitaMesi: 48,
                      cu1: 2100 * 13 * 1.3,
                      cu6: 365,
                      orarioLavoro: "full_time"
                    }]
                  }],
                  userLoans: []
                }
              },
              {
                id: 2,
                name: "Scenario 2: Famiglia Monoreddito con 2 Figli (Nucleo 4 Persone, Prestito 250€, LTV 72%)",
                description: "Giuseppe Verdi, 42 anni, dipendente indeterminato 2.800€ netti/mese. Coniuge a carico + 2 figli minori (4 componenti). Prestito 250€/m. Acquisto 250.000€, Mutuo 180.000€ (LTV 72%), 25 anni, Roma.",
                params: {
                  tipoTasso: "fisso",
                  importoMutuo: 180000,
                  valoreImmobile: 250000,
                  durata: 25,
                  finalita: "acquisto",
                  isConsap: false,
                  personeNucleo: 4,
                  zona: "centro",
                  subjects: [{
                    role: "Richiedente Principale",
                    nome: "Giuseppe",
                    cognome: "Verdi",
                    eta: 42,
                    cittadinanza: "IT",
                    statoCivile: "sposato",
                    regime: "separazione",
                    tipoContratto: "indeterminato",
                    macroCategoria: "dipendente",
                    netto: 2800,
                    mensilita: 13,
                    anzianitaMesi: 120,
                    incomes: [{
                      tipoContratto: "indeterminato",
                      macroCategoria: "dipendente",
                      netto: 2800,
                      mensilita: 13,
                      anzianitaMesi: 120,
                      cu1: 2800 * 13 * 1.3,
                      cu6: 365,
                      orarioLavoro: "full_time"
                    }]
                  }],
                  userLoans: [{
                    id: "loan_1",
                    tipo: "personale",
                    rata: 250,
                    debitoResiduo: 8000,
                    durataResidua: 36,
                    verraChiuso: false
                  }]
                }
              },
              {
                id: 3,
                name: "Scenario 3: Coppia Entrambi Lavoratori (Dipendente 1.800€ + P.IVA Forfettaria 24.000€, LTV 74.3%)",
                description: "Davide (36 anni, dipendente 1.800€) + Elena (34 anni, forfettaria RN/LM 24.000€). Nucleo 2 persone. Acquisto 350.000€, Mutuo 260.000€ (LTV 74.3%), 25 anni, Bologna.",
                params: {
                  tipoTasso: "fisso",
                  importoMutuo: 260000,
                  valoreImmobile: 350000,
                  durata: 25,
                  finalita: "acquisto",
                  isConsap: false,
                  personeNucleo: 2,
                  zona: "nord",
                  subjects: [
                    {
                      role: "Richiedente Principale",
                      nome: "Davide",
                      cognome: "Ferrari",
                      eta: 36,
                      cittadinanza: "IT",
                      statoCivile: "coniugato",
                      regime: "separazione",
                      tipoContratto: "indeterminato",
                      macroCategoria: "dipendente",
                      netto: 1800,
                      mensilita: 13,
                      incomes: [{
                        tipoContratto: "indeterminato",
                        macroCategoria: "dipendente",
                        netto: 1800,
                        mensilita: 13,
                        anzianitaMesi: 60,
                        cu1: 1800 * 13 * 1.3,
                        cu6: 365,
                        orarioLavoro: "full_time"
                      }]
                    },
                    {
                      role: "Cointestatario",
                      nome: "Elena",
                      cognome: "Bianchi",
                      eta: 34,
                      cittadinanza: "IT",
                      statoCivile: "coniugato",
                      regime: "separazione",
                      tipoContratto: "autonomo",
                      macroCategoria: "autonomo",
                      netto: 2000,
                      incomes: [{
                        tipoContratto: "autonomo",
                        macroCategoria: "autonomo",
                        netto: 2000,
                        autRegime: "forfettario",
                        autAnniAttivita: 3,
                        autRnlm: 24000,
                        autFatturato: 32000,
                        autSettore: "servizi",
                        anniAttivita: 3
                      }]
                    }
                  ],
                  userLoans: []
                }
              },
              {
                id: 4,
                name: "Scenario 4: Richiedente Maturo 58 Anni (Dipendente Quadro 3.800€, LTV 50%, Durata 20 anni -> Scadenza 78 anni)",
                description: "Roberto Mancini, 58 anni, Quadro 3.800€ netti. Nucleo 2 persone. Acquisto 300.000€, Mutuo 150.000€ (LTV 50%), 20 anni (scadenza a 78 anni), Torino.",
                params: {
                  tipoTasso: "fisso",
                  importoMutuo: 150000,
                  valoreImmobile: 300000,
                  durata: 20,
                  finalita: "acquisto",
                  isConsap: false,
                  personeNucleo: 2,
                  zona: "nord",
                  subjects: [{
                    role: "Richiedente Principale",
                    nome: "Roberto",
                    cognome: "Mancini",
                    eta: 58,
                    cittadinanza: "IT",
                    statoCivile: "coniugato",
                    regime: "separazione",
                    tipoContratto: "indeterminato",
                    macroCategoria: "dipendente",
                    netto: 3800,
                    mensilita: 14,
                    incomes: [{
                      tipoContratto: "indeterminato",
                      macroCategoria: "dipendente",
                      netto: 3800,
                      mensilita: 14,
                      anzianitaMesi: 200,
                      cu1: 3800 * 14 * 1.35,
                      cu6: 365,
                      orarioLavoro: "full_time"
                    }]
                  }],
                  userLoans: []
                }
              },
              {
                id: 5,
                name: "Scenario 5: Lavoratore Extra-UE (32 anni, 1.650€, Permesso 1 anno, Anzianità 18m) + Garante Pensionato 68 anni (1.200€) (LTV 82%)",
                description: "Ahmed Hassan (32 anni, Extra-UE, 1.650€, permesso 1 anno) + Garante Ali Hassan (68 anni, pensione 1.200€). Acquisto 140.000€, Mutuo 115.000€ (LTV 82.1%), 25 anni, Firenze.",
                params: {
                  tipoTasso: "fisso",
                  importoMutuo: 115000,
                  valoreImmobile: 140000,
                  durata: 25,
                  finalita: "acquisto",
                  isConsap: false,
                  personeNucleo: 1,
                  zona: "centro",
                  subjects: [
                    {
                      role: "Richiedente Principale",
                      nome: "Ahmed",
                      cognome: "Hassan",
                      eta: 32,
                      cittadinanza: "extra",
                      permScadenza: "2027-06-10",
                      anzianitaItaliaMesi: 24,
                      tipoContratto: "indeterminato",
                      macroCategoria: "dipendente",
                      netto: 1650,
                      mensilita: 13,
                      anzianitaMesi: 18,
                      incomes: [{
                        tipoContratto: "indeterminato",
                        macroCategoria: "dipendente",
                        netto: 1650,
                        mensilita: 13,
                        anzianitaMesi: 18,
                        cu1: 1650 * 13 * 1.3,
                        cu6: 365,
                        orarioLavoro: "full_time"
                      }]
                    },
                    {
                      role: "Garante",
                      nome: "Ali",
                      cognome: "Hassan",
                      eta: 68,
                      cittadinanza: "extra",
                      permScadenza: "2035-01-01",
                      anzianitaItaliaMesi: 120,
                      statoCivile: "coniugato",
                      tipoContratto: "pensionato",
                      macroCategoria: "pensionato",
                      netto: 1200,
                      mensilita: 13,
                      incomes: [{
                        tipoContratto: "pensionato",
                        macroCategoria: "pensionato",
                        netto: 1200,
                        mensilita: 13
                      }]
                    }
                  ],
                  userLoans: []
                }
              }
            ];

            return scenarios.map(sc => {
              const tassi = (typeof tassiBase !== 'undefined') ? tassiBase : (window.tassiBase || {});
              const res = BrokerFlowEngine.evaluate(sc.params, tassi);
              return {
                scenarioId: sc.id,
                scenarioName: sc.name,
                description: sc.description,
                params: sc.params,
                feasible: res.feasible,
                allEvaluated: (res.allEvaluated || []).map(b => ({
                  bankId: b.bankId,
                  name: b.name,
                  status: b.status,
                  isNotFeasible: b.isNotFeasible,
                  tan: b.tan,
                  rata: b.rata,
                  dsr: b.dsr,
                  evaluatedLtv: b.evaluatedLtv,
                  maxLtvAllowed: b.maxLtvAllowed,
                  mriPassed: b.mriPassed,
                  reasons: b.reasons || [],
                  deroghe: b.deroghe || [],
                  notes: b.notes || []
                }))
              };
            });
          }
        """)
        
        # Now perform critical audit on Python side
        final_report = []
        
        for sc in audit_results:
            sc_id = sc["scenarioId"]
            sc_name = sc["scenarioName"]
            params = sc["params"]
            loan = params["importoMutuo"]
            valore = params["valoreImmobile"]
            years = params["durata"]
            real_ltv = round((loan / valore) * 100, 2)
            
            # Base net income
            total_net = sum(s.get("netto", 0) for s in params["subjects"] if s.get("role") != "Garante")
            garante_net = sum(s.get("netto", 0) for s in params["subjects"] if s.get("role") == "Garante")
            other_loans = sum(l.get("rata", 0) for l in params.get("userLoans", []) if not l.get("verraChiuso", False))
            
            sc_audit = {
                "id": sc_id,
                "name": sc_name,
                "description": sc["description"],
                "real_ltv": real_ltv,
                "total_net": total_net,
                "garante_net": garante_net,
                "other_loans": other_loans,
                "banks_evaluated": []
            }
            
            for b in sc["allEvaluated"]:
                tan = b["tan"]
                engine_rata = b["rata"]
                engine_dsr = b["dsr"]
                
                # Recalculate Rata independently
                if tan > 0 and engine_rata < 999999:
                    recalculated_rata = round(calc_french_rata(loan, tan, years), 2)
                    rata_diff = abs(recalculated_rata - engine_rata)
                else:
                    recalculated_rata = None
                    rata_diff = 0
                
                # Recalculate DSR independently
                if recalculated_rata and total_net > 0:
                    recalculated_dsr = round(((recalculated_rata + other_loans) / total_net) * 100, 2)
                else:
                    recalculated_dsr = None
                
                # Check Subsistence MRI independently
                if recalculated_rata:
                    residuo_netto = (total_net + (garante_net * 0.5)) - (recalculated_rata + other_loans)
                else:
                    residuo_netto = None
                
                sc_audit["banks_evaluated"].append({
                    "bankId": b["bankId"],
                    "name": b["name"],
                    "status": b["status"],
                    "tan": tan,
                    "engine_rata": round(engine_rata, 2) if engine_rata < 999999 else "N/A (Esclusa)",
                    "recalculated_rata": recalculated_rata,
                    "rata_diff_cents": round(rata_diff * 100, 2),
                    "engine_dsr_pct": round(engine_dsr * 100, 2) if engine_dsr else None,
                    "recalculated_dsr_pct": recalculated_dsr,
                    "residuo_netto_mensile": round(residuo_netto, 2) if residuo_netto is not None else None,
                    "reasons": b["reasons"],
                    "deroghe": b["deroghe"],
                    "notes": b["notes"]
                })
            
            final_report.append(sc_audit)
            
        with open("qa_suite/reports/full_critical_audit.json", "w", encoding="utf-8") as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
            
        print("✅ AUDIT CRITICO COMPLETATO E SALVATO.")
        browser.close()

if __name__ == "__main__":
    run_critical_audit()
