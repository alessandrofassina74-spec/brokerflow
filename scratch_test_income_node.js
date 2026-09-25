
    const fs = require('fs');
    const vm = require('vm');
    
    const engineCode = fs.readFileSync('engine.js', 'utf8');
    const sandbox = {
        console: console,
        Math: Math,
        Object: Object,
        Array: Array,
        parseInt: parseInt,
        parseFloat: parseFloat,
        isNaN: isNaN,
        Date: Date,
        String: String,
        Set: Set,
        window: {}
    };
    vm.createContext(sandbox);
    vm.runInContext(engineCode, sandbox);
    
    const engine = sandbox.BrokerFlowEngine || sandbox.window.BrokerFlowEngine;
    if (!engine) {
        console.error("BrokerFlowEngine non trovato in sandbox!");
        process.exit(1);
    }
    
    let allPassed = true;
    
    // TEST 1: Busta paga 14 mensilità - ING (Base 12m) vs Standard (14m)
    const payslip = {
        m1: 2000, m2: 2000, m3: 2000,
        mensilita: 14,
        pagaBase: 2500, contingenza: 500, scatti: 100,
        inpsRate: 9.19
    };
    
    const incIng = engine.calculatePayslipForBank(payslip, 'ing');
    const incBnl = engine.calculatePayslipForBank(payslip, 'bnl');
    const incBper = engine.calculatePayslipForBank(payslip, 'bper');
    
    console.log(`[TEST 1] Busta Paga 14 mensilità: ING = ${incIng} €, BNL = ${incBnl} €, BPER = ${incBper} €`);
    if (incIng !== 2288 || incBnl !== 2333 || incBper !== 2333) {
        console.error("❌ TEST 1 FALLITO!");
        allPassed = false;
    } else {
        console.log("  ✅ TEST 1 SUPERATO");
    }
    
    // TEST 2: Assegno Unico con scaglioni di età (8 anni, 14 anni, 19 anni)
    const subjAu = {
        figli: 'si',
        numFigli: 3,
        assegnoUnicoSelect: 'si',
        assegnoUnico: 300,
        etaFigli: '8, 14, 19'
    };
    
    const auIng = engine.calculateAssegnoUnicoForBank(subjAu, 'ing', engine.bankPolicies['ing']);
    const auBnl = engine.calculateAssegnoUnicoForBank(subjAu, 'bnl', engine.bankPolicies['bnl']);
    const auMps = engine.calculateAssegnoUnicoForBank(subjAu, 'mps', engine.bankPolicies['mps']);
    
    console.log(`[TEST 2] Assegno Unico (8, 14, 19 anni): ING = ${auIng} €, BNL = ${auBnl} €, MPS = ${auMps} €`);
    if (auIng !== 150 || auBnl !== 200 || auMps !== 200) {
        console.error("❌ TEST 2 FALLITO!");
        allPassed = false;
    } else {
        console.log("  ✅ TEST 2 SUPERATO");
    }
    
    // TEST 3: Autonomo Ordinario (RN1 vs RN4)
    const subjOrd = {
        tipoContratto: 'autonomo',
        rawBoxData: {
            regime: 'ordinario',
            singleUnico: true,
            rn1_1: 45000,
            rn4_1: 38000,
            rn26_1: 8000,
            rv2_1: 700,
            rv10_1: 300,
            rv17_1: 500
        }
    };
    
    const ordIng = engine.calculateSingleIncome(subjOrd, 'ing');
    const ordBnl = engine.calculateSingleIncome(subjOrd, 'bnl');
    console.log(`[TEST 3] Autonomo Ordinario: ING = ${ordIng} €, BNL = ${ordBnl} €`);
    if (ordIng !== 2417 || ordBnl !== 2958) {
        console.error("❌ TEST 3 FALLITO!");
        allPassed = false;
    } else {
        console.log("  ✅ TEST 3 SUPERATO");
    }
    
    // TEST 4: Autonomo Forfettario (MPS LM34 vs Standard LM36)
    const subjForf = {
        tipoContratto: 'autonomo',
        rawBoxData: {
            regime: 'forfettario',
            singleUnico: true,
            lm34_1: 32000,
            lm36_1: 30000,
            lm39_1: 4500
        }
    };
    
    const forfMps = engine.calculateSingleIncome(subjForf, 'mps');
    const forfBnl = engine.calculateSingleIncome(subjForf, 'bnl');
    console.log(`[TEST 4] Forfettario: MPS = ${forfMps} €, BNL = ${forfBnl} €`);
    if (forfMps !== 2292 || forfBnl !== 2125) {
        console.error("❌ TEST 4 FALLITO!");
        allPassed = false;
    } else {
        console.log("  ✅ TEST 4 SUPERATO");
    }
    
    // TEST 5: Reddito da Locazione Multi-Reddito (MPS vs ING)
    const subjLoc = {
        role: 'Richiedente Principale',
        incomes: [
            { tipoContratto: 'dipendente_ti', netto: 2000 },
            { tipoContratto: 'locazione', netto: 1000 }
        ]
    };
    
    const totIng = engine.calculateNetIncome(subjLoc, 'ing');
    const totMps = engine.calculateNetIncome(subjLoc, 'mps');
    console.log(`[TEST 5] Multi-Reddito con Locazione (2000 + 1000 locazione): ING = ${totIng} €, MPS = ${totMps} €`);
    if (totIng !== 2000 || totMps !== 2700) {
        console.error("❌ TEST 5 FALLITO!");
        allPassed = false;
    } else {
        console.log("  ✅ TEST 5 SUPERATO");
    }
    
    if (allPassed) {
        console.log("\n🎉 TUTTI I 5 TEST DI VERIFICA SULLE REGOLE DI CALCOLO REDDITO SONO SUPERATI AL 100%!");
        process.exit(0);
    } else {
        process.exit(1);
    }
    