// Read and evaluate engine.js
ObjC.import('Foundation');

function readFile(path) {
    var error = $();
    var content = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, error);
    if (error.code) {
        throw new Error(error.localizedDescription.js);
    }
    return content.js;
}

var window = {};
var global = window;
eval(readFile('/Users/alessandrofassina/Desktop/broker flow/engine.js'));

var pratica = {
    calcMode: "rata",
    valoreImmobile: 150000,
    importoMutuo: 150000,
    durata: 30,
    tipoTasso: "fisso",
    isGreen: false,
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
            tipoContratto: "no_lavoro",
            netto: 0,
            anzianita: 0,
            cittadinanza: "extra_UE",
            permScadenza: "2028-06-30"
        }
    ]
};

var res = window.BrokerFlowEngine.evaluate(pratica);
console.log("Feasible: " + res.feasible);
console.log("Approved count: " + res.banks.length);
console.log("All evaluated count: " + res.allEvaluated.length);

res.allEvaluated.forEach(function(b) {
    console.log("\nBank: " + b.name + " (" + b.bankId + ") -> Status: " + b.status + " | Prod: " + b.prodName + " | Rata: " + b.rata);
    b.checks.forEach(function(c) {
        if (c.status !== "ok") {
            console.log("   🔴 [" + c.name + "] status: " + c.status + " -> " + c.text);
        } else {
            console.log("   🟢 [" + c.name + "] -> " + c.text);
        }
    });
});
