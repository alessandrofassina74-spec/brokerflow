import os
from playwright.sync_api import sync_playwright

def test_territoriality_exclusion():
    html_path = os.path.abspath("index.html")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{html_path}")
        page.wait_for_timeout(1000)
        
        res = page.evaluate("""
            () => {
                const results = {};
                
                // Practice in Torino
                const praticaTorino = {
                    valoreImmobile: 200000,
                    importoMutuo: 160000,
                    durata: 25,
                    provImmobile: "Torino",
                    provResidenza: "Torino",
                    provLavoro: "Torino",
                    tipoTasso: "fisso",
                    finalita: "acquisto",
                    hasCpi: true,
                    totalIncome: 3500,
                    subjects: [{ role: "Intestatario", incomeNetto: 3500, eta: 35, contratto: "tempo_indeterminato" }]
                };
                
                // Setup bank with branches only in Palermo
                BrokerFlowEngine.branchesDb["bank_palermo_only"] = [
                    { name: "Sede Palermo", prov: "Palermo", indirizzo: "Via Roma 1, Palermo (PA)" }
                ];
                BrokerFlowEngine.bankPolicies["bank_palermo_only"] = {
                    id: "bank_palermo_only",
                    name: "Banca Palermo Only",
                    minLoan: 50000,
                    maxLoan: 500000,
                    minDuration: 10,
                    maxDuration: 30,
                    maxDsr: 0.35,
                    maxLtv: 0.80,
                    isNationwide: false,
                    territories: null
                };
                
                // When in Torino, bank_palermo_only MUST NOT BE in allEvaluated at all!
                const evalTorino = BrokerFlowEngine.evaluate(praticaTorino);
                const foundInTorino = evalTorino.allEvaluated.find(b => b.bankId === "bank_palermo_only");
                results.foundInTorino = !!foundInTorino;
                
                // When in Palermo, bank_palermo_only MUST BE in allEvaluated and evaluated!
                const praticaPalermo = { ...praticaTorino, provImmobile: "Palermo", provResidenza: "Palermo", provLavoro: "Palermo" };
                const evalPalermo = BrokerFlowEngine.evaluate(praticaPalermo);
                const foundInPalermo = evalPalermo.allEvaluated.find(b => b.bankId === "bank_palermo_only");
                results.foundInPalermo = !!foundInPalermo;
                
                // Cleanup
                delete BrokerFlowEngine.bankPolicies["bank_palermo_only"];
                delete BrokerFlowEngine.branchesDb["bank_palermo_only"];
                
                return results;
            }
        """)
        
        print("Test Exclusion Results:", res)
        assert res["foundInTorino"] == False, "Bank outside territoriality MUST NOT appear in results"
        assert res["foundInPalermo"] == True, "Bank inside territoriality MUST appear in results"
        print("ALL EXCLUSION TESTS PASSED SUCCESSFULLY!")
        browser.close()

if __name__ == "__main__":
    test_territoriality_exclusion()
