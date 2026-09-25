ObjC.import('Foundation');

var engineCode = $.NSString.stringWithContentsOfFileEncodingError("/Users/alessandrofassina/Desktop/broker flow/engine.js", $.NSUTF8StringEncoding, null).js;
var window = { bankDiscountOptions: {} };
eval(engineCode);

var praticaAyub = {
    finalita: "acquisto",
    tipoTasso: "fisso",
    durata: 30,
    valoreImmobile: 130000,
    importoMutuo: 100000,
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

var res = window.BrokerFlowEngine.evaluate(praticaAyub);
var sparkasse = res.allEvaluated.find(function(b) { return b.bankId === "sparkasse" || (b.name && b.name.toLowerCase().indexOf("sparkasse") !== -1); });

if (sparkasse) {
    console.log("=== SPARKASSE RESULT ===");
    console.log("Status: " + sparkasse.status);
    console.log("Rata: " + Math.round(sparkasse.rata) + " €");
    sparkasse.checks.forEach(function(c) {
        console.log("  " + (c.status === 'ok' ? '🟢' : (c.status === 'deroga' ? '🟡' : '🔴')) + " [" + c.name + "]: " + c.text);
    });
    console.log("Notes: " + JSON.stringify(sparkasse.notes));
} else {
    console.log("Sparkasse not found in allEvaluated");
}
