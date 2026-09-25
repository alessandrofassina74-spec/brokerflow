var appData = {};
var engineCode = $.NSString.stringWithContentsOfFileEncodingError("/Users/alessandrofassina/Desktop/broker flow/engine.js", $.NSUTF8StringEncoding, null).js;
var window = { bankDiscountOptions: {} };
eval(engineCode);

function testCase(label, pratica) {
    console.log("=========================================");
    console.log("TEST: " + label);
    var res = window.BrokerFlowEngine.evaluate(pratica);
    console.log("Feasible: " + res.feasible + " | Approved count: " + res.banks.length);
    res.allEvaluated.forEach(function(b) {
        var statusIcon = b.status === "ok" ? "🟢" : (b.status === "deroga" ? "🟡" : "🔴");
        console.log(statusIcon + " " + b.name + " (" + b.bankId + ") -> Status: " + b.status + " | Prod: " + b.productName + " | Rata: " + (b.rata < 999999 ? Math.round(b.rata) + " €" : "--"));
        if (b.status !== "ok") {
            b.checks.filter(function(c) { return !c.ok; }).forEach(function(c) {
                console.log("   ❌ [" + c.name + "]: " + c.text);
            });
        }
    });
}

// Case 1: Ayub 2100 € + Coniuge no_lavoro 0 € (32 yo)
testCase("Ayub 2100 € + Coniuge no_lavoro 0 € (32 yo)", {
    valoreImmobile: 150000,
    importoMutuo: 150000,
    durata: 30,
    tipoTasso: "fisso",
    isConsap: true,
    hasCpi: true,
    aperturaConto: true,
    numFigli: 0,
    personeNucleo: 2,
    zona: "nord",
    finalita: "acquisto",
    provImmobile: "MI",
    provResidenza: "MI",
    provLavoro: "MI",
    subjects: [
        {
            role: "Richiedente Principale",
            nome: "Ayub",
            eta: 38,
            statoCivile: "sposato",
            tipoContratto: "dipendente_ti",
            netto: 2100,
            anzianita: 24,
            cittadinanza: "extra",
            permScadenza: "2027-12-31"
        },
        {
            role: "Cointestatario",
            nome: "Coniuge",
            eta: 32,
            statoCivile: "sposato",
            tipoContratto: "no_lavoro",
            netto: 0,
            anzianita: 0,
            cittadinanza: "extra_UE",
            permScadenza: "2028-06-30"
        }
    ]
});

// Case 2: Ayub 1800 € + Coniuge dipendente_ti 1000 € (32 yo)
testCase("Ayub 1800 € + Coniuge dipendente_ti 1000 € (32 yo)", {
    valoreImmobile: 150000,
    importoMutuo: 150000,
    durata: 30,
    tipoTasso: "fisso",
    isConsap: true,
    hasCpi: true,
    aperturaConto: true,
    numFigli: 0,
    personeNucleo: 2,
    zona: "nord",
    finalita: "acquisto",
    provImmobile: "MI",
    provResidenza: "MI",
    provLavoro: "MI",
    subjects: [
        {
            role: "Richiedente Principale",
            nome: "Ayub",
            eta: 38,
            statoCivile: "sposato",
            tipoContratto: "dipendente_ti",
            netto: 1800,
            anzianita: 24,
            cittadinanza: "extra",
            permScadenza: "2027-12-31"
        },
        {
            role: "Cointestatario",
            nome: "Coniuge",
            eta: 32,
            statoCivile: "sposato",
            tipoContratto: "dipendente_ti",
            netto: 1000,
            anzianita: 12,
            cittadinanza: "extra_UE",
            permScadenza: "2028-06-30"
        }
    ]
});
