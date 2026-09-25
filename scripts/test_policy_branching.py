import os
import sys
from playwright.sync_api import sync_playwright

def run_tests():
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    engine_path = os.path.join(workspace, "engine.js")

    with open(engine_path, "r", encoding="utf-8") as f:
        engine_code = f.read()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print("PAGE LOG:", msg.text))

        page.set_content("<html><head></head><body><h1>Test Policy Branching</h1></body></html>")
        page.add_script_tag(path=engine_path)

        test_script = """
        () => {
            const results = [];
            function assert(cond, desc) {
                results.push({ passed: !!cond, desc });
            }

            const basePratica = {
                finalita: "acquisto",
                valoreImmobile: 200000,
                importoMutuo: 150000,
                importoMutuoOriginale: 150000,
                durata: 25,
                tipoTasso: "fisso",
                etaFigli: "",
                numFigli: 0,
                altreRate: 0,
                personeNucleo: 2,
                zona: "nord",
                provImmobile: "Milano",
                provResidenza: "Milano",
                provLavoro: "Milano",
                totalIncome: 2500,
                exclusions: { pignoramenti: false, ritardi: false },
                subjects: [
                    {
                        role: "Richiedente Principale",
                        tipoContratto: "tempo_indeterminato",
                        incomeNetto: 2500,
                        anzianitaMesi: 48,
                        eta: 35,
                        isOwner: true
                    }
                ]
            };

            // 1. Pluri-Ipoteca (100% LTV on purchase with 2nd property)
            {
                const p1 = {
                    ...basePratica,
                    valoreImmobile: 200000,
                    importoMutuo: 200000, // 100% standard LTV
                    importoMutuoOriginale: 200000,
                    hasSecondProperty: true,
                    secondPropertyValue: 100000, // Total collateral = 300k, aggregated LTV = 66.67%
                    secondHasMortgage: "no",
                    secondIntestatario: "richiedente",
                    secondComune: "Milano"
                };

                const res = BrokerFlowEngine.evaluate(p1);
                const evaluated = res.allEvaluated;
                console.log("All bank IDs in evaluate:", evaluated.map(b => b.bankId));

                const mb = evaluated.find(b => b.bankId === "mediobanca_premier" || b.bankId.includes("mediobanca"));
                const ltvMB = mb ? mb.checks.find(c => c.name === "LTV Massimo") : null;
                assert(ltvMB && ltvMB.status === "ok", "Mediobanca Premier accepts 100% purchase with 2nd property (agg LTV 66.7% <= 75%)");

                const bper = evaluated.find(b => b.bankId === "bper");
                const ltvBper = bper.checks.find(c => c.name === "LTV Massimo");
                assert(ltvBper && ltvBper.status === "ok", "BPER accepts 100% purchase with 2nd property (agg LTV 66.7% <= 80%)");

                const ca = evaluated.find(b => b.bankId.includes("agricole"));
                const ltvCA = ca.checks.find(c => c.name === "LTV Massimo");
                assert(ltvCA && ltvCA.status === "ok", "Crédit Agricole accepts 100% purchase with 2nd property (agg LTV 66.7% <= 80%)");
            }

            // 2. Acquisto + Sostituzione (Cambio Casa)
            {
                const pAcqSost = {
                    ...basePratica,
                    finalita: "acquisto_sostituzione",
                    valoreImmobile: 250000,
                    importoMutuo: 180000,
                    importoMutuoOriginale: 180000,
                    hasSecondProperty: true,
                    secondPropertyValue: 200000,
                    secondHasMortgage: "si",
                    accorpaMutuoEsistente: true,
                    secondDebitoResiduo: 70000,
                    secondRataAttuale: 450,
                    secondMesiAmmortamento: 24,
                    altreRate: 450
                };

                const comm = PraticaHelper.calculateTotalCommitments(pAcqSost);
                assert(comm === 0, "PraticaHelper eliminates the replaced mortgage installment (€450) from commitments");

                const res_ok = BrokerFlowEngine.evaluate(pAcqSost);
                const mb_ok = res_ok.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                const finMB = mb_ok.checks.find(c => c.name === "Finalità");
                assert(finMB && finMB.status === "ok", "Mediobanca Premier allows acquisto_sostituzione with 24 months repayment");

                const pAcqSost_short = { ...pAcqSost, secondMesiAmmortamento: 6 };
                const res_ko = BrokerFlowEngine.evaluate(pAcqSost_short);
                const mb_ko = res_ko.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                const finMB_ko = mb_ko.checks.find(c => c.name === "Finalità");
                assert(finMB_ko && finMB_ko.status === "ko", "Mediobanca Premier rejects acquisto_sostituzione with only 6 months repayment (< 12)");
            }

            // 3. Green Mutui (Classe A/B)
            {
                const pGreenCA = {
                    ...basePratica,
                    valoreImmobile: 200000,
                    importoMutuo: 180000, // 90% LTV without Consap
                    importoMutuoOriginale: 180000,
                    classeEnergetica: "green_ab"
                };
                const res = BrokerFlowEngine.evaluate(pGreenCA);
                const ca = res.allEvaluated.find(b => b.bankId.includes("agricole"));
                const ltvCA = ca.checks.find(c => c.name === "LTV Massimo");
                assert(ltvCA && ltvCA.status === "deroga", "Crédit Agricole allows 90% LTV in deroga for Green property (Classe A/B)");

                const mb = res.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                const greenNote = mb.notes.find(n => n.includes("Green") || n.includes("30 bps"));
                assert(greenNote !== undefined, "Mediobanca Premier notes discount of 30 bps (-0.30%) for Green property");
            }

            // 4. Garante Age 82
            {
                const pGarante82 = {
                    ...basePratica,
                    durata: 10,
                    subjects: [
                        basePratica.subjects[0],
                        {
                            role: "Garante",
                            tipoContratto: "pensionato",
                            incomeNetto: 1800,
                            eta: 72, // 72 + 10 = 82 at maturity
                            rapporto: "genitore"
                        }
                    ]
                };

                const res = BrokerFlowEngine.evaluate(pGarante82);
                const ca = res.allEvaluated.find(b => b.bankId.includes("agricole"));
                const gCheckCA = ca.checks.find(c => c.name.includes("Età"));
                assert(gCheckCA && gCheckCA.status === "deroga" && gCheckCA.text.includes("85"), "Crédit Agricole admits guarantor up to 85 years in deroga");

                const bper = res.allEvaluated.find(b => b.bankId === "bper");
                const gCheckBper = bper.checks.find(c => c.name.includes("Età"));
                assert(gCheckBper && gCheckBper.status === "ko", "Standard bank (BPER) rejects guarantor at age 82 (> 80)");
            }

            // 5. Sibling Guarantor (Mediobanca Premier)
            {
                const pSiblingAutonomo = {
                    ...basePratica,
                    durata: 20,
                    subjects: [
                        basePratica.subjects[0],
                        {
                            role: "Garante",
                            tipoContratto: "tempo_indeterminato",
                            incomeNetto: 2000,
                            eta: 30,
                            rapporto: "fratello_sorella",
                            fratelloNucleoAutonomo: true
                        }
                    ]
                };
                const resAutonomo = BrokerFlowEngine.evaluate(pSiblingAutonomo);
                const mb_autonomo = resAutonomo.allEvaluated.find(b => b.bankId === "mediobanca_premier");

                const pSiblingNonAutonomo = {
                    ...basePratica,
                    durata: 20,
                    subjects: [
                        basePratica.subjects[0],
                        {
                            role: "Garante",
                            tipoContratto: "tempo_indeterminato",
                            incomeNetto: 2000,
                            eta: 30,
                            rapporto: "fratello_sorella",
                            fratelloNucleoAutonomo: false
                        }
                    ]
                };
                const resNonAutonomo = BrokerFlowEngine.evaluate(pSiblingNonAutonomo);
                const mb_nonAutonomo = resNonAutonomo.allEvaluated.find(b => b.bankId === "mediobanca_premier");

                assert(mb_autonomo.dsr < mb_nonAutonomo.dsr, "Mediobanca Premier weighs autonomous sibling income higher (100% vs 50%), resulting in lower/better DSR");
            }

            // 6. Seasonal Worker
            {
                const pStagionale2 = {
                    ...basePratica,
                    isStagionale: true,
                    stagioniConsecutive: 3,
                    subjects: [
                        {
                            role: "Richiedente Principale",
                            tipoContratto: "tempo_determinato",
                            incomeNetto: 2200,
                            eta: 32,
                            isOwner: true
                        }
                    ]
                };

                const res = BrokerFlowEngine.evaluate(pStagionale2);
                const ca = res.allEvaluated.find(b => b.bankId.includes("agricole"));
                const jobCA = ca.checks.find(c => c.name === "Tipologia Contrattuale");
                assert(jobCA && jobCA.status === "deroga", "Crédit Agricole evaluates multi-year seasonal worker as deroga");

                const pStagionaleBdS = {
                    ...pStagionale2,
                    provImmobile: "Sassari",
                    provResidenza: "Sassari",
                    provLavoro: "Sassari"
                };
                const resBdS = BrokerFlowEngine.evaluate(pStagionaleBdS);
                const bds = resBdS.allEvaluated.find(b => b.bankId === "banco_di_sardegna");
                const jobBdS = bds.checks.find(c => c.name === "Tipologia Contrattuale");
                assert(jobBdS && jobBdS.status === "deroga", "Banco di Sardegna evaluates multi-year seasonal worker as deroga");
            }

            // 7. Banco di Sardegna Pure Liquidity Cap (50%)
            {
                const pLiq60 = {
                    ...basePratica,
                    provImmobile: "Sassari",
                    provResidenza: "Sassari",
                    provLavoro: "Sassari",
                    finalita: "sostituzione",
                    importoMutuo: 100000,
                    importoMutuoOriginale: 100000,
                    liquiditaPura: 60000
                };
                const res_ko = BrokerFlowEngine.evaluate(pLiq60);
                const bds_ko = res_ko.allEvaluated.find(b => b.bankId === "banco_di_sardegna");
                const liqCheck_ko = bds_ko.checks.find(c => c.name === "Quota Liquidità Pura");
                assert(liqCheck_ko && liqCheck_ko.status === "ko", "Banco di Sardegna rejects pure liquidity > 50% of loan amount");

                const pLiq40 = {
                    ...basePratica,
                    provImmobile: "Sassari",
                    provResidenza: "Sassari",
                    provLavoro: "Sassari",
                    finalita: "sostituzione",
                    importoMutuo: 100000,
                    importoMutuoOriginale: 100000,
                    liquiditaPura: 40000
                };
                const res_ok = BrokerFlowEngine.evaluate(pLiq40);
                const bds_ok = res_ok.allEvaluated.find(b => b.bankId === "banco_di_sardegna");
                const liqCheck_ok = bds_ok.checks.find(c => c.name === "Quota Liquidità Pura");
                assert(liqCheck_ok && liqCheck_ok.status === "ok", "Banco di Sardegna accepts pure liquidity <= 50% of loan amount");
            }

            // 8. Crédit Agricole Patrimonio Mobiliare / Closing costs check
            {
                const pPatrimonioOk = {
                    ...basePratica,
                    valoreImmobile: 200000,
                    patrimonioMobiliare: 20000 // 20k > 8% (16k)
                };
                const resPatOk = BrokerFlowEngine.evaluate(pPatrimonioOk);
                const caPatOk = resPatOk.allEvaluated.find(b => b.bankId.includes("agricole"));
                const patCheckOk = caPatOk.checks.find(c => c.name.includes("Patrimonio"));
                assert(patCheckOk && patCheckOk.status === "ok", "Crédit Agricole verifies sufficient savings (20k >= 8% of 200k) with status ok");

                const pPatrimonioZero = {
                    ...basePratica,
                    valoreImmobile: 200000,
                    patrimonioMobiliare: 0 // 0 < 8% (16k)
                };
                const resPatZero = BrokerFlowEngine.evaluate(pPatrimonioZero);
                const caPatZero = resPatZero.allEvaluated.find(b => b.bankId.includes("agricole"));
                const patCheckZero = caPatZero.checks.find(c => c.name.includes("Patrimonio"));
                assert(patCheckZero && patCheckZero.status === "deroga", "Crédit Agricole flags zero/insufficient savings in deroga to alert broker");
            }

            // 9. Mediobanca Premier Liquidità Aggiuntiva Cap
            {
                const pLiqMB_ko = {
                    ...basePratica,
                    finalita: "sostituzione",
                    importoMutuo: 120000,
                    liquiditaPura: 65000, // > 50k without mortgage
                    accorpaMutuoEsistente: false
                };
                const resMB_ko = BrokerFlowEngine.evaluate(pLiqMB_ko);
                const mb_ko = resMB_ko.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                const liqMB_ko = mb_ko.checks.find(c => c.name.includes("Quota Liquidità"));
                assert(liqMB_ko && liqMB_ko.status === "ko", "Mediobanca Premier rejects pure liquidity > 50k without existing mortgage");

                const pLiqMB_ok = {
                    ...basePratica,
                    finalita: "sostituzione",
                    importoMutuo: 150000,
                    liquiditaPura: 80000, // <= 100k with existing mortgage
                    accorpaMutuoEsistente: true
                };
                const resMB_ok = BrokerFlowEngine.evaluate(pLiqMB_ok);
                const mb_ok = resMB_ok.allEvaluated.find(b => b.bankId === "mediobanca_premier");
                const liqMB_ok = mb_ok.checks.find(c => c.name.includes("Quota Liquidità"));
                assert(liqMB_ok && liqMB_ok.status === "ok", "Mediobanca Premier accepts pure liquidity up to 100k when consolidating existing mortgage");
            }

            return results;
        }
        """

        results = page.evaluate(test_script)
        browser.close()

        passed = sum(1 for r in results if r["passed"])
        total = len(results)

        print("\n========================================================")
        print("       POLICY BRANCHING TEST EXECUTION RESULTS          ")
        print("========================================================\n")
        for r in results:
            icon = "✅" if r["passed"] else "❌"
            print(f"{icon} {r['desc']}")

        print(f"\nSummary: {passed}/{total} tests passed.")
        if passed == total:
            print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
            sys.exit(0)
        else:
            print("\n⚠️ SOME TESTS FAILED.")
            sys.exit(1)

if __name__ == "__main__":
    run_tests()
