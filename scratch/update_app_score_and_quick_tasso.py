with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handlePhase4TassoChange & calculateClientScore after syncP3EffectiveTasso
old_sync = '''window.syncP3EffectiveTasso = function() {
    const macroSelect = document.getElementById("wiz-p3-macro-tasso");
    const macroVal = macroSelect ? macroSelect.value : "any";
    const subFissoSelect = document.getElementById("wiz-p3-sub-tasso-fisso");
    const subVarSelect = document.getElementById("wiz-p3-sub-tasso-variabile");
    const hiddenTasso = document.getElementById("wiz-p3-tipo-tasso");

    if (macroVal === "fisso") {
        if (hiddenTasso) hiddenTasso.value = subFissoSelect ? subFissoSelect.value : "fisso";
    } else if (macroVal === "variabile") {
        if (hiddenTasso) hiddenTasso.value = subVarSelect ? subVarSelect.value : "variabile";
    } else {
        if (hiddenTasso) hiddenTasso.value = "any";
    }

    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};'''

new_sync = '''window.syncP3EffectiveTasso = function() {
    const macroSelect = document.getElementById("wiz-p3-macro-tasso");
    const macroVal = macroSelect ? macroSelect.value : "any";
    const subFissoSelect = document.getElementById("wiz-p3-sub-tasso-fisso");
    const subVarSelect = document.getElementById("wiz-p3-sub-tasso-variabile");
    const hiddenTasso = document.getElementById("wiz-p3-tipo-tasso");

    if (macroVal === "fisso") {
        if (hiddenTasso) hiddenTasso.value = subFissoSelect ? subFissoSelect.value : "fisso";
    } else if (macroVal === "variabile") {
        if (hiddenTasso) hiddenTasso.value = subVarSelect ? subVarSelect.value : "variabile";
    } else {
        if (hiddenTasso) hiddenTasso.value = "any";
    }

    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};

window.handlePhase4TassoChange = function(val) {
    const macroSelect = document.getElementById("wiz-p3-macro-tasso");
    const subFissoSelect = document.getElementById("wiz-p3-sub-tasso-fisso");
    const subVarSelect = document.getElementById("wiz-p3-sub-tasso-variabile");
    const hiddenTasso = document.getElementById("wiz-p3-tipo-tasso");
    const subFissoGroup = document.getElementById("group-p3-sub-tasso-fisso");
    const subVarGroup = document.getElementById("group-p3-sub-tasso-variabile");

    if (val === "fisso") {
        if (macroSelect) macroSelect.value = "fisso";
        if (subFissoSelect) subFissoSelect.value = "fisso";
        if (subFissoGroup) subFissoGroup.style.display = "block";
        if (subVarGroup) subVarGroup.style.display = "none";
        if (hiddenTasso) hiddenTasso.value = "fisso";
    } else if (val === "opzione") {
        if (macroSelect) macroSelect.value = "fisso";
        if (subFissoSelect) subFissoSelect.value = "opzione";
        if (subFissoGroup) subFissoGroup.style.display = "block";
        if (subVarGroup) subVarGroup.style.display = "none";
        if (hiddenTasso) hiddenTasso.value = "opzione";
    } else if (val === "variabile") {
        if (macroSelect) macroSelect.value = "variabile";
        if (subVarSelect) subVarSelect.value = "variabile";
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "block";
        if (hiddenTasso) hiddenTasso.value = "variabile";
    } else if (val === "cap") {
        if (macroSelect) macroSelect.value = "variabile";
        if (subVarSelect) subVarSelect.value = "cap";
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "block";
        if (hiddenTasso) hiddenTasso.value = "cap";
    } else if (val === "rata_costante") {
        if (macroSelect) macroSelect.value = "variabile";
        if (subVarSelect) subVarSelect.value = "rata_costante";
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "block";
        if (hiddenTasso) hiddenTasso.value = "rata_costante";
    } else {
        if (macroSelect) macroSelect.value = "any";
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "none";
        if (hiddenTasso) hiddenTasso.value = "any";
    }

    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};

window.calculateClientScore = function(pratica, result) {
    if (!result || !result.feasible || !result.banks || result.banks.length === 0) {
        if (pratica.exclusions && (pratica.exclusions.pignoramenti || pratica.exclusions.ritardi)) {
            return {
                score: 0,
                label: 'Pregiudizievoli / CRIF KO',
                color: '#ef4444',
                bg: '#fee2e2',
                html: '<span style="background: #fee2e2; color: #ef4444; font-size: 0.82rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.25rem;">🔴 CRIF KO (0/100)</span>'
            };
        }
        return {
            score: 15,
            label: 'Non Fattibile',
            color: '#ef4444',
            bg: '#fee2e2',
            html: '<span style="background: #fee2e2; color: #ef4444; font-size: 0.82rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.25rem;">🔴 Non Fattibile</span>'
        };
    }

    const bestBank = result.banks[0];
    const dsr = bestBank.dsr || 0;
    const ltv = (pratica.valoreImmobile > 0) ? ((pratica.importoMutuoOriginale || pratica.importoMutuo) / pratica.valoreImmobile) : 0.80;
    const numFeasible = result.banks.length;
    const residual = bestBank.residual || 0;

    // 1. DSR Points (Max 30)
    let dsrPoints = 4;
    if (dsr <= 0.20) dsrPoints = 30;
    else if (dsr <= 0.25) dsrPoints = 26;
    else if (dsr <= 0.30) dsrPoints = 21;
    else if (dsr <= 0.33) dsrPoints = 16;
    else if (dsr <= 0.38) dsrPoints = 9;

    // 2. LTV Points (Max 25)
    let ltvPoints = 0;
    if (ltv <= 0.50) ltvPoints = 25;
    else if (ltv <= 0.70) ltvPoints = 22;
    else if (ltv <= 0.80) ltvPoints = 18;
    else if (ltv <= 0.90) ltvPoints = 10;
    else if (ltv <= 1.00) ltvPoints = 5;

    // 3. Stabilità Lavorativa (Max 20)
    let jobPoints = 12;
    const primary = (pratica.subjects && pratica.subjects[0]) || {};
    const contractType = String(primary.tipoContratto || primary.contratto || '').toLowerCase();
    const anzianitaMesi = parseInt(primary.anzianitaMesi || primary.anzianita || 24);
    
    if (contractType.includes('indeterminato') || contractType.includes('pensionato')) {
        if (anzianitaMesi >= 24) jobPoints = 20;
        else if (anzianitaMesi >= 12) jobPoints = 16;
        else jobPoints = 11;
    } else if (contractType.includes('autonomo')) {
        if (anzianitaMesi >= 24) jobPoints = 18;
        else jobPoints = 12;
    } else {
        jobPoints = 8;
    }

    // 4. Sussistenza Minima (MRI Residual Margin) (Max 15)
    let mriPoints = 3;
    if (residual >= 2000) mriPoints = 15;
    else if (residual >= 1500) mriPoints = 12;
    else if (residual >= 1000) mriPoints = 9;
    else if (residual >= 750) mriPoints = 6;

    // 5. Profondità di Offerta (Banche Approvanti) (Max 10)
    let bankPoints = 3;
    if (numFeasible >= 6) bankPoints = 10;
    else if (numFeasible >= 4) bankPoints = 8;
    else if (numFeasible >= 2) bankPoints = 5;

    const totalScore = Math.min(100, Math.max(0, dsrPoints + ltvPoints + jobPoints + mriPoints + bankPoints));

    let label = 'Eccellente';
    let color = '#15803d';
    let bg = '#dcfce7';
    let emoji = '🟢';

    if (totalScore >= 80) {
        label = 'Eccellente';
        color = '#15803d';
        bg = '#dcfce7';
        emoji = '🟢';
    } else if (totalScore >= 65) {
        label = 'Buono';
        color = '#0369a1';
        bg = '#e0f2fe';
        emoji = '🔵';
    } else if (totalScore >= 50) {
        label = 'Discreto';
        color = '#854d0e';
        bg = '#fef9c3';
        emoji = '🟡';
    } else {
        label = 'Al Limite';
        color = '#c2410c';
        bg = '#ffedd5';
        emoji = '🟠';
    }

    return {
        score: totalScore,
        label: label,
        color: color,
        bg: bg,
        html: `<span style="background: ${bg}; color: ${color}; font-size: 0.85rem; font-weight: 800; padding: 0.25rem 0.7rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.3rem;">${emoji} ${label} (${totalScore}/100)</span>`
    };
};'''

assert old_sync in content, 'old_sync not found'
content = content.replace(old_sync, new_sync, 1)

# 2. Update phase4 summary cards in updateCalculations
old_p4_cards = '''    // Dynamic grid columns and card visibility based on calculation mode
    const p4SummaryGrid = document.getElementById("phase4-summary-grid");
    const p4RataCard = document.getElementById("phase4-rata-card");
    if (p4SummaryGrid && p4RataCard) {
        if (calcMode === "max") {
            p4RataCard.style.display = "block";
            p4SummaryGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
        } else {
            p4RataCard.style.display = "none";
            p4SummaryGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
        }
    }

    if (!result.feasible) {
        if (sumRata) sumRata.innerText = "--";
        if (sumTasso) sumTasso.innerText = "--";
        if (sumReddito) sumReddito.innerText = `${formatNumber(totalIncome, 2)} €`;
        if (sumLtv) sumLtv.innerText = `${(ltv * 100).toFixed(1)}%`;
        if (sumDsr) sumDsr.innerText = "--";
        
        if (p4MaxLoan) p4MaxLoan.innerText = "€ --";
        if (p4Rata) p4Rata.innerText = "€ --";
        if (p4Score) p4Score.innerHTML = `<span style="background: #fee2e2; color: #ef4444; font-size: 0.85rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px;">🔴 Non Fattibile</span>`;'''

new_p4_cards = '''    // Dynamic grid columns and card visibility based on calculation mode
    const p4SummaryGrid = document.getElementById("phase4-summary-grid");
    const p4RataCard = document.getElementById("phase4-rata-card");
    if (p4SummaryGrid) {
        p4SummaryGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
    }
    if (p4RataCard) {
        p4RataCard.style.display = "block";
    }

    const p4MaxLoanLabel = document.getElementById("phase4-max-loan-label");
    if (p4MaxLoanLabel) {
        p4MaxLoanLabel.innerText = (calcMode === "max") ? "Importo Max Concedibile" : "Importo Mutuo Richiesto";
    }
    const p4RataLabel = document.getElementById("phase4-rata-label");
    if (p4RataLabel) {
        p4RataLabel.innerText = (calcMode === "max") ? "Rata Max Sostenibile" : "Rata Mensile Stimata";
    }

    const p4QuickTasso = document.getElementById("phase4-quick-tasso");
    if (p4QuickTasso && p4QuickTasso.value !== ratePref) {
        p4QuickTasso.value = ratePref;
    }

    const clientScore = (typeof window.calculateClientScore === "function") 
        ? window.calculateClientScore(pratica, result) 
        : { html: '<span style="background: #dcfce7; color: #15803d; font-size: 0.85rem; font-weight: 800; padding: 0.25rem 0.7rem; border-radius: 6px;">🟢 Eccellente</span>' };

    if (!result.feasible) {
        if (sumRata) sumRata.innerText = "--";
        if (sumTasso) sumTasso.innerText = "--";
        if (sumReddito) sumReddito.innerText = `${formatNumber(totalIncome, 2)} €`;
        if (sumLtv) sumLtv.innerText = `${(ltv * 100).toFixed(1)}%`;
        if (sumDsr) sumDsr.innerText = "--";
        
        if (p4MaxLoan) p4MaxLoan.innerText = "€ --";
        if (p4Rata) p4Rata.innerText = "€ --";
        if (p4Score) p4Score.innerHTML = clientScore.html;'''

assert old_p4_cards in content, 'old_p4_cards not found'
content = content.replace(old_p4_cards, new_p4_cards, 1)

# 3. Update feasible branch score assignment
old_p4_score_ok = '''        if (p4Score) p4Score.innerHTML = `<span style="background: #dcfce7; color: #15803d; font-size: 0.85rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px;">🟢 Eccellente</span>`;'''
new_p4_score_ok = '''        if (p4Score) p4Score.innerHTML = clientScore.html;'''

assert old_p4_score_ok in content, 'old_p4_score_ok not found'
content = content.replace(old_p4_score_ok, new_p4_score_ok, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js updated successfully!')
