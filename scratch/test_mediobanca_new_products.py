import os
from playwright.sync_api import sync_playwright

def test_mediobanca_products():
    html_path = os.path.abspath("index.html")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{html_path}")
        page.wait_for_timeout(1000)
        
        res = page.evaluate("""
            () => {
                const basePratica = {
                    valoreImmobile: 200000,
                    importoMutuo: 150000,
                    durata: 25,
                    provImmobile: "Milano",
                    provResidenza: "Milano",
                    provLavoro: "Milano",
                    finalita: "acquisto",
                    hasCpi: true,
                    totalIncome: 3500,
                    subjects: [{ role: "Intestatario", eta: 35, incomeNetto: 3500, contratto: "tempo_indeterminato", seniorityMesi: 36 }]
                };
                
                // 1. Test Fisso
                const evalFisso = BrokerFlowEngine.evaluate({ ...basePratica, tipoTasso: "fisso" });
                const mbFisso = evalFisso.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                
                // 2. Test Rata Protetta
                const evalProtetta = BrokerFlowEngine.evaluate({ ...basePratica, tipoTasso: "rata_protetta" });
                const mbProtetta = evalProtetta.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                
                // 3. Test Variabile con CAP
                const evalCap = BrokerFlowEngine.evaluate({ ...basePratica, tipoTasso: "cap" });
                const mbCap = evalCap.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                
                // 4. Test Variabile Standard
                const evalVar = BrokerFlowEngine.evaluate({ ...basePratica, tipoTasso: "variabile" });
                const mbVar = evalVar.allEvaluated.find(b => b.bankId === "mediobanca_premier");

                return {
                    mbFisso: mbFisso ? { status: mbFisso.status, prodName: mbFisso.productName, tan: mbFisso.tan, spread: mbFisso.spread, rata: mbFisso.rata } : null,
                    mbProtetta: mbProtetta ? { status: mbProtetta.status, prodName: mbProtetta.productName, tan: mbProtetta.tan, spread: mbProtetta.spread, rata: mbProtetta.rata } : null,
                    mbCap: mbCap ? { status: mbCap.status, prodName: mbCap.productName, tan: mbCap.tan, spread: mbCap.spread, rata: mbCap.rata } : null,
                    mbVar: mbVar ? { status: mbVar.status, prodName: mbVar.productName, tan: mbVar.tan, spread: mbVar.spread, rata: mbVar.rata } : null
                };
            }
        """)
        
        print("Mediobanca Products Evaluation Results:")
        import pprint
        pprint.pprint(res)
        
        assert res["mbFisso"] is not None and res["mbFisso"]["status"] == "ok", "Mediobanca Fisso should be evaluated"
        assert res["mbProtetta"] is not None and res["mbProtetta"]["status"] == "ok", "Mediobanca Rata Protetta should be evaluated"
        assert res["mbCap"] is not None and res["mbCap"]["status"] == "ok", "Mediobanca Cap should be evaluated"
        assert res["mbVar"] is not None and res["mbVar"]["status"] == "ok", "Mediobanca Variabile should be evaluated"
        
        print("\nALL MEDIOBANCA PRODUCT TESTS PASSED WITH SUCCESS!")
        browser.close()

if __name__ == "__main__":
    test_mediobanca_products()
