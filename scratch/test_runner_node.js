
const fs = require('fs');
const vm = require('vm');

const engineCode = fs.readFileSync('engine.js', 'utf8');
const sandbox = {
    console: console,
    module: {},
    exports: {}
};
vm.createContext(sandbox);
vm.runInContext(engineCode, sandbox);

const engine = sandbox.BrokerFlowEngine;

// Mock base rates
const tassiBase = {
    irs: 2.60,
    irsRates: { "10": 2.50, "15": 2.55, "20": 2.60, "25": 2.65, "30": 2.70 },
    euribor1m: 3.10,
    euribor3m: 3.20,
    euribor6m: 3.30,
    bce: 3.75
};

// Base practice template
function makePratica(finalita, loan, val, durata = 20) {
    return {
        id: 'PRATICA_TEST',
        calcMode: 'standard',
        valoreImmobile: val,
        importoMutuo: loan,
        durata: durata,
        finalita: finalita,
        tipoTasso: 'fisso',
        aperturaConto: 'si',
        classeEn: 'standard',
        isGreen: false,
        isConsap: false,
        zona: 'nord',
        personeNucleo: 2,
        provImmobile: 'MILANO',
        subjects: [
            {
                nome: 'Mario',
                cognome: 'Rossi',
                ruolo: 'Richiedente',
                eta: 35,
                tipoContratto: 'Tempo Indeterminato Privato',
                anzianitaMesi: 60,
                redditoNetto: 2800,
                mensilita: 13,
                comuneResidenza: 'MILANO',
                comuneLavoro: 'MILANO',
                nazionalita: 'IT'
            }
        ]
    };
}

console.log('\n--- TEST 1: Surroga ---');
const pSurroga = makePratica('surroga', 120000, 200000);
const resSurroga = engine.evaluate(pSurroga, tassiBase);
const tbSurroga = resSurroga.allEvaluated.find(b => b.bankId === 'testbank');
console.log('Surroga result:', tbSurroga ? { status: tbSurroga.status, prod: tbSurroga.product ? tbSurroga.product.nome : null, spread: tbSurroga.spread } : 'NOT FOUND');
if (!tbSurroga || !tbSurroga.product || tbSurroga.product.id !== 'TB_SURR_FIX') {
    console.error('FAIL: Surroga did not select TB_SURR_FIX');
    process.exit(1);
}

console.log('\n--- TEST 2: Liquidità ---');
const pLiq = makePratica('liquidita', 60000, 200000);
const resLiq = engine.evaluate(pLiq, tassiBase);
const tbLiq = resLiq.allEvaluated.find(b => b.bankId === 'testbank');
console.log('Liquidita result:', tbLiq ? { status: tbLiq.status, prod: tbLiq.product ? tbLiq.product.nome : null, spread: tbLiq.spread } : 'NOT FOUND');
if (!tbLiq || !tbLiq.product || tbLiq.product.id !== 'TB_LIQ_FIX') {
    console.error('FAIL: Liquidita did not select TB_LIQ_FIX');
    process.exit(1);
}

console.log('\n--- TEST 3: Consolidamento Debiti (using "consolido") ---');
const pCons = makePratica('consolido', 100000, 200000);
const resCons = engine.evaluate(pCons, tassiBase);
const tbCons = resCons.allEvaluated.find(b => b.bankId === 'testbank');
console.log('Consolido result:', tbCons ? { status: tbCons.status, prod: tbCons.product ? tbCons.product.nome : null, spread: tbCons.spread } : 'NOT FOUND');
if (!tbCons || !tbCons.product || tbCons.product.id !== 'TB_CONS_FIX') {
    console.error('FAIL: Consolido did not select TB_CONS_FIX');
    process.exit(1);
}

console.log('\n--- TEST 4: Acquisto all\'Asta ("asta") ---');
const pAsta = makePratica('asta', 120000, 200000);
const resAsta = engine.evaluate(pAsta, tassiBase);
const tbAsta = resAsta.allEvaluated.find(b => b.bankId === 'testbank');
console.log('Asta result:', tbAsta ? { status: tbAsta.status, prod: tbAsta.product ? tbAsta.product.nome : null, spread: tbAsta.spread } : 'NOT FOUND');
if (!tbAsta || !tbAsta.product || tbAsta.product.id !== 'TB_ASTA_FIX') {
    console.error('FAIL: Asta did not select TB_ASTA_FIX');
    process.exit(1);
}

console.log('\n--- TEST 5: Acquisto + Ristrutturazione ---');
const pAcqRistr = makePratica('acquisto_ristrutturazione', 150000, 200000);
const resAcqRistr = engine.evaluate(pAcqRistr, tassiBase);
const tbAcqRistr = resAcqRistr.allEvaluated.find(b => b.bankId === 'testbank');
console.log('Acq+Ristr result:', tbAcqRistr ? { status: tbAcqRistr.status, prod: tbAcqRistr.product ? tbAcqRistr.product.nome : null, spread: tbAcqRistr.spread } : 'NOT FOUND');
if (!tbAcqRistr || !tbAcqRistr.product || tbAcqRistr.product.id !== 'TB_ACQ_RISTR_FIX') {
    console.error('FAIL: Acq+Ristr did not select TB_ACQ_RISTR_FIX');
    process.exit(1);
}

console.log('\n--- TEST 6: LTV <= 50% Tier vs LTV 75% Tier ---');
const pLtv45 = makePratica('acquisto', 90000, 200000); // LTV = 45%
const resLtv45 = engine.evaluate(pLtv45, tassiBase);
const tbLtv45 = resLtv45.allEvaluated.find(b => b.bankId === 'testbank');
console.log('LTV 45% selected product:', tbLtv45.product.id, 'Spread:', tbLtv45.spread);
if (tbLtv45.product.id !== 'TB_ACQ_FIX_L50' || tbLtv45.spread !== 0.20) {
    console.error('FAIL: LTV 45% should have selected TB_ACQ_FIX_L50 with spread 0.20');
    process.exit(1);
}

const pLtv75 = makePratica('acquisto', 150000, 200000); // LTV = 75%
const resLtv75 = engine.evaluate(pLtv75, tassiBase);
const tbLtv75 = resLtv75.allEvaluated.find(b => b.bankId === 'testbank');
console.log('LTV 75% selected product:', tbLtv75.product.id, 'Spread:', tbLtv75.spread);
if (tbLtv75.product.id !== 'TB_ACQ_FIX_L80' || tbLtv75.spread !== 0.40) {
    console.error('FAIL: LTV 75% should have selected TB_ACQ_FIX_L80 with spread 0.40');
    process.exit(1);
}

console.log('\n>>> ALL MULTI-PURPOSE RATE TESTS PASSED PERFECTLY! <<<');
