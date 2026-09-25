const fs = require('fs');
const path = require('path');

// Load engine
const engineCode = fs.readFileSync('/Users/alessandrofassina/Desktop/broker flow/engine.js', 'utf8');
eval(engineCode);

const scenarios = [
  {
    id: 1,
    name: "Scenario 1: Giovane Professionista Under 36 (Single, LTV 100% Consap)",
    description: "Marco Rossi, 29 anni, dipendente indeterminato 2.100€ netti/mese (13 mensilità). Acquisto 180.000€, Mutuo 180.000€ (LTV 100%), 30 anni, Milano.",
    params: {
      tipoTasso: "fisso",
      importoMutuo: 180000,
      valoreImmobile: 180000,
      durata: 30,
      finalita: "acquisto",
      isConsap: true,
      personeNucleo: 1,
      zona: "nord",
      subjects: [{
        role: "Richiedente Principale",
        nome: "Marco",
        cognome: "Rossi",
        eta: 29,
        cittadinanza: "IT",
        statoCivile: "celibe",
        tipoContratto: "indeterminato",
        macroCategoria: "dipendente",
        netto: 2100,
        mensilita: 13,
        anzianitaMesi: 48,
        incomes: [{
          tipoContratto: "indeterminato",
          macroCategoria: "dipendente",
          netto: 2100,
          mensilita: 13,
          anzianitaMesi: 48,
          cu1: 2100 * 13 * 1.3,
          cu6: 365,
          orarioLavoro: "full_time"
        }]
      }],
      userLoans: []
    }
  },
  {
    id: 2,
    name: "Scenario 2: Famiglia Monoreddito con 2 Figli (Nucleo 4 Persone, Prestito 250€, LTV 72%)",
    description: "Giuseppe Verdi, 42 anni, dipendente indeterminato 2.800€ netti/mese. Coniuge a carico + 2 figli minori (4 componenti). Prestito 250€/m. Acquisto 250.000€, Mutuo 180.000€ (LTV 72%), 25 anni, Roma.",
    params: {
      tipoTasso: "fisso",
      importoMutuo: 180000,
      valoreImmobile: 250000,
      durata: 25,
      finalita: "acquisto",
      isConsap: false,
      personeNucleo: 4,
      zona: "centro",
      subjects: [{
        role: "Richiedente Principale",
        nome: "Giuseppe",
        cognome: "Verdi",
        eta: 42,
        cittadinanza: "IT",
        statoCivile: "sposato",
        regime: "separazione",
        tipoContratto: "indeterminato",
        macroCategoria: "dipendente",
        netto: 2800,
        mensilita: 13,
        anzianitaMesi: 120,
        incomes: [{
          tipoContratto: "indeterminato",
          macroCategoria: "dipendente",
          netto: 2800,
          mensilita: 13,
          anzianitaMesi: 120,
          cu1: 2800 * 13 * 1.3,
          cu6: 365,
          orarioLavoro: "full_time"
        }]
      }],
      userLoans: [{
        id: "loan_1",
        tipo: "personale",
        rata: 250,
        debitoResiduo: 8000,
        durataResidua: 36,
        verraChiuso: false
      }]
    }
  },
  {
    id: 3,
    name: "Scenario 3: Coppia Entrambi Lavoratori (Dipendente 1.800€ + P.IVA Forfettaria 24.000€, LTV 74.3%)",
    description: "Davide (36 anni, dipendente 1.800€) + Elena (34 anni, forfettaria RN/LM 24.000€). Nucleo 2 persone. Acquisto 350.000€, Mutuo 260.000€ (LTV 74.3%), 25 anni, Bologna.",
    params: {
      tipoTasso: "fisso",
      importoMutuo: 260000,
      valoreImmobile: 350000,
      durata: 25,
      finalita: "acquisto",
      isConsap: false,
      personeNucleo: 2,
      zona: "nord",
      subjects: [
        {
          role: "Richiedente Principale",
          nome: "Davide",
          cognome: "Ferrari",
          eta: 36,
          cittadinanza: "IT",
          statoCivile: "coniugato",
          regime: "separazione",
          tipoContratto: "indeterminato",
          macroCategoria: "dipendente",
          netto: 1800,
          mensilita: 13,
          incomes: [{
            tipoContratto: "indeterminato",
            macroCategoria: "dipendente",
            netto: 1800,
            mensilita: 13,
            anzianitaMesi: 60,
            cu1: 1800 * 13 * 1.3,
            cu6: 365,
            orarioLavoro: "full_time"
          }]
        },
        {
          role: "Cointestatario",
          nome: "Elena",
          cognome: "Bianchi",
          eta: 34,
          cittadinanza: "IT",
          statoCivile: "coniugato",
          regime: "separazione",
          tipoContratto: "autonomo",
          macroCategoria: "autonomo",
          netto: 2000,
          incomes: [{
            tipoContratto: "autonomo",
            macroCategoria: "autonomo",
            netto: 2000,
            autRegime: "forfettario",
            autAnniAttivita: 3,
            autRnlm: 24000,
            autFatturato: 32000,
            autSettore: "servizi",
            anniAttivita: 3
          }]
        }
      ],
      userLoans: []
    }
  },
  {
    id: 4,
    name: "Scenario 4: Richiedente Maturo 58 Anni (Dipendente Quadro 3.800€, LTV 50%, Durata 20 anni -> Scadenza 78 anni)",
    description: "Roberto Mancini, 58 anni, Quadro 3.800€ netti. Nucleo 2 persone. Acquisto 300.000€, Mutuo 150.000€ (LTV 50%), 20 anni (scadenza a 78 anni), Torino.",
    params: {
      tipoTasso: "fisso",
      importoMutuo: 150000,
      valoreImmobile: 300000,
      durata: 20,
      finalita: "acquisto",
      isConsap: false,
      personeNucleo: 2,
      zona: "nord",
      subjects: [{
        role: "Richiedente Principale",
        nome: "Roberto",
        cognome: "Mancini",
        eta: 58,
        cittadinanza: "IT",
        statoCivile: "coniugato",
        regime: "separazione",
        tipoContratto: "indeterminato",
        macroCategoria: "dipendente",
        netto: 3800,
        mensilita: 14,
        incomes: [{
          tipoContratto: "indeterminato",
          macroCategoria: "dipendente",
          netto: 3800,
          mensilita: 14,
          anzianitaMesi: 200,
          cu1: 3800 * 14 * 1.35,
          cu6: 365,
          orarioLavoro: "full_time"
        }]
      }],
      userLoans: []
    }
  },
  {
    id: 5,
    name: "Scenario 5: Lavoratore Extra-UE (32 anni, 1.650€, Permesso 1 anno, Anzianità 18m) + Garante Pensionato 68 anni (1.200€) (LTV 82%)",
    description: "Ahmed Hassan (32 anni, Extra-UE, 1.650€, permesso 1 anno) + Garante Ali Hassan (68 anni, pensione 1.200€). Acquisto 140.000€, Mutuo 115.000€ (LTV 82.1%), 25 anni, Firenze.",
    params: {
      tipoTasso: "fisso",
      importoMutuo: 115000,
      valoreImmobile: 140000,
      durata: 25,
      finalita: "acquisto",
      isConsap: false,
      personeNucleo: 1,
      zona: "centro",
      subjects: [
        {
          role: "Richiedente Principale",
          nome: "Ahmed",
          cognome: "Hassan",
          eta: 32,
          cittadinanza: "extra",
          permScadenza: "2027-06-10",
          anzianitaItaliaMesi: 24,
          tipoContratto: "indeterminato",
          macroCategoria: "dipendente",
          netto: 1650,
          mensilita: 13,
          anzianitaMesi: 18,
          incomes: [{
            tipoContratto: "indeterminato",
            macroCategoria: "dipendente",
            netto: 1650,
            mensilita: 13,
            anzianitaMesi: 18,
            cu1: 1650 * 13 * 1.3,
            cu6: 365,
            orarioLavoro: "full_time"
          }]
        },
        {
          role: "Garante",
          nome: "Ali",
          cognome: "Hassan",
          eta: 68,
          cittadinanza: "extra",
          permScadenza: "2035-01-01",
          anzianitaItaliaMesi: 120,
          statoCivile: "coniugato",
          tipoContratto: "pensionato",
          macroCategoria: "pensionato",
          netto: 1200,
          mensilita: 13,
          incomes: [{
            tipoContratto: "pensionato",
            macroCategoria: "pensionato",
            netto: 1200,
            mensilita: 13
          }]
        }
      ],
      userLoans: []
    }
  }
];

// Helper to manually calculate French Amortization Installment
function calcFrenchRata(loan, tanAnnualPercent, years) {
  const r = (tanAnnualPercent / 100) / 12;
  const n = years * 12;
  if (r === 0) return loan / n;
  return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const detailedAudit = [];

scenarios.forEach(sc => {
  const evalResult = BrokerFlowEngine.evaluateAllBanks(sc.params);
  
  const bankAudits = (evalResult.allEvaluated || []).map(b => {
    const manualRata = calcFrenchRata(sc.params.importoMutuo, b.tan, sc.params.durata);
    const diffRata = Math.abs(manualRata - b.rata);
    
    return {
      bankId: b.bankId,
      name: b.name,
      status: b.status,
      isNotFeasible: b.isNotFeasible,
      tan: b.tan,
      engineRata: b.rata,
      manualRata: manualRata,
      diffRataCents: (diffRata * 100).toFixed(2),
      engineDsr: b.dsr,
      reasons: b.reasons || [],
      deroghe: b.deroghe || [],
      notes: b.notes || []
    };
  });

  detailedAudit.push({
    scenarioId: sc.id,
    scenarioName: sc.name,
    description: sc.description,
    feasible: evalResult.feasible,
    approvedCount: (evalResult.allEvaluated || []).filter(b => b.status === 'ok').length,
    derogaCount: (evalResult.allEvaluated || []).filter(b => b.status === 'deroga').length,
    koCount: (evalResult.allEvaluated || []).filter(b => b.status === 'ko' || b.isNotFeasible).length,
    banks: bankAudits
  });
});

console.log(JSON.stringify(detailedAudit, null, 2));
fs.writeFileSync('/Users/alessandrofassina/Desktop/broker flow/qa_suite/reports/critical_audit_report.json', JSON.stringify(detailedAudit, null, 2));
