import json
import os
from playwright.sync_api import sync_playwright

def run_simulation():
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    engine_path = os.path.join(workspace, "engine.js")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content("<html><head></head><body><h1>Systematic Bias Audit</h1></body></html>")
        page.add_script_tag(path=engine_path)

        script = """
        () => {
            const allBanks = [
                "banco_di_sardegna", "bdm", "bnl", "bper",
                "credit agricole italia", "ing", "mediobanca_premier",
                "mps", "sparkasse"
            ];

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
                        netto: 2500,
                        incomeNetto: 2500,
                        anzianitaMesi: 48,
                        eta: 35,
                        isOwner: true
                    }
                ]
            };

            // DIMENSION 1: Baseline Parity (Standard Client)
            const baseRes = BrokerFlowEngine.evaluate(basePratica);
            const baselineResults = baseRes.allEvaluated.map(b => ({
                bankId: b.bankId,
                name: b.name,
                status: b.status,
                rata: b.rata,
                tan: b.tan,
                dsr: b.dsr,
                maxLoan: b.maxLoanGrantable,
                checks: b.checks.map(c => ({ name: c.name, status: c.status, ok: c.ok, text: c.text }))
            }));

            // DIMENSION 2: Contract Type Disparity (Testing synonyms and contract types)
            const contractTypes = [
                { id: "tempo_indeterminato", label: "Dipendente TI (tempo_indeterminato)", subj: { tipoContratto: "tempo_indeterminato", anzianitaMesi: 48, eta: 35 } },
                { id: "dipendente_ti", label: "Dipendente TI (dipendente_ti)", subj: { tipoContratto: "dipendente_ti", anzianitaMesi: 48, eta: 35 } },
                { id: "tempo_determinato", label: "Dipendente TD (tempo_determinato)", subj: { tipoContratto: "tempo_determinato", anzianitaMesi: 24, eta: 35 } },
                { id: "autonomo_ordinario", label: "Autonomo Ordinario (autonomo)", subj: { tipoContratto: "autonomo", anzianitaMesi: 36, eta: 35 } },
                { id: "forfettario", label: "Forfettario (autonomo_forfettario)", subj: { tipoContratto: "autonomo_forfettario", anzianitaMesi: 36, eta: 35 } },
                { id: "pensionato", label: "Pensionato (65 anni)", subj: { tipoContratto: "pensionato", anzianitaMesi: 120, eta: 65 } },
                { id: "stagionale", label: "Stagionale Pluriennale (3 stagioni)", subj: { tipoContratto: "tempo_determinato", anzianitaMesi: 36, eta: 35 }, isStagionale: true, stagioniConsecutive: 3 }
            ];

            const contractResults = {};
            for (const c of contractTypes) {
                const p = {
                    ...basePratica,
                    isStagionale: !!c.isStagionale,
                    stagioniConsecutive: c.stagioniConsecutive || 0,
                    subjects: [{
                        ...basePratica.subjects[0],
                        ...c.subj,
                        netto: 2500,
                        incomeNetto: 2500
                    }]
                };
                const res = BrokerFlowEngine.evaluate(p);
                contractResults[c.id] = {
                    label: c.label,
                    feasibleCount: res.banks.length,
                    bankStatus: res.allEvaluated.reduce((acc, b) => { acc[b.bankId] = { status: b.status, rata: b.rata }; return acc; }, {})
                };
            }

            // DIMENSION 3: LTV Tiers Disparity (50%, 80%, 90%, 100% Standard, 100% Consap, 90% Green, 100% Pluri-Ipoteca)
            const ltvTiers = [
                { id: "ltv_50", label: "LTV 50%", val: 300000, loan: 150000 },
                { id: "ltv_80", label: "LTV 80%", val: 200000, loan: 160000 },
                { id: "ltv_90", label: "LTV 90% (Standard)", val: 200000, loan: 180000 },
                { id: "ltv_90_green", label: "LTV 90% (Green A/B)", val: 200000, loan: 180000, classeEnergetica: "green_ab", isGreen: true },
                { id: "ltv_100_consap", label: "LTV 100% (CONSAP)", val: 200000, loan: 200000, isConsap: true },
                { id: "ltv_100_pluri", label: "LTV 100% (Pluri-Ipoteca 2° imm 100k)", val: 200000, loan: 200000, hasSecondProperty: true, secondPropertyValue: 100000, secondHasMortgage: "no", secondIntestatario: "richiedente", secondComune: "Milano" }
            ];

            const ltvResults = {};
            for (const tier of ltvTiers) {
                const p = {
                    ...basePratica,
                    valoreImmobile: tier.val,
                    importoMutuo: tier.loan,
                    importoMutuoOriginale: tier.loan,
                    isConsap: !!tier.isConsap,
                    classeEnergetica: tier.classeEnergetica || "",
                    isGreen: !!tier.isGreen,
                    hasSecondProperty: !!tier.hasSecondProperty,
                    secondPropertyValue: tier.secondPropertyValue || 0,
                    secondHasMortgage: tier.secondHasMortgage || "no",
                    secondIntestatario: tier.secondIntestatario || "",
                    secondComune: tier.secondComune || ""
                };
                const res = BrokerFlowEngine.evaluate(p);
                ltvResults[tier.id] = {
                    label: tier.label,
                    feasibleCount: res.banks.length,
                    bankStatus: res.allEvaluated.reduce((acc, b) => { acc[b.bankId] = { status: b.status, rata: b.rata }; return acc; }, {})
                };
            }

            // DIMENSION 4: Income & MRI (Sussistenza Minima) Stress Test
            // Single applicant: €1,200, €1,600, €2,200 vs Family of 4 (2 adults, 2 kids): €2,200, €3,000, €4,000
            const incomeMriScenarios = [
                { id: "single_1200", label: "Single 1200€ netti", income: 1200, persone: 1, loan: 80000, val: 120000 },
                { id: "single_1600", label: "Single 1600€ netti", income: 1600, persone: 1, loan: 110000, val: 150000 },
                { id: "family_2200", label: "Famiglia 4p 2200€ netti", income: 2200, persone: 4, numFigli: 2, loan: 130000, val: 180000 },
                { id: "family_3000", label: "Famiglia 4p 3000€ netti", income: 3000, persone: 4, numFigli: 2, loan: 160000, val: 220000 },
                { id: "family_4000", label: "Famiglia 4p 4000€ netti", income: 4000, persone: 4, numFigli: 2, loan: 200000, val: 280000 }
            ];

            const incomeMriResults = {};
            for (const s of incomeMriScenarios) {
                const p = {
                    ...basePratica,
                    valoreImmobile: s.val,
                    importoMutuo: s.loan,
                    importoMutuoOriginale: s.loan,
                    personeNucleo: s.persone,
                    numFigli: s.numFigli || 0,
                    totalIncome: s.income,
                    subjects: [{
                        ...basePratica.subjects[0],
                        netto: s.income,
                        incomeNetto: s.income
                    }]
                };
                const res = BrokerFlowEngine.evaluate(p);
                incomeMriResults[s.id] = {
                    label: s.label,
                    feasibleCount: res.banks.length,
                    bankStatus: res.allEvaluated.reduce((acc, b) => { 
                        const mriCheck = b.checks.find(c => c.name.includes("MRI") || c.name.includes("Sussistenza"));
                        const dsrCheck = b.checks.find(c => c.name.includes("DSR") || c.name.includes("Rapporto"));
                        acc[b.bankId] = { 
                            status: b.status, 
                            rata: b.rata, 
                            mriCheck: mriCheck ? mriCheck.status : "N/A",
                            dsrCheck: dsrCheck ? dsrCheck.status : "N/A",
                            residual: b.residual
                        }; 
                        return acc; 
                    }, {})
                };
            }

            // DIMENSION 5: Geographic / Territorial Distribution
            const provinces = ["Milano", "Torino", "Bologna", "Roma", "Firenze", "Napoli", "Bari", "Palermo", "Cagliari", "Sassari"];
            const geoResults = {};
            for (const prov of provinces) {
                const p = {
                    ...basePratica,
                    provImmobile: prov,
                    provResidenza: prov,
                    provLavoro: prov
                };
                const res = BrokerFlowEngine.evaluate(p);
                geoResults[prov] = {
                    feasibleCount: res.banks.length,
                    bankStatus: res.allEvaluated.reduce((acc, b) => {
                        const geoCheck = b.checks.find(c => c.name.includes("Territoriale") || c.name.includes("Filiale") || c.name.includes("Provincia"));
                        acc[b.bankId] = { status: b.status, geoCheck: geoCheck ? geoCheck.status : "ok" };
                        return acc;
                    }, {})
                };
            }

            // DIMENSION 6: Age & Tenor Disparity
            const ageScenarios = [
                { id: "young_25", label: "25 anni / durata 30", age: 25, duration: 30 },
                { id: "mid_45", label: "45 anni / durata 30", age: 45, duration: 30 },
                { id: "senior_55_dur25", label: "55 anni / durata 25 (scadenza 80)", age: 55, duration: 25 },
                { id: "senior_58_dur25", label: "58 anni / durata 25 (scadenza 83)", age: 58, duration: 25 },
                { id: "guarantor_82", label: "Richiedente 30A + Garante 72A (scadenza 82, dur 10)", age: 30, duration: 10, hasGuarantor: true, guarantorAge: 72 }
            ];
            const ageResults = {};
            for (const a of ageScenarios) {
                const p = {
                    ...basePratica,
                    durata: a.duration,
                    subjects: [
                        {
                            ...basePratica.subjects[0],
                            eta: a.age
                        }
                    ]
                };
                if (a.hasGuarantor) {
                    p.subjects.push({
                        role: "Garante",
                        tipoContratto: "pensionato",
                        incomeNetto: 1800,
                        eta: a.guarantorAge,
                        rapporto: "genitore"
                    });
                }
                const res = BrokerFlowEngine.evaluate(p);
                ageResults[a.id] = {
                    label: a.label,
                    feasibleCount: res.banks.length,
                    bankStatus: res.allEvaluated.reduce((acc, b) => {
                        const ageCheck = b.checks.find(c => c.name.includes("Età"));
                        acc[b.bankId] = { status: b.status, ageCheck: ageCheck ? { status: ageCheck.status, text: ageCheck.text } : null };
                        return acc;
                    }, {})
                };
            }

            return {
                allBanks,
                baselineResults,
                contractResults,
                ltvResults,
                incomeMriResults,
                geoResults,
                ageResults
            };
        }
        """

        data = page.evaluate(script)
        browser.close()
        return data

if __name__ == "__main__":
    report = run_simulation()
    with open("/Users/alessandrofassina/Desktop/broker flow/scratch/systematic_bias_report.json", "w") as f:
        json.dump(report, f, indent=2)
    print("Simulation complete! Results saved to scratch/systematic_bias_report.json")
