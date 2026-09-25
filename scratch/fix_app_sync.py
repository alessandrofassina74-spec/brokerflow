with open("app.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Ensure syncAcquistoRistrutturazioneInputs and syncP3Durata are defined right at the start of app.js
sync_functions_top = """// Global Helpers for Step 3 Acquisto + Ristrutturazione
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

if "window.syncAcquistoRistrutturazioneInputs" not in content:
    content = sync_functions_top + "\n" + content
else:
    # ensure it is at top
    pass

# Update listeners array to include all Step 3 inputs
old_listeners_block = """// Attach change listeners for Wizard Step 6 inputs
const wizStep6Inputs = [
    document.getElementById("wiz-costo-casa"),
    document.getElementById("wiz-importo-mutuo"),
    document.getElementById("wiz-durata"),
    document.getElementById("wiz-tasso-tipo"),
    document.getElementById("wiz-classe-en"),
    document.getElementById("wiz-zona"),
    document.getElementById("wiz-prov-immobile"),
    document.getElementById("wiz-prov-residenza"),
    document.getElementById("wiz-prov-lavoro"),
    document.getElementById("wiz-prov-immobile-file"),
    document.getElementById("wiz-prov-residenza-file"),
    document.getElementById("wiz-prov-lavoro-file"),
    document.getElementById("wiz-persone-nucleo"),
    document.getElementById("wiz-persone-nucleo-file"),
    document.getElementById("wiz-calc-mode-exact"),
    document.getElementById("wiz-calc-mode-max")
];"""

new_listeners_block = """// Attach change listeners for Step 3 & Wizard inputs
const wizStep6Inputs = [
    document.getElementById("p3-importo-field"),
    document.getElementById("p3-valore-field"),
    document.getElementById("wiz-p3-durata"),
    document.getElementById("wiz-p3-finalita"),
    document.getElementById("wiz-p3-tipo-tasso"),
    document.getElementById("wiz-p3-acq-prezzo"),
    document.getElementById("wiz-p3-acq-mutuo"),
    document.getElementById("wiz-p3-ristr-costo"),
    document.getElementById("wiz-p3-ristr-mutuo"),
    document.getElementById("wiz-p3-durata-acq-ristr"),
    document.getElementById("wiz-p3-costo-lavori"),
    document.getElementById("wiz-costo-casa"),
    document.getElementById("wiz-importo-mutuo"),
    document.getElementById("wiz-durata"),
    document.getElementById("wiz-tasso-tipo"),
    document.getElementById("wiz-classe-en"),
    document.getElementById("wiz-zona"),
    document.getElementById("wiz-prov-immobile"),
    document.getElementById("wiz-prov-residenza"),
    document.getElementById("wiz-prov-lavoro"),
    document.getElementById("wiz-prov-immobile-file"),
    document.getElementById("wiz-prov-residenza-file"),
    document.getElementById("wiz-prov-lavoro-file"),
    document.getElementById("wiz-persone-nucleo"),
    document.getElementById("wiz-persone-nucleo-file"),
    document.getElementById("wiz-calc-mode-exact"),
    document.getElementById("wiz-calc-mode-max")
];"""

if old_listeners_block in content:
    content = content.replace(old_listeners_block, new_listeners_block)

# In updateCalculations, also ensure that when isAcqRistrMode is active, the UI summary badges and boxes are updated
old_ltv_desc_block = """    if (p3LtvDesc) {
        if (hasSecondProperty) {
            p3LtvDesc.innerHTML = `🏛️ <strong>Pluri-ipoteca attiva:</strong> LTV aggregato ${(ltvPercent).toFixed(1)}% su valore cumulato di € ${totalPropertyValue.toLocaleString()} (Imm. 1: € ${value.toLocaleString()} + Imm. 2: € ${secondValore.toLocaleString()}).${secondAccorpa ? ` Debito residuo di € ${secondDebitoResiduo.toLocaleString()} accorpato con rata vecchia non conteggiata!` : ""}`;
            p3LtvDesc.style.color = "#0052ff";
        } else if (ltvPercent > 100) {
            p3LtvDesc.innerText = "⚠️ LTV superiore al 100%. Operazione non finanziabile dagli istituti con un solo immobile.";
            p3LtvDesc.style.color = "#dc2626";
        } else if (ltvPercent > 80) {
            p3LtvDesc.innerText = "⚡ LTV elevato (> 80%). Puoi scegliere se richiedere la garanzia CONSAP o attivare la Pluri-Ipoteca su un secondo immobile.";
            p3LtvDesc.style.color = "#d97706";
        } else {
            p3LtvDesc.innerText = "✅ LTV standard entro i limiti di erogazione (≤ 80%).";
            p3LtvDesc.style.color = "#64748b";
        }
    }"""

new_ltv_desc_block = """    if (p3LtvDisplay) {
        if (isAcqRistrMode) {
            p3LtvDisplay.innerText = `${ltvPercent.toFixed(1).replace('.', ',')} % (Globale)`;
            p3LtvDisplay.style.color = (ltvPercent <= 80) ? "#15803d" : "#0052ff";
        } else {
            p3LtvDisplay.innerText = `${ltvPercent.toFixed(2).replace('.', ',')} %${hasSecondProperty ? " (Aggregato)" : ""}`;
            if (hasSecondProperty) {
                p3LtvDisplay.style.color = (ltvPercent <= 75) ? "#15803d" : ((ltvPercent <= 80) ? "#0052ff" : "#d97706");
            } else if (ltvPercent > 100) {
                p3LtvDisplay.style.color = "#dc2626";
            } else if (ltvPercent > 80) {
                p3LtvDisplay.style.color = "#d97706";
            } else {
                p3LtvDisplay.style.color = "#15803d";
            }
        }
    }
    if (p3LtvDesc) {
        if (isAcqRistrMode) {
            const ltvAcqNum = prezzoAcquistoVal > 0 ? (mutuoAcquistoVal / prezzoAcquistoVal * 100) : 0;
            const ltvRistrNum = costoLavoriVal > 0 ? (mutuoLavoriVal / costoLavoriVal * 100) : 0;
            p3LtvDesc.innerHTML = `🛠️ <strong>Acquisto + Ristrutturazione:</strong> Quota Acquisto LTV <strong>${ltvAcqNum.toFixed(1)}%</strong> (€ ${Math.round(mutuoAcquistoVal).toLocaleString('it-IT')} su € ${Math.round(prezzoAcquistoVal).toLocaleString('it-IT')}) | Quota Lavori LTV <strong>${ltvRistrNum.toFixed(1)}%</strong> (€ ${Math.round(mutuoLavoriVal).toLocaleString('it-IT')} su € ${Math.round(costoLavoriVal).toLocaleString('it-IT')}). Mediobanca finanzia fino al 100% lavori (80% acquisto), MPS e altre banche fino all'80% per entrambe le quote.`;
            p3LtvDesc.style.color = "#1e40af";
        } else if (hasSecondProperty) {
            p3LtvDesc.innerHTML = `🏛️ <strong>Pluri-ipoteca attiva:</strong> LTV aggregato ${(ltvPercent).toFixed(1)}% su valore cumulato di € ${totalPropertyValue.toLocaleString()} (Imm. 1: € ${value.toLocaleString()} + Imm. 2: € ${secondValore.toLocaleString()}).${secondAccorpa ? ` Debito residuo di € ${secondDebitoResiduo.toLocaleString()} accorpato con rata vecchia non conteggiata!` : ""}`;
            p3LtvDesc.style.color = "#0052ff";
        } else if (ltvPercent > 100) {
            p3LtvDesc.innerText = "⚠️ LTV superiore al 100%. Operazione non finanziabile dagli istituti con un solo immobile.";
            p3LtvDesc.style.color = "#dc2626";
        } else if (ltvPercent > 80) {
            p3LtvDesc.innerText = "⚡ LTV elevato (> 80%). Puoi scegliere se richiedere la garanzia CONSAP o attivare la Pluri-Ipoteca su un secondo immobile.";
            p3LtvDesc.style.color = "#d97706";
        } else {
            p3LtvDesc.innerText = "✅ LTV standard entro i limiti di erogazione (≤ 80%).";
            p3LtvDesc.style.color = "#64748b";
        }
    }"""

if old_ltv_desc_block in content:
    content = content.replace(old_ltv_desc_block, new_ltv_desc_block)

with open("app.js", "w", encoding="utf-8") as f:
    f.write(content)

print("app.js synchronized successfully!")
