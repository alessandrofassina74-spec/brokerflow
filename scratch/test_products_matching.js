load("engine.js");

var policiesTxt = readFile("data/policies.json");
var productsTxt = readFile("data/products.json");
var branchesTxt = readFile("data/branches.json");

BrokerFlowEngine.init(JSON.parse(policiesTxt), JSON.parse(productsTxt), null, JSON.parse(branchesTxt));

var pratica = {
    finalita: "acquisto_ristrutturazione",
    prezzoAcquisto: 200000,
    importoMutuoAcquisto: 160000,
    costoRistrutturazione: 50000,
    importoMutuoRistrutturazione: 40000,
    importoMutuo: 200000,
    valoreImmobile: 200000,
    durata: 25,
    tipoTasso: "any",
    classeEnergetica: "standard",
    zona: "nord",
    provImmobile: "MI",
    provResidenza: "MI",
    provLavoro: "MI",
    subjects: [
        {
            role: "Richiedente Principale",
            nome: "Mario",
            cognome: "Rossi",
            eta: 35,
            tipoContratto: "tempo_indeterminato",
            netto: 4500,
            anzianita: 36
        }
    ]
};

var tassiBase = {
    euribor1m: 3.5,
    euribor3m: 3.55,
    euribor6m: 3.6,
    irs: { "25": 2.65, "30": 2.70 },
    bce: 3.75
};

var res = BrokerFlowEngine.evaluate(pratica, tassiBase);
print("Feasible banks count:", res.banks.length);
print("All evaluated banks count:", res.allEvaluated.length);

for (var i = 0; i < res.allEvaluated.length; i++) {
    var b = res.allEvaluated[i];
    print("\n--- " + b.name + " (" + b.bankId + ") ---");
    print("  Status: " + b.status);
    print("  Product: " + b.prodName + " (Tipo: " + b.tipo + ")");
    print("  Rata: € " + b.rata + " | TAN: " + b.tan + "%");
    var ltvCheck = b.checks.find(function(c) { return c.name.indexOf("LTV") !== -1; });
    if (ltvCheck) print("  LTV: " + ltvCheck.status + " | " + ltvCheck.text);
}
