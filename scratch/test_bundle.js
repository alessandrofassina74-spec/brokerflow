const results = [];
const tassi = {
    euribor1m: 2.32,
    euribor3m: 2.65,
    euribor6m: 2.78,
    irs: 2.85,
    bce: 3.50,
    irsRates: { 20: 2.75, 25: 2.85, 30: 2.90 }
};

const findBank = (res, part) => res.allEvaluated.find(b => b.bankId.toLowerCase().includes(part.toLowerCase()) || b.name.toLowerCase().includes(part.toLowerCase()));

// TEST 1: Pluri-Ipoteca LTV 100% (Immobile 1: 200k, Immobile 2: 100k, Mutuo: 200k -> LTV agg. 66.7%)
const p1 = {
    valoreImmobile: 200000,
    importoMutuo: 200000,
    importoMutuoOriginale: 200000,
    durata: 25,
    tipoTasso: "fisso",
    isConsap: false,
    hasSecondProperty: true,
    secondPropertyValue: 100000,
    secondComune: "Milano",
    secondIntestatario: "richiedente",
    secondHasMortgage: "no",
    provImmobile: "Milano",
    provResidenza: "Milano",
    provLavoro: "Milano",
    totalIncome: 4500,
    subjects: [{
        role: "Richiedente Principale",
        nome: "Mario",
        eta: 35,
        tipoContratto: "tempo_indeterminato",
        macroCategoria: "dipendente",
        netto: 4500,
        cittadinanza: "IT",
        permScadenza: "valido"
    }],
    exclusions: {}
};
const r1 = BrokerFlowEngine.evaluate(p1, tassi);
const mbPremier1 = findBank(r1, "mediobanca");
const ltvCheckMb = mbPremier1 ? mbPremier1.checks.find(c => c.name === "LTV Massimo") : null;

const failedChecksMb1 = mbPremier1 ? mbPremier1.checks.filter(c => !c.ok).map(c => c.name + ': ' + c.text) : [];
results.push({
    test: "Pluri-Ipoteca LTV Aggregato 66.7%",
    passed: mbPremier1 && (mbPremier1.status === "ok" || mbPremier1.status === "deroga") && ltvCheckMb && ltvCheckMb.ok,
    details: (ltvCheckMb ? ltvCheckMb.text : "Check not found") + " | Status: " + (mbPremier1 ? mbPremier1.status : "null") + " | Failed checks: " + JSON.stringify(failedChecksMb1)
});

// TEST 2: Acquisto + Sostituzione con Anzianità Mutuo < 12 mesi per Mediobanca Premier
const p2 = Object.assign({}, p1, {
    finalita: "acquisto_sostituzione",
    secondHasMortgage: "si",
    accorpaSostituzione: true,
    secondDebitoResiduo: 30000,
    secondRataAttuale: 400,
    secondMesiAmmortamento: 6 // Meno di 12 mesi
});
const r2 = BrokerFlowEngine.evaluate(p2, tassi);
const mbPremier2 = findBank(r2, "mediobanca");
const finCheckMb = mbPremier2 ? mbPremier2.checks.find(c => c.name === "Finalità Operazione") : null;
results.push({
    test: "Acquisto + Sostituzione (Mesi < 12 KO per Mediobanca)",
    passed: finCheckMb && !finCheckMb.ok,
    details: finCheckMb ? finCheckMb.text : "Check not found"
});

// TEST 3: Classe Energetica Green Deroga LTV 90% Crédit Agricole & Sconto Mediobanca
const p3 = {
    valoreImmobile: 200000,
    importoMutuo: 180000, // LTV 90%
    durata: 25,
    tipoTasso: "fisso",
    isConsap: false,
    isGreen: true,
    classeEnergetica: "green_ab",
    hasSecondProperty: false,
    provImmobile: "Milano",
    provResidenza: "Milano",
    provLavoro: "Milano",
    totalIncome: 4500,
    subjects: [{
        role: "Richiedente Principale",
        nome: "Anna",
        eta: 32,
        tipoContratto: "tempo_indeterminato",
        macroCategoria: "dipendente",
        netto: 4500,
        cittadinanza: "IT",
        permScadenza: "valido"
    }],
    exclusions: {}
};
const r3 = BrokerFlowEngine.evaluate(p3, tassi);
const ca3 = findBank(r3, "agricole");
const ltvCa3 = ca3 ? ca3.checks.find(c => c.name === "LTV Massimo") : null;
const failedChecksCa3 = ca3 ? ca3.checks.filter(c => !c.ok).map(c => c.name + ': ' + c.text) : [];
results.push({
    test: "Crédit Agricole Deroga Green LTV 90% senza CONSAP",
    passed: ca3 && ca3.status !== "ko" && ltvCa3 && ltvCa3.ok,
    details: (ltvCa3 ? ltvCa3.text : "Check not found") + " | Status: " + (ca3 ? ca3.status : "null") + " | Failed checks: " + JSON.stringify(failedChecksCa3)
});

// TEST 4: Garante a scadenza 82 anni (Ammesso da Crédit Agricole fino a 85)
const p4 = {
    valoreImmobile: 200000,
    importoMutuo: 120000,
    durata: 25,
    tipoTasso: "any",
    provImmobile: "Milano",
    provResidenza: "Milano",
    provLavoro: "Milano",
    totalIncome: 2500,
    subjects: [
        {
            role: "Richiedente Principale",
            nome: "Luca",
            eta: 30,
            tipoContratto: "tempo_indeterminato",
            macroCategoria: "dipendente",
            netto: 2500,
            cittadinanza: "IT",
            permScadenza: "valido"
        },
        {
            role: "Garante",
            nome: "Giuseppe",
            eta: 57, // 57 + 25 = 82 anni
            rapporto: "genitore",
            tipoContratto: "pensionato",
            macroCategoria: "pensionato",
            netto: 1800,
            cittadinanza: "IT",
            permScadenza: "valido"
        }
    ],
    exclusions: {}
};
const r4 = BrokerFlowEngine.evaluate(p4, tassi);
const ca4 = findBank(r4, "agricole");
const bper4 = findBank(r4, "bper");
const caAgeCheck = ca4 ? ca4.checks.find(c => c.name === "Età a Scadenza") : null;
const bperAgeCheck = bper4 ? bper4.checks.find(c => c.name === "Età a Scadenza") : null;
results.push({
    test: "Garante 82 anni a scadenza (OK per CA max 85, KO per BPER max 80)",
    passed: caAgeCheck && caAgeCheck.ok && bperAgeCheck && !bperAgeCheck.ok,
    details: "CA: " + (caAgeCheck ? caAgeCheck.text : "N/A") + " | BPER: " + (bperAgeCheck ? bperAgeCheck.text : "N/A")
});

// TEST 5: Garante Fratello/Sorella con nucleo autonomo vs non autonomo (Mediobanca)
const p5Autonomo = {
    valoreImmobile: 250000,
    importoMutuo: 140000,
    durata: 25,
    tipoTasso: "any",
    provImmobile: "Milano",
    provResidenza: "Milano",
    provLavoro: "Milano",
    totalIncome: 1800,
    subjects: [
        {
            role: "Richiedente Principale",
            nome: "Luca",
            eta: 30,
            tipoContratto: "tempo_indeterminato",
            macroCategoria: "dipendente",
            netto: 1800,
            cittadinanza: "IT",
            permScadenza: "valido"
        },
        {
            role: "Garante",
            nome: "Paolo",
            eta: 35,
            rapporto: "fratello_sorella",
            fratelloNucleoAutonomo: true,
            tipoContratto: "tempo_indeterminato",
            macroCategoria: "dipendente",
            netto: 2000,
            cittadinanza: "IT",
            permScadenza: "valido"
        }
    ],
    exclusions: {}
};

const p5NonAutonomo = {
    ...p5Autonomo,
    subjects: [
        p5Autonomo.subjects[0],
        {
            ...p5Autonomo.subjects[1],
            fratelloNucleoAutonomo: false
        }
    ]
};

const r5A = BrokerFlowEngine.evaluate(p5Autonomo, tassi);
const r5B = BrokerFlowEngine.evaluate(p5NonAutonomo, tassi);
const mbA = findBank(r5A, "mediobanca");
const mbB = findBank(r5B, "mediobanca");
const resA = (mbA && mbA.residual !== undefined) ? mbA.residual : ((mbA && mbA.candidates && mbA.candidates.length > 0) ? mbA.candidates[0].residual : null);
const resB = (mbB && mbB.residual !== undefined) ? mbB.residual : ((mbB && mbB.candidates && mbB.candidates.length > 0) ? mbB.candidates[0].residual : null);

results.push({
    test: "Garante Fratello/Sorella Ponderazione Nucleo Autonomo (100% vs 50%)",
    passed: resA !== null && resB !== null && (resA > resB),
    details: "Autonomo residuo: " + resA + " € vs Non autonomo residuo: " + resB + " €"
});

// TEST 6: Lavoratore Stagionale Pluriennale (2+ stagioni)
const p6 = {
    valoreImmobile: 200000,
    importoMutuo: 140000,
    durata: 25,
    tipoTasso: "fisso",
    provImmobile: "Sassari",
    provResidenza: "Sassari",
    provLavoro: "Sassari",
    totalIncome: 2200,
    isStagionale: true,
    stagioniConsecutive: 3,
    subjects: [{
        role: "Richiedente Principale",
        nome: "Marco",
        eta: 29,
        tipoContratto: "dipendente_td",
        macroCategoria: "dipendente",
        netto: 2200,
        cittadinanza: "IT",
        permScadenza: "valido"
    }],
    exclusions: {}
};
const r6 = BrokerFlowEngine.evaluate(p6, tassi);
const bds6 = findBank(r6, "sardegna");
const ca6 = findBank(r6, "agricole");
const mps6 = findBank(r6, "monte");
const bdsTd = bds6 ? bds6.checks.find(c => c.name === "Coobbligazione TD") : null;
const caTd = ca6 ? ca6.checks.find(c => c.name === "Coobbligazione TD") : null;
const mpsTd = mps6 ? mps6.checks.find(c => c.name === "Coobbligazione TD") : null;
results.push({
    test: "Lavoratore Stagionale 3 stagioni (Deroga BdS & CA, KO per MPS)",
    passed: bdsTd && bdsTd.status === "deroga" && caTd && caTd.status === "deroga" && mpsTd && mpsTd.status === "ko",
    details: "BdS: " + bdsTd?.status + " | CA: " + caTd?.status + " | MPS: " + mpsTd?.status
});

// TEST 7: Quota Liquidità > 50% Banco di Sardegna & Massimale Mediobanca
const p7 = {
    valoreImmobile: 200000,
    importoMutuo: 100000,
    durata: 20,
    tipoTasso: "fisso",
    finalita: "liquidita",
    liquiditaPura: 60000,
    provImmobile: "Sassari",
    provResidenza: "Sassari",
    provLavoro: "Sassari",
    totalIncome: 3500,
    subjects: [{
        role: "Richiedente Principale",
        nome: "Davide",
        eta: 40,
        tipoContratto: "tempo_indeterminato",
        macroCategoria: "dipendente",
        netto: 3500,
        cittadinanza: "IT",
        permScadenza: "valido"
    }],
    exclusions: {}
};
const r7 = BrokerFlowEngine.evaluate(p7, tassi);
const bds7 = findBank(r7, "sardegna");
const mb7 = findBank(r7, "mediobanca");
const bdsLiq = bds7 ? bds7.checks.find(c => c.name.includes("Liquidità")) : null;
const mbLiq = mb7 ? mb7.checks.find(c => c.name.includes("Liquidità")) : null;
results.push({
    test: "Quota Liquidità 60% (KO BdS > 50% & KO Mediobanca > 50k senza mutuo)",
    passed: bdsLiq && !bdsLiq.ok && mbLiq && !mbLiq.ok,
    details: "BdS Liq OK: " + bdsLiq?.ok + " | MB Liq OK: " + mbLiq?.ok
});

return results;
