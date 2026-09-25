import os

with open("app.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update handleP3FinalitaChange
old_finalita_handler = """    const costoLavoriWrapper = document.getElementById("group-p3-costo-lavori-wrapper");
    if (costoLavoriWrapper) {
        costoLavoriWrapper.style.display = (val === "acquisto_ristrutturazione") ? "block" : "none";
    }"""

new_finalita_handler = """    const acqRistrWrapper = document.getElementById("group-p3-acquisto-ristrutturazione-wrapper");
    const stdInputsWrapper = document.getElementById("group-p3-standard-inputs");
    const isAcqRistr = (val === "acquisto_ristrutturazione");
    if (acqRistrWrapper) {
        acqRistrWrapper.style.display = isAcqRistr ? "block" : "none";
    }
    if (stdInputsWrapper) {
        stdInputsWrapper.style.display = isAcqRistr ? "none" : "grid";
    }
    if (isAcqRistr && typeof window.syncAcquistoRistrutturazioneInputs === "function") {
        window.syncAcquistoRistrutturazioneInputs();
    }"""

if old_finalita_handler in content:
    content = content.replace(old_finalita_handler, new_finalita_handler)

# 2. Update updateCalculations extraction of acquisto_ristrutturazione
old_calc_extract = """    const costoLavoriWrapper = document.getElementById("group-p3-costo-lavori-wrapper");
    if (costoLavoriWrapper) {
        costoLavoriWrapper.style.display = (finalita === "acquisto_ristrutturazione") ? "block" : "none";
    }
    
    const p3CostoLavoriEl = document.getElementById("wiz-p3-costo-lavori");
    const costoLavori = (finalita === "acquisto_ristrutturazione" && p3CostoLavoriEl) ? (parseFloat(p3CostoLavoriEl.value) || 0) : 0;
    
    value = p3ValoreEl ? (parseFloat(p3ValoreEl.value) || 0) : 230000;
    if (finalita === "acquisto_ristrutturazione") {
        value += costoLavori;
    }
    
    loan = p3ImportoEl ? (parseFloat(p3ImportoEl.value) || 0) : 180000;"""

new_calc_extract = """    const isAcqRistrMode = (finalita === "acquisto_ristrutturazione");
    const acqRistrWrapper = document.getElementById("group-p3-acquisto-ristrutturazione-wrapper");
    const stdInputsWrapper = document.getElementById("group-p3-standard-inputs");
    if (acqRistrWrapper) {
        acqRistrWrapper.style.display = isAcqRistrMode ? "block" : "none";
    }
    if (stdInputsWrapper) {
        stdInputsWrapper.style.display = isAcqRistrMode ? "none" : "grid";
    }

    let prezzoAcquistoVal = 200000;
    let mutuoAcquistoVal = 160000;
    let costoLavoriVal = 50000;
    let mutuoLavoriVal = 50000;

    if (isAcqRistrMode) {
        prezzoAcquistoVal = parseFloat(document.getElementById("wiz-p3-acq-prezzo")?.value) || 200000;
        mutuoAcquistoVal = parseFloat(document.getElementById("wiz-p3-acq-mutuo")?.value) || 160000;
        costoLavoriVal = parseFloat(document.getElementById("wiz-p3-ristr-costo")?.value) || 50000;
        mutuoLavoriVal = parseFloat(document.getElementById("wiz-p3-ristr-mutuo")?.value) || 50000;
        
        value = prezzoAcquistoVal + costoLavoriVal;
        loan = mutuoAcquistoVal + mutuoLavoriVal;
    } else {
        value = p3ValoreEl ? (parseFloat(p3ValoreEl.value) || 0) : 230000;
        loan = p3ImportoEl ? (parseFloat(p3ImportoEl.value) || 0) : 180000;
        costoLavoriVal = 0;
    }"""

if old_calc_extract in content:
    content = content.replace(old_calc_extract, new_calc_extract)

# 3. Update pratica payload in updateCalculations
old_pratica_obj = """    const pratica = {
        calcMode: calcMode,
        valoreImmobile: value,
        importoMutuo: effectiveLoan,
        importoMutuoOriginale: loan,
        durata: years,
        tipoTasso: ratePref,
        isGreen: isGreenPratica,
        classeEnergetica: classeEnergetica,
        isConsap: isConsap,
        hasCpi: hasCpi,
        aperturaConto: isAperturaConto,
        bankOptions: window.bankDiscountOptions || {},
        etaFigli: childrenAgesStr,
        numFigli: numFigliVal,
        altreRate: otherRate,
        personeNucleo: people,
        zona: zona,
        finalita: finalita,
        isAsta: isAsta,
        subjects: subjects,"""

new_pratica_obj = """    const pratica = {
        calcMode: calcMode,
        valoreImmobile: value,
        importoMutuo: effectiveLoan,
        importoMutuoOriginale: loan,
        prezzoAcquisto: isAcqRistrMode ? prezzoAcquistoVal : value,
        valoreAcquisto: isAcqRistrMode ? prezzoAcquistoVal : value,
        importoMutuoAcquisto: isAcqRistrMode ? mutuoAcquistoVal : effectiveLoan,
        costoRistrutturazione: isAcqRistrMode ? costoLavoriVal : 0,
        costoLavori: isAcqRistrMode ? costoLavoriVal : 0,
        importoMutuoRistrutturazione: isAcqRistrMode ? mutuoLavoriVal : 0,
        durata: years,
        tipoTasso: ratePref,
        isGreen: isGreenPratica,
        classeEnergetica: classeEnergetica,
        isConsap: isConsap,
        hasCpi: hasCpi,
        aperturaConto: isAperturaConto,
        bankOptions: window.bankDiscountOptions || {},
        etaFigli: childrenAgesStr,
        numFigli: numFigliVal,
        altreRate: otherRate,
        personeNucleo: people,
        zona: zona,
        finalita: finalita,
        isAsta: isAsta,
        subjects: subjects,"""

if old_pratica_obj in content:
    content = content.replace(old_pratica_obj, new_pratica_obj)

# 4. Insert badge in renderPhase4Cards
target_tag = """                                <span style="color: #ffffff; background: #0052ff; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">${card.tipo || 'Standard'}</span>
                            </div>"""

replacement_tag = """                                <span style="color: #ffffff; background: #0052ff; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">${card.tipo || 'Standard'}</span>
                            </div>
                            ${card.acquistoRistrutturazioneDetails ? `
                                <div style="margin-top: 0.45rem; padding: 0.45rem 0.75rem; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; font-size: 0.74rem; color: #1e40af; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                                    <div>
                                        🏠 <strong>Acquisto:</strong> € ${formatNumber(card.acquistoRistrutturazioneDetails.acqMutuo, 0)} <span style="color: ${card.acquistoRistrutturazioneDetails.isAcqOk ? '#15803d' : '#dc2626'}; font-weight: 800;">(${(card.acquistoRistrutturazioneDetails.acqLtv*100).toFixed(0)}% / max ${(card.acquistoRistrutturazioneDetails.maxLtvAcq*100).toFixed(0)}%)</span>
                                        <span style="margin: 0 0.35rem; color: #94a3b8;">|</span>
                                        🛠️ <strong>Lavori:</strong> € ${formatNumber(card.acquistoRistrutturazioneDetails.ristrMutuo, 0)} <span style="color: ${card.acquistoRistrutturazioneDetails.isRistrOk ? '#15803d' : '#dc2626'}; font-weight: 800;">(${(card.acquistoRistrutturazioneDetails.ristrLtv*100).toFixed(0)}% / max ${(card.acquistoRistrutturazioneDetails.maxLtvRistr*100).toFixed(0)}%)</span>
                                    </div>
                                    <div style="font-weight: 800; color: #0052ff; background: #ffffff; padding: 0.15rem 0.5rem; border-radius: 5px; border: 1px solid #bfdbfe;">
                                        Mutuo Totale: € ${formatNumber(card.acquistoRistrutturazioneDetails.totaleMutuoAcqRistr, 0)}
                                    </div>
                                </div>
                            ` : ''}"""

if target_tag in content:
    content = content.replace(target_tag, replacement_tag)

# 5. Append sync helper functions at end of app.js
helpers_code = """
window.syncAcquistoRistrutturazioneInputs = function() {
    const acqPrezzoEl = document.getElementById("wiz-p3-acq-prezzo");
    const acqMutuoEl = document.getElementById("wiz-p3-acq-mutuo");
    const ristrCostoEl = document.getElementById("wiz-p3-ristr-costo");
    const ristrMutuoEl = document.getElementById("wiz-p3-ristr-mutuo");
    
    const acqPrezzo = parseFloat(acqPrezzoEl ? acqPrezzoEl.value : 0) || 0;
    const acqMutuo = parseFloat(acqMutuoEl ? acqMutuoEl.value : 0) || 0;
    const ristrCosto = parseFloat(ristrCostoEl ? ristrCostoEl.value : 0) || 0;
    const ristrMutuo = parseFloat(ristrMutuoEl ? ristrMutuoEl.value : 0) || 0;
    
    const ltvAcq = acqPrezzo > 0 ? (acqMutuo / acqPrezzo) : 0;
    const ltvRistr = ristrCosto > 0 ? (ristrMutuo / ristrCosto) : 0;
    const mutuoTot = acqMutuo + ristrMutuo;
    const valoreTot = acqPrezzo + ristrCosto;
    const ltvGlob = valoreTot > 0 ? (mutuoTot / valoreTot) : 0;
    
    const badgeAcq = document.getElementById("badge-p3-ltv-acq");
    if (badgeAcq) {
        badgeAcq.innerText = `LTV: ${(ltvAcq * 100).toFixed(1)}%`;
        if (ltvAcq <= 0.805) {
            badgeAcq.style.background = "#dcfce7";
            badgeAcq.style.color = "#15803d";
        } else if (ltvAcq <= 1.005) {
            badgeAcq.style.background = "#fef3c7";
            badgeAcq.style.color = "#b45309";
        } else {
            badgeAcq.style.background = "#fee2e2";
            badgeAcq.style.color = "#dc2626";
        }
    }
    
    const badgeRistr = document.getElementById("badge-p3-ltv-ristr");
    if (badgeRistr) {
        badgeRistr.innerText = `LTV: ${(ltvRistr * 100).toFixed(1)}%`;
        if (ltvRistr <= 1.005) {
            badgeRistr.style.background = "#dcfce7";
            badgeRistr.style.color = "#15803d";
        } else {
            badgeRistr.style.background = "#fee2e2";
            badgeRistr.style.color = "#dc2626";
        }
    }
    
    const dispMutuo = document.getElementById("display-p3-acq-ristr-mutuo-totale");
    if (dispMutuo) dispMutuo.innerText = `€ ${mutuoTot.toLocaleString("it-IT")}`;
    
    const dispValore = document.getElementById("display-p3-acq-ristr-valore-totale");
    if (dispValore) dispValore.innerText = `€ ${valoreTot.toLocaleString("it-IT")}`;
    
    const dispLtv = document.getElementById("display-p3-acq-ristr-ltv-globale");
    if (dispLtv) dispLtv.innerText = `${(ltvGlob * 100).toFixed(1).replace(".", ",")} %`;
    
    const p3ImpEl = document.getElementById("p3-importo-field");
    if (p3ImpEl) p3ImpEl.value = mutuoTot;
    const p3ValEl = document.getElementById("p3-valore-field");
    if (p3ValEl) p3ValEl.value = acqPrezzo;
    const p3CostoEl = document.getElementById("wiz-p3-costo-lavori");
    if (p3CostoEl) p3CostoEl.value = ristrCosto;
    
    if (window.updateCalculations) {
        window.updateCalculations();
    }
};

window.syncP3Durata = function(val) {
    const d1 = document.getElementById("wiz-p3-durata");
    const d2 = document.getElementById("wiz-p3-durata-acq-ristr");
    if (d1) d1.value = val;
    if (d2) d2.value = val;
    if (window.updateCalculations) {
        window.updateCalculations();
    }
};
"""

if "window.syncAcquistoRistrutturazioneInputs" not in content:
    content += helpers_code

with open("app.js", "w", encoding="utf-8") as f:
    f.write(content)

print("app.js successfully updated with Acquisto + Ristrutturazione support!")
