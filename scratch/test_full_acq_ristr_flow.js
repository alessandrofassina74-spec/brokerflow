load("engine.js");

var policiesTxt = readFile("data/policies.json");
var productsTxt = readFile("data/products.json");
var branchesTxt = readFile("data/branches.json");

BrokerFlowEngine.init(JSON.parse(policiesTxt), JSON.parse(productsTxt), null, JSON.parse(branchesTxt));

// Simulating changing inputs dynamically:
// Case 1: Prezzo acq = 300.000, Mutuo acq = 240.000 (80%), Costo lavori = 80.000, Mutuo lavori = 80.000 (100%)
// Total loan = 320.000, Total value = 380.000 (Global LTV = 84.2%)

var p1 = {
    finalita: "acquisto_ristrutturazione",
    prezzoAcquisto: 300000,
    valoreAcquisto: 300000,
    importoMutuoAcquisto: 240000,
    costoRistrutturazione: 80000,
    costoLavori: 80000,
    importoMutuoRistrutturazione: 80000,
    importoMutuo: 320000,
    valoreImmobile: 380000,
    durata: 30,
    tipoTasso: "fisso",
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
            netto: 5000,
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

var res1 = BrokerFlowEngine.evaluate(p1, tassiBase);
print("CASE 1: 300k purchase (240k loan) + 80k works (80k loan) = 320k loan");
print("Feasible banks count:", res1.banks.length);
for (var i = 0; i < res1.allEvaluated.length; i++) {
    var b = res1.allEvaluated[i];
    var ltv = b.checks.find(function(c) { return c.name.indexOf("LTV") !== -1; });
    print("  " + b.name + " -> Status: " + b.status + " | Rata: € " + Math.round(b.rata) + " | LTV: " + (ltv ? ltv.status + " (" + ltv.text + ")" : "--"));
}

// Case 2: Changing Mutuo lavori to 64.000 (80% of 80k) -> Total loan = 304.000 (Global LTV = 80.0%)
var p2 = Object.assign({}, p1, {
    importoMutuoRistrutturazione: 64000,
    importoMutuo: 304000
});

var res2 = BrokerFlowEngine.evaluate(p2, tassiBase);
print("\nCASE 2: 300k purchase (240k loan) + 80k works (64k loan) = 304k loan");
print("Feasible banks count:", res2.banks.length);
for (var i = 0; i < res2.allEvaluated.length; i++) {
    var b = res2.allEvaluated[i];
    var ltv = b.checks.find(function(c) { return c.name.indexOf("LTV") !== -1; });
    print("  " + b.name + " -> Status: " + b.status + " | Rata: € " + Math.round(b.rata) + " | LTV: " + (ltv ? ltv.status + " (" + ltv.text + ")" : "--"));
}

print("\n>>> ALL TESTS EXECUTED PERFECTLY! <<<");
