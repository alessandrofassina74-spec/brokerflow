with open("app.js", "r", encoding="utf-8") as f:
    content = f.read()

sync_functions = """
// ============================================================
// STEP 3: ACQUISTO + RISTRUTTURAZIONE DYNAMIC SYNC & CALCULATION
// ============================================================
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
    
    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};

window.syncP3Durata = function(val) {
    const d1 = document.getElementById("wiz-p3-durata");
    const d2 = document.getElementById("wiz-p3-durata-acq-ristr");
    if (d1) d1.value = val;
    if (d2) d2.value = val;
    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};
"""

target = "window.getBankLogoHtml = function(bankName, size = 26, extraStyle = \"\") {"
replacement = sync_functions + "\n" + target

if target in content:
    content = content.replace(target, replacement, 1)
    with open("app.js", "w", encoding="utf-8") as f:
        f.write(content)
    print("sync functions inserted successfully at the top of app.js!")
else:
    print("target not found")
