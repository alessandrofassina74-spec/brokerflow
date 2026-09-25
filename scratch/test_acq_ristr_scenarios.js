load("engine.js");

var policiesTxt = readFile("data/policies.json");
var productsTxt = readFile("data/products.json");
var branchesTxt = readFile("data/branches.json");

BrokerFlowEngine.init(JSON.parse(policiesTxt), JSON.parse(productsTxt), null, JSON.parse(branchesTxt));

var basePratica = {
    finalita: "acquisto_ristrutturazione",
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

// TEST 1: 80% Acquisto + 100% Ristrutturazione
print("=== TEST 1: 80% Acquisto (160k/200k) + 100% Ristrutturazione (50k/50k) ===");
var p1 = Object.assign({}, basePratica, {
    prezzoAcquisto: 200000,
    importoMutuoAcquisto: 160000,
    costoRistrutturazione: 50000,
    importoMutuoRistrutturazione: 50000,
    importoMutuo: 210000,
    valoreImmobile: 200000
});

var res1 = BrokerFlowEngine.evaluate(p1, tassiBase);
var mb1 = res1.allEvaluated.find(function(b) { return b.bankId === "mediobanca_premier"; });
var mps1 = res1.allEvaluated.find(function(b) { return b.bankId === "mps"; });

var mbLtv1 = mb1.checks.find(function(c) { return c.name.indexOf("LTV") !== -1; });
var mpsLtv1 = mps1.checks.find(function(c) { return c.name.indexOf("LTV") !== -1; });

print("Mediobanca LTV status: " + mbLtv1.status + " | Text: " + mbLtv1.text);
print("MPS LTV status: " + mpsLtv1.status + " | Text: " + mpsLtv1.text);

if (mbLtv1.status !== "ok") throw new Error("Mediobanca should be OK for 80% acq + 100% ristr!");
if (mpsLtv1.status !== "ko") throw new Error("MPS should be KO for 80% acq + 100% ristr!");

// TEST 2: 80% Acquisto + 80% Ristrutturazione
print("\n=== TEST 2: 80% Acquisto (160k/200k) + 80% Ristrutturazione (40k/50k) ===");
var p2 = Object.assign({}, basePratica, {
    prezzoAcquisto: 200000,
    importoMutuoAcquisto: 160000,
    costoRistrutturazione: 50000,
    importoMutuoRistrutturazione: 40000,
    importoMutuo: 200000,
    valoreImmobile: 200000
});

var res2 = BrokerFlowEngine.evaluate(p2, tassiBase);
var mb2 = res2.allEvaluated.find(function(b) { return b.bankId === "mediobanca_premier"; });
var mps2 = res2.allEvaluated.find(function(b) { return b.bankId === "mps"; });

var mbLtv2 = mb2.checks.find(function(c) { return c.name.indexOf("LTV") !== -1; });
var mpsLtv2 = mps2.checks.find(function(c) { return c.name.indexOf("LTV") !== -1; });

print("Mediobanca LTV status: " + mbLtv2.status + " | Text: " + mbLtv2.text);
print("MPS LTV status: " + mpsLtv2.status + " | Text: " + mpsLtv2.text);

if (mbLtv2.status !== "ok") throw new Error("Mediobanca should be OK for 80% acq + 80% ristr!");
if (mpsLtv2.status !== "ok") throw new Error("MPS should be OK for 80% acq + 80% ristr!");

print("\n>>> ALL AUTOMATED SCENARIO TESTS PASSED PERFECTLY! <<<");
