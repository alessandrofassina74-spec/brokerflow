const fs = require('fs');

// We load BrokerFlowEngine from engine.js
const engineCode = fs.readFileSync('/Users/alessandrofassina/Desktop/broker flow/engine.js', 'utf8');
eval(engineCode);

const praticaAyub = {
    finalita: "acquisto",
    tipoTasso: "fisso",
    durata: 30,
    valoreImmobile: 100000,
    importoMutuo: 99000,
    classeEnergetica: "standard",
    calcMode: "rata",
    consap: "no",
    zona: "nord",
    location: { name: "Milano", province: "MI", region: "Lombardia", isCapoluogo: true },
    subjects: [
        {
            role: "Richiedente Principale",
            cittadinanza: "extra_UE",
            permScadenza: "2028-12-31",
            dataScadenzaPermesso: "2028-12-31",
            tipoContratto: "dipendente_ti",
            redditoNetto: 1600,
            eta: 34,
            impegni: 0,
            figli: "no"
        },
        {
            role: "Coniuge",
            cittadinanza: "extra_UE",
            permScadenza: "2028-12-31",
            dataScadenzaPermesso: "2028-12-31",
            tipoContratto: "no_lavoro",
            redditoNetto: 0,
            eta: 30,
            impegni: 0,
            figli: "no"
        }
    ]
};

const result = BrokerFlowEngine.evaluate(praticaAyub);
const sparkasse = result.banks.find(b => b.bankId === "sparkasse" || b.bankName.toLowerCase().includes("sparkasse"));

if (sparkasse) {
    console.log("=== SPARKASSE RESULT ===");
    console.log("Status:", sparkasse.status);
    console.log("Rata:", sparkasse.rata);
    console.log("Checks:");
    sparkasse.checks.forEach(c => console.log(`  ${c.status === 'ok' ? '🟢' : (c.status === 'deroga' ? '🟡' : '🔴')} [${c.name}]: ${c.text}`));
    console.log("Notes:", sparkasse.notes);
} else {
    console.log("Sparkasse not found in banks list");
}
