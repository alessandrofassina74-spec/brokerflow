const { BrokerFlowEngine, PraticaHelper } = require('../engine.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
    }
}

console.log("=== RUNNING POLICY BRANCHING TESTS ===\n");

// Base practice template
const basePratica = {
    finalita: "acquisto_prima_casa",
    valoreImmobile: 200000,
    importoMutuo: 150000,
    durataAnni: 25,
    etaRichiedente: 35,
    redditoNetto: 2500,
    altreRate: 0,
    personeNucleo: 2,
    subjects: [
        {
            role: "richiedente",
            type: "dipendente_indeterminato",
            netIncome: 2500,
            monthsSeniority: 48,
            age: 35,
            isOwner: true
        }
    ]
};

// 1. Pluri-Ipoteca (Doppia Garanzia)
console.log("Test 1: Pluri-Ipoteca (100% LTV on purchase with 2nd property)");
{
    const p1 = {
        ...basePratica,
        valoreImmobile: 200000,
        importoMutuo: 200000, // 100% standard LTV
        hasSecondProperty: true,
        secondPropertyValue: 100000, // Total collateral = 300k, aggregated LTV = 66.67%
        secondPropertyHasMortgage: false,
        secondPropertyIntestatario: "richiedente",
        secondPropertyComune: "Milano"
    };

    const resMediobanca = BrokerFlowEngine.evaluateDeal(p1, "mediobanca_premier");
    const ltvCheckMB = resMediobanca.checks.find(c => c.name === "LTV Massimo");
    assert(ltvCheckMB && ltvCheckMB.status === "ok", "Mediobanca Premier accepts 100% purchase with second property (aggregated LTV 66.7% <= 75%)");

    const resBper = BrokerFlowEngine.evaluateDeal(p1, "bper");
    const ltvCheckBper = resBper.checks.find(c => c.name === "LTV Massimo");
    assert(ltvCheckBper && ltvCheckBper.status === "ok", "BPER accepts 100% purchase with second property (aggregated LTV 66.7% <= 80%)");

    const resCA = BrokerFlowEngine.evaluateDeal(p1, "credt_agricole");
    const ltvCheckCA = resCA.checks.find(c => c.name === "LTV Massimo");
    assert(ltvCheckCA && ltvCheckCA.status === "ok", "Crédit Agricole accepts 100% purchase with second property (aggregated LTV 66.7% <= 80%)");
}

// 2. Acquisto + Sostituzione (Cambio Casa)
console.log("\nTest 2: Acquisto + Sostituzione (Cambio Casa)");
{
    const pAcqSost = {
        ...basePratica,
        finalita: "acquisto_sostituzione",
        valoreImmobile: 250000,
        importoMutuo: 180000, // new purchase needs
        hasSecondProperty: true,
        secondPropertyValue: 200000,
        secondPropertyHasMortgage: true,
        accorpaMutuoEsistente: true,
        secondMortgageResiduo: 70000,
        secondMortgageRataAttuale: 450,
        secondMortgageMesiAmmortamento: 24, // >= 12 months
        altreRate: 450 // User originally entered current mortgage installment
    };

    // Commitment check
    const comm = PraticaHelper.calculateTotalCommitments(pAcqSost);
    assert(comm === 0, "PraticaHelper eliminates the replaced mortgage installment (€450) from commitments");

    // Mediobanca with >= 12 months
    const resMB_ok = BrokerFlowEngine.evaluateDeal(pAcqSost, "mediobanca_premier");
    const acqCheckMB = resMB_ok.checks.find(c => c.name === "Finalità");
    assert(acqCheckMB && acqCheckMB.status === "ok", "Mediobanca Premier allows acquisto_sostituzione with 24 months repayment");

    // Mediobanca with < 12 months
    const pAcqSost_short = { ...pAcqSost, secondMortgageMesiAmmortamento: 6 };
    const resMB_ko = BrokerFlowEngine.evaluateDeal(pAcqSost_short, "mediobanca_premier");
    const acqCheckMB_ko = resMB_ko.checks.find(c => c.name === "Finalità");
    assert(acqCheckMB_ko && acqCheckMB_ko.status === "ko", "Mediobanca Premier rejects acquisto_sostituzione with only 6 months repayment (< 12)");
}

// 3. Green Mutui (Classe A/B)
console.log("\nTest 3: Green Mutui (Classe A/B)");
{
    // CA 90% LTV Green
    const pGreenCA = {
        ...basePratica,
        valoreImmobile: 200000,
        importoMutuo: 180000, // 90% LTV without Consap
        classeEnergetica: "green_ab"
    };
    const resCA_green = BrokerFlowEngine.evaluateDeal(pGreenCA, "credt_agricole");
    const ltvCheckCA = resCA_green.checks.find(c => c.name === "LTV Massimo");
    assert(ltvCheckCA && ltvCheckCA.status === "deroga", "Crédit Agricole allows 90% LTV in deroga for Green property (Classe A/B)");

    // Mediobanca Premier Green spread discount
    const resMB_green = BrokerFlowEngine.evaluateDeal(pGreenCA, "mediobanca_premier");
    const greenNote = resMB_green.notes.find(n => n.includes("Green"));
    assert(greenNote !== undefined, "Mediobanca Premier notes discount of 30 bps (-0.30%) for Green property");
}

// 4. Garante Age 82
console.log("\nTest 4: Garante Age 82");
{
    const pGarante82 = {
        ...basePratica,
        durataAnni: 10,
        subjects: [
            basePratica.subjects[0],
            {
                role: "garante",
                type: "pensionato",
                netIncome: 1800,
                age: 72, // 72 + 10 = 82 at maturity
                relationship: "genitore"
            }
        ]
    };

    const resCA = BrokerFlowEngine.evaluateDeal(pGarante82, "credt_agricole");
    const gCheckCA = resCA.checks.find(c => c.name.includes("Garante"));
    assert(gCheckCA && gCheckCA.status === "deroga" && gCheckCA.detail.includes("85 anni"), "Crédit Agricole admits guarantor up to 85 years in deroga");

    const resBper = BrokerFlowEngine.evaluateDeal(pGarante82, "bper");
    const gCheckBper = resBper.checks.find(c => c.name.includes("Garante"));
    assert(gCheckBper && gCheckBper.status === "ko", "Standard bank (BPER) rejects guarantor at age 82 (> 80)");
}

// 5. Sibling Guarantor (Mediobanca Premier)
console.log("\nTest 5: Sibling Guarantor on Mediobanca Premier");
{
    const pSiblingAutonomo = {
        ...basePratica,
        subjects: [
            basePratica.subjects[0],
            {
                role: "garante",
                type: "dipendente_indeterminato",
                netIncome: 2000,
                age: 30,
                relationship: "fratello_sorella",
                fratelloNucleoAutonomo: true
            }
        ]
    };
    const resMB_autonomo = BrokerFlowEngine.evaluateDeal(pSiblingAutonomo, "mediobanca_premier");
    const dscrMB_autonomo = resMB_autonomo.dscr;

    const pSiblingNonAutonomo = {
        ...basePratica,
        subjects: [
            basePratica.subjects[0],
            {
                role: "garante",
                type: "dipendente_indeterminato",
                netIncome: 2000,
                age: 30,
                relationship: "fratello_sorella",
                fratelloNucleoAutonomo: false
            }
        ]
    };
    const resMB_nonAutonomo = BrokerFlowEngine.evaluateDeal(pSiblingNonAutonomo, "mediobanca_premier");
    const dscrMB_nonAutonomo = resMB_nonAutonomo.dscr;

    assert(dscrMB_autonomo < dscrMB_nonAutonomo, "Mediobanca Premier weighs autonomous sibling income higher (100% vs 50%), resulting in better (lower) DSCR");
}

// 6. Seasonal Worker
console.log("\nTest 6: Seasonal Worker");
{
    const pStagionale2 = {
        ...basePratica,
        isStagionale: true,
        stagioniConsecutive: 3,
        subjects: [
            {
                role: "richiedente",
                type: "dipendente_determinato",
                netIncome: 2200,
                age: 32,
                isOwner: true
            }
        ]
    };

    const resCA = BrokerFlowEngine.evaluateDeal(pStagionale2, "credt_agricole");
    const jobCheckCA = resCA.checks.find(c => c.name === "Contratto di Lavoro");
    assert(jobCheckCA && jobCheckCA.status === "deroga", "Crédit Agricole evaluates multi-year seasonal worker as deroga");

    const resBdS = BrokerFlowEngine.evaluateDeal(pStagionale2, "banco_di_sardegna");
    const jobCheckBdS = resBdS.checks.find(c => c.name === "Contratto di Lavoro");
    assert(jobCheckBdS && jobCheckBdS.status === "deroga", "Banco di Sardegna evaluates multi-year seasonal worker as deroga");
}

// 7. Banco di Sardegna Pure Liquidity Cap (50%)
console.log("\nTest 7: Banco di Sardegna Pure Liquidity Cap");
{
    const pLiq60 = {
        ...basePratica,
        finalita: "sostituzione_liquidita",
        importoMutuo: 100000,
        liquiditaPura: 60000 // 60% > 50%
    };
    const resBdS_ko = BrokerFlowEngine.evaluateDeal(pLiq60, "banco_di_sardegna");
    const liqCheck_ko = resBdS_ko.checks.find(c => c.name === "Quota Liquidità Pura");
    assert(liqCheck_ko && liqCheck_ko.status === "ko", "Banco di Sardegna rejects pure liquidity > 50% of loan amount");

    const pLiq40 = {
        ...basePratica,
        finalita: "sostituzione_liquidita",
        importoMutuo: 100000,
        liquiditaPura: 40000 // 40% <= 50%
    };
    const resBdS_ok = BrokerFlowEngine.evaluateDeal(pLiq40, "banco_di_sardegna");
    const liqCheck_ok = resBdS_ok.checks.find(c => c.name === "Quota Liquidità Pura");
    assert(liqCheck_ok && liqCheck_ok.status === "ok", "Banco di Sardegna accepts pure liquidity <= 50% of loan amount");
}

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} tests passed ===`);
if (passedTests === totalTests) {
    console.log("ALL TESTS COMPLETED SUCCESSFULLY! 🎉");
    process.exit(0);
} else {
    console.error("SOME TESTS FAILED.");
    process.exit(1);
}
