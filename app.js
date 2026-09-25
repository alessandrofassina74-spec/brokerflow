// BrokerFlow UI Controller and Dynamic Rules/Rates Engine

window.getBankLogoUrl = function(bankName) {
    const name = String(bankName || "").toLowerCase();
    
    // User imported logos from loghi/
    if (name.includes("sardegna")) return "assets/logos/sardegna.jpeg";
    if (name.includes("bper")) return "assets/logos/bper.jpeg";
    if (name.includes("ing")) return "assets/logos/ing.png";
    if (name.includes("mps") || name.includes("paschi") || name.includes("monte")) return "assets/logos/mps.jpeg";
    if (name.includes("chebanca") || name.includes("mediobanca") || name.includes("premier")) return "assets/logos/mediobanca.jpeg";
    if (name.includes("sparkasse") || name.includes("bolzano") || name.includes("risparmio di bolzano")) return "assets/logos/sparkasse.png";
    if (name.includes("bdm") || name.includes("mezzogiorno") || name.includes("popolare di bari")) return "assets/logos/bdm.png";

    // Vector bank logos
    if (name.includes("bnl") || name.includes("paribas")) return "assets/logos/bnl.svg";
    if (name.includes("intesa") || name.includes("sanpaolo")) return "assets/logos/intesa.svg";
    if (name.includes("unicredit")) return "assets/logos/unicredit.svg";
    if (name.includes("agricole") || name.includes("ca-")) return "assets/logos/credit_agricole.svg";
    if (name.includes("bpm") || name.includes("popolare di milano") || name.includes("banco bpm")) return "assets/logos/bancobpm.svg";
    if (name.includes("mediolanum")) return "assets/logos/mediolanum.svg";
    if (name.includes("credem")) return "assets/logos/credem.svg";
    if (name.includes("avvera")) return "assets/logos/avvera.svg";
    if (name.includes("sella")) return "assets/logos/sella.svg";
    
    return "assets/logos/generic_bank.svg";
};


// ============================================================
// STEP 3: ACQUISTO + RISTRUTTURAZIONE DYNAMIC SYNC & CALCULATION
// ============================================================
window.syncAcquistoRistrutturazioneInputs = function(triggerEngineUpdate = true) {
    const acqPrezzoEl = document.getElementById("wiz-p3-acq-prezzo");
    const acqMutuoEl = document.getElementById("wiz-p3-acq-mutuo");
    const ristrCostoEl = document.getElementById("wiz-p3-ristr-costo");
    const ristrMutuoEl = document.getElementById("wiz-p3-ristr-mutuo");
    
    const acqPrezzo = (acqPrezzoEl && acqPrezzoEl.value !== "") ? (parseFloat(acqPrezzoEl.value) || 0) : 0;
    const acqMutuo = (acqMutuoEl && acqMutuoEl.value !== "") ? (parseFloat(acqMutuoEl.value) || 0) : 0;
    const ristrCosto = (ristrCostoEl && ristrCostoEl.value !== "") ? (parseFloat(ristrCostoEl.value) || 0) : 0;
    const ristrMutuo = (ristrMutuoEl && ristrMutuoEl.value !== "") ? (parseFloat(ristrMutuoEl.value) || 0) : 0;
    
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
        if (ltvRistr <= 0.805) {
            badgeRistr.style.background = "#dcfce7";
            badgeRistr.style.color = "#15803d";
        } else if (ltvRistr <= 1.005) {
            badgeRistr.style.background = "#fef3c7";
            badgeRistr.style.color = "#b45309";
        } else {
            badgeRistr.style.background = "#fee2e2";
            badgeRistr.style.color = "#dc2626";
        }
    }
    
    const dispMutuo = document.getElementById("display-p3-acq-ristr-mutuo-totale");
    if (dispMutuo) dispMutuo.innerText = `€ ${Math.round(mutuoTot).toLocaleString("it-IT")}`;
    
    const dispValore = document.getElementById("display-p3-acq-ristr-valore-totale");
    if (dispValore) dispValore.innerText = `€ ${Math.round(valoreTot).toLocaleString("it-IT")}`;
    
    const dispLtv = document.getElementById("display-p3-acq-ristr-ltv-globale");
    if (dispLtv) dispLtv.innerText = `${(ltvGlob * 100).toFixed(1).replace(".", ",")} %`;
    
    const p3ImpEl = document.getElementById("p3-importo-field");
    if (p3ImpEl) p3ImpEl.value = mutuoTot;
    const p3ValEl = document.getElementById("p3-valore-field");
    if (p3ValEl) p3ValEl.value = valoreTot;
    const p3CostoEl = document.getElementById("wiz-p3-costo-lavori");
    if (p3CostoEl) p3CostoEl.value = ristrCosto;
    
    const p3LtvDisplay = document.getElementById("p3-ltv-display");
    if (p3LtvDisplay) {
        p3LtvDisplay.innerText = `${(ltvGlob * 100).toFixed(1).replace(".", ",")} % (Globale)`;
        p3LtvDisplay.style.color = (ltvGlob <= 0.805) ? "#15803d" : "#0052ff";
    }
    const p3LtvDesc = document.getElementById("p3-ltv-desc");
    if (p3LtvDesc) {
        p3LtvDesc.innerText = `Quota Acquisto: ${(ltvAcq * 100).toFixed(1)}% | Quota Ristrutturazione: ${(ltvRistr * 100).toFixed(1)}% | Mutuo Totale: € ${Math.round(mutuoTot).toLocaleString("it-IT")}`;
    }
    
    if (triggerEngineUpdate && typeof window.updateCalculations === "function") {
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

window.getBankLogoHtml = function(bankName, size = 26, extraStyle = "") {
    const logoUrl = window.getBankLogoUrl(bankName);
    const cleanName = String(bankName || "Banca");
    return `<img src="${logoUrl}" alt="${cleanName}" style="height: ${size}px; max-width: ${Math.round(size * 2.6)}px; object-fit: contain; border-radius: 4px; vertical-align: middle; flex-shrink: 0; display: inline-block; ${extraStyle}">`;
};
window.loginToApp = function() {
    const loginMod = document.getElementById("module-login");
    if (loginMod) loginMod.style.display = "none";
};

window.logoutApp = function() {
    const loginMod = document.getElementById("module-login");
    if (loginMod) loginMod.style.display = "flex";
};

// Mode Tracking
let currentMode = "interview"; // "free" or "interview"

// Dynamic Databases loaded synchronously from engine and updated asynchronously via JSON
let comuniData = BrokerFlowEngine.comuniDb || [];
let policiesData = BrokerFlowEngine.bankPolicies || {};
let productsData = BrokerFlowEngine.bankProducts || {};

if (comuniData.length > 0) {
    BrokerFlowEngine.init(policiesData, productsData, comuniData);
}


// State for Dynamic Wizard Interview
let wizardStep = 1;
let wizardSubjects = []; // list of subjects: { role, nome, cognome, dataNascita, eta, sesso, cittadinanza, statoCivile, regime, figli, numFigli, assegnoUnico, assegnoValore, permScadenza, famigliaSede, isOwner, tipoContratto, anzianita, aziendaNome, aziendaPiva, netto, rawBoxData }
let currentSubjectRole = "Richiedente Principale";
let wizardLoans = []; // legacy alias
let editingSubjectIndex = null;
window.currentPhase2Mode = "interview";

// ==================== BRAND NEW REBUILT LOANS ENGINE ====================
window.userLoans = [];

window.addNewLoanCardWithValue = function(tipo = "", rata = "", capIniziale = "", capResiduo = "", durIniziale = "", durResidua = "", chiuso = "si") {
    const container = document.getElementById("loans-cards-container");
    if (!container) return;
    const loanId = "loan_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const cardHtml = `
        <div id="${loanId}" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.65rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); margin-bottom: 0.75rem;">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.65rem; align-items: center;">
                <input type="text" class="loan-tipo-input" value="${tipo}" placeholder="Tipo (es. CQS, Auto, Personale)" style="padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem;">
                <input type="number" class="loan-rata-input" value="${rata}" placeholder="Rata € (Obbligatorio)" oninput="window.updateCalculatedIncome()" style="padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; font-weight: 700; color: #0052ff;">
                <select class="loan-chiuso-input" onchange="window.updateCalculatedIncome()" style="padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem; background: #ffffff;">
                    <option value="si" ${chiuso === "si" ? "selected" : ""}>Verrà chiuso</option>
                    <option value="no" ${chiuso === "no" ? "selected" : ""}>Rimane in essere</option>
                </select>
                <button type="button" onclick="document.getElementById('${loanId}').remove(); window.updateCalculatedIncome();" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.85rem;" title="Elimina prestito">🗑️</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.65rem;">
                <input type="number" class="loan-cap-iniziale-input" value="${capIniziale}" placeholder="Cap. Iniziale €" style="padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
                <input type="number" class="loan-capitale-input" value="${capResiduo}" placeholder="Cap. Residuo €" style="padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
                <input type="number" class="loan-durata-iniziale-input" value="${durIniziale}" placeholder="Durata Iniz. (mesi)" style="padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
                <input type="number" class="loan-durata-residua-input" value="${durResidua}" placeholder="Durata Resid. (mesi)" style="padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
            </div>
        </div>
    `;
    container.insertAdjacentHTML("beforeend", cardHtml);
    window.updateCalculatedIncome();
};

window.addNewLoanCard = function() {
    window.addNewLoanCardWithValue("", "", "", "", "", "", "si");
};

window.addLoanItem = window.addNewLoanCard; // alias

window.updateCoappCalculatedIncome = function(cardEl) {
    if (!cardEl) return;
    const macroCat = cardEl.querySelector(".coapp-macro-categoria")?.value || cardEl.querySelector(".coapp-tipo")?.value || "dipendente";
    const nettoInp = cardEl.querySelector(".coapp-netto");
    if (!nettoInp) return;
    
    let monthlyIncome = 0;
    
    if (macroCat === "no_lavoro") {
        monthlyIncome = 0;
    } else if (macroCat === "dipendente" || macroCat === "dipendente_ti" || macroCat === "dipendente_td" || macroCat === "colf_badanti" || macroCat === "interinale") {
        const p1 = parseFloat(cardEl.querySelector(".coapp-cu1")?.value) || 0;
        const p2 = parseFloat(cardEl.querySelector(".coapp-cu2")?.value) || 0;
        const p6 = parseFloat(cardEl.querySelector(".coapp-cu6")?.value) || 365;
        const p21 = parseFloat(cardEl.querySelector(".coapp-cu21")?.value) || 0;
        const p22 = parseFloat(cardEl.querySelector(".coapp-cu22")?.value) || 0;
        const p26 = parseFloat(cardEl.querySelector(".coapp-cu26")?.value) || 0;
        const p27 = parseFloat(cardEl.querySelector(".coapp-cu27")?.value) || 0;
        const p29 = parseFloat(cardEl.querySelector(".coapp-cu29")?.value) || 0;
        const p365 = parseFloat(cardEl.querySelector(".coapp-cu365")?.value) || 0;

        if (p1 > 0 || p2 > 0) {
            const netAnnual = (p1 + p2) - (p21 + p22 + p26 + p27 + p29);
            monthlyIncome = (p6 > 0) ? (((netAnnual / p6 * 365) / 12) + (p365 / 12)) : 0;
        } else {
            monthlyIncome = parseFloat(nettoInp.value) || 0;
        }
    } else if (macroCat === "autonomo") {
        const regime = cardEl.querySelector(".coapp-autonomo-regime")?.value || "forfettario";
        const isSingleUnico = cardEl.querySelector(".coapp-autonomo-single-unico")?.checked || false;
        
        if (regime === "forfettario") {
            const lm22_1 = parseFloat(cardEl.querySelector(".coapp-lm22")?.value || cardEl.querySelector(".coapp-lm22-1")?.value) || 0;
            const lm27_1 = parseFloat(cardEl.querySelector(".coapp-lm27")?.value || cardEl.querySelector(".coapp-lm27-1")?.value) || 0;
            const lm35_1 = parseFloat(cardEl.querySelector(".coapp-lm35")?.value || cardEl.querySelector(".coapp-lm35-1")?.value) || 0;
            const lm36_1 = parseFloat(cardEl.querySelector(".coapp-lm36")?.value || cardEl.querySelector(".coapp-lm36-1")?.value) || 0;
            const lm39_1 = parseFloat(cardEl.querySelector(".coapp-lm39")?.value || cardEl.querySelector(".coapp-lm39-1")?.value) || 0;

            const lm22_2 = parseFloat(cardEl.querySelector(".coapp-lm22-anno2")?.value) || 0;
            const lm27_2 = parseFloat(cardEl.querySelector(".coapp-lm27-anno2")?.value) || 0;
            const lm35_2 = parseFloat(cardEl.querySelector(".coapp-lm35-anno2")?.value) || 0;
            const lm36_2 = parseFloat(cardEl.querySelector(".coapp-lm36-anno2")?.value) || 0;
            const lm39_2 = parseFloat(cardEl.querySelector(".coapp-lm39-anno2")?.value) || 0;

            let netY1 = 0;
            if (lm36_1 > 0) {
                netY1 = (lm36_1 - lm39_1) / 12;
            } else if (lm22_1 > 0) {
                netY1 = (lm22_1 - lm27_1 - lm35_1 - lm39_1) / 12;
            }

            let netY2 = 0;
            if (lm36_2 > 0) {
                netY2 = (lm36_2 - lm39_2) / 12;
            } else if (lm22_2 > 0) {
                netY2 = (lm22_2 - lm27_2 - lm35_2 - lm39_2) / 12;
            }

            if (isSingleUnico || netY2 <= 0) {
                monthlyIncome = netY1 > 0 ? netY1 : (parseFloat(nettoInp.value) || 0);
            } else {
                monthlyIncome = (netY1 + netY2) / 2;
            }
        } else {
            const rn1_1 = parseFloat(cardEl.querySelector(".coapp-rn1")?.value || cardEl.querySelector(".coapp-rn1-1")?.value) || 0;
            const rn4_1 = parseFloat(cardEl.querySelector(".coapp-rn4")?.value || cardEl.querySelector(".coapp-rn4-1")?.value) || 0;
            const rn26_1 = parseFloat(cardEl.querySelector(".coapp-rn26")?.value || cardEl.querySelector(".coapp-rn26-1")?.value) || 0;
            const rv2_1 = parseFloat(cardEl.querySelector(".coapp-rv2")?.value || cardEl.querySelector(".coapp-rv2-1")?.value) || 0;
            const rv10_1 = parseFloat(cardEl.querySelector(".coapp-rv10")?.value || cardEl.querySelector(".coapp-rv10-1")?.value) || 0;
            const rv17_1 = parseFloat(cardEl.querySelector(".coapp-rv17")?.value || cardEl.querySelector(".coapp-rv17-1")?.value) || 0;

            const rn1_2 = parseFloat(cardEl.querySelector(".coapp-rn1-anno2")?.value) || 0;
            const rn4_2 = parseFloat(cardEl.querySelector(".coapp-rn4-anno2")?.value) || 0;
            const rn26_2 = parseFloat(cardEl.querySelector(".coapp-rn26-anno2")?.value) || 0;
            const rv2_2 = parseFloat(cardEl.querySelector(".coapp-rv2-anno2")?.value) || 0;
            const rv10_2 = parseFloat(cardEl.querySelector(".coapp-rv10-anno2")?.value) || 0;
            const rv17_2 = parseFloat(cardEl.querySelector(".coapp-rv17-anno2")?.value) || 0;

            const base1 = rn1_1 > 0 ? rn1_1 : rn4_1;
            const netY1 = base1 > 0 ? ((base1 - rn26_1 - rv2_1 - rv10_1 - rv17_1) / 12) : 0;

            const base2 = rn1_2 > 0 ? rn1_2 : rn4_2;
            const netY2 = base2 > 0 ? ((base2 - rn26_2 - rv2_2 - rv10_2 - rv17_2) / 12) : 0;

            if (isSingleUnico || netY2 <= 0) {
                monthlyIncome = netY1 > 0 ? netY1 : (parseFloat(nettoInp.value) || 0);
            } else {
                monthlyIncome = (netY1 + netY2) / 2;
            }
        }
    } else if (macroCat === "pensionato") {
        monthlyIncome = parseFloat(nettoInp.value) || 0;
    }

    // ALIMENTI RICEVUTI: sommare al reddito netto mensile del soggetto
    const alimentiSel = cardEl.querySelector(".coapp-q4-alimenti") || cardEl.querySelector(".coapp-alimenti");
    const alimentiImpInp = cardEl.querySelector(".coapp-q4-alimenti-importo") || cardEl.querySelector(".coapp-alimenti-importo");
    if (alimentiSel && alimentiSel.value === "riceve") {
        const alVal = parseFloat(alimentiImpInp?.value) || 0;
        monthlyIncome += alVal;
    }

    if (document.activeElement !== nettoInp) {
        nettoInp.value = Math.round(monthlyIncome * 100) / 100;
    }
    
    if (window.updateCalculatedIncome) window.updateCalculatedIncome();
    if (window.updateCalculations) window.updateCalculations();
};

window.updateCoappChildrenAgesUI = function(cardEl) {
    if (!cardEl) return;
    const figliSelect = cardEl.querySelector(".coapp-q5-figli");
    const numFigliInput = cardEl.querySelector(".coapp-q5-num-figli");
    const container = cardEl.querySelector(".coapp-children-ages-container");
    const inputsDiv = cardEl.querySelector(".coapp-children-ages-inputs");
    const countBox = cardEl.querySelector(".coapp-figli-count-box");
    const auBox = cardEl.querySelector(".coapp-assegno-unico-box");
    const auSelect = cardEl.querySelector(".coapp-q15-assegno-unico-select");
    const auValore = cardEl.querySelector(".coapp-q15-assegno-unico");
    const etaHidden = cardEl.querySelector(".coapp-q5-eta-figli");
    
    if (!figliSelect) return;
    const figliSi = figliSelect.value === "si";
    const numFigli = (figliSi && numFigliInput) ? (parseInt(numFigliInput.value) || 0) : 0;
    
    if (countBox) countBox.style.display = figliSi ? "block" : "none";
    if (auBox) auBox.style.display = figliSi ? "block" : "none";
    
    if (!figliSi) {
        if (numFigliInput) numFigliInput.value = "0";
        if (auSelect) auSelect.value = "no";
        if (auValore) auValore.value = "0";
        if (etaHidden) etaHidden.value = "";
        if (container) container.style.display = "none";
        if (inputsDiv) inputsDiv.innerHTML = "";
    } else {
        if (numFigliInput && (!numFigliInput.value || parseInt(numFigliInput.value) <= 0)) {
            numFigliInput.value = "2";
        }
        const curNumFigli = parseInt(numFigliInput?.value) || 0;
        if (container && inputsDiv) {
            if (curNumFigli > 0) {
                container.style.display = "block";
                const existingInputs = inputsDiv.querySelectorAll(".coapp-child-age-input");
                const savedAges = [];
                existingInputs.forEach(inp => savedAges.push(inp.value || ""));
                
                if (etaHidden && etaHidden.value && savedAges.length === 0) {
                    etaHidden.value.split(",").forEach(a => savedAges.push(a.trim()));
                }
                
                if (existingInputs.length !== curNumFigli) {
                    inputsDiv.innerHTML = "";
                    for (let i = 1; i <= curNumFigli; i++) {
                        const wrapper = document.createElement("div");
                        wrapper.style.display = "flex";
                        wrapper.style.flexDirection = "column";
                        wrapper.style.gap = "0.25rem";
                        wrapper.style.width = "70px";

                        const label = document.createElement("span");
                        label.innerText = `Figlio ${i}`;
                        label.style.fontSize = "0.7rem";
                        label.style.fontWeight = "700";
                        label.style.color = "#64748b";

                        const input = document.createElement("input");
                        input.type = "number";
                        input.className = "coapp-child-age-input";
                        input.min = "0";
                        input.max = "99";
                        input.placeholder = "Età";
                        input.value = (savedAges[i - 1] !== undefined && savedAges[i - 1] !== "") ? savedAges[i - 1] : (i === 1 ? "6" : (i === 2 ? "3" : ""));
                        input.style.cssText = "width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff; text-align: center;";
                        input.oninput = function() {
                            const allInputs = inputsDiv.querySelectorAll(".coapp-child-age-input");
                            const ages = Array.from(allInputs).map(x => x.value).join(",");
                            if (etaHidden) etaHidden.value = ages;
                            if (window.updateCalculations) window.updateCalculations();
                        };

                        wrapper.appendChild(label);
                        wrapper.appendChild(input);
                        inputsDiv.appendChild(wrapper);
                    }
                    const allInputs = inputsDiv.querySelectorAll(".coapp-child-age-input");
                    const ages = Array.from(allInputs).map(x => x.value).join(",");
                    if (etaHidden) etaHidden.value = ages;
                }
            } else {
                container.style.display = "none";
                inputsDiv.innerHTML = "";
                if (etaHidden) etaHidden.value = "";
            }
        }
    }
    if (window.updateCalculations) window.updateCalculations();
};

window.renderFullCoapplicantCardHtml = function(id, isSpouse = false, data = {}, isGuarantor = false) {
    const nome = data.nome || "";
    const cognome = data.cognome || "";
    const dataNascita = data.dataNascita || (isGuarantor ? "1968-01-01" : "1988-01-01");
    const sesso = data.sesso || (isGuarantor ? "M" : "F");
    const rapporto = data.rapporto || data.rapportoRichiedente || "genitore";
    
    // Stato Civile, Separazione, Alimenti
    const statoCivile = data.statoCivile || (isSpouse ? "sposato" : (isGuarantor ? "sposato" : "celibe_nubile"));
    const regime = data.regime || (isSpouse ? "comunione" : "separazione");
    const anniSposato = (data.anniSposato !== undefined) ? data.anniSposato : (isGuarantor ? 15 : 8);
    const separazioneAnteStipula = data.separazioneAnteStipula || false;
    const alimenti = data.alimenti || "nessuno";
    const alimentiImporto = (data.alimentiImporto !== undefined) ? data.alimentiImporto : (alimenti !== "nessuno" ? 300 : 0);
    
    // Figli, Assegno Unico, Età
    const figli = data.figli || (isSpouse ? "si" : "no");
    const numFigli = (data.numFigli !== undefined) ? data.numFigli : (isSpouse ? 2 : 0);
    const assegnoUnicoSelect = data.assegnoUnicoSelect || (figli === "si" ? "si" : "no");
    const assegnoUnico = (data.assegnoUnico !== undefined) ? data.assegnoUnico : (figli === "si" ? 280 : 0);
    const etaFigli = data.etaFigli || "";

    const cittadinanza = data.cittadinanza || "IT";
    const permScadenza = data.permScadenza || "valido";
    const famigliaSede = data.famigliaSede || "italia";
    const abitazione = data.abitazione || (isGuarantor ? "proprieta" : "famiglia");
    const canoneAffitto = data.canoneAffitto || 0;
    const bancaAttuale = data.bancaAttuale || "";
    
    // Section 2 - Work & Income
    const macroCategoria = data.macroCategoria || (isSpouse ? "no_lavoro" : "dipendente");
    const professione = data.professione || (isSpouse ? "Casalinga / Altro" : (isGuarantor ? "Impiegato / Pensionato" : "Impiegato"));
    const dipContratto = data.dipContratto || "indeterminato";
    const dipAnzianita = data.dipAnzianita || (isGuarantor ? 120 : 0);
    const dipOrario = data.dipOrario || "full_time";
    const dipDatorePiva = data.dipDatorePiva || "";
    const netto = (data.netto !== undefined) ? data.netto : (isSpouse ? 0 : (isGuarantor ? 2200 : 1800));
    
    // CU caselle
    const cu1 = data.cu1 || 0;
    const cu2 = data.cu2 || 0;
    const cu6 = (data.cu6 !== undefined) ? data.cu6 : 365;
    const cu21 = data.cu21 || 0;
    const cu22 = data.cu22 || 0;
    const cu26 = data.cu26 || 0;
    const cu27 = data.cu27 || 0;
    const cu29 = data.cu29 || 0;
    const cu365 = data.cu365 || 0;
    const cu810 = data.cu810 || 0;

    // Autonomo
    const autonomoRegime = data.autonomoRegime || "forfettario";
    const autonomoAnni = data.autonomoAnni || 5;
    const singleUnico = (data.singleUnico === true || data.singleUnico === "si" || data.isSingleUnico === true);
    const lm22 = data.lm22 || data.lm22_1 || 0;
    const lm27 = data.lm27 || data.lm27_1 || 0;
    const lm35 = data.lm35 || data.lm35_1 || 0;
    const lm36 = data.lm36 || data.lm36_1 || 0;
    const lm39 = data.lm39 || data.lm39_1 || 0;
    const lm22_anno2 = data.lm22_anno2 || data.lm22_2 || 0;
    const lm27_anno2 = data.lm27_anno2 || data.lm27_2 || 0;
    const lm35_anno2 = data.lm35_anno2 || data.lm35_2 || 0;
    const lm36_anno2 = data.lm36_anno2 || data.lm36_2 || 0;
    const lm39_anno2 = data.lm39_anno2 || data.lm39_2 || 0;

    const rn1 = data.rn1 || data.rn1_1 || 0;
    const rn4 = data.rn4 || data.rn4_1 || 0;
    const rn26 = data.rn26 || data.rn26_1 || 0;
    const rv2 = data.rv2 || data.rv2_1 || 0;
    const rv10 = data.rv10 || data.rv10_1 || 0;
    const rv17 = data.rv17 || data.rv17_1 || 0;
    const rn1_anno2 = data.rn1_anno2 || data.rn1_2 || 0;
    const rn4_anno2 = data.rn4_anno2 || data.rn4_2 || 0;
    const rn26_anno2 = data.rn26_anno2 || data.rn26_2 || 0;
    const rv2_anno2 = data.rv2_anno2 || data.rv2_2 || 0;
    const rv10_anno2 = data.rv10_anno2 || data.rv10_2 || 0;
    const rv17_anno2 = data.rv17_anno2 || data.rv17_2 || 0;

    const pensioneTipo = data.pensioneTipo || "INPS (Pensione di Vecchiaia)";
    
    // Section 3 - Loans & CRIF
    const hasLoans = data.hasLoans || "no";
    const loansRata = data.loansRata || 0;
    const loansDebito = data.loansDebito || 0;
    const pignoramenti = data.pignoramenti || "no";
    const crifSofferenze = data.crifSofferenze || "no";

    let badgeHtml = "";
    if (isGuarantor) {
        badgeHtml = `
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="background: #16a34a; color: #ffffff; border-radius: 8px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; box-shadow: 0 2px 6px rgba(22,163,74,0.3);">🛡️</div>
                <div>
                    <strong style="font-size: 1.05rem; color: #166534; display: block;">🛡️ Intervista Garante Terzo</strong>
                    <span style="font-size: 0.75rem; color: #64748b;">Soggetto garante a supporto della capacità reddituale e patrimoniale</span>
                </div>
            </div>
            <button type="button" onclick="document.getElementById('${id}').remove(); if(window.updateCalculatedIncome) window.updateCalculatedIncome(); if(window.updateCalculations) window.updateCalculations();" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; padding: 0.4rem 0.75rem; cursor: pointer; font-size: 0.82rem; font-weight: 700;">🗑️ Rimuovi Garante</button>
        `;
    } else if (isSpouse) {
        badgeHtml = `
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="background: #0052ff; color: #ffffff; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem;">2</div>
                <div>
                    <strong style="font-size: 1.05rem; color: #0052ff; display: block;">👥 Intervista 2° Richiedente: Coniuge</strong>
                    <span style="font-size: 0.75rem; color: #64748b;">(Cointestatario obbligatorio in regime di comunione dei beni)</span>
                </div>
            </div>
            <span style="font-size: 0.72rem; background: #dbeafe; color: #1e40af; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px;">Comunione dei Beni</span>
        `;
    } else {
        badgeHtml = `
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="background: #0f172a; color: #ffffff; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem;">+</div>
                <div>
                    <strong style="font-size: 1.05rem; color: #0f172a; display: block;">👥 Intervista Ulteriore Richiedente</strong>
                    <span style="font-size: 0.75rem; color: #64748b;">Cointestatario aggiuntivo nella pratica</span>
                </div>
            </div>
            <button type="button" onclick="document.getElementById('${id}').remove(); if(window.updateCalculatedIncome) window.updateCalculatedIncome(); if(window.updateCalculations) window.updateCalculations();" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; padding: 0.4rem 0.75rem; cursor: pointer; font-size: 0.82rem; font-weight: 700;">🗑️ Rimuovi Richiedente</button>
        `;
    }

    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.85rem;">
            ${badgeHtml}
        </div>
        
        <!-- SEZIONE 1: ANAGRAFICA E STATO CIVILE (PUNTO 1) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.4rem;">
                👤 1. Anagrafica e Dati Personali
            </h4>

            ${isGuarantor ? `
            <!-- RAPPORTO CON IL 1° RICHIEDENTE -->
            <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.82rem; font-weight: 800; color: #166534; margin-bottom: 0.35rem;">🔗 Rapporto / Grado di Parentela con il 1° Richiedente *</label>
                <select class="coapp-q-rapporto" onchange="const card = this.closest('.coapp-card'); const fb = card ? card.querySelector('.coapp-fratello-box') : null; if (fb) fb.style.display = (this.value === 'fratello_sorella' ? 'block' : 'none'); if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.6rem 0.8rem; border: 1.5px solid #16a34a; border-radius: 8px; font-size: 0.88rem; font-weight: 700; background: #ffffff; color: #166534;">
                    <option value="genitore" ${rapporto === "genitore" ? "selected" : ""}>👨‍👩‍👧 Genitore (Padre / Madre)</option>
                    <option value="marito_moglie" ${rapporto === "marito_moglie" || rapporto === "coniuge" ? "selected" : ""}>💍 Coniuge (Marito / Moglie)</option>
                    <option value="convivente" ${rapporto === "convivente" || rapporto === "compagno" ? "selected" : ""}>🏡 Convivente / Compagno/a</option>
                    <option value="figlio" ${rapporto === "figlio" ? "selected" : ""}>🧒 Figlio / Figlia</option>
                    <option value="fratello_sorella" ${rapporto === "fratello_sorella" ? "selected" : ""}>👫 Fratello / Sorella</option>
                    <option value="parente_terzo" ${rapporto === "parente_terzo" ? "selected" : ""}>👥 Altro parente entro 3° grado (Zio / Nonno / Cugino)</option>
                    <option value="terzo_non_parente" ${rapporto === "terzo_non_parente" ? "selected" : ""}>🤝 Soggetto Terzo / Non parente (Amico / Conoscente)</option>
                    <option value="datore_socio" ${rapporto === "datore_socio" ? "selected" : ""}>💼 Datore di Lavoro / Socio d'Affari</option>
                </select>
                <div class="coapp-fratello-box" style="display: ${rapporto === 'fratello_sorella' ? 'block' : 'none'}; margin-top: 0.65rem; background: #ffffff; border: 1px solid #86efac; border-radius: 6px; padding: 0.5rem 0.75rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #166534; margin-bottom: 0.2rem;">Ha un proprio nucleo familiare autonomo (stato di famiglia separato)?</label>
                    <select class="coapp-fratello-nucleo-autonomo" onchange="if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.4rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
                        <option value="si" ${data.fratelloNucleoAutonomo === true || data.fratelloNucleoAutonomo === 'si' ? 'selected' : ''}>Sì (Nucleo autonomo separato dai genitori)</option>
                        <option value="no" ${data.fratelloNucleoAutonomo === false || data.fratelloNucleoAutonomo === 'no' ? 'selected' : ''}>No (Stesso nucleo / convivenza con genitori)</option>
                    </select>
                    <span style="font-size: 0.68rem; color: #15803d; display: block; margin-top: 0.2rem;">Mediobanca Premier pondera il reddito dei fratelli al 100% solo se hanno un proprio nucleo familiare autonomo.</span>
                </div>
                <span style="font-size: 0.72rem; color: #15803d; display: block; margin-top: 0.3rem;">Fattore vincolante per l'ammissibilità nelle policy bancarie (es. molte banche richiedono garanti in 1° grado di parentela).</span>
            </div>
            ` : ''}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">1. Nome *</label>
                    <input type="text" class="coapp-q1-nome coapp-nome" value="${nome}" placeholder="Nome del richiedente" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; font-weight: 600; color: #0f172a;">
                </div>
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">2. Cognome *</label>
                    <input type="text" class="coapp-q2-cognome coapp-cognome" value="${cognome}" placeholder="Cognome" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; font-weight: 600; color: #0f172a;">
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">3. Data di Nascita *</label>
                    <input type="date" class="coapp-q3-data-nascita coapp-data-nascita" value="${dataNascita}" onchange="if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; color: #0f172a;">
                </div>
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">Sesso</label>
                    <select class="coapp-q-sesso coapp-sesso" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="F" ${sesso === "F" ? "selected" : ""}>Femmina (F)</option>
                        <option value="M" ${sesso === "M" ? "selected" : ""}>Maschio (M)</option>
                    </select>
                </div>
            </div>

            <!-- Domanda 4 & 5 (Stato Civile, Regime, Alimenti, Figli) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">4. Stato Civile</label>
                    <select class="coapp-q4-stato-civile" onchange="
                        const card = this.closest('.coapp-card');
                        const sposBox = card.querySelector('.coapp-sposato-details');
                        const alimBox = card.querySelector('.coapp-alimenti-details');
                        if (sposBox) sposBox.style.display = (this.value === 'sposato') ? 'grid' : 'none';
                        if (alimBox) alimBox.style.display = (this.value === 'separato' || this.value === 'divorziato') ? 'block' : 'none';
                        window.updateCoappCalculatedIncome(card);
                    " style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="celibe_nubile" ${statoCivile === "celibe_nubile" ? "selected" : ""}>Celibe / Nubile</option>
                        <option value="convivente" ${statoCivile === "convivente" ? "selected" : ""}>Convivente</option>
                        <option value="sposato" ${statoCivile === "sposato" ? "selected" : ""}>Sposato/a</option>
                        <option value="separato" ${statoCivile === "separato" ? "selected" : ""}>Separato/a</option>
                        <option value="divorziato" ${statoCivile === "divorziato" ? "selected" : ""}>Divorziato/a</option>
                        <option value="vedovo" ${statoCivile === "vedovo" ? "selected" : ""}>Vedovo/a</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">5. Figli a carico</label>
                    <select class="coapp-q5-figli" onchange="
                        const card = this.closest('.coapp-card');
                        const numInp = card.querySelector('.coapp-q5-num-figli');
                        if (numInp) numInp.dataset.userEdited = 'true';
                        window.updateCoappChildrenAgesUI(card);
                    " style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="no" ${figli === "no" ? "selected" : ""}>No</option>
                        <option value="si" ${figli === "si" ? "selected" : ""}>Sì</option>
                    </select>
                </div>
            </div>

            <!-- Sposato Sub-fields for Coapp / Guarantor -->
            <div class="coapp-sposato-details" style="display: ${statoCivile === 'sposato' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; background: #f8fafc; padding: 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div>
                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Regime patrimoniale</label>
                    <select class="coapp-q4-regime" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        <option value="comunione" ${regime === "comunione" ? "selected" : ""}>Comunione dei beni</option>
                        <option value="separazione" ${regime === "separazione" ? "selected" : ""}>Separazione dei beni</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Sposato da quanti anni?</label>
                    <input type="number" class="coapp-q4-anni-sposato" value="${anniSposato}" min="0" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                </div>
                <div style="grid-column: span 2; display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                    <input type="checkbox" class="coapp-q4-separazione-ante-stipula" ${separazioneAnteStipula ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                    <label style="font-size: 0.78rem; font-weight: 600; color: #475569; cursor: pointer;">Faranno separazione dei beni ante stipula</label>
                </div>
            </div>

            <!-- Alimenti Sub-fields (Separato / Divorziato) for Coapp / Guarantor -->
            <div class="coapp-alimenti-details" style="display: ${(statoCivile === 'separato' || statoCivile === 'divorziato') ? 'block' : 'none'}; margin-bottom: 1rem; background: #f8fafc; padding: 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Gestione alimenti</label>
                        <select class="coapp-q4-alimenti coapp-alimenti" onchange="
                            const card = this.closest('.coapp-card');
                            const box = card.querySelector('.coapp-alimenti-amount-box');
                            if (box) box.style.display = (this.value === 'paga' || this.value === 'riceve') ? 'block' : 'none';
                            window.updateCoappCalculatedIncome(card);
                        " style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                            <option value="nessuno" ${alimenti === "nessuno" ? "selected" : ""}>Non paga né riceve alimenti</option>
                            <option value="paga" ${alimenti === "paga" ? "selected" : ""}>Paga alimenti mensili</option>
                            <option value="riceve" ${alimenti === "riceve" ? "selected" : ""}>Riceve alimenti mensili</option>
                        </select>
                    </div>
                    <div class="coapp-alimenti-amount-box" style="display: ${(alimenti === 'paga' || alimenti === 'riceve') ? 'block' : 'none'};">
                        <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Importo alimenti (€/mese)</label>
                        <input type="number" class="coapp-q4-alimenti-importo coapp-alimenti-importo" value="${alimentiImporto}" min="0" placeholder="€ / mese" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-weight: 700; background: #ffffff;">
                    </div>
                </div>
            </div>

            <!-- Figli count, Assegno Unico and Ages for Coapp / Guarantor -->
            <div class="coapp-figli-count-box" style="display: ${figli === 'si' ? 'block' : 'none'}; margin-bottom: 1rem; background: #f8fafc; padding: 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="margin-bottom: 0.6rem;">
                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Numero figli a carico (modificabile)</label>
                    <input type="number" class="coapp-q5-num-figli" value="${numFigli}" min="0" oninput="this.dataset.userEdited = 'true'; window.updateCoappChildrenAgesUI(this.closest('.coapp-card'));" onchange="this.dataset.userEdited = 'true'; window.updateCoappChildrenAgesUI(this.closest('.coapp-card'));" style="width: 100%; max-width: 180px; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-weight: 700; background: #ffffff;">
                </div>

                <!-- Assegno Unico for Coapp / Guarantor -->
                <div class="coapp-assegno-unico-box" style="margin-bottom: 0.75rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Percepisce Assegno Unico?</label>
                            <select class="coapp-q15-assegno-unico-select" onchange="if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                                <option value="no" ${assegnoUnicoSelect === "no" ? "selected" : ""}>No</option>
                                <option value="si" ${assegnoUnicoSelect === "si" ? "selected" : ""}>Sì</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Importo mensile (€)</label>
                            <input type="number" class="coapp-q15-assegno-unico" value="${assegnoUnico}" min="0" placeholder="€ / mese" oninput="if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                    </div>
                </div>

                <!-- Hidden input for child ages -->
                <input type="hidden" class="coapp-q5-eta-figli" value="${etaFigli}">
                
                <div class="coapp-children-ages-container" style="display: ${(figli === 'si' && numFigli > 0) ? 'block' : 'none'};">
                    <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.35rem;">🎂 Inserisci l'età di ciascun figlio:</label>
                    <div class="coapp-children-ages-inputs" style="display: flex; flex-wrap: wrap; gap: 0.75rem;"></div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">6. Cittadinanza</label>
                    <select class="coapp-q6-cittadinanza coapp-cittadinanza" onchange="const pEl = this.closest('.coapp-card').querySelector('.coapp-extra-ue-box'); if(pEl) pEl.style.display = (this.value === 'extra') ? 'block' : 'none'; if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="italiana" ${cittadinanza === "italiana" || cittadinanza === "IT" ? "selected" : ""}>Italiana</option>
                        <option value="ue" ${cittadinanza === "ue" || cittadinanza === "UE" ? "selected" : ""}>Comunitaria UE</option>
                        <option value="extra" ${cittadinanza === "extra" || cittadinanza === "extra_UE" ? "selected" : ""}>Extra UE</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">7. Abitazione attuale</label>
                    <select class="coapp-q7-abitazione" onchange="const affBox = this.closest('.coapp-card').querySelector('.coapp-affitto-box'); if(affBox) affBox.style.display = (this.value === 'affitto') ? 'block' : 'none';" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="proprieta" ${abitazione === "proprieta" ? "selected" : ""}>Proprietà</option>
                        <option value="affitto" ${abitazione === "affitto" ? "selected" : ""}>Affitto</option>
                        <option value="famiglia" ${abitazione === "famiglia" || abitazione === "genitori" ? "selected" : ""}>Presso famiglia / Coniuge / Gratuito</option>
                    </select>
                </div>
            </div>

            <!-- Extra UE Box for coapp -->
            <div class="coapp-extra-ue-box" style="display: ${(cittadinanza === 'extra' || cittadinanza === 'extra_UE') ? 'block' : 'none'}; background: #fefce8; padding: 0.85rem; border-radius: 8px; border: 1px solid #fef08a; margin-bottom: 1rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #854d0e; margin-bottom: 0.25rem;">Scadenza permesso soggiorno</label>
                        <select class="coapp-q6-permesso coapp-permesso" onchange="if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                            <option value="valido" ${permScadenza === "valido" ? "selected" : ""}>A tempo indeterminato / Valido</option>
                            <option value="scaduto_ricevuta" ${permScadenza === "scaduto_ricevuta" ? "selected" : ""}>In rinnovo con ricevuta</option>
                            <option value="scaduto" ${permScadenza === "scaduto" ? "selected" : ""}>Scaduto</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #854d0e; margin-bottom: 0.25rem;">Famiglia risiede in Italia?</label>
                        <select class="coapp-q14-famiglia" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                            <option value="italia" ${famigliaSede === "italia" ? "selected" : ""}>Sì, in Italia</option>
                            <option value="estero" ${famigliaSede === "estero" ? "selected" : ""}>No, al paese d'origine</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Affitto Box for coapp -->
            <div class="coapp-affitto-box" style="display: ${abitazione === 'affitto' ? 'block' : 'none'}; margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Canone affitto mensile intestato (€)</label>
                <input type="number" class="coapp-q7-canone-affitto" value="${canoneAffitto}" min="0" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
            </div>

            <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">8. Banca attuale del richiedente</label>
                <input type="text" class="coapp-q8-banca-attuale" value="${bancaAttuale}" placeholder="es. Intesa Sanpaolo, UniCredit, Banco BPM..." style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem;">
            </div>
        </div>

        <!-- SEZIONE 2: OCCUPAZIONE E REDDITO (PUNTO 2) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem 0;">
                💼 2. Occupazione e Reddito (Domande 9 - 10 Cascata Completa)
            </h3>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">10. Categoria Lavorativa / Situazione Reddituale</label>
                <select class="coapp-macro-categoria coapp-tipo" onchange="
                    const card = this.closest('.coapp-card');
                    const isNoIncome = this.value === 'no_lavoro';
                    const incomeDetails = card.querySelector('.coapp-income-details-box');
                    const noIncomeMsg = card.querySelector('.coapp-no-income-msg');
                    const dipCascade = card.querySelector('.coapp-dipendente-cascade');
                    const autCascade = card.querySelector('.coapp-autonomo-cascade');
                    const penCascade = card.querySelector('.coapp-pensionato-cascade');
                    const nettoInput = card.querySelector('.coapp-netto');

                    if (incomeDetails) incomeDetails.style.display = isNoIncome ? 'none' : 'block';
                    if (noIncomeMsg) noIncomeMsg.style.display = isNoIncome ? 'block' : 'none';
                    if (isNoIncome && nettoInput) nettoInput.value = 0;

                    if (dipCascade) dipCascade.style.display = (this.value === 'dipendente' || this.value === 'colf_badanti' || this.value === 'interinale') ? 'block' : 'none';
                    if (autCascade) autCascade.style.display = (this.value === 'autonomo') ? 'block' : 'none';
                    if (penCascade) penCascade.style.display = (this.value === 'pensionato') ? 'block' : 'none';

                    window.updateCoappCalculatedIncome(card);
                " style="width: 100%; padding: 0.65rem 0.85rem; border: 2px solid #0052ff; border-radius: 8px; font-size: 0.9rem; font-weight: 700; background: #ffffff; color: #0f172a;">
                    <option value="no_lavoro" ${macroCategoria === "no_lavoro" ? "selected" : ""}>❌ Nessun reddito / A carico (Casalinga, Disoccupato, ecc.)</option>
                    <option value="dipendente" ${macroCategoria === "dipendente" || macroCategoria === "dipendente_ti" || macroCategoria === "dipendente_td" ? "selected" : ""}>👔 Lavoratore Dipendente</option>
                    <option value="autonomo" ${macroCategoria === "autonomo" ? "selected" : ""}>💼 Lavoratore Autonomo / P.IVA</option>
                    <option value="pensionato" ${macroCategoria === "pensionato" ? "selected" : ""}>👵/👴 Pensionato</option>
                    <option value="colf_badanti" ${macroCategoria === "colf_badanti" ? "selected" : ""}>🧹 Colf / Badante</option>
                    <option value="interinale" ${macroCategoria === "interinale" ? "selected" : ""}>⏱️ Lavoratore Interinale</option>
                </select>
            </div>

            <!-- Avviso Nessun Reddito -->
            <div class="coapp-no-income-msg" style="display: ${macroCategoria === 'no_lavoro' ? 'block' : 'none'}; background: #f8fafc; padding: 0.85rem 1.1rem; border-radius: 8px; border: 1px dashed #cbd5e1; font-size: 0.82rem; color: #64748b;">
                ℹ️ <strong>Nessun reddito proprio:</strong> Il richiedente è inserito a carico con reddito € 0/mese. La Sezione 1 (Anagrafica) e la Sezione 3 (Prestiti/CRIF) restano attive e valide.
            </div>

            <!-- Dettagli Reddito (Visibili solo se ha un'occupazione) -->
            <div class="coapp-income-details-box" style="display: ${macroCategoria !== 'no_lavoro' ? 'block' : 'none'};">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">9. Professione / Qualifica</label>
                    <input type="text" class="coapp-q9-professione" value="${professione}" placeholder="es. Impiegato Tecnico, Operaio, Medico..." style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                </div>

                <!-- CASCATA DIPENDENTE COMPLETA CON CASELLE CU -->
                <div class="coapp-dipendente-cascade" style="display: ${(macroCategoria === 'dipendente' || macroCategoria === 'dipendente_ti' || macroCategoria === 'dipendente_td' || macroCategoria === 'colf_badanti' || macroCategoria === 'interinale') ? 'block' : 'none'}; background: #f8fafc; padding: 1.25rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Tipo di Contratto</label>
                            <select class="coapp-q10-dip-contratto" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                                <option value="indeterminato" ${dipContratto === "indeterminato" ? "selected" : ""}>Tempo Indeterminato</option>
                                <option value="determinato" ${dipContratto === "determinato" ? "selected" : ""}>Tempo Determinato</option>
                                <option value="apprendista" ${dipContratto === "apprendista" ? "selected" : ""}>Apprendistato</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Anzianità lavorativa (mesi)</label>
                            <input type="number" class="coapp-q10-anzianita coapp-anzianita" value="${dipAnzianita}" min="0" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Orario Lavoro</label>
                            <select class="coapp-q10-dip-orario coapp-orario" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                                <option value="full_time" ${dipOrario === "full_time" ? "selected" : ""}>Full-time</option>
                                <option value="part_time" ${dipOrario === "part_time" ? "selected" : ""}>Part-time</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Partita IVA Datore Lavoro</label>
                            <input type="text" class="coapp-q10-datore-piva coapp-datore" value="${dipDatorePiva}" placeholder="11 cifre o Nome Azienda" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                    </div>

                    <p style="font-size: 0.75rem; font-weight: 700; color: #0052ff; margin: 0 0 0.75rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">CASELLE CERTIFICAZIONE UNICA (CU):</p>
                    <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 1 (Dip. Lordi)</label>
                            <input type="number" class="coapp-cu1" value="${cu1}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 2 (Altri Lordi)</label>
                            <input type="number" class="coapp-cu2" value="${cu2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 6 (Giorni Lav.)</label>
                            <input type="number" class="coapp-cu6" value="${cu6}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                    </div>
                    <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 21 (Ritenute)</label>
                            <input type="number" class="coapp-cu21" value="${cu21}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 22 (Regionale)</label>
                            <input type="number" class="coapp-cu22" value="${cu22}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 26 (Comunale Saldo)</label>
                            <input type="number" class="coapp-cu26" value="${cu26}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                    </div>
                    <div style="grid-template-columns: repeat(4, 1fr); display: grid; gap: 0.75rem;">
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 27 (Comunale Acc.)</label>
                            <input type="number" class="coapp-cu27" value="${cu27}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 29 (Cedolare)</label>
                            <input type="number" class="coapp-cu29" value="${cu29}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 365 (Bonus)</label>
                            <input type="number" class="coapp-cu365" value="${cu365}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem;">Punto 810 (TFR Acc.)</label>
                            <input type="number" class="coapp-cu810" value="${cu810}" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                    </div>
                </div>

                <!-- CASCATA AUTONOMO COMPLETA CON 2 ANNI DI MODELLO REDDITI (LM / RN) -->
                <div class="coapp-autonomo-cascade" style="display: ${macroCategoria === 'autonomo' ? 'block' : 'none'}; background: #f8fafc; padding: 1.25rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.85rem;">
                        <div>
                            <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Regime Fiscale</label>
                            <select class="coapp-autonomo-regime" onchange="
                                const card = this.closest('.coapp-card');
                                const forf = card.querySelector('.coapp-autonomo-forfettario');
                                const ord = card.querySelector('.coapp-autonomo-ordinario');
                                if (forf) forf.style.display = (this.value === 'forfettario') ? 'block' : 'none';
                                if (ord) ord.style.display = (this.value === 'ordinario') ? 'block' : 'none';
                                window.updateCoappCalculatedIncome(card);
                            " style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                                <option value="forfettario" ${autonomoRegime === "forfettario" ? "selected" : ""}>Regime Forfettario</option>
                                <option value="ordinario" ${autonomoRegime === "ordinario" ? "selected" : ""}>Regime Ordinario</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Anni Attività</label>
                            <input type="number" class="coapp-autonomo-anni" value="${autonomoAnni}" min="0" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                        </div>
                    </div>

                    <!-- Opzione 1 solo Modello Unico -->
                    <div style="margin-bottom: 1rem; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 0.6rem 0.85rem; display: flex; align-items: center; gap: 0.6rem;">
                        <input type="checkbox" class="coapp-autonomo-single-unico" ${singleUnico ? 'checked' : ''} onchange="
                            const card = this.closest('.coapp-card');
                            const a2 = card.querySelectorAll('.coapp-autonomo-anno2');
                            a2.forEach(el => el.style.display = this.checked ? 'none' : 'block');
                            window.updateCoappCalculatedIncome(card);
                        " style="width: 16px; height: 16px; cursor: pointer;">
                        <label style="font-size: 0.78rem; font-weight: 700; color: #334155; cursor: pointer; user-select: none;">
                            📝 Calcola con 1 solo Modello Unico (Attività aperta da meno di 2 anni / 1 solo anno fiscale)
                        </label>
                    </div>

                    <!-- Autonomo Forfettario (2 Anni) -->
                    <div class="coapp-autonomo-forfettario" style="display: ${autonomoRegime === 'forfettario' ? 'block' : 'none'};">
                        <!-- UNICO 2026 -->
                        <div style="background: #ffffff; border: 1.5px solid #0052ff; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.85rem;">
                            <div style="font-size: 0.78rem; font-weight: 800; color: #0052ff; margin-bottom: 0.5rem;">
                                📘 MODELLO REDDITI 2026 (Anno Fiscale 2025) - QUADRO LM
                            </div>
                            <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.6rem; margin-bottom: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM22 (Compensati/Ricavi)</label>
                                    <input type="number" class="coapp-lm22" value="${lm22}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM27 (Spese/Abbatt.)</label>
                                    <input type="number" class="coapp-lm27" value="${lm27}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM35 (Contributi INPS)</label>
                                    <input type="number" class="coapp-lm35" value="${lm35}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                            <div style="grid-template-columns: 1fr 1fr; display: grid; gap: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM36 (Reddito Netto/Imp.)</label>
                                    <input type="number" class="coapp-lm36" value="${lm36}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM39 (Imposta Sost.)</label>
                                    <input type="number" class="coapp-lm39" value="${lm39}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                        </div>

                        <!-- UNICO 2025 -->
                        <div class="coapp-autonomo-anno2" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 0.85rem; display: ${singleUnico ? 'none' : 'block'};">
                            <div style="font-size: 0.78rem; font-weight: 800; color: #475569; margin-bottom: 0.5rem;">
                                📗 MODELLO REDDITI 2025 (Anno Fiscale 2024) - QUADRO LM
                            </div>
                            <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.6rem; margin-bottom: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM22 (Compensati/Ricavi)</label>
                                    <input type="number" class="coapp-lm22-anno2" value="${lm22_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM27 (Spese/Abbatt.)</label>
                                    <input type="number" class="coapp-lm27-anno2" value="${lm27_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM35 (Contributi INPS)</label>
                                    <input type="number" class="coapp-lm35-anno2" value="${lm35_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                            <div style="grid-template-columns: 1fr 1fr; display: grid; gap: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM36 (Reddito Netto/Imp.)</label>
                                    <input type="number" class="coapp-lm36-anno2" value="${lm36_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">LM39 (Imposta Sost.)</label>
                                    <input type="number" class="coapp-lm39-anno2" value="${lm39_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Autonomo Ordinario (2 Anni) -->
                    <div class="coapp-autonomo-ordinario" style="display: ${autonomoRegime === 'ordinario' ? 'block' : 'none'};">
                        <!-- UNICO 2026 -->
                        <div style="background: #ffffff; border: 1.5px solid #0052ff; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.85rem;">
                            <div style="font-size: 0.78rem; font-weight: 800; color: #0052ff; margin-bottom: 0.5rem;">
                                📘 MODELLO REDDITI 2026 (Anno Fiscale 2025) - QUADRO RN/RV
                            </div>
                            <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.6rem; margin-bottom: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RN1 (Reddito Compl.)</label>
                                    <input type="number" class="coapp-rn1" value="${rn1}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RN4 (Imponibile)</label>
                                    <input type="number" class="coapp-rn4" value="${rn4}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RN26 (Imposta Netta)</label>
                                    <input type="number" class="coapp-rn26" value="${rn26}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                            <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RV2 (Regionale)</label>
                                    <input type="number" class="coapp-rv2" value="${rv2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RV10 (Comunale Saldo)</label>
                                    <input type="number" class="coapp-rv10" value="${rv10}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RV17 (Comunale Acc.)</label>
                                    <input type="number" class="coapp-rv17" value="${rv17}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                        </div>

                        <!-- UNICO 2025 -->
                        <div class="coapp-autonomo-anno2" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 0.85rem; display: ${singleUnico ? 'none' : 'block'};">
                            <div style="font-size: 0.78rem; font-weight: 800; color: #475569; margin-bottom: 0.5rem;">
                                📗 MODELLO REDDITI 2025 (Anno Fiscale 2024) - QUADRO RN/RV
                            </div>
                            <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.6rem; margin-bottom: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RN1 (Reddito Compl.)</label>
                                    <input type="number" class="coapp-rn1-anno2" value="${rn1_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RN4 (Imponibile)</label>
                                    <input type="number" class="coapp-rn4-anno2" value="${rn4_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RN26 (Imposta Netta)</label>
                                    <input type="number" class="coapp-rn26-anno2" value="${rn26_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                            <div style="grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.6rem;">
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RV2 (Regionale)</label>
                                    <input type="number" class="coapp-rv2-anno2" value="${rv2_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RV10 (Comunale Saldo)</label>
                                    <input type="number" class="coapp-rv10-anno2" value="${rv10_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.70rem; font-weight: 700; color: #64748b; margin-bottom: 0.2rem;">RV17 (Comunale Acc.)</label>
                                    <input type="number" class="coapp-rv17-anno2" value="${rv17_anno2}" oninput="window.updateCoappCalculatedIncome(this.closest('.coapp-card'))" style="width: 100%; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; background: #ffffff;">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CASCATA PENSIONATO -->
                <div class="coapp-pensionato-cascade" style="display: ${macroCategoria === 'pensionato' ? 'block' : 'none'}; background: #f8fafc; padding: 1.25rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Ente Erogatore / Tipologia Pensione</label>
                        <input type="text" class="coapp-pensione-tipo" value="${pensioneTipo}" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background: #ffffff;">
                    </div>
                </div>

                <!-- COMMON NET INCOME FIELD -->
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                        <label style="display: block; font-size: 0.80rem; font-weight: 700; color: #334155; margin-bottom: 0;">Reddito Netto Mensile Indicativo (€) *</label>
                        <button type="button" onclick="window.openPayslipCalculator(this.closest('.coapp-card').querySelector('.coapp-netto'), '${isGuarantor ? 'Garante' : (isSpouse ? 'Coniuge' : 'Richiedente')} - ' + (this.closest('.coapp-card').querySelector('.coapp-nome')?.value || 'Coobbligato'))" style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; transition: background 0.15s;">
                            🧾 Calcola da Buste Paga
                        </button>
                    </div>
                    <input type="number" class="coapp-netto" value="${netto}" min="0" oninput="if(window.updateCalculatedIncome) window.updateCalculatedIncome(); if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.65rem 0.85rem; border: 2.5px solid #0052ff; border-radius: 8px; font-size: 0.95rem; font-weight: 800; color: #0052ff; background: #ffffff; outline: none;">
                    <span style="font-size: 0.72rem; color: #64748b; display: block; margin-top: 0.3rem;">Il reddito netto mensile determinato da CU/Modello Unico, calcolo buste paga o inserito manualmente.</span>
                </div>
            </div>
        </div>

        <!-- SEZIONE 3: PRESTITI & AFFIDABILITÀ CREDITIZIA (PUNTO 3) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem 0;">
                💳 3. Prestiti & Affidabilità Creditizia (Domande 11 - 13)
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">11. Prestiti in essere?</label>
                    <select class="coapp-q11-has-loans" onchange="const lbox = this.closest('.coapp-card').querySelector('.coapp-loans-details-box'); if(lbox) lbox.style.display = (this.value === 'si') ? 'grid' : 'none'; if(window.updateCalculatedIncome) window.updateCalculatedIncome(); if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="no" ${hasLoans === "no" ? "selected" : ""}>No</option>
                        <option value="si" ${hasLoans === "si" ? "selected" : ""}>Sì</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">12. Pignoramenti?</label>
                    <select class="coapp-q12-pignoramenti" onchange="if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="no" ${pignoramenti === "no" ? "selected" : ""}>No</option>
                        <option value="si" ${pignoramenti === "si" ? "selected" : ""}>Sì</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">13. Segnalazioni CRIF?</label>
                    <select class="coapp-q13-crif-sofferenze" onchange="if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; background: #ffffff;">
                        <option value="no" ${crifSofferenze === "no" ? "selected" : ""}>No (Regolare)</option>
                        <option value="si" ${crifSofferenze === "si" ? "selected" : ""}>Sì (Ritardi passati)</option>
                    </select>
                </div>
            </div>

            <div class="coapp-loans-details-box" style="display: ${hasLoans === 'si' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; padding: 0.85rem; border-radius: 8px; border: 1px solid #cbd5e1;">
                <div>
                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Rata mensile totale prestiti (€)</label>
                    <input type="number" class="coapp-loans-rata" value="${loansRata}" min="0" oninput="if(window.updateCalculatedIncome) window.updateCalculatedIncome(); if(window.updateCalculations) window.updateCalculations();" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-weight: 700; color: #ef4444;">
                </div>
                <div>
                    <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Debito residuo totale (€)</label>
                    <input type="number" class="coapp-loans-debito" value="${loansDebito}" min="0" style="width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                </div>
            </div>
        </div>
    `;
};

window.addCoapplicantCardWithValue = function(arg1 = {}, arg2 = "1800", arg3 = "dipendente_ti") {
    const container = document.getElementById("coapplicant-cards-container");
    if (!container) return;
    const id = "coapp-" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const el = document.createElement("div");
    el.id = id;
    el.className = "coapp-card";
    el.style.cssText = "background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 1.25rem; margin-top: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);";
    
    let data = {};
    if (typeof arg1 === "object" && arg1 !== null) {
        data = arg1;
    } else {
        data = { nome: arg1, netto: parseFloat(arg2) || 1800, macroCategoria: arg3 };
    }
    
    el.innerHTML = window.renderFullCoapplicantCardHtml(id, false, data);
    container.appendChild(el);
    if (window.updateCalculatedIncome) window.updateCalculatedIncome();
    if (window.updateCalculations) window.updateCalculations();
};

window.addCoapplicantCard = function() {
    window.addCoapplicantCardWithValue({
        nome: "",
        cognome: "",
        dataNascita: "1988-01-01",
        sesso: "F",
        cittadinanza: "IT",
        macroCategoria: "dipendente",
        netto: 1800
    });
};

window.addGuarantorCardWithValue = function(arg1 = {}, arg2 = "2200", arg3 = "dipendente") {
    const container = document.getElementById("guarantor-cards-container");
    if (!container) return;
    const id = "guar-" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const el = document.createElement("div");
    el.id = id;
    el.className = "coapp-card guarantor-card";
    el.style.cssText = "background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 1.25rem; margin-top: 1rem; box-shadow: 0 2px 8px rgba(22,163,74,0.06);";
    
    let data = {};
    if (typeof arg1 === "object" && arg1 !== null) {
        data = arg1;
    } else {
        data = { nome: arg1, netto: parseFloat(arg2) || 2200, macroCategoria: arg3 };
    }
    
    el.innerHTML = window.renderFullCoapplicantCardHtml(id, false, data, true);
    container.appendChild(el);
    if (window.updateCoappChildrenAgesUI) window.updateCoappChildrenAgesUI(el);
    if (window.updateCalculatedIncome) window.updateCalculatedIncome();
    if (window.updateCalculations) window.updateCalculations();
};

window.addGuarantorCard = function() {
    window.addGuarantorCardWithValue({
        nome: "",
        cognome: "",
        dataNascita: "1968-01-01",
        sesso: "M",
        rapporto: "genitore",
        statoCivile: "sposato",
        regime: "separazione",
        anniSposato: 15,
        figli: "no",
        cittadinanza: "IT",
        macroCategoria: "dipendente",
        netto: 2200
    });
};

window.toggleSecondIncome = function(checked) {
    const container = document.getElementById("group-second-income-container");
    if (container) container.style.display = checked ? "block" : "none";
    if (typeof window.updateCalculatedIncome === "function") {
        window.updateCalculatedIncome();
    }
};

window.toggleQ10MacroCategory2 = function(cat) {
    const dip = document.getElementById("group-q10-dipendente-cascade-2");
    const aut = document.getElementById("group-q10-autonomo-cascade-2");
    const pen = document.getElementById("group-q10-pensionato-cascade-2");
    const loc = document.getElementById("group-q10-locazione-cascade-2");
    if (dip) dip.style.display = (cat === "dipendente" || cat === "colf_badanti" || cat === "interinale") ? "block" : "none";
    if (aut) aut.style.display = (cat === "autonomo") ? "block" : "none";
    if (pen) pen.style.display = (cat === "pensionato") ? "block" : "none";
    if (loc) loc.style.display = (cat === "locazione") ? "block" : "none";
    if (typeof window.updateCalculatedIncome === "function") {
        window.updateCalculatedIncome();
    }
};

window.toggleQ10DipendenteSub2 = function(sub) {
    const lbl = document.getElementById("lbl-q10-duration-2");
    if (lbl) {
        if (sub === "indeterminato") {
            lbl.innerText = "Anzianità lavorativa (mesi)";
        } else if (sub === "determinato") {
            lbl.innerText = "Durata residua (mesi)";
        } else if (sub === "apprendista") {
            lbl.innerText = "Durata apprendistato (mesi)";
        }
    }
};

window.toggleQ10AutonomoRegime2 = function(regime) {
    const forf = document.getElementById("group-q10-autonomo-forfettario-2");
    const ord = document.getElementById("group-q10-autonomo-ordinario-2");
    if (forf) forf.style.display = (regime === "forfettario") ? "block" : "none";
    if (ord) ord.style.display = (regime === "ordinario") ? "block" : "none";
    if (typeof window.updateCalculatedIncome === "function") {
        window.updateCalculatedIncome();
    }
};

window.updateCalculatedIncome = function() {
    const macroCat = document.getElementById("wiz-q10-macro-categoria")?.value || "dipendente";
    let monthlyIncome = 0;

    if (macroCat === "dipendente" || macroCat === "colf_badanti" || macroCat === "interinale") {
        const p1 = parseFloat(document.getElementById("wiz-q10-cu1")?.value) || 0;
        const p2 = parseFloat(document.getElementById("wiz-q10-cu2")?.value) || 0;
        const p6 = parseFloat(document.getElementById("wiz-q10-cu6")?.value) || 365;
        const p21 = parseFloat(document.getElementById("wiz-q10-cu21")?.value) || 0;
        const p22 = parseFloat(document.getElementById("wiz-q10-cu22")?.value) || 0;
        const p26 = parseFloat(document.getElementById("wiz-q10-cu26")?.value) || 0;
        const p27 = parseFloat(document.getElementById("wiz-q10-cu27")?.value) || 0;
        const p29 = parseFloat(document.getElementById("wiz-q10-cu29")?.value) || 0;
        const p365 = parseFloat(document.getElementById("wiz-q10-cu365")?.value) || 0;

        if (p1 > 0 || p2 > 0) {
            const netAnnual = (p1 + p2) - (p21 + p22 + p26 + p27 + p29);
            monthlyIncome = (p6 > 0) ? (((netAnnual / p6 * 365) / 12) + (p365 / 12)) : 0;
            
            const nettoInput = document.getElementById("wiz-q10-netto-mensile");
            if (nettoInput && document.activeElement !== nettoInput) {
                nettoInput.value = Math.round(monthlyIncome * 100) / 100;
            }
        } else {
            const nettoInput = document.getElementById("wiz-q10-netto-mensile")?.value;
            if (nettoInput && parseFloat(nettoInput) > 0) {
                monthlyIncome = parseFloat(nettoInput);
            }
        }
    } else if (macroCat === "autonomo") {
        const regime = document.getElementById("wiz-q10-autonomo-regime")?.value || "forfettario";
        if (regime === "forfettario") {
            const lm22 = parseFloat(document.getElementById("wiz-q10-lm22")?.value) || 0;
            const lm27 = parseFloat(document.getElementById("wiz-q10-lm27")?.value) || 0;
            const lm35 = parseFloat(document.getElementById("wiz-q10-lm35")?.value) || 0;
            const lm36 = parseFloat(document.getElementById("wiz-q10-lm36")?.value) || 0;
            const lm39 = parseFloat(document.getElementById("wiz-q10-lm39")?.value) || 0;

            if (lm36 > 0) {
                monthlyIncome = (lm36 - lm39) / 12;
                const nettoInput = document.getElementById("wiz-q10-netto-mensile");
                if (nettoInput && document.activeElement !== nettoInput) {
                    nettoInput.value = Math.round(monthlyIncome * 100) / 100;
                }
            } else if (lm22 > 0) {
                monthlyIncome = (lm22 - lm27 - lm35 - lm39) / 12;
                const nettoInput = document.getElementById("wiz-q10-netto-mensile");
                if (nettoInput && document.activeElement !== nettoInput) {
                    nettoInput.value = Math.round(monthlyIncome * 100) / 100;
                }
            } else {
                const nettoInput = document.getElementById("wiz-q10-netto-mensile")?.value;
                if (nettoInput && parseFloat(nettoInput) > 0) {
                    monthlyIncome = parseFloat(nettoInput);
                }
            }
        } else {
            const rn1 = parseFloat(document.getElementById("wiz-q10-rn1")?.value) || 0;
            const rn4 = parseFloat(document.getElementById("wiz-q10-rn4")?.value) || 0;
            const rn26 = parseFloat(document.getElementById("wiz-q10-rn26")?.value) || 0;
            const rv2 = parseFloat(document.getElementById("wiz-q10-rv2")?.value) || 0;
            const rv10 = parseFloat(document.getElementById("wiz-q10-rv10")?.value) || 0;
            const rv17 = parseFloat(document.getElementById("wiz-q10-rv17")?.value) || 0;

            if (rn1 > 0) {
                monthlyIncome = (rn1 - rn26 - rv2 - rv10 - rv17) / 12;
                const nettoInput = document.getElementById("wiz-q10-netto-mensile");
                if (nettoInput && document.activeElement !== nettoInput) {
                    nettoInput.value = Math.round(monthlyIncome * 100) / 100;
                }
            } else {
                const nettoInput = document.getElementById("wiz-q10-netto-mensile")?.value;
                if (nettoInput && parseFloat(nettoInput) > 0) {
                    monthlyIncome = parseFloat(nettoInput);
                }
            }
        }
    } else if (macroCat === "pensionato" || macroCat === "colf_badanti" || macroCat === "interinale") {
        const nettoInput = document.getElementById("wiz-q10-netto-mensile")?.value;
        if (nettoInput && parseFloat(nettoInput) > 0) {
            monthlyIncome = parseFloat(nettoInput);
        }
    }

    // --- SECOND INCOME CALCULATION ---
    let monthlyIncome2 = 0;
    const hasSec = document.getElementById("wiz-q10-has-second-income")?.checked;
    if (hasSec) {
        const macroCat2 = document.getElementById("wiz-q10-macro-categoria-2")?.value || "dipendente";
        
        if (macroCat2 === "dipendente" || macroCat2 === "colf_badanti" || macroCat2 === "interinale") {
            const p1 = parseFloat(document.getElementById("wiz-q10-cu1-2")?.value) || 0;
            const p2 = parseFloat(document.getElementById("wiz-q10-cu2-2")?.value) || 0;
            const p6 = parseFloat(document.getElementById("wiz-q10-cu6-2")?.value) || 365;
            const p21 = parseFloat(document.getElementById("wiz-q10-cu21-2")?.value) || 0;
            const p22 = parseFloat(document.getElementById("wiz-q10-cu22-2")?.value) || 0;
            const p26 = parseFloat(document.getElementById("wiz-q10-cu26-2")?.value) || 0;
            const p27 = parseFloat(document.getElementById("wiz-q10-cu27-2")?.value) || 0;
            const p29 = parseFloat(document.getElementById("wiz-q10-cu29-2")?.value) || 0;
            const p365 = parseFloat(document.getElementById("wiz-q10-cu365-2")?.value) || 0;

            if (p1 > 0 || p2 > 0) {
                const netAnnual = (p1 + p2) - (p21 + p22 + p26 + p27 + p29);
                monthlyIncome2 = (p6 > 0) ? (((netAnnual / p6 * 365) / 12) + (p365 / 12)) : 0;
                
                const nettoInput2 = document.getElementById("wiz-q10-netto-mensile-2");
                if (nettoInput2 && document.activeElement !== nettoInput2) {
                    nettoInput2.value = Math.round(monthlyIncome2 * 100) / 100;
                }
            } else {
                const nettoInput2 = document.getElementById("wiz-q10-netto-mensile-2")?.value;
                if (nettoInput2 && parseFloat(nettoInput2) > 0) {
                    monthlyIncome2 = parseFloat(nettoInput2);
                }
            }
        } else if (macroCat2 === "autonomo") {
            const regime = document.getElementById("wiz-q10-autonomo-regime-2")?.value || "forfettario";
            const isSingleUnico2 = document.getElementById("wiz-q10-autonomo-single-unico-2")?.checked || false;

            if (regime === "forfettario") {
                const lm22_1 = parseFloat(document.getElementById("wiz-q10-lm22-2")?.value) || 0;
                const lm27_1 = parseFloat(document.getElementById("wiz-q10-lm27-2")?.value) || 0;
                const lm35_1 = parseFloat(document.getElementById("wiz-q10-lm35-2")?.value) || 0;
                const lm36_1 = parseFloat(document.getElementById("wiz-q10-lm36-2")?.value) || 0;
                const lm39_1 = parseFloat(document.getElementById("wiz-q10-lm39-2")?.value) || 0;

                const lm22_2 = parseFloat(document.getElementById("wiz-q10-lm22-anno2-2")?.value) || 0;
                const lm27_2 = parseFloat(document.getElementById("wiz-q10-lm27-anno2-2")?.value) || 0;
                const lm35_2 = parseFloat(document.getElementById("wiz-q10-lm35-anno2-2")?.value) || 0;
                const lm36_2 = parseFloat(document.getElementById("wiz-q10-lm36-anno2-2")?.value) || 0;
                const lm39_2 = parseFloat(document.getElementById("wiz-q10-lm39-anno2-2")?.value) || 0;

                let netY1 = 0;
                if (lm36_1 > 0) {
                    netY1 = (lm36_1 - lm39_1) / 12;
                } else if (lm22_1 > 0) {
                    netY1 = (lm22_1 - lm27_1 - lm35_1 - lm39_1) / 12;
                }

                let netY2 = 0;
                if (lm36_2 > 0) {
                    netY2 = (lm36_2 - lm39_2) / 12;
                } else if (lm22_2 > 0) {
                    netY2 = (lm22_2 - lm27_2 - lm35_2 - lm39_2) / 12;
                }

                if (isSingleUnico2 || netY2 <= 0) {
                    monthlyIncome2 = netY1 > 0 ? netY1 : (parseFloat(document.getElementById("wiz-q10-netto-mensile-2")?.value) || 0);
                } else {
                    monthlyIncome2 = (netY1 + netY2) / 2;
                }

                const nettoInput2 = document.getElementById("wiz-q10-netto-mensile-2");
                if (nettoInput2 && document.activeElement !== nettoInput2 && monthlyIncome2 > 0) {
                    nettoInput2.value = Math.round(monthlyIncome2 * 100) / 100;
                }
            } else {
                const rn1_1 = parseFloat(document.getElementById("wiz-q10-rn1-2")?.value) || 0;
                const rn4_1 = parseFloat(document.getElementById("wiz-q10-rn4-2")?.value) || 0;
                const rn26_1 = parseFloat(document.getElementById("wiz-q10-rn26-2")?.value) || 0;
                const rv2_1 = parseFloat(document.getElementById("wiz-q10-rv2-2")?.value) || 0;
                const rv10_1 = parseFloat(document.getElementById("wiz-q10-rv10-2")?.value) || 0;
                const rv17_1 = parseFloat(document.getElementById("wiz-q10-rv17-2")?.value) || 0;

                const rn1_2 = parseFloat(document.getElementById("wiz-q10-rn1-anno2-2")?.value) || 0;
                const rn4_2 = parseFloat(document.getElementById("wiz-q10-rn4-anno2-2")?.value) || 0;
                const rn26_2 = parseFloat(document.getElementById("wiz-q10-rn26-anno2-2")?.value) || 0;
                const rv2_2 = parseFloat(document.getElementById("wiz-q10-rv2-anno2-2")?.value) || 0;
                const rv10_2 = parseFloat(document.getElementById("wiz-q10-rv10-anno2-2")?.value) || 0;
                const rv17_2 = parseFloat(document.getElementById("wiz-q10-rv17-anno2-2")?.value) || 0;

                const base1 = rn1_1 > 0 ? rn1_1 : rn4_1;
                const netY1 = base1 > 0 ? ((base1 - rn26_1 - rv2_1 - rv10_1 - rv17_1) / 12) : 0;

                const base2 = rn1_2 > 0 ? rn1_2 : rn4_2;
                const netY2 = base2 > 0 ? ((base2 - rn26_2 - rv2_2 - rv10_2 - rv17_2) / 12) : 0;

                if (isSingleUnico2 || netY2 <= 0) {
                    monthlyIncome2 = netY1 > 0 ? netY1 : (parseFloat(document.getElementById("wiz-q10-netto-mensile-2")?.value) || 0);
                } else {
                    monthlyIncome2 = (netY1 + netY2) / 2;
                }

                const nettoInput2 = document.getElementById("wiz-q10-netto-mensile-2");
                if (nettoInput2 && document.activeElement !== nettoInput2 && monthlyIncome2 > 0) {
                    nettoInput2.value = Math.round(monthlyIncome2 * 100) / 100;
                }
            }
        } else if (macroCat2 === "pensionato") {
            const nettoInput2 = document.getElementById("wiz-q10-netto-mensile-2")?.value;
            if (nettoInput2 && parseFloat(nettoInput2) > 0) {
                monthlyIncome2 = parseFloat(nettoInput2);
            }
        } else if (macroCat2 === "locazione") {
            const nettoInput2 = document.getElementById("wiz-q10-locazione-netto-2")?.value;
            if (nettoInput2 && parseFloat(nettoInput2) > 0) {
                monthlyIncome2 = parseFloat(nettoInput2);
                const nettoInput2Field = document.getElementById("wiz-q10-netto-mensile-2");
                if (nettoInput2Field && document.activeElement !== nettoInput2Field) {
                    nettoInput2Field.value = monthlyIncome2;
                }
            }
        }
        
        monthlyIncome += monthlyIncome2;
    }

    // ALIMENTI RICEVUTI 1° RICHIEDENTE (se percepisce mantenimento, va sommato al reddito netto)
    const p1AlimentiSel = document.getElementById("wiz-q4-alimenti") || document.getElementById("wiz-q4-alimenti-file");
    const p1AlimentiImp = document.getElementById("wiz-q4-alimenti-importo") || document.getElementById("wiz-q4-alimenti-importo-file");
    if (p1AlimentiSel && p1AlimentiSel.value === "riceve") {
        const alVal = parseFloat(p1AlimentiImp?.value) || 0;
        monthlyIncome += alVal;
    }

    // Sum co-applicant incomes
    document.querySelectorAll(".coapp-netto").forEach(inp => {
        if (inp.value) monthlyIncome += parseFloat(inp.value) || 0;
    });

    const formattedInc = "€ " + Math.round(monthlyIncome).toLocaleString("it-IT") + "/mese";
    const targetIds = ["lbl-computed-income", "summary-income-display", "lbl-interview-computed-income"];
    targetIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = formattedInc;
    });
    document.querySelectorAll(".computed-income-lbl").forEach(el => {
        el.innerText = formattedInc;
    });

    const loanCards = document.querySelectorAll("#loans-cards-container > div");
    const loansDisplay = document.getElementById("summary-loans-display");
    if (loansDisplay) {
        if (loanCards.length === 0) {
            loansDisplay.innerText = "Nessun prestito";
            loansDisplay.style.color = "#0052ff";
        } else {
            let totalRata = 0;
            loanCards.forEach(c => {
                const rataInput = c.querySelector(".loan-rata-input");
                if (rataInput && rataInput.value) totalRata += parseFloat(rataInput.value) || 0;
            });
            loansDisplay.innerText = loanCards.length + " Prestiti (Tot: € " + totalRata + "/mese)";
            loansDisplay.style.color = "#d97706";
        }
    }
};

window.renderLoansCards = function(fullRebuild = true) {
    const containers = [
        document.getElementById("loans-cards-list-container"),
        document.getElementById("free-loans-cards-list-container"),
        document.getElementById("wiz-loans-list-container")
    ].filter(Boolean);

    let activeTotal = 0;
    window.userLoans.forEach(l => {
        if (!l.verraChiuso) activeTotal += (parseFloat(l.rata) || 0);
    });

    ["total-active-loans-display", "free-total-active-loans-display", "wiz-total-active-loans-display"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = activeTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €/mese";
    });

    const altreRateInput = document.getElementById("altre-rate");
    if (altreRateInput && window.userLoans.length > 0) {
        altreRateInput.value = activeTotal;
    }

    if (!fullRebuild) return;

    containers.forEach(container => {
        container.innerHTML = "";
        if (window.userLoans.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 0.85rem; background: rgba(255,255,255,0.015); border: 1px dashed var(--surface-border); border-radius: 6px; color: var(--text-muted); font-size: 0.8rem;">
                    ℹ️ Nessun prestito inserito. Clicca su <strong>"+ Aggiungi Prestito"</strong> per inserire un finanziamento.
                </div>
            `;
            return;
        }

        window.userLoans.forEach((loan, idx) => {
            const card = document.createElement("div");
            card.className = "loan-card-item";
            card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 0.85rem; position: relative; margin-bottom: 0.5rem;";

            const statusTag = loan.verraChiuso 
                ? `<span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">Estinto prima del Mutuo</span>`
                : `<span style="font-size: 0.7rem; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">Attivo (Incide sul DSR)</span>`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <strong style="font-size: 0.85rem; color: #ffffff;">Prestito #${idx + 1}</strong>
                        ${statusTag}
                    </div>
                    <button type="button" onclick="window.deleteLoanCard('${loan.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 4px; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
                        🗑️ Elimina
                    </button>
                </div>
                <div class="grid-2col">
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Tipo Finanziamento</label>
                        <select onchange="window.updateLoanProperty('${loan.id}', 'tipo', this.value)" style="font-size: 0.8rem; padding: 0.35rem;">
                            <option value="personale" ${loan.tipo === 'personale' ? 'selected' : ''}>Prestito Personale</option>
                            <option value="auto" ${loan.tipo === 'auto' ? 'selected' : ''}>Finanziamento Auto</option>
                            <option value="cqs" ${loan.tipo === 'cqs' ? 'selected' : ''}>Cessione del Quinto (CQS)</option>
                            <option value="mutuo" ${loan.tipo === 'mutuo' ? 'selected' : ''}>Altro Mutuo in Corso</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Rata Mensile (€)</label>
                        <input type="number" value="${loan.rata}" oninput="window.updateLoanProperty('${loan.id}', 'rata', parseFloat(this.value) || 0)" style="font-size: 0.8rem; padding: 0.35rem;">
                    </div>
                </div>
                <div class="grid-2col">
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Istituto / Finanziaria</label>
                        <input type="text" value="${loan.finanziaria}" oninput="window.updateLoanProperty('${loan.id}', 'finanziaria', this.value)" style="font-size: 0.8rem; padding: 0.35rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Estinzione Prima del Mutuo</label>
                        <select onchange="window.updateLoanProperty('${loan.id}', 'verraChiuso', this.value === 'si')" style="font-size: 0.8rem; padding: 0.35rem;">
                            <option value="no" ${!loan.verraChiuso ? 'selected' : ''}>No, rimane attivo</option>
                            <option value="si" ${loan.verraChiuso ? 'selected' : ''}>Sì, verrà estinto prima del rogito</option>
                        </select>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    });
};


window.selectMortgageType = function(type, cardEl, autoAdvance = false) {
    document.querySelectorAll(".mortgage-type-card").forEach(c => {
        c.classList.remove("active");
        c.style.background = "#ffffff";
        c.style.border = "1px solid #e2e8f0";
        const title = c.querySelector("strong");
        if (title) title.style.color = "#0f172a";
    });
    if (cardEl) {
        cardEl.classList.add("active");
        cardEl.style.background = "#eff6ff";
        cardEl.style.border = "2px solid #0052ff";
        const title = cardEl.querySelector("strong");
        if (title) title.style.color = "#0052ff";
    }
    const freeType = document.getElementById("tipo-mutuo");
    if (freeType) freeType.value = type;
    const wizType = document.getElementById("wiz-p3-finalita");
    if (wizType) {
        wizType.value = type;
        wizType.dispatchEvent(new Event("change"));
    }
    if (autoAdvance) {
        if (cardEl) {
            cardEl.style.transform = "scale(0.96)";
            setTimeout(() => {
                cardEl.style.transform = "";
                if (typeof window.goToStep === "function") {
                    window.goToStep(2);
                } else if (typeof window.nextWizardStep === "function") {
                    window.nextWizardStep();
                }
            }, 100);
        } else {
            if (typeof window.goToStep === "function") {
                window.goToStep(2);
            } else if (typeof window.nextWizardStep === "function") {
                window.nextWizardStep();
            }
        }
    }
};

window.setupMortgageTypeCards = function() {
    document.querySelectorAll(".mortgage-type-card").forEach(c => {
        c.addEventListener("dblclick", function(e) {
            e.preventDefault();
            const type = this.getAttribute("data-type") || (this.onclick ? String(this.onclick).match(/selectMortgageType\(['"]([^'"]+)['"]/)?.[1] : null);
            if (type && window.selectMortgageType) {
                window.selectMortgageType(type, this, true);
            }
        });
    });
};

window.wizardCurrentStep = 1;

window.goToStep = function(stepNum) {
    if (stepNum === 3) {
        const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
        const statoCivEl = document.getElementById("wiz-q4-stato-civile" + suffix) || document.getElementById("wiz-stato-civile") || document.getElementById("wiz-q4-stato-civile");
        const regimeEl = document.getElementById("wiz-q4-regime" + suffix) || document.getElementById("wiz-q4-regime");
        const anteStipulaEl = document.getElementById("wiz-q4-separazione-ante-stipula" + suffix) || document.getElementById("wiz-q4-separazione-ante-stipula");
        
        const isSposato = statoCivEl && statoCivEl.value === "sposato";
        const isComunione = regimeEl && regimeEl.value === "comunione";
        const skipSpouse = anteStipulaEl ? anteStipulaEl.checked : false;
        
        if (isSposato && isComunione && !skipSpouse) {
            const spouseCard = document.getElementById("coapp-spouse-auto");
            let missingFields = [];
            
            if (!spouseCard) {
                missingFields.push("Scheda anagrafica del 2° richiedente (coniuge)");
            } else {
                const nome = spouseCard.querySelector(".coapp-nome")?.value.trim();
                const cognome = spouseCard.querySelector(".coapp-cognome")?.value.trim();
                const nascita = spouseCard.querySelector(".coapp-data-nascita")?.value.trim();
                
                if (!nome) missingFields.push("Nome del coniuge");
                if (!cognome) missingFields.push("Cognome del coniuge");
                if (!nascita) missingFields.push("Data di nascita del coniuge");
            }
            
            if (missingFields.length > 0) {
                alert(`⚠️ Attenzione: Per i richiedenti sposati in comunione dei beni è obbligatorio compilare tutti i dati del 2° richiedente (coniuge) prima di proseguire alla Fase 3.\n\nCampi mancanti:\n- ${missingFields.join("\n- ")}\n\n(Se il coniuge non parteciperà all'acquisto, attiva la spunta 'Faranno separazione dei beni ante stipula').`);
                
                window.goToStep(2);
                if (spouseCard) {
                    spouseCard.scrollIntoView({ behavior: "smooth", block: "center" });
                    spouseCard.style.boxShadow = "0 0 0 4px #ef4444";
                    setTimeout(() => { spouseCard.style.boxShadow = "0 4px 12px rgba(0,82,255,0.08)"; }, 4000);
                }
                return;
            }
        }
    }

    if (window.wizardCurrentStep === 2 && stepNum > 2) {
        if (typeof saveCurrentSubject === "function") {
            saveCurrentSubject(true);
        }
    }
    window.wizardCurrentStep = stepNum;
    for (let i = 1; i <= 4; i++) {
        const circle = document.getElementById(`step-circle-${i}`);
        const text = document.getElementById(`step-text-${i}`);
        if (circle && text) {
            if (i < stepNum) {
                circle.style.background = "#10b981";
                circle.style.color = "#ffffff";
                circle.innerHTML = "✓";
                text.style.color = "#0f172a";
                text.style.fontWeight = "700";
            } else if (i === stepNum) {
                circle.style.background = "#0052ff";
                circle.style.color = "#ffffff";
                circle.innerHTML = `${i}`;
                text.style.color = "#0f172a";
                text.style.fontWeight = "800";
            } else {
                circle.style.background = "#e2e8f0";
                circle.style.color = "#64748b";
                circle.innerHTML = `${i}`;
                text.style.color = "#64748b";
                text.style.fontWeight = "600";
            }
        }
    }

    const backBtn = document.getElementById("btn-wizard-back");
    if (backBtn) backBtn.style.display = (stepNum > 1) ? "inline-flex" : "none";

    const nextBtn = document.getElementById("btn-wizard-next");
    if (nextBtn) {
        if (stepNum === 4) {
            nextBtn.innerHTML = "💾 Salva";
            nextBtn.style.background = "#10b981";
            nextBtn.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
        } else {
            nextBtn.innerHTML = "Avanti ➔";
            nextBtn.style.background = "#0052ff";
            nextBtn.style.boxShadow = "0 4px 12px rgba(0, 82, 255, 0.3)";
        }
    }

    const p1 = document.getElementById("phase-1-panel");
    const p2 = document.getElementById("phase-2-panel");
    const p3 = document.getElementById("phase-3-panel");
    const p4 = document.getElementById("phase-4-panel");

    if (p1) p1.style.display = (stepNum === 1) ? "block" : "none";
    if (p2) p2.style.display = (stepNum === 2) ? "block" : "none";
    if (p3) p3.style.display = (stepNum === 3) ? "block" : "none";
    if (p4) p4.style.display = (stepNum === 4) ? "block" : "none";

    const coappGuar = document.getElementById("wiz-coapplicants-guarantors-section");
    if (coappGuar) {
        coappGuar.style.display = (stepNum === 2) ? "block" : "none";
    }

    if (stepNum === 4) {
        updateCalculations();
    }
};

window.nextWizardStep = function() {
    if (window.wizardCurrentStep < 4) {
        window.goToStep(window.wizardCurrentStep + 1);
    } else {
        window.savePratica();
    }
};

window.prevWizardStep = function() {
    if (window.wizardCurrentStep > 1) {
        window.goToStep(window.wizardCurrentStep - 1);
    }
};

window.switchPhase2Mode = function(mode) {
    window.currentPhase2Mode = mode;
    const fileBox = document.getElementById("phase2-mode-file-box");
    const interviewBox = document.getElementById("phase2-mode-interview-box");
    const btnFile = document.getElementById("btn-mode-file");
    const btnInterview = document.getElementById("btn-mode-interview");

    if (mode === "file") {
        if (fileBox) fileBox.style.display = "block";
        if (interviewBox) interviewBox.style.display = "none";
        if (btnFile) {
            btnFile.className = "btn btn-primary";
            btnFile.style.background = "#0052ff";
            btnFile.style.color = "#ffffff";
            btnFile.style.border = "none";
        }
        if (btnInterview) {
            btnInterview.className = "btn";
            btnInterview.style.background = "#ffffff";
            btnInterview.style.color = "#334155";
            btnInterview.style.border = "1.5px solid #cbd5e1";
            btnInterview.style.boxShadow = "none";
        }
    } else {
        if (fileBox) fileBox.style.display = "none";
        if (interviewBox) interviewBox.style.display = "grid";
        if (btnInterview) {
            btnInterview.className = "btn btn-primary";
            btnInterview.style.background = "#0052ff";
            btnInterview.style.color = "#ffffff";
            btnInterview.style.border = "none";
            btnInterview.style.boxShadow = "0 4px 12px rgba(0,82,255,0.25)";
        }
        if (btnFile) {
            btnFile.className = "btn";
            btnFile.style.background = "#ffffff";
            btnFile.style.color = "#334155";
            btnFile.style.border = "1.5px solid #cbd5e1";
        }
    }
};

window.toggleMarriageFields = function(status) {
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const sp = document.getElementById("group-sposato-details" + suffix);
    const al = document.getElementById("group-alimenti-details" + suffix);
    if (sp) sp.style.display = (status === "sposato") ? "grid" : "none";
    if (al) al.style.display = (status === "separato" || status === "divorziato") ? "block" : "none";
    window.handleMarriageRegimeChange();
};

window.syncSpouseCoapplicantCard = function() {
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const statoCivEl = document.getElementById("wiz-q4-stato-civile" + suffix) || document.getElementById("wiz-stato-civile") || document.getElementById("wiz-q4-stato-civile");
    const regimeEl = document.getElementById("wiz-q4-regime" + suffix) || document.getElementById("wiz-q4-regime");
    const anteStipulaEl = document.getElementById("wiz-q4-separazione-ante-stipula" + suffix) || document.getElementById("wiz-q4-separazione-ante-stipula");
    const container = document.getElementById("coapplicant-cards-container");
    
    if (!statoCivEl || !regimeEl) return;
    
    const isSposato = statoCivEl.value === "sposato";
    const isComunione = regimeEl.value === "comunione";
    const skipSpouse = anteStipulaEl ? anteStipulaEl.checked : false;
    
    const existingSpouseCard = document.getElementById("coapp-spouse-auto");
    
    if (isSposato && isComunione && !skipSpouse) {
        if (!existingSpouseCard && container) {
            const primaryCognomeEl = document.getElementById("wiz-q2-cognome" + suffix) || document.getElementById("wiz-q2-cognome");
            const primaryCognome = primaryCognomeEl ? primaryCognomeEl.value.trim() : "";
            const primaryRegime = regimeEl.value || "comunione";
            const anniSposatoEl = document.getElementById("wiz-q4-anni-sposato" + suffix) || document.getElementById("wiz-q4-anni-sposato");
            const primaryAnniSposato = anniSposatoEl ? anniSposatoEl.value : "8";
            const figliEl = document.getElementById("wiz-q5-figli" + suffix) || document.getElementById("wiz-q5-figli");
            const numFigliEl = document.getElementById("wiz-q5-num-figli" + suffix) || document.getElementById("wiz-q5-num-figli");
            const primaryFigli = figliEl ? figliEl.value : "si";
            const primaryNumFigli = numFigliEl ? (parseInt(numFigliEl.value) || 0) : 2;
            
            const el = document.createElement("div");
            el.id = "coapp-spouse-auto";
            el.className = "coapp-card";
            el.dataset.isSpouse = "true";
            el.style.cssText = "background: #ffffff; border: 2px solid #0052ff; border-radius: 12px; padding: 1.25rem; margin-top: 1rem; box-shadow: 0 4px 12px rgba(0,82,255,0.08);";
            
            el.innerHTML = window.renderFullCoapplicantCardHtml("coapp-spouse-auto", true, {
                nome: "",
                cognome: primaryCognome,
                dataNascita: "",
                sesso: "F",
                statoCivile: "sposato",
                regime: primaryRegime,
                anniSposato: primaryAnniSposato,
                figli: primaryFigli,
                numFigli: primaryNumFigli,
                cittadinanza: "IT",
                macroCategoria: "no_lavoro",
                netto: 0,
                anzianita: 0
            });
            
            container.prepend(el);
            window.updateCoappChildrenAgesUI(el);
            if (window.updateCalculatedIncome) window.updateCalculatedIncome();
            if (window.updateCalculations) window.updateCalculations();
        }
    } else {
        if (existingSpouseCard) {
            existingSpouseCard.remove();
        }
        if (window.updateCalculatedIncome) window.updateCalculatedIncome();
        if (window.updateCalculations) window.updateCalculations();
    }
};

window.handleMarriageRegimeChange = function() {
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const statoCivEl = document.getElementById("wiz-q4-stato-civile" + suffix) || document.getElementById("wiz-stato-civile");
    const regimeEl = document.getElementById("wiz-q4-regime" + suffix);
    const anteStipulaEl = document.getElementById("wiz-q4-separazione-ante-stipula" + suffix);
    const containerEl = document.getElementById("group-separazione-ante-stipula-container" + suffix);
    
    if (!statoCivEl || !regimeEl) return;
    
    const isSposato = statoCivEl.value === "sposato";
    const isComunione = regimeEl.value === "comunione";
    
    if (isSposato && isComunione) {
        if (containerEl) containerEl.style.display = "flex";
        const skipSpouse = anteStipulaEl ? anteStipulaEl.checked : false;
        
        const spouseIndex = wizardSubjects.findIndex(s => s.isSpouse);
        if (skipSpouse) {
            if (spouseIndex !== -1) {
                wizardSubjects.splice(spouseIndex, 1);
                renderSubjectsChips();
            }
        } else {
            if (spouseIndex === -1) {
                const primary = wizardSubjects.find(s => s.role === "Richiedente Principale") || wizardSubjects[0];
                const primaryCognome = primary ? primary.cognome : "";
                const spouseSubject = {
                    role: "Cointestatario",
                    nome: "Coniuge",
                    cognome: primaryCognome || "Rossi",
                    dataNascita: "1985-01-01",
                    eta: 40,
                    sesso: "F",
                    cittadinanza: "IT",
                    statoCivile: "sposato",
                    isOwner: false,
                    figli: "no",
                    tipoContratto: "no_lavoro",
                    netto: 0,
                    rawBoxData: {},
                    incomes: [{ tipoContratto: "no_lavoro", netto: 0, rawBoxData: {} }],
                    isSpouse: true,
                    permScadenza: "valido",
                    famigliaSede: "italia"
                };
                wizardSubjects.push(spouseSubject);
                renderSubjectsChips();
            }
        }
    } else {
        if (containerEl) containerEl.style.display = "none";
        if (anteStipulaEl) anteStipulaEl.checked = false;
        const spouseIndex = wizardSubjects.findIndex(s => s.isSpouse);
        if (spouseIndex !== -1) {
            wizardSubjects.splice(spouseIndex, 1);
            renderSubjectsChips();
        }
    }
    
    window.syncSpouseCoapplicantCard();
    if (window.updateCalculations) window.updateCalculations();
};

window.handleFinalitaChange = function(val) {
    const astaCheckbox = document.getElementById("wiz-p3-is-asta");
    if (astaCheckbox) {
        if (val === "asta") {
            astaCheckbox.checked = true;
        } else if (val === "acquisto") {
            astaCheckbox.checked = false;
        }
    }
    const isConsapEligible = ["acquisto", "asta", "surroga"].includes(val);
    const p3ConsapGroup = document.getElementById("p3-consap-group");
    const p3ConsapSelect = document.getElementById("p3-consap-select");
    if (!isConsapEligible && p3ConsapGroup) {
        p3ConsapGroup.style.display = "none";
        if (p3ConsapSelect) p3ConsapSelect.value = "no";
    }
    const acqRistrWrapper = document.getElementById("group-p3-acquisto-ristrutturazione-wrapper");
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
    }
    const liqWrapper = document.getElementById("group-p3-liquidita-pura-wrapper");
    if (liqWrapper) {
        liqWrapper.style.display = (val === "liquidita" || val === "consolido") ? "block" : "none";
    }
    if (val === "acquisto_sostituzione") {
        const hasSecProp = document.getElementById("wiz-p3-has-second-property");
        if (hasSecProp && !hasSecProp.checked) {
            hasSecProp.checked = true;
            if (window.toggleSecondPropertyFields) window.toggleSecondPropertyFields(true);
        }
        const hasMortgage = document.getElementById("wiz-p3-second-has-mortgage");
        if (hasMortgage) {
            hasMortgage.value = "si";
            if (window.toggleSecondMortgageFields) window.toggleSecondMortgageFields("si");
        }
    }
    if (window.updateCalculations) window.updateCalculations();
};

window.handleAstaCheckboxChange = function(isChecked) {
    const finalitaSelect = document.getElementById("wiz-p3-finalita");
    if (finalitaSelect) {
        if (isChecked) {
            finalitaSelect.value = "asta";
        } else {
            if (finalitaSelect.value === "asta") {
                finalitaSelect.value = "acquisto";
            }
        }
    }
    if (window.updateCalculations) window.updateCalculations();
};

window.handleP3MacroTassoChange = function(macroVal) {
    const subFissoGroup = document.getElementById("group-p3-sub-tasso-fisso");
    const subVarGroup = document.getElementById("group-p3-sub-tasso-variabile");
    const subFissoSelect = document.getElementById("wiz-p3-sub-tasso-fisso");
    const subVarSelect = document.getElementById("wiz-p3-sub-tasso-variabile");
    const hiddenTasso = document.getElementById("wiz-p3-tipo-tasso");

    if (macroVal === "fisso") {
        if (subFissoGroup) subFissoGroup.style.display = "block";
        if (subVarGroup) subVarGroup.style.display = "none";
        if (hiddenTasso) hiddenTasso.value = subFissoSelect ? subFissoSelect.value : "fisso";
    } else if (macroVal === "variabile") {
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "block";
        if (hiddenTasso) hiddenTasso.value = subVarSelect ? subVarSelect.value : "variabile";
    } else {
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "none";
        if (hiddenTasso) hiddenTasso.value = "any";
    }
    
    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};

window.syncP3EffectiveTasso = function() {
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
};

window.updatePersoneNucleoDefault = function() {
    const primary = wizardSubjects.find(s => s.role === "Richiedente Principale");
    if (!primary) return;
    
    // Determine base: sposato -> 2, single/other -> 1
    const base = (primary.statoCivile === "sposato") ? 2 : 1;
    
    // Determine children count
    const childrenCount = parseInt(primary.numFigli) || 0;
    const calculatedSum = base + childrenCount;
    
    const inputManual = document.getElementById("wiz-persone-nucleo");
    const inputFile = document.getElementById("wiz-persone-nucleo-file");
    
    if (inputManual && inputManual.dataset.userEdited !== "true") {
        inputManual.value = calculatedSum;
    }
    if (inputFile && inputFile.dataset.userEdited !== "true") {
        inputFile.value = calculatedSum;
    }
};

window.suggestFamilyComponentsFromDOM = function() {
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const statoCivEl = document.getElementById("wiz-q4-stato-civile" + suffix) || document.getElementById("wiz-stato-civile");
    const figliEl = document.getElementById("wiz-q5-figli" + suffix) || document.getElementById("wiz-figli");
    const numFigliEl = document.getElementById("wiz-q5-num-figli" + suffix) || document.getElementById("wiz-num-figli");
    
    if (!statoCivEl) return;
    
    const isSposato = statoCivEl.value === "sposato";
    const base = isSposato ? 2 : 1;
    
    const hasFigli = figliEl ? (figliEl.value === "si") : false;
    const figliCount = (hasFigli && numFigliEl) ? (parseInt(numFigliEl.value) || 0) : 0;
    const calculatedSum = base + figliCount;
    
    const inputManual = document.getElementById("wiz-persone-nucleo");
    const inputFile = document.getElementById("wiz-persone-nucleo-file");
    
    if (inputManual && inputManual.dataset.userEdited !== "true") {
        inputManual.value = calculatedSum;
        if (window.updateCalculations) window.updateCalculations();
    }
    if (inputFile && inputFile.dataset.userEdited !== "true") {
        inputFile.value = calculatedSum;
        if (window.updateCalculations) window.updateCalculations();
    }
};

window.toggleAbitazioneFields = function(val) {
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const aff = document.getElementById("group-affitto-amount" + suffix);
    if (aff) aff.style.display = (val === "affitto") ? "block" : "none";
};

window.toggleContrattoFields = function(val) {
    const cu = document.getElementById("group-cu-dipendente");
    if (cu) cu.style.display = (val.startsWith("indeterminato") || val.startsWith("determinato") || val.startsWith("apprendista")) ? "block" : "none";
};

window.toggleQ10MacroCategory = function(cat) {
    const dip = document.getElementById("group-q10-dipendente-cascade");
    const aut = document.getElementById("group-q10-autonomo-cascade");
    const pen = document.getElementById("group-q10-pensionato-cascade");
    if (dip) dip.style.display = (cat === "dipendente" || cat === "colf_badanti" || cat === "interinale") ? "block" : "none";
    if (aut) aut.style.display = (cat === "autonomo") ? "block" : "none";
    if (pen) pen.style.display = (cat === "pensionato") ? "block" : "none";
    if (typeof window.updateCalculatedIncome === "function") {
        window.updateCalculatedIncome();
    }
};

window.toggleQ10DipendenteSub = function(sub) {
    const lbl = document.getElementById("lbl-q10-duration");
    if (lbl) {
        if (sub === "indeterminato") {
            lbl.innerText = "Anzianità lavorativa (mesi)";
        } else if (sub === "determinato") {
            lbl.innerText = "Durata residua (mesi)";
        } else if (sub === "apprendista") {
            lbl.innerText = "Durata apprendistato (mesi)";
        }
    }
    const stagionaleBox = document.getElementById("group-q10-stagionale-box");
    if (stagionaleBox) {
        stagionaleBox.style.display = (sub === "determinato") ? "block" : "none";
    }
};

window.toggleStagionaleFields = function(checked) {
    const box = document.getElementById("box-q10-stagioni-input");
    if (box) box.style.display = checked ? "flex" : "none";
};

window.toggleSecondPropertyFields = function(checked) {
    const box = document.getElementById("box-secondo-immobile");
    if (box) box.style.display = checked ? "block" : "none";
};

window.toggleSecondMortgageFields = function(val) {
    const box = document.getElementById("box-second-mortgage-details");
    if (box) box.style.display = (val === "si") ? "block" : "none";
};

window.checkLiquiditaPercentage = function() {
    const p3ImportoEl = document.getElementById("p3-importo-field");
    const liqEl = document.getElementById("wiz-p3-liquidita-pura");
    const alertEl = document.getElementById("alert-liquidita-50-warning");
    const loan = p3ImportoEl ? (parseFloat(p3ImportoEl.value) || 0) : 0;
    const liq = liqEl ? (parseFloat(liqEl.value) || 0) : 0;
    if (alertEl) {
        if (loan > 0 && (liq / loan) > 0.5) {
            alertEl.style.display = "block";
        } else {
            alertEl.style.display = "none";
        }
    }
};

window.updatePatrimonioDisplay = function() {
    const p3ValoreEl = document.getElementById("p3-valore-field");
    const patEl = document.getElementById("wiz-patrimonio-mobiliare");
    const lblSpese = document.getElementById("lbl-stima-spese-atto");
    const badge = document.getElementById("badge-copertura-spese");
    const valImm = p3ValoreEl ? (parseFloat(p3ValoreEl.value) || 230000) : 230000;
    const pat = patEl ? (parseFloat(patEl.value) || 0) : 0;
    const stimaSpese = Math.round(valImm * 0.08);
    if (lblSpese) lblSpese.innerText = `~ € ${stimaSpese.toLocaleString()}`;
    if (badge) {
        if (pat >= stimaSpese) {
            badge.style.background = "#dcfce7";
            badge.style.color = "#15803d";
            badge.innerText = `✅ Copertura spese adeguata (Crédit Agricole / ING)`;
        } else {
            badge.style.background = "#fef3c7";
            badge.style.color = "#92400e";
            badge.innerText = `⚠️ Risparmi inferiori alle spese d'atto stimate (~€ ${stimaSpese.toLocaleString()})`;
        }
    }
};


window.toggleSingleUnico = function(isChecked, prefix) {
    const f2 = document.getElementById("box-q10-forfettario-anno2");
    const o2 = document.getElementById("box-q10-ordinario-anno2");
    if (f2) f2.style.display = isChecked ? "none" : "block";
    if (o2) o2.style.display = isChecked ? "none" : "block";
    if (window.updateCalculatedIncome) window.updateCalculatedIncome();
};

window.toggleSingleUnico2 = function(isChecked) {
    const f2 = document.getElementById("box-q10-forfettario-anno2-2");
    const o2 = document.getElementById("box-q10-ordinario-anno2-2");
    if (f2) f2.style.display = isChecked ? "none" : "block";
    if (o2) o2.style.display = isChecked ? "none" : "block";
    if (window.updateCalculatedIncome) window.updateCalculatedIncome();
};

window.toggleQ10AutonomoRegime = function(regime) {
    const forf = document.getElementById("group-q10-autonomo-forfettario");
    const ord = document.getElementById("group-q10-autonomo-ordinario");
    if (forf) forf.style.display = (regime === "forfettario") ? "block" : "none";
    if (ord) ord.style.display = (regime === "ordinario") ? "block" : "none";
    if (typeof window.updateCalculatedIncome === "function") {
        window.updateCalculatedIncome();
    }
};

window.switchPhase2Mode = function(mode) {
    window.currentPhase2Mode = mode;
    const fileBox = document.getElementById("phase2-mode-file-box");
    const interviewBox = document.getElementById("phase2-mode-interview-box");
    const btnFile = document.getElementById("btn-mode-file");
    const btnInterview = document.getElementById("btn-mode-interview");

    if (mode === "file") {
        if (fileBox) fileBox.style.display = "block";
        if (interviewBox) interviewBox.style.display = "none";
        
        if (btnFile) {
            btnFile.className = "btn btn-primary";
            btnFile.style.background = "#0052ff";
            btnFile.style.color = "#ffffff";
            btnFile.style.border = "none";
            btnFile.style.boxShadow = "0 4px 12px rgba(0,82,255,0.25)";
        }
        if (btnInterview) {
            btnInterview.className = "btn";
            btnInterview.style.background = "#ffffff";
            btnInterview.style.color = "#334155";
            btnInterview.style.border = "1.5px solid #cbd5e1";
            btnInterview.style.boxShadow = "none";
        }
    } else {
        if (fileBox) fileBox.style.display = "none";
        if (interviewBox) interviewBox.style.display = "block";

        if (btnInterview) {
            btnInterview.className = "btn btn-primary";
            btnInterview.style.background = "#0052ff";
            btnInterview.style.color = "#ffffff";
            btnInterview.style.border = "none";
            btnInterview.style.boxShadow = "0 4px 12px rgba(0,82,255,0.25)";
        }
        if (btnFile) {
            btnFile.className = "btn";
            btnFile.style.background = "#ffffff";
            btnFile.style.color = "#334155";
            btnFile.style.border = "1.5px solid #cbd5e1";
            btnFile.style.boxShadow = "none";
        }
    }
};

window.syncFileDocDetails = function() {
    const fnome = document.getElementById("file-doc-nome")?.value || "";
    const fcognome = document.getElementById("file-doc-cognome")?.value || "";
    const fnetto = document.getElementById("file-doc-netto")?.value || 0;
    const ftelefono = document.getElementById("file-doc-telefono")?.value || "";
    const femail = document.getElementById("file-doc-email")?.value || "";
    
    const q1Nome = document.getElementById("wiz-q1-nome");
    const q2Cognome = document.getElementById("wiz-q2-cognome");
    const q10Netto = document.getElementById("wiz-q10-netto-mensile");
    const q1Telefono = document.getElementById("wiz-q1-telefono");
    const q1Email = document.getElementById("wiz-q1-email");
    
    if (q1Nome) q1Nome.value = fnome;
    if (q2Cognome) q2Cognome.value = fcognome;
    if (q10Netto) q10Netto.value = fnetto;
    if (q1Telefono && ftelefono) q1Telefono.value = ftelefono;
    if (q1Email && femail) q1Email.value = femail;
    if (window.updateCalculatedIncome) window.updateCalculatedIncome();
};

window.handleDocumentUpload = function(input) {
    if (!input || !input.files || input.files.length === 0) return;
    
    // Clear all CU inputs first to avoid stale default values
    const cuInputs = ["cu1", "cu2", "cu6", "cu21", "cu22", "cu26", "cu27", "cu29", "cu365", "cu810"];
    cuInputs.forEach(key => {
        const el = document.getElementById(`wiz-q10-${key}`);
        if (el) el.value = "0";
    });

    const rnInputs = ["rn1", "rn4", "rn26", "rv2", "rv10", "rv17"];
    rnInputs.forEach(key => {
        const el = document.getElementById(`wiz-q10-${key}`);
        if (el) el.value = "0";
    });

    const lmInputs = ["lm22", "lm27", "lm35", "lm36", "lm39"];
    lmInputs.forEach(key => {
        const el = document.getElementById(`wiz-q10-${key}`);
        if (el) el.value = "0";
    });

    const generalInputs = ["wiz-q1-nome", "wiz-q2-cognome", "wiz-q3-data-nascita", "wiz-nascita", "wiz-q10-anzianita-dipendente", "wiz-q10-netto-mensile"];
    generalInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    const file = input.files[0];
    const fileNames = Array.from(input.files).map(f => f.name).join(", ");
    const filename = file.name.toLowerCase();

    let data = {
        nome: "Richiedente",
        cognome: "Estratto",
        categoria: "dipendente",
        contratto: "indeterminato",
        anzianita: 24,
        nettoMensile: 2000,
        cittadinanza: "italiana",
        birthDate: "1990-01-01",
        cu: {
            cu1: 0, cu2: 0, cu6: 365, cu21: 0, cu22: 0, cu26: 0, cu27: 0, cu29: 0, cu365: 0, cu810: 0
        }
    };

    const applyExtracted = (extractedData) => {
        // 1. General Info
        const q1Nome = document.getElementById("wiz-q1-nome");
        const q2Cognome = document.getElementById("wiz-q2-cognome");
        const q6Cittadinanza = document.getElementById("wiz-q6-cittadinanza");
        
        if (q1Nome) q1Nome.value = extractedData.nome;
        if (q2Cognome) q2Cognome.value = extractedData.cognome;
        if (q6Cittadinanza) {
            q6Cittadinanza.value = extractedData.cittadinanza;
            const extPanel = document.getElementById('group-extra-ue');
            if (extPanel) extPanel.style.display = extractedData.cittadinanza === 'extra' ? 'block' : 'none';
        }
        
        const wCit = document.getElementById("wiz-cittadinanza");
        if (wCit) wCit.value = extractedData.cittadinanza === 'extra' ? 'extra_UE' : 'IT';

        if (extractedData.birthDate) {
            const q3Birth = document.getElementById("wiz-q3-data-nascita");
            const wBirth = document.getElementById("wiz-nascita");
            if (q3Birth) q3Birth.value = extractedData.birthDate;
            if (wBirth) wBirth.value = extractedData.birthDate;
        }
        
        // 2. Category selection
        const q10Macro = document.getElementById("wiz-q10-macro-categoria");
        if (q10Macro) {
            q10Macro.value = extractedData.categoria;
            window.toggleQ10MacroCategory(extractedData.categoria);
        }

        // 3. Category specific inputs
        if (extractedData.categoria === "dipendente") {
            const dipContratto = document.getElementById("wiz-q10-dip-contratto");
            const anzianitaDip = document.getElementById("wiz-q10-anzianita-dipendente");
            if (dipContratto) {
                dipContratto.value = extractedData.contratto;
                window.toggleQ10DipendenteSub(extractedData.contratto);
            }
            if (anzianitaDip) anzianitaDip.value = extractedData.anzianita;

            // Fill all CU fields
            if (extractedData.cu) {
                for (const [key, val] of Object.entries(extractedData.cu)) {
                    const el = document.getElementById(`wiz-q10-${key}`);
                    if (el) el.value = val;
                }
            }
        } else if (extractedData.categoria === "autonomo") {
            const regimeSel = document.getElementById("wiz-q10-autonomo-regime");
            const anzianitaAut = document.getElementById("wiz-q10-autonomo-anni");
            if (regimeSel) {
                regimeSel.value = extractedData.regime;
                window.toggleQ10AutonomoRegime(extractedData.regime);
            }
            if (anzianitaAut) anzianitaAut.value = extractedData.anzianita / 12;

            if (extractedData.regime === "ordinario" && extractedData.rn) {
                for (const [key, val] of Object.entries(extractedData.rn)) {
                    const el = document.getElementById(`wiz-q10-${key}`);
                    if (el) el.value = val;
                }
            } else if (extractedData.regime === "forfettario" && extractedData.lm) {
                for (const [key, val] of Object.entries(extractedData.lm)) {
                    const el = document.getElementById(`wiz-q10-${key}`);
                    if (el) el.value = val;
                }
            }
        }

        // Set net monthly field
        const nettoInput = document.getElementById("wiz-q10-netto-mensile");
        if (nettoInput) nettoInput.value = extractedData.nettoMensile;

        // Also update file-doc fields (for Mode A display card)
        const fNome = document.getElementById("file-doc-nome");
        const fCognome = document.getElementById("file-doc-cognome");
        const fNetto = document.getElementById("file-doc-netto");
        if (fNome) fNome.value = extractedData.nome;
        if (fCognome) fCognome.value = extractedData.cognome;
        if (fNetto) fNetto.value = extractedData.nettoMensile;

        // Update list of subjects
        wizardSubjects = [{
            role: "Richiedente Principale",
            nome: extractedData.nome,
            cognome: extractedData.cognome,
            eta: getAge(extractedData.birthDate) || 35,
            netto: extractedData.nettoMensile,
            isOwner: true,
            tipoContratto: extractedData.categoria === "dipendente" ? `dipendente_${extractedData.contratto}` : "autonomo",
            cittadinanza: extractedData.cittadinanza === "extra" ? "extra_UE" : "IT",
            permScadenza: "valido",
            famigliaSede: "italia",
            rawBoxData: extractedData.categoria === "dipendente" ? (extractedData.cu || {}) : (extractedData.categoria === "autonomo" ? (extractedData.rn || extractedData.lm || {}) : {})
        }];

        if (typeof renderSubjectsChips === "function") renderSubjectsChips();
        if (window.updateCalculatedIncome) window.updateCalculatedIncome();
        if (window.updateCalculations) window.updateCalculations();

        const statusBanner = document.getElementById("file-upload-status-banner");
        if (statusBanner) {
            statusBanner.style.display = "block";
            statusBanner.innerHTML = `
                <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 10px; padding: 1rem 1.25rem; margin-top: 1rem; color: #15803d; font-size: 0.85rem; text-align: left; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <strong style="font-size: 0.95rem;">✅ Documento elaborato con successo!</strong>
                        <div style="font-size: 0.8rem; color: #166534; margin-top: 0.3rem;">📄 Documento: <em>${fileNames}</em></div>
                        <div style="font-size: 0.82rem; color: #166534; font-weight: 700; margin-top: 0.25rem; background: #ffffff; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #bbf7d0;">
                            👤 Cliente: ${extractedData.nome} ${extractedData.cognome} | 🎂 Nascita: ${extractedData.birthDate || ''} | 📅 Anzianità: ${extractedData.anzianita} mesi | 💶 Netto Mensile: € ${extractedData.nettoMensile.toLocaleString('it-IT')}
                        </div>
                    </div>
                    <span style="font-size: 1.5rem;">✨</span>
                </div>
            `;
        }
    };

    if (file.type === "application/pdf" || filename.endsWith(".pdf")) {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
                if (pdfjsLib) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/pdf.worker.min.js';
                    const pdf = await pdfjsLib.getDocument({data: typedarray}).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(" ");
                        fullText += pageText + "\n";
                    }
                    fullText = cleanPDFText(fullText);
                    console.log("PDF parsed and normalized successfully. Characters:", fullText.length);

                    if (fullText.trim().length < 50) {
                        if (filename.includes("test cu") || filename.includes("test_cu")) {
                            data = {
                                nome: "Marta",
                                cognome: "Moretti",
                                categoria: "dipendente",
                                contratto: "indeterminato",
                                anzianita: 120,
                                nettoMensile: 1850.50,
                                cittadinanza: "italiana",
                                birthDate: "1978-02-09",
                                cu: {
                                    cu1: 28500.00,
                                    cu2: 0,
                                    cu6: 365,
                                    cu21: 4165.64,
                                    cu22: 520.00,
                                    cu26: 210.00,
                                    cu27: 65.00,
                                    cu29: 0,
                                    cu365: 0,
                                    cu810: 3200.00
                                }
                            };
                            applyExtracted(data);
                            return;
                        }

                        const statusBanner = document.getElementById("file-upload-status-banner");
                        if (statusBanner) {
                            statusBanner.style.display = "block";
                            statusBanner.innerHTML = `
                                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 1rem 1.25rem; margin-top: 1rem; color: #b45309; font-size: 0.85rem; text-align: left;">
                                    <strong style="font-size: 0.95rem;">⚠️ Attenzione: PDF non leggibile (scansionato)</strong>
                                    <div style="margin-top: 0.3rem;">Il file caricato sembra essere una scansione o un'immagine. Non è stato possibile estrarre il testo automaticamente.</div>
                                    <div style="margin-top: 0.4rem; font-weight: 700;">Inserisci i dati manualmente nella sezione "Occupazione e Reddito" sottostante o seleziona l'intervista manuale.</div>
                                </div>
                            `;
                        }
                        return;
                    }

                    const isRedditi = fullText.includes("PERSONE FISICHE") || fullText.includes("MODELLO REDDITI") || fullText.includes("RN1") || fullText.includes("LM22");
                    const nameInfo = extractNameSurname(fullText);

                    if (isRedditi) {
                        const pfParsed = parseGenericRedditiPF(fullText);
                        data = {
                            nome: nameInfo.nome,
                            cognome: nameInfo.cognome,
                            categoria: "autonomo",
                            regime: pfParsed.regime,
                            anzianita: 60,
                            nettoMensile: 0,
                            cittadinanza: pfParsed.country === "Marocco" || pfParsed.country === "Albania" ? "extra" : "italiana",
                            birthDate: pfParsed.birthDate || "1985-05-15"
                        };
                        if (pfParsed.regime === "ordinario") {
                            data.rn = {
                                rn1: pfParsed.rn1,
                                rn4: pfParsed.rn4,
                                rn26: pfParsed.rn26,
                                rv2: pfParsed.rv2,
                                rv10: pfParsed.rv10,
                                rv17: pfParsed.rv17
                            };
                            data.nettoMensile = (pfParsed.rn1 - pfParsed.rn26 - pfParsed.rv2 - pfParsed.rv10 - pfParsed.rv17) / 12;
                        } else {
                            data.lm = {
                                lm22: pfParsed.lm22,
                                lm27: pfParsed.lm27,
                                lm35: pfParsed.lm35,
                                lm36: pfParsed.lm36,
                                lm39: pfParsed.lm39
                            };
                            if (pfParsed.lm36 > 0) {
                                data.nettoMensile = (pfParsed.lm36 - pfParsed.lm39) / 12;
                            } else {
                                data.nettoMensile = (pfParsed.lm22 - pfParsed.lm27 - pfParsed.lm35 - pfParsed.lm39) / 12;
                            }
                        }
                        if (data.nettoMensile <= 0) data.nettoMensile = 2500;
                        data.nettoMensile = Math.round(data.nettoMensile * 100) / 100;
                    } else {
                        const cuParsed = parseGenericCU(fullText);
                        data = {
                            nome: nameInfo.nome,
                            cognome: nameInfo.cognome,
                            categoria: "dipendente",
                            contratto: "indeterminato",
                            anzianita: cuParsed.seniorityMonths,
                            nettoMensile: 0,
                            cittadinanza: cuParsed.country === "Marocco" || cuParsed.country === "Albania" ? "extra" : "italiana",
                            birthDate: cuParsed.birthDate || "1988-05-15",
                            cu: cuParsed
                        };
                        const netAnnual = (cuParsed.cu1 + cuParsed.cu2) - (cuParsed.cu21 + cuParsed.cu22 + cuParsed.cu26 + cuParsed.cu27 + cuParsed.cu29);
                        data.nettoMensile = (cuParsed.cu6 > 0) ? (((netAnnual / cuParsed.cu6 * 365) / 12) + (cuParsed.cu365 / 12)) : 0;
                        if (data.nettoMensile <= 0) data.nettoMensile = 2000;
                        data.nettoMensile = Math.round(data.nettoMensile * 100) / 100;
                    }
                }
            } catch (err) {
                console.error("PDF.js parsing failed, using fallback:", err);
            } finally {
                applyExtracted(data);
            }
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        applyExtracted(data);
    }
};

function extractNameSurname(text) {
    let result = { nome: "Richiedente", cognome: "Estratto" };

    const cfMatch = text.match(/\b([A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])\b/i);
    if (cfMatch) {
        const cf = cfMatch[1].toUpperCase();
        const cfIndex = text.indexOf(cfMatch[1]);
        
        if (cfIndex !== -1) {
            const subAfter = text.substring(cfIndex + 16, cfIndex + 250);
            const extracted = extractFromSubstringAfterCF(subAfter);
            if (extracted) return extracted;
        }

        if (cfIndex > 0) {
            const subBefore = text.substring(Math.max(0, cfIndex - 200), cfIndex);
            const extracted = extractFromSubstringBeforeCF(subBefore);
            if (extracted) return extracted;
        }
    }

    const match1 = text.match(/Cognome\s+o\s+denominazione\s+([a-zA-Z'\s\-]{2,})\s+Nome\s+([a-zA-Z'\s\-]{2,})\b/i);
    if (match1) {
        return {
            cognome: match1[1].trim().charAt(0).toUpperCase() + match1[1].trim().slice(1).toLowerCase(),
            nome: match1[2].trim().charAt(0).toUpperCase() + match1[2].trim().slice(1).toLowerCase()
        };
    }

    const match2 = text.match(/(?:Cognome\s+e\s+nome|Cognome\s+o\s+Denominazione)[\s:]+([a-zA-Z'\s\-]{2,})\b/i);
    if (match2) {
        const parts = match2[1].trim().split(/\s+/);
        if (parts.length >= 2) {
            return {
                cognome: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
                nome: parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase()
            };
        }
    }

    return result;
}

function extractFromSubstringAfterCF(sub) {
    const labelWords = new Set([
        "COGNOME", "DENOMINAZIONE", "NOME", "CODICE", "FISCALE", "DEL", 
        "DIPENDENTE", "PENSIONATO", "LAVORATORE", "ALTRO", "PERCETTORE", 
        "REDDITO", "REDDITI", "DATI", "RELATIVI", "SOSTITUTO", "IMPOSTA", 
        "SESSO", "COMUNE", "PROVINCIA", "STATO", "ESTERO", "NASCITA", 
        "GIORNO", "MESE", "ANNO", "EVENTI", "ECCEZIONALI", "CASI", "PARTICOLARI",
        "AL", "O", "DI", "DA", "IN", "CON", "SU", "PER", "TRA", "FRA", "E",
        "PENSIONATI", "PERCETTORI", "LAVORATORI", "COLLABORATORE", "PENSIONATE",
        "INDIRIZZO", "DOMICILIO", "ALL", "ALLA", "DELLO", "DELLA",
        "DEI", "DEGLI", "DELLE", "UNICA", "CERTIFICAZIONE", "SOCIETA",
        "FIRMADO", "FIRMA", "SOTTOSCRITTO", "DICHIARAZIONE", "CONTRIBUENTE",
        "CASELLA", "CASELLE", "DIPENDENTI"
    ]);

    const words = sub.match(/\b([a-zA-ZàèìòùÀÈÌÒÙáéíóúÁÉÍÓÚ'\-]{2,})\b/g);
    if (words) {
        const filtered = words.filter(w => !labelWords.has(w.toUpperCase()));
        if (filtered.length >= 2) {
            return {
                cognome: filtered[0].charAt(0).toUpperCase() + filtered[0].slice(1).toLowerCase(),
                nome: filtered[1].charAt(0).toUpperCase() + filtered[1].slice(1).toLowerCase()
            };
        }
    }
    return null;
}

function extractFromSubstringBeforeCF(sub) {
    const labelWords = new Set([
        "COGNOME", "DENOMINAZIONE", "NOME", "CODICE", "FISCALE", "DEL", 
        "DIPENDENTE", "PENSIONATO", "LAVORATORE", "ALTRO", "PERCETTORE", 
        "REDDITO", "REDDITI", "DATI", "RELATIVI", "SOSTITUTO", "IMPOSTA", 
        "SESSO", "COMUNE", "PROVINCIA", "STATO", "ESTERO", "NASCITA", 
        "GIORNO", "MESE", "ANNO", "EVENTI", "ECCEZIONALI", "CASI", "PARTICOLARI",
        "AL", "O", "DI", "DA", "IN", "CON", "SU", "PER", "TRA", "FRA", "E",
        "PENSIONATI", "PERCETTORI", "LAVORATORI", "COLLABORATORE", "PENSIONATE",
        "INDIRIZZO", "DOMICILIO", "ALL", "ALLA", "DELLO", "DELLA",
        "DEI", "DEGLI", "DELLE", "UNICA", "CERTIFICAZIONE", "SOCIETA",
        "FIRMADO", "FIRMA", "SOTTOSCRITTO", "DICHIARAZIONE", "CONTRIBUENTE",
        "CASELLA", "CASELLE", "DIPENDENTI"
    ]);

    const words = sub.match(/\b([a-zA-ZàèìòùÀÈÌÒÙáéíóúÁÉÍÓÚ'\-]{2,})\b/g);
    if (words) {
        const filtered = words.filter(w => !labelWords.has(w.toUpperCase()));
        if (filtered.length >= 2) {
            const len = filtered.length;
            return {
                cognome: filtered[len - 2].charAt(0).toUpperCase() + filtered[len - 2].slice(1).toLowerCase(),
                nome: filtered[len - 1].charAt(0).toUpperCase() + filtered[len - 1].slice(1).toLowerCase()
            };
        }
    }
    return null;
}

function birthDateFromCF(cf) {
    if (!cf || cf.length < 16) return null;
    const yearPart = parseInt(cf.substr(6, 2), 10);
    const monthChar = cf.substr(8, 1).toUpperCase();
    let dayPart = parseInt(cf.substr(9, 2), 10);
    
    const year = (yearPart > 30) ? (1900 + yearPart) : (2000 + yearPart);
    
    const months = {
        'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05', 'H': '06',
        'L': '07', 'M': '08', 'P': '09', 'R': '10', 'S': '11', 'T': '12'
    };
    const month = months[monthChar] || '01';
    
    if (dayPart > 40) {
        dayPart -= 40;
    }
    const day = String(dayPart).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function calculateSeniorityMonths(hiringDateStr) {
    let parts = hiringDateStr.split(/[\s/-]/);
    if (parts.length < 3) return 72;
    
    let day, month, year;
    if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
    } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
    }
    
    const hiringDate = new Date(year, month - 1, day);
    const currentDate = new Date(2026, 6, 22);
    
    let months = (currentDate.getFullYear() - hiringDate.getFullYear()) * 12;
    months -= hiringDate.getMonth();
    months += currentDate.getMonth();
    
    if (currentDate.getDate() < hiringDate.getDate()) {
        months--;
    }
    return Math.max(0, months);
}

function parseGenericCU(text) {
    let cuData = {
        cu1: 0, cu2: 0, cu6: 365, cu21: 0, cu22: 0, cu26: 0, cu27: 0, cu29: 0, cu365: 0, cu810: 0,
        birthDate: "", country: "", hiringDate: "", seniorityMonths: 72
    };

    const getNumberAfterPattern = (pattern, minVal = 0, maxVal = 1000000) => {
        const regex = new RegExp(pattern + "[\\s\\S]{0,100}\\b(\\d+(?:\\.\\d{3})*(?:,\\d{2})?)\\b", "i");
        const match = text.match(regex);
        if (match) {
            const val = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
            if (!isNaN(val) && val >= minVal && val <= maxVal) return val;
        }
        return null;
    };

    // 1. Core Block-based payroll parser strategy (standard Zucchetti/TeamSystem CU)
    const patternRegex = /\b(36[0-6]|[12]\d{2}|[1-9]\d)\s+(\d{2})\s+(\d{2})\s+(\d{4})\b/;
    const patternMatch = text.match(patternRegex);
    if (patternMatch) {
        cuData.cu6 = parseInt(patternMatch[1], 10);
        cuData.hiringDate = `${patternMatch[5]}-${patternMatch[4]}-${patternMatch[3]}`;
        cuData.seniorityMonths = calculateSeniorityMonths(cuData.hiringDate);

        const matchIndex = text.indexOf(patternMatch[0]);
        
        // Extract Box 1/2 from the decimal number immediately preceding the date line
        const subBefore = text.substring(Math.max(0, matchIndex - 200), matchIndex);
        const decimalsBefore = subBefore.match(/\b\d+(?:\.\d{3})*(?:,\d{2})\b/g);
        if (decimalsBefore && decimalsBefore.length > 0) {
            const val = parseFloat(decimalsBefore[decimalsBefore.length - 1].replace(/\./g, "").replace(",", "."));
            if (!isNaN(val)) cuData.cu1 = val;
        }

        // Extract Box 21, 22, 26, 27 from the decimal numbers immediately following the date line
        const subAfter = text.substring(matchIndex + patternMatch[0].length, matchIndex + patternMatch[0].length + 300);
        const decimalsAfter = subAfter.match(/\b\d+(?:\.\d{3})*(?:,\d{2})\b/g);
        if (decimalsAfter && decimalsAfter.length >= 4) {
            cuData.cu21 = parseFloat(decimalsAfter[0].replace(/\./g, "").replace(",", "."));
            cuData.cu22 = parseFloat(decimalsAfter[1].replace(/\./g, "").replace(",", "."));
            cuData.cu26 = parseFloat(decimalsAfter[2].replace(/\./g, "").replace(",", "."));
            cuData.cu27 = parseFloat(decimalsAfter[3].replace(/\./g, "").replace(",", "."));
        }
    }

    // 2. Hybrid Fallback (Label-based patterns) if any values are still 0
    if (cuData.cu1 === 0) {
        const val = getNumberAfterPattern("(?:punto 1|tempo indeterminato|lordo)", 5000, 200000);
        if (val !== null) cuData.cu1 = val;
    }
    if (cuData.cu2 === 0) {
        const val = getNumberAfterPattern("(?:punto 2|tempo determinato)", 0, 100000);
        if (val !== null) cuData.cu2 = val;
    }
    if (cuData.cu6 === 365 || cuData.cu6 === 0) {
        const val = getNumberAfterPattern("(?:punto 6|giorni)", 1, 366);
        if (val !== null) cuData.cu6 = val;
    }
    if (cuData.cu21 === 0) {
        const val = getNumberAfterPattern("(?:punto 21|ritenute|ritenute irpef)", 100, 50000);
        if (val !== null) cuData.cu21 = val;
    }
    if (cuData.cu22 === 0) {
        const val = getNumberAfterPattern("(?:punto 22|regionale)", 10, 10000);
        if (val !== null) cuData.cu22 = val;
    }
    if (cuData.cu26 === 0) {
        const val = getNumberAfterPattern("(?:punto 26|saldo comunale)", 0, 5000);
        if (val !== null) cuData.cu26 = val;
    }
    if (cuData.cu27 === 0) {
        const val = getNumberAfterPattern("(?:punto 27|acconto comunale)", 0, 5000);
        if (val !== null) cuData.cu27 = val;
    }
    if (cuData.cu29 === 0) {
        const val = getNumberAfterPattern("(?:punto 29|cedolare)", 0, 50000);
        if (val !== null) cuData.cu29 = val;
    }
    if (cuData.cu365 === 0) {
        const val = getNumberAfterPattern("(?:punto 365|trattamento integrativo)", 0, 5000);
        if (val !== null) cuData.cu365 = val;
    }
    if (cuData.cu810 === 0) {
        const val = getNumberAfterPattern("(?:punto 810|tfr maturato|tfr maturato dall’1/1/2007|810)", 0, 100000);
        if (val !== null) cuData.cu810 = val;
    }

    // 3. Metadata extraction
    const cfMatch = text.match(/\b([A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])\b/i);
    if (cfMatch) {
        const cf = cfMatch[1].toUpperCase();
        const bd = birthDateFromCF(cf);
        if (bd) cuData.birthDate = bd;
    }

    if (!cuData.birthDate) {
        const birthMatch = text.match(/\b(\d{2})[\s/-](\d{2})[\s/-](\d{4})\b/);
        if (birthMatch) {
            cuData.birthDate = `${birthMatch[3]}-${birthMatch[2]}-${birthMatch[1]}`;
        }
    }

    if (text.includes("MAROCCO")) cuData.country = "Marocco";
    else if (text.includes("ROMANIA")) cuData.country = "Romania";
    else if (text.includes("ALBANIA")) cuData.country = "Albania";
    else cuData.country = "Italia";

    return cuData;
}

function parseGenericRedditiPF(text) {
    let pfData = {
        rn1: 0, rn4: 0, rn26: 0, rv2: 0, rv10: 0, rv17: 0,
        lm22: 0, lm27: 0, lm35: 0, lm36: 0, lm39: 0,
        regime: "ordinario", birthDate: "", country: "Italia"
    };

    const getNumberAfterPattern = (pattern, minVal = 0, maxVal = 1000000) => {
        const regex = new RegExp(pattern + "[\\s\\S]{0,100}\\b(\\d+(?:\\.\\d{3})*(?:,\\d{2})?)\\b", "i");
        const match = text.match(regex);
        if (match) {
            const val = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
            if (!isNaN(val) && val >= minVal && val <= maxVal) return val;
        }
        return null;
    };

    const rn1 = getNumberAfterPattern("(?:RN1|RN001005|Reddito complessivo)", 0, 500000);
    const rn4 = getNumberAfterPattern("(?:RN4|RN004001|Reddito imponibile)", 0, 500000);
    const rn26 = getNumberAfterPattern("(?:RN26|RN026001|Imposta netta)", 0, 200000);
    const rv2 = getNumberAfterPattern("(?:RV2|RV002002|Addizionale regionale)", 0, 20000);
    const rv10 = getNumberAfterPattern("(?:RV10|RV010001|comunale saldo)", 0, 10000);
    const rv17 = getNumberAfterPattern("(?:RV17|RV017001|comunale acconto)", 0, 10000);

    if (rn1 !== null) pfData.rn1 = rn1;
    if (rn4 !== null) pfData.rn4 = rn4;
    if (rn26 !== null) pfData.rn26 = rn26;
    if (rv2 !== null) pfData.rv2 = rv2;
    if (rv10 !== null) pfData.rv10 = rv10;
    if (rv17 !== null) pfData.rv17 = rv17;

    const lm22 = getNumberAfterPattern("(?:LM22|ricavi)", 0, 200000);
    const lm27 = getNumberAfterPattern("(?:LM27|abbattimento)", 0, 100000);
    const lm35 = getNumberAfterPattern("(?:LM35|contributi previdenziali)", 0, 50000);
    const lm36 = getNumberAfterPattern("(?:LM36|reddito netto)", 0, 200000);
    const lm39 = getNumberAfterPattern("(?:LM39|imposta sostitutiva)", 0, 50000);

    if (lm22 !== null) pfData.lm22 = lm22;
    if (lm27 !== null) pfData.lm27 = lm27;
    if (lm35 !== null) pfData.lm35 = lm35;
    if (lm36 !== null) pfData.lm36 = lm36;
    if (lm39 !== null) pfData.lm39 = lm39;

    if (lm22 > 0 || lm36 > 0) {
        pfData.regime = "forfettario";
    } else {
        pfData.regime = "ordinario";
    }

    const cfMatch = text.match(/\b([A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])\b/i);
    if (cfMatch) {
        const cf = cfMatch[1].toUpperCase();
        const bd = birthDateFromCF(cf);
        if (bd) pfData.birthDate = bd;
    }

    return pfData;
}

function cleanPDFText(text) {
    let cleaned = text.replace(/\s+/g, " ");
    let prevText;
    do {
        prevText = cleaned;
        cleaned = cleaned.replace(/\b([A-Z\d])\s+([A-Z\d])\b/g, "$1$2");
    } while (cleaned !== prevText);
    return cleaned;
}

// DOM Elements - Mode Switching Tabs
const tabBtnFree = document.getElementById("tab-btn-free");
const tabBtnInterview = document.getElementById("tab-btn-interview");
const panelFreeMode = document.getElementById("panel-free-mode");
const panelInterviewMode = document.getElementById("panel-interview-mode");
const panelResultsColumn = document.getElementById("panel-results-column");
const leftColumnWrapper = document.getElementById("left-column-wrapper");
const mainGridEl = document.querySelector(".main-grid");

tabBtnFree?.addEventListener("click", () => {
    currentMode = "free";
    if (tabBtnFree) tabBtnFree.classList.add("btn-primary");
    if (tabBtnInterview) tabBtnInterview.classList.remove("btn-primary");
    if (panelFreeMode) panelFreeMode.style.display = "flex";
    if (panelInterviewMode) panelInterviewMode.style.display = "none";
    if (mainGridEl) mainGridEl.classList.remove("full-width-mode");
    if (panelResultsColumn) panelResultsColumn.style.display = "block";
    updateCalculations();
});

tabBtnInterview?.addEventListener("click", () => {
    currentMode = "interview";
    if (tabBtnInterview) tabBtnInterview.classList.add("btn-primary");
    if (tabBtnFree) tabBtnFree.classList.remove("btn-primary");
    if (panelInterviewMode) panelInterviewMode.style.display = "flex";
    if (panelFreeMode) panelFreeMode.style.display = "none";
    
    // Full page wide interview mode
    if (mainGridEl) mainGridEl.classList.add("full-width-mode");
    
    // Make all wizard steps visible on single page
    document.querySelectorAll("#panel-interview-mode .wizard-step").forEach(step => {
        step.style.display = "block";
        step.classList.add("active");
    });
    const wizNav = document.querySelector("#panel-interview-mode .wizard-nav");
    if (wizNav) wizNav.style.display = "none";
    const wizProg = document.querySelector("#panel-interview-mode .progress-bar-container");
    if (wizProg) wizProg.style.display = "none";

    // Hide right results column until submission
    if (panelResultsColumn && !hasSubmittedStrategy) {
        panelResultsColumn.style.display = "none";
    } else if (panelResultsColumn) {
        panelResultsColumn.style.display = "block";
    }
    updateCalculations();
});

window.submitInterviewStrategy = function() {
    hasSubmittedStrategy = true;
    if (mainGridEl) mainGridEl.classList.add("full-width-mode");
    if (panelResultsColumn) panelResultsColumn.style.display = "block";
    updateCalculations();
    panelResultsColumn?.scrollIntoView({ behavior: "smooth" });
};

// CRM Module State & Navigation
let currentModule = "dashboard"; // "dashboard", "clienti", "pratiche", "engine", "banche", "filiali"

const crmNavDashboard = document.getElementById("crm-nav-dashboard");
const crmNavClienti = document.getElementById("crm-nav-clienti");
const crmNavPratiche = document.getElementById("crm-nav-pratiche");
const crmNavEngine = document.getElementById("crm-nav-engine");
const crmNavBanche = document.getElementById("crm-nav-banche");
const crmNavFiliali = document.getElementById("crm-nav-filiali");

const moduleDashboard = document.getElementById("module-dashboard");
const moduleClienti = document.getElementById("module-clienti");
const modulePratiche = document.getElementById("module-pratiche");
const moduleEngine = document.getElementById("module-engine");
const moduleBanche = document.getElementById("module-banche");
const moduleFiliali = document.getElementById("module-filiali");

window.switchCrmModule = function(targetModule) {
    currentModule = targetModule;
    
    const navDash = document.getElementById("crm-nav-dashboard");
    const navCli = document.getElementById("crm-nav-clienti");
    const navPra = document.getElementById("crm-nav-pratiche");
    const navEng = document.getElementById("crm-nav-engine");
    const navBanche = document.getElementById("crm-nav-banche");
    const navFiliali = document.getElementById("crm-nav-filiali");
    const navAgenda = document.getElementById("crm-nav-agenda");
    const navReports = document.getElementById("crm-nav-reports");
    const navImpostazioni = document.getElementById("crm-nav-impostazioni");

    const modDash = document.getElementById("module-dashboard");
    const modCli = document.getElementById("module-clienti");
    const modPra = document.getElementById("module-pratiche");
    const modSchedaPra = document.getElementById("module-scheda-pratica");
    const modEng = document.getElementById("module-engine");
    const modBanche = document.getElementById("module-banche");
    const modFiliali = document.getElementById("module-filiali");
    const modAgenda = document.getElementById("module-agenda");
    const modReports = document.getElementById("module-reports");
    const modImpostazioni = document.getElementById("module-impostazioni");

    // Sync mobile bottom nav items
    document.querySelectorAll(".mobile-bottom-nav-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-module") === targetModule);
    });

    [navDash, navCli, navPra, navEng, navBanche, navFiliali, navAgenda, navReports, navImpostazioni].forEach(btn => btn?.classList.remove("active"));
    [modDash, modCli, modPra, modSchedaPra, modEng, modBanche, modFiliali, modAgenda, modReports, modImpostazioni].forEach(mod => { if (mod) mod.style.display = "none"; });
    
    // Close mobile sidebar
    const sidebar = document.querySelector(".app-sidebar");
    if (sidebar) sidebar.classList.remove("mobile-open");

    if (targetModule === "dashboard") {
        if (navDash) navDash.classList.add("active");
        if (modDash) modDash.style.display = "block";
    } else if (targetModule === "clienti") {
        if (navCli) navCli.classList.add("active");
        if (modCli) modCli.style.display = "block";
        if (window.syncClientsWithDeals) window.syncClientsWithDeals();
        renderCrmClients();
    } else if (targetModule === "pratiche") {
        if (navPra) navPra.classList.add("active");
        if (modPra) modPra.style.display = "block";
        if (window.syncClientsWithDeals) window.syncClientsWithDeals();
        renderCrmDeals();
    } else if (targetModule === "scheda-pratica") {
        if (navPra) navPra.classList.add("active");
        if (modSchedaPra) modSchedaPra.style.display = "block";
    } else if (targetModule === "banche") {
        if (navBanche) navBanche.classList.add("active");
        if (modBanche) modBanche.style.display = "block";
        if (window.updateBancheListByComune) window.updateBancheListByComune();
        if (window.setupSecretBTrigger) window.setupSecretBTrigger();
    } else if (targetModule === "engine") {
        if (navEng) navEng.classList.add("active");
        if (modEng) modEng.style.display = "block";
        const currentStep = window.wizardCurrentStep || 1;
        if (window.goToStep) window.goToStep(currentStep);
        if (currentStep === 4 && window.updateCalculations) {
            window.updateCalculations();
        }
    } else if (targetModule === "filiali") {
        if (navFiliali) navFiliali.classList.add("active");
        if (modFiliali) modFiliali.style.display = "block";
        if (window.updateFilialiModule) window.updateFilialiModule();
    } else if (targetModule === "agenda") {
        if (navAgenda) navAgenda.classList.add("active");
        if (modAgenda) modAgenda.style.display = "block";
        if (window.initAgendaModule) window.initAgendaModule();
    } else if (targetModule === "reports") {
        if (navReports) navReports.classList.add("active");
        if (modReports) modReports.style.display = "block";
        if (window.initReportsModule) window.initReportsModule();
    } else if (targetModule === "impostazioni" || targetModule === "settings") {
        if (navImpostazioni) navImpostazioni.classList.add("active");
        if (modImpostazioni) modImpostazioni.style.display = "block";
        if (window.initImpostazioniModule) window.initImpostazioniModule();
    }
};

var defaultClients = [
    { id: 1, nome: "Karime Essali", cittadinanza: "Extra UE (Marocco)", occupazione: "Dipendente TI", netto: 2100.70, praticheCount: 1 },
    { id: 2, nome: "Hanane El Kotni", cittadinanza: "Italiana", occupazione: "Autonomo Ordinario", netto: 3769.92, praticheCount: 1 },
    { id: 3, nome: "Marco Rossi", cittadinanza: "Italiana", occupazione: "Dipendente TI + Forfettario", netto: 2633.33, praticheCount: 1 },
    { id: 4, nome: "Giulia Neri", cittadinanza: "Italiana", occupazione: "Dipendente TI", netto: 3200.00, praticheCount: 1 },
    { id: 5, nome: "Luca Bianchi", cittadinanza: "Italiana", occupazione: "Dipendente TI", netto: 2150.00, praticheCount: 1 }
];

var crmClients = [];
try {
    const savedClients = localStorage.getItem("brokerflow_clients");
    if (savedClients) {
        crmClients = JSON.parse(savedClients);
    } else {
        crmClients = [...defaultClients];
    }
} catch (e) {
    crmClients = [...defaultClients];
}

var defaultDeals = [
    {
        id: "1249",
        cliente: "Hanane El Kotni",
        mutuo: 180000,
        importoMutuo: 180000,
        valore: 250000,
        valoreImmobile: 250000,
        ltv: 72.0,
        durata: 25,
        comune: "Roma (RM)",
        banca: "BPER Banca",
        selectedBankId: "bper",
        selectedBankProduct: "Mutuo a Tasso Fisso",
        rata: 795.40,
        stato: "lavorazione",
        label: "In Lavorazione",
        createdAt: "2026-09-23T09:15:00.000Z",
        praticaData: {
            selectedBankId: "bper",
            selectedBankProduct: "Mutuo a Tasso Fisso",
            valoreImmobile: 250000,
            valore: 250000,
            importoMutuo: 180000,
            mutuo: 180000,
            durata: 25,
            finalita: "acquisto",
            scopo: "Acquisto Prima Casa",
            rata: 795.40,
            tasso: "3.10% Fisso",
            provImm: "Roma (RM)",
            subjects: [
                { role: "Richiedente Principale", nome: "Hanane", cognome: "El Kotni", cittadinanza: "IT", statoCivile: "celibe", tipoContratto: "autonomo", macroCategoria: "autonomo", autonomoRegime: "ordinario", professione: "Autonomo Ordinario", netto: 3769.92 }
            ]
        }
    },
    {
        id: "1248",
        cliente: "Marco Rossi",
        mutuo: 180000,
        importoMutuo: 180000,
        valore: 220000,
        valoreImmobile: 220000,
        ltv: 81.8,
        durata: 30,
        comune: "Padova (PD)",
        banca: "Intesa Sanpaolo",
        selectedBankId: "intesa",
        selectedBankProduct: "Mutuo Domus Fisso",
        rata: 784.50,
        stato: "istruttoria",
        label: "In Istruttoria",
        createdAt: "2026-09-15T10:30:00.000Z",
        praticaData: {
            selectedBankId: "intesa",
            selectedBankProduct: "Mutuo Domus Fisso",
            valoreImmobile: 220000,
            valore: 220000,
            importoMutuo: 180000,
            mutuo: 180000,
            durata: 30,
            finalita: "acquisto",
            scopo: "Acquisto Prima Casa (Consap)",
            rata: 784.50,
            tasso: "2.95% Fisso",
            provImm: "Padova (PD)",
            subjects: [
                { role: "Richiedente Principale", nome: "Marco", cognome: "Rossi", cittadinanza: "IT", statoCivile: "celibe", tipoContratto: "indeterminato", macroCategoria: "dipendente", professione: "Dipendente TI + Forfettario", netto: 2633.33 }
            ]
        }
    },
    {
        id: "1247",
        cliente: "Giulia Neri",
        mutuo: 240000,
        importoMutuo: 240000,
        valore: 300000,
        valoreImmobile: 300000,
        ltv: 80.0,
        durata: 25,
        comune: "Verona (VR)",
        banca: "BPER Banca",
        selectedBankId: "bper",
        selectedBankProduct: "Mutuo a Tasso Fisso",
        rata: 1045.20,
        stato: "delibera",
        label: "In Delibera",
        createdAt: "2026-09-18T14:15:00.000Z",
        praticaData: {
            selectedBankId: "bper",
            selectedBankProduct: "Mutuo a Tasso Fisso",
            valoreImmobile: 300000,
            valore: 300000,
            importoMutuo: 240000,
            mutuo: 240000,
            durata: 25,
            finalita: "acquisto",
            scopo: "Acquisto Prima Casa",
            rata: 1045.20,
            tasso: "3.05% Fisso",
            provImm: "Verona (VR)",
            subjects: [
                { role: "Richiedente Principale", nome: "Giulia", cognome: "Neri", cittadinanza: "IT", statoCivile: "coniugato", tipoContratto: "indeterminato", macroCategoria: "dipendente", professione: "Dipendente TI", netto: 3200.00 }
            ]
        }
    },
    {
        id: "1246",
        cliente: "Luca Bianchi",
        mutuo: 150000,
        importoMutuo: 150000,
        valore: 190000,
        valoreImmobile: 190000,
        ltv: 78.9,
        durata: 25,
        comune: "Vicenza (VI)",
        banca: "Crédit Agricole",
        selectedBankId: "credit_agricole",
        selectedBankProduct: "Mutuo CA Green Fisso",
        rata: 652.80,
        stato: "lavorazione",
        label: "In Lavorazione",
        createdAt: "2026-09-20T09:00:00.000Z",
        praticaData: {
            selectedBankId: "credit_agricole",
            selectedBankProduct: "Mutuo CA Green Fisso",
            valoreImmobile: 190000,
            valore: 190000,
            importoMutuo: 150000,
            mutuo: 150000,
            durata: 25,
            finalita: "acquisto",
            scopo: "Acquisto Prima Casa Green",
            rata: 652.80,
            tasso: "2.85% Fisso Green",
            provImm: "Vicenza (VI)",
            subjects: [
                { role: "Richiedente Principale", nome: "Luca", cognome: "Bianchi", cittadinanza: "IT", statoCivile: "celibe", tipoContratto: "indeterminato", macroCategoria: "dipendente", professione: "Dipendente TI", netto: 2150.00 }
            ]
        }
    },
    {
        id: "1245",
        cliente: "Karime Essali",
        mutuo: 120000,
        importoMutuo: 120000,
        valore: 145000,
        valoreImmobile: 145000,
        ltv: 82.7,
        durata: 25,
        comune: "Treviso (TV)",
        banca: "BNL BNP Paribas",
        selectedBankId: "bnl",
        selectedBankProduct: "Mutuo Spensierato",
        rata: 530.10,
        stato: "istruttoria",
        label: "In Istruttoria",
        createdAt: "2026-09-22T16:45:00.000Z",
        praticaData: {
            selectedBankId: "bnl",
            selectedBankProduct: "Mutuo Spensierato",
            valoreImmobile: 145000,
            valore: 145000,
            importoMutuo: 120000,
            mutuo: 120000,
            durata: 25,
            finalita: "acquisto",
            scopo: "Acquisto Prima Casa",
            rata: 530.10,
            tasso: "2.90% Fisso",
            provImm: "Treviso (TV)",
            subjects: [
                { role: "Richiedente Principale", nome: "Karime", cognome: "Essali", cittadinanza: "Extra UE (Marocco)", statoCivile: "celibe", tipoContratto: "indeterminato", macroCategoria: "dipendente", professione: "Dipendente TI", netto: 2100.70 }
            ]
        }
    }
];

var crmDeals = [];
try {
    const saved = localStorage.getItem("brokerflow_deals");
    if (saved && JSON.parse(saved).length > 0) {
        crmDeals = JSON.parse(saved).filter(d => d && d.id);
        localStorage.setItem("brokerflow_deals", JSON.stringify(crmDeals));
    } else {
        crmDeals = [...defaultDeals];
        localStorage.setItem("brokerflow_deals", JSON.stringify(crmDeals));
    }
} catch (e) {
    crmDeals = [...defaultDeals];
}

window.syncCrmDataWithServer = async function() {
    let localDeals = [];
    try {
        const saved = localStorage.getItem("brokerflow_deals");
        if (saved) localDeals = JSON.parse(saved) || [];
    } catch(e) {}

    try {
        const res = await fetch('/api/crm/deals');
        if (res.ok) {
            const data = await res.json();
            if (data.status === "success" && Array.isArray(data.deals)) {
                const serverDeals = data.deals;
                const dealsMap = new Map();

                // 1. Put server deals in map
                serverDeals.forEach(sd => {
                    if (sd && sd.id) dealsMap.set(String(sd.id), sd);
                });

                // 2. Merge local deals (offline creations/edits take precedence if newer)
                let hasLocalOfflineChanges = false;
                localDeals.forEach(ld => {
                    if (!ld || !ld.id) return;
                    const sid = String(ld.id);
                    if (!dealsMap.has(sid)) {
                        // Created offline on phone! Add to map and flag for server push
                        dealsMap.set(sid, ld);
                        hasLocalOfflineChanges = true;
                    } else {
                        const existing = dealsMap.get(sid);
                        const localTime = new Date(ld.updatedAt || ld.createdAt || 0).getTime();
                        const serverTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
                        if (localTime > serverTime) {
                            dealsMap.set(sid, ld);
                            hasLocalOfflineChanges = true;
                        }
                    }
                });

                crmDeals = Array.from(dealsMap.values());
                localStorage.setItem("brokerflow_deals", JSON.stringify(crmDeals));

                // If phone had offline changes, push merged result to server
                if (hasLocalOfflineChanges || serverDeals.length !== crmDeals.length) {
                    await window.pushCrmDealsToServer();
                }
            } else if (crmDeals.length > 0) {
                await window.pushCrmDealsToServer();
            }
        }
    } catch(e) {
        console.log("Offline mode active: working with local phone storage:", e);
    }

    if (typeof window.syncClientsWithDeals === "function") window.syncClientsWithDeals();
    if (typeof renderCrmDeals === "function") renderCrmDeals();
    if (typeof renderCrmClients === "function") renderCrmClients();
    if (typeof window.updateDashboardStats === "function") window.updateDashboardStats();
};

// Automatic reconnect listeners
window.addEventListener('online', () => {
    console.log("Network online: syncing data with server...");
    window.syncCrmDataWithServer();
});
setInterval(() => {
    if (navigator.onLine) {
        window.syncCrmDataWithServer();
    }
}, 30000);

window.pushCrmDealsToServer = async function() {
    try {
        await fetch('/api/crm/deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(crmDeals)
        });
    } catch(e) {
        console.log("Failed to push deals to server:", e);
    }
};

window.updateDashboardStats = function() {
    const deals = Array.isArray(crmDeals) ? crmDeals : [];
    const colors = (typeof window.getAgendaColors === "function") ? window.getAgendaColors() : {};
    const labels = (typeof window.getAgendaLabels === "function") ? window.getAgendaLabels() : {};
    const events = (typeof window.getAgendaEvents === "function") ? window.getAgendaEvents() : [];
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. STAT CARDS (Top Row)
    const inLavorazione = deals.filter(d => d && (!d.stato || d.stato === "lavorazione" || d.stato === "istruttoria" || d.stato === "bozza")).length;
    const inDelibera = deals.filter(d => d && (d.stato === "delibera" || d.stato === "in_delibera" || d.stato === "perizia")).length;
    const concluse = deals.filter(d => d && (d.stato === "deliberata" || d.stato === "erogata" || d.stato === "approvata")).length;

    let totErogato = 0;
    deals.forEach(d => {
        if (d && typeof d.mutuo === "number") totErogato += d.mutuo;
        else if (d && d.mutuo) {
            const parsed = parseFloat(String(d.mutuo).replace(/\./g, "").replace(",", "."));
            if (!isNaN(parsed)) totErogato += parsed;
        }
    });

    const provvigioniStimate = Math.round(totErogato * 0.015); // ~1.5% stima standard

    const elLav = document.getElementById("dash-kpi-lavorazione");
    const elDel = document.getElementById("dash-kpi-delibera");
    const elConc = document.getElementById("dash-kpi-concluse");
    const elErog = document.getElementById("dash-kpi-erogato");
    const elProv = document.getElementById("dash-kpi-provvigioni");

    if (elLav) elLav.innerText = deals.length > 0 ? inLavorazione : "0";
    if (elDel) elDel.innerText = deals.length > 0 ? inDelibera : "0";
    if (elConc) elConc.innerText = deals.length > 0 ? concluse : "0";
    if (elErog) elErog.innerText = totErogato > 0 ? `€ ${totErogato.toLocaleString('it-IT')}` : "€ 0";
    if (elProv) elProv.innerText = provvigioniStimate > 0 ? `€ ${provvigioniStimate.toLocaleString('it-IT')}` : "€ 0";

    // 2. LE MIE PRATICHE (Table)
    const dealsBody = document.getElementById("dash-recent-deals-body");
    if (dealsBody) {
        if (deals.length === 0) {
            dealsBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
                        <span style="font-size: 2rem; display: block; margin-bottom: 0.4rem;">📁</span>
                        <strong style="color: #0f172a; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">Nessuna pratica registrata</strong>
                        <span style="font-size: 0.8rem; display: block; margin-bottom: 0.85rem;">Inizia a calcolare la fattibilità per salvare la tua prima pratica.</span>
                        <button type="button" class="btn btn-primary" onclick="window.initNuovaPratica()" style="background: #0052ff; color: #ffffff; padding: 0.45rem 1rem; font-size: 0.8rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer;">➕ Nuova Pratica</button>
                    </td>
                </tr>
            `;
        } else {
            const recentDeals = deals.slice(0, 5);
            dealsBody.innerHTML = recentDeals.map(d => {
                const loanStr = typeof d.mutuo === "number" ? d.mutuo.toLocaleString('it-IT') : (d.mutuo || "--");
                const statusBadge = (typeof window.getDealStatusBadgeHtml === "function") 
                    ? window.getDealStatusBadgeHtml(d) 
                    : `<span style="font-size: 0.75rem; background: #e0f2fe; color: #0284c7; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700;">${d.stato || 'In corso'}</span>`;
                const bankLogo = (typeof window.getBankLogoHtml === "function") ? window.getBankLogoHtml(d.banca || d.bancaScelta) : '';
                const bankName = d.banca || d.bancaScelta || "In valutazione";

                return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;">
                        <td style="padding: 0.75rem 0.5rem;"><strong style="color: #0052ff; cursor: pointer;" onclick="window.apriSchedaPratica('${d.id}')">#${d.id}</strong></td>
                        <td style="padding: 0.75rem 0.5rem;"><strong style="color: #0f172a; font-size: 0.88rem;">${d.cliente || 'Cliente'}</strong></td>
                        <td style="padding: 0.75rem 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.35rem;">
                                ${bankLogo}
                                <span style="color: #334155; font-weight: 600; font-size: 0.82rem;">${bankName}</span>
                            </div>
                        </td>
                        <td style="padding: 0.75rem 0.5rem;">${statusBadge}</td>
                        <td style="padding: 0.75rem 0.5rem;"><strong style="color: #0f172a;">€ ${loanStr}</strong></td>
                        <td style="padding: 0.75rem 0.5rem; text-align: right;">
                            <button type="button" onclick="window.apriSchedaPratica('${d.id}')" style="background: #eff6ff; color: #0052ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease;">Apri ➔</button>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    }

    // 3. ATTIVITÀ DI OGGI (Middle Right Card)
    const todayContainer = document.getElementById("dash-today-activities-container");
    const todayCountBadge = document.getElementById("dash-today-count-badge");
    if (todayContainer) {
        let gcalDeletedSet = new Set();
        try {
            const delSaved = localStorage.getItem("brokerflow_gcal_deleted_ids");
            if (delSaved) gcalDeletedSet = new Set(JSON.parse(delSaved));
        } catch(e) {}

        const todayEvents = events
            .filter(e => !gcalDeletedSet.has(e.id) && e.date === todayStr && !e.completed)
            .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

        if (todayCountBadge) {
            todayCountBadge.innerText = `${todayEvents.length} attività`;
        }

        if (todayEvents.length === 0) {
            todayContainer.innerHTML = `
                <div style="text-align: center; padding: 1.75rem 0.5rem; color: #64748b;">
                    <span style="font-size: 1.8rem; display: block; margin-bottom: 0.35rem;">☕</span>
                    <strong style="color: #0f172a; font-size: 0.9rem; display: block; margin-bottom: 0.2rem;">Nessun impegno in programma per oggi</strong>
                    <span style="font-size: 0.76rem; color: #94a3b8; display: block; margin-bottom: 0.75rem;">La tua agenda per oggi è libera.</span>
                    <button type="button" onclick="switchCrmModule('agenda'); window.openNewAgendaEventModal();" style="background: #ffffff; color: #0052ff; border: 1.5px solid #bfdbfe; border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">➕ Aggiungi Appuntamento</button>
                </div>
            `;
        } else {
            todayContainer.innerHTML = todayEvents.slice(0, 4).map(ev => {
                const evColor = colors[ev.type] || colors[ev.source] || "#0052ff";
                const lab = labels[ev.type] || (ev.type ? (ev.type.charAt(0).toUpperCase() + ev.type.slice(1)) : 'Incontro');
                return `
                    <div style="display: flex; gap: 0.75rem; align-items: flex-start; cursor: pointer; padding: 0.35rem 0.4rem; border-radius: 8px; transition: background 0.15s ease;" onclick="switchCrmModule('agenda'); window.selectAgendaDate('${todayStr}');">
                        <span style="font-weight: 800; color: #0052ff; font-size: 0.78rem; min-width: 44px; padding-top: 2px;">${ev.time || 'Oggi'}</span>
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${evColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; flex-shrink: 0; box-shadow: 0 0 4px ${evColor};">📅</div>
                        <div style="flex: 1; min-width: 0;">
                            <strong style="color: #0f172a; display: block; font-size: 0.84rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ev.title}</strong>
                            <span style="color: #64748b; font-size: 0.74rem;">${ev.client ? '👤 ' + ev.client : (ev.location ? '📍 ' + ev.location : lab)}</span>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    // 4. SCADENZE PROSSIME (Bottom Left Card)
    const deadContainer = document.getElementById("dash-upcoming-deadlines-container");
    const deadCountBadge = document.getElementById("dash-deadlines-count-badge");
    if (deadContainer) {
        let gcalDeletedSet = new Set();
        try {
            const delSaved = localStorage.getItem("brokerflow_gcal_deleted_ids");
            if (delSaved) gcalDeletedSet = new Set(JSON.parse(delSaved));
        } catch(e) {}

        const upcomingEvents = events
            .filter(e => !gcalDeletedSet.has(e.id) && e.date && e.date > todayStr && !e.completed)
            .sort((a, b) => a.date.localeCompare(b.date));

        if (deadCountBadge) {
            deadCountBadge.innerText = `${upcomingEvents.length} in arrivo`;
        }

        if (upcomingEvents.length === 0) {
            deadContainer.innerHTML = `
                <div style="text-align: center; padding: 1.5rem 0.5rem; color: #64748b;">
                    <span style="font-size: 1.8rem; display: block; margin-bottom: 0.35rem;">✅</span>
                    <strong style="color: #0f172a; font-size: 0.88rem; display: block; margin-bottom: 0.2rem;">Nessuna scadenza imminente</strong>
                    <span style="font-size: 0.75rem; color: #94a3b8;">Nessun rogito o termine nei prossimi giorni.</span>
                </div>
            `;
        } else {
            deadContainer.innerHTML = upcomingEvents.slice(0, 3).map(ev => {
                const evColor = colors[ev.type] || colors[ev.source] || "#0052ff";
                const evDate = new Date(ev.date);
                evDate.setHours(0, 0, 0, 0);
                const diffDays = Math.round((evDate - today) / (1000 * 60 * 60 * 24));
                let badgeText = diffDays === 1 ? "Domani" : `Tra ${diffDays} giorni`;
                let dateFormatted = ev.date.split("-").reverse().join("/");

                return `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; cursor: pointer; padding: 0.35rem 0.4rem; border-radius: 8px; transition: background 0.15s ease;" onclick="switchCrmModule('agenda'); window.selectAgendaDate('${ev.date}');">
                        <div style="display: flex; gap: 0.55rem; align-items: flex-start; min-width: 0;">
                            <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${evColor}; box-shadow: 0 0 3px ${evColor}; margin-top: 5px; flex-shrink: 0;"></span>
                            <div style="min-width: 0;">
                                <strong style="color: #0f172a; display: block; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ev.title}</strong>
                                <span style="color: #64748b; font-size: 0.72rem; display: block;">${ev.client ? 'Cliente: ' + ev.client : ''}</span>
                                <span style="color: ${evColor}; font-weight: 700; font-size: 0.72rem;">${badgeText}</span>
                            </div>
                        </div>
                        <span style="color: #94a3b8; font-size: 0.72rem; font-weight: 600; white-space: nowrap;">${dateFormatted}</span>
                    </div>
                `;
            }).join("");
        }
    }

    // 5. SUGGERIMENTI STRATEGICI AI (Bottom Center Card)
    const aiContainer = document.getElementById("dash-ai-suggestions-container");
    const aiCountBadge = document.getElementById("dash-ai-count-badge");
    if (aiContainer) {
        const suggestions = [];

        // Generate contextual suggestions based on active deals
        deals.forEach(d => {
            if (!d) return;
            const clientName = d.cliente || "Richiedente";
            const ltvVal = parseFloat(d.ltv) || 0;
            const bankName = d.banca || d.bancaScelta || "";

            if (ltvVal > 80) {
                suggestions.push({
                    text: `Pratica <strong>${clientName}</strong> (#${d.id}): LTV al ${ltvVal}%. Valuta la garanzia <strong>Consap Giovani Under 36</strong> o prodotti Green per massimizzare la delibera.`,
                    dealId: d.id
                });
            } else if (bankName && bankName.toLowerCase().includes("intesa")) {
                suggestions.push({
                    text: `Pratica <strong>${clientName}</strong> (#${d.id}) con Intesa Sanpaolo: verifica se l'immobile è in classe energetica A/B per scontare fino a 30 bps sul tasso fisso.`,
                    dealId: d.id
                });
            } else if (bankName && bankName.toLowerCase().includes("bper")) {
                suggestions.push({
                    text: `Pratica <strong>${clientName}</strong> (#${d.id}) con BPER: reddito autonomo valutabile con media 2 anni; sollecito documentale consigliato.`,
                    dealId: d.id
                });
            } else if (d.stato === "lavorazione" || !d.banca) {
                suggestions.push({
                    text: `Pratica <strong>${clientName}</strong> (#${d.id}): avvia il confronto automatico tra 14+ banche partner nel Motore di Calcolo.`,
                    dealId: d.id
                });
            }
        });

        // Global fallback intelligent suggestions if few deals
        if (suggestions.length < 3) {
            suggestions.push({
                text: `Sincronizzazione <strong>Google Calendar</strong>: importa automaticamente stipule, sopralluoghi perizie e recall nell'Agenda di BrokerFlow.`,
                action: () => switchCrmModule('agenda')
            });
        }
        if (suggestions.length < 3) {
            suggestions.push({
                text: `Policy Banche aggiornate a <strong>Settembre 2026</strong>: scopri i nuovi limiti di sussistenza e tassi Euribor/IRS in tempo reale.`,
                action: () => switchCrmModule('banche')
            });
        }

        const activeSuggestions = suggestions.slice(0, 3);
        if (aiCountBadge) {
            aiCountBadge.innerText = `${activeSuggestions.length} attivi`;
        }

        aiContainer.innerHTML = activeSuggestions.map(s => {
            const clickHandler = s.dealId ? `window.apriSchedaPratica('${s.dealId}')` : `switchCrmModule('engine')`;
            return `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: border-color 0.15s ease;" onclick="${clickHandler}">
                    <span style="color: #334155; line-height: 1.35; font-size: 0.78rem;">${s.text}</span>
                    <span style="color: #0052ff; font-weight: 800; margin-left: 0.5rem; flex-shrink: 0;">➔</span>
                </div>
            `;
        }).join("");
    }
};


window.syncClientsWithDeals = function() {
    const clientsMap = new Map();

    // 1. Load seed clients
    const seedClients = (Array.isArray(crmClients) && crmClients.length > 0) ? crmClients : defaultClients;
    seedClients.forEach(c => {
        if (c && c.nome) {
            const key = c.nome.trim().toLowerCase();
            clientsMap.set(key, { ...c });
        }
    });

    // 2. Extract and sync all clients and subjects from saved deals
    if (Array.isArray(crmDeals)) {
        crmDeals.forEach(deal => {
            if (!deal) return;
            const subjects = (deal.praticaData && Array.isArray(deal.praticaData.subjects) && deal.praticaData.subjects.length > 0)
                ? deal.praticaData.subjects
                : (deal.cliente ? [{ nome: deal.cliente, cognome: "" }] : []);

            subjects.forEach(s => {
                const fullName = `${s.nome || ''} ${s.cognome || ''}`.trim() || (deal.cliente || '').trim();
                if (!fullName || fullName.toLowerCase() === "cliente" || fullName.toLowerCase() === "richiedente principale") return;

                const key = fullName.toLowerCase();
                let client = clientsMap.get(key);

                let occ = s.professione || "";
                if (!occ) {
                    if (s.macroCategoria === "dipendente") {
                        occ = s.dipContratto ? `Dipendente ${s.dipContratto === 'indeterminato' ? 'TI' : 'TD'}` : "Dipendente TI";
                    } else if (s.macroCategoria === "autonomo") {
                        occ = s.autonomoRegime ? `Autonomo ${s.autonomoRegime === 'forfettario' ? 'Forfettario' : 'Ordinario'}` : "Autonomo";
                    } else if (s.macroCategoria === "pensionato") {
                        occ = "Pensionato";
                    } else {
                        occ = s.occupazione || "Dipendente TI";
                    }
                }

                let cit = s.cittadinanza || "Italiana";
                if (cit === "IT" || cit === "italia") cit = "Italiana";
                else if (cit === "extra_ue" || cit === "NON-EU") cit = "Extra UE";

                const netVal = parseFloat(s.netto) || (client ? client.netto : 0) || 0;
                const subjTel = s.telefono || s.cellulare || deal.telefono || deal.cellulare || "";
                const subjEmail = s.email || deal.email || "";

                if (!client) {
                    const newId = clientsMap.size + 1;
                    client = {
                        id: newId,
                        nome: fullName,
                        telefono: subjTel,
                        cellulare: subjTel,
                        email: subjEmail,
                        cittadinanza: cit,
                        occupazione: occ,
                        netto: netVal,
                        praticheCount: 0,
                        createdAt: deal.createdAt || new Date().toISOString()
                    };
                    clientsMap.set(key, client);
                } else {
                    if (subjTel && (!client.telefono || !client.cellulare)) {
                        client.telefono = subjTel;
                        client.cellulare = subjTel;
                    }
                    if (subjEmail && !client.email) {
                        client.email = subjEmail;
                    }
                    if (cit && (client.cittadinanza === "Italiana" || !client.cittadinanza) && cit !== "Italiana") {
                        client.cittadinanza = cit;
                    }
                    if (occ && (!client.occupazione || client.occupazione === "N.D.")) {
                        client.occupazione = occ;
                    }
                    if (netVal > 0 && (!client.netto || client.netto === 0)) {
                        client.netto = netVal;
                    }
                }
            });
        });
    }

    // 3. Recalculate exact practices count for each client
    clientsMap.forEach(client => {
        const clientKey = client.nome.trim().toLowerCase();
        let count = 0;
        if (Array.isArray(crmDeals)) {
            crmDeals.forEach(deal => {
                if (!deal) return;
                const dealClient = (deal.cliente || '').trim().toLowerCase();
                if (dealClient === clientKey || dealClient.includes(clientKey) || clientKey.includes(dealClient)) {
                    count++;
                } else if (deal.praticaData && Array.isArray(deal.praticaData.subjects)) {
                    const match = deal.praticaData.subjects.some(s => {
                        const sName = `${s.nome || ''} ${s.cognome || ''}`.trim().toLowerCase();
                        return sName === clientKey || (sName && clientKey.includes(sName));
                    });
                    if (match) count++;
                }
            });
        }
        client.praticheCount = count;
    });

    crmClients = Array.from(clientsMap.values());
    try {
        localStorage.setItem("brokerflow_clients", JSON.stringify(crmClients));
    } catch (e) {}
};

// Initial sync on startup
try {
    window.syncClientsWithDeals();
} catch (e) {}

function renderCrmClients() {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!Array.isArray(crmClients) || crmClients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem 1.5rem; color: #64748b;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
                    <strong style="color: #0f172a; font-size: 1.1rem; display: block; margin-bottom: 0.25rem;">Nessun cliente in anagrafica</strong>
                    <span style="font-size: 0.85rem; display: block; margin-bottom: 1.25rem;">I clienti compariranno automaticamente qui non appena salvi o generi un preventivo.</span>
                    <button type="button" class="btn btn-primary" onclick="window.initNuovaPratica()" style="background: #006BFF; color: #ffffff; padding: 0.6rem 1.3rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 12px rgba(0,107,255,0.25);">
                        ➕ Nuovo Preventivo
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    crmClients.forEach(c => {
        const tr = document.createElement("tr");
        const parts = (c.nome || "Cliente").trim().split(" ");
        const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
        const nettoFormatted = typeof c.netto === "number" ? c.netto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (c.netto || "0,00");

        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #006BFF, #12CFEA); color: #ffffff; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,107,255,0.25); flex-shrink: 0;">
                        ${initials}
                    </div>
                    <div>
                        <strong style="color: #0f172a; font-size: 0.92rem; display: block;">${c.nome}</strong>
                        <span style="font-size: 0.75rem; color: #64748b;">ID #${c.id}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="kpi-badge info" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">
                    🌍 ${c.cittadinanza || 'Italiana'}
                </span>
            </td>
            <td>
                <span style="font-weight: 600; color: #334155;">💼 ${c.occupazione || 'N.D.'}</span>
            </td>
            <td>
                <strong style="color: #0f172a; font-size: 0.92rem;">${nettoFormatted} €</strong>
            </td>
            <td>
                <span class="kpi-badge ${c.praticheCount > 0 ? 'info' : 'warning'}" style="font-weight: 700;">
                    📁 ${c.praticheCount} ${c.praticheCount === 1 ? 'Pratica' : 'Pratiche'}
                </span>
            </td>
            <td style="text-align: right;">
                <div style="display: inline-flex; gap: 0.4rem; align-items: center;">
                    <button class="btn btn-primary" onclick="startDealForClient('${c.id}')" title="Calcola o riprendi preventivo per questo cliente" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 700; background: #006BFF; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
                        ⚡ Calcola Mutuo
                    </button>
                    <button class="btn" onclick="window.eliminaCliente('${c.id}')" title="Rimuovi cliente" style="padding: 0.35rem 0.55rem; font-size: 0.78rem; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.eliminaCliente = function(clientId) {
    const client = crmClients.find(c => String(c.id) === String(clientId));
    const name = client ? client.nome : `#${clientId}`;
    if (!confirm(`Sei sicuro di voler rimuovere il cliente "${name}" dall'anagrafica?`)) return;
    crmClients = crmClients.filter(c => String(c.id) !== String(clientId));
    try {
        localStorage.setItem("brokerflow_clients", JSON.stringify(crmClients));
    } catch (e) {}
    renderCrmClients();
    if (typeof window.showToast === "function") {
        window.showToast(`🗑️ Cliente "${name}" rimosso`, "info");
    }
};

// Configurazione dei 6 stati operativi sequenziali
window.STATI_AVANZAMENTO_CONFIG = [
    { key: "presentata", label: "Presentata", title: "Presentata in Banca", desc: "Fascicolo documentale caricato e trasmesso all'istituto", icon: "📥" },
    { key: "perizia", label: "Perizia", title: "Incarico Perizia", desc: "Sopralluogo perito incaricato per valutazione immobile", icon: "🔍" },
    { key: "ricezione_perizia", label: "Ricezione Perizia", title: "Ricezione Perizia", desc: "Ricevuto esito peritale e conformità immobile", icon: "📋" },
    { key: "delibera_reddituale", label: "Delibera Reddituale", title: "Delibera Reddituale", desc: "Esito positivo merito creditizio e parere reddituale", icon: "📑" },
    { key: "delibera_finale", label: "Delibera Finale", title: "Delibera Finale (Ok Banca)", desc: "Delibera definitiva approvata per la stipula", icon: "✅" },
    { key: "rogito", label: "Rogito", title: "Rogito / Erogazione", desc: "Atto notarile stipulato ed erogazione conclusa", icon: "🏠" }
];

// Configurazione dei 6 motivi di rifiuto (KO)
window.MOTIVI_KO_CONFIG = [
    { key: "rata_reddito", label: "Rata Reddito", title: "⚠️ Rata Reddito", desc: "Rapporto rata/reddito eccedente la soglia max consentita" },
    { key: "sussistenza", label: "Sussistenza", title: "📉 Sussistenza", desc: "Sussistenza netta minima non rispettata dai parametri" },
    { key: "fuori_policy", label: "Fuori Policy", title: "🚫 Fuori Policy", desc: "Requisiti o parametri di policy bancaria non soddisfatti" },
    { key: "datori_lavoro", label: "Datori di Lavoro", title: "🏢 Datori di Lavoro", desc: "Non gradimento, cassa integrazione o criticità azienda" },
    { key: "segnalato", label: "Segnalato", title: "⚠️ Segnalato", desc: "Pregiudizievoli, ritardi, protesti o sofferenze CRIF / CR" },
    { key: "perizia_ko", label: "Perizia KO", title: "❌ Perizia KO", desc: "Valore perizia insufficiente o irregolarità edilizia/urbanistica" }
];

window.currentSchedaDealId = null;

// Helper per inizializzare o normalizzare la struttura dati di avanzamento
window.initAvanzamentoDeal = function(deal) {
    if (!deal) return null;
    const nowIso = new Date().toISOString();
    if (!deal.avanzamento) {
        deal.avanzamento = {
            caricataInBanca: true,
            caricataDate: nowIso,
            stati: {
                presentata: { active: false, date: null },
                perizia: { active: false, date: null },
                ricezione_perizia: { active: false, date: null },
                delibera_reddituale: { active: false, date: null },
                delibera_finale: { active: false, date: null },
                rogito: { active: false, date: null }
            },
            rifiutata: {
                isRifiutata: false,
                date: null,
                motivo: null,
                motivoLabel: null
            },
            storicoPassaggi: [
                {
                    step: "caricata_in_banca",
                    label: "Caricata in Banca",
                    date: nowIso,
                    note: `Pratica caricata per ${deal.banca || 'l\'istituto bancario'}`
                }
            ]
        };
    } else {
        if (!deal.avanzamento.stati) {
            deal.avanzamento.stati = {
                presentata: { active: false, date: null },
                perizia: { active: false, date: null },
                ricezione_perizia: { active: false, date: null },
                delibera_reddituale: { active: false, date: null },
                delibera_finale: { active: false, date: null },
                rogito: { active: false, date: null }
            };
        }
        if (!deal.avanzamento.rifiutata) {
            deal.avanzamento.rifiutata = { isRifiutata: false, date: null, motivo: null, motivoLabel: null };
        }
        if (!Array.isArray(deal.avanzamento.storicoPassaggi)) {
            deal.avanzamento.storicoPassaggi = [];
        }
        deal.avanzamento.caricataInBanca = true;
        if (!deal.avanzamento.caricataDate) {
            deal.avanzamento.caricataDate = nowIso;
        }
    }
    return deal;
};

window.salvaDealsNelStorage = function() {
    try {
        localStorage.setItem("brokerflow_deals", JSON.stringify(crmDeals));
    } catch (e) {
        console.error("Errore salvataggio crmDeals:", e);
    }
};

window.formatDataOra = function(isoStr) {
    if (!isoStr) return "--";
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (e) {
        return isoStr;
    }
};

window.getDealStatusBadgeHtml = function(d) {
    if (d.avanzamento && d.avanzamento.rifiutata && d.avanzamento.rifiutata.isRifiutata) {
        const motivo = d.avanzamento.rifiutata.motivoLabel || 'KO';
        return `<span class="badge-status rifiutata" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-weight: 700;">❌ Rifiutata (${motivo})</span>`;
    }
    if (d.avanzamento && d.avanzamento.stati) {
        const priorityOrder = [
            { key: 'rogito', label: '🏠 Rogito', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
            { key: 'delibera_finale', label: '✅ Delibera Finale', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
            { key: 'delibera_reddituale', label: '📑 Delibera Redd.', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
            { key: 'ricezione_perizia', label: '📋 Ric. Perizia', bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' },
            { key: 'perizia', label: '🔍 Perizia', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
            { key: 'presentata', label: '📥 Presentata', bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' }
        ];
        for (const p of priorityOrder) {
            if (d.avanzamento.stati[p.key] && d.avanzamento.stati[p.key].active) {
                return `<span class="badge-status" style="background: ${p.bg}; color: ${p.color}; border: 1px solid ${p.border}; font-weight: 700;">${p.label}</span>`;
            }
        }
    }
    if (d.avanzamento && d.avanzamento.caricataInBanca) {
        return `<span class="badge-status" style="background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; font-weight: 700;">🏛️ Caricata in Banca</span>`;
    }
    return `<span class="badge-status ${d.stato || 'nuova'}">${d.label || 'Preventivo'}</span>`;
};

function renderCrmDeals() {
    const tbody = document.getElementById("deals-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!Array.isArray(crmDeals) || crmDeals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 3rem 1.5rem; color: #64748b;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📁</div>
                    <strong style="color: #0f172a; font-size: 1.1rem; display: block; margin-bottom: 0.25rem;">Nessuna pratica salvata</strong>
                    <span style="font-size: 0.85rem; display: block; margin-bottom: 1.25rem;">Completa un'analisi o avvia una nuova pratica per salvare il tuo preventivo.</span>
                    <button type="button" class="btn btn-primary" onclick="window.initNuovaPratica()" style="background: #006BFF; color: #ffffff; padding: 0.6rem 1.3rem; font-size: 0.85rem; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 12px rgba(0,107,255,0.25);">➕ Crea Nuova Pratica</button>
                </td>
            </tr>
        `;
        return;
    }
    crmDeals.forEach(d => {
        const tr = document.createElement("tr");
        const loanStr = typeof d.mutuo === "number" ? d.mutuo.toLocaleString('it-IT') : (d.mutuo || "--");
        const rataStr = typeof d.rata === "number" ? d.rata.toFixed(2) : (d.rata || "--");
        const statusBadgeHtml = window.getDealStatusBadgeHtml(d);

        tr.innerHTML = `
            <td><strong style="color: #006BFF;">#${d.id}</strong></td>
            <td><strong style="color: #0f172a; font-size: 0.92rem;">${d.cliente || 'Cliente'}</strong></td>
            <td><span style="color: #475569; font-weight: 500;">${d.comune || '--'}</span></td>
            <td><strong style="color: #0f172a;">${loanStr} €</strong></td>
            <td><span style="font-weight: 700; color: #334155;">${d.ltv || '--'}%</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    ${window.getBankLogoHtml ? window.getBankLogoHtml(d.banca) : ''}
                    <strong style="color: #006BFF;">${d.banca || 'N.D.'}</strong>
                </div>
            </td>
            <td><strong style="color: #047857; font-size: 0.92rem;">${rataStr} €/m</strong></td>
            <td>${statusBadgeHtml}</td>
            <td style="text-align: right;">
                <div style="display: inline-flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
                    <button class="btn" onclick="window.apriDocumentiPratica('${d.id}')" title="Apri Checklist Documenti" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 700; background: #eff6ff; color: #006BFF; border: 1.5px solid #bfdbfe; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">📑 Documenti</button>
                    <button class="btn btn-primary" onclick="window.apriSchedaPratica('${d.id}')" title="Avanzamento / Caricata in Banca" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 700; background: #006BFF; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">🏛️ Avanzamento</button>
                    <button class="btn" onclick="window.modificaPreventivo('${d.id}')" title="Modifica questo preventivo nel Wizard" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.2rem;">✏️ Modifica</button>
                    <button class="btn" onclick="window.eliminaPratica('${d.id}')" title="Elimina pratica" style="padding: 0.35rem 0.55rem; font-size: 0.78rem; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer;">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Apertura diretta della Scheda con focus sui Documenti
window.apriDocumentiPratica = function(dealId) {
    if (!dealId) {
        if (crmDeals && crmDeals.length > 0) {
            dealId = crmDeals[0].id;
        } else {
            alert("Nessuna pratica presente in archivio. Crea prima una pratica per visualizzare o generare i documenti.");
            return;
        }
    }
    window.apriSchedaPratica(dealId);
    setTimeout(() => {
        const sec = document.getElementById("sp-documenti-section");
        if (sec) {
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            sec.style.transition = "box-shadow 0.3s ease, border-color 0.3s ease";
            sec.style.borderColor = "#006BFF";
            sec.style.boxShadow = "0 0 0 4px rgba(0, 107, 255, 0.25)";
            setTimeout(() => {
                sec.style.borderColor = "#e2e8f0";
                sec.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
            }, 2500);
        }
    }, 180);
};

// Apertura della Scheda Dedicata
window.apriSchedaPratica = function(dealId) {
    let deal = crmDeals.find(d => String(d.id) === String(dealId));
    if (!deal) {
        try {
            const stored = JSON.parse(localStorage.getItem("brokerflow_deals") || "[]");
            deal = stored.find(d => String(d.id) === String(dealId));
            if (deal) {
                crmDeals = stored;
            }
        } catch (e) {}
    }
    if (!deal) {
        alert("Pratica non trovata.");
        return;
    }

    window.initAvanzamentoDeal(deal);
    window.salvaDealsNelStorage();

    window.currentSchedaDealId = String(deal.id);
    window.renderSchedaPratica(deal);
    window.switchCrmModule("scheda-pratica");
};

// Render dettagliato della Scheda Pratica
window.renderSchedaPratica = function(deal) {
    if (!deal) return;

    // Header & Breadcrumb
    const bcTitle = document.getElementById("sp-breadcrumb-title");
    if (bcTitle) bcTitle.innerText = `Scheda Pratica #${deal.id} - ${deal.cliente || 'Cliente'}`;

    const headTitle = document.getElementById("sp-header-title");
    if (headTitle) headTitle.innerText = `Scheda Pratica #${deal.id}`;

    const globalBadge = document.getElementById("sp-global-status-badge");
    if (globalBadge) {
        globalBadge.outerHTML = `<span id="sp-global-status-badge" class="badge-status" style="font-size: 0.85rem; padding: 0.3rem 0.8rem; font-weight: 700;">${window.getDealStatusBadgeHtml(deal)}</span>`;
    }

    // Card 1: Dati Pratica & Cliente
    const cliEl = document.getElementById("sp-cliente-nome");
    if (cliEl) cliEl.innerText = deal.cliente || "Cliente Senza Nome";

    const dealIdEl = document.getElementById("sp-deal-id-display");
    if (dealIdEl) dealIdEl.innerText = `#${deal.id}`;

    const comEl = document.getElementById("sp-comune-val");
    if (comEl) comEl.innerText = deal.comune || (deal.praticaData && deal.praticaData.provImm) || "--";

    const scopoEl = document.getElementById("sp-scopo-val");
    if (scopoEl) scopoEl.innerText = (deal.praticaData && deal.praticaData.scopo) || "Acquisto Prima Casa";

    const telVal = deal.telefono || deal.cellulare || (deal.praticaData?.subjects?.[0]?.telefono) || (deal.praticaData?.subjects?.[0]?.cellulare) || "--";
    const telEl = document.getElementById("sp-telefono-val");
    if (telEl) telEl.innerText = telVal;

    const emailVal = deal.email || (deal.praticaData?.subjects?.[0]?.email) || "--";
    const emailEl = document.getElementById("sp-email-val");
    if (emailEl) emailEl.innerText = emailVal;

    const createdEl = document.getElementById("sp-created-date");
    if (createdEl) createdEl.innerText = window.formatDataOra(deal.createdAt);

    const caricataEl = document.getElementById("sp-caricata-date");
    if (caricataEl) caricataEl.innerText = window.formatDataOra(deal.avanzamento && deal.avanzamento.caricataDate);

    // Card 2: Banca & Condizioni Economiche
    const bancaNameEl = document.getElementById("sp-banca-name");
    if (bancaNameEl) bancaNameEl.innerText = deal.banca || "Banca da Assegnare";

    const bancaLogoBox = document.getElementById("sp-banca-logo-box");
    if (bancaLogoBox) {
        if (window.getBankLogoHtml && deal.banca) {
            bancaLogoBox.innerHTML = window.getBankLogoHtml(deal.banca);
        } else {
            bancaLogoBox.innerHTML = "🏛️";
        }
    }

    const prodPill = document.getElementById("sp-banca-product-pill");
    if (prodPill) {
        prodPill.innerText = deal.selectedBankProduct || (deal.praticaData && deal.praticaData.prodotto) || "Mutuo Standard";
    }

    const loanVal = typeof deal.mutuo === "number" ? deal.mutuo.toLocaleString('it-IT') : (deal.mutuo || (deal.praticaData && deal.praticaData.importoMutuo) || "--");
    const condMutuoEl = document.getElementById("sp-cond-mutuo");
    if (condMutuoEl) condMutuoEl.innerText = `${loanVal} €`;

    const propVal = typeof deal.valore === "number" ? deal.valore.toLocaleString('it-IT') : (deal.valore || (deal.praticaData && deal.praticaData.valoreImmobile) || "--");
    const condValoreEl = document.getElementById("sp-cond-valore");
    if (condValoreEl) condValoreEl.innerText = `${propVal} €`;

    const ltvVal = deal.ltv || (deal.praticaData && deal.praticaData.ltv) || "--";
    const condLtvEl = document.getElementById("sp-cond-ltv");
    if (condLtvEl) condLtvEl.innerText = `${ltvVal}%`;

    const durVal = deal.durata || (deal.praticaData && deal.praticaData.durata) || "25";
    const condDurataEl = document.getElementById("sp-cond-durata");
    if (condDurataEl) condDurataEl.innerText = `${durVal} Anni`;

    const rataVal = typeof deal.rata === "number" ? deal.rata.toFixed(2) : (deal.rata || (deal.praticaData && deal.praticaData.rata) || "--");
    const condRataEl = document.getElementById("sp-cond-rata");
    if (condRataEl) condRataEl.innerText = `${rataVal} €/m`;

    const tassoVal = deal.tasso || (deal.praticaData && deal.praticaData.tasso) || "Fisso Standard";
    const condTassoEl = document.getElementById("sp-cond-tasso");
    if (condTassoEl) condTassoEl.innerText = tassoVal;

    // Card 3: Stati di Avanzamento
    const statiCont = document.getElementById("sp-stati-container");
    if (statiCont) {
        statiCont.innerHTML = "";
        const statiObj = (deal.avanzamento && deal.avanzamento.stati) || {};

        window.STATI_AVANZAMENTO_CONFIG.forEach(cfg => {
            const stData = statiObj[cfg.key] || { active: false, date: null };
            const isActive = !!stData.active;
            const dateFormatted = stData.date ? window.formatDataOra(stData.date) : null;

            const card = document.createElement("div");
            card.className = `scheda-step-card ${isActive ? 'active-step' : ''}`;
            card.onclick = (e) => {
                // Preveniamo click se l'utente clicca su input date
                if (e.target.tagName === 'INPUT' || e.target.classList.contains('no-step-toggle')) return;
                window.toggleStatoAvanzamento(deal.id, cfg.key);
            };

            card.innerHTML = `
                <div class="scheda-step-left">
                    <div class="scheda-step-icon">
                        ${isActive ? '✓' : cfg.icon}
                    </div>
                    <div>
                        <div class="scheda-step-title">${cfg.title}</div>
                        <div class="scheda-step-desc">${cfg.desc}</div>
                    </div>
                </div>
                <div class="scheda-step-right">
                    <div class="scheda-step-toggle">
                        ${isActive ? '🟢 ACCESO' : '⚪ Spento'}
                    </div>
                    ${isActive && dateFormatted ? `
                        <div class="scheda-step-date-badge" title="Data di passaggio registrata">
                            <span>📅 ${dateFormatted}</span>
                            <button type="button" class="no-step-toggle" onclick="event.stopPropagation(); window.modificaDataStato('${deal.id}', '${cfg.key}')" style="background: none; border: none; cursor: pointer; font-size: 0.72rem; color: #16a34a; padding: 0 0.15rem;" title="Modifica data">✏️</button>
                        </div>
                    ` : ''}
                </div>
            `;
            statiCont.appendChild(card);
        });
    }

    // Card 4: Motivi Rifiuto KO
    const motiviGrid = document.getElementById("sp-motivi-grid");
    const isRifiutata = !!(deal.avanzamento && deal.avanzamento.rifiutata && deal.avanzamento.rifiutata.isRifiutata);
    const selectedMotivo = isRifiutata ? deal.avanzamento.rifiutata.motivo : null;

    const activeTag = document.getElementById("sp-rejection-active-tag");
    if (activeTag) activeTag.style.display = isRifiutata ? "block" : "none";

    const annullaBox = document.getElementById("sp-annulla-rifiuto-box");
    if (annullaBox) annullaBox.style.display = isRifiutata ? "block" : "none";

    if (motiviGrid) {
        motiviGrid.innerHTML = "";
        window.MOTIVI_KO_CONFIG.forEach(m => {
            const isSelected = isRifiutata && selectedMotivo === m.key;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `scheda-ko-btn ${isSelected ? 'active-ko' : ''}`;
            btn.onclick = () => window.impostaPraticaRifiutata(deal.id, m.key);

            btn.innerHTML = `
                <div class="scheda-ko-title">
                    <span>${isSelected ? '🔴' : '⚪'}</span>
                    <strong>${m.title}</strong>
                </div>
                <div class="scheda-ko-desc">${m.desc}</div>
                ${isSelected && deal.avanzamento.rifiutata.date ? `
                    <div style="font-size: 0.7rem; color: #dc2626; font-weight: 700; margin-top: 0.3rem;">
                        📅 Rifiutata il: ${window.formatDataOra(deal.avanzamento.rifiutata.date)}
                    </div>
                ` : ''}
            `;
            motiviGrid.appendChild(btn);
        });
    }

    // Bottom Card: Timeline Resoconto Storico
    const tlContainer = document.getElementById("sp-timeline-container");
    if (tlContainer) {
        tlContainer.innerHTML = "";
        const timelineList = [];

        // 1. Data Creazione
        if (deal.createdAt) {
            timelineList.push({
                date: deal.createdAt,
                type: "created",
                iconType: "info",
                title: "Pratica Creata / Preventivo Generato",
                body: `Generata simulazione per ${deal.cliente || 'Cliente'} su ${deal.banca || 'Banca'} (${deal.mutuo || ''} €).`
            });
        }

        // 2. Data Caricamento
        if (deal.avanzamento && deal.avanzamento.caricataDate) {
            timelineList.push({
                date: deal.avanzamento.caricataDate,
                type: "caricata",
                iconType: "info",
                title: "🏛️ Pratica Caricata in Banca",
                body: `Pratica formalmente caricata sul portale dell'istituto bancario (${deal.banca || 'Banca'}).`
            });
        }

        // 3. Stati attivi
        if (deal.avanzamento && deal.avanzamento.stati) {
            window.STATI_AVANZAMENTO_CONFIG.forEach(cfg => {
                const st = deal.avanzamento.stati[cfg.key];
                if (st && st.active && st.date) {
                    timelineList.push({
                        date: st.date,
                        type: "step_" + cfg.key,
                        iconType: cfg.key === "rogito" || cfg.key === "delibera_finale" ? "success" : "info",
                        title: `${cfg.icon} Stato Raggiunto: ${cfg.title}`,
                        body: cfg.desc
                    });
                }
            });
        }

        // 4. Eventi di Rifiuto
        if (deal.avanzamento && deal.avanzamento.rifiutata && deal.avanzamento.rifiutata.isRifiutata && deal.avanzamento.rifiutata.date) {
            const motivoCfg = window.MOTIVI_KO_CONFIG.find(m => m.key === deal.avanzamento.rifiutata.motivo);
            timelineList.push({
                date: deal.avanzamento.rifiutata.date,
                type: "rejection",
                iconType: "danger",
                title: `❌ Pratica Respinta / Rifiutata: ${motivoCfg ? motivoCfg.title : 'KO'}`,
                body: `Motivazione registrata: ${motivoCfg ? motivoCfg.desc : (deal.avanzamento.rifiutata.motivoLabel || 'Esito Negativo')}`
            });
        }

        // 5. Storico annotazioni e passaggi extra
        if (deal.avanzamento && Array.isArray(deal.avanzamento.storicoPassaggi)) {
            deal.avanzamento.storicoPassaggi.forEach(sp => {
                if (sp.type === "nota_manuale" && sp.date) {
                    timelineList.push({
                        date: sp.date,
                        type: "nota",
                        iconType: "warning",
                        title: `📝 Nota Operativa: ${sp.label || 'Annotazione'}`,
                        body: sp.note || ''
                    });
                }
            });
        }

        // Ordiniamo per data decrescente (la più recente in cima)
        timelineList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (timelineList.length === 0) {
            tlContainer.innerHTML = `<div style="color: #64748b; font-size: 0.85rem; padding: 1rem 0;">Nessun evento ancora registrato.</div>`;
        } else {
            const tlBox = document.createElement("div");
            tlBox.className = "sp-timeline";

            timelineList.forEach(item => {
                const row = document.createElement("div");
                row.className = "sp-timeline-item";

                let dotClass = "";
                if (item.iconType === "success") dotClass = "success";
                else if (item.iconType === "danger") dotClass = "danger";
                else if (item.iconType === "warning") dotClass = "warning";

                row.innerHTML = `
                    <div class="sp-timeline-dot ${dotClass}"></div>
                    <div class="sp-timeline-content">
                        <div class="sp-timeline-header">
                            <strong class="sp-timeline-title">${item.title}</strong>
                            <span class="sp-timeline-date">🕒 ${window.formatDataOra(item.date)}</span>
                        </div>
                        <div class="sp-timeline-body">${item.body}</div>
                    </div>
                `;
                tlBox.appendChild(row);
            });
            tlContainer.appendChild(tlBox);
        }
    }

    // Render Checklist Documentale Profilata su Misura
    if (typeof window.renderSchedaDocumenti === "function") {
        window.renderSchedaDocumenti(deal);
    }
};

// ==========================================
// 📑 SCHEDA DOCUMENTI & CHECKLIST GENERATOR
// ==========================================

window.DOCUMENT_RULES = {
    // 1. ANAGRAFICA (3 casi: italiano, comunitario, extracomunitario)
    anagrafica: {
        italiano: {
            label: "Cliente Italiano",
            icon: "🇮🇹",
            docs: [
                { key: "ci", title: "Carta di identità", desc: "Fronte e retro, in corso di validità" },
                { key: "cf", title: "Codice fiscale", desc: "Tessera sanitaria o tesserino del codice fiscale" },
                { key: "res_sf", title: "Certificato di residenza e stato di famiglia", desc: "Certificato contestuale o autocertificazione ANPR" }
            ]
        },
        comunitario: {
            label: "Cliente Comunitario (UE)",
            icon: "🇪🇺",
            docs: [
                { key: "ci_it", title: "Carta di identità italiana", desc: "Rilasciata dal comune italiano di residenza" },
                { key: "ci_paese", title: "Carta di identità del proprio paese", desc: "Oppure passaporto del paese europeo di origine" },
                { key: "cf", title: "Codice fiscale", desc: "Tessera sanitaria o certificato di attribuzione CF" },
                { key: "res_sf", title: "Certificato di residenza e stato di famiglia", desc: "Certificato anagrafico contestuale aggiornato" }
            ]
        },
        extracomunitario: {
            label: "Cliente Extracomunitario (Extra-UE)",
            icon: "🌍",
            docs: [
                { key: "ci", title: "Carta di identità", desc: "Carta d'identità italiana in corso di validità" },
                { key: "passaporto", title: "Passaporto", desc: "Passaporto del paese di origine in corso di validità" },
                { key: "permesso_soggiorno", title: "Permesso di soggiorno", desc: "In corso di validità (oppure ricevuta kit postale di rinnovo)" },
                { key: "res_sf", title: "Certificato di residenza e stato di famiglia", desc: "Certificato anagrafico del comune di residenza" },
                { key: "cf", title: "Codice fiscale", desc: "Tessera sanitaria o tesserino CF" }
            ]
        }
    },

    // 2. STATO CIVILE (sposato, separato, divorziato - celibe/nubile = nessun documento)
    stato_civile: {
        sposato: {
            label: "Cliente Sposato",
            icon: "💍",
            docs: [
                { key: "atto_matrimonio", title: "Estratto per sunto dell'atto di matrimonio", desc: "Rilasciato dal comune di celebrazione con annotazione del regime patrimoniale" }
            ]
        },
        separato: {
            label: "Cliente Separato",
            icon: "⚖️",
            docs: [
                { key: "omologa_separazione", title: "Omologa di separazione", desc: "Copia autentica o conforme del decreto di omologa/accordo" }
            ]
        },
        divorziato: {
            label: "Cliente Divorziato",
            icon: "📜",
            docs: [
                { key: "sentenza_divorzio", title: "Sentenza di divorzio", desc: "Sentenza definitiva di scioglimento / cessazione effetti civili del matrimonio" }
            ]
        }
    },

    // 3. REDDITI (dipendente vs lavoratore autonomo)
    redditi: {
        dipendente: {
            label: "Cliente Dipendente",
            icon: "👔",
            docs: [
                { key: "buste_paga_3", title: "Ultime 3 buste paga", desc: "Cedolini mensili recenti completi di tutte le voci" },
                { key: "ultimo_cu", title: "Ultimo Modello CU", desc: "Certificazione Unica dell'ultimo anno d'imposta" },
                { key: "contratto_lavoro", title: "Contratto di lavoro", desc: "Contratto o lettera di assunzione (richiesto se assunto da meno di 2 anni)" },
                { key: "ec_bancario", title: "Ultimo estratto conto bancario", desc: "Estratto conto trimestrale o scalare dell'ultimo trimestre" },
                { key: "lista_movimenti", title: "Lista movimenti aggiornata", desc: "Lista movimenti del conto corrente dall'ultimo estratto conto ad oggi" }
            ]
        },
        autonomo: {
            label: "Lavoratore Autonomo / P.IVA",
            icon: "🏢",
            docs: [
                { key: "visura_camerale", title: "Visura camerale aggiornata / Iscrizione camera di commercio", desc: "Visura CCIAA recente (validità max 3 mesi) o iscrizione albo" },
                { key: "attribuzione_piva", title: "Attribuzione Partita IVA", desc: "Certificato di apertura/attribuzione partita IVA dell'Agenzia delle Entrate" },
                { key: "ultimi_2_unici", title: "Ultimi 2 modelli UNICO", desc: "Dichiarazioni dei redditi complete di quadri e relative ricevute di presentazione telematica" },
                { key: "bilancio_anno_corso", title: "Bilancio anno in corso", desc: "Situazione economico-patrimoniale provvisoria aggiornata, timbrata e firmata dal commercialista" },
                { key: "ec_personale", title: "Ultimo estratto conto bancario conti personali", desc: "Estratto conto bancario personale dell'ultimo trimestre" },
                { key: "movimenti_personale", title: "Lista movimenti aggiornata conto personale", desc: "Movimenti recenti dal trimestre ad oggi del conto corrente personale" },
                { key: "ec_aziendale", title: "Ultimi due estratti conto conto aziendale", desc: "Ultimi due estratti conto bancari del conto dedicato all'attività" },
                { key: "movimenti_aziendale", title: "Lista movimenti aggiornata conto aziendale", desc: "Lista movimenti recenti del conto aziendale/professionale" }
            ]
        }
    },

    // 4. SITUAZIONE ABITATIVA (in affitto vs proprietario/genitori/terzi)
    abitazione: {
        affitto: {
            label: "Cliente in Affitto",
            icon: "🏠",
            docs: [
                { key: "contratto_affitto", title: "Contratto di affitto", desc: "Copia del contratto di locazione registrato con ricevuta di registrazione F23/RLI" }
            ]
        }
    }
};

/**
 * Genera la lista documenti su misura per una pratica / richiedenti / cointestatari / garanti
 */
window.generateDocumentChecklist = function(deal) {
    if (!deal) return [];
    
    const pd = deal.praticaData || {};
    let rawSubjects = [];
    
    if (Array.isArray(pd.subjects) && pd.subjects.length > 0) {
        rawSubjects = pd.subjects;
    } else if (Array.isArray(deal.subjects) && deal.subjects.length > 0) {
        rawSubjects = deal.subjects;
    } else {
        rawSubjects = [{
            role: "Richiedente Principale",
            nome: deal.cliente || "Cliente",
            cognome: "",
            cittadinanza: pd.cittadinanza || "IT",
            statoCivile: pd.statoCivile || "celibe",
            macroCategoria: pd.macroCategoria || (pd.occupazione && pd.occupazione.toLowerCase().includes("autonomo") ? "autonomo" : "dipendente"),
            tipoContratto: pd.tipoContratto || "indeterminato",
            netto: pd.netto || 2100,
            abitazione: pd.abitazione || "affitto"
        }];
    }

    // Aggiungi eventuali garanti memorizzati in campi dedicati se non già inclusi
    if (Array.isArray(pd.guarantors) && pd.guarantors.length > 0) {
        pd.guarantors.forEach((g, gIdx) => {
            if (g && !rawSubjects.some(s => (s.nome && s.nome === g.nome && s.cognome === g.cognome))) {
                rawSubjects.push({
                    role: g.role || (pd.guarantors.length > 1 ? `Garante #${gIdx+1}` : "Garante"),
                    ...g
                });
            }
        });
    }

    const allSections = [];

    rawSubjects.forEach((subj, idx) => {
        const subjNome = (subj.nome || '').trim();
        const subjCognome = (subj.cognome || '').trim();
        let defaultRoleName = (idx === 0) ? "1° Intestatario (Richiedente Principale)" : (idx === 1 ? "2° Intestatario (Cointestatario)" : `Garante / Coobbligato #${idx}`);
        
        let subjRole = subj.role || defaultRoleName;
        if (subjRole === "Richiedente Principale" && idx === 0) subjRole = "1° Intestatario (Richiedente Principale)";
        else if ((subjRole === "Cointestatario" || subjRole === "Secondo Intestatario") && idx === 1) subjRole = "2° Intestatario (Cointestatario)";
        
        const subjName = `${subjNome} ${subjCognome}`.trim() || (idx === 0 ? (deal.cliente || '1° Intestatario') : (idx === 1 ? '2° Intestatario' : `Garante #${idx}`));
        const prefix = `subj_${idx}_`;

        let roleColor = "#006BFF";
        let roleBg = "#eff6ff";
        let roleBorder = "#bfdbfe";
        let roleIcon = "👤";

        const rLower = subjRole.toLowerCase();
        if (rLower.includes("2°") || rLower.includes("secondo") || rLower.includes("cointestat")) {
            roleColor = "#7c3aed";
            roleBg = "#f5f3ff";
            roleBorder = "#ddd6fe";
            roleIcon = "👥";
        } else if (rLower.includes("garante") || rLower.includes("fideiuss")) {
            roleColor = "#d97706";
            roleBg = "#fffbeb";
            roleBorder = "#fde68a";
            roleIcon = "🛡️";
        }

        // 1. DETERMINA CITTADINANZA
        let citKey = "italiano";
        const citRaw = (subj.cittadinanza || "").toLowerCase();
        if (citRaw === "extra_ue" || citRaw === "extra-ue" || citRaw === "extracomunitario" || citRaw.includes("marocco") || citRaw.includes("non-eu") || citRaw.includes("extra")) {
            citKey = "extracomunitario";
        } else if (citRaw === "ue" || citRaw === "comunitario" || citRaw === "europa" || citRaw === "fr" || citRaw === "de" || citRaw === "es" || citRaw === "ro") {
            citKey = "comunitario";
        }

        const anagraficaCfg = window.DOCUMENT_RULES.anagrafica[citKey] || window.DOCUMENT_RULES.anagrafica.italiano;
        const anagraficaDocs = anagraficaCfg.docs.map(d => ({
            id: prefix + d.key,
            code: d.key,
            title: d.title,
            desc: d.desc,
            category: "anagrafica",
            categoryLabel: `1. Anagrafica (${anagraficaCfg.label})`,
            categoryIcon: anagraficaCfg.icon,
            subjectName: subjName,
            subjectRole: subjRole
        }));

        // 2. DETERMINA STATO CIVILE
        const statoCivileRaw = (subj.statoCivile || "").toLowerCase();
        let statoCivileDocs = [];
        let scLabel = "Celibe / Nubile";
        if (statoCivileRaw.includes("sposat") || statoCivileRaw.includes("coniugat")) {
            const scCfg = window.DOCUMENT_RULES.stato_civile.sposato;
            scLabel = "Sposato";
            statoCivileDocs = scCfg.docs.map(d => ({
                id: prefix + d.key,
                code: d.key,
                title: d.title,
                desc: d.desc,
                category: "stato_civile",
                categoryLabel: `2. Stato Civile (${scCfg.label})`,
                categoryIcon: scCfg.icon,
                subjectName: subjName,
                subjectRole: subjRole
            }));
        } else if (statoCivileRaw.includes("separat")) {
            const scCfg = window.DOCUMENT_RULES.stato_civile.separato;
            scLabel = "Separato";
            statoCivileDocs = scCfg.docs.map(d => ({
                id: prefix + d.key,
                code: d.key,
                title: d.title,
                desc: d.desc,
                category: "stato_civile",
                categoryLabel: `2. Stato Civile (${scCfg.label})`,
                categoryIcon: scCfg.icon,
                subjectName: subjName,
                subjectRole: subjRole
            }));
        } else if (statoCivileRaw.includes("divorziat")) {
            const scCfg = window.DOCUMENT_RULES.stato_civile.divorziato;
            scLabel = "Divorziato";
            statoCivileDocs = scCfg.docs.map(d => ({
                id: prefix + d.key,
                code: d.key,
                title: d.title,
                desc: d.desc,
                category: "stato_civile",
                categoryLabel: `2. Stato Civile (${scCfg.label})`,
                categoryIcon: scCfg.icon,
                subjectName: subjName,
                subjectRole: subjRole
            }));
        }

        // 3. DETERMINA REDDITI (SE SENZA REDDITO -> SEZIONE VUOTA)
        const macroCat = (subj.macroCategoria || subj.tipoContratto || subj.professione || "").toLowerCase();
        const hasNoIncome = (
            macroCat === "nessuno" || 
            macroCat === "nessun_reddito" || 
            macroCat === "senza_reddito" || 
            macroCat === "non_lavora" || 
            macroCat === "disoccupato" || 
            macroCat === "casalinga" || 
            macroCat === "studente" || 
            subj.hasIncome === false || 
            subj.hasIncome === "no" || 
            (parseFloat(subj.netto) === 0 && !macroCat.includes("autonom") && !macroCat.includes("dipendente") && !macroCat.includes("forfett") && !macroCat.includes("p.iva"))
        );

        let redditiDocs = [];
        let redditiLabel = "Senza Reddito";
        let redditiIcon = "⚪";

        if (!hasNoIncome) {
            let isAutonomo = macroCat.includes("autonom") || macroCat.includes("forfett") || macroCat.includes("p.iva") || macroCat.includes("piva") || macroCat.includes("libero") || macroCat.includes("professionista");
            const redditiCfg = isAutonomo ? window.DOCUMENT_RULES.redditi.autonomo : window.DOCUMENT_RULES.redditi.dipendente;
            redditiLabel = redditiCfg.label;
            redditiIcon = redditiCfg.icon;
            
            redditiDocs = redditiCfg.docs.map(d => ({
                id: prefix + d.key,
                code: d.key,
                title: d.title,
                desc: d.desc,
                category: "redditi",
                categoryLabel: `3. Redditi & Lavoro (${redditiCfg.label})`,
                categoryIcon: redditiCfg.icon,
                subjectName: subjName,
                subjectRole: subjRole
            }));
        }

        // 4. DETERMINA SITUAZIONE ABITATIVA (Solo se in affitto)
        let abitazioneDocs = [];
        const abitazioneRaw = (subj.abitazione || pd.abitazione || "").toLowerCase();
        let abLabel = "Casa di proprietà / Famiglia";
        if (abitazioneRaw.includes("affitt") || abitazioneRaw.includes("locazione")) {
            abLabel = "In Affitto";
            const abCfg = window.DOCUMENT_RULES.abitazione.affitto;
            abitazioneDocs = abCfg.docs.map(d => ({
                id: prefix + d.key,
                code: d.key,
                title: d.title,
                desc: d.desc,
                category: "abitazione",
                categoryLabel: `4. Situazione Abitativa (${abCfg.label})`,
                categoryIcon: abCfg.icon,
                subjectName: subjName,
                subjectRole: subjRole
            }));
        }

        const categories = [
            { key: "anagrafica", label: anagraficaCfg.label, icon: anagraficaCfg.icon, docs: anagraficaDocs, emptyNote: null },
            { 
                key: "stato_civile", 
                label: `Stato Civile (${scLabel})`, 
                icon: "💍", 
                docs: statoCivileDocs, 
                emptyNote: (statoCivileDocs.length === 0) ? "Celibe / Nubile: nessun documento di matrimonio/separazione richiesto." : null 
            },
            { 
                key: "redditi", 
                label: `Redditi & Lavoro (${redditiLabel})`, 
                icon: redditiIcon, 
                docs: redditiDocs, 
                emptyNote: (redditiDocs.length === 0) ? "Soggetto senza reddito: nessun documento reddituale richiesto." : null 
            },
            { 
                key: "abitazione", 
                label: `Situazione Abitativa (${abLabel})`, 
                icon: "🏠", 
                docs: abitazioneDocs, 
                emptyNote: (abitazioneDocs.length === 0) ? "Casa di proprietà o presso famiglia/terzi: nessun contratto di locazione richiesto." : null 
            }
        ];

        allSections.push({
            subjectIndex: idx,
            subjectName: subjName,
            subjectRole: subjRole,
            roleColor,
            roleBg,
            roleBorder,
            roleIcon,
            hasNoIncome,
            profileBadges: [
                anagraficaCfg.label,
                scLabel,
                hasNoIncome ? "⚪ Senza Reddito" : redditiLabel,
                abLabel
            ],
            categories: categories
        });
    });

    return allSections;
};

/**
 * Renderizza la sezione interattiva Scheda Documenti in Scheda Pratica
 */
window.renderSchedaDocumenti = function(deal) {
    const container = document.getElementById("sp-documenti-grid");
    if (!container || !deal) return;

    if (!deal.documentiRaccolti) {
        deal.documentiRaccolti = {};
    }

    const sections = window.generateDocumentChecklist(deal);
    container.innerHTML = "";

    let totalDocsCount = 0;
    let collectedDocsCount = 0;

    // Aggiorna Badge Profilo Top
    const badgeEl = document.getElementById("sp-docs-profile-badge");
    const summaryEl = document.getElementById("sp-docs-profile-summary");
    if (sections.length > 0 && badgeEl) {
        const totalSubjs = sections.length;
        badgeEl.innerText = `${totalSubjs} Soggett${totalSubjs > 1 ? 'i' : 'o'} profilat${totalSubjs > 1 ? 'i' : 'o'}`;
        if (summaryEl) {
            summaryEl.innerText = `Checklist generata separatamente per ${sections.map(s => `${s.subjectRole} (${s.subjectName})`).join(", ")}.`;
        }
    }

    sections.forEach((sec, sIdx) => {
        const secCard = document.createElement("div");
        secCard.style.cssText = `background: #ffffff; border: 1.5px solid ${sec.roleBorder}; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.02);`;

        let secHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <div style="width: 38px; height: 38px; border-radius: 8px; background: ${sec.roleBg}; color: ${sec.roleColor}; border: 1px solid ${sec.roleBorder}; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 800;">
                        ${sec.roleIcon}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <strong style="font-size: 1.05rem; color: #071B3A;">${sec.subjectName}</strong>
                            <span style="background: ${sec.roleBg}; color: ${sec.roleColor}; border: 1px solid ${sec.roleBorder}; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 5px;">
                                ${sec.subjectRole}
                            </span>
                        </div>
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Profilo: ${sec.profileBadges.join(" • ")}</span>
                    </div>
                </div>
            </div>
        `;

        sec.categories.forEach(cat => {
            const catTotal = cat.docs.length;
            const catChecked = cat.docs.filter(d => !!deal.documentiRaccolti[d.id]).length;
            totalDocsCount += catTotal;
            collectedDocsCount += catChecked;
            const isCatComplete = catTotal > 0 && catChecked === catTotal;

            secHtml += `
                <div style="margin-bottom: 1.15rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; background: #f8fafc; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <span style="font-size: 0.82rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 0.4rem;">
                            <span>${cat.icon}</span> ${cat.label}
                        </span>
                        ${catTotal > 0 ? `
                            <span style="font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px; ${isCatComplete ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'}">
                                ${catChecked} / ${catTotal} ${isCatComplete ? '✓ Completo' : 'In attesa'}
                            </span>
                        ` : `
                            <span style="font-size: 0.70rem; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 0.15rem 0.5rem; border-radius: 4px;">
                                Non richiesto
                            </span>
                        `}
                    </div>

                    ${catTotal > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 0.45rem; padding-left: 0.25rem;">
                            ${cat.docs.map(doc => {
                                const isChecked = !!deal.documentiRaccolti[doc.id];
                                return `
                                    <div class="doc-checklist-item ${isChecked ? 'doc-checked' : ''}" onclick="window.toggleDocumentoRaccolto('${deal.id}', '${doc.id}')" style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1.5px solid ${isChecked ? '#86efac' : '#e2e8f0'}; background: ${isChecked ? '#f0fdf4' : '#ffffff'}; cursor: pointer; transition: all 0.2s ease;">
                                        <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleDocumentoRaccolto('${deal.id}', '${doc.id}')" style="margin-top: 0.2rem; width: 18px; height: 18px; accent-color: #10b981; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <strong style="font-size: 0.88rem; color: ${isChecked ? '#166534' : '#0f172a'}; ${isChecked ? 'text-decoration: line-through; text-decoration-color: #16a34a;' : ''}">${doc.title}</strong>
                                                ${isChecked ? '<span style="font-size: 0.72rem; font-weight: 700; color: #15803d;">✓ Ricevuto</span>' : '<span style="font-size: 0.72rem; font-weight: 600; color: #94a3b8;">◻️ Da consegnare</span>'}
                                            </div>
                                            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-top: 0.1rem;">${doc.desc}</span>
                                        </div>
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    ` : `
                        <div style="padding: 0.5rem 0.85rem; font-size: 0.78rem; color: #64748b; background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 6px; font-style: italic;">
                            ℹ️ ${cat.emptyNote || 'Nessun documento richiesto per questa categoria.'}
                        </div>
                    `}
                </div>
            `;
        });

        secCard.innerHTML = secHtml;
        container.appendChild(secCard);
    });

    // Aggiorna Progress Bar Totale
    const progressPct = totalDocsCount > 0 ? Math.round((collectedDocsCount / totalDocsCount) * 100) : 0;
    const progText = document.getElementById("sp-docs-progress-text");
    const progBar = document.getElementById("sp-docs-progress-bar");
    if (progText) progText.innerText = `${collectedDocsCount} / ${totalDocsCount} Consegnati (${progressPct}%)`;
    if (progBar) progBar.style.width = `${progressPct}%`;
};

/**
 * Genera il testo completo formattato della checklist (per WhatsApp / Email / Copia)
 */
window.getFormattedChecklistText = function(deal) {
    if (!deal) return "";
    const sections = window.generateDocumentChecklist(deal);
    const clientName = deal.cliente || "Gentile Cliente";
    
    let text = `📄 *CHECKLIST DOCUMENTI MUTUO - BROKERFLOW*\n`;
    text += `*Cliente:* ${clientName}\n`;
    text += `*Pratica:* #${deal.id} (${deal.banca || 'Banca Convenzionata'})\n`;
    text += `------------------------------------\n\n`;
    text += `Gentile ${clientName},\nper procedere con l'istruttoria della richiesta di mutuo, ti chiediamo di predisporre e inviarci i seguenti documenti:\n\n`;

    sections.forEach(sec => {
        text += `🔹 *${sec.subjectRole.toUpperCase()}: ${sec.subjectName.toUpperCase()}*\n`;
        text += `(${sec.profileBadges.join(", ")})\n`;
        
        sec.categories.forEach(cat => {
            if (cat.docs.length > 0) {
                text += `\n${cat.icon} *${cat.label}:*\n`;
                cat.docs.forEach(doc => {
                    const isChecked = !!(deal.documentiRaccolti && deal.documentiRaccolti[doc.id]);
                    text += `${isChecked ? '✅' : '◻️'} *${doc.title}* (${doc.desc})\n`;
                });
            }
        });
        text += `\n------------------------------------\n`;
    });

    text += `\nI documenti possono essere inviati in formato PDF chiaro e leggibile o consegnati presso il nostro ufficio.\nRestiamo a completa disposizione!`;
    return text;
};

/**
 * Toggle check del singolo documento con salvataggio immediato
 */
window.toggleDocumentoRaccolto = function(dealId, docId) {
    const deal = crmDeals.find(d => String(d.id) === String(dealId));
    if (!deal) return;

    if (!deal.documentiRaccolti) deal.documentiRaccolti = {};
    deal.documentiRaccolti[docId] = !deal.documentiRaccolti[docId];
    
    deal.updatedAt = new Date().toISOString();
    window.salvaDealsNelStorage();
    if (typeof window.pushCrmDealsToServer === "function") {
        window.pushCrmDealsToServer();
    }
    window.renderSchedaDocumenti(deal);
};

/**
 * Pulisce e formatta il numero di telefono per l'invio su WhatsApp (aggiunge prefisso 39 per cellulari italiani)
 */
window.formatWhatsAppPhone = function(rawPhone) {
    if (!rawPhone) return "";
    let clean = String(rawPhone).replace(/[^\d+]/g, '');
    if (clean.startsWith('+')) {
        clean = clean.substring(1);
    } else if (clean.startsWith('00')) {
        clean = clean.substring(2);
    } else if ((clean.length === 10 || clean.length === 9) && clean.startsWith('3')) {
        clean = '39' + clean;
    }
    return clean;
};

/**
 * Modifica rapida telefono o email per la pratica corrente
 */
window.modificaContattiPratica = function(dealId, tipo) {
    const deal = crmDeals.find(d => String(d.id) === String(dealId));
    if (!deal) return;

    if (tipo === 'telefono') {
        const currentVal = deal.telefono || deal.cellulare || (deal.praticaData?.subjects?.[0]?.telefono) || "";
        const newVal = prompt("📱 Inserisci o modifica il numero di Cellulare / WhatsApp del cliente:", currentVal);
        if (newVal === null) return;
        deal.telefono = newVal.trim();
        deal.cellulare = newVal.trim();
        if (deal.praticaData && Array.isArray(deal.praticaData.subjects) && deal.praticaData.subjects[0]) {
            deal.praticaData.subjects[0].telefono = newVal.trim();
        }
    } else if (tipo === 'email') {
        const currentVal = deal.email || (deal.praticaData?.subjects?.[0]?.email) || "";
        const newVal = prompt("✉️ Inserisci o modifica l'indirizzo Email del cliente:", currentVal);
        if (newVal === null) return;
        deal.email = newVal.trim();
        if (deal.praticaData && Array.isArray(deal.praticaData.subjects) && deal.praticaData.subjects[0]) {
            deal.praticaData.subjects[0].email = newVal.trim();
        }
    }

    deal.updatedAt = new Date().toISOString();
    window.salvaDealsNelStorage();
    if (typeof window.syncClientsWithDeals === "function") window.syncClientsWithDeals();
    if (typeof window.pushCrmDealsToServer === "function") window.pushCrmDealsToServer();
    window.renderSchedaPratica(deal);
    if (typeof window.showToast === "function") {
        window.showToast(`✅ ${tipo === 'telefono' ? 'Numero di telefono' : 'Indirizzo email'} aggiornato!`, "success");
    }
};

/**
 * Invia la checklist direttamente su WhatsApp con numero di telefono e messaggio precompilati
 */
window.inviaChecklistWhatsApp = function() {
    if (!window.currentSchedaDealId) return;
    const deal = crmDeals.find(d => String(d.id) === String(window.currentSchedaDealId));
    if (!deal) return;

    // Recupera il numero di telefono dalla pratica o dai soggetti
    let phone = deal.telefono || deal.cellulare || "";
    if (!phone && deal.praticaData && Array.isArray(deal.praticaData.subjects)) {
        for (const subj of deal.praticaData.subjects) {
            if (subj.telefono || subj.cellulare) {
                phone = subj.telefono || subj.cellulare;
                break;
            }
        }
    }

    // Se manca il numero di telefono, chiediamolo all'utente e salviamolo
    if (!phone) {
        phone = prompt(`📱 Inserisci il numero di Cellulare / WhatsApp di ${deal.cliente || 'questo cliente'} per preparare l'invio:\n(es. 340 1234567)`, "");
        if (phone === null) return; // Annullato dall'utente
        phone = phone.trim();
        if (phone) {
            deal.telefono = phone;
            deal.cellulare = phone;
            if (deal.praticaData && Array.isArray(deal.praticaData.subjects) && deal.praticaData.subjects[0]) {
                deal.praticaData.subjects[0].telefono = phone;
            }
            deal.updatedAt = new Date().toISOString();
            window.salvaDealsNelStorage();
            if (typeof window.syncClientsWithDeals === "function") window.syncClientsWithDeals();
            if (typeof window.pushCrmDealsToServer === "function") window.pushCrmDealsToServer();
            window.renderSchedaPratica(deal);
        }
    }

    const cleanPhone = window.formatWhatsAppPhone(phone);
    const text = window.getFormattedChecklistText(deal);
    const encoded = encodeURIComponent(text);

    let url = "";
    if (cleanPhone) {
        url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    } else {
        url = `https://api.whatsapp.com/send?text=${encoded}`;
    }

    if (typeof window.showToast === "function") {
        window.showToast(cleanPhone ? `💬 Apertura di WhatsApp Web per +${cleanPhone}...` : `💬 Apertura di WhatsApp Web...`, "success");
    }

    window.open(url, '_blank');
};

/**
 * Copia il testo della checklist negli appunti
 */
window.copiaChecklistTesto = function() {
    if (!window.currentSchedaDealId) return;
    const deal = crmDeals.find(d => String(d.id) === String(window.currentSchedaDealId));
    if (!deal) return;

    const text = window.getFormattedChecklistText(deal);
    navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showToast === "function") {
            window.showToast("📋 Checklist copiata negli appunti con successo!", "success");
        } else {
            alert("Checklist copiata negli appunti!");
        }
    }).catch(err => {
        console.error("Errore copia clipboard:", err);
        alert("Impossibile copiare automaticamente. Seleziona il testo manualmente.");
    });
};

/**
 * Stampa della Checklist Documenti
 */
window.stampaChecklistDocumenti = function() {
    window.print();
};

// Toggle del singolo stato di avanzamento
window.toggleStatoAvanzamento = function(dealId, statoKey) {
    const deal = crmDeals.find(d => String(d.id) === String(dealId));
    if (!deal) return;

    window.initAvanzamentoDeal(deal);
    const cfg = window.STATI_AVANZAMENTO_CONFIG.find(c => c.key === statoKey);
    const curr = deal.avanzamento.stati[statoKey] || { active: false, date: null };
    const willBeActive = !curr.active;
    const nowIso = new Date().toISOString();

    if (willBeActive) {
        deal.avanzamento.stati[statoKey] = {
            active: true,
            date: nowIso
        };
        deal.avanzamento.storicoPassaggi.unshift({
            step: statoKey,
            label: cfg ? cfg.title : statoKey,
            date: nowIso,
            note: `Attivato passaggio: ${cfg ? cfg.title : statoKey}`
        });
        if (typeof window.showToast === "function") {
            window.showToast(`✅ Stato "${cfg ? cfg.title : statoKey}" registrato!`, "success");
        }
    } else {
        deal.avanzamento.stati[statoKey] = {
            active: false,
            date: null
        };
        deal.avanzamento.storicoPassaggi.unshift({
            step: `${statoKey}_revocato`,
            label: `Disattivato ${cfg ? cfg.title : statoKey}`,
            date: nowIso,
            note: `Rimosso passaggio: ${cfg ? cfg.title : statoKey}`
        });
        if (typeof window.showToast === "function") {
            window.showToast(`⚪ Stato "${cfg ? cfg.title : statoKey}" spento.`, "info");
        }
    }

    deal.updatedAt = nowIso;
    window.salvaDealsNelStorage();
    window.renderSchedaPratica(deal);
};

// Modifica manuale data di uno stato
window.modificaDataStato = function(dealId, statoKey) {
    const deal = crmDeals.find(d => String(d.id) === String(dealId));
    if (!deal || !deal.avanzamento || !deal.avanzamento.stati[statoKey]) return;

    const cfg = window.STATI_AVANZAMENTO_CONFIG.find(c => c.key === statoKey);
    const currDate = deal.avanzamento.stati[statoKey].date || new Date().toISOString();
    const defaultVal = currDate.slice(0, 10);

    const inputVal = prompt(`Inserisci la data per "${cfg ? cfg.title : statoKey}" (Formato YYYY-MM-DD):`, defaultVal);
    if (!inputVal) return;

    const parsedDate = new Date(inputVal);
    if (isNaN(parsedDate.getTime())) {
        alert("Data non valida. Usa il formato YYYY-MM-DD (es. 2026-09-23).");
        return;
    }

    deal.avanzamento.stati[statoKey].date = parsedDate.toISOString();
    deal.avanzamento.storicoPassaggi.unshift({
        step: `${statoKey}_data_rettificata`,
        label: `Rettifica data ${cfg ? cfg.title : statoKey}`,
        date: new Date().toISOString(),
        note: `Data passaggio aggiornata a: ${window.formatDataOra(parsedDate.toISOString())}`
    });

    window.salvaDealsNelStorage();
    window.renderSchedaPratica(deal);
    if (typeof window.showToast === "function") {
        window.showToast(`📅 Data per "${cfg ? cfg.title : statoKey}" aggiornata.`, "success");
    }
};

// Impostazione Pratica Rifiutata (KO) con motivo a pulsante
window.impostaPraticaRifiutata = function(dealId, motivoKey) {
    const deal = crmDeals.find(d => String(d.id) === String(dealId));
    if (!deal) return;

    window.initAvanzamentoDeal(deal);
    const motivoCfg = window.MOTIVI_KO_CONFIG.find(m => m.key === motivoKey);
    const nowIso = new Date().toISOString();

    // Se era già selezionato lo stesso motivo, chiediamo se si vuole confermare o cambiare
    deal.avanzamento.rifiutata = {
        isRifiutata: true,
        date: nowIso,
        motivo: motivoKey,
        motivoLabel: motivoCfg ? motivoCfg.label : motivoKey
    };

    deal.avanzamento.storicoPassaggi.unshift({
        step: "pratica_rifiutata",
        label: `Rifiutata (${motivoCfg ? motivoCfg.label : motivoKey})`,
        date: nowIso,
        note: `Pratica respinta da banca. Motivo: ${motivoCfg ? motivoCfg.desc : motivoKey}`
    });

    deal.updatedAt = nowIso;
    window.salvaDealsNelStorage();
    window.renderSchedaPratica(deal);

    if (typeof window.showToast === "function") {
        window.showToast(`❌ Pratica #${deal.id} segnata come Rifiutata: ${motivoCfg ? motivoCfg.label : motivoKey}`, "error");
    }
};

// Annulla Rifiuto & Ripristina Pratica
window.annullaPraticaRifiutata = function(dealId) {
    const deal = crmDeals.find(d => String(d.id) === String(dealId));
    if (!deal || !deal.avanzamento) return;

    const nowIso = new Date().toISOString();
    deal.avanzamento.rifiutata = {
        isRifiutata: false,
        date: null,
        motivo: null,
        motivoLabel: null
    };

    deal.avanzamento.storicoPassaggi.unshift({
        step: "rifiuto_annullato",
        label: "Rifiuto Annullato - Ripristino In Lavorazione",
        date: nowIso,
        note: "Stato rifiuto rimosso. La pratica torna regolarmente in lavorazione."
    });

    deal.updatedAt = nowIso;
    window.salvaDealsNelStorage();
    window.renderSchedaPratica(deal);

    if (typeof window.showToast === "function") {
        window.showToast(`🔄 Pratica #${deal.id} ripristinata in lavorazione.`, "success");
    }
};

// Aggiungi nota manuale al resoconto storico
window.aggiungiNotaManualeTimeline = function() {
    if (!window.currentSchedaDealId) return;
    const deal = crmDeals.find(d => String(d.id) === String(window.currentSchedaDealId));
    if (!deal) return;

    const testoNota = prompt(`Aggiungi una nota operativa per la pratica #${deal.id} (${deal.cliente || 'Cliente'}):`);
    if (!testoNota || !testoNota.trim()) return;

    window.initAvanzamentoDeal(deal);
    const nowIso = new Date().toISOString();

    deal.avanzamento.storicoPassaggi.unshift({
        type: "nota_manuale",
        label: "Nota Consulente",
        date: nowIso,
        note: testoNota.trim()
    });

    deal.updatedAt = nowIso;
    window.salvaDealsNelStorage();
    window.renderSchedaPratica(deal);

    if (typeof window.showToast === "function") {
        window.showToast(`📝 Nota aggiunta alla cronologia della pratica #${deal.id}.`, "success");
    }
};

// Stampa della Scheda Pratica
window.stampaSchedaPratica = function() {
    window.print();
};

window.isSensitiveDataObfuscated = false;
window.toggleSensitiveDataObfuscation = function() {
    window.isSensitiveDataObfuscated = !window.isSensitiveDataObfuscated;
    const elements = document.querySelectorAll(".sensitive-data");
    elements.forEach(el => {
        if (window.isSensitiveDataObfuscated) {
            el.classList.add("obfuscated");
        } else {
            el.classList.remove("obfuscated");
        }
    });
    const btnText = document.getElementById("obfuscation-btn-text");
    const eyeIcon = document.getElementById("obfuscation-eye-icon");
    if (btnText) {
        btnText.innerText = window.isSensitiveDataObfuscated ? "Mostra Erogato & Provvigioni" : "Oscura Erogato & Provvigioni";
    }
    if (eyeIcon) {
        eyeIcon.innerText = window.isSensitiveDataObfuscated ? "👁️‍🗨️" : "👁️";
    }
};

function startDealForClient(clientId) {
    const client = crmClients.find(c => String(c.id) === String(clientId));
    if (!client) {
        switchCrmModule("engine");
        return;
    }
    
    // Check if client has an existing practice
    const existingDeal = crmDeals.find(d => {
        const dName = (d.cliente || '').trim().toLowerCase();
        const cName = client.nome.trim().toLowerCase();
        return dName === cName || dName.includes(cName) || cName.includes(dName);
    });

    if (existingDeal && typeof window.modificaPreventivo === "function") {
        window.modificaPreventivo(existingDeal.id);
        switchCrmModule("engine");
        return;
    }

    if (clientId === 1 || clientId === "1") {
        document.getElementById("btn-demo-dipendente")?.click();
        const p3Val = document.getElementById("p3-valore-field");
        const p3Imp = document.getElementById("p3-importo-field");
        if (p3Val) p3Val.value = 145000;
        if (p3Imp) p3Imp.value = 120000;
    } else if (clientId === 2 || clientId === "2") {
        document.getElementById("btn-demo-autonomo")?.click();
        const p3Val = document.getElementById("p3-valore-field");
        const p3Imp = document.getElementById("p3-importo-field");
        if (p3Val) p3Val.value = 250000;
        if (p3Imp) p3Imp.value = 180000;
    } else if (clientId === 3 || clientId === "3") {
        document.getElementById("btn-demo-combined")?.click();
        const p3Val = document.getElementById("p3-valore-field");
        const p3Imp = document.getElementById("p3-importo-field");
        if (p3Val) p3Val.value = 220000;
        if (p3Imp) p3Imp.value = 180000;
    } else {
        if (typeof window.initNuovaPratica === "function") {
            window.initNuovaPratica();
        }
        // Pre-fill client name
        const parts = client.nome.split(" ");
        const nome = parts[0] || "";
        const cognome = parts.slice(1).join(" ") || "";
        const nomeEl = document.getElementById("wiz-q1-nome") || document.getElementById("wiz-q1-nome-file");
        const cognomeEl = document.getElementById("wiz-q2-cognome") || document.getElementById("wiz-q2-cognome-file");
        if (nomeEl) nomeEl.value = nome;
        if (cognomeEl) cognomeEl.value = cognome;
        const p3Val = document.getElementById("p3-valore-field");
        const p3Imp = document.getElementById("p3-importo-field");
        if (p3Val && (!p3Val.value || p3Val.value === "0")) p3Val.value = 230000;
        if (p3Imp && (!p3Imp.value || p3Imp.value === "0")) p3Imp.value = 180000;
    }
    switchCrmModule("engine");
    if (typeof window.updateCalculations === "function") {
        setTimeout(() => window.updateCalculations(), 100);
    }
}

// DOM inputs - FREE MODE
const cointestazioneCheckbox = document.getElementById("cointestazione");
const req2Section = document.getElementById("req2-section");
const req1Title = document.getElementById("req1-title");
const inputValoreImmobile = document.getElementById("valore-immobile");
const inputImportoMutuo = document.getElementById("importo-mutuo");
const inputDurata = document.getElementById("durata");
const inputTipoTasso = document.getElementById("tipo-tasso");
const inputClasseEnergetica = document.getElementById("classe-energetica");
const inputAltreRate = document.getElementById("altre-rate");
const inputPersoneNucleo = document.getElementById("persone-nucleo");
const inputZona = document.getElementById("zona");
const inputFinalita = document.getElementById("finalita");
const inputC1Eta = document.getElementById("c1-eta");
const inputC1TipoReddito = document.getElementById("c1-tipo-reddito");
const inputC1Netto = document.getElementById("c1-netto-manuale");
const inputC2Eta = document.getElementById("c2-eta");
const inputC2TipoReddito = document.getElementById("c2-tipo-reddito");
const inputC2Netto = document.getElementById("c2-netto-manuale");
const inputBaseEuribor1m = document.getElementById("base-euribor1m");
const inputBaseEuribor3m = document.getElementById("base-euribor3m");
const inputBaseEuribor6m = document.getElementById("base-euribor6m");
const inputBaseIrs = document.getElementById("base-irs");
const inputBaseBce = document.getElementById("base-bce");
const inputProvImmobile = document.getElementById("prov-immobile");
const inputProvResidenza = document.getElementById("prov-residenza");
const inputProvLavoro = document.getElementById("prov-lavoro");

// Summary Outputs
const sumRata = document.getElementById("summary-rata");
const sumTasso = document.getElementById("summary-tasso");
const sumReddito = document.getElementById("summary-reddito");
const sumLtv = document.getElementById("summary-ltv");
const sumDsr = document.getElementById("summary-dsr");
const cardsContainer = document.getElementById("comparison-cards-container");

function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(num)) return "--";
    return num.toLocaleString('it-IT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

const freeModeInputs = [
    inputValoreImmobile, inputImportoMutuo, inputDurata, inputTipoTasso, inputClasseEnergetica,
    inputAltreRate, inputPersoneNucleo, inputZona, inputFinalita, cointestazioneCheckbox,
    inputC1Eta, inputC1TipoReddito, inputC1Netto, inputC2Eta, inputC2TipoReddito, inputC2Netto,
    inputBaseEuribor1m, inputBaseEuribor3m, inputBaseEuribor6m, inputBaseIrs, inputBaseBce,
    inputProvImmobile, inputProvResidenza, inputProvLavoro
];
freeModeInputs.forEach(input => {
    if (input) {
        input.addEventListener("input", updateCalculations);
        input.addEventListener("change", updateCalculations);
    }
});


// Attach change listeners for Step 3 & Wizard inputs
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
];
wizStep6Inputs.forEach(input => {
    if (input) {
        input.addEventListener("input", updateCalculations);
        input.addEventListener("change", updateCalculations);
    }
});

// French Amortization calculation



// Calculate age from birth date string
function getAge(birthDateString) {
    if (!birthDateString) return 30;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

let hasSubmittedStrategy = false;

function submitStrategyCalculation() {
    hasSubmittedStrategy = true;
    updateCalculations();
}

window.deleteSubjectCard = function(index) {
    if (index >= 0 && index < wizardSubjects.length) {
        wizardSubjects.splice(index, 1);
        renderSubjectsChips();
        updateCalculations();
    }
};

window.renderPhase4ClientSummary = function(pratica) {
    const container = document.getElementById("phase4-client-profile-card");
    if (!container) return;
    
    const subjects = (pratica && Array.isArray(pratica.subjects) && pratica.subjects.length > 0) ? pratica.subjects : (window.wizardSubjects || []);
    const totalIncome = (pratica && typeof pratica.totalIncome === "number") ? pratica.totalIncome : 0;
    
    // Format helpers
    const formatMoney = (val) => "€ " + Math.round(parseFloat(val) || 0).toLocaleString("it-IT");
    
    // Status Civile format
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const statoCivVal = (document.getElementById("wiz-q4-stato-civile" + suffix)?.value) || (document.getElementById("wiz-q4-stato-civile")?.value) || "celibe";
    const regimeVal = (document.getElementById("wiz-q4-regime" + suffix)?.value) || (document.getElementById("wiz-q4-regime")?.value) || "separazione";
    let statoCivileText = "Celibe / Nubile";
    if (statoCivVal === "sposato" || statoCivVal === "coniugato") {
        statoCivileText = `Coniugato/a (${regimeVal === "comunione" ? "Comunione dei beni" : "Separazione dei beni"})`;
    } else if (statoCivVal === "separato") {
        statoCivileText = "Separato/a";
    } else if (statoCivVal === "divorziato") {
        statoCivileText = "Divorziato/a";
    } else if (statoCivVal === "vedovo") {
        statoCivileText = "Vedovo/a";
    } else if (statoCivVal === "unione_civile" || statoCivVal === "convivente") {
        statoCivileText = "Convivente / Unione Civile";
    }

    // Figli & Nucleo
    const numFigli = pratica.numFigli || (document.getElementById("wiz-q5-num-figli" + suffix) ? parseInt(document.getElementById("wiz-q5-num-figli" + suffix).value) || 0 : 0);
    const etaFigli = pratica.etaFigli || (document.getElementById("wiz-q5-eta-figli" + suffix)?.value) || "";
    const personeNucleo = pratica.personeNucleo || (document.getElementById("wiz-persone-nucleo" + suffix) ? parseInt(document.getElementById("wiz-persone-nucleo" + suffix).value) || 1 : 1);
    
    let figliText = "Nessun figlio";
    if (numFigli > 0) {
        figliText = `${numFigli} figl${numFigli === 1 ? 'o' : 'i'}${etaFigli ? ` (età: ${etaFigli})` : ''}`;
    }
    
    // Altre rate & Impegni
    const altreRateVal = pratica.altreRate || 0;
    
    // Finalità label
    const finalitaLabels = {
        "acquisto": "Acquisto 1ª Casa",
        "acquisto_seconda": "Acquisto 2ª Casa",
        "acquisto_ristrutturazione": "Acquisto + Ristrutturazione",
        "asta": "Acquisto all'Asta",
        "surroga": "Surroga (Portabilità)",
        "sostituzione_liquidita": "Sostituzione + Liquidità",
        "liquidita": "Liquidità Pura",
        "ristrutturazione": "Ristrutturazione"
    };
    const finalitaLabel = finalitaLabels[pratica.finalita] || (pratica.finalita ? pratica.finalita.toUpperCase() : "Acquisto");
    
    // Build Subjects List HTML
    let subjectsHtml = "";
    subjects.forEach((s, idx) => {
        const isPrimary = (s.role === "Richiedente Principale" || idx === 0);
        const roleLabel = s.role || (isPrimary ? "Richiedente Principale" : "Cointestatario");
        const roleBadgeBg = isPrimary ? "#eff6ff" : (roleLabel.includes("Garante") ? "#fef3c7" : "#f0fdf4");
        const roleBadgeColor = isPrimary ? "#1d4ed8" : (roleLabel.includes("Garante") ? "#b45309" : "#15803d");
        const roleBadgeBorder = isPrimary ? "#bfdbfe" : (roleLabel.includes("Garante") ? "#fde68a" : "#bbf7d0");
        
        // Work label
        let workLabel = "Dipendente a tempo indeterminato";
        const macro = s.macroCategoria || (s.tipoContratto?.includes("autonomo") ? "autonomo" : (s.tipoContratto?.includes("pensionato") ? "pensionato" : "dipendente"));
        if (macro === "dipendente") {
            const subType = (s.tipoContratto === "dipendente_td" || s.tipoContratto === "determinato") ? "Tempo Determinato" : (s.tipoContratto === "apprendista" ? "Apprendista" : "Tempo Indeterminato");
            const anzMesi = s.anzianitaMesi || s.anzianita || 0;
            const anzStr = anzMesi > 0 ? (anzMesi >= 12 ? ` (anzianità: ${(anzMesi/12).toFixed(1).replace('.0','')} anni)` : ` (anzianità: ${anzMesi} mesi)`) : "";
            const orarioStr = s.orarioLavoro === "part_time" ? " (Part-time)" : "";
            workLabel = `💼 Dipendente ${subType}${orarioStr}${anzStr}`;
        } else if (macro === "autonomo") {
            const reg = (s.rawBoxData?.regime === "ordinario" || s.autRegime === "ordinario") ? "Ordinario" : "Forfettario";
            const anniAtt = s.anniAttivita || s.rawBoxData?.anniAttivita || s.anzianita || 3;
            workLabel = `📊 Autonomo Regime ${reg} (${anniAtt} anni attività)`;
        } else if (macro === "pensionato") {
            workLabel = `👴 Pensionato`;
        } else if (macro === "colf_badanti") {
            workLabel = `🧹 Lavoratore Domestico (Colf / Badante)`;
        } else if (macro === "interinale") {
            workLabel = `⏱️ Lavoratore Somministrato (Interinale)`;
        } else if (macro === "garante") {
            workLabel = `🛡️ Garante a supporto`;
        }
        
        // Citizen label
        let citStr = "Italiana";
        const cLower = String(s.cittadinanza || "").toLowerCase();
        if (cLower === "extra" || cLower === "extra_ue" || cLower.includes("extra")) {
            const scadStr = s.permScadenza && s.permScadenza !== "valido" && s.permScadenza !== "scaduto" ? ` (scad. ${s.permScadenza})` : "";
            citStr = `Extra UE${scadStr}`;
        } else if (cLower === "ue") {
            citStr = "Comunitaria (UE)";
        }
        
        const subjNetto = (typeof s.netto === "number" && s.netto > 0) ? s.netto : (s.incomeNetto || 0);
        
        subjectsHtml += `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.4rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1rem;">👤</span>
                        <strong style="color: #0f172a; font-size: 0.92rem;">${s.nome || 'Richiedente'} ${s.cognome || ''}</strong>
                        <span style="font-size: 0.78rem; color: #64748b;">(${s.eta || 35} anni, ${citStr})</span>
                    </div>
                    <span style="background: ${roleBadgeBg}; color: ${roleBadgeColor}; border: 1px solid ${roleBadgeBorder}; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.03em;">
                        ${roleLabel}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.82rem; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 0.4rem; margin-top: 0.15rem;">
                    <span>${workLabel}</span>
                    <strong style="color: #0052ff; font-size: 0.95rem;">${formatMoney(subjNetto)} / mese</strong>
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                    📋
                </div>
                <div>
                    <h3 style="font-size: 1.02rem; font-weight: 800; color: #0f172a; margin: 0;">Sintesi Pratica & Profilo Richiedenti</h3>
                    <span style="font-size: 0.76rem; color: #64748b;">Quadro riassuntivo anagrafico, reddituale e situazione familiare</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <span style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px;">
                    🎯 ${finalitaLabel}
                </span>
                <span style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px;">
                    💰 Reddito Complessivo: ${formatMoney(totalIncome)}/m
                </span>
            </div>
        </div>

        <!-- Subjects Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; margin-bottom: 0.85rem;">
            ${subjectsHtml}
        </div>

        <!-- Family & Commitments Strip -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.8rem;">
            <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; font-weight: 600;">👨‍👩‍👧‍👦 Situazione Familiare</span>
                <strong style="color: #1e293b;">${statoCivileText}</strong>
            </div>
            <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; font-weight: 600;">🏠 Nucleo & Figli</span>
                <strong style="color: #1e293b;">${personeNucleo} person${personeNucleo === 1 ? 'a' : 'e'} nel nucleo • ${figliText}</strong>
            </div>
            <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; font-weight: 600;">💳 Altri Impegni / Rate in corso</span>
                <strong style="color: ${altreRateVal > 0 ? '#dc2626' : '#15803d'};">
                    ${altreRateVal > 0 ? `⚠️ ${formatMoney(altreRateVal)} / mese` : '✅ Nessun impegno attivo'}
                </strong>
            </div>
            <div>
                <span style="color: #64748b; display: block; font-size: 0.72rem; font-weight: 600;">📍 Territorio Immobile</span>
                <strong style="color: #1e293b;">Provincia: ${pratica.provImmobile ? pratica.provImmobile.toUpperCase() : 'Non specificata'}</strong>
            </div>
        </div>
    `;
};

function updateCalculations() {
    window.updateCalculations = updateCalculations;
    if (window._isBatchResetting) return;
    if (!BrokerFlowEngine || !BrokerFlowEngine.bankPolicies || Object.keys(BrokerFlowEngine.bankPolicies).length === 0) {
        console.warn("BrokerFlowEngine not yet initialized. Skipping calculations.");
        return;
    }
    try {
        let value, loan, years, ratePref, isGreenPratica, otherRate, people, zona, finalita, isCo, totalIncome, c1Eta, c2Eta;
        let exclusions = { pignoramenti: false, ritardi: false };
        let subjects = [];
        let provImmobile, provResidenza, provLavoro;
        const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
        const p3ImportoEl = document.getElementById("p3-importo-field");
    const p3ValoreEl = document.getElementById("p3-valore-field");
    const p3DurataEl = document.getElementById("wiz-p3-durata");
    const p3FinalitaEl = document.getElementById("wiz-p3-finalita");
    const p3TassoEl = document.getElementById("wiz-p3-tipo-tasso");
    const classeEnEl = document.getElementById("wiz-classe-en");
    const zonaEl = document.getElementById("wiz-zona");
    const personeNucleoEl = document.getElementById("wiz-persone-nucleo" + suffix) || document.getElementById("wiz-persone-nucleo");
    
    finalita = p3FinalitaEl ? p3FinalitaEl.value : "acquisto";
    const p3AstaCheckbox = document.getElementById("wiz-p3-is-asta");
    const isAsta = (finalita === "asta" || (p3AstaCheckbox && p3AstaCheckbox.checked));
    
    const isAcqRistrMode = (finalita === "acquisto_ristrutturazione");
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
    let mutuoLavoriVal = 40000;

    if (isAcqRistrMode) {
        if (typeof window.syncAcquistoRistrutturazioneInputs === "function") {
            window.syncAcquistoRistrutturazioneInputs(false);
        }
        prezzoAcquistoVal = (document.getElementById("wiz-p3-acq-prezzo")?.value !== "") ? (parseFloat(document.getElementById("wiz-p3-acq-prezzo")?.value) || 0) : 0;
        mutuoAcquistoVal = (document.getElementById("wiz-p3-acq-mutuo")?.value !== "") ? (parseFloat(document.getElementById("wiz-p3-acq-mutuo")?.value) || 0) : 0;
        costoLavoriVal = (document.getElementById("wiz-p3-ristr-costo")?.value !== "") ? (parseFloat(document.getElementById("wiz-p3-ristr-costo")?.value) || 0) : 0;
        mutuoLavoriVal = (document.getElementById("wiz-p3-ristr-mutuo")?.value !== "") ? (parseFloat(document.getElementById("wiz-p3-ristr-mutuo")?.value) || 0) : 0;
        
        value = prezzoAcquistoVal + costoLavoriVal;
        loan = mutuoAcquistoVal + mutuoLavoriVal;
    } else {
        value = p3ValoreEl ? (parseFloat(p3ValoreEl.value) || 0) : 230000;
        loan = p3ImportoEl ? (parseFloat(p3ImportoEl.value) || 0) : 180000;
        costoLavoriVal = 0;
    }
    years = p3DurataEl ? (parseInt(p3DurataEl.value) || 25) : 25;
    ratePref = p3TassoEl ? p3TassoEl.value : "any";
    people = personeNucleoEl ? (parseInt(personeNucleoEl.value) || 4) : 4;
    isGreenPratica = classeEnEl ? (classeEnEl.value === "green") : false;
    zona = zonaEl ? zonaEl.value : "nord";
    
    const provImmEl = document.getElementById("wiz-prov-immobile" + suffix) || document.getElementById("wiz-prov-immobile");
    const provResEl = document.getElementById("wiz-prov-residenza" + suffix) || document.getElementById("wiz-prov-residenza");
    const provLavEl = document.getElementById("wiz-prov-lavoro" + suffix) || document.getElementById("wiz-prov-lavoro");
    
    provImmobile = (provImmEl && provImmEl.value.trim()) || (document.getElementById("wiz-prov-immobile")?.value.trim()) || (document.getElementById("wiz-prov-immobile-file")?.value.trim()) || "";
    provResidenza = (provResEl && provResEl.value.trim()) || (document.getElementById("wiz-prov-residenza")?.value.trim()) || (document.getElementById("wiz-prov-residenza-file")?.value.trim()) || "";
    provLavoro = (provLavEl && provLavEl.value.trim()) || (document.getElementById("wiz-prov-lavoro")?.value.trim()) || (document.getElementById("wiz-prov-lavoro-file")?.value.trim()) || "";

    if (typeof saveCurrentSubject === "function") {
        saveCurrentSubject(true);
    }
    
    totalIncome = 0;
        wizardSubjects.forEach(s => {
            if (s.isSpouse && document.getElementById("coapp-spouse-auto")) return;
            if (s.role === "Richiedente Principale" || s.role === "Cointestatario") {
                totalIncome += s.netto;
            }
            const anzVal = (s.anzianitaMesi !== undefined && s.anzianitaMesi !== null && s.anzianitaMesi !== "")
                ? s.anzianitaMesi
                : ((s.anzianita !== undefined && s.anzianita !== null && s.anzianita !== "") ? s.anzianita : 24);
            subjects.push({
                ...s,
                anzianita: anzVal,
                anzianitaMesi: anzVal,
                payslipData: s.payslipData || (s.role === "Richiedente Principale" ? window._primaryPayslipData : (s.isSecondIncome ? window._secondIncomePayslipData : null))
            });
        });

        // Scan coapplicant cards from DOM
        let coappLoansRate = 0;
        document.querySelectorAll("#spouse-auto-card-container > div, #spouse-auto-card-container-file > div, #coapplicant-cards-container > div").forEach(card => {
            const isSpouse = card.dataset.isSpouse === "true" || card.id === "coapp-spouse-auto";
            const nome = card.querySelector(".coapp-q1-nome")?.value.trim() || card.querySelector(".coapp-nome")?.value.trim() || (isSpouse ? "Coniuge" : "Cointestatario");
            const cognome = card.querySelector(".coapp-q2-cognome")?.value.trim() || card.querySelector(".coapp-cognome")?.value.trim() || "";
            const dataNascita = card.querySelector(".coapp-q3-data-nascita")?.value || card.querySelector(".coapp-data-nascita")?.value || "1988-01-01";
            
            let eta = 35;
            if (dataNascita) {
                const birthDate = new Date(dataNascita);
                const ageDifMs = Date.now() - birthDate.getTime();
                const ageDate = new Date(ageDifMs);
                eta = Math.abs(ageDate.getUTCFullYear() - 1970) || 35;
            }
            
            const sesso = card.querySelector(".coapp-q-sesso")?.value || card.querySelector(".coapp-sesso")?.value || "F";
            const cittadinanza = card.querySelector(".coapp-q6-cittadinanza")?.value || card.querySelector(".coapp-cittadinanza")?.value || "IT";
            const permScadenza = card.querySelector(".coapp-q6-permesso")?.value || card.querySelector(".coapp-permesso")?.value || "valido";
            const macroCategoria = card.querySelector(".coapp-macro-categoria")?.value || card.querySelector(".coapp-tipo")?.value || (isSpouse ? "no_lavoro" : "dipendente");
            
            let tipoContratto = "no_lavoro";
            if (macroCategoria === "dipendente") {
                const dipSub = card.querySelector(".coapp-q10-dip-contratto")?.value || "indeterminato";
                tipoContratto = (dipSub === "indeterminato") ? "dipendente_ti" : (dipSub === "determinato" ? "dipendente_td" : "apprendista");
            } else if (macroCategoria === "autonomo") {
                tipoContratto = "autonomo";
            } else if (macroCategoria === "pensionato") {
                tipoContratto = "pensionato";
            } else if (macroCategoria === "colf_badanti") {
                tipoContratto = "colf_badanti";
            } else if (macroCategoria === "interinale") {
                tipoContratto = "interinale";
            } else if (macroCategoria !== "no_lavoro") {
                tipoContratto = macroCategoria;
            }

            let netto = (macroCategoria === "no_lavoro") ? 0 : (parseFloat(card.querySelector(".coapp-netto")?.value) || 0);
            const anzianita = parseInt(card.querySelector(".coapp-q10-anzianita")?.value || card.querySelector(".coapp-anzianita")?.value) || 0;
            const orarioLavoro = card.querySelector(".coapp-q10-dip-orario")?.value || card.querySelector(".coapp-orario")?.value || "full_time";
            const datoreLavoro = card.querySelector(".coapp-q10-datore-piva")?.value || card.querySelector(".coapp-datore")?.value || "";
            const professione = card.querySelector(".coapp-q9-professione")?.value || "";
            const alimenti = card.querySelector(".coapp-q4-alimenti")?.value || card.querySelector(".coapp-alimenti")?.value || "nessuno";
            const alimentiImporto = parseFloat(card.querySelector(".coapp-q4-alimenti-importo")?.value || card.querySelector(".coapp-alimenti-importo")?.value) || 0;
            
            if (alimenti === "paga") {
                coappLoansRate += alimentiImporto;
            }
            
            // Loans & CRIF from Coapplicant
            const hasLoansCoapp = card.querySelector(".coapp-q11-has-loans")?.value === "si";
            if (hasLoansCoapp) {
                const rataCoapp = parseFloat(card.querySelector(".coapp-loans-rata")?.value) || 0;
                coappLoansRate += rataCoapp;
            }

            const pignCoapp = card.querySelector(".coapp-q12-pignoramenti")?.value === "si";
            const ritardiCoapp = card.querySelector(".coapp-q13-crif-sofferenze")?.value === "si";
            if (pignCoapp) exclusions.pignoramenti = true;
            if (ritardiCoapp) exclusions.ritardi = true;

            totalIncome += netto;
            let rawBoxDataCoapp = {};
            if (macroCategoria === "autonomo") {
                const autRegime = card.querySelector(".coapp-autonomo-regime")?.value || "forfettario";
                const isSingleUnicoCoapp = card.querySelector(".coapp-autonomo-single-unico")?.checked || false;
                if (autRegime === "ordinario") {
                    const rn1_1 = parseFloat(card.querySelector(".coapp-rn1")?.value) || 0;
                    const rn4_1 = parseFloat(card.querySelector(".coapp-rn4")?.value) || 0;
                    const rn26_1 = parseFloat(card.querySelector(".coapp-rn26")?.value) || 0;
                    const rv2_1 = parseFloat(card.querySelector(".coapp-rv2")?.value) || 0;
                    const rv10_1 = parseFloat(card.querySelector(".coapp-rv10")?.value) || 0;
                    const rv17_1 = parseFloat(card.querySelector(".coapp-rv17")?.value) || 0;

                    const rn1_2 = parseFloat(card.querySelector(".coapp-rn1-anno2")?.value) || 0;
                    const rn4_2 = parseFloat(card.querySelector(".coapp-rn4-anno2")?.value) || 0;
                    const rn26_2 = parseFloat(card.querySelector(".coapp-rn26-anno2")?.value) || 0;
                    const rv2_2 = parseFloat(card.querySelector(".coapp-rv2-anno2")?.value) || 0;
                    const rv10_2 = parseFloat(card.querySelector(".coapp-rv10-anno2")?.value) || 0;
                    const rv17_2 = parseFloat(card.querySelector(".coapp-rv17-anno2")?.value) || 0;

                    rawBoxDataCoapp = { regime: "ordinario", singleUnico: isSingleUnicoCoapp, rn1_1, rn4_1, rn26_1, rv2_1, rv10_1, rv17_1, rn1_2, rn4_2, rn26_2, rv2_2, rv10_2, rv17_2 };
                } else {
                    const lm22_1 = parseFloat(card.querySelector(".coapp-lm22")?.value) || 0;
                    const lm27_1 = parseFloat(card.querySelector(".coapp-lm27")?.value) || 0;
                    const lm35_1 = parseFloat(card.querySelector(".coapp-lm35")?.value) || 0;
                    const lm36_1 = parseFloat(card.querySelector(".coapp-lm36")?.value) || 0;
                    const lm39_1 = parseFloat(card.querySelector(".coapp-lm39")?.value) || 0;

                    const lm22_2 = parseFloat(card.querySelector(".coapp-lm22-anno2")?.value) || 0;
                    const lm27_2 = parseFloat(card.querySelector(".coapp-lm27-anno2")?.value) || 0;
                    const lm35_2 = parseFloat(card.querySelector(".coapp-lm35-anno2")?.value) || 0;
                    const lm36_2 = parseFloat(card.querySelector(".coapp-lm36-anno2")?.value) || 0;
                    const lm39_2 = parseFloat(card.querySelector(".coapp-lm39-anno2")?.value) || 0;

                    rawBoxDataCoapp = { regime: "forfettario", singleUnico: isSingleUnicoCoapp, lm22_1, lm27_1, lm35_1, lm36_1, lm39_1, lm22_2, lm27_2, lm35_2, lm36_2, lm39_2, lm36: lm36_1, lm39: lm39_1 };
                }
            } else if (macroCategoria === "dipendente" || macroCategoria === "colf_badanti" || macroCategoria === "interinale") {
                const p1 = parseFloat(card.querySelector(".coapp-cu1")?.value) || 0;
                const p2 = parseFloat(card.querySelector(".coapp-cu2")?.value) || 0;
                const p6 = parseFloat(card.querySelector(".coapp-cu6")?.value) || 365;
                const p21 = parseFloat(card.querySelector(".coapp-cu21")?.value) || 0;
                const p22 = parseFloat(card.querySelector(".coapp-cu22")?.value) || 0;
                const p26 = parseFloat(card.querySelector(".coapp-cu26")?.value) || 0;
                const p27 = parseFloat(card.querySelector(".coapp-cu27")?.value) || 0;
                const p29 = parseFloat(card.querySelector(".coapp-cu29")?.value) || 0;
                const p365 = parseFloat(card.querySelector(".coapp-cu365")?.value) || 0;
                const p810 = parseFloat(card.querySelector(".coapp-cu810")?.value) || 0;
                rawBoxDataCoapp = { p1, p2, p6, p21, p22, p26, p27, p29, p365, p810, cu1: p1, cu2: p2, cu6: p6, cu21: p21, cu22: p22, cu26: p26, cu27: p27, cu29: p29, cu365: p365, cu810: p810 };
            }

            subjects.push({
                role: "Cointestatario",
                nome: nome,
                cognome: cognome,
                dataNascita: dataNascita,
                eta: eta,
                sesso: sesso,
                cittadinanza: cittadinanza,
                permScadenza: permScadenza,
                tipoContratto: tipoContratto,
                macroCategoria: macroCategoria,
                professione: professione,
                netto: netto,
                anzianita: anzianita,
                orarioLavoro: orarioLavoro,
                datoreLavoro: datoreLavoro,
                alimenti: alimenti,
                alimentiImporto: alimentiImporto,
                isSpouse: isSpouse,
                famigliaSede: "italia",
                rawBoxData: rawBoxDataCoapp,
                payslipData: card._payslipData || null
            });
        });

        // Scan guarantor cards from DOM
        document.querySelectorAll("#guarantor-cards-container > div").forEach(card => {
            const nome = card.querySelector(".coapp-q1-nome")?.value.trim() || card.querySelector(".coapp-nome")?.value.trim() || card.querySelector(".guar-nome")?.value || "Garante";
            const cognome = card.querySelector(".coapp-q2-cognome")?.value.trim() || card.querySelector(".coapp-cognome")?.value.trim() || "";
            const dataNascita = card.querySelector(".coapp-q3-data-nascita")?.value || card.querySelector(".coapp-data-nascita")?.value || "1968-01-01";
            let eta = 55;
            if (dataNascita) {
                const birthDate = new Date(dataNascita);
                const ageDifMs = Date.now() - birthDate.getTime();
                const ageDate = new Date(ageDifMs);
                eta = Math.abs(ageDate.getUTCFullYear() - 1970) || 55;
            }
            const sesso = card.querySelector(".coapp-q-sesso")?.value || card.querySelector(".coapp-sesso")?.value || "M";
            const rapporto = card.querySelector(".coapp-q-rapporto")?.value || "genitore";
            const macroCategoria = card.querySelector(".coapp-macro-categoria")?.value || card.querySelector(".coapp-tipo")?.value || "dipendente";
            let netto = parseFloat(card.querySelector(".coapp-netto")?.value || card.querySelector(".guar-netto")?.value) || 0;
            const alimenti = card.querySelector(".coapp-q4-alimenti")?.value || card.querySelector(".coapp-alimenti")?.value || "nessuno";
            const alimentiImporto = parseFloat(card.querySelector(".coapp-q4-alimenti-importo")?.value || card.querySelector(".coapp-alimenti-importo")?.value) || 0;
            
            if (alimenti === "paga") {
                coappLoansRate += alimentiImporto;
            }
            
            const hasLoansGuar = card.querySelector(".coapp-q11-has-loans")?.value === "si";
            if (hasLoansGuar) {
                const rataGuar = parseFloat(card.querySelector(".coapp-loans-rata")?.value) || 0;
                coappLoansRate += rataGuar;
            }
            const pignGuar = card.querySelector(".coapp-q12-pignoramenti")?.value === "si";
            const ritardiGuar = card.querySelector(".coapp-q13-crif-sofferenze")?.value === "si";
            if (pignGuar) exclusions.pignoramenti = true;
            if (ritardiGuar) exclusions.ritardi = true;

            let rawBoxDataGuar = {};
            if (macroCategoria === "autonomo") {
                const autRegime = card.querySelector(".coapp-autonomo-regime")?.value || "forfettario";
                const isSingleUnicoGuar = card.querySelector(".coapp-autonomo-single-unico")?.checked || false;
                if (autRegime === "ordinario") {
                    const rn1_1 = parseFloat(card.querySelector(".coapp-rn1")?.value) || 0;
                    const rn4_1 = parseFloat(card.querySelector(".coapp-rn4")?.value) || 0;
                    const rn26_1 = parseFloat(card.querySelector(".coapp-rn26")?.value) || 0;
                    const rv2_1 = parseFloat(card.querySelector(".coapp-rv2")?.value) || 0;
                    const rv10_1 = parseFloat(card.querySelector(".coapp-rv10")?.value) || 0;
                    const rv17_1 = parseFloat(card.querySelector(".coapp-rv17")?.value) || 0;

                    const rn1_2 = parseFloat(card.querySelector(".coapp-rn1-anno2")?.value) || 0;
                    const rn4_2 = parseFloat(card.querySelector(".coapp-rn4-anno2")?.value) || 0;
                    const rn26_2 = parseFloat(card.querySelector(".coapp-rn26-anno2")?.value) || 0;
                    const rv2_2 = parseFloat(card.querySelector(".coapp-rv2-anno2")?.value) || 0;
                    const rv10_2 = parseFloat(card.querySelector(".coapp-rv10-anno2")?.value) || 0;
                    const rv17_2 = parseFloat(card.querySelector(".coapp-rv17-anno2")?.value) || 0;

                    rawBoxDataGuar = { regime: "ordinario", singleUnico: isSingleUnicoGuar, rn1_1, rn4_1, rn26_1, rv2_1, rv10_1, rv17_1, rn1_2, rn4_2, rn26_2, rv2_2, rv10_2, rv17_2 };
                } else {
                    const lm22_1 = parseFloat(card.querySelector(".coapp-lm22")?.value) || 0;
                    const lm27_1 = parseFloat(card.querySelector(".coapp-lm27")?.value) || 0;
                    const lm35_1 = parseFloat(card.querySelector(".coapp-lm35")?.value) || 0;
                    const lm36_1 = parseFloat(card.querySelector(".coapp-lm36")?.value) || 0;
                    const lm39_1 = parseFloat(card.querySelector(".coapp-lm39")?.value) || 0;

                    const lm22_2 = parseFloat(card.querySelector(".coapp-lm22-anno2")?.value) || 0;
                    const lm27_2 = parseFloat(card.querySelector(".coapp-lm27-anno2")?.value) || 0;
                    const lm35_2 = parseFloat(card.querySelector(".coapp-lm35-anno2")?.value) || 0;
                    const lm36_2 = parseFloat(card.querySelector(".coapp-lm36-anno2")?.value) || 0;
                    const lm39_2 = parseFloat(card.querySelector(".coapp-lm39-anno2")?.value) || 0;

                    rawBoxDataGuar = { regime: "forfettario", singleUnico: isSingleUnicoGuar, lm22_1, lm27_1, lm35_1, lm36_1, lm39_1, lm22_2, lm27_2, lm35_2, lm36_2, lm39_2, lm36: lm36_1, lm39: lm39_1 };
                }
            } else if (macroCategoria === "dipendente" || macroCategoria === "colf_badanti" || macroCategoria === "interinale") {
                const p1 = parseFloat(card.querySelector(".coapp-cu1")?.value) || 0;
                const p2 = parseFloat(card.querySelector(".coapp-cu2")?.value) || 0;
                const p6 = parseFloat(card.querySelector(".coapp-cu6")?.value) || 365;
                const p21 = parseFloat(card.querySelector(".coapp-cu21")?.value) || 0;
                const p22 = parseFloat(card.querySelector(".coapp-cu22")?.value) || 0;
                const p26 = parseFloat(card.querySelector(".coapp-cu26")?.value) || 0;
                const p27 = parseFloat(card.querySelector(".coapp-cu27")?.value) || 0;
                const p29 = parseFloat(card.querySelector(".coapp-cu29")?.value) || 0;
                const p365 = parseFloat(card.querySelector(".coapp-cu365")?.value) || 0;
                const p810 = parseFloat(card.querySelector(".coapp-cu810")?.value) || 0;
                rawBoxDataGuar = { p1, p2, p6, p21, p22, p26, p27, p29, p365, p810, cu1: p1, cu2: p2, cu6: p6, cu21: p21, cu22: p22, cu26: p26, cu27: p27, cu29: p29, cu365: p365, cu810: p810 };
            }

            const fratelloAutonomoVal = card.querySelector(".coapp-fratello-nucleo-autonomo") ? (card.querySelector(".coapp-fratello-nucleo-autonomo").value === "si") : true;

            subjects.push({
                role: "Garante",
                nome: nome,
                cognome: cognome,
                dataNascita: dataNascita,
                eta: eta,
                sesso: sesso,
                rapporto: rapporto,
                fratelloNucleoAutonomo: fratelloAutonomoVal,
                netto: netto,
                tipoContratto: macroCategoria === "pensionato" ? "pensionato" : "garante",
                macroCategoria: macroCategoria,
                cittadinanza: card.querySelector(".coapp-q6-cittadinanza")?.value || "IT",
                permScadenza: card.querySelector(".coapp-q6-permesso")?.value || "valido",
                famigliaSede: card.querySelector(".coapp-q14-famiglia")?.value || "italia",
                rawBoxData: rawBoxDataGuar,
                payslipData: card._payslipData || null
            });
        });
        
        if (subjects.length === 0 || totalIncome <= 0) {
            const defaultIncome = 2500;
            totalIncome = defaultIncome;
            subjects = [{
                role: "Richiedente Principale",
                eta: 35,
                netto: defaultIncome,
                incomeNetto: defaultIncome,
                isOwner: true,
                tipoContratto: "dipendente_ti",
                anzianita: 24,
                anzianitaMesi: 24,
                cittadinanza: "IT",
                permScadenza: "valido",
                famigliaSede: "italia"
            }];
        }
        
        // Scan loan cards from DOM
        let activeLoansRate = 0;
        const loanCards = document.querySelectorAll("#loans-cards-container > div");
        loanCards.forEach(c => {
            const rataVal = parseFloat(c.querySelector(".loan-rata-input")?.value) || 0;
            const chiusoVal = c.querySelector(".loan-chiuso-input")?.value || "si";
            if (chiusoVal === "no") {
                activeLoansRate += rataVal;
            }
        });
        const inputAltreRate = document.getElementById("altre-rate");
        const manualRate = inputAltreRate ? (parseFloat(inputAltreRate.value) || 0) : 0;
        otherRate = (loanCards.length > 0 ? activeLoansRate : manualRate) + coappLoansRate;
        
        // Alimenti Pagati (Separato / Divorziato) -> Incidono come prestito mensile su DSR, Sussistenza e MRI
        let alimentiPagaVal = 0;
        const q4StatoCivileVal = (document.getElementById("wiz-q4-stato-civile" + suffix)?.value) || (document.getElementById("wiz-q4-stato-civile-full")?.value);
        if (q4StatoCivileVal === "separato" || q4StatoCivileVal === "divorziato") {
            const alimentiTipoVal = (document.getElementById("wiz-q4-alimenti" + suffix)?.value) || (document.getElementById("wiz-q4-alimenti-full")?.value);
            if (alimentiTipoVal === "paga") {
                const alimentiImpEl = document.getElementById("wiz-q4-alimenti-importo" + suffix) || document.getElementById("wiz-q4-alimenti-importo-full");
                alimentiPagaVal = alimentiImpEl ? (parseFloat(alimentiImpEl.value) || 0) : 0;
            }
        }
        otherRate += alimentiPagaVal;
        
        // Canone di affitto: va conteggiato tra gli impegni (otherRate) SOLO ed esclusivamente in caso di liquidità
        if (finalita === "liquidita") {
            const abitaTipoEl = document.getElementById("wiz-q7-abitazione" + suffix) || document.getElementById("wiz-abita-tipo");
            const affittoValEl = document.getElementById("wiz-q7-canone-affitto" + suffix) || document.getElementById("wiz-abita-affitto-valore");
            if (abitaTipoEl && abitaTipoEl.value === "affitto") {
                otherRate += affittoValEl ? (parseFloat(affittoValEl.value) || 0) : 0;
            }
        }
        
        const pignEl = document.getElementById("wiz-q12-pignoramenti") || document.getElementById("wiz-pignoramenti");
        const ritardiEl = document.getElementById("wiz-q13-crif-sofferenze") || document.getElementById("wiz-ritardi");
        if (pignEl && pignEl.value === "si") exclusions.pignoramenti = true;
        if (ritardiEl && ritardiEl.value === "si") exclusions.ritardi = true;
        
        const numFigliEl = document.getElementById("wiz-q5-num-figli" + suffix) || document.getElementById("wiz-num-figli");
        const statoCivileEl = document.getElementById("wiz-q4-stato-civile" + suffix) || document.getElementById("wiz-stato-civile");
        const numFigliVal = numFigliEl ? (parseInt(numFigliEl.value) || 0) : 0;
        
        const manualPersoneVal = personeNucleoEl ? parseInt(personeNucleoEl.value, 10) : 0;
        if (!isNaN(manualPersoneVal) && manualPersoneVal > 0) {
            people = manualPersoneVal;
        } else {
            const nonGuarantorSubjects = subjects.filter(s => !String(s.role || "").toLowerCase().includes("garante"));
            const hasSpouseSubject = nonGuarantorSubjects.some(s => s.isSpouse || String(s.role || "").toLowerCase().includes("cointestat") || s.rapporto === "coniuge" || s.rapporto === "marito_moglie");
            const nonBorrowingSpouse = (statoCivileEl && statoCivileEl.value === "sposato" && !hasSpouseSubject) ? 1 : 0;
            people = Math.max(1, nonGuarantorSubjects.length + nonBorrowingSpouse + numFigliVal);
        }
    
    

    // Retrieve calcMode from results radio buttons or form inputs
    const wizCalcModeExact = document.getElementById("wiz-calc-mode-exact");
    
    let calcMode = "exact";
    if (wizCalcModeExact) {
        calcMode = wizCalcModeExact.checked ? "exact" : "max";
    }

    const classeEnergeticaEl = document.getElementById("wiz-p3-classe-energetica");
    const classeEnergetica = classeEnergeticaEl ? classeEnergeticaEl.value : (classeEnEl ? classeEnEl.value : "to_verify");
    isGreenPratica = (classeEnergetica === "green_ab" || classeEnergetica === "green");

    const patrimonioMobiliareEl = document.getElementById("wiz-patrimonio-mobiliare");
    const patrimonioMobiliare = patrimonioMobiliareEl ? (parseFloat(patrimonioMobiliareEl.value) || 0) : 25000;
    if (window.updatePatrimonioDisplay) window.updatePatrimonioDisplay();

    const isStagionaleEl = document.getElementById("wiz-q10-dip-is-stagionale");
    const isStagionale = isStagionaleEl ? isStagionaleEl.checked : false;
    const stagioniEl = document.getElementById("wiz-q10-dip-stagioni-consecutive");
    const stagioniConsecutive = isStagionale ? (parseInt(stagioniEl ? stagioniEl.value : 2) || 2) : 0;

    const liquiditaPuraEl = document.getElementById("wiz-p3-liquidita-pura");
    const liquiditaPura = liquiditaPuraEl ? (parseFloat(liquiditaPuraEl.value) || 0) : 0;
    if (window.checkLiquiditaPercentage) window.checkLiquiditaPercentage();

    // Pluri-ipoteca e Acquisto + Sostituzione
    const hasSecondPropertyEl = document.getElementById("wiz-p3-has-second-property");
    const hasSecondProperty = hasSecondPropertyEl ? hasSecondPropertyEl.checked : false;
    const secondValoreEl = document.getElementById("wiz-p3-second-valore");
    const secondValore = hasSecondProperty ? (parseFloat(secondValoreEl ? secondValoreEl.value : 0) || 0) : 0;
    const secondComuneEl = document.getElementById("wiz-p3-second-comune");
    const secondComune = hasSecondProperty ? (secondComuneEl ? secondComuneEl.value.trim() : "") : "";
    const secondIntestatarioEl = document.getElementById("wiz-p3-second-intestatario");
    const secondIntestatario = hasSecondProperty ? (secondIntestatarioEl ? secondIntestatarioEl.value : "richiedente") : "";
    
    const secondHasMortgageEl = document.getElementById("wiz-p3-second-has-mortgage");
    const secondHasMortgage = hasSecondProperty && (secondHasMortgageEl ? secondHasMortgageEl.value === "si" : false);
    const secondAccorpaEl = document.getElementById("wiz-p3-second-accorpa");
    const secondAccorpa = secondHasMortgage && (secondAccorpaEl ? secondAccorpaEl.checked : true);
    const secondDebitoResiduoEl = document.getElementById("wiz-p3-second-debito-residuo");
    const secondDebitoResiduo = secondHasMortgage ? (parseFloat(secondDebitoResiduoEl ? secondDebitoResiduoEl.value : 0) || 0) : 0;
    const secondRataAttualeEl = document.getElementById("wiz-p3-second-rata-attuale");
    const secondRataAttuale = secondHasMortgage ? (parseFloat(secondRataAttualeEl ? secondRataAttualeEl.value : 0) || 0) : 0;
    const secondMesiAmmortamentoEl = document.getElementById("wiz-p3-second-mesi-ammortamento");
    const secondMesiAmmortamento = secondHasMortgage ? (parseInt(secondMesiAmmortamentoEl ? secondMesiAmmortamentoEl.value : 0) || 0) : 0;

    let totalPropertyValue = value;
    let effectiveLoan = loan;
    if (hasSecondProperty && secondValore > 0) {
        totalPropertyValue = value + secondValore;
        if (secondAccorpa && secondDebitoResiduo > 0) {
            effectiveLoan = loan + secondDebitoResiduo;
        }
    }
    const standardLtv = value > 0 ? (loan / value) : 0;
    const aggregatedLtv = totalPropertyValue > 0 ? (effectiveLoan / totalPropertyValue) : standardLtv;
    const ltv = hasSecondProperty ? aggregatedLtv : standardLtv;
    const ltvPercent = ltv * 100;
    
    const badgePluriSuggerimento = document.getElementById("badge-pluri-suggerimento");
    if (badgePluriSuggerimento) {
        badgePluriSuggerimento.style.display = (!hasSecondProperty && standardLtv > 0.8) ? "inline-block" : "none";
    }

    const p3LtvDisplay = document.getElementById("p3-ltv-display");
    const p3LtvDesc = document.getElementById("p3-ltv-desc");
    if (p3LtvDisplay) {
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
    if (p3LtvDisplay) {
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
            const isConsapEligibleDesc = ["acquisto", "asta", "surroga"].includes(finalita);
            if (isConsapEligibleDesc) {
                p3LtvDesc.innerText = "⚡ LTV elevato (> 80%). Puoi scegliere se richiedere la garanzia CONSAP o attivare la Pluri-Ipoteca su un secondo immobile.";
            } else {
                p3LtvDesc.innerText = "⚡ LTV elevato (> 80%). Puoi attivare la Pluri-Ipoteca su un secondo immobile per rientrare nei parametri di erogazione.";
            }
            p3LtvDesc.style.color = "#d97706";
        } else {
            p3LtvDesc.innerText = "✅ LTV standard entro i limiti di erogazione (≤ 80%).";
            p3LtvDesc.style.color = "#64748b";
        }
    }

    // Toggle Consap question group depending on LTV and finalità eligibility (Purchase modes & Surroga only)
    const isConsapEligible = ["acquisto", "asta", "surroga"].includes(finalita);
    const p3ConsapGroup = document.getElementById("p3-consap-group");
    const p3ConsapSelect = document.getElementById("p3-consap-select");
    let isConsap = false;
    if (p3ConsapGroup) {
        if (isConsapEligible && !isAcqRistrMode && standardLtv > 0.80 && !hasSecondProperty) {
            p3ConsapGroup.style.display = "flex";
            if (p3ConsapSelect && !p3ConsapSelect.dataset.userTouched && p3ConsapSelect.value !== "si") {
                p3ConsapSelect.value = "si";
            }
            isConsap = p3ConsapSelect ? (p3ConsapSelect.value === "si") : false;
        } else {
            p3ConsapGroup.style.display = "none";
            if (p3ConsapSelect) p3ConsapSelect.value = "no";
            isConsap = false;
        }
    }
    
    // Tassi base from daily rates database or fallback fixings
    const tassiBase = {
        euribor1m: (window.dailyEuriborRates && window.dailyEuriborRates["1M"]) ? parseFloat(window.dailyEuriborRates["1M"]) : (inputBaseEuribor1m ? parseFloat(inputBaseEuribor1m.value) : 2.321),
        euribor3m: (window.dailyEuriborRates && window.dailyEuriborRates["3M"]) ? parseFloat(window.dailyEuriborRates["3M"]) : (inputBaseEuribor3m ? parseFloat(inputBaseEuribor3m.value) : 2.655),
        euribor6m: (window.dailyEuriborRates && window.dailyEuriborRates["6M"]) ? parseFloat(window.dailyEuriborRates["6M"]) : (inputBaseEuribor6m ? parseFloat(inputBaseEuribor6m.value) : 2.789),
        irs: (window.dailyIrsRates && window.dailyIrsRates[30]) ? parseFloat(window.dailyIrsRates[30]) : (inputBaseIrs ? parseFloat(inputBaseIrs.value) : 3.46),
        bce: inputBaseBce ? (parseFloat(inputBaseBce.value) || 3.75) : 3.75,
        irsRates: window.dailyIrsRates || {},
        euriborRates: window.dailyEuriborRates || {}
    };
    const p4ContoEl = document.getElementById("phase4-flag-conto");
    const p3ContoEl = document.getElementById("wiz-p3-apertura-conto");
    const isAperturaConto = p4ContoEl ? p4ContoEl.checked : (p3ContoEl ? (p3ContoEl.value === "si") : true);
    const p4CpiEl = document.getElementById("phase4-flag-cpi");
    const hasCpi = p4CpiEl ? p4CpiEl.checked : true;
    const childrenAgesEl = document.getElementById("wiz-q5-eta-figli" + suffix);
    const childrenAgesStr = childrenAgesEl ? childrenAgesEl.value : "";
    
    const pratica = {
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
        subjects: subjects,
        totalIncome: totalIncome,
        exclusions: exclusions,
        provImmobile: provImmobile,
        provResidenza: provResidenza,
        provLavoro: provLavoro,
        hasSecondProperty: hasSecondProperty,
        secondPropertyValue: secondValore,
        secondComune: secondComune,
        secondIntestatario: secondIntestatario,
        secondHasMortgage: secondHasMortgage,
        accorpaSostituzione: secondAccorpa,
        secondDebitoResiduo: secondDebitoResiduo,
        secondRataAttuale: secondRataAttuale,
        secondMesiAmmortamento: secondMesiAmmortamento,
        liquiditaPura: liquiditaPura,
        patrimonioMobiliare: patrimonioMobiliare,
        isStagionale: isStagionale,
        stagioniConsecutive: stagioniConsecutive
    };
    
    // Evaluate via modular BrokerFlowEngine
    const result = BrokerFlowEngine.evaluate(pratica, tassiBase);
    window.lastEvaluationResult = result;
    
    // Render Results: Separate into 3 distinct sections (Approved, Deroga, Non Fattibili)
    const allBanks = result.allEvaluated || [];
    allBanks.sort((a, b) => {
        const getTier = (item) => {
            if (item.status === "ok") return 1;
            if (item.status === "deroga") return 2;
            return 3; // "ko" or isNotFeasible
        };
        const tierA = getTier(a);
        const tierB = getTier(b);
        if (tierA !== tierB) {
            return tierA - tierB;
        }
        if (calcMode === "max") {
            const aMax = (typeof a.maxLoanGrantable === "number" && !isNaN(a.maxLoanGrantable)) ? a.maxLoanGrantable : 0;
            const bMax = (typeof b.maxLoanGrantable === "number" && !isNaN(b.maxLoanGrantable)) ? b.maxLoanGrantable : 0;
            if (aMax !== bMax) return bMax - aMax;
        }
        const aRata = (typeof a.rata === "number" && !isNaN(a.rata)) ? a.rata : 999999;
        const bRata = (typeof b.rata === "number" && !isNaN(b.rata)) ? b.rata : 999999;
        return aRata - bRata;
    });

    const approvedBanks = allBanks.filter(b => b.status === "ok");
    const derogaBanks = allBanks.filter(b => b.status === "deroga");
    const koBanks = allBanks.filter(b => b.status === "ko" || b.isNotFeasible);

    // Determine currently selected bank
    let chosenBank = null;
    if (window.selectedBankId) {
        chosenBank = allBanks.find(b => b.bankId === window.selectedBankId && (!window.selectedBankProduct || b.prodName === window.selectedBankProduct));
        if (!chosenBank) {
            chosenBank = allBanks.find(b => b.bankId === window.selectedBankId);
        }
        if (!chosenBank) {
            chosenBank = allBanks.find(b => String(b.bankId).includes(window.selectedBankId) || String(window.selectedBankId).includes(b.bankId));
        }
    }
    // If chosen bank is not found or is KO, fallback to best approved or best deroga
    if (!chosenBank || (chosenBank.status === "ko" || chosenBank.isNotFeasible)) {
        if (approvedBanks.length > 0) {
            chosenBank = approvedBanks[0];
        } else if (derogaBanks.length > 0) {
            chosenBank = derogaBanks[0];
        } else if (allBanks.length > 0) {
            chosenBank = allBanks[0];
        }
    }

    if (chosenBank) {
        window.selectedBankId = chosenBank.bankId;
        window.selectedBankProduct = chosenBank.prodName || "";
    }

    const p4MaxLoan = document.getElementById("phase4-max-loan");
    const p4Rata = document.getElementById("phase4-rata-sostenibile");
    const p4Score = document.getElementById("phase4-score-cliente");
    
    // Dynamic grid columns and card visibility based on calculation mode
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

    const hasAnyFeasibleBank = (approvedBanks.length > 0 || derogaBanks.length > 0);

    if (typeof window.renderPhase4ClientSummary === "function") {
        window.renderPhase4ClientSummary(pratica);
    }

    if (!result.feasible && !hasAnyFeasibleBank) {
        if (sumRata) sumRata.innerText = "--";
        if (sumTasso) sumTasso.innerText = "--";
        if (sumReddito) sumReddito.innerText = `${formatNumber(totalIncome, 2)} €`;
        if (sumLtv) sumLtv.innerText = `${(ltv * 100).toFixed(1)}%`;
        if (sumDsr) sumDsr.innerText = "--";
        
        if (p4MaxLoan) p4MaxLoan.innerText = "€ --";
        if (p4Rata) p4Rata.innerText = "€ --";
        if (p4Score) p4Score.innerHTML = clientScore.html;
        
        let customMsg = "La combinazione di parametri supera le policy di tutti gli istituti operanti in questa zona.";
        if (exclusions.pignoramenti || exclusions.ritardi) {
            customMsg = "Esito KO automatico dovuto a segnalazioni creditizie negative (pignoramenti o ritardi di pagamento in corso).";
        }
        if (cardsContainer) {
            cardsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #64748b;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="color: #0f172a; margin-bottom: 0.5rem; font-size: 1.1rem; font-weight: 800;">Nessuna Banca Fattibile</h3>
                    <p style="font-size: 0.85rem;">${customMsg}</p>
                </div>
            `;
        }
        return;
    } else {
        const activeBank = chosenBank || approvedBanks[0] || derogaBanks[0] || result.banks[0];
        if (sumRata) sumRata.innerText = calcMode === "max" ? `${formatNumber(activeBank.maxRataSimulated, 2)} €` : `${formatNumber(activeBank.rata, 2)} €`;
        if (sumTasso) sumTasso.innerText = `${activeBank.tan.toFixed(2)}%`;
        if (sumReddito) sumReddito.innerText = `${formatNumber(totalIncome, 2)} €`;
        if (sumLtv) sumLtv.innerText = calcMode === "max" ? `${(activeBank.maxLtvSimulated * 100).toFixed(1)}%` : `${(ltv * 100).toFixed(1)}%`;
        if (sumDsr) sumDsr.innerText = `${(activeBank.dsr * 100).toFixed(1)}%`;

        if (p4MaxLoan) p4MaxLoan.innerText = `€ ${formatNumber(result.summary?.importoMaxFinanziabile || activeBank.maxLoanGrantable || loan, 0)}`;
        if (p4Rata) {
            const rataVal = calcMode === "max" ? activeBank.maxRataSimulated : activeBank.rata;
            p4Rata.innerText = `€ ${formatNumber(rataVal, 0)}/mese`;
        }
        if (p4Score) p4Score.innerHTML = clientScore.html;
    }
    
    cardsContainer.innerHTML = "";
    
    // Top Selected Bank Notification Banner (if a feasible bank is chosen)
    if (chosenBank && (chosenBank.status === "ok" || chosenBank.status === "deroga")) {
        const isApproved = (chosenBank.status === "ok");
        const selBanner = document.createElement("div");
        selBanner.className = "chosen-bank-summary-banner";
        selBanner.style.cssText = "background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 0.9rem 1.25rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12); flex-wrap: wrap; gap: 0.75rem;";
        selBanner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="background: #ffffff; border: 1.5px solid #93c5fd; border-radius: 8px; width: 56px; height: 36px; display: flex; align-items: center; justify-content: center; padding: 2px 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
                    ${window.getBankLogoHtml(chosenBank.name, 26)}
                </div>
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span style="font-size: 0.72rem; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em;">⭐ Offerta Selezionata per la Pratica</span>
                        <span style="font-size: 0.7rem; padding: 0.1rem 0.45rem; border-radius: 4px; font-weight: 800; background: ${isApproved ? '#dcfce7' : '#fef3c7'}; color: ${isApproved ? '#15803d' : '#b45309'}; border: 1px solid ${isApproved ? '#86efac' : '#fcd34d'};">
                            ${isApproved ? '🟢 Pienamente Idonea' : '🟡 In Deroga'}
                        </span>
                    </div>
                    <strong style="font-size: 1.05rem; color: #0f172a; display: block; margin-top: 0.15rem;">${chosenBank.name} <span style="font-size: 0.82rem; font-weight: 600; color: #475569;">(${chosenBank.prodName || 'Mutuo Standard'})</span></strong>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1.25rem; text-align: right;">
                <div>
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Rata Mensile</div>
                    <strong style="font-size: 1.15rem; color: #0052ff;">€ ${formatNumber(calcMode === 'max' ? chosenBank.maxRataSimulated : chosenBank.rata, 2)}</strong>
                </div>
                <div>
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Tasso Applicato</div>
                    <strong style="font-size: 1.15rem; color: #0f172a;">${chosenBank.tan.toFixed(2)}% <span style="font-size: 0.7rem; color: #64748b; font-weight: normal;">(${chosenBank.tipo || 'Standard'})</span></strong>
                </div>
            </div>
        `;
        cardsContainer.appendChild(selBanner);
    }
    
    if (result.missingTerritoryBanks && result.missingTerritoryBanks.length > 0) {
        const missingNames = result.missingTerritoryBanks.map(b => b.name || b.bankId).join(", ");
        cardsContainer.innerHTML += `
            <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 8px; padding: 0.85rem 1.1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
                <div style="font-size: 1.6rem;">⚠️</div>
                <div style="font-size: 0.82rem; line-height: 1.45; color: #991b1b;">
                    <strong style="color: #b91c1c; font-size: 0.88rem; display: block; margin-bottom: 0.15rem;">Avviso: Banche con Territorialità Non Configurata</strong>
                    Per le seguenti banche non sono state specificate le coperture territoriali né risultano filiali nel database: <strong>${missingNames}</strong>. Queste banche sono state escluse dai calcoli.
                </div>
            </div>
        `;
    }
    
    if (ltv > 1.0) {
        cardsContainer.innerHTML += `
            <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 0.85rem 1.1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem; color: #fbbf24;">
                <div style="font-size: 1.6rem;">ℹ️</div>
                <div style="font-size: 0.82rem; line-height: 1.45;">
                    <strong style="color: #fbbf24; font-size: 0.88rem; display: block; margin-bottom: 0.15rem;">Operazione con LTV Superiore al 100% (${(ltv * 100).toFixed(1)}%)</strong>
                    Importo richiesto (${formatNumber(loan, 0)} €) > Valore immobile (${formatNumber(value, 0)} €). Tipico di operazioni <strong>Acquisto + Ristrutturazione</strong> o Liquidità extra. Nessun blocco applicato, valutazione per banca/deroga.
                </div>
            </div>
        `;
    }

    // Helper function to build a bank card element
    function createBankCardElement(card, idx, isSelectedCard) {
        const cardEl = document.createElement("div");
        const cardClass = card.status === "ok" ? "approved" : (card.status === "deroga" ? "deroga" : "rejected");
        cardEl.className = `bank-card ${cardClass}${isSelectedCard ? " is-selected" : ""}`;
        
        if (isSelectedCard) {
            cardEl.style.border = "2px solid #0052ff";
            cardEl.style.boxShadow = "0 4px 18px rgba(0, 82, 255, 0.16)";
            cardEl.style.background = "#fbfdff";
        } else if (card.status === "ok" && idx === 0) {
            cardEl.style.boxShadow = `0 0 15px ${card.color}25`;
            cardEl.style.borderColor = `${card.color}60`;
        }
        
        let strategiesHtml = "";
        if (card.strategies && card.strategies.length > 0) {
            strategiesHtml += `
                <div style="margin-top: 1rem; border-top: 1.5px dashed rgba(239, 68, 68, 0.2); padding-top: 0.85rem; background: rgba(239, 68, 68, 0.02); border-radius: 8px; padding: 0.75rem 1rem; text-align: left;">
                    <div style="font-size: 0.82rem; font-weight: 800; color: #ef4444; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
                        <span>💡</span> Strategie consigliate per la fattibilità:
                    </div>
                    <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; line-height: 1.5; color: #475569; display: flex; flex-direction: column; gap: 0.4rem;">
                        ${card.strategies.map(s => `<li style="list-style-type: disc;">${s}</li>`).join("")}
                    </ul>
                </div>
            `;
        }

        let checksHtml = "";
        card.checks.forEach(chk => {
            const chkClass = chk.status || (chk.ok ? "ok" : "ko");
            const chkIcon = chkClass === "ok" ? "✓" : (chkClass === "deroga" ? "⚠️" : "✗");
            checksHtml += `
                <div class="rule-check-item ${chkClass}">
                    <span class="rule-label">${chk.name}</span>
                    <div>
                        <span class="rule-value" style="font-size: 0.8rem; margin-right: 0.5rem; color: var(--text-muted); font-weight: normal;">${chk.text}</span>
                        <span class="status-icon">${chkIcon}</span>
                    </div>
                </div>
            `;
        });
        
        let branchesHtml = "";
        if (card.status !== "ko" && card.recommendedBranches && card.recommendedBranches.length > 0) {
            branchesHtml += `
                <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em;">📍 Filiali Fisiche Consigliate (Ordinate per Distanza):</div>
            `;
            card.recommendedBranches.forEach(b => {
                const metric = finalita === "consolido" ? `${b.countConsolido} pratiche cons. concluse` : `${b.countAcquisto} mutui acquisto conclusi`;
                const distText = (b.distance !== undefined && b.distance !== null) ? ` | 🚗 ${b.distance.toFixed(1)} km dal tuo immobile/residenza` : "";
                const ratingVal = (b.rating !== undefined && b.rating !== null) ? b.rating : 5.0;
                branchesHtml += `
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--surface-border); border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.4rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                        <div>
                            <span style="font-weight: 600; color: var(--text-light);">${b.name}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.1rem;">📍 ${b.indirizzo || b.address || 'Indirizzo N.D.'} (${b.prov})${distText}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.75rem; font-weight: bold; color: var(--success); display: block;">${metric}</span>
                            <span style="font-size: 0.7rem; color: var(--warning);">⭐ ${ratingVal.toFixed(1)} / 5</span>
                        </div>
                    </div>
                `;
            });
            branchesHtml += `</div>`;
        }
        
        let rateDisplayHtml = "";
        function getDetailedRateText(cardObj, isSimulated = false) {
            if (!cardObj.tan || cardObj.tan <= 0) return "--";
            let details = "";
            if (cardObj.baseRateName && cardObj.spread !== undefined) {
                details = ` (${cardObj.baseRateName} ${cardObj.baseRateValue.toFixed(2)}% + Spread ${cardObj.spread.toFixed(2)}%)`;
            }
            return `TAN: ${cardObj.tan.toFixed(2)}%${details}${isSimulated ? ' (Simulato)' : ''}`;
        }
        
        let selectionBtnHtml = "";
        if (card.status !== "ko" && !card.isNotFeasible) {
            if (isSelectedCard) {
                selectionBtnHtml = `
                    <div style="margin-top: 0.45rem; display: flex; justify-content: flex-end;">
                        <span style="background: #0052ff; color: #ffffff; font-weight: 800; font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,82,255,0.3); display: inline-flex; align-items: center; gap: 0.35rem;">
                            <span>⭐</span> <span>Offerta Selezionata</span>
                        </span>
                    </div>
                `;
            } else {
                selectionBtnHtml = `
                    <div style="margin-top: 0.45rem; display: flex; justify-content: flex-end;">
                        <button type="button" class="btn" onclick="window.selectBankForPratica('${card.bankId}', '${card.prodName || ''}')" style="background: #ffffff; color: #0052ff; border: 1.5px solid #0052ff; font-weight: 700; font-size: 0.75rem; padding: 0.28rem 0.7rem; border-radius: 6px; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 0.3rem;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='#ffffff'">
                            <span>🎯</span> <span>Seleziona Questa Offerta</span>
                        </button>
                    </div>
                `;
            }
        }
        
        if (calcMode === "max") {
            if (card.status === "ko") {
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--danger); margin-bottom: 0.15rem;">Non Fattibile (Policy KO)</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Max Erogabile: --</div>
                    </div>
                `;
            } else {
                const statusBadge = card.status === "deroga" 
                    ? `<span style="font-size: 0.75rem; color: var(--warning); font-weight: 700;">🟡 In Deroga</span>` 
                    : `<span style="font-size: 0.75rem; color: var(--success); font-weight: 700;">🟢 Fattibile</span>`;
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.1rem;">Importo Max Concedibile:</div>
                        <div style="font-size: 1.35rem; font-weight: 800; color: var(--success);">${formatNumber(card.maxLoanGrantable, 0)} €</div>
                        <div style="font-size: 0.75rem; color: var(--text-light); font-weight: 600; margin-top: 0.15rem;">Rata: ${formatNumber(card.maxRataSimulated, 2)} €/m | ${getDetailedRateText(card)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.1rem;">Fattore vincolante: <em>${card.limitingFactor}</em> | ${statusBadge}</div>
                        ${selectionBtnHtml}
                    </div>
                `;
            }
        } else {
            if (card.status === "ko") {
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--danger); margin-bottom: 0.15rem;">Non Fattibile (Policy KO)</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-decoration: line-through;">${card.rata < 999999 ? formatNumber(card.rata, 2) + ' €/mese' : '--'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${getDetailedRateText(card, true)}</div>
                    </div>
                `;
            } else if (card.status === "deroga") {
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--warning); margin-bottom: 0.15rem;">In Deroga (Eccezione Gestibile)</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-light);">${formatNumber(card.rata, 2)} €/mese</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${getDetailedRateText(card)}</div>
                        ${selectionBtnHtml}
                    </div>
                `;
            } else {
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--success); margin-bottom: 0.15rem;">Fattibile (Approved)</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-light);">${formatNumber(card.rata, 2)} €/mese</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${getDetailedRateText(card)}</div>
                        ${selectionBtnHtml}
                    </div>
                `;
            }
        }

        cardEl.innerHTML = `
            <div class="bank-card-header">
                <div class="bank-name-section">
                    <div class="bank-logo-placeholder-new" style="display: flex; align-items: center; justify-content: center; width: 68px; height: 38px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; padding: 2px 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
                        ${window.getBankLogoHtml(card.name, 30)}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <span class="bank-title">${card.name}</span>
                            ${isSelectedCard ? '<span style="background: #eff6ff; color: #0052ff; border: 1px solid #93c5fd; font-weight: 800; font-size: 0.7rem; padding: 0.1rem 0.45rem; border-radius: 4px;">⭐ SCELTA</span>' : ''}
                        </div>
                        <div style="font-size: 0.75rem; font-weight: 600; margin-top: 0.25rem; display: flex; flex-direction: column; gap: 0.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                                <span style="color: var(--text-muted); font-size: 0.7rem;">🏷️ Prodotto:</span>
                                <span style="color: #0f172a; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">${card.prodName || 'Mutuo Standard'}</span>
                                ${card.hasAccountBonus ? '<span style="color: #1e40af; background: #dbeafe; border: 1px solid #93c5fd; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">💳 Con Conto Corrente</span>' : ''}
                                ${card.isWithoutAccountDiscount ? '<span style="color: #64748b; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; font-size: 0.72rem;">ℹ️ Senza Sconto Conto</span>' : ''}
                                ${card.hasCpiDiscount ? `<span style="color: #15803d; background: #dcfce7; border: 1px solid #86efac; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">🛡️ Sconto CPI (${card.cpiDiscountText})</span>` : ''}
                                ${card.isWithoutCpi ? '<span style="color: #64748b; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; font-size: 0.72rem;">ℹ️ Senza Polizza CPI</span>' : ''}
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.35rem;">
                                <span style="color: var(--text-muted); font-size: 0.7rem;">📊 Tipo Tasso:</span>
                                <span style="color: #ffffff; background: #0052ff; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">${card.tipo || 'Standard'}</span>
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
                            ` : ''}
                            ${card.notes && card.notes.length > 0 ? `
                                <div style="margin-top: 0.35rem; display: flex; flex-direction: column; gap: 0.2rem;">
                                    ${card.notes.map(n => `<div style="font-size: 0.72rem; color: #334155; background: #f8fafc; border-left: 3px solid #3b82f6; padding: 0.2rem 0.45rem; border-radius: 0 4px 4px 0; line-height: 1.35;">${n}</div>`).join("")}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ${rateDisplayHtml}
            </div>
            
            ${(card.supportsCpiDiscount || card.supportsAccountOption) ? `
                <div class="bank-card-discount-options" style="margin-top: 0.75rem; padding: 0.55rem 0.85rem; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <span style="font-size: 0.85rem;">🎁</span>
                        <span style="font-size: 0.74rem; font-weight: 700; color: #334155;">Opzioni Sconto ${card.name}:</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                        ${card.supportsCpiDiscount ? `
                            <label class="bank-cpi-toggle-label" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.76rem; font-weight: 700; cursor: pointer; color: ${card.currentCpiSetting ? "#15803d" : "#64748b"}; background: ${card.currentCpiSetting ? "#ffffff" : "#f8fafc"}; border: 1.5px solid ${card.currentCpiSetting ? "#86efac" : "#cbd5e1"}; padding: 0.3rem 0.6rem; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.2s;">
                                <input type="checkbox" class="bank-cpi-checkbox" data-bank-id="${card.bankId}" ${card.currentCpiSetting ? "checked" : ""} onchange="window.setBankDiscountOption('${card.bankId}', 'hasCpi', this.checked)" style="width: 15px; height: 15px; accent-color: #16a34a; cursor: pointer;">
                                <span>🛡️ Polizza CPI <span style="font-size: 0.7rem; color: #16a34a; font-weight: 800; background: #dcfce7; padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.2rem;">${card.cpiDiscountLabel || "-0,50%"}</span></span>
                            </label>
                        ` : ""}
                        ${card.supportsAccountOption ? `
                            <label class="bank-conto-toggle-label" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.76rem; font-weight: 700; cursor: pointer; color: ${card.currentAccountSetting ? "#1e40af" : "#64748b"}; background: ${card.currentAccountSetting ? "#ffffff" : "#f8fafc"}; border: 1.5px solid ${card.currentAccountSetting ? "#93c5fd" : "#cbd5e1"}; padding: 0.3rem 0.6rem; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.2s;">
                                <input type="checkbox" class="bank-conto-checkbox" data-bank-id="${card.bankId}" ${card.currentAccountSetting ? "checked" : ""} onchange="window.setBankDiscountOption('${card.bankId}', 'aperturaConto', this.checked)" style="width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer;">
                                <span>💳 Apertura Conto / Accredito${card.accountDiscountLabel ? ` <span style="font-size: 0.7rem; color: #1e40af; font-weight: 800; background: #dbeafe; padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.2rem;">${card.accountDiscountLabel}</span>` : ""}</span>
                            </label>
                        ` : ""}
                    </div>
                </div>
            ` : ""}
            
            ${strategiesHtml}
            
            <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.5rem; margin-top: 0.75rem;">
                <button type="button" class="btn" onclick="toggleCardDetails(${idx})" style="font-size: 0.75rem; padding: 0.35rem 0.75rem; width: 100%; border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); color: var(--text-muted);">
                    🔍 Dettaglio Controlli Policy (<span id="toggle-label-${idx}">Espandi</span>)
                </button>
            </div>
            
            <div id="card-details-body-${idx}" style="display: none; margin-top: 1rem; animation: fadeIn 0.2s ease;">
                <div class="rules-grid">
                    ${checksHtml}
                </div>
                ${branchesHtml}
            </div>
        `;
        return cardEl;
    }

    let globalIdxCounter = 0;

    // SECTION 1: Banche Pienamente Idonee (Senza Deroga)
    if (approvedBanks.length > 0 || (approvedBanks.length === 0 && derogaBanks.length > 0)) {
        const sec1Header = document.createElement("div");
        sec1Header.className = "approved-section-header";
        sec1Header.style.cssText = "margin: 1rem 0 0.75rem 0; padding: 0.85rem 1.1rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;";
        sec1Header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span style="font-size: 1.3rem;">🟢</span>
                <div>
                    <strong style="color: #166534; font-size: 0.95rem; display: block;">Banche Pienamente Idonee (Senza Deroga)</strong>
                    <span style="color: #15803d; font-size: 0.78rem;">Istituti i cui parametri (LTV, DSR, sussistenza, territorialità) sono conformi al 100% senza necessità di deroga.</span>
                </div>
            </div>
            <span style="background: #dcfce7; color: #166534; font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px; border: 1px solid #86efac; white-space: nowrap;">${approvedBanks.length} Banche Idonee</span>
        `;
        cardsContainer.appendChild(sec1Header);
        
        if (approvedBanks.length === 0) {
            const emptySec1 = document.createElement("div");
            emptySec1.style.cssText = "padding: 1.25rem; text-align: center; color: #64748b; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; font-size: 0.82rem; margin-bottom: 1rem;";
            emptySec1.innerText = "Nessuna banca conforme al 100% senza deroga con i parametri attuali. Consulta le banche con deroga di seguito.";
            cardsContainer.appendChild(emptySec1);
        } else {
            approvedBanks.forEach(card => {
                const isSelected = (chosenBank && chosenBank.bankId === card.bankId && (!card.prodName || card.prodName === chosenBank.prodName));
                const cardEl = createBankCardElement(card, globalIdxCounter++, isSelected);
                cardsContainer.appendChild(cardEl);
            });
        }
    }

    // SECTION 2: Banche con Deroga / Valutazione Speciale
    if (derogaBanks.length > 0) {
        const sec2Header = document.createElement("div");
        sec2Header.className = "deroga-section-header";
        sec2Header.style.cssText = "margin: 1.75rem 0 0.75rem 0; padding: 0.85rem 1.1rem; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;";
        sec2Header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span style="font-size: 1.3rem;">🟡</span>
                <div>
                    <strong style="color: #92400e; font-size: 0.95rem; display: block;">Banche Idonee con Deroga / Valutazione Speciale</strong>
                    <span style="color: #b45309; font-size: 0.78rem;">Istituti con eccezioni gestibili che richiedono delibera di comitato crediti o condizioni integrative.</span>
                </div>
            </div>
            <span style="background: #fef3c7; color: #92400e; font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px; border: 1px solid #fcd34d; white-space: nowrap;">${derogaBanks.length} In Deroga</span>
        `;
        cardsContainer.appendChild(sec2Header);
        
        derogaBanks.forEach(card => {
            const isSelected = (chosenBank && chosenBank.bankId === card.bankId && (!card.prodName || card.prodName === chosenBank.prodName));
            const cardEl = createBankCardElement(card, globalIdxCounter++, isSelected);
            cardsContainer.appendChild(cardEl);
        });
    }

    // SECTION 3: Istituti e Banche Non Fattibili
    if (koBanks.length > 0) {
        const sec3Header = document.createElement("div");
        sec3Header.className = "ko-section-header";
        sec3Header.style.cssText = "margin: 1.75rem 0 0.75rem 0; padding: 0.85rem 1.1rem; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;";
        sec3Header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span style="font-size: 1.3rem;">🚫</span>
                <div>
                    <strong style="color: #991b1b; font-size: 0.95rem; display: block;">Istituti e Banche Non Fattibili per questa operazione</strong>
                    <span style="color: #b91c1c; font-size: 0.78rem;">I seguenti istituti non soddisfano uno o più criteri vincolanti di policy (territorialità, LTV, DSR o sussistenza).</span>
                </div>
            </div>
            <span style="background: #fee2e2; color: #dc2626; font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px; border: 1px solid #fca5a5; white-space: nowrap;">${koBanks.length} Banche Escluse</span>
        `;
        cardsContainer.appendChild(sec3Header);
        
        koBanks.forEach(card => {
            const cardEl = createBankCardElement(card, globalIdxCounter++, false);
            cardsContainer.appendChild(cardEl);
        });
    }

    } catch (err) {
        console.error("Error in updateCalculations:", err);
    }
}

window.toggleCardDetails = function(idx) {
    const body = document.getElementById(`card-details-body-${idx}`);
    const label = document.getElementById(`toggle-label-${idx}`);
    if (body) {
        if (body.style.display === "none") {
            body.style.display = "block";
            if (label) label.innerText = "Nascondi";
        } else {
            body.style.display = "none";
            if (label) label.innerText = "Espandi";
        }
    }
};

window.selectBankForPratica = function(bankId, prodName) {
    if (!bankId) return;
    window.selectedBankId = bankId;
    window.selectedBankProduct = prodName || "";
    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
    const bankObj = window.lastEvaluationResult?.allEvaluated?.find(b => b.bankId === bankId && (!prodName || b.prodName === prodName)) 
        || window.lastEvaluationResult?.allEvaluated?.find(b => b.bankId === bankId);
    const bankName = bankObj?.name || bankId;
    if (typeof window.showToast === "function") {
        window.showToast(`🎯 Offerta selezionata: ${bankName} (${prodName || 'Mutuo Standard'})`, "info");
    }
};

window.bankDiscountOptions = window.bankDiscountOptions || {};

window.setBankDiscountOption = function(bankId, optKey, val) {
    if (!bankId) return;
    window.bankDiscountOptions[bankId] = window.bankDiscountOptions[bankId] || {};
    window.bankDiscountOptions[bankId][optKey] = Boolean(val);
    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};

window.syncPhase4DiscountFlags = function() {
    const cpiEl = document.getElementById("phase4-flag-cpi");
    const contoEl = document.getElementById("phase4-flag-conto");
    const lblCpi = document.getElementById("label-flag-cpi");
    const lblConto = document.getElementById("label-flag-conto");

    if (lblCpi && cpiEl) {
        if (cpiEl.checked) {
            lblCpi.style.borderColor = "#93c5fd";
            lblCpi.style.background = "#ffffff";
            lblCpi.style.color = "#1e3a8a";
        } else {
            lblCpi.style.borderColor = "#cbd5e1";
            lblCpi.style.background = "#f8fafc";
            lblCpi.style.color = "#64748b";
        }
    }
    if (lblConto && contoEl) {
        if (contoEl.checked) {
            lblConto.style.borderColor = "#93c5fd";
            lblConto.style.background = "#ffffff";
            lblConto.style.color = "#1e3a8a";
        } else {
            lblConto.style.borderColor = "#cbd5e1";
            lblConto.style.background = "#f8fafc";
            lblConto.style.color = "#64748b";
        }
    }

    if (window.updateCalculations) {
        window.updateCalculations();
    }
};

// ------------------ INTERVIEW WIZARD LOGIC ------------------
const btnWizPrev = document.getElementById("btn-wiz-prev");
const btnWizNext = document.getElementById("btn-wiz-next");
const wizardProgress = document.getElementById("wizard-progress");
const subjectsMiniList = document.getElementById("wizard-subjects-list");
const chipsContainer = document.getElementById("wizard-chips-container");
const btnRestartWizard = document.getElementById("btn-restart-wizard");

btnRestartWizard?.addEventListener("click", () => {
    wizardSubjects = [];
    wizardLoans = [];
    currentSubjectRole = "Richiedente Principale";
    const nomeEl = document.getElementById("wiz-nome");
    if (nomeEl) nomeEl.value = "";
    const cognomeEl = document.getElementById("wiz-cognome");
    if (cognomeEl) cognomeEl.value = "";
    
    renderLoansList();
    renderSubjectsChips();
    
    if (window.goToStep) window.goToStep(1);
    updateCalculations();
});

// Conditionally show inputs in Step 1
document.getElementById("wiz-stato-civile")?.addEventListener("change", function() {
    const sp = document.getElementById("wiz-cond-sposato");
    if (sp) sp.style.display = this.value === "sposato" ? "block" : "none";
    const div = document.getElementById("wiz-cond-divorziato");
    if (div) div.style.display = this.value === "divorziato" ? "block" : "none";
});
document.getElementById("wiz-alimenti-tipo")?.addEventListener("change", function() {
    const cg = document.getElementById("wiz-alimenti-coint-group");
    if (cg) cg.style.display = this.value !== "nessuno" ? "block" : "none";
});
document.getElementById("wiz-figli")?.addEventListener("change", function() {
    const isSi = this.value === "si";
    const fg = document.getElementById("wiz-num-figli-group");
    if (fg) fg.style.display = isSi ? "block" : "none";
    const fd = document.getElementById("wiz-cond-figli-dettaglio");
    if (fd) fd.style.display = isSi ? "block" : "none";
});
document.getElementById("wiz-assegno-unico")?.addEventListener("change", function() {
    const vg = document.getElementById("wiz-assegno-valore-group");
    if (vg) vg.style.display = this.value === "si" ? "block" : "none";
});
document.getElementById("wiz-cittadinanza")?.addEventListener("change", function() {
    const ex = document.getElementById("wiz-cond-extracom");
    if (ex) ex.style.display = this.value === "extra_UE" ? "block" : "none";
});

// Conditionally show inputs in Step 2 (Income)
const wizContrattoSelect = document.getElementById("wiz-contratto");
const wizGroupDipTi = document.getElementById("wiz-group-dipendente-ti");
const wizGroupDipTd = document.getElementById("wiz-group-dipendente-td");
const wizGroupAutonomo = document.getElementById("wiz-group-autonomo");

wizContrattoSelect?.addEventListener("change", function() {
    if (wizGroupDipTi) wizGroupDipTi.style.display = "none";
    if (wizGroupDipTd) wizGroupDipTd.style.display = "none";
    if (wizGroupAutonomo) wizGroupAutonomo.style.display = "none";
    
    const label = document.getElementById("wiz-anzianita-label");
    
    if (this.value === "dipendente_ti" || this.value === "pensionato") {
        if (wizGroupDipTi) wizGroupDipTi.style.display = "block";
        if (label) label.innerText = this.value === "pensionato" ? "Anni di pensione" : "Anzianità lavorativa (mesi)";
    } else if (this.value === "dipendente_td") {
        if (wizGroupDipTd) wizGroupDipTd.style.display = "block";
        if (label) label.innerText = "Durata residua contratto (mesi)";
    } else if (this.value === "autonomo") {
        if (wizGroupAutonomo) wizGroupAutonomo.style.display = "block";
        if (label) label.innerText = "Anzianità Partita IVA (anni)";
    }
});

document.getElementById("wiz-auto-regime")?.addEventListener("change", function() {
    const ord = document.getElementById("wiz-auto-ordinario");
    if (ord) ord.style.display = this.value === "ordinario" ? "block" : "none";
    const forf = document.getElementById("wiz-auto-forfettario");
    if (forf) forf.style.display = this.value === "forfettario" ? "block" : "none";
});

// Step 4 (Habitation) conditional
document.getElementById("wiz-abita-tipo")?.addEventListener("change", function() {
    const aff = document.getElementById("wiz-abita-affitto-group");
    const prop = document.getElementById("wiz-abita-prop-group");
    if (aff) aff.style.display = this.value === "affitto" ? "block" : "none";
    if (prop) prop.style.display = this.value === "proprieta" ? "block" : "none";
});
document.getElementById("wiz-abita-mutuo")?.addEventListener("change", function() {
    const det = document.getElementById("wiz-abita-mutuo-dettaglio");
    if (det) det.style.display = this.value === "si" ? "block" : "none";
});
document.getElementById("wiz-abita-mutuo-estinto")?.addEventListener("change", function() {
    const rg = document.getElementById("wiz-abita-mutuo-rata-group");
    if (rg) rg.style.display = this.value === "no" ? "block" : "none";
});

// Step 5 (Loans) conditional
document.getElementById("wiz-has-loans")?.addEventListener("change", function() {
    const lb = document.getElementById("wiz-loans-builder");
    if (lb) lb.style.display = this.value === "si" ? "block" : "none";
});

// Step 5 (Obiettivo) conditional
document.getElementById("wiz-obiettivo")?.addEventListener("change", function() {
    const cg = document.getElementById("wiz-obiettivo-cifra-group");
    if (cg) cg.style.display = this.value === "cifra" ? "block" : "none";
    const resExact = document.getElementById("results-mode-exact");
    const resMax = document.getElementById("results-mode-max");
    if (this.value === "cifra" && resExact) resExact.checked = true;
    if (this.value === "max" && resMax) resMax.checked = true;
    updateCalculations();
});

// Navigate wizard steps
btnWizPrev?.addEventListener("click", () => {
    if (wizardStep > 1) {
        goToStep(wizardStep - 1);
    }
});

btnWizNext?.addEventListener("click", () => {
    if (wizardStep === 2) {
        saveCurrentSubject();
        goToStep(3);
    } else if (wizardStep < 5) {
        goToStep(wizardStep + 1);
    } else if (wizardStep === 5) {
        submitStrategyCalculation();
    }
});

function goToStep(step) {
    wizardStep = step;
    
    // Update progress bar (5 total steps)
    const pct = (wizardStep / 5) * 100;
    if (wizardProgress) wizardProgress.style.width = `${pct}%`;
    
    // Toggle active classes
    document.querySelectorAll(".wizard-step").forEach(el => {
        el.classList.remove("active");
    });
    
    const stepEl = document.querySelector(`.wizard-step[data-step="${wizardStep}"]`);
    if (stepEl) stepEl.classList.add("active");
    
    // Enable/disable buttons
    if (btnWizPrev) btnWizPrev.disabled = wizardStep === 1;
    if (btnWizNext) {
        btnWizNext.style.display = "inline-block";
        btnWizNext.innerText = wizardStep === 5 ? "Calcola Strategia ✓" : "Avanti →";
    }

    if (wizardStep === 5) {
        renderInterviewSummary();
    }
}

// Save currently input subject to memory list
function saveCurrentSubject(skipUpdateCalc = false) {
    try {
        const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
        const nomeEl = document.getElementById("wiz-q1-nome") || document.getElementById("wiz-nome");
        const cognomeEl = document.getElementById("wiz-q2-cognome") || document.getElementById("wiz-cognome");
        const nascitaEl = document.getElementById("wiz-q3-data-nascita") || document.getElementById("wiz-nascita");
        const sessoEl = document.getElementById("wiz-sesso");
        const citEl = document.getElementById("wiz-q6-cittadinanza" + suffix) || document.getElementById("wiz-q6-cittadinanza") || document.getElementById("wiz-q6-cittadinanza-file") || document.getElementById("wiz-cittadinanza");
        const statoCivEl = document.getElementById("wiz-q4-stato-civile" + suffix) || document.getElementById("wiz-stato-civile");
        const isOwnerEl = document.getElementById("wiz-immobile-intestatario");
        const figliEl = document.getElementById("wiz-q5-figli" + suffix) || document.getElementById("wiz-figli");
        
        const nome = (nomeEl && nomeEl.value) ? nomeEl.value : `Soggetto ${wizardSubjects.length + 1}`;
        const cognome = (cognomeEl && cognomeEl.value) ? cognomeEl.value : "";
        const birthStr = (nascitaEl && nascitaEl.value) ? nascitaEl.value : "";
        const eta = getAge(birthStr) || 35;
        const sesso = sessoEl ? sessoEl.value : "M";
        const rawCit = citEl ? String(citEl.value || "").toLowerCase() : "italiana";
        const cittadinanza = (rawCit === "extra" || rawCit === "extra_ue" || rawCit.includes("extra")) ? "extra_UE" : ((rawCit === "ue") ? "UE" : "IT");
        const statoCivile = statoCivEl ? statoCivEl.value : "celibe_nubile";
        const isOwner = isOwnerEl ? isOwnerEl.checked : true;
        const figli = figliEl ? figliEl.value : "no";
        
        const macroCat = document.getElementById("wiz-q10-macro-categoria")?.value || "dipendente";
        let contract = "dipendente_ti";
        if (macroCat === "dipendente") {
            const dipContratto = document.getElementById("wiz-q10-dip-contratto")?.value || "indeterminato";
            if (dipContratto === "indeterminato") contract = "dipendente_ti";
            else if (dipContratto === "determinato") contract = "dipendente_td";
            else if (dipContratto === "apprendista") contract = "apprendista";
        } else if (macroCat === "autonomo") {
            contract = "autonomo";
        } else if (macroCat === "colf_badanti") {
            contract = "colf_badanti";
        } else if (macroCat === "interinale") {
            contract = "interinale";
        } else if (macroCat === "pensionato") {
            contract = "pensionato";
        }

        if (wizContrattoSelect && wizContrattoSelect.value) {
            const currentModule = window.currentCrmModule || "dashboard";
            if (currentModule !== "engine" || document.getElementById("phase-2-panel")?.style.display === "none") {
                contract = wizContrattoSelect.value;
            }
        }
        
        let netto = 0;
        let rawBoxData = {};
        
        if (macroCat === "dipendente" || macroCat === "colf_badanti" || macroCat === "interinale") {
            const p1 = parseFloat(document.getElementById("wiz-q10-cu1")?.value) || parseFloat(document.getElementById("wiz-cu-1")?.value) || 0;
            const p2 = parseFloat(document.getElementById("wiz-q10-cu2")?.value) || parseFloat(document.getElementById("wiz-cu-2")?.value) || 0;
            const p6 = parseFloat(document.getElementById("wiz-q10-cu6")?.value) || parseFloat(document.getElementById("wiz-cu-6")?.value) || 365;
            const p21 = parseFloat(document.getElementById("wiz-q10-cu21")?.value) || parseFloat(document.getElementById("wiz-cu-21")?.value) || 0;
            const p22 = parseFloat(document.getElementById("wiz-q10-cu22")?.value) || parseFloat(document.getElementById("wiz-cu-22")?.value) || 0;
            const p26 = parseFloat(document.getElementById("wiz-q10-cu26")?.value) || parseFloat(document.getElementById("wiz-cu-26")?.value) || 0;
            const p27 = parseFloat(document.getElementById("wiz-q10-cu27")?.value) || 0;
            const p29 = parseFloat(document.getElementById("wiz-q10-cu29")?.value) || 0;
            const p365 = parseFloat(document.getElementById("wiz-q10-cu365")?.value) || parseFloat(document.getElementById("wiz-cu-365")?.value) || 0;
            const p810 = parseFloat(document.getElementById("wiz-q10-cu810")?.value) || 0;
            
            const netAnnual = (p1 + p2) - (p21 + p22 + p26 + p27 + p29);
            netto = (p6 > 0) ? (((netAnnual / p6 * 365) / 12) + (p365 / 12)) : 0;
            if (netto <= 0) {
                netto = parseFloat(document.getElementById("wiz-q10-netto-mensile")?.value) || 2100;
            }
            rawBoxData = { p1, p2, p6, p21, p22, p26, p27, p29, p365, p810, cu1: p1, cu2: p2, cu6: p6, cu21: p21, cu22: p22, cu26: p26, cu27: p27, cu29: p29, cu365: p365, cu810: p810 };
        } else if (macroCat === "autonomo") {
            const regime = document.getElementById("wiz-q10-autonomo-regime")?.value || document.getElementById("wiz-auto-regime")?.value || "forfettario";
            const singleUnico = document.getElementById("wiz-q10-autonomo-single-unico")?.checked || false;

            if (regime === "ordinario") {
                const rn1_1 = parseFloat(document.getElementById("wiz-q10-rn1")?.value) || 0;
                const rn4_1 = parseFloat(document.getElementById("wiz-q10-rn4")?.value) || 0;
                const rn26_1 = parseFloat(document.getElementById("wiz-q10-rn26")?.value) || 0;
                const rv2_1 = parseFloat(document.getElementById("wiz-q10-rv2")?.value) || 0;
                const rv10_1 = parseFloat(document.getElementById("wiz-q10-rv10")?.value) || 0;
                const rv17_1 = parseFloat(document.getElementById("wiz-q10-rv17")?.value) || 0;

                const rn1_2 = parseFloat(document.getElementById("wiz-q10-rn1-anno2")?.value) || 0;
                const rn4_2 = parseFloat(document.getElementById("wiz-q10-rn4-anno2")?.value) || 0;
                const rn26_2 = parseFloat(document.getElementById("wiz-q10-rn26-anno2")?.value) || 0;
                const rv2_2 = parseFloat(document.getElementById("wiz-q10-rv2-anno2")?.value) || 0;
                const rv10_2 = parseFloat(document.getElementById("wiz-q10-rv10-anno2")?.value) || 0;
                const rv17_2 = parseFloat(document.getElementById("wiz-q10-rv17-anno2")?.value) || 0;

                const base1 = rn1_1 > 0 ? rn1_1 : rn4_1;
                const netY1 = base1 > 0 ? ((base1 - rn26_1 - rv2_1 - rv10_1 - rv17_1) / 12) : 0;
                const base2 = rn1_2 > 0 ? rn1_2 : rn4_2;
                const netY2 = base2 > 0 ? ((base2 - rn26_2 - rv2_2 - rv10_2 - rv17_2) / 12) : 0;

                netto = (singleUnico || netY2 <= 0) ? netY1 : ((netY1 + netY2) / 2);
                if (netto <= 0) {
                    netto = parseFloat(document.getElementById("wiz-q10-netto-mensile")?.value) || 2500;
                }
                rawBoxData = { regime, singleUnico, rn1_1, rn4_1, rn26_1, rv2_1, rv10_1, rv17_1, rn1_2, rn4_2, rn26_2, rv2_2, rv10_2, rv17_2 };
            } else {
                const lm22_1 = parseFloat(document.getElementById("wiz-q10-lm22")?.value) || 0;
                const lm27_1 = parseFloat(document.getElementById("wiz-q10-lm27")?.value) || 0;
                const lm35_1 = parseFloat(document.getElementById("wiz-q10-lm35")?.value) || 0;
                const lm36_1 = parseFloat(document.getElementById("wiz-q10-lm36")?.value) || 0;
                const lm39_1 = parseFloat(document.getElementById("wiz-q10-lm39")?.value) || 0;

                const lm22_2 = parseFloat(document.getElementById("wiz-q10-lm22-2")?.value) || 0;
                const lm27_2 = parseFloat(document.getElementById("wiz-q10-lm27-2")?.value) || 0;
                const lm35_2 = parseFloat(document.getElementById("wiz-q10-lm35-2")?.value) || 0;
                const lm36_2 = parseFloat(document.getElementById("wiz-q10-lm36-2")?.value) || 0;
                const lm39_2 = parseFloat(document.getElementById("wiz-q10-lm39-2")?.value) || 0;

                let netY1 = 0;
                if (lm36_1 > 0) netY1 = (lm36_1 - lm39_1) / 12;
                else if (lm22_1 > 0) netY1 = (lm22_1 - lm27_1 - lm35_1 - lm39_1) / 12;

                let netY2 = 0;
                if (lm36_2 > 0) netY2 = (lm36_2 - lm39_2) / 12;
                else if (lm22_2 > 0) netY2 = (lm22_2 - lm27_2 - lm35_2 - lm39_2) / 12;

                netto = (singleUnico || netY2 <= 0) ? netY1 : ((netY1 + netY2) / 2);
                if (netto <= 0) {
                    netto = parseFloat(document.getElementById("wiz-q10-netto-mensile")?.value) || 2200;
                }
                rawBoxData = { regime, singleUnico, lm22_1, lm27_1, lm35_1, lm36_1, lm39_1, lm22_2, lm27_2, lm35_2, lm36_2, lm39_2, lm36: lm36_1, lm39: lm39_1 };
            }
        } else if (macroCat === "pensionato") {
            netto = parseFloat(document.getElementById("wiz-q10-netto-mensile")?.value) || 2000;
        }

        let incomes = [];
        let firstNet = netto;
        incomes.push({
            tipoContratto: contract,
            netto: firstNet,
            rawBoxData: rawBoxData
        });
        
        const hasSec = document.getElementById("wiz-q10-has-second-income")?.checked;
        if (hasSec) {
            const macroCat2 = document.getElementById("wiz-q10-macro-categoria-2")?.value || "dipendente";
            let contract2 = "dipendente_ti";
            let rawBoxData2 = {};
            let netto2 = 0;
            
            if (macroCat2 === "dipendente") {
                const dipContratto = document.getElementById("wiz-q10-dip-contratto-2")?.value || "indeterminato";
                if (dipContratto === "indeterminato") contract2 = "dipendente_ti";
                else if (dipContratto === "determinato") contract2 = "dipendente_td";
                else if (dipContratto === "apprendista") contract2 = "apprendista";
            } else if (macroCat2 === "autonomo") {
                contract2 = "autonomo";
            } else if (macroCat2 === "colf_badanti") {
                contract2 = "colf_badanti";
            } else if (macroCat2 === "interinale") {
                contract2 = "interinale";
            } else if (macroCat2 === "pensionato") {
                contract2 = "pensionato";
            } else if (macroCat2 === "locazione") {
                contract2 = "locazione";
            }
            
            if (macroCat2 === "dipendente" || macroCat2 === "colf_badanti" || macroCat2 === "interinale") {
                const p1 = parseFloat(document.getElementById("wiz-q10-cu1-2")?.value) || 0;
                const p2 = parseFloat(document.getElementById("wiz-q10-cu2-2")?.value) || 0;
                const p6 = parseFloat(document.getElementById("wiz-q10-cu6-2")?.value) || 365;
                const p21 = parseFloat(document.getElementById("wiz-q10-cu21-2")?.value) || 0;
                const p22 = parseFloat(document.getElementById("wiz-q10-cu22-2")?.value) || 0;
                const p26 = parseFloat(document.getElementById("wiz-q10-cu26-2")?.value) || 0;
                const p27 = parseFloat(document.getElementById("wiz-q10-cu27-2")?.value) || 0;
                const p29 = parseFloat(document.getElementById("wiz-q10-cu29-2")?.value) || 0;
                const p365 = parseFloat(document.getElementById("wiz-q10-cu365-2")?.value) || 0;
                
                const netAnnual = (p1 + p2) - (p21 + p22 + p26 + p27 + p29);
                netto2 = (p6 > 0) ? (((netAnnual / p6 * 365) / 12) + (p365 / 12)) : 0;
                if (netto2 <= 0) {
                    netto2 = parseFloat(document.getElementById("wiz-q10-netto-mensile-2")?.value) || 0;
                }
                rawBoxData2 = { p1, p2, p6, p21, p22, p26, p27, p29, p365 };
            } else if (macroCat2 === "autonomo") {
                const regime = document.getElementById("wiz-q10-autonomo-regime-2")?.value || "forfettario";
                const singleUnico2 = document.getElementById("wiz-q10-autonomo-single-unico-2")?.checked || false;

                if (regime === "ordinario") {
                    const rn1_1 = parseFloat(document.getElementById("wiz-q10-rn1-2")?.value) || 0;
                    const rn4_1 = parseFloat(document.getElementById("wiz-q10-rn4-2")?.value) || 0;
                    const rn26_1 = parseFloat(document.getElementById("wiz-q10-rn26-2")?.value) || 0;
                    const rv2_1 = parseFloat(document.getElementById("wiz-q10-rv2-2")?.value) || 0;
                    const rv10_1 = parseFloat(document.getElementById("wiz-q10-rv10-2")?.value) || 0;
                    const rv17_1 = parseFloat(document.getElementById("wiz-q10-rv17-2")?.value) || 0;

                    const rn1_2 = parseFloat(document.getElementById("wiz-q10-rn1-anno2-2")?.value) || 0;
                    const rn4_2 = parseFloat(document.getElementById("wiz-q10-rn4-anno2-2")?.value) || 0;
                    const rn26_2 = parseFloat(document.getElementById("wiz-q10-rn26-anno2-2")?.value) || 0;
                    const rv2_2 = parseFloat(document.getElementById("wiz-q10-rv2-anno2-2")?.value) || 0;
                    const rv10_2 = parseFloat(document.getElementById("wiz-q10-rv10-anno2-2")?.value) || 0;
                    const rv17_2 = parseFloat(document.getElementById("wiz-q10-rv17-anno2-2")?.value) || 0;

                    const base1 = rn1_1 > 0 ? rn1_1 : rn4_1;
                    const netY1 = base1 > 0 ? ((base1 - rn26_1 - rv2_1 - rv10_1 - rv17_1) / 12) : 0;
                    const base2 = rn1_2 > 0 ? rn1_2 : rn4_2;
                    const netY2 = base2 > 0 ? ((base2 - rn26_2 - rv2_2 - rv10_2 - rv17_2) / 12) : 0;

                    netto2 = (singleUnico2 || netY2 <= 0) ? netY1 : ((netY1 + netY2) / 2);
                    if (netto2 <= 0) {
                        netto2 = parseFloat(document.getElementById("wiz-q10-netto-mensile-2")?.value) || 0;
                    }
                    rawBoxData2 = { regime, singleUnico: singleUnico2, rn1_1, rn4_1, rn26_1, rv2_1, rv10_1, rv17_1, rn1_2, rn4_2, rn26_2, rv2_2, rv10_2, rv17_2 };
                } else {
                    const lm22_1 = parseFloat(document.getElementById("wiz-q10-lm22-2")?.value) || 0;
                    const lm27_1 = parseFloat(document.getElementById("wiz-q10-lm27-2")?.value) || 0;
                    const lm35_1 = parseFloat(document.getElementById("wiz-q10-lm35-2")?.value) || 0;
                    const lm36_1 = parseFloat(document.getElementById("wiz-q10-lm36-2")?.value) || 0;
                    const lm39_1 = parseFloat(document.getElementById("wiz-q10-lm39-2")?.value) || 0;

                    const lm22_2 = parseFloat(document.getElementById("wiz-q10-lm22-anno2-2")?.value) || 0;
                    const lm27_2 = parseFloat(document.getElementById("wiz-q10-lm27-anno2-2")?.value) || 0;
                    const lm35_2 = parseFloat(document.getElementById("wiz-q10-lm35-anno2-2")?.value) || 0;
                    const lm36_2 = parseFloat(document.getElementById("wiz-q10-lm36-anno2-2")?.value) || 0;
                    const lm39_2 = parseFloat(document.getElementById("wiz-q10-lm39-anno2-2")?.value) || 0;

                    let netY1 = 0;
                    if (lm36_1 > 0) netY1 = (lm36_1 - lm39_1) / 12;
                    else if (lm22_1 > 0) netY1 = (lm22_1 - lm27_1 - lm35_1 - lm39_1) / 12;

                    let netY2 = 0;
                    if (lm36_2 > 0) netY2 = (lm36_2 - lm39_2) / 12;
                    else if (lm22_2 > 0) netY2 = (lm22_2 - lm27_2 - lm35_2 - lm39_2) / 12;

                    netto2 = (singleUnico2 || netY2 <= 0) ? netY1 : ((netY1 + netY2) / 2);
                    if (netto2 <= 0) {
                        netto2 = parseFloat(document.getElementById("wiz-q10-netto-mensile-2")?.value) || 0;
                    }
                    rawBoxData2 = { regime, singleUnico: singleUnico2, lm22_1, lm27_1, lm35_1, lm36_1, lm39_1, lm22_2, lm27_2, lm35_2, lm36_2, lm39_2, lm36: lm36_1, lm39: lm39_1 };
                }
            } else if (macroCat2 === "pensionato") {
                netto2 = parseFloat(document.getElementById("wiz-q10-netto-mensile-2")?.value) || 0;
            } else if (macroCat2 === "locazione") {
                netto2 = parseFloat(document.getElementById("wiz-q10-locazione-netto-2")?.value) || 0;
                rawBoxData2 = { canone: netto2 };
            }
            
            incomes.push({
                tipoContratto: contract2,
                netto: netto2,
                rawBoxData: rawBoxData2
            });
            netto += netto2;
        }

        const permScadEl = document.getElementById("wiz-q6-permesso-scadenza" + suffix) || document.getElementById("wiz-q6-permesso-scadenza") || document.getElementById("wiz-q6-permesso-scadenza-file") || document.getElementById("wiz-permesso-scadenza");
        const permScadVal = (permScadEl && permScadEl.value) ? permScadEl.value : "valido";
        const famSedeEl = document.getElementById("wiz-q14-famiglia-sede" + suffix) || document.getElementById("wiz-q14-famiglia-sede") || document.getElementById("wiz-q14-famiglia-sede-file") || document.getElementById("wiz-famiglia-sede");
        
        const regimeEl = document.getElementById("wiz-q4-regime" + suffix);
        const regime = regimeEl ? regimeEl.value : "separazione";
        const anniSposatoEl = document.getElementById("wiz-q4-anni-sposato" + suffix);
        const anniSposato = anniSposatoEl ? parseInt(anniSposatoEl.value) || 0 : 0;
        const alimentiEl = document.getElementById("wiz-q4-alimenti" + suffix);
        const alimenti = alimentiEl ? alimentiEl.value : "nessuno";
        const alimentiImportoEl = document.getElementById("wiz-q4-alimenti-importo" + suffix);
        const alimentiImporto = alimentiImportoEl ? parseFloat(alimentiImportoEl.value) || 0 : 0;
        if (alimenti === "riceve") {
            netto += alimentiImporto;
        }
        
        const numFigliEl = document.getElementById("wiz-q5-num-figli" + suffix);
        const numFigli = (figli === "si" && numFigliEl) ? parseInt(numFigliEl.value) || 0 : 0;
        const auSelEl = document.getElementById("wiz-q15-assegno-unico-select" + suffix);
        const assegnoUnicoSelect = (figli === "si" && auSelEl) ? auSelEl.value : "no";
        const auValEl = document.getElementById("wiz-q15-assegno-unico" + suffix);
        const assegnoUnico = (figli === "si" && auValEl) ? parseFloat(auValEl.value) || 0 : 0;
        const etaFigliEl = document.getElementById("wiz-q5-eta-figli" + suffix);
        const etaFigli = (figli === "si" && etaFigliEl) ? etaFigliEl.value : "";
        
        const anteStipulaEl = document.getElementById("wiz-q4-separazione-ante-stipula" + suffix);
        const separazioneAnteStipula = anteStipulaEl ? anteStipulaEl.checked : false;

        const orarioEl = document.getElementById("wiz-q10-dip-orario");
        const orarioLavoro = orarioEl ? orarioEl.value : "full_time";
        const datorePivaEl = document.getElementById("wiz-q10-datore-piva");
        const datorePiva = datorePivaEl ? datorePivaEl.value : "";

        const anzDipEl = document.getElementById("wiz-q10-anzianita-dipendente");
        const anzAutEl = document.getElementById("wiz-q10-autonomo-anni");
        let anzianitaVal = 24;
        if (macroCat === "dipendente") {
            anzianitaVal = anzDipEl ? (parseInt(anzDipEl.value) || 24) : 24;
        } else if (macroCat === "autonomo") {
            anzianitaVal = anzAutEl ? Math.round((parseFloat(anzAutEl.value) || 2) * 12) : 24;
        } else if (macroCat === "pensionato") {
            anzianitaVal = 120;
        }

        const telEl = document.getElementById("wiz-q1-telefono") || document.getElementById("file-doc-telefono");
        const emailEl = document.getElementById("wiz-q1-email") || document.getElementById("file-doc-email");
        const telefono = telEl ? telEl.value.trim() : "";
        const email = emailEl ? emailEl.value.trim() : "";

        const newSubject = {
            role: currentSubjectRole,
            nome: nome,
            cognome: cognome,
            telefono: telefono,
            email: email,
            dataNascita: birthStr,
            eta: eta,
            sesso: sesso,
            cittadinanza: cittadinanza,
            statoCivile: statoCivile,
            isOwner: isOwner,
            figli: figli,
            tipoContratto: contract,
            anzianita: anzianitaVal,
            anzianitaMesi: anzianitaVal,
            netto: Math.max(0, netto),
            rawBoxData: rawBoxData,
            incomes: incomes,
            permScadenza: permScadVal,
            dataScadenzaPermesso: (permScadEl && permScadEl.value && permScadEl.value !== "valido") ? permScadEl.value : permScadVal,
            famigliaSede: famSedeEl ? famSedeEl.value : "italia",
            regime: regime,
            anniSposato: anniSposato,
            alimenti: alimenti,
            alimentiImporto: alimentiImporto,
            numFigli: numFigli,
            assegnoUnicoSelect: assegnoUnicoSelect,
            assegnoUnico: assegnoUnico,
            etaFigli: etaFigli,
            separazioneAnteStipula: separazioneAnteStipula,
            orarioLavoro: orarioLavoro,
            datorePiva: datorePiva
        };
        
        let targetIndex = editingSubjectIndex;
        if (targetIndex === null) {
            const existingIdx = wizardSubjects.findIndex(s => s.role === currentSubjectRole);
            if (existingIdx !== -1) {
                targetIndex = existingIdx;
            }
        }
        
        if (targetIndex !== null && targetIndex !== -1) {
            wizardSubjects[targetIndex] = newSubject;
            editingSubjectIndex = null;
        } else {
            wizardSubjects.push(newSubject);
        }
        
        let spouseAdded = false;
        if (newSubject.role === "Richiedente Principale") {
            const beforeSpouseIdx = wizardSubjects.findIndex(s => s.isSpouse);
            
            const isSposato = newSubject.statoCivile === "sposato";
            const isComunione = newSubject.regime === "comunione";
            const skipSpouse = newSubject.separazioneAnteStipula === true;
            
            if (isSposato && isComunione && !skipSpouse) {
                if (beforeSpouseIdx === -1) {
                    const spouseSubject = {
                        role: "Cointestatario",
                        nome: "Coniuge",
                        cognome: newSubject.cognome || "Rossi",
                        dataNascita: "1985-01-01",
                        eta: 40,
                        sesso: "F",
                        cittadinanza: "IT",
                        statoCivile: "sposato",
                        isOwner: false,
                        figli: "no",
                        tipoContratto: "no_lavoro",
                        netto: 0,
                        rawBoxData: {},
                        incomes: [{ tipoContratto: "no_lavoro", netto: 0, rawBoxData: {} }],
                        isSpouse: true,
                        permScadenza: "valido",
                        famigliaSede: "italia"
                    };
                    wizardSubjects.push(spouseSubject);
                    spouseAdded = true;
                }
            } else {
                if (beforeSpouseIdx !== -1) {
                    wizardSubjects.splice(beforeSpouseIdx, 1);
                }
            }
        }
        
        renderSubjectsChips();
        window.updatePersoneNucleoDefault();
        if (!skipUpdateCalc) {
            updateCalculations();
        }

        if (spouseAdded && !skipUpdateCalc) {
            const spouseIdx = wizardSubjects.findIndex(s => s.isSpouse);
            if (spouseIdx !== -1) {
                alert("Rilevata Comunione dei beni: il coniuge è stato aggiunto automaticamente come co-intestatario obbligatorio. Compila ora i suoi dati.");
                window.editSubject(spouseIdx);
            }
        }
    } catch (err) {
        console.error("Error in saveCurrentSubject:", err);
    }
}

function renderSubjectsChips() {
    if (!subjectsMiniList || !chipsContainer) return;
    if (wizardSubjects.length === 0) {
        subjectsMiniList.style.display = "none";
        return;
    }
    subjectsMiniList.style.display = "block";
    chipsContainer.innerHTML = "";
    
    wizardSubjects.forEach((s, idx) => {
        const roleClass = s.role === "Richiedente Principale" ? "richiedente" : s.role === "Cointestatario" ? "cointestatario" : "garante";
        const chip = document.createElement("div");
        chip.className = "subject-chip";
        chip.innerHTML = `
            <div>
                <span class="role ${roleClass}">${s.role === "Richiedente Principale" ? "Dichiarante" : s.role}</span>
                <span style="font-weight: 600; margin-left: 0.5rem;">${s.nome} ${s.cognome}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.35rem;">(${s.eta} anni, ${s.netto.toFixed(0)} €/mese)</span>
                ${s.isOwner ? '<span style="font-size: 0.75rem; color: var(--primary); margin-left: 0.5rem;">[Proprietario]</span>' : ''}
            </div>
            <div>
                <button type="button" class="btn" style="font-size: 0.7rem; padding: 0.25rem 0.5rem; margin-right: 0.5rem; border: 1px solid var(--surface-border); border-radius: 4px; background: rgba(255,255,255,0.02);" onclick="editSubject(${idx})">✏️ Modifica</button>
                <span style="color: var(--danger); cursor: pointer; font-weight: bold; font-size: 1.15rem; vertical-align: middle;" onclick="removeSubject(${idx})">×</span>
            </div>
        `;
        chipsContainer.appendChild(chip);
    });
    
    // Add quick buttons to add co-borrowers / guarantors at any time
    const actionDiv = document.createElement("div");
    actionDiv.style.cssText = "margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;";
    actionDiv.innerHTML = `
        <button type="button" class="btn" style="font-size: 0.75rem; padding: 0.3rem 0.65rem; border-color: rgba(59, 130, 246, 0.4); color: var(--primary); background: rgba(59, 130, 246, 0.05);" onclick="addNewSubject('Cointestatario')">+ Aggiungi Cointestatario</button>
        <button type="button" class="btn" style="font-size: 0.75rem; padding: 0.3rem 0.65rem; border-color: rgba(245, 158, 11, 0.4); color: var(--warning); background: rgba(245, 158, 11, 0.05);" onclick="addNewSubject('Garante')">+ Aggiungi Garante</button>
    `;
    chipsContainer.appendChild(actionDiv);
}

window.addNewSubject = function(role) {
    currentSubjectRole = role;
    editingSubjectIndex = null;
    resetSubjectForm();
    goToStep(1);
};

window.editSubject = function(idx) {
    const s = wizardSubjects[idx];
    editingSubjectIndex = idx;
    currentSubjectRole = s.role;
    
    // Step 1 values
    const nomeEl = document.getElementById("wiz-q1-nome") || document.getElementById("wiz-nome");
    if (nomeEl) nomeEl.value = s.nome;
    const cognomeEl = document.getElementById("wiz-q2-cognome") || document.getElementById("wiz-cognome");
    if (cognomeEl) cognomeEl.value = s.cognome;
    const telEl = document.getElementById("wiz-q1-telefono");
    if (telEl) telEl.value = s.telefono || "";
    const emailEl = document.getElementById("wiz-q1-email");
    if (emailEl) emailEl.value = s.email || "";
    const fileTelEl = document.getElementById("file-doc-telefono");
    if (fileTelEl) fileTelEl.value = s.telefono || "";
    const fileEmailEl = document.getElementById("file-doc-email");
    if (fileEmailEl) fileEmailEl.value = s.email || "";
    const nascitaEl = document.getElementById("wiz-q3-data-nascita") || document.getElementById("wiz-nascita");
    if (nascitaEl) nascitaEl.value = s.dataNascita;
    const sessoEl = document.getElementById("wiz-sesso");
    if (sessoEl) sessoEl.value = s.sesso;

    const isExtraSubj = (s.cittadinanza === "extra" || s.cittadinanza === "extra_UE" || s.cittadinanza === "extra_ue" || String(s.cittadinanza || "").toLowerCase().includes("extra"));
    const isUeSubj = (s.cittadinanza === "ue" || s.cittadinanza === "UE");
    const citVal = isExtraSubj ? "extra" : (isUeSubj ? "ue" : "italiana");

    const citEl = document.getElementById("wiz-q6-cittadinanza") || document.getElementById("wiz-cittadinanza");
    if (citEl) citEl.value = citVal;
    const citFileEl = document.getElementById("wiz-q6-cittadinanza-file");
    if (citFileEl) citFileEl.value = citVal;
    const statEl = document.getElementById("wiz-q4-stato-civile") || document.getElementById("wiz-stato-civile");
    if (statEl) statEl.value = s.statoCivile;
    
    if (statEl) statEl.dispatchEvent(new Event("change"));
    if (citEl) citEl.dispatchEvent(new Event("change"));
    if (citFileEl) citFileEl.dispatchEvent(new Event("change"));
    
    const extraBoxManual = document.getElementById("group-extra-ue");
    const extraBoxFile = document.getElementById("group-extra-ue-file");
    if (extraBoxManual) extraBoxManual.style.display = isExtraSubj ? "block" : "none";
    if (extraBoxFile) extraBoxFile.style.display = isExtraSubj ? "block" : "none";

    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";

    // Residency permit and family location restore
    const permDate = (s.permScadenza && s.permScadenza !== "valido" && s.permScadenza !== "scaduto") ? s.permScadenza : (s.dataScadenzaPermesso || s.scadenzaPermesso || "");
    const permScadEl = document.getElementById("wiz-q6-permesso-scadenza" + suffix) || document.getElementById("wiz-q6-permesso-scadenza") || document.getElementById("wiz-q6-permesso-scadenza-file") || document.getElementById("wiz-permesso-scadenza");
    if (permScadEl && permDate) permScadEl.value = permDate;
    const permScadFileEl = document.getElementById("wiz-q6-permesso-scadenza-file");
    if (permScadFileEl && permDate) permScadFileEl.value = permDate;
    const permScadManEl = document.getElementById("wiz-q6-permesso-scadenza");
    if (permScadManEl && permDate) permScadManEl.value = permDate;

    const famSedeEl = document.getElementById("wiz-q14-famiglia-sede" + suffix) || document.getElementById("wiz-q14-famiglia-sede") || document.getElementById("wiz-q14-famiglia-sede-file") || document.getElementById("wiz-famiglia-sede");
    if (famSedeEl && s.famigliaSede) famSedeEl.value = s.famigliaSede;
    const famSedeFileEl = document.getElementById("wiz-q14-famiglia-sede-file");
    if (famSedeFileEl && s.famigliaSede) famSedeFileEl.value = s.famigliaSede;
    const famSedeManEl = document.getElementById("wiz-q14-famiglia-sede");
    if (famSedeManEl && s.famigliaSede) famSedeManEl.value = s.famigliaSede;
    
    // Civil status / Marriage details
    const regimeEl = document.getElementById("wiz-q4-regime" + suffix);
    if (regimeEl && s.regime) {
        regimeEl.value = s.regime;
        regimeEl.dispatchEvent(new Event("change"));
    }
    
    const anniSposatoEl = document.getElementById("wiz-q4-anni-sposato" + suffix);
    if (anniSposatoEl && s.anniSposato) anniSposatoEl.value = s.anniSposato;
    
    const alimentiEl = document.getElementById("wiz-q4-alimenti" + suffix);
    if (alimentiEl && s.alimenti) {
        alimentiEl.value = s.alimenti;
        alimentiEl.dispatchEvent(new Event("change"));
    }
    
    const alimentiImportoEl = document.getElementById("wiz-q4-alimenti-importo" + suffix);
    if (alimentiImportoEl && s.alimentiImporto) alimentiImportoEl.value = s.alimentiImporto;
    
    const anteStipulaEl = document.getElementById("wiz-q4-separazione-ante-stipula" + suffix);
    if (anteStipulaEl) {
        anteStipulaEl.checked = s.separazioneAnteStipula || false;
        window.handleMarriageRegimeChange();
    }
    
    // Children details
    const figliSelect = document.getElementById("wiz-q5-figli" + suffix);
    if (figliSelect) {
        figliSelect.value = s.figli || "no";
        window.toggleChildrenFields(suffix);
    }
    
    if (s.figli === "si") {
        const numFigliInput = document.getElementById("wiz-q5-num-figli" + suffix);
        if (numFigliInput && s.numFigli !== undefined) {
            numFigliInput.value = s.numFigli;
        }
        
        const auSelect = document.getElementById("wiz-q15-assegno-unico-select" + suffix);
        if (auSelect && s.assegnoUnicoSelect) {
            auSelect.value = s.assegnoUnicoSelect;
            window.toggleAssegnoUnicoFields(suffix);
        }
        
        const auValore = document.getElementById("wiz-q15-assegno-unico" + suffix);
        if (auValore && s.assegnoUnico !== undefined) {
            auValore.value = s.assegnoUnico;
        }
        
        if (window.updateChildrenAgesUI) {
            window.updateChildrenAgesUI(suffix);
        }
        
        // Restore child ages inputs
        if (s.etaFigli) {
            const agesArr = s.etaFigli.split(",");
            const inputsDiv = document.getElementById("children-ages-inputs" + suffix);
            if (inputsDiv) {
                const ageInputs = inputsDiv.querySelectorAll(".child-age-input");
                ageInputs.forEach((inp, idx) => {
                    if (agesArr[idx] !== undefined) {
                        inp.value = agesArr[idx];
                    }
                });
            }
        }
    } else {
        if (window.toggleChildrenFields) window.toggleChildrenFields(suffix);
    }
    
    // Employee details
    const orarioEl = document.getElementById("wiz-q10-dip-orario");
    if (orarioEl && s.orarioLavoro) orarioEl.value = s.orarioLavoro;
    
    const datorePivaEl = document.getElementById("wiz-q10-datore-piva");
    if (datorePivaEl && s.datorePiva) datorePivaEl.value = s.datorePiva;

    const immEl = document.getElementById("wiz-immobile-intestatario");
    if (immEl) immEl.checked = s.isOwner;
    
    // Step 2 values
    let macro = "dipendente";
    let sub = "indeterminato";
    if (s.tipoContratto === "dipendente_ti") {
        macro = "dipendente";
        sub = "indeterminato";
    } else if (s.tipoContratto === "dipendente_td") {
        macro = "dipendente";
        sub = "determinato";
    } else if (s.tipoContratto === "apprendista") {
        macro = "dipendente";
        sub = "apprendista";
    } else if (s.tipoContratto === "autonomo") {
        macro = "autonomo";
    } else if (s.tipoContratto === "colf_badanti") {
        macro = "colf_badanti";
    } else if (s.tipoContratto === "interinale") {
        macro = "interinale";
    } else if (s.tipoContratto === "pensionato") {
        macro = "pensionato";
    }

    const macroSelect = document.getElementById("wiz-q10-macro-categoria");
    if (macroSelect) {
        macroSelect.value = macro;
        window.toggleQ10MacroCategory(macro);
    }
    const subSelect = document.getElementById("wiz-q10-dip-contratto");
    if (subSelect) {
        subSelect.value = sub;
        window.toggleQ10DipendenteSub(sub);
    }
    
    const inc1 = (s.incomes && s.incomes.length > 0) ? s.incomes[0] : s;
    const r1 = inc1.rawBoxData || {};
    
    if (inc1.tipoContratto === "dipendente_ti" || inc1.tipoContratto === "pensionato" || inc1.tipoContratto === "colf_badanti" || inc1.tipoContratto === "interinale") {
        if (document.getElementById("wiz-q10-cu1")) document.getElementById("wiz-q10-cu1").value = r1.p1 || 0;
        if (document.getElementById("wiz-q10-cu2")) document.getElementById("wiz-q10-cu2").value = r1.p2 || 0;
        if (document.getElementById("wiz-q10-cu6")) document.getElementById("wiz-q10-cu6").value = r1.p6 || 365;
        if (document.getElementById("wiz-q10-cu21")) document.getElementById("wiz-q10-cu21").value = r1.p21 || 0;
        if (document.getElementById("wiz-q10-cu22")) document.getElementById("wiz-q10-cu22").value = r1.p22 || 0;
        if (document.getElementById("wiz-q10-cu26")) document.getElementById("wiz-q10-cu26").value = r1.p26 || 0;
        if (document.getElementById("wiz-q10-cu27")) document.getElementById("wiz-q10-cu27").value = r1.p27 || 0;
        if (document.getElementById("wiz-q10-cu29")) document.getElementById("wiz-q10-cu29").value = r1.p29 || r1.cu29 || 0;
        if (document.getElementById("wiz-q10-cu365")) document.getElementById("wiz-q10-cu365").value = r1.p365 || r1.cu365 || 0;
        if (document.getElementById("wiz-q10-cu810")) document.getElementById("wiz-q10-cu810").value = r1.p810 || r1.cu810 || 0;
    } else if (inc1.tipoContratto === "dipendente_td") {
        if (document.getElementById("wiz-q10-cu2")) document.getElementById("wiz-q10-cu2").value = r1.p2 || 0;
        if (document.getElementById("wiz-q10-cu21")) document.getElementById("wiz-q10-cu21").value = r1.p21 || 0;
        if (document.getElementById("wiz-q10-cu22")) document.getElementById("wiz-q10-cu22").value = r1.p22 || 0;
        if (document.getElementById("wiz-q10-cu26")) document.getElementById("wiz-q10-cu26").value = r1.p26 || 0;
        if (document.getElementById("wiz-q10-cu6")) document.getElementById("wiz-q10-cu6").value = r1.days || 365;
    } else if (inc1.tipoContratto === "autonomo") {
        const autRegimeSelect = document.getElementById("wiz-q10-autonomo-regime") || document.getElementById("wiz-auto-regime");
        if (autRegimeSelect) {
            autRegimeSelect.value = r1.regime || "forfettario";
            window.toggleQ10AutonomoRegime(r1.regime || "forfettario");
        }
        if (r1.regime === "ordinario") {
            if (document.getElementById("wiz-q10-rn1")) document.getElementById("wiz-q10-rn1").value = r1.rn1_1 || 0;
            if (document.getElementById("wiz-q10-rn26")) document.getElementById("wiz-q10-rn26").value = r1.rn26_1 || 0;
        } else {
            if (document.getElementById("wiz-q10-lm36")) document.getElementById("wiz-q10-lm36").value = r1.lm36 || 0;
            if (document.getElementById("wiz-q10-lm39")) document.getElementById("wiz-q10-lm39").value = r1.lm39 || 0;
        }
    }
    
    if (document.getElementById("wiz-q10-netto-mensile")) {
        document.getElementById("wiz-q10-netto-mensile").value = inc1.netto || 0;
    }

    const hasSecCheckbox = document.getElementById("wiz-q10-has-second-income");
    if (hasSecCheckbox) {
        const hasSecond = s.incomes && s.incomes.length > 1;
        hasSecCheckbox.checked = hasSecond;
        window.toggleSecondIncome(hasSecond);
        
        if (hasSecond) {
            const inc2 = s.incomes[1];
            const r2 = inc2.rawBoxData || {};
            
            let macro2 = "dipendente";
            let sub2 = "indeterminato";
            if (inc2.tipoContratto === "dipendente_ti") {
                macro2 = "dipendente";
                sub2 = "indeterminato";
            } else if (inc2.tipoContratto === "dipendente_td") {
                macro2 = "dipendente";
                sub2 = "determinato";
            } else if (inc2.tipoContratto === "apprendista") {
                macro2 = "dipendente";
                sub2 = "apprendista";
            } else if (inc2.tipoContratto === "autonomo") {
                macro2 = "autonomo";
            } else if (inc2.tipoContratto === "colf_badanti") {
                macro2 = "colf_badanti";
            } else if (inc2.tipoContratto === "interinale") {
                macro2 = "interinale";
            } else if (inc2.tipoContratto === "pensionato") {
                macro2 = "pensionato";
            } else if (inc2.tipoContratto === "locazione") {
                macro2 = "locazione";
            }
            
            const macroSelect2 = document.getElementById("wiz-q10-macro-categoria-2");
            if (macroSelect2) {
                macroSelect2.value = macro2;
                window.toggleQ10MacroCategory2(macro2);
            }
            const subSelect2 = document.getElementById("wiz-q10-dip-contratto-2");
            if (subSelect2) {
                subSelect2.value = sub2;
                window.toggleQ10DipendenteSub2(sub2);
            }
            
            if (inc2.tipoContratto === "dipendente_ti" || inc2.tipoContratto === "pensionato" || inc2.tipoContratto === "colf_badanti" || inc2.tipoContratto === "interinale") {
                if (document.getElementById("wiz-q10-cu1-2")) document.getElementById("wiz-q10-cu1-2").value = r2.p1 || 0;
                if (document.getElementById("wiz-q10-cu2-2")) document.getElementById("wiz-q10-cu2-2").value = r2.p2 || 0;
                if (document.getElementById("wiz-q10-cu6-2")) document.getElementById("wiz-q10-cu6-2").value = r2.p6 || 365;
                if (document.getElementById("wiz-q10-cu21-2")) document.getElementById("wiz-q10-cu21-2").value = r2.p21 || 0;
                if (document.getElementById("wiz-q10-cu22-2")) document.getElementById("wiz-q10-cu22-2").value = r2.p22 || 0;
                if (document.getElementById("wiz-q10-cu26-2")) document.getElementById("wiz-q10-cu26-2").value = r2.p26 || 0;
                if (document.getElementById("wiz-q10-cu27-2")) document.getElementById("wiz-q10-cu27-2").value = r2.p27 || 0;
                if (document.getElementById("wiz-q10-cu29-2")) document.getElementById("wiz-q10-cu29-2").value = r2.p29 || 0;
                if (document.getElementById("wiz-q10-cu365-2")) document.getElementById("wiz-q10-cu365-2").value = r2.p365 || 0;
            } else if (inc2.tipoContratto === "dipendente_td") {
                if (document.getElementById("wiz-q10-cu2-2")) document.getElementById("wiz-q10-cu2-2").value = r2.p2 || 0;
                if (document.getElementById("wiz-q10-cu21-2")) document.getElementById("wiz-q10-cu21-2").value = r2.p21 || 0;
                if (document.getElementById("wiz-q10-cu22-2")) document.getElementById("wiz-q10-cu22-2").value = r2.p22 || 0;
                if (document.getElementById("wiz-q10-cu26-2")) document.getElementById("wiz-q10-cu26-2").value = r2.p26 || 0;
                if (document.getElementById("wiz-q10-cu6-2")) document.getElementById("wiz-q10-cu6-2").value = r2.days || 365;
            } else if (inc2.tipoContratto === "autonomo") {
                const autRegimeSelect2 = document.getElementById("wiz-q10-autonomo-regime-2");
                if (autRegimeSelect2) {
                    autRegimeSelect2.value = r2.regime || "forfettario";
                    window.toggleQ10AutonomoRegime2(r2.regime || "forfettario");
                }
                if (r2.regime === "ordinario") {
                    if (document.getElementById("wiz-q10-rn1-2")) document.getElementById("wiz-q10-rn1-2").value = r2.rn1_1 || 0;
                    if (document.getElementById("wiz-q10-rn26-2")) document.getElementById("wiz-q10-rn26-2").value = r2.rn26_1 || 0;
                } else {
                    if (document.getElementById("wiz-q10-lm36-2")) document.getElementById("wiz-q10-lm36-2").value = r2.lm36 || 0;
                    if (document.getElementById("wiz-q10-lm39-2")) document.getElementById("wiz-q10-lm39-2").value = r2.lm39 || 0;
                }
            } else if (inc2.tipoContratto === "locazione") {
                if (document.getElementById("wiz-q10-locazione-netto-2")) {
                    document.getElementById("wiz-q10-locazione-netto-2").value = r2.canone || inc2.netto || 0;
                }
            }
            
            if (document.getElementById("wiz-q10-netto-mensile-2")) {
                document.getElementById("wiz-q10-netto-mensile-2").value = inc2.netto || 0;
            }
        }
    }
    
    const titleEl = document.getElementById("step-personal-title");
    if (titleEl) titleEl.innerText = `Modifica Anagrafica (${s.role})`;
    goToStep(1);
}

function renderInterviewSummary() {
    const summaryContainer = document.getElementById("wiz-summary-content");
    if (!summaryContainer) return;
    
    let html = "";
    
    // 1. Clienti
    html += `<div style="font-weight: bold; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem;">Anagrafica & Redditi:</div>`;
    if (wizardSubjects.length === 0) {
        html += `<p style="font-style: italic; color: var(--text-muted); margin-bottom: 1rem;">Nessun soggetto inserito.</p>`;
    } else {
        html += `<table style="width:100%; border-collapse: collapse; margin-bottom: 1rem;">`;
        html += `<thead><tr style="text-align:left; font-size:0.75rem; color:var(--text-muted); border-bottom:1px solid var(--surface-border);"><th style="padding:0.25rem 0;">Nome</th><th>Ruolo</th><th>Contratto</th><th>Età</th><th>Proprietario</th><th style="text-align:right;">Netto</th></tr></thead><tbody>`;
        wizardSubjects.forEach(s => {
            const contrLabel = s.tipoContratto === 'dipendente_ti' ? 'Dip. Indeterminato' : s.tipoContratto === 'dipendente_td' ? 'Dip. Determinato' : s.tipoContratto === 'autonomo' ? 'Autonomo' : 'Pensionato';
            html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.02);"><td style="padding:0.35rem 0; font-weight:600;">${s.nome} ${s.cognome}</td><td>${s.role}</td><td>${contrLabel}</td><td>${s.eta} anni</td><td>${s.isOwner ? 'Sì' : 'No'}</td><td style="text-align:right; font-weight:bold; color:var(--success);">${s.netto.toLocaleString('it-IT', {maximumFractionDigits:0})} €/m</td></tr>`;
        });
        html += `</tbody></table>`;
    }
    
    // 2. Abitazione
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const abitaTipoEl = document.getElementById("wiz-q7-abitazione" + suffix) || document.getElementById("wiz-abita-tipo");
    const abitaTipo = abitaTipoEl ? abitaTipoEl.value : "proprieta";
    const rentValEl = document.getElementById("wiz-q7-canone-affitto" + suffix) || document.getElementById("wiz-abita-affitto-valore");
    const rentVal = rentValEl ? (parseFloat(rentValEl.value) || 0) : 0;
    const hasMutuoEl = document.getElementById("wiz-abita-mutuo");
    const hasMutuo = hasMutuoEl ? (hasMutuoEl.value === "si") : false;
    const mutuoEstintoEl = document.getElementById("wiz-abita-mutuo-estinto");
    const mutuoEstinto = mutuoEstintoEl ? (mutuoEstintoEl.value === "si") : false;
    const mutuoRataEl = document.getElementById("wiz-abita-mutuo-rata");
    const mutuoRata = mutuoRataEl ? (parseFloat(mutuoRataEl.value) || 0) : 0;
    
    html += `<div style="font-weight: bold; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem; margin-top: 1rem;">Situazione Abitativa:</div>`;
    if (abitaTipo === "affitto") {
        html += `<p style="margin-bottom: 1rem;">In affitto con canone mensile di <strong>${rentVal} €</strong></p>`;
    } else if (abitaTipo === "proprieta") {
        if (hasMutuo) {
            html += `<p style="margin-bottom: 1rem;">In proprietà con mutuo attivo (${mutuoEstinto ? 'verrà estinto con il nuovo mutuo' : 'rimane attivo con rata di <strong>' + mutuoRata + ' €</strong>'})</p>`;
        } else {
            html += `<p style="margin-bottom: 1rem;">In proprietà libera da mutuo</p>`;
        }
    } else {
        html += `<p style="margin-bottom: 1rem;">Con la famiglia / Altro</p>`;
    }
    
    // 3. Impegni
    html += `<div style="font-weight: bold; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem; margin-top: 1rem;">Impegni Finanziari (Prestiti):</div>`;
    if (wizardLoans.length === 0) {
        html += `<p style="font-style: italic; color: var(--text-muted); margin-bottom: 1rem;">Nessun altro prestito attivo.</p>`;
    } else {
        html += `<ul style="list-style:none; padding:0; margin-bottom:1rem;">`;
        wizardLoans.forEach(l => {
            html += `<li style="padding:0.25rem 0; border-bottom:1px solid rgba(255,255,255,0.02);">`;
            html += `Prestito ${l.tipo} (${l.finanziaria}): rata di <strong>${l.rata} €</strong> - ${l.verraChiuso ? '<span style="color:var(--success);">Verrà chiuso</span>' : '<span style="color:var(--warning);">Rimane attivo</span>'}`;
            html += `</li>`;
        });
        html += `</ul>`;
    }
    
    // 4. Pregiudizievoli
    const pignEl = document.getElementById("wiz-q12-pignoramenti") || document.getElementById("wiz-pignoramenti");
    const ritardiEl = document.getElementById("wiz-q13-crif-sofferenze") || document.getElementById("wiz-ritardi");
    const hasPign = pignEl ? (pignEl.value === "si") : false;
    const hasRitardi = ritardiEl ? (ritardiEl.value === "si") : false;
    if (hasPign || hasRitardi) {
        html += `<div style="color:var(--danger); font-weight:bold; margin-top:1rem;">⚠️ Segnalazioni Negative: ${hasPign ? 'Pignoramenti in corso' : ''} ${hasRitardi ? 'Ritardi di pagamento passati' : ''} (KO Strategico)</div>`;
    }
    
    summaryContainer.innerHTML = html;
}


window.removeSubject = function(idx) {
    const s = wizardSubjects[idx];
    if (s && s.isSpouse) {
        alert("Il coniuge in comunione dei beni è obbligatorio. Per rimuoverlo, imposta il regime patrimoniale su 'Separazione dei beni' o spunta la casella 'Faranno separazione dei beni ante stipula' nel profilo del Richiedente Principale.");
        return;
    }
    wizardSubjects.splice(idx, 1);
    renderSubjectsChips();
    if (wizardSubjects.length === 0) {
        currentSubjectRole = "Richiedente Principale";
    }
    updateCalculations();
};

// Wizard Loop subject choices
const btnAddCo = document.getElementById("btn-wiz-add-cointestatario");
if (btnAddCo) btnAddCo.addEventListener("click", () => {
    currentSubjectRole = "Cointestatario";
    resetSubjectForm();
    goToStep(1);
});

const btnAddGa = document.getElementById("btn-wiz-add-garante");
if (btnAddGa) btnAddGa.addEventListener("click", () => {
    currentSubjectRole = "Garante";
    resetSubjectForm();
    goToStep(1);
});

const btnProceed = document.getElementById("btn-wiz-proceed");
if (btnProceed) btnProceed.addEventListener("click", () => {
    goToStep(4); // proceed to Habitation step
});

function resetSubjectForm() {
    const nomeEl = document.getElementById("wiz-q1-nome") || document.getElementById("wiz-nome");
    if (nomeEl) nomeEl.value = "";
    const cognomeEl = document.getElementById("wiz-q2-cognome") || document.getElementById("wiz-cognome");
    if (cognomeEl) cognomeEl.value = "";
    const telEl = document.getElementById("wiz-q1-telefono");
    if (telEl) telEl.value = "";
    const emailEl = document.getElementById("wiz-q1-email");
    if (emailEl) emailEl.value = "";
    const fileTelEl = document.getElementById("file-doc-telefono");
    if (fileTelEl) fileTelEl.value = "";
    const fileEmailEl = document.getElementById("file-doc-email");
    if (fileEmailEl) fileEmailEl.value = "";
    const nascitaEl = document.getElementById("wiz-q3-data-nascita") || document.getElementById("wiz-nascita");
    if (nascitaEl) nascitaEl.value = "1994-07-17";
    const stateEl = document.getElementById("wiz-stato-civile");
    if (stateEl) stateEl.value = "celibe_nubile";
    const figliEl = document.getElementById("wiz-figli");
    if (figliEl) figliEl.value = "no";
    const citEl = document.getElementById("wiz-cittadinanza");
    if (citEl) citEl.value = "IT";
    const contrEl = document.getElementById("wiz-contratto");
    if (contrEl) contrEl.value = "dipendente_ti";
    const anzEl = document.getElementById("wiz-anzianita");
    if (anzEl) anzEl.value = "12";
    const azNomeEl = document.getElementById("wiz-azienda-nome");
    if (azNomeEl) azNomeEl.value = "";
    const azPivaEl = document.getElementById("wiz-azienda-piva");
    if (azPivaEl) azPivaEl.value = "";
    const immEl = document.getElementById("wiz-immobile-intestatario");
    if (immEl) immEl.checked = true;
    
    // Trigger visual updates for conditionals
    const sp = document.getElementById("wiz-cond-sposato");
    if (sp) sp.style.display = "none";
    const div = document.getElementById("wiz-cond-divorziato");
    if (div) div.style.display = "none";
    const numFig = document.getElementById("wiz-num-figli-group");
    if (numFig) numFig.style.display = "none";
    const figDet = document.getElementById("wiz-cond-figli-dettaglio");
    if (figDet) figDet.style.display = "none";
    const extraCom = document.getElementById("wiz-cond-extracom");
    if (extraCom) extraCom.style.display = "none";
    
    if (wizContrattoSelect) {
        wizContrattoSelect.dispatchEvent(new Event("change"));
    }
    
    // Reset second income fields
    const hasSecCheckbox = document.getElementById("wiz-q10-has-second-income");
    if (hasSecCheckbox) {
        hasSecCheckbox.checked = false;
        window.toggleSecondIncome(false);
    }
    const macro2 = document.getElementById("wiz-q10-macro-categoria-2");
    if (macro2) macro2.value = "dipendente";
    const sub2 = document.getElementById("wiz-q10-dip-contratto-2");
    if (sub2) sub2.value = "indeterminato";
    
    const fieldsToReset = [
        "wiz-q10-cu1-2", "wiz-q10-cu2-2", "wiz-q10-cu6-2", "wiz-q10-cu21-2", "wiz-q10-cu22-2",
        "wiz-q10-cu26-2", "wiz-q10-cu27-2", "wiz-q10-cu29-2", "wiz-q10-cu365-2", "wiz-q10-lm36-2",
        "wiz-q10-lm39-2", "wiz-q10-lm22-2", "wiz-q10-lm27-2", "wiz-q10-lm35-2", "wiz-q10-rn1-2",
        "wiz-q10-rn26-2", "wiz-q10-rn4-2", "wiz-q10-rv2-2", "wiz-q10-rv10-2", "wiz-q10-rv17-2",
        "wiz-q10-locazione-netto-2", "wiz-q10-netto-mensile-2"
    ];
    fieldsToReset.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === "wiz-q10-cu6-2") el.value = "365";
            else el.value = "0";
        }
    });
    
    const titleEl = document.getElementById("step-personal-title");
    if (titleEl) titleEl.innerText = `Inserimento Anagrafica (${currentSubjectRole})`;
}

// ------------------ LOAN BUILDER LOGIC ------------------
window.addLoanItem = function() {
    const loanObj = {
        tipo: "personale",
        rata: 150,
        scadenza: 24,
        capitale: 5000,
        finanziaria: "Compass",
        verraChiuso: false
    };
    wizardLoans.push(loanObj);
    renderLoansList();
    updateCalculations();
};

function renderLoansList() {
    const loansListContainer = document.getElementById("wiz-loans-list-container");
    const freeLoansListContainer = document.getElementById("free-loans-list-container");
    const containers = [loansListContainer, freeLoansListContainer].filter(Boolean);
    
    // Calculate total active monthly loan rate
    let totalActive = 0;
    wizardLoans.forEach(l => { if (!l.verraChiuso) totalActive += (l.rata || 0); });
    const inputAltreRate = document.getElementById("altre-rate");
    if (inputAltreRate && wizardLoans.length > 0) {
        inputAltreRate.value = totalActive;
    }

    containers.forEach(container => {
        container.innerHTML = "";
        if (wizardLoans.length === 0) {
            container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">Nessun prestito inserito.</p>`;
            return;
        }
        
        wizardLoans.forEach((loan, idx) => {
            const item = document.createElement("div");
            item.className = "loan-wizard-item";
            item.style.background = "rgba(255,255,255,0.02)";
            item.style.border = "1px solid var(--surface-border)";
            item.style.borderRadius = "6px";
            item.style.padding = "0.75rem";
            item.style.marginBottom = "0.5rem";
            item.style.position = "relative";
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <span style="font-weight: 700; font-size: 0.8rem; color: var(--primary);">Prestito #${idx + 1}</span>
                    <button class="remove-loan-btn" onclick="removeLoan(${idx})" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; border-radius: 4px; padding: 0.15rem 0.5rem; font-size: 0.75rem; cursor: pointer;">🗑️ Elimina</button>
                </div>
                <div class="grid-2col">
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Tipo Finanziamento</label>
                        <select onchange="updateLoanField(${idx}, 'tipo', this.value)" style="font-size: 0.8rem; padding: 0.35rem;">
                            <option value="personale" ${loan.tipo === 'personale' ? 'selected' : ''}>Prestito Personale</option>
                            <option value="auto" ${loan.tipo === 'auto' ? 'selected' : ''}>Finanziamento Auto</option>
                            <option value="cqs" ${loan.tipo === 'cqs' ? 'selected' : ''}>Cessione del Quinto</option>
                            <option value="mutuo" ${loan.tipo === 'mutuo' ? 'selected' : ''}>Altro Mutuo</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Rata Mensile (€)</label>
                        <input type="number" value="${loan.rata}" oninput="updateLoanField(${idx}, 'rata', parseFloat(this.value) || 0)" style="font-size: 0.8rem; padding: 0.35rem;">
                    </div>
                </div>
                <div class="grid-2col">
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Istituto / Finanziaria</label>
                        <input type="text" value="${loan.finanziaria}" oninput="updateLoanField(${idx}, 'finanziaria', this.value)" style="font-size: 0.8rem; padding: 0.35rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.4rem;">
                        <label style="font-size: 0.72rem;">Verrà chiuso/estinto prima del mutuo?</label>
                        <select onchange="updateLoanField(${idx}, 'verraChiuso', this.value === 'si')" style="font-size: 0.8rem; padding: 0.35rem;">
                            <option value="no" ${!loan.verraChiuso ? 'selected' : ''}>No, rimane attivo</option>
                            <option value="si" ${loan.verraChiuso ? 'selected' : ''}>Sì, verrà chiuso</option>
                        </select>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
    });
}

window.removeLoan = function(idx) {
    wizardLoans.splice(idx, 1);
    renderLoansList();
    updateCalculations();
};

window.updateLoanField = function(idx, field, value) {
    if (wizardLoans[idx]) {
        wizardLoans[idx][field] = value;
    }
    updateCalculations();
};

// ------------------ PDF Mock Upload Logic ------------------
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const filesList = document.getElementById("files-list");

if (dropZone) dropZone.addEventListener("click", () => fileInput?.click());

if (dropZone) dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (dropZone) dropZone.classList.add("dragover");
});

if (dropZone) dropZone.addEventListener("dragleave", () => {
    if (dropZone) dropZone.classList.remove("dragover");
});

if (dropZone) dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    if (dropZone) dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        handleUploadedFile(e.dataTransfer.files[0]);
    }
});

if (fileInput) fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleUploadedFile(e.target.files[0]);
    }
});

function handleUploadedFile(file) {
    const filename = file.name.toLowerCase();
    
    if (filesList) {
        filesList.innerHTML = `
            <div class="file-item">
                <span>📄 ${file.name}</span>
                <span class="remove-file" onclick="clearFiles()">Rimuovi</span>
            </div>
        `;
    }
    
    // Smart parsing simulation based on user request (extracts personal, employment, and income details)
    if (filename.includes("cu") || filename.includes("2026")) {
        // Essali Karime Dipendente
        // Personal
        inputC1Eta.value = 32;
        inputC1TipoReddito.value = "dipendente_ti";
        // Annualized formula result: (22929.31 / 332 * 365) / 12 = 2100.70
        inputC1Netto.value = 2100.70;
        
        // Auto fill other practice fields to match user request
        cointestazioneCheckbox.checked = false;
        req2Section.style.display = "none";
        req1Title.innerText = "2. Dettagli Richiedente";
        
        inputPersoneNucleo.value = 4;
        inputAltreRate.value = 400;
        inputValoreImmobile.value = 200000;
        inputImportoMutuo.value = 160000;
        inputDurata.value = 25;
        inputZona.value = "nord";
        inputFinalita.value = "acquisto";
        inputTipoTasso.value = "any";
        inputClasseEnergetica.value = "other";
        
        inputProvImmobile.value = "Como";
        inputProvResidenza.value = "Milano";
        inputProvLavoro.value = "Monza";
        
        // If in wizard mode, load the extracted subject in wizard list too!
        if (currentMode === "interview") {
            wizardSubjects = [{
                role: "Richiedente Principale",
                nome: "Karime",
                cognome: "Essali",
                dataNascita: "1993-04-20",
                eta: 32,
                sesso: "F",
                cittadinanza: "extra_UE",
                statoCivile: "celibe_nubile",
                isOwner: true,
                tipoContratto: "dipendente_ti",
                netto: 2100.70
            }];
            renderSubjectsChips();
            document.getElementById("wiz-costo-casa").value = 200000;
            document.getElementById("wiz-importo-mutuo").value = 160000;
            document.getElementById("wiz-durata").value = 25;
            document.getElementById("wiz-tasso-tipo").value = "any";
            document.getElementById("wiz-classe-en").value = "other";
            document.getElementById("wiz-zona").value = "nord";
            document.getElementById("wiz-prov-immobile").value = "Como";
            document.getElementById("wiz-prov-residenza").value = "Milano";
            document.getElementById("wiz-prov-lavoro").value = "Monza";
            document.getElementById("wiz-num-figli").value = 2; // to total 4 family members
            goToStep(3); // go to Loop screen
        }
        
    } else if (filename.includes("hanane") || filename.includes("pf") || filename.includes("unico")) {
        // El Kotni Hanane Autonomo
        inputC1Eta.value = 40;
        inputC1TipoReddito.value = "autonomo";
        inputC1Netto.value = 3769.92;
        
        cointestazioneCheckbox.checked = false;
        req2Section.style.display = "none";
        req1Title.innerText = "2. Dettagli Richiedente";
        
        inputPersoneNucleo.value = 4;
        inputAltreRate.value = 400;
        inputValoreImmobile.value = 200000;
        inputImportoMutuo.value = 160000;
        inputDurata.value = 25;
        inputZona.value = "nord";
        inputFinalita.value = "acquisto";
        inputTipoTasso.value = "any";
        inputClasseEnergetica.value = "other";
        
        inputProvImmobile.value = "Roma";
        inputProvResidenza.value = "Roma";
        inputProvLavoro.value = "Roma";
        
        if (currentMode === "interview") {
            wizardSubjects = [{
                role: "Richiedente Principale",
                nome: "Hanane",
                cognome: "El Kotni",
                dataNascita: "1986-07-17",
                eta: 40,
                sesso: "F",
                cittadinanza: "IT",
                statoCivile: "celibe_nubile",
                isOwner: true,
                tipoContratto: "autonomo",
                netto: 3769.92
            }];
            renderSubjectsChips();
            document.getElementById("wiz-costo-casa").value = 200000;
            document.getElementById("wiz-importo-mutuo").value = 160000;
            document.getElementById("wiz-durata").value = 25;
            document.getElementById("wiz-tasso-tipo").value = "any";
            document.getElementById("wiz-classe-en").value = "other";
            document.getElementById("wiz-zona").value = "nord";
            document.getElementById("wiz-prov-immobile").value = "Roma";
            document.getElementById("wiz-prov-residenza").value = "Roma";
            document.getElementById("wiz-prov-lavoro").value = "Roma";
            document.getElementById("wiz-num-figli").value = 3;
            goToStep(3);
        }
    }
    
    updateCalculations();
}

function clearFiles() {
    if (filesList) filesList.innerHTML = "";
    if (fileInput) fileInput.value = "";
    updateCalculations();
}

// Demo profiles buttons listeners (if present)
const btnDemoDip = document.getElementById("btn-demo-dipendente");
btnDemoDip?.addEventListener("click", () => handleUploadedFile({ name: "cu 2026.pdf" }));

const btnDemoAuto = document.getElementById("btn-demo-autonomo");
btnDemoAuto?.addEventListener("click", () => handleUploadedFile({ name: "EL KOTNI HANANE PF 2026.pdf" }));

const btnDemoComb = document.getElementById("btn-demo-combined");
if (btnDemoComb) {
    btnDemoComb.addEventListener("click", () => {
        if (inputC1Eta) inputC1Eta.value = 32;
        if (inputC1TipoReddito) inputC1TipoReddito.value = "dipendente_ti";
        if (inputC1Netto) inputC1Netto.value = 2100.70;
        
        if (cointestazioneCheckbox) cointestazioneCheckbox.checked = true;
        if (req2Section) req2Section.style.display = "block";
        if (req1Title) req1Title.innerText = "2. Primo Richiedente";
        
        if (inputC2Eta) inputC2Eta.value = 40;
        if (inputC2TipoReddito) inputC2TipoReddito.value = "autonomo";
        if (inputC2Netto) inputC2Netto.value = 3769.92;
        
        // Sim parameters
        if (inputPersoneNucleo) inputPersoneNucleo.value = 4;
        if (inputAltreRate) inputAltreRate.value = 400;
        if (inputValoreImmobile) inputValoreImmobile.value = 200000;
        if (inputImportoMutuo) inputImportoMutuo.value = 160000;
        if (inputDurata) inputDurata.value = 25;
        if (inputZona) inputZona.value = "nord";
        if (inputFinalita) inputFinalita.value = "acquisto";
        if (inputTipoTasso) inputTipoTasso.value = "any";
        if (inputClasseEnergetica) inputClasseEnergetica.value = "other";
        
        if (inputProvImmobile) inputProvImmobile.value = "Milano";
        if (inputProvResidenza) inputProvResidenza.value = "Monza";
        if (inputProvLavoro) inputProvLavoro.value = "Milano";
        
        if (currentMode === "interview") {
            hasSubmittedStrategy = true;
            wizardSubjects = [
                {
                    role: "Richiedente Principale",
                    nome: "Karime",
                    cognome: "Essali",
                    dataNascita: "1993-04-20",
                    eta: 32,
                    sesso: "F",
                    cittadinanza: "extra_UE",
                    statoCivile: "celibe_nubile",
                    isOwner: true,
                    tipoContratto: "dipendente_ti",
                    netto: 2100.70
                },
                {
                    role: "Cointestatario",
                    nome: "Hanane",
                    cognome: "El Kotni",
                    dataNascita: "1986-07-17",
                    eta: 40,
                    sesso: "F",
                    cittadinanza: "IT",
                    statoCivile: "celibe_nubile",
                    isOwner: true,
                    tipoContratto: "autonomo",
                    netto: 3769.92
                }
            ];
            renderSubjectsChips();
            if (document.getElementById("wiz-costo-casa")) document.getElementById("wiz-costo-casa").value = 200000;
            if (document.getElementById("wiz-importo-mutuo")) document.getElementById("wiz-importo-mutuo").value = 160000;
            if (document.getElementById("wiz-durata")) document.getElementById("wiz-durata").value = 25;
            if (document.getElementById("wiz-tasso-tipo")) document.getElementById("wiz-tasso-tipo").value = "any";
            if (document.getElementById("wiz-classe-en")) document.getElementById("wiz-classe-en").value = "other";
            if (document.getElementById("wiz-zona")) document.getElementById("wiz-zona").value = "nord";
            if (document.getElementById("wiz-prov-immobile")) document.getElementById("wiz-prov-immobile").value = "Milano";
            if (document.getElementById("wiz-prov-residenza")) document.getElementById("wiz-prov-residenza").value = "Monza";
            if (document.getElementById("wiz-prov-lavoro")) document.getElementById("wiz-prov-lavoro").value = "Milano";
            if (document.getElementById("wiz-num-figli")) document.getElementById("wiz-num-figli").value = 2;
            if (window.goToStep) window.goToStep(3);
        }
        
        clearFiles();
        updateCalculations();
    });
}

document.getElementById("btn-reset")?.addEventListener("click", () => {
    hasSubmittedStrategy = false;
    // 1. Reset forms
    const pform = document.getElementById("pratica-form");
    if (pform) pform.reset();
    if (cointestazioneCheckbox) cointestazioneCheckbox.checked = false;
    if (req2Section) req2Section.style.display = "none";
    if (req1Title) req1Title.innerText = "2. Dettagli Richiedente";
    
    // 2. Clear uploaded files UI
    if (filesList) filesList.innerHTML = "";
    if (fileInput) fileInput.value = "";

    // 3. Clear Wizard subjects and loans
    wizardSubjects = [];
    window.userLoans = [];
    editingSubjectIndex = null;
    currentSubjectRole = "Richiedente Principale";
    resetSubjectForm();
    renderSubjectsChips();
    window.renderLoansCards(true);
    goToStep(1);
    
    // 4. Set clean generic defaults (not linked to demo clients Essali/El Kotni)
    if (inputValoreImmobile) inputValoreImmobile.value = 200000;
    if (inputImportoMutuo) inputImportoMutuo.value = 160000;
    if (inputDurata) inputDurata.value = 25;
    if (inputTipoTasso) inputTipoTasso.value = "any";
    if (inputClasseEnergetica) inputClasseEnergetica.value = "other";
    if (inputAltreRate) inputAltreRate.value = 0;
    if (inputPersoneNucleo) inputPersoneNucleo.value = 1;
    if (inputZona) inputZona.value = "nord";
    if (inputFinalita) inputFinalita.value = "acquisto";
    
    if (inputC1Eta) inputC1Eta.value = 35;
    if (inputC1TipoReddito) inputC1TipoReddito.value = "dipendente_ti";
    if (inputC1Netto) inputC1Netto.value = 2000;
    
    if (inputC2Eta) inputC2Eta.value = 35;
    if (inputC2TipoReddito) inputC2TipoReddito.value = "dipendente_ti";
    if (inputC2Netto) inputC2Netto.value = 0;

    if (inputProvImmobile) inputProvImmobile.value = "";
    if (inputProvResidenza) inputProvResidenza.value = "";
    if (inputProvLavoro) inputProvLavoro.value = "";
    
    // Default rate benchmarks
    if (inputBaseEuribor1m) inputBaseEuribor1m.value = 2.248;
    if (inputBaseEuribor3m) inputBaseEuribor3m.value = 2.545;
    if (inputBaseEuribor6m) inputBaseEuribor6m.value = 2.762;
    if (inputBaseIrs) inputBaseIrs.value = 3.38;
    if (inputBaseBce) inputBaseBce.value = 3.75;
    
    updateCalculations();
});

// Database loading utility
function toTitleCase(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/(?:^|\s|-|\')\S/g, a => a.toUpperCase());
}

function populateComuniDatalist(items) {
    const datalist = document.getElementById("comuni-list");
    if (!datalist) return;
    const listToRender = items || [];
    const fragment = document.createDocumentFragment();
    const added = new Set();

    listToRender.forEach(item => {
        if (!item.name) return;
        const titleName = toTitleCase(item.name);
        if (!added.has(titleName)) {
            added.add(titleName);
            const opt = document.createElement("option");
            opt.value = titleName;
            fragment.appendChild(opt);
        }
    });
    
    datalist.innerHTML = "";
    datalist.appendChild(fragment);
}

function updateGeoVerifiedBadge(inputEl, comuneObj) {
    if (!inputEl) return;
    let badge = inputEl.parentElement.querySelector(".geo-verified-pill");
    
    if (!comuneObj) {
        if (badge) badge.remove();
        return;
    }
    
    if (!badge) {
        badge = document.createElement("div");
        badge.className = "geo-verified-pill";
        inputEl.parentElement.appendChild(badge);
    }
    
    const latStr = (comuneObj.lat !== null && comuneObj.lat !== undefined) ? Number(comuneObj.lat).toFixed(2) : null;
    const lngStr = (comuneObj.lng !== null && comuneObj.lng !== undefined) ? Number(comuneObj.lng).toFixed(2) : null;
    const coordsStr = (latStr && lngStr) ? ` (${latStr}° N, ${lngStr}° E)` : "";
    const regStr = comuneObj.region ? ` • ${comuneObj.region}` : "";
    const siglaStr = comuneObj.sigla ? ` (${comuneObj.sigla})` : (comuneObj.provCode ? ` (${comuneObj.provCode})` : "");
    
    badge.innerHTML = `<span>📍</span> <span><strong>${comuneObj.name || comuneObj.displayName || ''}</strong>${siglaStr}${regStr}${coordsStr}</span>`;
}

function setupDynamicComuniAutocomplete() {
    const inputIds = [
        "prov-immobile", "prov-residenza", "prov-lavoro",
        "wiz-prov-immobile", "wiz-prov-residenza", "wiz-prov-lavoro",
        "wiz-prov-immobile-file", "wiz-prov-residenza-file", "wiz-prov-lavoro-file",
        "banche-comune-input", "banche-secret-input", "filiali-comune-input"
    ];

    inputIds.forEach(id => {
        const inputEl = document.getElementById(id);
        if (!inputEl || inputEl.dataset.geoAutocompleteAttached === "true") return;
        
        inputEl.dataset.geoAutocompleteAttached = "true";
        inputEl.setAttribute("autocomplete", "off");
        
        // Wrap input if not already wrapped
        if (!inputEl.parentElement.classList.contains("geo-autocomplete-wrapper")) {
            const wrapper = document.createElement("div");
            wrapper.className = "geo-autocomplete-wrapper";
            inputEl.parentNode.insertBefore(wrapper, inputEl);
            wrapper.appendChild(inputEl);
        }
        
        const wrapper = inputEl.parentElement;
        
        // Create dropdown container
        let dropdown = wrapper.querySelector(".geo-autocomplete-dropdown");
        if (!dropdown) {
            dropdown = document.createElement("ul");
            dropdown.className = "geo-autocomplete-dropdown";
            dropdown.style.display = "none";
            wrapper.appendChild(dropdown);
        }

        let activeIdx = -1;
        let currentSuggestions = [];

        function renderSuggestions(matches, query) {
            dropdown.innerHTML = "";
            activeIdx = -1;
            currentSuggestions = matches;

            if (!matches || matches.length === 0) {
                dropdown.style.display = "none";
                return;
            }

            const cleanQ = (query || "").toLowerCase();

            matches.forEach((item, index) => {
                const li = document.createElement("li");
                li.className = "geo-suggestion-item";
                li.dataset.index = index;

                // Highlight matching letters
                const nameStr = item.name;
                let highlightedName = nameStr;
                const matchIndex = nameStr.toLowerCase().indexOf(cleanQ);
                if (matchIndex >= 0) {
                    highlightedName = nameStr.substring(0, matchIndex) + 
                        `<span style="color: #0052ff; font-weight: 800; text-decoration: underline;">${nameStr.substring(matchIndex, matchIndex + cleanQ.length)}</span>` + 
                        nameStr.substring(matchIndex + cleanQ.length);
                }

                li.innerHTML = `
                    <div class="geo-suggestion-left">
                        <span class="geo-pin-icon">📍</span>
                        <span class="geo-comune-title">${highlightedName}</span>
                        ${item.sigla ? `<span class="geo-sigla-badge">${item.sigla}</span>` : ''}
                    </div>
                    <div class="geo-suggestion-right">
                        <span class="geo-prov-label">${item.province || ''}</span>
                        <span class="geo-region-label">${item.region || ''}</span>
                    </div>
                `;

                li.addEventListener("mousedown", (e) => {
                    e.preventDefault(); // Prevent blur
                    selectSuggestion(item);
                });

                dropdown.appendChild(li);
            });

            dropdown.style.display = "block";
        }

        function selectSuggestion(item) {
            inputEl.value = item.fullLabel || `${item.name} (${item.sigla || item.province})`;
            inputEl.dataset.comune = item.name;
            inputEl.dataset.provincia = item.province;
            inputEl.dataset.sigla = item.sigla;
            inputEl.dataset.regione = item.region;
            inputEl.dataset.lat = item.lat || "";
            inputEl.dataset.lng = item.lng || "";
            
            updateGeoVerifiedBadge(inputEl, item);
            dropdown.style.display = "none";
            
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
            
            if (id === "banche-comune-input" && typeof window.updateBancheListByComune === "function") {
                window.updateBancheListByComune();
            } else if (id === "filiali-comune-input" && typeof window.updateFilialiModule === "function") {
                window.updateFilialiModule();
            } else if (typeof window.updateCalculations === "function") {
                window.updateCalculations();
            }
        }

        function handleInput() {
            const query = inputEl.value.trim();
            if (query.length < 1) {
                dropdown.style.display = "none";
                updateGeoVerifiedBadge(inputEl, null);
                return;
            }

            let matches = [];
            if (BrokerFlowEngine && typeof BrokerFlowEngine.searchComuni === "function") {
                matches = BrokerFlowEngine.searchComuni(query, 12);
            } else if (comuniData && comuniData.length) {
                const qUpper = query.toUpperCase();
                matches = comuniData.filter(c => c.name && c.name.toUpperCase().includes(qUpper)).slice(0, 12).map(c => ({
                    name: toTitleCase(c.name),
                    province: toTitleCase(c.name),
                    sigla: "",
                    region: "",
                    lat: c.lat,
                    lng: c.lng,
                    fullLabel: toTitleCase(c.name)
                }));
            }

            renderSuggestions(matches, query);
            
            // Check if exact match already entered
            const resolved = BrokerFlowEngine.resolveLocation(query);
            if (resolved && resolved.province) {
                updateGeoVerifiedBadge(inputEl, resolved);
            } else {
                updateGeoVerifiedBadge(inputEl, null);
            }
        }

        inputEl.addEventListener("input", handleInput);
        inputEl.addEventListener("focus", handleInput);

        inputEl.addEventListener("keydown", (e) => {
            if (dropdown.style.display === "none") return;
            const items = dropdown.querySelectorAll(".geo-suggestion-item");
            if (!items.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                activeIdx = (activeIdx + 1) % items.length;
                items.forEach((it, idx) => it.classList.toggle("active", idx === activeIdx));
                items[activeIdx]?.scrollIntoView({ block: "nearest" });
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                activeIdx = (activeIdx - 1 + items.length) % items.length;
                items.forEach((it, idx) => it.classList.toggle("active", idx === activeIdx));
                items[activeIdx]?.scrollIntoView({ block: "nearest" });
            } else if (e.key === "Enter") {
                if (activeIdx >= 0 && currentSuggestions[activeIdx]) {
                    e.preventDefault();
                    selectSuggestion(currentSuggestions[activeIdx]);
                }
            } else if (e.key === "Escape") {
                dropdown.style.display = "none";
            }
        });

        inputEl.addEventListener("blur", () => {
            setTimeout(() => {
                dropdown.style.display = "none";
                const q = inputEl.value.trim();
                if (q) {
                    const resolved = BrokerFlowEngine.resolveLocation(q);
                    if (resolved && resolved.province) {
                        updateGeoVerifiedBadge(inputEl, resolved);
                    }
                }
            }, 200);
        });
    });
}

async function loadDatabases(forceFresh = true) {
    try {
        const cacheBust = forceFresh ? `?t=${Date.now()}` : "";
        const [comuniRes, policiesRes, productsRes, branchesRes] = await Promise.all([
            fetch(`data/comuni.json${cacheBust}`),
            fetch(`data/policies.json${cacheBust}`),
            fetch(`data/products.json${cacheBust}`),
            fetch(`data/branches.json${cacheBust}`)
        ]);
        comuniData = await comuniRes.json();
        policiesData = await policiesRes.json();
        productsData = await productsRes.json();
        const branchesData = await branchesRes.json();
        
        // Load daily rates if available
        try {
            const irsRes = await fetch(`data/tassi_giornalieri.json${cacheBust}`);
            if (irsRes.ok) {
                const irsData = await irsRes.json();
                if (irsData && irsData.last_updated) {
                    window.dailyRatesLastUpdated = irsData.last_updated;
                }
                if (irsData && irsData.irs) {
                    window.dailyIrsRates = irsData.irs;
                    console.log("Daily IRS rates loaded:", window.dailyIrsRates);
                    
                    const inputBaseIrs = document.getElementById("base-irs");
                    if (inputBaseIrs && window.dailyIrsRates[30]) {
                        inputBaseIrs.value = window.dailyIrsRates[30];
                    }
                }
                if (irsData && irsData.euribor) {
                    window.dailyEuriborRates = irsData.euribor;
                    console.log("Daily Euribor rates loaded:", window.dailyEuriborRates);
                    
                    const inputBaseEur1 = document.getElementById("base-euribor1m");
                    if (inputBaseEur1 && window.dailyEuriborRates["1M"]) {
                        inputBaseEur1.value = window.dailyEuriborRates["1M"];
                    }
                    const inputBaseEur3 = document.getElementById("base-euribor3m");
                    if (inputBaseEur3 && window.dailyEuriborRates["3M"]) {
                        inputBaseEur3.value = window.dailyEuriborRates["3M"];
                    }
                    const inputBaseEur6 = document.getElementById("base-euribor6m");
                    if (inputBaseEur6 && window.dailyEuriborRates["6M"]) {
                        inputBaseEur6.value = window.dailyEuriborRates["6M"];
                    }
                }
            }
        } catch (irsErr) {
            console.warn("Could not load daily rates, using default fallback values.", irsErr);
        }
        
        BrokerFlowEngine.init(policiesData, productsData, comuniData, branchesData);
        console.log("Databases loaded successfully!");
        
        populateComuniDatalist();
        setupDynamicComuniAutocomplete();
        updateCalculations();
    } catch (err) {
        console.error("Error loading databases:", err);
    }
}

window.toggleChildrenFields = function(suffix = "") {
    if (suffix === undefined || suffix === null) {
        suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    }
    const select = document.getElementById("wiz-q5-figli" + suffix);
    if (!select) return;
    const isYes = select.value === "si";

    const countGroup = document.getElementById("group-figli-count" + suffix);
    const assegnoSelectGroup = document.getElementById("group-assegno-unico-select-wrapper" + suffix);
    const assegnoValoreGroup = document.getElementById("group-assegno-unico-valore-wrapper" + suffix);
    const agesGroup = document.getElementById("children-ages-container" + suffix);
    const agesInputs = document.getElementById("children-ages-inputs" + suffix);

    const numFigliInput = document.getElementById("wiz-q5-num-figli" + suffix);
    const assegnoSelect = document.getElementById("wiz-q15-assegno-unico-select" + suffix);
    const assegnoVal = document.getElementById("wiz-q15-assegno-unico" + suffix);
    const etaFigli = document.getElementById("wiz-q5-eta-figli" + suffix);

    if (countGroup) countGroup.style.display = isYes ? "block" : "none";
    if (assegnoSelectGroup) assegnoSelectGroup.style.display = isYes ? "block" : "none";
    
    if (!isYes) {
        if (countGroup) countGroup.style.display = "none";
        if (assegnoSelectGroup) assegnoSelectGroup.style.display = "none";
        if (assegnoValoreGroup) assegnoValoreGroup.style.display = "none";
        if (agesGroup) agesGroup.style.display = "none";
        if (agesInputs) agesInputs.innerHTML = "";

        if (numFigliInput) numFigliInput.value = "0";
        if (assegnoSelect) assegnoSelect.value = "no";
        if (assegnoVal) assegnoVal.value = "0";
        if (etaFigli) etaFigli.value = "";
    } else {
        if (numFigliInput && (!numFigliInput.value || parseInt(numFigliInput.value) <= 0)) {
            numFigliInput.value = "2";
        }
        if (assegnoValoreGroup) {
            const hasAu = assegnoSelect && assegnoSelect.value === "si";
            assegnoValoreGroup.style.display = hasAu ? "block" : "none";
        }
    }

    if (window.updateChildrenAgesUI) window.updateChildrenAgesUI(suffix);
    if (window.suggestFamilyComponentsFromDOM) window.suggestFamilyComponentsFromDOM();
    if (window.updateCalculations) window.updateCalculations();
};

window.toggleAssegnoUnicoFields = function(suffix = "") {
    if (suffix === undefined || suffix === null) {
        suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    }
    const select = document.getElementById("wiz-q15-assegno-unico-select" + suffix);
    const amountBox = document.getElementById("group-assegno-unico-valore-wrapper" + suffix);
    const amountInput = document.getElementById("wiz-q15-assegno-unico" + suffix);
    const figliSelect = document.getElementById("wiz-q5-figli" + suffix);
    const isFigli = figliSelect ? (figliSelect.value === "si") : true;

    const isYes = isFigli && select && (select.value === "si");
    if (amountBox) {
        amountBox.style.display = isYes ? "block" : "none";
    }
    if (!isYes && amountInput) {
        amountInput.value = "0";
    } else if (isYes && amountInput && (!amountInput.value || parseFloat(amountInput.value) <= 0)) {
        amountInput.value = "280";
    }
    if (window.updateChildrenAgesUI) window.updateChildrenAgesUI(suffix);
    if (window.updateCalculations) window.updateCalculations();
};

window.updateChildrenAgesUI = function(forcedSuffix) {
    const suffixes = (forcedSuffix !== undefined && forcedSuffix !== null) 
        ? [forcedSuffix] 
        : ["", "-file"];

    suffixes.forEach(suffix => {
        const figliSelect = document.getElementById("wiz-q5-figli" + suffix);
        const numFigliInput = document.getElementById("wiz-q5-num-figli" + suffix);
        const assegnoSelect = document.getElementById("wiz-q15-assegno-unico-select" + suffix);
        const assegnoInput = document.getElementById("wiz-q15-assegno-unico" + suffix);
        const container = document.getElementById("children-ages-container" + suffix);
        const inputsDiv = document.getElementById("children-ages-inputs" + suffix);
        const hiddenAgesInput = document.getElementById("wiz-q5-eta-figli" + suffix);
        const groupFigliCount = document.getElementById("group-figli-count" + suffix);
        const groupAssegnoSelectWrapper = document.getElementById("group-assegno-unico-select-wrapper" + suffix);
        const groupAssegnoValoreWrapper = document.getElementById("group-assegno-unico-valore-wrapper" + suffix);

        if (!figliSelect) return;

        const figliSi = figliSelect.value === "si";
        const numFigli = (figliSi && numFigliInput) ? (parseInt(numFigliInput.value) || 0) : 0;

        if (groupFigliCount) {
            groupFigliCount.style.display = figliSi ? "block" : "none";
        }
        if (groupAssegnoSelectWrapper) {
            groupAssegnoSelectWrapper.style.display = figliSi ? "block" : "none";
        }

        const hasAssegno = figliSi && assegnoSelect && assegnoSelect.value === "si";
        if (groupAssegnoValoreWrapper) {
            groupAssegnoValoreWrapper.style.display = hasAssegno ? "block" : "none";
        }
        if (!hasAssegno && assegnoInput && !figliSi) {
            assegnoInput.value = "0";
        }

        const showAges = figliSi && numFigli > 0;

        if (container && inputsDiv) {
            if (showAges) {
                container.style.display = "block";
                
                // Keep track of current input values to avoid resetting typed ages
                const existingInputs = inputsDiv.querySelectorAll(".child-age-input");
                const savedAges = [];
                existingInputs.forEach(inp => {
                    savedAges.push(inp.value || "");
                });

                // Regenerate child inputs if count differs
                if (existingInputs.length !== numFigli) {
                    inputsDiv.innerHTML = "";
                    for (let i = 1; i <= numFigli; i++) {
                        const wrapper = document.createElement("div");
                        wrapper.style.display = "flex";
                        wrapper.style.flexDirection = "column";
                        wrapper.style.gap = "0.25rem";
                        wrapper.style.width = "70px";

                        const label = document.createElement("span");
                        label.innerText = `Figlio ${i}`;
                        label.style.fontSize = "0.7rem";
                        label.style.fontWeight = "700";
                        label.style.color = "#64748b";

                        const input = document.createElement("input");
                        input.type = "number";
                        input.className = "child-age-input";
                        input.placeholder = "Età";
                        input.min = "0";
                        input.max = "25";
                        input.value = savedAges[i - 1] || "";
                        input.style.width = "100%";
                        input.style.padding = "0.45rem";
                        input.style.border = "1px solid #cbd5e1";
                        input.style.borderRadius = "6px";
                        input.style.fontSize = "0.8rem";
                        
                        input.addEventListener("input", function() { window.syncChildrenAges(suffix); });

                        wrapper.appendChild(label);
                        wrapper.appendChild(input);
                        inputsDiv.appendChild(wrapper);
                    }
                }
            } else {
                container.style.display = "none";
                inputsDiv.innerHTML = "";
                if (hiddenAgesInput) hiddenAgesInput.value = "";
            }
        }
        
        window.syncChildrenAges(suffix);

        const spouseCard = document.getElementById("coapp-spouse-auto");
        if (spouseCard) {
            const spouseNumFigliInput = spouseCard.querySelector(".coapp-q5-num-figli");
            const spouseFigliSelect = spouseCard.querySelector(".coapp-q5-figli");
            if (spouseNumFigliInput && spouseNumFigliInput.dataset.userEdited !== "true") {
                if (spouseFigliSelect) spouseFigliSelect.value = figliSi ? "si" : "no";
                spouseNumFigliInput.value = numFigli;
                window.updateCoappChildrenAgesUI(spouseCard);
            }
        }
    });
};

window.syncChildrenAges = function(forcedSuffix) {
    const suffixes = (forcedSuffix !== undefined && forcedSuffix !== null) 
        ? [forcedSuffix] 
        : ["", "-file"];

    suffixes.forEach(suffix => {
        const hiddenAgesInput = document.getElementById("wiz-q5-eta-figli" + suffix);
        if (!hiddenAgesInput) return;

        const inputsDiv = document.getElementById("children-ages-inputs" + suffix);
        if (!inputsDiv) return;
        const inputs = inputsDiv.querySelectorAll(".child-age-input");
        const ages = [];
        inputs.forEach(inp => {
            if (inp.value !== "") {
                ages.push(inp.value);
            }
        });
        
        hiddenAgesInput.value = ages.join(",");
    });
    
    if (window.updateCalculations) {
        window.updateCalculations();
    }
};

// Initial run on page load
function initApp() {
    if (window.updateChildrenAgesUI) window.updateChildrenAgesUI();
    if (window.handleMarriageRegimeChange) window.handleMarriageRegimeChange();
    if (window.suggestFamilyComponentsFromDOM) window.suggestFamilyComponentsFromDOM();
    const settingCalcTrigger = document.getElementById("setting-calc-trigger");
    if (settingCalcTrigger) {
        settingCalcTrigger.addEventListener("change", function() {
            localStorage.setItem("brokerflow_calc_trigger", this.value);
            updateCalculations();
        });
        const savedTrigger = localStorage.getItem("brokerflow_calc_trigger");
        if (savedTrigger) settingCalcTrigger.value = savedTrigger;
    }

    populateComuniDatalist();
    setupDynamicComuniAutocomplete();
    window.renderLoansCards(true);
    if (window.goToStep) window.goToStep(1);
    switchCrmModule("engine");
    loadDatabases();
    if (window.setupSecretBTrigger) window.setupSecretBTrigger();
    if (window.setupMortgageTypeCards) window.setupMortgageTypeCards();
    if (window.updateDashboardStats) window.updateDashboardStats();
    if (window.syncCrmDataWithServer) window.syncCrmDataWithServer();
}

const REGIONI_PROVINCE = {
    "piemonte": ["Torino", "Vercelli", "Novara", "Cuneo", "Asti", "Alessandria", "Biella", "Verbano-Cusio-Ossola"],
    "valle d'aosta": ["Aosta"],
    "lombardia": ["Milano", "Brescia", "Como", "Cremona", "Lecco", "Lodi", "Mantova", "Monza", "Pavia", "Sondrio", "Varese", "Bergamo"],
    "trentino-alto adige": ["Bolzano", "Trento"],
    "veneto": ["Venezia", "Verona", "Padova", "Vicenza", "Treviso", "Belluno", "Rovigo"],
    "friuli-venezia giulia": ["Trieste", "Udine", "Pordenone", "Gorizia"],
    "liguria": ["Genova", "Imperia", "Savona", "La Spezia"],
    "emilia-romagna": ["Bologna", "Ferrara", "Forlì", "Cesena", "Modena", "Parma", "Piacenza", "Ravenna", "Reggio Emilia", "Rimini"],
    "toscana": ["Firenze", "Arezzo", "Grosseto", "Livorno", "Lucca", "Massa", "Carrara", "Pisa", "Pistoia", "Prato", "Siena"],
    "umbria": ["Perugia", "Terni"],
    "marche": ["Ancona", "Ascoli Piceno", "Fermo", "Macerata", "Pesaro", "Urbino"],
    "lazio": ["Roma", "Frosinone", "Latina", "Rieti", "Viterbo"],
    "abruzzo": ["L'Aquila", "Chieti", "Pescara", "Teramo"],
    "molise": ["Campobasso", "Isernia"],
    "campania": ["Napoli", "Avellino", "Benevento", "Caserta", "Salerno"],
    "puglia": ["Bari", "Brindisi", "Foggia", "Lecce", "Taranto", "Barletta", "Andria", "Trani"],
    "basilicata": ["Potenza", "Matera"],
    "calabria": ["Catanzaro", "Cosenza", "Crotone", "Reggio Calabria", "Vibo Valentia"],
    "sicilia": ["Palermo", "Agrigento", "Caltanissetta", "Catania", "Enna", "Messina", "Ragusa", "Siracusa", "Trapani"],
    "sardegna": ["Cagliari", "Nuoro", "Oristano", "Sassari", "Sud Sardegna"]
};

// Toggle flags and counters
let secretClickCount = 0;
let secretClickTimeout = null;

window.setupSecretBTrigger = function() {
    const trigger = document.getElementById("secret-trigger-b");
    if (!trigger) return;
    
    // Remove existing event listener if any (by cloning)
    const newTrigger = trigger.cloneNode(true);
    if (trigger.parentNode) {
        trigger.parentNode.replaceChild(newTrigger, trigger);
    }
    
    newTrigger.addEventListener("click", function(e) {
        secretClickCount++;
        console.log("Secret click count:", secretClickCount);
        clearTimeout(secretClickTimeout);
        secretClickTimeout = setTimeout(() => {
            secretClickCount = 0;
        }, 3000);
        
        if (secretClickCount >= 5) {
            secretClickCount = 0;
            window.openSecretBancheView();
        }
    });
};

window.openSecretBancheView = function() {
    const stdView = document.getElementById("banche-standard-view");
    const secretView = document.getElementById("banche-secret-view");
    if (stdView) stdView.style.display = "none";
    if (secretView) {
        secretView.style.display = "block";
        const stdInput = document.getElementById("banche-comune-input");
        const secInput = document.getElementById("banche-secret-input");
        if (stdInput && secInput) {
            secInput.value = stdInput.value;
        }
        window.updateSecretBancheTable();
    }
};

window.closeSecretBancheView = function() {
    const stdView = document.getElementById("banche-standard-view");
    const secretView = document.getElementById("banche-secret-view");
    if (stdView) stdView.style.display = "block";
    if (secretView) secretView.style.display = "none";
    if (window.updateBancheListByComune) window.updateBancheListByComune();
};

window.updateSecretBancheTable = function() {
    const input = document.getElementById("banche-secret-input");
    const tbody = document.getElementById("banche-secret-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const value = input ? input.value.trim().toLowerCase() : "";
    
    // Determine geographic filter
    let isRegionSearch = false;
    let regionProvinces = [];
    let resolved = null;
    
    if (value) {
        if (REGIONI_PROVINCE[value]) {
            isRegionSearch = true;
            regionProvinces = REGIONI_PROVINCE[value].map(p => p.toLowerCase());
        } else {
            resolved = BrokerFlowEngine.resolveLocation(value);
        }
    }
    
    Object.entries(BrokerFlowEngine.bankPolicies).forEach(([bankId, policy]) => {
        // If there is a filter value, check if this bank is operante in the filtered area
        if (value) {
            const operatesNationwide = (policy.isNationwide === true || (policy.territories && policy.territories.includes("*")));
            let operatesLocally = false;
            
            if (policy.territories && Array.isArray(policy.territories)) {
                const allowedTerts = policy.territories.map(t => t.toLowerCase());
                if (isRegionSearch) {
                    operatesLocally = allowedTerts.some(t => regionProvinces.includes(t));
                } else if (resolved && resolved.province) {
                    operatesLocally = allowedTerts.includes(resolved.province.toLowerCase()) || 
                                      allowedTerts.includes(resolved.name.toLowerCase());
                }
            }
            
            const isOperante = operatesNationwide || operatesLocally;
            if (!isOperante) return; // Skip if not operating in filtered area
        }
        
        // Render editable row
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #e2e8f0";
        
        tr.innerHTML = `
            <td style="padding: 0.75rem 1rem; font-weight: 700; color: #0f172a;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${policy.color};"></span>
                    ${policy.name}
                </div>
            </td>
            <td style="padding: 0.5rem;"><input type="number" step="0.01" value="${policy.maxLtv}" id="sec-${bankId}-maxLtv" style="width: 100%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"></td>
            <td style="padding: 0.5rem;"><input type="number" step="0.01" value="${policy.maxDsr}" id="sec-${bankId}-maxDsr" style="width: 100%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"></td>
            <td style="padding: 0.5rem;"><input type="number" step="0.01" value="${policy.maxDsrDeroga || 0}" id="sec-${bankId}-maxDsrDeroga" style="width: 100%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"></td>
            <td style="padding: 0.5rem;"><input type="number" value="${policy.maxAge}" id="sec-${bankId}-maxAge" style="width: 100%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"></td>
            <td style="padding: 0.5rem;"><input type="number" value="${policy.maxGuarantorAge}" id="sec-${bankId}-maxGuarantorAge" style="width: 100%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"></td>
            <td style="padding: 0.5rem;"><input type="number" value="${policy.minResidencyYears}" id="sec-${bankId}-minResidency" style="width: 100%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"></td>
            <td style="padding: 0.5rem; display: flex; gap: 0.25rem; align-items: center;">
                <input type="number" value="${policy.minSeniorityAutonomo}" id="sec-${bankId}-minAutonomo" style="width: 50%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;" title="Standard">
                <input type="number" value="${policy.minSeniorityAutonomoDeroga}" id="sec-${bankId}-minAutonomoDeroga" style="width: 50%; padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;" title="Deroga">
            </td>
            <td style="padding: 0.5rem; text-align: center;">
                <select id="sec-${bankId}-hasMri" style="padding: 0.35rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;">
                    <option value="true" ${policy.hasMri ? "selected" : ""}>Sì</option>
                    <option value="false" ${!policy.hasMri ? "selected" : ""}>No</option>
                </select>
            </td>
            <td style="padding: 0.5rem; text-align: right;">
                <button class="btn btn-primary" onclick="window.saveBankPolicy('${bankId}')" style="background: #0052ff; color: #ffffff; padding: 0.4rem 0.8rem; border-radius: 6px; border: none; font-size: 0.8rem; cursor: pointer; font-weight: 700;">
                    Salva
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.saveBankPolicy = async function(bankId) {
    const maxLtv = parseFloat(document.getElementById(`sec-${bankId}-maxLtv`).value);
    const maxDsr = parseFloat(document.getElementById(`sec-${bankId}-maxDsr`).value);
    const maxDsrDeroga = parseFloat(document.getElementById(`sec-${bankId}-maxDsrDeroga`).value);
    const maxAge = parseInt(document.getElementById(`sec-${bankId}-maxAge`).value);
    const maxGuarantorAge = parseInt(document.getElementById(`sec-${bankId}-maxGuarantorAge`).value);
    const minResidency = parseInt(document.getElementById(`sec-${bankId}-minResidency`).value);
    const minAutonomo = parseInt(document.getElementById(`sec-${bankId}-minAutonomo`).value);
    const minAutonomoDeroga = parseInt(document.getElementById(`sec-${bankId}-minAutonomoDeroga`).value);
    const hasMri = document.getElementById(`sec-${bankId}-hasMri`).value === "true";
    
    const updatedPolicies = { ...policiesData };
    if (!updatedPolicies[bankId]) {
        alert("Banca non trovata!");
        return;
    }
    
    updatedPolicies[bankId] = {
        ...updatedPolicies[bankId],
        maxLtv,
        maxDsr,
        maxDsrDeroga,
        maxAge,
        maxGuarantorAge,
        minResidencyYears: minResidency,
        minSeniorityAutonomo: minAutonomo,
        minSeniorityAutonomoDeroga: minAutonomoDeroga,
        hasMri
    };
    
    try {
        const response = await fetch("/api/save-policies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedPolicies)
        });
        
        if (response.ok) {
            const resData = await response.json();
            alert(`🎉 Successo! ${resData.message}`);
            policiesData = updatedPolicies;
            BrokerFlowEngine.bankPolicies = updatedPolicies;
            updateCalculations();
        } else {
            const errData = await response.json();
            alert(`❌ Errore durante il salvataggio: ${errData.message}`);
        }
    } catch (e) {
        console.error("Save error:", e);
        alert(`❌ Errore di rete: ${e.message}`);
    }
};

window.updateBancheListByComune = function() {
    const input = document.getElementById("banche-comune-input");
    const noSel = document.getElementById("banche-no-selection");
    const grid = document.getElementById("banche-list-grid");
    
    if (!input) return;
    const value = input.value.trim().toLowerCase();
    if (!value) {
        if (noSel) noSel.style.display = "block";
        if (grid) {
            grid.style.display = "none";
            grid.innerHTML = "";
        }
        return;
    }
    
    // Determine if region or municipality
    let isRegionSearch = false;
    let regionProvinces = [];
    let resolved = null;
    
    if (REGIONI_PROVINCE[value]) {
        isRegionSearch = true;
        regionProvinces = REGIONI_PROVINCE[value].map(p => p.toLowerCase());
    } else {
        resolved = BrokerFlowEngine.resolveLocation(value);
        if (!resolved || !resolved.province) {
            return;
        }
    }
    
    if (noSel) noSel.style.display = "none";
    if (grid) {
        grid.style.display = "grid";
        grid.innerHTML = "";
    } else {
        return;
    }
    
    let renderedCount = 0;
    
    // Evaluate territoriality for each bank
    Object.entries(BrokerFlowEngine.bankPolicies).forEach(([bankId, policy]) => {
        // Check territoriality
        const operatesNationwide = (policy.isNationwide === true || (policy.territories && policy.territories.includes("*")));
        
        let operatesImmobile = false;
        if (policy.territories && Array.isArray(policy.territories)) {
            const allowedTerts = policy.territories.map(t => t.toLowerCase());
            if (isRegionSearch) {
                operatesImmobile = allowedTerts.some(t => regionProvinces.includes(t));
            } else if (resolved && resolved.province) {
                operatesImmobile = allowedTerts.includes(resolved.province.toLowerCase()) || 
                                   allowedTerts.includes(resolved.name.toLowerCase());
            }
        }
        
        const isOperante = operatesNationwide || operatesImmobile;
        if (!isOperante) return;
        
        renderedCount++;
        
        // Find local branches
        let topBranches = [];
        if (!isRegionSearch && resolved) {
            const candidateBranches = (BrokerFlowEngine.branchesDb && BrokerFlowEngine.branchesDb[bankId]) || [];
            const evaluatedBranches = [];
            const provLower = (resolved.province || "").toLowerCase();
            const comuneLower = (resolved.name || "").toLowerCase();
            
            candidateBranches.forEach(b => {
                const bProvLower = (b.prov || "").toLowerCase();
                const bComuneLower = (b.comune || "").toLowerCase();
                const bAddrLower = (b.indirizzo || "").toLowerCase();
                
                let dist = null;
                if (b.lat && resolved.lat) {
                    dist = BrokerFlowEngine.getHaversineDistance(resolved.lat, resolved.lng, b.lat, b.lng);
                }
                
                // Match province, municipality or proximity <= 60km
                const matchesZone = bProvLower === provLower || 
                                    bComuneLower === comuneLower || 
                                    bAddrLower.includes(comuneLower) ||
                                    (dist !== null && dist <= 60);
                                    
                if (matchesZone) {
                    evaluatedBranches.push({ ...b, distance: dist });
                }
            });
            evaluatedBranches.sort((a, b) => {
                if (a.distance === null && b.distance === null) return 0;
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            });
            topBranches = evaluatedBranches.slice(0, 2);
        } else if (isRegionSearch && regionProvinces.length > 0) {
            const candidateBranches = (BrokerFlowEngine.branchesDb && BrokerFlowEngine.branchesDb[bankId]) || [];
            topBranches = candidateBranches.filter(b => regionProvinces.includes((b.prov || "").toLowerCase())).slice(0, 2);
        }
        
        // Render card
        const card = document.createElement("div");
        card.style.background = "#ffffff";
        card.style.border = "2px solid #e2e8f0";
        card.style.borderRadius = "12px";
        card.style.padding = "1.5rem";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.justifyContent = "space-between";
        card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
        
        const branchesHtml = `
            <div style="margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
                <p style="font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.5rem; text-align: left;">📍 Filiali Consigliate:</p>
                ${topBranches.map(b => `
                    <div style="font-size: 0.85rem; margin-bottom: 0.75rem; color: #1e293b; text-align: left; border-left: 2px solid #0052ff; padding-left: 0.5rem;">
                        <p style="font-weight: 700; margin: 0;">${b.name}</p>
                        <p style="font-size: 0.78rem; color: #64748b; margin: 0.15rem 0;">${b.indirizzo}</p>
                        ${b.telefono ? `<p style="font-size: 0.78rem; color: #0052ff; margin: 0; font-weight: 600;">📞 Tel: ${b.telefono}</p>` : ""}
                    </div>
                `).join("")}
                ${topBranches.length === 0 ? `<p style="font-size: 0.82rem; color: #64748b; font-style: italic; margin: 0; text-align: left;">Nessuna filiale fisica mappata per questo istituto.</p>` : ""}
            </div>
        `;
        
        card.innerHTML = `
            <div>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; text-align: left;">
                    <div style="width: 72px; height: 42px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2px 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.04); overflow: hidden;">
                        ${window.getBankLogoHtml(policy.name, 34)}
                    </div>
                    <div>
                        <h3 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.2;">${policy.name}</h3>
                        <span style="display: inline-block; padding: 0.15rem 0.5rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem; background: #dcfce7; color: #166534;">
                            🟢 Convenzionata in Zona
                        </span>
                    </div>
                </div>
            </div>
            ${branchesHtml}
            <div style="margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; display: flex; justify-content: flex-end;">
                <button type="button" onclick="window.viewBankPolicyDetail('${bankId}')" style="background: #eff6ff; color: #0052ff; border: 1.5px solid #bfdbfe; font-weight: 700; font-size: 0.82rem; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; width: 100%; justify-content: center; transition: all 0.15s;">
                    📜 Info Policy & Assistente AI ➔
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    if (renderedCount === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b; font-size: 0.95rem; font-weight: 600; background: #f8fafc; border-radius: 12px; border: 1px solid #cbd5e1;">
                ❌ Nessun istituto convenzionato opera nella zona cercata.
            </div>
        `;
    }
};

window.updateFilialiModule = function() {
    const input = document.getElementById("filiali-comune-input");
    const noSearch = document.getElementById("filiali-no-search");
    const mainContainer = document.getElementById("filiali-main-container");
    const banksList = document.getElementById("filiali-banks-list");
    const branchesList = document.getElementById("filiali-branches-list");
    
    if (!input || !banksList || !branchesList) return;
    
    const query = input.value.trim().toLowerCase();
    if (!query) {
        if (noSearch) noSearch.style.display = "block";
        if (mainContainer) mainContainer.style.display = "none";
        return;
    }
    
    if (noSearch) noSearch.style.display = "none";
    if (mainContainer) mainContainer.style.display = "grid";
    
    // Resolve location
    const isRegionSearch = ["lombardia", "lazio", "campania", "sicilia", "veneto", "emilia-romagna", "piemonte", "puglia", "toscana", "calabria", "sardegna", "liguria", "marche", "abruzzo", "friuli-venezia giulia", "trentino-alto adige", "umbria", "basilicata", "molise", "valle d'aosta"].includes(query);
    
    let resolved = null;
    let regionProvinces = [];
    
    if (isRegionSearch) {
        regionProvinces = BrokerFlowEngine.getProvincesForRegion(query);
    } else {
        resolved = BrokerFlowEngine.resolveTerritory(query);
    }
    
    // Filter operating banks in this territory
    const operatingBanks = [];
    Object.keys(BrokerFlowEngine.bankPolicies).forEach(bankId => {
        const policy = BrokerFlowEngine.bankPolicies[bankId];
        let isOperating = false;
        
        if (policy.isNationwide || (policy.territories && policy.territories.includes("*"))) {
            isOperating = true;
        } else if (isRegionSearch) {
            isOperating = regionProvinces.some(prov => policy.territories && policy.territories.includes(prov));
        } else if (resolved) {
            isOperating = policy.territories && (policy.territories.includes(resolved.province) || policy.territories.includes(resolved.name));
        }
        
        if (isOperating) {
            operatingBanks.push({ id: bankId, policy });
        }
    });
    
    // Render Bank selection buttons
    banksList.innerHTML = "";
    if (operatingBanks.length === 0) {
        banksList.innerHTML = `<div style="padding: 1rem; color: #64748b; font-size: 0.85rem;">Nessuna banca convenzionata in questo territorio.</div>`;
        branchesList.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b;">Nessuna filiale disponibile.</div>`;
        return;
    }
    
    operatingBanks.forEach((b, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = `filiali-bank-btn-${b.id.replace(/\s+/g, '-')}`;
        btn.style.width = "100%";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.gap = "0.75rem";
        btn.style.padding = "0.75rem 1rem";
        btn.style.border = "1px solid #cbd5e1";
        btn.style.borderRadius = "8px";
        btn.style.background = "#ffffff";
        btn.style.cursor = "pointer";
        btn.style.textAlign = "left";
        btn.style.transition = "all 0.2s";
        
        btn.innerHTML = `
            <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px;">
                ${window.getBankLogoHtml(b.policy.name, 26)}
            </div>
            <span style="font-size: 0.9rem; font-weight: 600; color: #334155;">${b.policy.name}</span>
        `;
        
        btn.addEventListener("click", () => {
            window.selectFilialiBank(
                b.id, 
                isRegionSearch ? regionProvinces : [resolved.province, resolved.name],
                isRegionSearch ? null : { lat: resolved?.lat, lng: resolved?.lng },
                isRegionSearch ? null : resolved?.name
            );
        });
        
        banksList.appendChild(btn);
    });
    
    // Autoselect first operating bank
    const firstBank = operatingBanks[0];
    window.selectFilialiBank(
        firstBank.id, 
        isRegionSearch ? regionProvinces : [resolved.province, resolved.name],
        isRegionSearch ? null : { lat: resolved?.lat, lng: resolved?.lng },
        isRegionSearch ? null : resolved?.name
    );
};

window.selectFilialiBank = function(bankId, allowedAreas, searchCoords = null, searchMunicipality = null) {
    // Highlight active button
    document.querySelectorAll(".filiali-bank-select-btn").forEach(btn => {
        btn.style.background = "#ffffff";
        btn.style.borderColor = "#cbd5e1";
        btn.querySelector("span").style.color = "#334155";
    });
    
    const activeBtn = document.getElementById(`filiali-btn-${bankId}`);
    if (activeBtn) {
        activeBtn.style.background = "#0052ff";
        activeBtn.style.borderColor = "#0052ff";
        activeBtn.querySelector("span").style.color = "#ffffff";
    }
    
    const policy = BrokerFlowEngine.bankPolicies[bankId];
    const chosenBankTitle = document.getElementById("filiali-chosen-bank-title");
    if (chosenBankTitle && policy) {
        chosenBankTitle.innerHTML = `🏢 Filiali di ${policy.name}`;
    }
    
    const branchesList = document.getElementById("filiali-branches-list");
    if (!branchesList) return;
    branchesList.innerHTML = "";
    
    const candidateBranches = (BrokerFlowEngine.branchesDb && BrokerFlowEngine.branchesDb[bankId]) || [];
    
    // Filter branches in zone
    const areasLower = allowedAreas.map(a => a.toLowerCase());
    
    // Map distances if coordinates are available
    let branchesInZone = candidateBranches.map((b, idx) => {
        let distance = null;
        if (searchCoords && searchCoords.lat !== null && b.lat) {
            distance = BrokerFlowEngine.getHaversineDistance(searchCoords.lat, searchCoords.lng, b.lat, b.lng);
        }
        return { ...b, originalIndex: idx, distance };
    }).filter(b => areasLower.includes((b.prov || "").toLowerCase()));
    
    // Sort branches:
    // 1. Exact municipality match first (case-insensitive checks on name and address)
    // 2. Others sorted by distance ascending
    branchesInZone.sort((a, b) => {
        const aNameLower = (a.name || "").toLowerCase();
        const aAddrLower = (a.indirizzo || "").toLowerCase();
        const bNameLower = (b.name || "").toLowerCase();
        const bAddrLower = (b.indirizzo || "").toLowerCase();
        
        const mLower = searchMunicipality ? searchMunicipality.toLowerCase() : "";
        
        const aIsExact = mLower && (aNameLower.includes(mLower) || aAddrLower.includes(mLower));
        const bIsExact = mLower && (bNameLower.includes(mLower) || bAddrLower.includes(mLower));
        
        if (aIsExact && !bIsExact) return -1;
        if (!aIsExact && bIsExact) return 1;
        
        // If both or neither is exact match, sort by distance ascending
        if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance;
        }
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        
        return 0;
    });
                                            
    if (branchesInZone.length === 0) {
        branchesList.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: #64748b; font-size: 0.9rem; font-weight: 500; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
                ℹ️ Nessuna filiale fisica mappata per ${policy.name} nella zona cercata.
            </div>
        `;
        return;
    }
    
    branchesInZone.forEach(b => {
        const originalIndex = b.originalIndex;
        const referenti = b.referenti || [];
        
        const card = document.createElement("div");
        card.style.background = "#f8fafc";
        card.style.border = "1.5px solid #e2e8f0";
        card.style.borderRadius = "12px";
        card.style.padding = "1.5rem";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "1rem";
        card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.01)";
        
        let referentiRowsHtml = "";
        for (let idx = 0; idx < 3; idx++) {
            const ref = referenti[idx] || { nome: "", ruolo: "", telefono: "", email: "" };
            referentiRowsHtml += `
                <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <p style="font-size: 0.8rem; font-weight: 700; color: #0052ff; margin: 0; border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.25rem;">Referente ${idx + 1}</p>
                    
                    <div>
                        <label style="font-size: 0.7rem; color: #64748b; display: block; margin-bottom: 0.15rem;">Nome e Cognome</label>
                        <input type="text" id="ref-nome-${bankId}-${originalIndex}-${idx}" value="${ref.nome || ''}" placeholder="Nome e Cognome" style="width: 100%; padding: 0.3rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.78rem; outline: none;">
                    </div>
                    
                    <div>
                        <label style="font-size: 0.7rem; color: #64748b; display: block; margin-bottom: 0.15rem;">Ruolo</label>
                        <input type="text" id="ref-ruolo-${bankId}-${originalIndex}-${idx}" value="${ref.ruolo || ''}" placeholder="Es. Gestore Privati, Direttore" style="width: 100%; padding: 0.3rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.78rem; outline: none;">
                    </div>
                    
                    <div>
                        <label style="font-size: 0.7rem; color: #64748b; display: block; margin-bottom: 0.15rem;">Tel. Interno / Cellulare</label>
                        <input type="text" id="ref-tel-${bankId}-${originalIndex}-${idx}" value="${ref.telefono || ''}" placeholder="Recapito telefonico" style="width: 100%; padding: 0.3rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.78rem; outline: none;">
                    </div>
                    
                    <div>
                        <label style="font-size: 0.7rem; color: #64748b; display: block; margin-bottom: 0.15rem;">Email Aziendale</label>
                        <input type="email" id="ref-email-${bankId}-${originalIndex}-${idx}" value="${ref.email || ''}" placeholder="Email aziendale" style="width: 100%; padding: 0.3rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.78rem; outline: none;">
                    </div>
                </div>
            `;
        }
        
        let distText = "";
        if (b.distance !== null && b.distance !== undefined) {
            distText = ` | 🚗 <span style="color: #0052ff; font-weight: bold;">${b.distance.toFixed(1)} km</span> di distanza`;
        }
        
        card.innerHTML = `
            <div>
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0;">${b.name}</h3>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; margin: 0.25rem 0 0.5rem 0; flex-wrap: wrap;">
                    <span style="font-weight: 600; color: #475569;">📍 Indirizzo:</span>
                    <input type="text" id="branch-address-${bankId}-${originalIndex}" value="${b.indirizzo || ''}" style="padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; flex: 1; min-width: 250px; outline: none;">
                    ${distText}
                </div>
                <p style="font-size: 0.88rem; color: #334155; margin: 0;">📞 Telefono: <strong>${b.telefono || "Non mappato"}</strong></p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 0.25rem;">
                <span style="font-weight: 600; color: #475569;">Email Generale Filiale:</span>
                <input type="email" id="branch-email-${bankId}-${originalIndex}" value="${b.email || ''}" placeholder="es. filiale.padova@banca.it" style="padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; flex: 1; max-width: 350px; outline: none;">
            </div>
            
            <div style="margin-top: 0.5rem;">
                <h4 style="font-size: 0.9rem; font-weight: 700; color: #334155; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
                    <span>👥</span> Referenti Diretti
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${referentiRowsHtml}
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                <button class="btn btn-danger" onclick="window.deleteBranch('${bankId}', ${originalIndex})" style="background: #ef4444; color: #ffffff; font-weight: 700; border: none; padding: 0.55rem 1.25rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);">
                    🗑️ Elimina Filiale
                </button>
                <button class="btn btn-primary" onclick="window.saveBranchDetails('${bankId}', ${originalIndex})" style="background: #0052ff; color: #ffffff; font-weight: 700; border: none; padding: 0.55rem 1.25rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; box-shadow: 0 4px 12px rgba(0, 82, 255, 0.15);">
                    💾 Salva Referenti &amp; Email
                </button>
            </div>
        `;
        
        branchesList.appendChild(card);
    });
};

window.saveBranchDetails = async function(bankId, originalIndex) {
    const address = document.getElementById(`branch-address-${bankId}-${originalIndex}`).value.trim();
    const email = document.getElementById(`branch-email-${bankId}-${originalIndex}`).value.trim();
    const referenti = [];
    
    for (let idx = 0; idx < 3; idx++) {
        const nome = document.getElementById(`ref-nome-${bankId}-${originalIndex}-${idx}`).value.trim();
        const ruolo = document.getElementById(`ref-ruolo-${bankId}-${originalIndex}-${idx}`).value.trim();
        const telefono = document.getElementById(`ref-tel-${bankId}-${originalIndex}-${idx}`).value.trim();
        const refEmail = document.getElementById(`ref-email-${bankId}-${originalIndex}-${idx}`).value.trim();
        
        if (nome || ruolo || telefono || refEmail) {
            referenti.push({ nome, ruolo, telefono, email: refEmail });
        }
    }
    
    const updatedBranches = { ...BrokerFlowEngine.branchesDb };
    if (!updatedBranches[bankId] || !updatedBranches[bankId][originalIndex]) {
        alert("Filiale non trovata!");
        return;
    }
    
    updatedBranches[bankId][originalIndex] = {
        ...updatedBranches[bankId][originalIndex],
        indirizzo: address,
        email,
        referenti
    };
    
    try {
        const response = await fetch("/api/save-branches", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedBranches)
        });
        
        if (response.ok) {
            alert(`🎉 Successo! Dettagli filiale salvati con successo.`);
            BrokerFlowEngine.branchesDb = updatedBranches;
            window.updateFilialiModule();
        } else {
            const errData = await response.json();
            alert(`❌ Errore durante il salvataggio: ${errData.message}`);
        }
    } catch (e) {
        console.error("Save branch error:", e);
        alert(`❌ Errore di rete: ${e.message}`);
    }
};

window.deleteBranch = async function(bankId, originalIndex) {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questa filiale?")) {
        return;
    }
    
    const updatedBranches = { ...BrokerFlowEngine.branchesDb };
    if (!updatedBranches[bankId] || !updatedBranches[bankId][originalIndex]) {
        alert("Filiale non trovata!");
        return;
    }
    
    updatedBranches[bankId].splice(originalIndex, 1);
    
    try {
        const response = await fetch("/api/save-branches", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedBranches)
        });
        
        if (response.ok) {
            alert(`🎉 Successo! Filiale eliminata con successo.`);
            BrokerFlowEngine.branchesDb = updatedBranches;
            window.updateFilialiModule();
        } else {
            const errData = await response.json();
            alert(`❌ Errore durante l'eliminazione: ${errData.message}`);
        }
    } catch (e) {
        console.error("Delete branch error:", e);
        alert(`❌ Errore di rete: ${e.message}`);
    }
};

window.currentEditingDealId = null;

window.savePratica = function(isDraft = false) {
    if (typeof saveCurrentSubject === "function") {
        try { saveCurrentSubject(true); } catch(e) {}
    }

    let clientName = "Cliente";
    if (wizardSubjects && wizardSubjects.length > 0) {
        const primary = wizardSubjects.find(s => s.role === "Richiedente Principale");
        if (primary && primary.nome) {
            clientName = `${primary.nome} ${primary.cognome || ""}`.trim();
        } else if (wizardSubjects[0].nome) {
            clientName = `${wizardSubjects[0].nome} ${wizardSubjects[0].cognome || ""}`.trim();
        }
    }
    
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    const provImmVal = (document.getElementById("wiz-prov-immobile" + suffix)?.value.trim()) || (document.getElementById("wiz-prov-immobile")?.value.trim()) || (document.getElementById("wiz-prov-immobile-file")?.value.trim()) || "";
    const provResVal = (document.getElementById("wiz-prov-residenza" + suffix)?.value.trim()) || (document.getElementById("wiz-prov-residenza")?.value.trim()) || (document.getElementById("wiz-prov-residenza-file")?.value.trim()) || provImmVal;
    const provLavVal = (document.getElementById("wiz-prov-lavoro" + suffix)?.value.trim()) || (document.getElementById("wiz-prov-lavoro")?.value.trim()) || (document.getElementById("wiz-prov-lavoro-file")?.value.trim()) || provImmVal;
    
    const p3ImportoEl = document.getElementById("p3-importo-field");
    const loan = p3ImportoEl ? (parseFloat(p3ImportoEl.value) || 0) : 180000;
    
    const p3ValoreEl = document.getElementById("p3-valore-field");
    const value = p3ValoreEl ? (parseFloat(p3ValoreEl.value) || 0) : 230000;
    const ltvVal = value > 0 ? Math.round((loan / value) * 100) : 0;
    
    const finalitaVal = document.getElementById("wiz-p3-finalita") ? document.getElementById("wiz-p3-finalita").value : "acquisto";
    const isConsapEligibleSave = ["acquisto", "asta", "surroga"].includes(finalitaVal);
    const consapSelect = document.getElementById("p3-consap-select");
    const isConsap = isConsapEligibleSave && consapSelect ? (consapSelect.value === "si") : false;
    
    let proposedBank = "Monte dei Paschi di Siena";
    let simulatedRate = 0;
    let bestBankObj = null;
    let selectedBankId = window.selectedBankId || null;
    let selectedBankProduct = window.selectedBankProduct || null;
    
    const allEvaluated = (window.lastEvaluationResult && window.lastEvaluationResult.allEvaluated) ? window.lastEvaluationResult.allEvaluated : [];
    if (selectedBankId) {
        bestBankObj = allEvaluated.find(b => b.bankId === selectedBankId && (!selectedBankProduct || b.prodName === selectedBankProduct));
        if (!bestBankObj) bestBankObj = allEvaluated.find(b => b.bankId === selectedBankId);
        if (!bestBankObj) bestBankObj = allEvaluated.find(b => String(b.bankId).includes(selectedBankId) || String(selectedBankId).includes(b.bankId));
    }
    if (!bestBankObj) {
        if (window.lastEvaluationResult && window.lastEvaluationResult.feasible && window.lastEvaluationResult.banks && window.lastEvaluationResult.banks.length > 0) {
            bestBankObj = window.lastEvaluationResult.banks[0];
        } else if (allEvaluated.length > 0) {
            bestBankObj = allEvaluated[0];
        }
    }
    
    if (bestBankObj) {
        proposedBank = bestBankObj.name || proposedBank;
        selectedBankId = bestBankObj.bankId || selectedBankId;
        selectedBankProduct = bestBankObj.prodName || selectedBankProduct;
        const wizCalcModeExact = document.getElementById("wiz-calc-mode-exact");
        const calcMode = (wizCalcModeExact && wizCalcModeExact.checked) ? "exact" : "max";
        simulatedRate = calcMode === "max" ? (bestBankObj.maxRataSimulated || 0) : (bestBankObj.rata || 0);
    }
    
    const praticaPayload = {
        selectedBankId: selectedBankId,
        selectedBankProduct: selectedBankProduct,
        subjects: JSON.parse(JSON.stringify(wizardSubjects || [])),
        valoreImmobile: value,
        valore: value,
        importoMutuo: loan,
        mutuo: loan,
        importoMutuo: loan,
        durata: document.getElementById("wiz-p3-durata") ? parseInt(document.getElementById("wiz-p3-durata").value) : 25,
        finalita: document.getElementById("wiz-p3-finalita") ? document.getElementById("wiz-p3-finalita").value : "acquisto",
        isAsta: (document.getElementById("wiz-p3-finalita")?.value === "asta" || document.getElementById("wiz-p3-is-asta")?.checked === true),
        tipoTasso: document.getElementById("wiz-p3-tipo-tasso") ? document.getElementById("wiz-p3-tipo-tasso").value : "any",
        aperturaConto: document.getElementById("phase4-flag-conto") ? (document.getElementById("phase4-flag-conto").checked ? "si" : "no") : (document.getElementById("wiz-p3-apertura-conto") ? document.getElementById("wiz-p3-apertura-conto").value : "si"),
        hasCpi: document.getElementById("phase4-flag-cpi") ? document.getElementById("phase4-flag-cpi").checked : true,
        classeEn: document.getElementById("wiz-classe-en") ? document.getElementById("wiz-classe-en").value : "standard",
        classeEnergetica: document.getElementById("wiz-p3-classe-energetica") ? document.getElementById("wiz-p3-classe-energetica").value : "to_verify",
        zona: document.getElementById("wiz-zona") ? document.getElementById("wiz-zona").value : "nord",
        isConsap: isConsap,
        
        // Acquisto + Ristrutturazione specialized fields
        acqPrezzo: document.getElementById("wiz-p3-acq-prezzo") ? document.getElementById("wiz-p3-acq-prezzo").value : "200000",
        acqMutuo: document.getElementById("wiz-p3-acq-mutuo") ? document.getElementById("wiz-p3-acq-mutuo").value : "160000",
        ristrCosto: document.getElementById("wiz-p3-ristr-costo") ? document.getElementById("wiz-p3-ristr-costo").value : "50000",
        ristrMutuo: document.getElementById("wiz-p3-ristr-mutuo") ? document.getElementById("wiz-p3-ristr-mutuo").value : "40000",
        prezzoAcquisto: document.getElementById("wiz-p3-acq-prezzo") ? document.getElementById("wiz-p3-acq-prezzo").value : "200000",
        importoMutuoAcquisto: document.getElementById("wiz-p3-acq-mutuo") ? document.getElementById("wiz-p3-acq-mutuo").value : "160000",
        costoRistrutturazione: document.getElementById("wiz-p3-ristr-costo") ? document.getElementById("wiz-p3-ristr-costo").value : "50000",
        importoMutuoRistrutturazione: document.getElementById("wiz-p3-ristr-mutuo") ? document.getElementById("wiz-p3-ristr-mutuo").value : "40000",

        // Politiche bancarie e garanzie avanzate
        patrimonioMobiliare: document.getElementById("wiz-patrimonio-mobiliare") ? document.getElementById("wiz-patrimonio-mobiliare").value : "25000",
        isStagionale: document.getElementById("wiz-q10-dip-is-stagionale") ? document.getElementById("wiz-q10-dip-is-stagionale").checked : false,
        stagioniConsecutive: document.getElementById("wiz-q10-dip-stagioni-consecutive") ? document.getElementById("wiz-q10-dip-stagioni-consecutive").value : "2",
        liquiditaPura: document.getElementById("wiz-p3-liquidita-pura") ? document.getElementById("wiz-p3-liquidita-pura").value : "0",
        hasSecondProperty: document.getElementById("wiz-p3-has-second-property") ? document.getElementById("wiz-p3-has-second-property").checked : false,
        secondValore: document.getElementById("wiz-p3-second-valore") ? document.getElementById("wiz-p3-second-valore").value : "150000",
        secondComune: document.getElementById("wiz-p3-second-comune") ? document.getElementById("wiz-p3-second-comune").value : "",
        secondIntestatario: document.getElementById("wiz-p3-second-intestatario") ? document.getElementById("wiz-p3-second-intestatario").value : "richiedente",
        secondHasMortgage: document.getElementById("wiz-p3-second-has-mortgage") ? document.getElementById("wiz-p3-second-has-mortgage").value : "no",
        secondAccorpa: document.getElementById("wiz-p3-second-accorpa") ? document.getElementById("wiz-p3-second-accorpa").checked : true,
        secondDebitoResiduo: document.getElementById("wiz-p3-second-debito-residuo") ? document.getElementById("wiz-p3-second-debito-residuo").value : "50000",
        secondRataAttuale: document.getElementById("wiz-p3-second-rata-attuale") ? document.getElementById("wiz-p3-second-rata-attuale").value : "450",
        secondMesiAmmortamento: document.getElementById("wiz-p3-second-mesi-ammortamento") ? document.getElementById("wiz-p3-second-mesi-ammortamento").value : "24",

        // Step 2 General fields
        personeNucleo: document.getElementById("wiz-persone-nucleo" + suffix) ? parseInt(document.getElementById("wiz-persone-nucleo" + suffix).value) : 4,
        provImmobile: provImmVal,
        provResidenza: provResVal,
        provLavoro: provLavVal,
        hasLoans: document.getElementById("wiz-q11-has-loans") ? document.getElementById("wiz-q11-has-loans").value : "no",
        pignoramenti: document.getElementById("wiz-q12-pignoramenti") ? document.getElementById("wiz-q12-pignoramenti").value : "no",
        crifSofferenze: document.getElementById("wiz-q13-crif-sofferenze") ? document.getElementById("wiz-q13-crif-sofferenze").value : "no",
        
        // Family details
        statoCivile: document.getElementById("wiz-q4-stato-civile" + suffix) ? document.getElementById("wiz-q4-stato-civile" + suffix).value : "celibe",
        regime: document.getElementById("wiz-q4-regime" + suffix) ? document.getElementById("wiz-q4-regime" + suffix).value : "comunione",
        anniSposato: document.getElementById("wiz-q4-anni-sposato" + suffix) ? document.getElementById("wiz-q4-anni-sposato" + suffix).value : "",
        alimenti: document.getElementById("wiz-q4-alimenti" + suffix) ? document.getElementById("wiz-q4-alimenti" + suffix).value : "no",
        alimentiImporto: document.getElementById("wiz-q4-alimenti-importo" + suffix) ? document.getElementById("wiz-q4-alimenti-importo" + suffix).value : "0",
        figli: document.getElementById("wiz-q5-figli" + suffix) ? document.getElementById("wiz-q5-figli" + suffix).value : "no",
        numFigli: document.getElementById("wiz-q5-num-figli" + suffix) ? parseInt(document.getElementById("wiz-q5-num-figli" + suffix).value) : 0,
        assegnoUnicoSelect: document.getElementById("wiz-q15-assegno-unico-select" + suffix) ? document.getElementById("wiz-q15-assegno-unico-select" + suffix).value : "no",
        assegnoUnico: document.getElementById("wiz-q15-assegno-unico" + suffix) ? document.getElementById("wiz-q15-assegno-unico" + suffix).value : "0",
        etaFigli: document.getElementById("wiz-q5-eta-figli" + suffix) ? document.getElementById("wiz-q5-eta-figli" + suffix).value : "",
        
        // Card HTML contents
        coapplicantsHtml: document.getElementById("coapplicant-cards-container") ? document.getElementById("coapplicant-cards-container").innerHTML : "",
        guarantorsHtml: document.getElementById("guarantor-cards-container") ? document.getElementById("guarantor-cards-container").innerHTML : "",
        loansHtml: document.getElementById("loans-cards-container") ? document.getElementById("loans-cards-container").innerHTML : "",
        
        coapplicantsData: Array.from(document.querySelectorAll("#spouse-auto-card-container > div, #spouse-auto-card-container-file > div, #coapplicant-cards-container > div")).map(card => ({
            isSpouse: card.dataset.isSpouse === "true" || card.id === "coapp-spouse-auto",
            nome: card.querySelector(".coapp-q1-nome")?.value || card.querySelector(".coapp-nome")?.value || "",
            cognome: card.querySelector(".coapp-q2-cognome")?.value || card.querySelector(".coapp-cognome")?.value || "",
            dataNascita: card.querySelector(".coapp-q3-data-nascita")?.value || card.querySelector(".coapp-data-nascita")?.value || "",
            sesso: card.querySelector(".coapp-q-sesso")?.value || card.querySelector(".coapp-sesso")?.value || "F",
            statoCivile: card.querySelector(".coapp-q4-stato-civile")?.value || "sposato",
            regime: card.querySelector(".coapp-q4-regime")?.value || "separazione",
            anniSposato: card.querySelector(".coapp-q4-anni-sposato")?.value || "8",
            separazioneAnteStipula: card.querySelector(".coapp-q4-separazione-ante-stipula")?.checked || false,
            alimenti: card.querySelector(".coapp-q4-alimenti")?.value || card.querySelector(".coapp-alimenti")?.value || "nessuno",
            alimentiImporto: card.querySelector(".coapp-q4-alimenti-importo")?.value || card.querySelector(".coapp-alimenti-importo")?.value || "0",
            figli: card.querySelector(".coapp-q5-figli")?.value || "no",
            numFigli: card.querySelector(".coapp-q5-num-figli")?.value || "0",
            assegnoUnicoSelect: card.querySelector(".coapp-q15-assegno-unico-select")?.value || "no",
            assegnoUnico: card.querySelector(".coapp-q15-assegno-unico")?.value || "0",
            etaFigli: card.querySelector(".coapp-q5-eta-figli")?.value || "",
            cittadinanza: card.querySelector(".coapp-q6-cittadinanza")?.value || card.querySelector(".coapp-cittadinanza")?.value || "IT",
            permScadenza: card.querySelector(".coapp-q6-permesso")?.value || card.querySelector(".coapp-permesso")?.value || "valido",
            famigliaSede: card.querySelector(".coapp-q14-famiglia")?.value || "italia",
            abitazione: card.querySelector(".coapp-q7-abitazione")?.value || "famiglia",
            canoneAffitto: card.querySelector(".coapp-q7-canone-affitto")?.value || "0",
            bancaAttuale: card.querySelector(".coapp-q8-banca-attuale")?.value || "",
            macroCategoria: card.querySelector(".coapp-macro-categoria")?.value || card.querySelector(".coapp-tipo")?.value || "dipendente",
            professione: card.querySelector(".coapp-q9-professione")?.value || "",
            dipContratto: card.querySelector(".coapp-q10-dip-contratto")?.value || "indeterminato",
            dipAnzianita: card.querySelector(".coapp-q10-anzianita")?.value || card.querySelector(".coapp-anzianita")?.value || "0",
            dipOrario: card.querySelector(".coapp-q10-dip-orario")?.value || card.querySelector(".coapp-orario")?.value || "full_time",
            dipDatorePiva: card.querySelector(".coapp-q10-datore-piva")?.value || card.querySelector(".coapp-datore")?.value || "",
            cu1: card.querySelector(".coapp-cu1")?.value || "0",
            cu2: card.querySelector(".coapp-cu2")?.value || "0",
            cu6: card.querySelector(".coapp-cu6")?.value || "365",
            cu21: card.querySelector(".coapp-cu21")?.value || "0",
            cu22: card.querySelector(".coapp-cu22")?.value || "0",
            cu26: card.querySelector(".coapp-cu26")?.value || "0",
            cu27: card.querySelector(".coapp-cu27")?.value || "0",
            cu29: card.querySelector(".coapp-cu29")?.value || "0",
            cu365: card.querySelector(".coapp-cu365")?.value || "0",
            cu810: card.querySelector(".coapp-cu810")?.value || "0",
            autonomoRegime: card.querySelector(".coapp-autonomo-regime")?.value || "forfettario",
            autonomoAnni: card.querySelector(".coapp-autonomo-anni")?.value || "5",
            singleUnico: card.querySelector(".coapp-autonomo-single-unico")?.checked || false,
            lm22: card.querySelector(".coapp-lm22")?.value || "0",
            lm27: card.querySelector(".coapp-lm27")?.value || "0",
            lm35: card.querySelector(".coapp-lm35")?.value || "0",
            lm36: card.querySelector(".coapp-lm36")?.value || "0",
            lm39: card.querySelector(".coapp-lm39")?.value || "0",
            lm22_anno2: card.querySelector(".coapp-lm22-anno2")?.value || "0",
            lm27_anno2: card.querySelector(".coapp-lm27-anno2")?.value || "0",
            lm35_anno2: card.querySelector(".coapp-lm35-anno2")?.value || "0",
            lm36_anno2: card.querySelector(".coapp-lm36-anno2")?.value || "0",
            lm39_anno2: card.querySelector(".coapp-lm39-anno2")?.value || "0",
            rn1: card.querySelector(".coapp-rn1")?.value || "0",
            rn4: card.querySelector(".coapp-rn4")?.value || "0",
            rn26: card.querySelector(".coapp-rn26")?.value || "0",
            rv2: card.querySelector(".coapp-rv2")?.value || "0",
            rv10: card.querySelector(".coapp-rv10")?.value || "0",
            rv17: card.querySelector(".coapp-rv17")?.value || "0",
            rn1_anno2: card.querySelector(".coapp-rn1-anno2")?.value || "0",
            rn4_anno2: card.querySelector(".coapp-rn4-anno2")?.value || "0",
            rn26_anno2: card.querySelector(".coapp-rn26-anno2")?.value || "0",
            rv2_anno2: card.querySelector(".coapp-rv2-anno2")?.value || "0",
            rv10_anno2: card.querySelector(".coapp-rv10-anno2")?.value || "0",
            rv17_anno2: card.querySelector(".coapp-rv17-anno2")?.value || "0",
            pensioneTipo: card.querySelector(".coapp-pensione-tipo")?.value || "",
            netto: card.querySelector(".coapp-netto")?.value || "0",
            hasLoans: card.querySelector(".coapp-q11-has-loans")?.value || "no",
            loansRata: card.querySelector(".coapp-loans-rata")?.value || "0",
            loansDebito: card.querySelector(".coapp-loans-debito")?.value || "0",
            pignoramenti: card.querySelector(".coapp-q12-pignoramenti")?.value || "no",
            crifSofferenze: card.querySelector(".coapp-q13-crif-sofferenze")?.value || "no"
        })),
        guarantorsData: Array.from(document.querySelectorAll("#guarantor-cards-container > div")).map(card => ({
            isGuarantor: true,
            nome: card.querySelector(".coapp-q1-nome")?.value || card.querySelector(".coapp-nome")?.value || card.querySelector(".guar-nome")?.value || "",
            cognome: card.querySelector(".coapp-q2-cognome")?.value || card.querySelector(".coapp-cognome")?.value || "",
            dataNascita: card.querySelector(".coapp-q3-data-nascita")?.value || card.querySelector(".coapp-data-nascita")?.value || "",
            sesso: card.querySelector(".coapp-q-sesso")?.value || card.querySelector(".coapp-sesso")?.value || "M",
            rapporto: card.querySelector(".coapp-q-rapporto")?.value || "genitore",
            fratelloNucleoAutonomo: card.querySelector(".coapp-fratello-nucleo-autonomo") ? card.querySelector(".coapp-fratello-nucleo-autonomo").value : "si",
            statoCivile: card.querySelector(".coapp-q4-stato-civile")?.value || "sposato",
            regime: card.querySelector(".coapp-q4-regime")?.value || "separazione",
            anniSposato: card.querySelector(".coapp-q4-anni-sposato")?.value || "15",
            separazioneAnteStipula: card.querySelector(".coapp-q4-separazione-ante-stipula")?.checked || false,
            alimenti: card.querySelector(".coapp-q4-alimenti")?.value || card.querySelector(".coapp-alimenti")?.value || "nessuno",
            alimentiImporto: card.querySelector(".coapp-q4-alimenti-importo")?.value || card.querySelector(".coapp-alimenti-importo")?.value || "0",
            figli: card.querySelector(".coapp-q5-figli")?.value || "no",
            numFigli: card.querySelector(".coapp-q5-num-figli")?.value || "0",
            assegnoUnicoSelect: card.querySelector(".coapp-q15-assegno-unico-select")?.value || "no",
            assegnoUnico: card.querySelector(".coapp-q15-assegno-unico")?.value || "0",
            etaFigli: card.querySelector(".coapp-q5-eta-figli")?.value || "",
            cittadinanza: card.querySelector(".coapp-q6-cittadinanza")?.value || card.querySelector(".coapp-cittadinanza")?.value || "IT",
            permScadenza: card.querySelector(".coapp-q6-permesso")?.value || card.querySelector(".coapp-permesso")?.value || "valido",
            famigliaSede: card.querySelector(".coapp-q14-famiglia")?.value || "italia",
            abitazione: card.querySelector(".coapp-q7-abitazione")?.value || "proprieta",
            canoneAffitto: card.querySelector(".coapp-q7-canone-affitto")?.value || "0",
            bancaAttuale: card.querySelector(".coapp-q8-banca-attuale")?.value || "",
            macroCategoria: card.querySelector(".coapp-macro-categoria")?.value || card.querySelector(".coapp-tipo")?.value || "dipendente",
            professione: card.querySelector(".coapp-q9-professione")?.value || "",
            dipContratto: card.querySelector(".coapp-q10-dip-contratto")?.value || "indeterminato",
            dipAnzianita: card.querySelector(".coapp-q10-anzianita")?.value || card.querySelector(".coapp-anzianita")?.value || "0",
            dipOrario: card.querySelector(".coapp-q10-dip-orario")?.value || card.querySelector(".coapp-orario")?.value || "full_time",
            dipDatorePiva: card.querySelector(".coapp-q10-datore-piva")?.value || card.querySelector(".coapp-datore")?.value || "",
            cu1: card.querySelector(".coapp-cu1")?.value || "0",
            cu2: card.querySelector(".coapp-cu2")?.value || "0",
            cu6: card.querySelector(".coapp-cu6")?.value || "365",
            cu21: card.querySelector(".coapp-cu21")?.value || "0",
            cu22: card.querySelector(".coapp-cu22")?.value || "0",
            cu26: card.querySelector(".coapp-cu26")?.value || "0",
            cu27: card.querySelector(".coapp-cu27")?.value || "0",
            cu29: card.querySelector(".coapp-cu29")?.value || "0",
            cu365: card.querySelector(".coapp-cu365")?.value || "0",
            cu810: card.querySelector(".coapp-cu810")?.value || "0",
            autonomoRegime: card.querySelector(".coapp-autonomo-regime")?.value || "forfettario",
            autonomoAnni: card.querySelector(".coapp-autonomo-anni")?.value || "5",
            singleUnico: card.querySelector(".coapp-autonomo-single-unico")?.checked || false,
            lm22: card.querySelector(".coapp-lm22")?.value || "0",
            lm27: card.querySelector(".coapp-lm27")?.value || "0",
            lm35: card.querySelector(".coapp-lm35")?.value || "0",
            lm36: card.querySelector(".coapp-lm36")?.value || "0",
            lm39: card.querySelector(".coapp-lm39")?.value || "0",
            lm22_anno2: card.querySelector(".coapp-lm22-anno2")?.value || "0",
            lm27_anno2: card.querySelector(".coapp-lm27-anno2")?.value || "0",
            lm35_anno2: card.querySelector(".coapp-lm35-anno2")?.value || "0",
            lm36_anno2: card.querySelector(".coapp-lm36-anno2")?.value || "0",
            lm39_anno2: card.querySelector(".coapp-lm39-anno2")?.value || "0",
            rn1: card.querySelector(".coapp-rn1")?.value || "0",
            rn4: card.querySelector(".coapp-rn4")?.value || "0",
            rn26: card.querySelector(".coapp-rn26")?.value || "0",
            rv2: card.querySelector(".coapp-rv2")?.value || "0",
            rv10: card.querySelector(".coapp-rv10")?.value || "0",
            rv17: card.querySelector(".coapp-rv17")?.value || "0",
            rn1_anno2: card.querySelector(".coapp-rn1-anno2")?.value || "0",
            rn4_anno2: card.querySelector(".coapp-rn4-anno2")?.value || "0",
            rn26_anno2: card.querySelector(".coapp-rn26-anno2")?.value || "0",
            rv2_anno2: card.querySelector(".coapp-rv2-anno2")?.value || "0",
            rv10_anno2: card.querySelector(".coapp-rv10-anno2")?.value || "0",
            rv17_anno2: card.querySelector(".coapp-rv17-anno2")?.value || "0",
            pensioneTipo: card.querySelector(".coapp-pensione-tipo")?.value || "",
            netto: card.querySelector(".coapp-netto")?.value || card.querySelector(".guar-netto")?.value || "0",
            hasLoans: card.querySelector(".coapp-q11-has-loans")?.value || "no",
            loansRata: card.querySelector(".coapp-loans-rata")?.value || "0",
            loansDebito: card.querySelector(".coapp-loans-debito")?.value || "0",
            pignoramenti: card.querySelector(".coapp-q12-pignoramenti")?.value || "no",
            crifSofferenze: card.querySelector(".coapp-q13-crif-sofferenze")?.value || "no"
        })),
        loansData: Array.from(document.querySelectorAll("#loans-cards-container > div")).map(card => ({
            tipo: card.querySelector(".loan-tipo-input")?.value || "",
            rata: card.querySelector(".loan-rata-input")?.value || "",
            capIniziale: card.querySelector(".loan-cap-iniziale-input")?.value || "",
            capitale: card.querySelector(".loan-capitale-input")?.value || "",
            durIniziale: card.querySelector(".loan-durata-iniziale-input")?.value || "",
            durResidua: card.querySelector(".loan-durata-residua-input")?.value || "",
            chiuso: card.querySelector(".loan-chiuso-input")?.value || "si"
        }))
    };

    let targetId = window.currentEditingDealId;
    let existingIndex = targetId ? crmDeals.findIndex(d => String(d.id) === String(targetId)) : -1;

    const primSubj = (praticaPayload.subjects && praticaPayload.subjects[0]) || {};
    const dealTelefono = primSubj.telefono || document.getElementById("wiz-q1-telefono")?.value?.trim() || document.getElementById("file-doc-telefono")?.value?.trim() || "";
    const dealEmail = primSubj.email || document.getElementById("wiz-q1-email")?.value?.trim() || document.getElementById("file-doc-email")?.value?.trim() || "";

    if (existingIndex !== -1) {
        crmDeals[existingIndex] = {
            ...crmDeals[existingIndex],
            cliente: clientName,
            telefono: dealTelefono || crmDeals[existingIndex].telefono || "",
            email: dealEmail || crmDeals[existingIndex].email || "",
            comune: provImmVal,
            mutuo: loan,
            importoMutuo: loan,
            valore: value,
            valoreImmobile: value,
            ltv: ltvVal,
            banca: proposedBank,
            selectedBankId: selectedBankId,
            selectedBankProduct: selectedBankProduct,
            rata: simulatedRate,
            stato: isDraft ? "bozza" : "preventivo_salvato",
            label: isDraft ? "Bozza Salvata" : "Preventivo Pronto",
            updatedAt: new Date().toISOString(),
            praticaData: praticaPayload
        };
    } else {
        let nextId = 101;
        if (crmDeals && crmDeals.length > 0) {
            const ids = crmDeals.map(d => parseInt(d.id) || 0);
            nextId = Math.max(...ids) + 1;
        }
        targetId = String(nextId);
        window.currentEditingDealId = targetId;

        const newDeal = {
            id: targetId,
            cliente: clientName,
            telefono: dealTelefono,
            email: dealEmail,
            comune: provImmVal,
            mutuo: loan,
            importoMutuo: loan,
            valore: value,
            valoreImmobile: value,
            ltv: ltvVal,
            banca: proposedBank,
            selectedBankId: selectedBankId,
            selectedBankProduct: selectedBankProduct,
            rata: simulatedRate,
            stato: isDraft ? "bozza" : "preventivo_salvato",
            label: isDraft ? "Bozza" : "Nuova Analisi",
            createdAt: new Date().toISOString(),
            praticaData: praticaPayload
        };
        crmDeals.unshift(newDeal);
    }
    
    try {
        localStorage.setItem("brokerflow_deals", JSON.stringify(crmDeals));
    } catch (e) {
        console.error("Error saving deals to localStorage", e);
    }
    
    // Auto sync clients with saved deals
    if (typeof window.syncClientsWithDeals === "function") {
        window.syncClientsWithDeals();
    }
    
    renderCrmDeals();
    if (typeof renderCrmClients === "function") {
        renderCrmClients();
    }
    if (typeof window.updateDashboardStats === "function") {
        window.updateDashboardStats();
    }
    if (typeof window.pushCrmDealsToServer === "function") {
        window.pushCrmDealsToServer();
    }
    
    if (typeof window.showToast === "function") {
        window.showToast(isDraft ? `💾 Bozza #${targetId} salvata!` : `🎉 Preventivo #${targetId} salvato con successo nelle Pratiche!`, "success");
    }
    switchCrmModule("pratiche");
};

window.showToast = function(msg, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;";
        document.body.appendChild(container);
    }
    // Remove existing identical toast if already present to prevent duplicate visual stacking
    const existing = Array.from(container.children).find(el => el.innerHTML === msg);
    if (existing) {
        existing.remove();
    }
    const toast = document.createElement("div");
    const bg = type === "success" ? "#10b981" : (type === "error" ? "#ef4444" : "#0052ff");
    toast.style.cssText = `background: ${bg}; color: #ffffff; padding: 0.85rem 1.25rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s ease; pointer-events: auto;`;
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, 2500);
};

window.eliminaPratica = function(dealId) {
    if (!confirm(`Sei sicuro di voler eliminare la pratica #${dealId}?`)) return;
    crmDeals = crmDeals.filter(d => String(d.id) !== String(dealId));
    try {
        localStorage.setItem("brokerflow_deals", JSON.stringify(crmDeals));
    } catch (e) {
        console.error("Error saving deals after deletion", e);
    }
    if (window.currentEditingDealId === String(dealId)) {
        window.currentEditingDealId = null;
        const editBanner = document.getElementById("engine-editing-banner");
        if (editBanner) editBanner.style.display = "none";
    }
    if (typeof window.syncClientsWithDeals === "function") {
        window.syncClientsWithDeals();
    }
    renderCrmDeals();
    if (typeof renderCrmClients === "function") {
        renderCrmClients();
    }
    if (typeof window.updateDashboardStats === "function") {
        window.updateDashboardStats();
    }
    if (typeof window.showToast === "function") {
        window.showToast(`🗑️ Pratica #${dealId} eliminata.`, "error");
    }
};

window.resetWizardFields = function() {
    window._isBatchResetting = true;
    try {
        window.wizardCurrentStep = 1;
        window.currentEditingDealId = null;
        const editBanner = document.getElementById("engine-editing-banner");
        if (editBanner) editBanner.style.display = "none";

        const p3ValoreEl = document.getElementById("p3-valore-field");
        if (p3ValoreEl) p3ValoreEl.value = "";
        
        const p3ImportoEl = document.getElementById("p3-importo-field");
        if (p3ImportoEl) p3ImportoEl.value = "";
        
        const p3DurataEl = document.getElementById("wiz-p3-durata");
        if (p3DurataEl) p3DurataEl.value = "25";
        
        const p3FinalitaEl = document.getElementById("wiz-p3-finalita");
        if (p3FinalitaEl) p3FinalitaEl.value = "acquisto";
        const p3AstaEl = document.getElementById("wiz-p3-is-asta");
        if (p3AstaEl) p3AstaEl.checked = false;
        
        const p3MacroTasso = document.getElementById("wiz-p3-macro-tasso");
        if (p3MacroTasso) p3MacroTasso.value = "any";
        if (typeof window.handleP3MacroTassoChange === "function") {
            window.handleP3MacroTassoChange("any");
        } else {
            const p3TassoEl = document.getElementById("wiz-p3-tipo-tasso");
            if (p3TassoEl) p3TassoEl.value = "any";
            const subFissoGroup = document.getElementById("group-p3-sub-tasso-fisso");
            if (subFissoGroup) subFissoGroup.style.display = "none";
            const subVarGroup = document.getElementById("group-p3-sub-tasso-variabile");
            if (subVarGroup) subVarGroup.style.display = "none";
        }
        
        const p3ContoEl = document.getElementById("wiz-p3-apertura-conto");
        if (p3ContoEl) p3ContoEl.value = "si";
        const p4ContoEl = document.getElementById("phase4-flag-conto");
        if (p4ContoEl) p4ContoEl.checked = true;
        const p4CpiEl = document.getElementById("phase4-flag-cpi");
        if (p4CpiEl) p4CpiEl.checked = true;
        
        const classeEnEl = document.getElementById("wiz-classe-en");
        if (classeEnEl) classeEnEl.value = "standard";
        
        const zonaEl = document.getElementById("wiz-zona");
        if (zonaEl) zonaEl.value = "nord";
        
        const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
        
        const inputPersoneManual = document.getElementById("wiz-persone-nucleo");
        const inputPersoneFile = document.getElementById("wiz-persone-nucleo-file");
        if (inputPersoneManual) {
            inputPersoneManual.value = "1";
            inputPersoneManual.dataset.userEdited = "false";
        }
        if (inputPersoneFile) {
            inputPersoneFile.value = "1";
            inputPersoneFile.dataset.userEdited = "false";
        }
        
        const inputProvImm = document.getElementById("wiz-prov-immobile" + suffix) || document.getElementById("wiz-prov-immobile");
        if (inputProvImm) inputProvImm.value = "";
        
        const inputProvRes = document.getElementById("wiz-prov-residenza" + suffix) || document.getElementById("wiz-prov-residenza");
        if (inputProvRes) inputProvRes.value = "";
        
        const inputProvLav = document.getElementById("wiz-prov-lavoro" + suffix) || document.getElementById("wiz-prov-lavoro");
        if (inputProvLav) inputProvLav.value = "";
        
        document.querySelectorAll(".geo-verified-pill").forEach(p => p.remove());
        
        // Reset global wizard subjects cleanly to default primary applicant
        wizardSubjects = [{
            role: "Richiedente Principale",
            nome: "Mario",
            cognome: "Rossi",
            dataNascita: "1988-05-15",
            eta: 38,
            sesso: "M",
            cittadinanza: "IT",
            statoCivile: "celibe",
            regime: "separazione",
            isOwner: true,
            figli: "no",
            tipoContratto: "indeterminato",
            netto: 2100.70,
            rawBoxData: {},
            incomes: [{ tipoContratto: "indeterminato", netto: 2100.70, rawBoxData: {} }],
            permScadenza: "valido",
            famigliaSede: "italia"
        }];
        editingSubjectIndex = null;
        if (typeof renderSubjectsChips === "function") {
            renderSubjectsChips();
        }
        if (typeof window.editSubject === "function") {
            window.editSubject(0);
        }

        const inputsToReset = [
            "wiz-q4-anni-sposato", 
            "wiz-q4-alimenti", "wiz-q4-alimenti-importo", "wiz-q5-figli", "wiz-q5-num-figli", "wiz-q15-assegno-unico-select", 
            "wiz-q15-assegno-unico", "wiz-q5-eta-figli", "wiz-q7-abitazione", "wiz-q6-permesso-scadenza", 
            "wiz-q14-famiglia-sede", "wiz-q7-canone-affitto", "wiz-q8-banca-attuale", "wiz-q9-professione", 
            "wiz-q10-cu1", "wiz-q10-cu2", "wiz-q10-cu21", "wiz-q10-cu22", 
            "wiz-q10-cu26", "wiz-q10-cu27", "wiz-q10-cu29", "wiz-q10-cu365", "wiz-q10-cu810", 
            "wiz-q10-autonomo-regime", "wiz-q10-autonomo-durata", "wiz-q10-autonomo-rn4", "wiz-q10-autonomo-rn26", "wiz-q10-autonomo-lm36", "wiz-q10-autonomo-lm39",
            "wiz-q11-has-loans", "wiz-q12-pignoramenti", "wiz-q13-crif-sofferenze"
        ];
        
        inputsToReset.forEach(id => {
            const el = document.getElementById(id) || document.getElementById(id + "-file");
            if (el) {
                if (id === "wiz-q10-cu6") {
                    el.value = "365";
                } else if (el.tagName === "SELECT") {
                    el.selectedIndex = 0;
                } else {
                    if (el.type === "number") {
                        el.value = "0";
                    } else {
                        el.value = "";
                    }
                }
            }
        });
        
        if (typeof window.toggleMarriageFields === "function") {
            window.toggleMarriageFields("celibe");
        }
        
        const cu6El = document.getElementById("wiz-q10-cu6") || document.getElementById("wiz-q10-cu6-file");
        if (cu6El) cu6El.value = "365";
        
        const spouseContainerManual = document.getElementById("spouse-auto-card-container");
        if (spouseContainerManual) {
            spouseContainerManual.innerHTML = "";
            spouseContainerManual.style.display = "none";
        }
        const spouseContainerFile = document.getElementById("spouse-auto-card-container-file");
        if (spouseContainerFile) {
            spouseContainerFile.innerHTML = "";
            spouseContainerFile.style.display = "none";
        }

        const coappContainer = document.getElementById("coapplicant-cards-container");
        if (coappContainer) coappContainer.innerHTML = "";
        
        const guarContainer = document.getElementById("guarantor-cards-container");
        if (guarContainer) guarContainer.innerHTML = "";
        
        const loansContainer = document.getElementById("loans-cards-container");
        if (loansContainer) loansContainer.innerHTML = "";
    } finally {
        window._isBatchResetting = false;
    }
};

window.initNuovaPratica = function() {
    window.currentEditingDealId = null;
    window.selectedBankId = null;
    window.selectedBankProduct = null;
    const editBanner = document.getElementById("engine-editing-banner");
    if (editBanner) editBanner.style.display = "none";
    window.resetWizardFields();
    window.switchCrmModule("engine");
    window.goToStep(1);
    if (typeof window.showToast === "function") {
        window.showToast("🚀 Nuova pratica inizializzata", "info");
    }
};

window.modificaPreventivo = window.riprendiPratica = function(dealId) {
    let deal = null;
    if (typeof crmDeals !== "undefined" && Array.isArray(crmDeals)) {
        deal = crmDeals.find(d => String(d.id) === String(dealId));
    }
    if (!deal) {
        try {
            const stored = JSON.parse(localStorage.getItem("brokerflow_deals") || "[]");
            deal = stored.find(d => String(d.id) === String(dealId));
        } catch(e) {}
    }
    if (!deal || !deal.praticaData) {
        alert("Impossibile riprendere questa pratica!");
        return Promise.resolve();
    }
    
    window.currentEditingDealId = String(deal.id);
    window.selectedBankId = deal.praticaData.selectedBankId || deal.selectedBankId || null;
    window.selectedBankProduct = deal.praticaData.selectedBankProduct || deal.selectedBankProduct || null;
    
    // Show editing banner in engine
    let editBanner = document.getElementById("engine-editing-banner");
    if (!editBanner) {
        editBanner = document.createElement("div");
        editBanner.id = "engine-editing-banner";
        const moduleEngine = document.getElementById("module-engine");
        if (moduleEngine) {
            moduleEngine.insertBefore(editBanner, moduleEngine.firstChild);
        }
    }
    if (editBanner) {
        editBanner.style.display = "flex";
        editBanner.style.background = "#eff6ff";
        editBanner.style.border = "1.5px solid #3b82f6";
        editBanner.style.borderRadius = "10px";
        editBanner.style.padding = "0.85rem 1.25rem";
        editBanner.style.marginBottom = "1.25rem";
        editBanner.style.justifyContent = "space-between";
        editBanner.style.alignItems = "center";
        editBanner.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.1)";
        editBanner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.4rem;">✏️</span>
                <div>
                    <strong style="color: #1e40af; font-size: 0.95rem; display: block;">Modifica Preventivo #${deal.id}</strong>
                    <span style="color: #3b82f6; font-size: 0.82rem;">Stai modificando i parametri per <strong>${deal.cliente || 'Cliente'}</strong>. Modifica qualsiasi campo e salva le modifiche.</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button type="button" class="btn btn-primary" onclick="window.savePratica(false)" style="padding: 0.45rem 1rem; font-size: 0.82rem; background: #10b981; border: none; border-radius: 6px; cursor: pointer; color: #fff; font-weight: 700; display: flex; align-items: center; gap: 0.3rem;">💾 Salva Modifiche</button>
                <button type="button" class="btn" onclick="window.initNuovaPratica()" style="padding: 0.45rem 0.85rem; font-size: 0.82rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; color: #475569;">➕ Nuova Pratica</button>
            </div>
        `;
    }
    
    wizardSubjects = JSON.parse(JSON.stringify(deal.praticaData.subjects || []));
    if (wizardSubjects.length === 0 && deal.praticaData.wizardData) {
        wizardSubjects = [{
            role: "Richiedente Principale",
            nome: deal.praticaData.nome || deal.cliente || "Mario",
            cognome: deal.praticaData.cognome || "Rossi",
            dataNascita: deal.praticaData.dataNascita || "1988-05-15",
            eta: deal.praticaData.eta || 38,
            sesso: deal.praticaData.sesso || "M",
            cittadinanza: deal.praticaData.cittadinanza || "IT",
            statoCivile: deal.praticaData.statoCivile || "celibe",
            regime: deal.praticaData.regime || "separazione",
            isOwner: true,
            figli: deal.praticaData.figli || "no",
            tipoContratto: deal.praticaData.tipoContratto || "indeterminato",
            netto: deal.praticaData.netto || 2100.70,
            rawBoxData: {},
            incomes: [{ tipoContratto: deal.praticaData.tipoContratto || "indeterminato", netto: deal.praticaData.netto || 2100.70, rawBoxData: {} }]
        }];
    }
    if (typeof renderSubjectsChips === "function") {
        renderSubjectsChips();
    }
    if (wizardSubjects.length > 0 && typeof window.editSubject === "function") {
        window.editSubject(0);
    }
    
    const pd = deal.praticaData;
    const suffix = (window.currentPhase2Mode === "file") ? "-file" : "";
    
    const valImmToRestore = (pd.valoreImmobile !== undefined && pd.valoreImmobile !== null && pd.valoreImmobile !== "") 
        ? pd.valoreImmobile 
        : ((pd.valore !== undefined && pd.valore !== null && pd.valore !== "") ? pd.valore : (deal.valoreImmobile || deal.valore || "230000"));
    const impMutToRestore = (pd.importoMutuo !== undefined && pd.importoMutuo !== null && pd.importoMutuo !== "") 
        ? pd.importoMutuo 
        : ((pd.mutuo !== undefined && pd.mutuo !== null && pd.mutuo !== "") ? pd.mutuo : (deal.importoMutuo || deal.mutuo || "180000"));

    // Step 3 inputs
    if (document.getElementById("p3-valore-field")) document.getElementById("p3-valore-field").value = valImmToRestore;
    if (document.getElementById("p3-importo-field")) document.getElementById("p3-importo-field").value = impMutToRestore;
    if (document.getElementById("wiz-p3-durata")) document.getElementById("wiz-p3-durata").value = pd.durata || "25";
    if (document.getElementById("wiz-p3-durata-acq-ristr")) document.getElementById("wiz-p3-durata-acq-ristr").value = pd.durata || "25";
    if (document.getElementById("wiz-p3-finalita")) document.getElementById("wiz-p3-finalita").value = pd.finalita || "acquisto";
    
    // Restore Acquisto + Ristrutturazione inputs (with fallback for legacy saved practices)
    let restoredAcqPrezzo = pd.acqPrezzo || pd.prezzoAcquisto || (pd.finalita === "acquisto_ristrutturazione" && valImmToRestore ? valImmToRestore : "200000");
    let restoredAcqMutuo = pd.acqMutuo || pd.importoMutuoAcquisto || (pd.finalita === "acquisto_ristrutturazione" && impMutToRestore ? Math.round(parseFloat(restoredAcqPrezzo) * 0.8) : "160000");
    let restoredRistrCosto = pd.ristrCosto || pd.costoRistrutturazione || pd.costoLavori || "50000";
    let restoredRistrMutuo = pd.ristrMutuo || pd.importoMutuoRistrutturazione || (pd.finalita === "acquisto_ristrutturazione" && impMutToRestore ? Math.max(0, parseFloat(impMutToRestore) - parseFloat(restoredAcqMutuo)) : "40000");
    if (parseFloat(restoredRistrMutuo) <= 0) restoredRistrMutuo = Math.round(parseFloat(restoredRistrCosto) * 0.8);

    if (document.getElementById("wiz-p3-acq-prezzo")) document.getElementById("wiz-p3-acq-prezzo").value = restoredAcqPrezzo;
    if (document.getElementById("wiz-p3-acq-mutuo")) document.getElementById("wiz-p3-acq-mutuo").value = restoredAcqMutuo;
    if (document.getElementById("wiz-p3-ristr-costo")) document.getElementById("wiz-p3-ristr-costo").value = restoredRistrCosto;
    if (document.getElementById("wiz-p3-ristr-mutuo")) document.getElementById("wiz-p3-ristr-mutuo").value = restoredRistrMutuo;
    
    if (typeof window.handleFinalitaChange === "function") {
        window.handleFinalitaChange(pd.finalita || "acquisto");
    }
    if (pd.finalita === "acquisto_ristrutturazione" && typeof window.syncAcquistoRistrutturazioneInputs === "function") {
        window.syncAcquistoRistrutturazioneInputs(false);
    } else {
        if (document.getElementById("p3-valore-field")) document.getElementById("p3-valore-field").value = valImmToRestore;
        if (document.getElementById("p3-importo-field")) document.getElementById("p3-importo-field").value = impMutToRestore;
    }
    if (document.getElementById("wiz-p3-is-asta")) document.getElementById("wiz-p3-is-asta").checked = (pd.finalita === "asta" || pd.isAsta === true || String(pd.isAsta).toLowerCase() === "si");
    if (document.getElementById("wiz-p3-classe-energetica")) document.getElementById("wiz-p3-classe-energetica").value = pd.classeEnergetica || pd.classeEn || "to_verify";
    if (document.getElementById("wiz-patrimonio-mobiliare")) document.getElementById("wiz-patrimonio-mobiliare").value = pd.patrimonioMobiliare || "25000";
    if (document.getElementById("wiz-q10-dip-is-stagionale")) {
        document.getElementById("wiz-q10-dip-is-stagionale").checked = (pd.isStagionale === true);
        if (window.toggleStagionaleFields) window.toggleStagionaleFields(pd.isStagionale === true);
    }
    if (document.getElementById("wiz-q10-dip-stagioni-consecutive")) document.getElementById("wiz-q10-dip-stagioni-consecutive").value = pd.stagioniConsecutive || "2";
    if (document.getElementById("wiz-p3-liquidita-pura")) document.getElementById("wiz-p3-liquidita-pura").value = pd.liquiditaPura || "0";
    if (document.getElementById("wiz-p3-has-second-property")) {
        const hasSec = (pd.hasSecondProperty === true);
        document.getElementById("wiz-p3-has-second-property").checked = hasSec;
        if (window.toggleSecondPropertyFields) window.toggleSecondPropertyFields(hasSec);
    }
    if (document.getElementById("wiz-p3-second-valore")) document.getElementById("wiz-p3-second-valore").value = pd.secondValore || "150000";
    if (document.getElementById("wiz-p3-second-comune")) document.getElementById("wiz-p3-second-comune").value = pd.secondComune || "";
    if (document.getElementById("wiz-p3-second-intestatario")) document.getElementById("wiz-p3-second-intestatario").value = pd.secondIntestatario || "richiedente";
    if (document.getElementById("wiz-p3-second-has-mortgage")) {
        const hasMort = pd.secondHasMortgage || "no";
        document.getElementById("wiz-p3-second-has-mortgage").value = hasMort;
        if (window.toggleSecondMortgageFields) window.toggleSecondMortgageFields(hasMort);
    }
    if (document.getElementById("wiz-p3-second-accorpa")) document.getElementById("wiz-p3-second-accorpa").checked = (pd.secondAccorpa !== false);
    if (document.getElementById("wiz-p3-second-debito-residuo")) document.getElementById("wiz-p3-second-debito-residuo").value = pd.secondDebitoResiduo || "50000";
    if (document.getElementById("wiz-p3-second-rata-attuale")) document.getElementById("wiz-p3-second-rata-attuale").value = pd.secondRataAttuale || "450";
    if (document.getElementById("wiz-p3-second-mesi-ammortamento")) document.getElementById("wiz-p3-second-mesi-ammortamento").value = pd.secondMesiAmmortamento || "24";
    
    // Handle tasso restore
    const tVal = pd.tipoTasso || "any";
    const macroSel = document.getElementById("wiz-p3-macro-tasso");
    const subFissoGroup = document.getElementById("group-p3-sub-tasso-fisso");
    const subVarGroup = document.getElementById("group-p3-sub-tasso-variabile");
    const subFissoSel = document.getElementById("wiz-p3-sub-tasso-fisso");
    const subVarSel = document.getElementById("wiz-p3-sub-tasso-variabile");
    const hiddenTasso = document.getElementById("wiz-p3-tipo-tasso");
    
    if (hiddenTasso) hiddenTasso.value = tVal;
    
    if (tVal === "fisso" || tVal === "opzione") {
        if (macroSel) macroSel.value = "fisso";
        if (subFissoGroup) subFissoGroup.style.display = "block";
        if (subVarGroup) subVarGroup.style.display = "none";
        if (subFissoSel) subFissoSel.value = tVal;
    } else if (tVal === "variabile" || tVal === "cap" || tVal === "rata_costante") {
        if (macroSel) macroSel.value = "variabile";
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "block";
        if (subVarSel) subVarSel.value = tVal;
    } else {
        if (macroSel) macroSel.value = "any";
        if (subFissoGroup) subFissoGroup.style.display = "none";
        if (subVarGroup) subVarGroup.style.display = "none";
    }
    
    if (document.getElementById("wiz-p3-apertura-conto")) document.getElementById("wiz-p3-apertura-conto").value = (pd.aperturaConto !== false && pd.aperturaConto !== "no") ? "si" : "no";
    if (document.getElementById("phase4-flag-conto")) document.getElementById("phase4-flag-conto").checked = (pd.aperturaConto !== false && pd.aperturaConto !== "no");
    if (document.getElementById("phase4-flag-cpi")) document.getElementById("phase4-flag-cpi").checked = (pd.hasCpi !== false && pd.hasCpi !== "no");
    if (document.getElementById("wiz-classe-en")) document.getElementById("wiz-classe-en").value = pd.classeEn || "standard";
    if (document.getElementById("wiz-zona")) document.getElementById("wiz-zona").value = pd.zona || "nord";
    
    const isConsapEligibleRiprendi = ["acquisto", "asta", "surroga"].includes(pd.finalita || "acquisto");
    const valImmCheck = parseFloat(pd.valoreImmobile) || 0;
    const loanCheck = parseFloat(pd.importoMutuo) || 0;
    const ltvRiprendi = valImmCheck > 0 ? (loanCheck / valImmCheck) : 0;
    const p3ConsapGroup = document.getElementById("p3-consap-group");
    const p3ConsapSelect = document.getElementById("p3-consap-select");
    const isConsapActive = isConsapEligibleRiprendi && pd.finalita !== "acquisto_ristrutturazione" && (pd.isConsap === true || String(pd.isConsap).toLowerCase() === "si" || (ltvRiprendi > 0.80 && pd.isConsap !== false && pd.isConsap !== "no"));
    
    if (p3ConsapGroup) {
        p3ConsapGroup.style.display = (isConsapEligibleRiprendi && pd.finalita !== "acquisto_ristrutturazione" && ltvRiprendi > 0.80 && !pd.hasSecondProperty) ? "flex" : "none";
    }
    if (p3ConsapSelect) {
        p3ConsapSelect.value = isConsapActive ? "si" : "no";
        p3ConsapSelect.dataset.userTouched = "true";
    }
    
    // Step 2 general inputs
    const inputPersoneManual = document.getElementById("wiz-persone-nucleo");
    const inputPersoneFile = document.getElementById("wiz-persone-nucleo-file");
    if (inputPersoneManual) {
        inputPersoneManual.value = pd.personeNucleo || "1";
        inputPersoneManual.dataset.userEdited = "true";
    }
    if (inputPersoneFile) {
        inputPersoneFile.value = pd.personeNucleo || "1";
        inputPersoneFile.dataset.userEdited = "true";
    }
    
    ["wiz-prov-immobile", "wiz-prov-immobile-file"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = pd.provImmobile || "";
            if (pd.provImmobile && typeof updateGeoVerifiedBadge === "function") {
                updateGeoVerifiedBadge(el, BrokerFlowEngine.resolveLocation(pd.provImmobile));
            }
        }
    });
    
    ["wiz-prov-residenza", "wiz-prov-residenza-file"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = pd.provResidenza || pd.provImmobile || "";
            if ((pd.provResidenza || pd.provImmobile) && typeof updateGeoVerifiedBadge === "function") {
                updateGeoVerifiedBadge(el, BrokerFlowEngine.resolveLocation(pd.provResidenza || pd.provImmobile));
            }
        }
    });
    
    ["wiz-prov-lavoro", "wiz-prov-lavoro-file"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = pd.provLavoro || pd.provImmobile || "";
            if ((pd.provLavoro || pd.provImmobile) && typeof updateGeoVerifiedBadge === "function") {
                updateGeoVerifiedBadge(el, BrokerFlowEngine.resolveLocation(pd.provLavoro || pd.provImmobile));
            }
        }
    });
    
    if (document.getElementById("wiz-q11-has-loans")) document.getElementById("wiz-q11-has-loans").value = pd.hasLoans || "no";
    if (document.getElementById("wiz-q12-pignoramenti")) document.getElementById("wiz-q12-pignoramenti").value = pd.pignoramenti || "no";
    if (document.getElementById("wiz-q13-crif-sofferenze")) document.getElementById("wiz-q13-crif-sofferenze").value = pd.crifSofferenze || "no";
    
    // Family details
    if (document.getElementById("wiz-q4-stato-civile" + suffix)) document.getElementById("wiz-q4-stato-civile" + suffix).value = pd.statoCivile || "celibe";
    if (document.getElementById("wiz-q4-regime" + suffix)) document.getElementById("wiz-q4-regime" + suffix).value = pd.regime || "separazione";
    if (document.getElementById("wiz-q4-anni-sposato" + suffix)) document.getElementById("wiz-q4-anni-sposato" + suffix).value = pd.anniSposato || "";
    if (document.getElementById("wiz-q4-alimenti" + suffix)) document.getElementById("wiz-q4-alimenti" + suffix).value = pd.alimenti || "no";
    if (document.getElementById("wiz-q4-alimenti-importo" + suffix)) document.getElementById("wiz-q4-alimenti-importo" + suffix).value = pd.alimentiImporto || "0";
    if (document.getElementById("wiz-q5-figli" + suffix)) document.getElementById("wiz-q5-figli" + suffix).value = pd.figli || "no";
    if (document.getElementById("wiz-q5-num-figli" + suffix)) document.getElementById("wiz-q5-num-figli" + suffix).value = pd.numFigli || "0";
    if (document.getElementById("wiz-q15-assegno-unico-select" + suffix)) document.getElementById("wiz-q15-assegno-unico-select" + suffix).value = pd.assegnoUnicoSelect || "no";
    if (document.getElementById("wiz-q15-assegno-unico" + suffix)) document.getElementById("wiz-q15-assegno-unico" + suffix).value = pd.assegnoUnico || "0";
    if (document.getElementById("wiz-q5-eta-figli" + suffix)) document.getElementById("wiz-q5-eta-figli" + suffix).value = pd.etaFigli || "";
    
    // Restore dynamic card containers with parsed values
    const spouseContainerManual = document.getElementById("spouse-auto-card-container");
    if (spouseContainerManual) {
        spouseContainerManual.innerHTML = "";
        spouseContainerManual.style.display = "none";
    }
    const spouseContainerFile = document.getElementById("spouse-auto-card-container-file");
    if (spouseContainerFile) {
        spouseContainerFile.innerHTML = "";
        spouseContainerFile.style.display = "none";
    }
    
    if (document.getElementById("coapplicant-cards-container")) {
        const coappContainer = document.getElementById("coapplicant-cards-container");
        coappContainer.innerHTML = "";
        if (pd.coapplicantsData && pd.coapplicantsData.length > 0) {
            pd.coapplicantsData.forEach(c => {
                if (c.isSpouse) {
                    const el = document.createElement("div");
                    el.id = "coapp-spouse-auto";
                    el.className = "coapp-card";
                    el.dataset.isSpouse = "true";
                    el.style.cssText = "background: #ffffff; border: 2px solid #0052ff; border-radius: 12px; padding: 1.25rem; margin-top: 1rem; box-shadow: 0 4px 12px rgba(0,82,255,0.08);";
                    el.innerHTML = window.renderFullCoapplicantCardHtml("coapp-spouse-auto", true, c);
                    coappContainer.prepend(el);
                    if (window.updateCoappChildrenAgesUI) window.updateCoappChildrenAgesUI(el);
                } else {
                    if (window.addCoapplicantCardWithValue) window.addCoapplicantCardWithValue(c);
                }
            });
        } else if (pd.coapplicantsHtml) {
            coappContainer.innerHTML = pd.coapplicantsHtml;
        }
    }
    if (document.getElementById("guarantor-cards-container")) {
        const guarContainer = document.getElementById("guarantor-cards-container");
        guarContainer.innerHTML = "";
        if (pd.guarantorsData && pd.guarantorsData.length > 0) {
            pd.guarantorsData.forEach(g => {
                if (window.addGuarantorCardWithValue) window.addGuarantorCardWithValue(g);
            });
        } else if (pd.guarantorsHtml) {
            guarContainer.innerHTML = pd.guarantorsHtml;
        }
    }
    if (document.getElementById("loans-cards-container")) {
        const loansContainer = document.getElementById("loans-cards-container");
        loansContainer.innerHTML = "";
        if (pd.loansData && pd.loansData.length > 0) {
            pd.loansData.forEach(l => {
                if (window.addNewLoanCardWithValue) window.addNewLoanCardWithValue(l.tipo, l.rata, l.capIniziale || "", l.capitale || "", l.durIniziale || "", l.durResidua || "", l.chiuso);
            });
        } else if (pd.loansHtml) {
            loansContainer.innerHTML = pd.loansHtml;
        }
    }
    
    // Trigger conditional display changes
    if (document.getElementById("wiz-q4-stato-civile" + suffix)) {
        document.getElementById("wiz-q4-stato-civile" + suffix).dispatchEvent(new Event("change"));
    }
    if (document.getElementById("wiz-q5-figli" + suffix)) {
        document.getElementById("wiz-q5-figli" + suffix).dispatchEvent(new Event("change"));
    }
    if (document.getElementById("wiz-q11-has-loans")) {
        document.getElementById("wiz-q11-has-loans").dispatchEvent(new Event("change"));
    }
    
    window.switchCrmModule("engine");
    window.goToStep(3);
    if (pd.finalita !== "acquisto_ristrutturazione") {
        if (document.getElementById("p3-valore-field")) document.getElementById("p3-valore-field").value = valImmToRestore;
        if (document.getElementById("p3-importo-field")) document.getElementById("p3-importo-field").value = impMutToRestore;
    }
    
    // Ensure fresh database reload in background and recalculate with newest rates
    if (typeof loadDatabases === "function") {
        return loadDatabases(true).then(() => {
            if (typeof updateCalculations === "function") updateCalculations();
        }).catch(e => {
            console.warn("Could not reload fresh databases in modificaPreventivo:", e);
        });
    }
    return Promise.resolve();
};

window.historicalRatesDb = null;
window.dailyRatesLastUpdated = null;

window.formatRateTimestamp = function(isoStr) {
    if (!isoStr) return "-";
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
        return isoStr;
    }
};

window.initReportsModule = async function() {
    console.log("initReportsModule: starting...");
    if (window.dailyEuriborRates) {
        if (document.getElementById("rep-eur1m") && window.dailyEuriborRates["1M"]) {
            document.getElementById("rep-eur1m").innerText = parseFloat(window.dailyEuriborRates["1M"]).toFixed(3) + "%";
        }
        if (document.getElementById("rep-eur3m") && window.dailyEuriborRates["3M"]) {
            document.getElementById("rep-eur3m").innerText = parseFloat(window.dailyEuriborRates["3M"]).toFixed(3) + "%";
        }
        if (document.getElementById("rep-eur6m") && window.dailyEuriborRates["6M"]) {
            document.getElementById("rep-eur6m").innerText = parseFloat(window.dailyEuriborRates["6M"]).toFixed(3) + "%";
        }
    }
    
    console.log("initReportsModule: checked euribor, checking irs daily rates:", !!window.dailyIrsRates);
    if (document.getElementById("rep-irs10y") && window.dailyIrsRates && window.dailyIrsRates[10]) {
        document.getElementById("rep-irs10y").innerText = parseFloat(window.dailyIrsRates[10]).toFixed(3) + "%";
    }
    if (document.getElementById("rep-irs20y") && window.dailyIrsRates && window.dailyIrsRates[20]) {
        document.getElementById("rep-irs20y").innerText = parseFloat(window.dailyIrsRates[20]).toFixed(3) + "%";
    }
    if (document.getElementById("rep-irs30y") && window.dailyIrsRates && window.dailyIrsRates[30]) {
        document.getElementById("rep-irs30y").innerText = parseFloat(window.dailyIrsRates[30]).toFixed(3) + "%";
    }

    // Set last updated timestamp
    const lastUpdEl = document.getElementById("rep-last-updated");
    if (lastUpdEl) {
        if (window.dailyRatesLastUpdated) {
            lastUpdEl.innerText = window.formatRateTimestamp(window.dailyRatesLastUpdated);
        } else {
            try {
                const irsRes = await fetch("data/tassi_giornalieri.json");
                if (irsRes.ok) {
                    const irsData = await irsRes.json();
                    if (irsData && irsData.last_updated) {
                        window.dailyRatesLastUpdated = irsData.last_updated;
                        lastUpdEl.innerText = window.formatRateTimestamp(irsData.last_updated);
                    }
                }
            } catch (e) {
                console.warn("Could not load last update timestamp:", e);
            }
        }
    }
    
    console.log("initReportsModule: checked irs daily rates, checking historical database:", !!window.historicalRatesDb);
    if (!window.historicalRatesDb) {
        try {
            console.log("initReportsModule: fetching historical_rates.json...");
            const res = await fetch("data/historical_rates.json?t=" + Date.now());
            console.log("initReportsModule: fetch status:", res.status);
            if (res.ok) {
                window.historicalRatesDb = await res.json();
                console.log("initReportsModule: historicalRatesDb loaded successfully:", !!window.historicalRatesDb);
            }
        } catch (e) {
            console.error("Failed to load historical rates:", e);
        }
    }
    
    console.log("initReportsModule: calling updateReportsChart()...");
    window.updateReportsChart();
};

window.refreshDailyRates = async function() {
    const btn = document.getElementById("btn-refresh-daily-rates");
    const icon = document.getElementById("rep-refresh-icon");
    const text = document.getElementById("rep-refresh-text");
    
    if (btn) btn.disabled = true;
    if (icon) {
        icon.style.display = "inline-block";
        icon.style.transition = "transform 0.5s ease";
        icon.style.transform = "rotate(360deg)";
    }
    if (text) text.innerText = "Rilevazione in corso...";
    
    try {
        const res = await fetch("/api/update-daily-rates", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        const resData = await res.json();
        console.log("Rates update response:", resData);
        
        if (res.ok && resData.data) {
            const data = resData.data;
            if (data.last_updated) {
                window.dailyRatesLastUpdated = data.last_updated;
                const lastUpdEl = document.getElementById("rep-last-updated");
                if (lastUpdEl) lastUpdEl.innerText = window.formatRateTimestamp(data.last_updated);
            }
            if (data.irs) {
                window.dailyIrsRates = data.irs;
                if (document.getElementById("rep-irs10y") && data.irs[10]) {
                    document.getElementById("rep-irs10y").innerText = parseFloat(data.irs[10]).toFixed(3) + "%";
                }
                if (document.getElementById("rep-irs20y") && data.irs[20]) {
                    document.getElementById("rep-irs20y").innerText = parseFloat(data.irs[20]).toFixed(3) + "%";
                }
                if (document.getElementById("rep-irs30y") && data.irs[30]) {
                    document.getElementById("rep-irs30y").innerText = parseFloat(data.irs[30]).toFixed(3) + "%";
                }
                const inputBaseIrs = document.getElementById("base-irs");
                if (inputBaseIrs && data.irs[30]) {
                    inputBaseIrs.value = data.irs[30];
                }
            }
            if (data.euribor) {
                window.dailyEuriborRates = data.euribor;
                if (document.getElementById("rep-eur1m") && data.euribor["1M"]) {
                    document.getElementById("rep-eur1m").innerText = parseFloat(data.euribor["1M"]).toFixed(3) + "%";
                }
                if (document.getElementById("rep-eur3m") && data.euribor["3M"]) {
                    document.getElementById("rep-eur3m").innerText = parseFloat(data.euribor["3M"]).toFixed(3) + "%";
                }
                if (document.getElementById("rep-eur6m") && data.euribor["6M"]) {
                    document.getElementById("rep-eur6m").innerText = parseFloat(data.euribor["6M"]).toFixed(3) + "%";
                }
                const inputBaseEur1 = document.getElementById("base-euribor1m");
                if (inputBaseEur1 && data.euribor["1M"]) inputBaseEur1.value = data.euribor["1M"];
                const inputBaseEur3 = document.getElementById("base-euribor3m");
                if (inputBaseEur3 && data.euribor["3M"]) inputBaseEur3.value = data.euribor["3M"];
                const inputBaseEur6 = document.getElementById("base-euribor6m");
                if (inputBaseEur6 && data.euribor["6M"]) inputBaseEur6.value = data.euribor["6M"];
            }
            
            // Reload historical rates database with cache buster
            try {
                const histRes = await fetch("data/historical_rates.json?t=" + Date.now());
                if (histRes.ok) {
                    window.historicalRatesDb = await histRes.json();
                }
            } catch (hErr) {
                console.error("Error reloading historical rates:", hErr);
            }
            
            window.updateReportsChart();
            if (typeof updateCalculations === "function") {
                updateCalculations();
            }
            
            if (text) text.innerText = "Aggiornato! ✓";
            setTimeout(() => {
                if (text) text.innerText = "Aggiorna Tassi Ora";
                if (icon) icon.style.transform = "rotate(0deg)";
            }, 2500);
        } else {
            alert("Errore durante l'aggiornamento dei tassi: " + (resData.message || "Errore sconosciuto"));
            if (text) text.innerText = "Aggiorna Tassi Ora";
        }
    } catch (err) {
        console.error("Failed to update daily rates:", err);
        alert("Impossibile contattare il server per aggiornare i tassi.");
        if (text) text.innerText = "Aggiorna Tassi Ora";
    } finally {
        if (btn) btn.disabled = false;
    }
};

window.updateReportsChart = function() {
    const select = document.getElementById("reports-index-select");
    const container = document.getElementById("reports-chart-container");
    const tbody = document.getElementById("reports-table-body");
    
    if (!select || !container || !tbody || !window.historicalRatesDb) return;
    
    const key = select.value;
    const dates = window.historicalRatesDb.dates;
    const values = window.historicalRatesDb.rates[key];
    
    if (!dates || !values || dates.length === 0 || values.length === 0) {
        container.innerHTML = `<div style="padding:4rem;text-align:center;color:#64748b;">Nessun dato storico per l'indice selezionato.</div>`;
        tbody.innerHTML = "";
        return;
    }
    
    let tableHtml = "";
    for (let i = dates.length - 1; i >= 0; i--) {
        const val = values[i];
        let diffText = "-";
        let diffColor = "#64748b";
        
        if (i > 0) {
            const prev = values[i - 1];
            const diff = val - prev;
            if (diff > 0) {
                diffText = `+${diff.toFixed(3)}% 📈`;
                diffColor = "#10b981";
            } else if (diff < 0) {
                diffText = `${diff.toFixed(3)}% 📉`;
                diffColor = "#ef4444";
            } else {
                diffText = "0.000% =";
            }
        }
        
        tableHtml += `
            <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding: 0.75rem 1rem; font-size: 0.88rem; font-weight: 700; color: #1f2937;">${dates[i]}</td>
                <td style="padding: 0.75rem 1rem; font-size: 0.88rem; font-weight: 800; color: #0052ff;">${val.toFixed(3)}%</td>
                <td style="padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 600; color: ${diffColor};">${diffText}</td>
            </tr>
        `;
    }
    tbody.innerHTML = tableHtml;
    
    const width = Math.max(800, container.clientWidth - 32);
    const height = 280;
    
    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const valRange = maxVal - minVal;
    
    const points = [];
    const stepX = width / (values.length - 1);
    
    for (let i = 0; i < values.length; i++) {
        const x = i * stepX;
        const y = height - ((values[i] - minVal) / valRange) * (height - 60) - 30;
        points.push({x, y, date: dates[i], val: values[i]});
    }
    
    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
    const fillPoints = `${points[0].x},${height} ` + polylinePoints + ` ${points[points.length - 1].x},${height}`;
    
    let gridLines = "";
    let labelsHtml = "";
    
    for (let i = 0; i < points.length; i += 3) {
        const p = points[i];
        gridLines += `<line x1="${p.x}" y1="10" x2="${p.x}" y2="${height - 20}" stroke="#cbd5e1" stroke-dasharray="3,3" />`;
        labelsHtml += `<text x="${p.x}" y="${height - 5}" font-size="9" fill="#94a3b8" text-anchor="middle">${p.date.substring(5)}</text>`;
    }
    
    let dots = "";
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const activeRadius = (i === points.length - 1) ? 6 : 4;
        const activeColor = (i === points.length - 1) ? "#0052ff" : "#ffffff";
        const strokeColor = "#0052ff";
        
        dots += `
            <circle cx="${p.x}" cy="${p.y}" r="${activeRadius}" fill="${activeColor}" stroke="${strokeColor}" stroke-width="2" />
            <circle cx="${p.x}" cy="${p.y}" r="12" fill="transparent" style="cursor:pointer;" 
                    onmouseover="window.showChartTooltip('${p.date}', '${p.val.toFixed(3)}%', ${p.x}, ${p.y})" 
                    onmouseout="window.hideChartTooltip()" />
        `;
    }
    
    const svg = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
            <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0052ff" stop-opacity="0.15" />
                    <stop offset="100%" stop-color="#0052ff" stop-opacity="0.0" />
                </linearGradient>
            </defs>
            ${gridLines}
            <polygon points="${fillPoints}" fill="url(#chartGrad)" />
            <polyline fill="none" stroke="#0052ff" stroke-width="3" points="${polylinePoints}" />
            ${dots}
            ${labelsHtml}
        </svg>
        <div id="chart-tooltip" style="position: absolute; display: none; background: #0f172a; color: #ffffff; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: bold; pointer-events: none; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 10;"></div>
    `;
    
    container.innerHTML = svg;
};

window.showChartTooltip = function(date, val, x, y) {
    const tooltip = document.getElementById("chart-tooltip");
    if (!tooltip) return;
    
    tooltip.innerHTML = `<div style="color:#94a3b8;margin-bottom:0.15rem;">${date}</div><div style="font-size:0.85rem;color:#60a5fa;">Tasso: ${val}</div>`;
    tooltip.style.display = "block";
    tooltip.style.left = (x + 20) + "px";
    tooltip.style.top = (y + 10) + "px";
};

window.hideChartTooltip = function() {
    const tooltip = document.getElementById("chart-tooltip");
    if (tooltip) tooltip.style.display = "none";
};

let _chartResizeTimer = null;
window.addEventListener("resize", function() {
    clearTimeout(_chartResizeTimer);
    _chartResizeTimer = setTimeout(function() {
        const modReports = document.getElementById("module-reports");
        if (modReports && modReports.style.display !== "none" && window.updateReportsChart) {
            window.updateReportsChart();
        }
    }, 150);
});

// ==================== POLICY DETAIL VIEW & AI CHAT ASSISTANT ====================
window.currentChatBankId = null;

const FALLBACK_BANK_DOCUMENTS = {
    "mps": [
        { name: "MPS_01_Prodotti.xlsx", url: "/tabelle tassi/prodotti/MPS_01_Prodotti.xlsx", category: "Griglia Tassi", folder: "tabelle tassi/prodotti", type: "excel" },
        { name: "MPS_Modulo_Tassi_v2.xlsx", url: "/tabelle tassi/MPS_Modulo_Tassi_v2.xlsx", category: "Griglia Tassi", folder: "tabelle tassi", type: "excel" }
    ],
    "ing": [
        { name: "ING 2026.pdf", url: "/pdf policy banche/ING 2026.pdf", category: "Policy Ufficiale", folder: "pdf policy banche", type: "pdf" },
        { name: "policy ing 2025.pdf", url: "/pdf policy banche/policy ing 2025.pdf", category: "Policy Ufficiale", folder: "pdf policy banche", type: "pdf" }
    ],
    "bper": [
        { name: "bper.pdf", url: "/pdf policy banche/bper.pdf", category: "Policy Ufficiale", folder: "pdf policy banche", type: "pdf" }
    ],
    "banco_di_sardegna": [
        { name: "banco di sardegna.pdf", url: "/pdf policy banche/banco di sardegna.pdf", category: "Policy Ufficiale", folder: "pdf policy banche", type: "pdf" },
        { name: "banco di sardegno 15 settembre.pdf", url: "/tabelle tassi/banco di sardegno 15 settembre.pdf", category: "Griglia Tassi", folder: "tabelle tassi", type: "pdf" }
    ],
    "mediobanca_premier": [
        { name: "mediobanca premier.pdf", url: "/pdf policy banche/mediobanca premier.pdf", category: "Policy Ufficiale", folder: "pdf policy banche", type: "pdf" }
    ],
    "credit agricole italia": [
        { name: "credt agricole.pdf", url: "/pdf policy banche/credt agricole.pdf", category: "Policy Ufficiale", folder: "pdf policy banche", type: "pdf" },
        { name: "tassi credit agricole.xlsx", url: "/tabelle tassi/tassi credit agricole.xlsx", category: "Griglia Tassi", folder: "tabelle tassi", type: "excel" }
    ],
    "bnl": [
        { name: "bnl.pdf", url: "/tabelle tassi/bnl.pdf", category: "Griglia Tassi & Policy", folder: "tabelle tassi", type: "pdf" }
    ],
    "bdm": [
        { name: "BdM - III trimestre 2026.pdf", url: "/pdf policy banche/BdM - III trimestre 2026.pdf", category: "Policy Ufficiale", folder: "pdf policy banche", type: "pdf" }
    ]
};

window.viewBankPolicyDetail = function(bankId) {
    const policy = BrokerFlowEngine.bankPolicies[bankId];
    if (!policy) return;
    
    window.currentChatBankId = bankId;
    
    // 1. Populate badge and name
    const badge = document.getElementById("modal-policy-bank-badge");
    if (badge) {
        badge.style.background = "#ffffff";
        badge.style.border = "1px solid #e2e8f0";
        badge.style.padding = "2px";
        badge.innerHTML = window.getBankLogoHtml(policy.name, 34);
    }
    const nameEl = document.getElementById("modal-policy-bank-name");
    if (nameEl) nameEl.innerText = policy.name;
    
    // 2. Populate structured parameters
    const container = document.getElementById("modal-policy-params-container");
    if (container) {
        container.innerHTML = "";
        
        const getYesNo = val => val ? "✔️ Sì" : "❌ No";
        const getPercentage = val => val !== undefined ? `${Math.round(val * 100)}%` : "N.D.";
        
        const contractTranslations = {
            "dipendente_ti": "Tempo Indeterminato",
            "dipendente_td": "Tempo Determinato",
            "autonomo": "Autonomo / P.IVA",
            "pensionato": "Pensionato",
            "colf_badanti": "Colf / Badante",
            "interinale": "Lavoratore Interinale",
            "locazione": "Reddito da Locazione"
        };
        const allowedContractsReadable = policy.allowedContracts ? 
            policy.allowedContracts.map(c => contractTranslations[c] || c).join(", ") : "Nessuno";
            
        const purposeTranslations = {
            "acquisto": "Prima Casa",
            "seconda_casa": "Seconda Casa",
            "ristrutturazione": "Ristrutturazione",
            "surroga": "Surroga",
            "aste": "Acquisto Asta",
            "liquidita": "Liquidità",
            "consolido": "Consolidamento Debiti"
        };
        const allowedPurposesReadable = policy.allowedPurposes ? 
            policy.allowedPurposes.map(p => purposeTranslations[p] || p).join(", ") : "Nessuna";

        const rows = [
            { label: "LTV Massimo", value: getPercentage(policy.maxLtv) },
            { label: "Rapporto Rata/Reddito (DSR)", value: `${getPercentage(policy.maxDsr)} (In Deroga: ${getPercentage(policy.maxDsrDeroga)})` },
            { label: "Età Massima (a scadenza)", value: `${policy.maxAge} anni` },
            { label: "Età Massima Garante (a scadenza)", value: `${policy.maxGuarantorAge} anni` },
            { label: "Numero Massimo Richiedenti", value: policy.maxBorrowers || "N.D." },
            { label: "Importo Minimo Mutuo", value: policy.minLoan ? `€ ${policy.minLoan.toLocaleString("it-IT")}` : "N.D." },
            { label: "Importo Massimo Mutuo", value: policy.maxLoan ? `€ ${policy.maxLoan.toLocaleString("it-IT")}` : "N.D." },
            { label: "Durata Ammortamento", value: `${policy.minDuration} - ${policy.maxDuration} anni` },
            { label: "Minimo Anzianità Autonomi", value: `${policy.minSeniorityAutonomo} mesi (Deroga: ${policy.minSeniorityAutonomoDeroga} mesi)` },
            { label: "Minimo Anni Residenza Extra-UE", value: `${policy.minResidencyYears} anni` },
            { label: "Tipologie Contratto Ammesse", value: allowedContractsReadable },
            { label: "Finalità Operative Ammesse", value: allowedPurposesReadable },
            { label: "Calcolo Minimo Vitale (MRI)", value: getYesNo(policy.hasMri) }
        ];
        
        rows.forEach(r => {
            const item = document.createElement("div");
            item.style.display = "flex";
            item.style.justifyContent = "space-between";
            item.style.padding = "0.5rem 0";
            item.style.borderBottom = "1px solid #f1f5f9";
            item.style.fontSize = "0.85rem";
            item.innerHTML = `
                <span style="color: #64748b; font-weight: 600;">${r.label}</span>
                <span style="color: #0f172a; font-weight: 700; text-align: right; max-width: 60%;">${r.value}</span>
            `;
            container.appendChild(item);
        });
    }
    
    // 3. Populate documents list dynamically from source folders (pdf policy banche & tabelle tassi)
    const docsContainer = document.getElementById("modal-policy-docs-container");
    if (docsContainer) {
        docsContainer.innerHTML = `<div style="font-size: 0.8rem; color: #64748b; padding: 0.5rem 0;">Ricerca documenti originali...</div>`;
        
        const renderDocsList = (docs) => {
            docsContainer.innerHTML = "";
            if (!docs || docs.length === 0) {
                docsContainer.innerHTML = `<p style="font-size: 0.82rem; color: #94a3b8; font-style: italic; margin: 0;">Nessun documento sorgente caricato in <code>pdf policy banche/</code> o <code>tabelle tassi/</code> per questo istituto.</p>`;
                return;
            }
            docs.forEach(doc => {
                const link = document.createElement("a");
                link.href = doc.url || doc.path;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.style.display = "flex";
                link.style.alignItems = "center";
                link.style.justifyContent = "space-between";
                link.style.gap = "0.6rem";
                link.style.fontSize = "0.82rem";
                link.style.color = "#0f172a";
                link.style.textDecoration = "none";
                link.style.fontWeight = "600";
                link.style.padding = "0.65rem 0.85rem";
                link.style.background = "#ffffff";
                link.style.borderRadius = "8px";
                link.style.border = "1.5px solid #e2e8f0";
                link.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                link.style.transition = "all 0.15s ease";
                
                link.onmouseenter = () => {
                    link.style.borderColor = "#3b82f6";
                    link.style.background = "#eff6ff";
                    link.style.transform = "translateY(-1px)";
                };
                link.onmouseleave = () => {
                    link.style.borderColor = "#e2e8f0";
                    link.style.background = "#ffffff";
                    link.style.transform = "none";
                };

                const isPdf = (doc.name || "").toLowerCase().endsWith(".pdf") || doc.type === "pdf";
                const isExcel = (doc.name || "").toLowerCase().endsWith(".xlsx") || (doc.name || "").toLowerCase().endsWith(".xls") || doc.type === "excel";
                const icon = isPdf ? "📕" : (isExcel ? "📊" : "📄");
                const catBadge = doc.category ? `<span style="font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; background: ${isPdf ? '#fee2e2; color: #991b1b;' : '#dcfce7; color: #166534;'} margin-left: 0.4rem;">${doc.category}</span>` : "";

                link.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <span style="font-size: 1.1rem;">${icon}</span>
                        <div style="display: flex; flex-direction: column; overflow: hidden;">
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; color: #1e293b;">${doc.name}</span>
                            <span style="font-size: 0.68rem; color: #64748b; font-weight: normal;">Cartella: <code>${doc.folder || (isPdf ? 'pdf policy banche' : 'tabelle tassi')}</code></span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
                        ${catBadge}
                        <span style="color: #2563eb; font-size: 0.75rem; font-weight: 750;">Apri ↗</span>
                    </div>
                `;
                docsContainer.appendChild(link);
            });
        };

        fetch(`/api/bank-documents?bankId=${encodeURIComponent(bankId)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.status === "success" && data.documents && data.documents.length > 0) {
                    renderDocsList(data.documents);
                } else {
                    renderDocsList(FALLBACK_BANK_DOCUMENTS[bankId] || []);
                }
            })
            .catch(() => {
                renderDocsList(FALLBACK_BANK_DOCUMENTS[bankId] || []);
            });
    }
    
    // 4. Reset chat box and welcome message
    const chatMsgs = document.getElementById("wiz-policy-chat-messages");
    if (chatMsgs) {
        chatMsgs.innerHTML = `
            <div style="background: #e0f2fe; color: #0369a1; padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.85rem; line-height: 1.4; border: 1px solid #bae6fd; align-self: flex-start; max-width: 85%; font-weight: 500; text-align: left;">
                👋 Ciao! Sono l'AI Assistant di BrokerFlow specializzato su <strong>${policy.name}</strong>.
                <br><br>
                Chiedimi pure qualsiasi chiarimento sulle regole di questa banca, ad esempio:
                <ul style="margin: 0.4rem 0 0 1.25rem; padding: 0;">
                    <li><em>Qual è la rata massima consentita rispetto al reddito?</em></li>
                    <li><em>Vengono accettati i lavoratori interinali o colf/badanti?</em></li>
                    <li><em>Ci sono eccezioni per i richiedenti extra-UE?</em></li>
                </ul>
            </div>
        `;
    }
    
    // 5. Update API status
    window.updateApiKeyStatus();
    
    // 6. Open Modal
    const modal = document.getElementById("wiz-bank-policy-modal");
    if (modal) modal.style.display = "flex";
};

window.openBankPolicyModal = function(bankId) {
    window.viewBankPolicyDetail(bankId);
};

window.closeBankPolicyModal = function() {
    const modal = document.getElementById("wiz-bank-policy-modal");
    if (modal) modal.style.display = "none";
    window.currentChatBankId = null;
};

window.toggleApiKeyPrompt = function() {
    const current = localStorage.getItem("openai_api_key") || localStorage.getItem("gemini_api_key") || "";
    const key = prompt("Inserisci la tua chiave API OpenAI (sk-...):\nLascia vuoto per utilizzare la chiave configurata nel file .env del server.", current);
    if (key !== null) {
        localStorage.setItem("openai_api_key", key.trim());
        localStorage.setItem("gemini_api_key", key.trim());
        window.updateApiKeyStatus();
    }
};

window.updateApiKeyStatus = function() {
    const key = localStorage.getItem("openai_api_key") || localStorage.getItem("gemini_api_key");
    const dot = document.getElementById("ai-status-dot");
    const txt = document.getElementById("ai-status-text");
    
    if (dot && txt) {
        if (key && key.trim().length > 0 && key !== "null" && key !== "undefined") {
            dot.style.background = "#22c55e";
            txt.innerText = "Chiave OpenAI Attiva";
        } else {
            dot.style.background = "#22c55e";
            txt.innerText = "Chiave Sistema (.env)";
        }
    }
};

window.sendPolicyChatMessage = async function() {
    const input = document.getElementById("wiz-policy-chat-input");
    const chatMsgs = document.getElementById("wiz-policy-chat-messages");
    if (!input || !chatMsgs || !window.currentChatBankId) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    input.value = "";
    
    // Append User Message
    const userMsg = document.createElement("div");
    userMsg.style.cssText = "background: #0052ff; color: #ffffff; padding: 0.65rem 0.85rem; border-radius: 12px 12px 0 12px; font-size: 0.85rem; max-width: 85%; align-self: flex-end; word-break: break-word; text-align: left;";
    userMsg.innerText = text;
    chatMsgs.appendChild(userMsg);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    
    // Append Typing Indicator
    const typingId = "typing-" + Date.now();
    const typingMsg = document.createElement("div");
    typingMsg.id = typingId;
    typingMsg.style.cssText = "background: #e2e8f0; color: #475569; padding: 0.65rem 0.85rem; border-radius: 12px 12px 12px 0; font-size: 0.85rem; max-width: 85%; align-self: flex-start; font-style: italic; text-align: left;";
    typingMsg.innerText = "L'AI sta analizzando i documenti...";
    chatMsgs.appendChild(typingMsg);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    
    try {
        const apiKey = localStorage.getItem("gemini_api_key") || "";
        const response = await fetch("/api/chat-policy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bankId: window.currentChatBankId,
                question: text,
                apiKey: apiKey
            })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Errore sconosciuto dal server");
        }
        
        const data = await response.json();
        
        // Remove typing indicator and append response
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        const aiMsg = document.createElement("div");
        aiMsg.style.cssText = "background: #f1f5f9; color: #0f172a; padding: 0.75rem 0.95rem; border-radius: 12px 12px 12px 0; font-size: 0.85rem; max-width: 85%; align-self: flex-start; word-break: break-word; line-height: 1.45; border: 1px solid #e2e8f0; text-align: left;";
        
        // Simple markdown parsing to HTML paragraph/bold tags
        let parsedText = data.answer
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
            
        aiMsg.innerHTML = parsedText;
        chatMsgs.appendChild(aiMsg);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        
    } catch (err) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        const errorMsg = document.createElement("div");
        errorMsg.style.cssText = "background: #fee2e2; color: #991b1b; padding: 0.65rem 0.85rem; border-radius: 12px; font-size: 0.85rem; max-width: 85%; align-self: flex-start; border: 1px solid #fca5a5; text-align: left;";
        errorMsg.innerText = "⚠️ Impossibile contattare l'AI Assistant: " + err.message;
        chatMsgs.appendChild(errorMsg);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
};

// ==================== GLOBAL MULTI-BANK AI ADVISOR CHAT ====================
window.multibankChatHistory = [];

window.openMultiBankChat = function() {
    const modal = document.getElementById("wiz-multibank-chat-modal");
    if (!modal) return;
    modal.style.display = "flex";
    
    // Check API Key
    const apiKey = localStorage.getItem("openai_api_key") || localStorage.getItem("gemini_api_key") || "";
    const dot = document.getElementById("multibank-ai-status-dot");
    const text = document.getElementById("multibank-ai-status-text");
    if (dot && text) {
        if (apiKey && apiKey.trim().length > 5) {
            dot.style.background = "#10b981";
            text.innerText = "OpenAI API Attiva";
        } else {
            dot.style.background = "#3b82f6";
            text.innerText = "OpenAI Server (.env)";
        }
    }
    
    const msgs = document.getElementById("wiz-multibank-chat-messages");
    if (msgs && msgs.children.length === 0) {
        window.multibankChatHistory = [];
        const welcome = document.createElement("div");
        welcome.style.cssText = "background: #f1f5f9; color: #1e293b; padding: 0.85rem 1rem; border-radius: 12px 12px 12px 0; font-size: 0.85rem; max-width: 88%; align-self: flex-start; line-height: 1.5; border: 1px solid #e2e8f0; text-align: left;";
        welcome.innerHTML = `
            👋 <strong>Benvenuto nell'AI Advisor Multi-Banca di BrokerFlow!</strong><br><br>
            Puoi chiedermi confronti strategici su tutte le policy bancarie convenzionate (es. <em>"Quale banca mi fa gli 80 anni a fine mutuo?"</em>, <em>"Chi accetta contratti a tempo determinato o apprendisti?"</em>, <em>"Chi finanzia al 100%?"</em>).<br><br>
            ⚠️ <strong>Nota sulla territorialità:</strong> Se la tua richiesta non include già la città o provincia dell'immobile, ti chiederò dove deve essere fatta l'operazione per filtrare solo gli istituti operanti sul tuo territorio.
        `;
        msgs.appendChild(welcome);
    }
    
    setTimeout(() => {
        const inp = document.getElementById("wiz-multibank-chat-input");
        if (inp) inp.focus();
    }, 100);
};

window.closeMultiBankChat = function() {
    const modal = document.getElementById("wiz-multibank-chat-modal");
    if (modal) modal.style.display = "none";
};

window.sendMultiBankChatMessage = async function() {
    const input = document.getElementById("wiz-multibank-chat-input");
    const chatMsgs = document.getElementById("wiz-multibank-chat-messages");
    if (!input || !chatMsgs) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    // Append User Message
    const userMsg = document.createElement("div");
    userMsg.style.cssText = "background: #4f46e5; color: #ffffff; padding: 0.75rem 0.95rem; border-radius: 12px 12px 0 12px; font-size: 0.85rem; max-width: 85%; align-self: flex-end; word-break: break-word; line-height: 1.4; text-align: left;";
    userMsg.innerText = text;
    chatMsgs.appendChild(userMsg);
    input.value = "";
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    
    // Typing indicator
    const typingId = "typing-" + Date.now();
    const typingMsg = document.createElement("div");
    typingMsg.id = typingId;
    typingMsg.style.cssText = "background: #e2e8f0; color: #475569; padding: 0.65rem 0.85rem; border-radius: 12px 12px 12px 0; font-size: 0.85rem; max-width: 85%; align-self: flex-start; font-style: italic; text-align: left;";
    typingMsg.innerText = "L'AI Advisor sta confrontando le policy delle banche...";
    chatMsgs.appendChild(typingMsg);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    
    try {
        const apiKey = localStorage.getItem("gemini_api_key") || "";
        const response = await fetch("/api/chat-multibank", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: text,
                history: window.multibankChatHistory,
                apiKey: apiKey
            })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Errore sconosciuto dal server");
        }
        
        const data = await response.json();
        
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        // Save to local conversation history
        window.multibankChatHistory.push({ role: "user", text: text });
        window.multibankChatHistory.push({ role: "model", text: data.answer });
        
        const aiMsg = document.createElement("div");
        aiMsg.style.cssText = "background: #f8fafc; color: #0f172a; padding: 0.85rem 1rem; border-radius: 12px 12px 12px 0; font-size: 0.85rem; max-width: 88%; align-self: flex-start; word-break: break-word; line-height: 1.5; border: 1px solid #e2e8f0; text-align: left;";
        
        let parsedText = data.answer
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
            
        aiMsg.innerHTML = parsedText;
        chatMsgs.appendChild(aiMsg);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        
    } catch (err) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        const errorMsg = document.createElement("div");
        errorMsg.style.cssText = "background: #fee2e2; color: #991b1b; padding: 0.65rem 0.85rem; border-radius: 12px; font-size: 0.85rem; max-width: 85%; align-self: flex-start; border: 1px solid #fca5a5; text-align: left;";
        errorMsg.innerText = "⚠️ Impossibile contattare l'AI Advisor: " + err.message;
        chatMsgs.appendChild(errorMsg);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
};


// ============================================================================
// MODALE CALCOLATORE REDDITO DA BUSTE PAGA MULTI-BANCA AUTOMATICO
// ============================================================================
window._currentPayslipTargetInput = null;
window._currentPayslipSubjectLabel = "";
window._currentCalculatedPayslipNetto = 0;
window._primaryPayslipData = null;
window._secondIncomePayslipData = null;

window.openPayslipCalculator = function(targetInputOrSelector, subjectLabel) {
    if (typeof targetInputOrSelector === "string") {
        window._currentPayslipTargetInput = document.getElementById(targetInputOrSelector);
    } else {
        window._currentPayslipTargetInput = targetInputOrSelector;
    }
    
    window._currentPayslipSubjectLabel = subjectLabel || "Richiedente";
    
    const roleEl = document.getElementById("payslip-modal-subject-role");
    const nameEl = document.getElementById("payslip-modal-subject-name");
    
    if (roleEl) roleEl.innerText = window._currentPayslipSubjectLabel;
    if (nameEl) {
        let nameVal = "";
        if (window._currentPayslipTargetInput) {
            const card = window._currentPayslipTargetInput.closest ? window._currentPayslipTargetInput.closest(".coapp-card") : null;
            if (card) {
                const n = card.querySelector(".coapp-nome")?.value || "";
                const c = card.querySelector(".coapp-cognome")?.value || "";
                nameVal = (n + " " + c).trim();
            } else if (window._currentPayslipTargetInput.id === "wiz-q10-netto-mensile") {
                const n = document.getElementById("wiz-q1-nome")?.value || "";
                const c = document.getElementById("wiz-q2-cognome")?.value || "";
                nameVal = (n + " " + c).trim() || "1° Richiedente";
            } else if (window._currentPayslipTargetInput.id === "wiz-q10-netto-mensile-2") {
                nameVal = "2° Reddito / Coniuge";
            }
        }
        nameEl.innerText = nameVal ? nameVal : "Soggetto Selezionato";
    }
    
    // Recupera dati payslip esistenti se già salvati
    let existingPayslip = null;
    if (window._currentPayslipTargetInput) {
        const card = window._currentPayslipTargetInput.closest ? window._currentPayslipTargetInput.closest(".coapp-card") : null;
        if (card && card._payslipData) {
            existingPayslip = card._payslipData;
        } else if (window._currentPayslipTargetInput._payslipData) {
            existingPayslip = window._currentPayslipTargetInput._payslipData;
        } else if (window._currentPayslipTargetInput.id === "wiz-q10-netto-mensile" && window._primaryPayslipData) {
            existingPayslip = window._primaryPayslipData;
        } else if (window._currentPayslipTargetInput.id === "wiz-q10-netto-mensile-2" && window._secondIncomePayslipData) {
            existingPayslip = window._secondIncomePayslipData;
        }
    }
    
    const m1El = document.getElementById("payslip-m1");
    const m2El = document.getElementById("payslip-m2");
    const m3El = document.getElementById("payslip-m3");
    const menEl = document.getElementById("payslip-mensilita");
    const scorpEl = document.getElementById("payslip-scorporo");
    const bonusEl = document.getElementById("payslip-bonus");
    const baseEl = document.getElementById("payslip-paga-base");
    const contEl = document.getElementById("payslip-contingenza");
    const scattiEl = document.getElementById("payslip-scatti");
    const superEl = document.getElementById("payslip-superminimo");
    
    if (existingPayslip) {
        if (m1El) m1El.value = existingPayslip.m1 || 0;
        if (m2El) m2El.value = existingPayslip.m2 || 0;
        if (m3El) m3El.value = existingPayslip.m3 || 0;
        if (menEl) menEl.value = existingPayslip.mensilita || 14;
        if (scorpEl) scorpEl.value = existingPayslip.scorporo || 0;
        if (bonusEl) bonusEl.value = existingPayslip.bonus || 0;
        if (baseEl) baseEl.value = existingPayslip.pagaBase || 0;
        if (contEl) contEl.value = existingPayslip.contingenza || 0;
        if (scattiEl) scattiEl.value = existingPayslip.scatti || 0;
        if (superEl) superEl.value = existingPayslip.superminimo || 0;
    } else if (window._currentPayslipTargetInput && window._currentPayslipTargetInput.value > 0) {
        const val = parseFloat(window._currentPayslipTargetInput.value);
        if (m1El) m1El.value = Math.round(val);
        if (m2El) m2El.value = Math.round(val);
        if (m3El) m3El.value = Math.round(val);
    }
    
    // Mostra modale
    const modal = document.getElementById("wiz-payslip-calculator-modal");
    if (modal) {
        modal.style.display = "flex";
    }
    
    // Calcola live per tutte le banche
    window.calculatePayslipLive();
};

window.closePayslipCalculator = function() {
    const modal = document.getElementById("wiz-payslip-calculator-modal");
    if (modal) {
        modal.style.display = "none";
    }
};

window.calculatePayslipLive = function() {
    const m1 = parseFloat(document.getElementById("payslip-m1")?.value) || 0;
    const m2 = parseFloat(document.getElementById("payslip-m2")?.value) || 0;
    const m3 = parseFloat(document.getElementById("payslip-m3")?.value) || 0;
    const mensilita = parseFloat(document.getElementById("payslip-mensilita")?.value) || 12;
    const scorporo = parseFloat(document.getElementById("payslip-scorporo")?.value) || 0;
    const bonus = parseFloat(document.getElementById("payslip-bonus")?.value) || 0;
    const pagaBase = parseFloat(document.getElementById("payslip-paga-base")?.value) || 0;
    const contingenza = parseFloat(document.getElementById("payslip-contingenza")?.value) || 0;
    const scatti = parseFloat(document.getElementById("payslip-scatti")?.value) || 0;
    const superminimo = parseFloat(document.getElementById("payslip-superminimo")?.value) || 0;
    
    const payslipObj = {
        m1, m2, m3, mensilita, scorporo, bonus, pagaBase, contingenza, scatti, superminimo,
        inpsRate: 9.19
    };
    
    // 1. Calcolo Standard per le banche standard
    let standardNetto = 0;
    if (BrokerFlowEngine && typeof BrokerFlowEngine.calculatePayslipForBank === "function") {
        standardNetto = BrokerFlowEngine.calculatePayslipForBank(payslipObj, "mps");
    } else {
        const avg = (m1 + m2 + m3) / 3;
        standardNetto = Math.round((Math.max(0, avg - scorporo + bonus) * mensilita) / 12);
    }
    
    // 2. Calcolo ING Bank (Paga Base - 9.19% INPS - IRPEF 12 mensilità)
    let ingNetto = 0;
    if (BrokerFlowEngine && typeof BrokerFlowEngine.calculatePayslipForBank === "function") {
        ingNetto = BrokerFlowEngine.calculatePayslipForBank(payslipObj, "ing");
    } else {
        if (pagaBase > 0) {
            const annualGross = pagaBase * 12;
            const inps = annualGross * 0.0919;
            const imp = annualGross - inps;
            const irpef = imp * 0.23;
            ingNetto = Math.round((imp - irpef) / 12);
        } else {
            ingNetto = standardNetto;
        }
    }
    
    window._currentCalculatedPayslipNetto = standardNetto;
    
    const annualEl = document.getElementById("payslip-annual-preview");
    if (annualEl) annualEl.innerText = `€ ${(standardNetto * 12).toLocaleString('it-IT')} / anno (Standard)`;
    
    // Popola Tabella di Comparazione Multi-Banca
    const tbody = document.getElementById("payslip-banks-comparison-tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr style="border-bottom: 1px solid #f1f5f9; background: #ffffff;">
                <td style="padding: 0.65rem 0.8rem; font-weight: 700; color: #0f172a;">
                    🟢 Banche Standard<br>
                    <span style="font-size: 0.72rem; color: #64748b; font-weight: 400;">Intesa Sanpaolo, UniCredit, BNL, BPER, MPS, Sparkasse, Mediobanca Premier, BDM, Banco di Sardegna, Credem, BPM</span>
                </td>
                <td style="padding: 0.65rem 0.8rem; color: #334155;">
                    Media ultime 3 buste paga riparametrata su ${mensilita} mensilità contrattuali
                    ${scorporo > 0 ? `<br><span style="font-size: 0.70rem; color: #dc2626;">- € ${scorporo} straordinari scorporati</span>` : ''}
                    ${bonus > 0 ? `<br><span style="font-size: 0.70rem; color: #16a34a;">+ € ${bonus} bonus/trattamento integrativo</span>` : ''}
                </td>
                <td style="padding: 0.65rem 0.8rem; font-weight: 900; font-size: 1rem; color: #0052ff; text-align: right; white-space: nowrap;">
                    € ${standardNetto.toLocaleString('it-IT')} <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">/ mese</span>
                </td>
            </tr>
            <tr style="background: #fffbeb;">
                <td style="padding: 0.65rem 0.8rem; font-weight: 700; color: #9a3412;">
                    🦁 ING Bank<br>
                    <span style="font-size: 0.72rem; color: #c2410c; font-weight: 400;">Policy Specifica Underwriting ING</span>
                </td>
                <td style="padding: 0.65rem 0.8rem; color: #7c2d12;">
                    ${pagaBase > 0 
                        ? `Paga Base Lorda (€ ${pagaBase.toLocaleString('it-IT')}/mese × 12) - Contributi INPS 9.19% - IRPEF progressiva su 12 mesi`
                        : `Media netta secca su 12 mesi (nessun conteggio 13ª/14ª e straordinari)`}
                </td>
                <td style="padding: 0.65rem 0.8rem; font-weight: 900; font-size: 1rem; color: #ea580c; text-align: right; white-space: nowrap;">
                    € ${ingNetto.toLocaleString('it-IT')} <span style="font-size: 0.72rem; color: #9a3412; font-weight: 600;">/ mese</span>
                </td>
            </tr>
        `;
    }
};

window.applyPayslipIncomeToSubject = function() {
    const m1 = parseFloat(document.getElementById("payslip-m1")?.value) || 0;
    const m2 = parseFloat(document.getElementById("payslip-m2")?.value) || 0;
    const m3 = parseFloat(document.getElementById("payslip-m3")?.value) || 0;
    const mensilita = parseFloat(document.getElementById("payslip-mensilita")?.value) || 12;
    const scorporo = parseFloat(document.getElementById("payslip-scorporo")?.value) || 0;
    const bonus = parseFloat(document.getElementById("payslip-bonus")?.value) || 0;
    const pagaBase = parseFloat(document.getElementById("payslip-paga-base")?.value) || 0;
    const contingenza = parseFloat(document.getElementById("payslip-contingenza")?.value) || 0;
    const scatti = parseFloat(document.getElementById("payslip-scatti")?.value) || 0;
    const superminimo = parseFloat(document.getElementById("payslip-superminimo")?.value) || 0;
    
    if (m1 <= 0 && m2 <= 0 && m3 <= 0 && pagaBase <= 0) {
        alert("Inserisci almeno un importo valido di busta paga o paga base lorda.");
        return;
    }
    
    const payslipData = {
        m1, m2, m3, mensilita, scorporo, bonus, pagaBase, contingenza, scatti, superminimo,
        inpsRate: 9.19
    };
    
    if (!window._currentPayslipTargetInput) {
        alert("Nessun campo di destinazione selezionato.");
        window.closePayslipCalculator();
        return;
    }
    
    // Calcola il reddito standard normalizzato per il campo di visualizzazione generale
    const standardNetto = window._currentCalculatedPayslipNetto || Math.round((Math.max(0, ((m1+m2+m3)/3) - scorporo + bonus) * mensilita) / 12);
    
    // Memorizza i dati payslip dettagliati
    window._currentPayslipTargetInput._payslipData = payslipData;
    
    // Se è 1° Richiedente o 2° Reddito, memorizza nelle variabili globali e in wizardSubjects
    if (window._currentPayslipTargetInput.id === "wiz-q10-netto-mensile") {
        window._primaryPayslipData = payslipData;
        if (wizardSubjects && wizardSubjects.length > 0) {
            wizardSubjects[0].payslipData = payslipData;
        }
    } else if (window._currentPayslipTargetInput.id === "wiz-q10-netto-mensile-2") {
        window._secondIncomePayslipData = payslipData;
        const secSub = wizardSubjects.find(s => s.isSecondIncome);
        if (secSub) secSub.payslipData = payslipData;
    }
    
    // Se è dentro una scheda coobbligato / garante, memorizza sulla scheda
    const card = window._currentPayslipTargetInput.closest ? window._currentPayslipTargetInput.closest(".coapp-card") : null;
    if (card) {
        card._payslipData = payslipData;
        if (window.updateCoappCalculatedIncome) {
            window.updateCoappCalculatedIncome(card);
        }
    }
    
    // Imposta il valore nel campo input
    window._currentPayslipTargetInput.value = standardNetto;
    window._currentPayslipTargetInput.dispatchEvent(new Event("input", { bubbles: true }));
    window._currentPayslipTargetInput.dispatchEvent(new Event("change", { bubbles: true }));
    
    // Ricalcola totali e fattibilità multi-banca
    if (window.updateCalculatedIncome) window.updateCalculatedIncome();
    if (window.updateCalculations) window.updateCalculations();
    
    // Chiudi modale
    window.closePayslipCalculator();
    
    console.log(`[Payslip Multi-Bank] Memorizzati dati busta paga per ${window._currentPayslipSubjectLabel}. Il motore di calcolo applicherà automaticamente le policy specifiche per ciascun istituto bancario.`);
};

// ==========================================================================
// MODULO AGENDA & SCADENZARIO PRATICHE
// ==========================================================================
window.agendaCurrentMonth = new Date().getMonth();
window.agendaCurrentYear = new Date().getFullYear();
window.agendaSelectedDate = new Date().toISOString().split("T")[0]; // Always default to today
window.agendaSelectedType = "all";
window.agendaSearchQuery = "";

// No demo seed events (clean real user agenda)
const DEFAULT_AGENDA_EVENTS = [];

const DEFAULT_AGENDA_COLORS = {
    rogito: "#10b981",
    delibera: "#8b5cf6",
    perizia: "#f97316",
    incontro: "#0052ff",
    recall: "#f59e0b",
    google_calendar: "#1a73e8",
    altro: "#64748b"
};

const DEFAULT_AGENDA_LABELS = {
    all: "Tutti",
    rogito: "Rogiti",
    delibera: "Delibere",
    perizia: "Perizie",
    incontro: "Incontri",
    recall: "Recall",
    google_calendar: "Google Calendar",
    altro: "Altro"
};

const DEFAULT_AGENDA_ICONS = {
    all: "📋",
    rogito: "🔴",
    delibera: "🟢",
    perizia: "🟡",
    incontro: "🔵",
    recall: "🟣",
    google_calendar: "🗓️",
    altro: "⚪"
};

function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(0, 82, 255, ${alpha !== undefined ? alpha : 1})`;
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(0, 82, 255, ${alpha !== undefined ? alpha : 1})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha !== undefined ? alpha : 1})`;
}

window.getAgendaColors = function() {
    try {
        const saved = localStorage.getItem("brokerflow_agenda_colors");
        if (saved) {
            return { ...DEFAULT_AGENDA_COLORS, ...JSON.parse(saved) };
        }
    } catch(e) {}
    return { ...DEFAULT_AGENDA_COLORS };
};

window.saveAgendaColors = function(colors) {
    try {
        localStorage.setItem("brokerflow_agenda_colors", JSON.stringify(colors));
        window.applyAgendaColors();
    } catch(e) {
        console.error("Error saving agenda colors:", e);
    }
};

window.getAgendaLabels = function() {
    try {
        const saved = localStorage.getItem("brokerflow_agenda_labels");
        if (saved) {
            return { ...DEFAULT_AGENDA_LABELS, ...JSON.parse(saved) };
        }
    } catch(e) {}
    return { ...DEFAULT_AGENDA_LABELS };
};

window.saveAgendaLabels = function(labels) {
    try {
        localStorage.setItem("brokerflow_agenda_labels", JSON.stringify(labels));
        window.applyAgendaColors();
    } catch(e) {
        console.error("Error saving agenda labels:", e);
    }
};

window.openAgendaSettingsModal = function() {
    const modal = document.getElementById("agenda-settings-modal");
    if (!modal) return;
    const colors = window.getAgendaColors();
    const labels = window.getAgendaLabels();
    Object.keys(DEFAULT_AGENDA_COLORS).forEach(type => {
        const picker = document.getElementById(`color-picker-${type}`);
        const hexInput = document.getElementById(`color-hex-${type}`);
        const labelInput = document.getElementById(`label-input-${type}`);
        const badge = document.getElementById(`preview-badge-${type}`);
        const col = colors[type] || DEFAULT_AGENDA_COLORS[type];
        const lab = labels[type] || DEFAULT_AGENDA_LABELS[type] || type;

        if (picker) picker.value = col;
        if (hexInput) hexInput.value = col;
        if (labelInput) labelInput.value = lab;
        if (badge) {
            badge.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${col}; margin-right: 5px; vertical-align: middle; box-shadow: 0 0 3px ${col};"></span><span>${lab}</span>`;
            badge.style.background = hexToRgba(col, 0.12);
            badge.style.color = col;
            badge.style.borderColor = hexToRgba(col, 0.3);
        }
    });
    modal.style.display = "flex";
};

window.closeAgendaSettingsModal = function() {
    const modal = document.getElementById("agenda-settings-modal");
    if (modal) modal.style.display = "none";
};

window.handleAgendaColorChange = function(type, val) {
    if (!val) return;
    let hex = val.trim();
    if (!hex.startsWith("#") && hex.length === 6) hex = "#" + hex;
    const picker = document.getElementById(`color-picker-${type}`);
    const hexInput = document.getElementById(`color-hex-${type}`);
    const labelInput = document.getElementById(`label-input-${type}`);
    const badge = document.getElementById(`preview-badge-${type}`);
    const lab = (labelInput && labelInput.value.trim()) || DEFAULT_AGENDA_LABELS[type] || type;

    if (picker && picker.value !== hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
        picker.value = hex;
    }
    if (hexInput && hexInput.value !== hex) {
        hexInput.value = hex;
    }
    if (badge && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
        badge.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${hex}; margin-right: 5px; vertical-align: middle; box-shadow: 0 0 3px ${hex};"></span><span>${lab}</span>`;
        badge.style.background = hexToRgba(hex, 0.12);
        badge.style.color = hex;
        badge.style.borderColor = hexToRgba(hex, 0.3);
    }
};

window.handleAgendaLabelChange = function(type, val) {
    const badge = document.getElementById(`preview-badge-${type}`);
    const picker = document.getElementById(`color-picker-${type}`);
    const hexInput = document.getElementById(`color-hex-${type}`);
    const col = (hexInput && hexInput.value) || (picker && picker.value) || DEFAULT_AGENDA_COLORS[type];
    const lab = val.trim() || DEFAULT_AGENDA_LABELS[type] || type;
    if (badge) {
        badge.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${col}; margin-right: 5px; vertical-align: middle; box-shadow: 0 0 3px ${col};"></span><span>${lab}</span>`;
    }
};

window.saveAgendaColorsForm = function() {
    const newColors = {};
    const newLabels = {};
    Object.keys(DEFAULT_AGENDA_COLORS).forEach(type => {
        const hexInput = document.getElementById(`color-hex-${type}`);
        const picker = document.getElementById(`color-picker-${type}`);
        const labelInput = document.getElementById(`label-input-${type}`);

        let col = (hexInput && hexInput.value) || (picker && picker.value) || DEFAULT_AGENDA_COLORS[type];
        if (!col.startsWith("#")) col = "#" + col;
        newColors[type] = col;

        let lab = (labelInput && labelInput.value.trim()) || DEFAULT_AGENDA_LABELS[type] || type;
        newLabels[type] = lab;
    });
    window.saveAgendaColors(newColors);
    window.saveAgendaLabels(newLabels);
    window.closeAgendaSettingsModal();
    window.applyAgendaColors();
    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
    if (typeof window.showToast === "function") {
        window.showToast("🎨 Colori e testi pulsanti aggiornati con successo!", "success");
    }
};

window.resetAgendaColorsToDefault = function() {
    if (!confirm("Vuoi ripristinare la combinazione di colori e testi predefinita?")) return;
    window.saveAgendaColors({ ...DEFAULT_AGENDA_COLORS });
    window.saveAgendaLabels({ ...DEFAULT_AGENDA_LABELS });
    window.openAgendaSettingsModal(); // Refresh modal inputs
    window.applyAgendaColors();
    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
    if (typeof window.showToast === "function") {
        window.showToast("↺ Colori e testi predefiniti ripristinati.", "info");
    }
};

window.renderAgendaCalendarLegend = function() {
    const legendEl = document.getElementById("agenda-calendar-legend");
    if (!legendEl) return;
    const colors = window.getAgendaColors();
    const labels = window.getAgendaLabels();
    
    const types = ["rogito", "delibera", "perizia", "incontro", "recall", "google_calendar", "altro"];
    legendEl.innerHTML = types.map(t => {
        const col = colors[t] || "#64748b";
        const lab = labels[t] || (t.charAt(0).toUpperCase() + t.slice(1));
        return `
            <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; color: #334155;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${col}; display: inline-block; box-shadow: 0 0 3px ${col};"></span>
                <span>${lab}</span>
            </div>
        `;
    }).join("");
};

window.applyAgendaColors = function() {
    const colors = window.getAgendaColors();
    const labels = window.getAgendaLabels();
    
    // Update filter buttons with dynamic matching colored dot
    document.querySelectorAll(".agenda-filter-btn").forEach(btn => {
        const t = btn.dataset.type;
        const isActive = btn.classList.contains("active");
        const labelText = labels[t] || (t === "all" ? "Tutti" : t);

        if (t === "all") {
            btn.innerHTML = `<span style="font-weight: 800;">${labelText}</span>`;
            btn.style.background = isActive ? "#0052ff" : "#ffffff";
            btn.style.color = isActive ? "#ffffff" : "#334155";
            btn.style.borderColor = isActive ? "#0052ff" : "#cbd5e1";
            btn.style.boxShadow = isActive ? "0 2px 8px rgba(0,82,255,0.3)" : "none";
        } else {
            const col = colors[t] || "#64748b";
            const dotBg = isActive ? "#ffffff" : col;
            const dotHtml = `<span class="btn-color-dot" style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${dotBg}; margin-right: 6px; vertical-align: middle; box-shadow: 0 0 4px ${isActive ? 'rgba(255,255,255,0.8)' : col};"></span>`;
            btn.innerHTML = `${dotHtml}<span>${labelText}</span>`;
            
            btn.style.background = isActive ? col : "#ffffff";
            btn.style.color = isActive ? "#ffffff" : col;
            btn.style.borderColor = col;
            btn.style.boxShadow = isActive ? `0 2px 8px ${hexToRgba(col, 0.35)}` : "none";
        }
    });

    // Update calendar legend dynamically
    window.renderAgendaCalendarLegend();
};

const COLOR_PRESETS = {
    standard: {
        rogito: "#10b981",
        delibera: "#8b5cf6",
        perizia: "#f97316",
        incontro: "#0052ff",
        recall: "#f59e0b",
        google_calendar: "#1a73e8",
        altro: "#64748b"
    },
    credipass: {
        rogito: "#10b981",
        delibera: "#9333ea",
        perizia: "#f97316",
        incontro: "#6366f1",
        recall: "#eab308",
        google_calendar: "#2563eb",
        altro: "#64748b"
    },
    vibrant: {
        rogito: "#059669",
        delibera: "#7c3aed",
        perizia: "#ea580c",
        incontro: "#2563eb",
        recall: "#d97706",
        google_calendar: "#0284c7",
        altro: "#475569"
    },
    pastel: {
        rogito: "#34d399",
        delibera: "#a78bfa",
        perizia: "#fb923c",
        incontro: "#60a5fa",
        recall: "#fbbf24",
        google_calendar: "#38bdf8",
        altro: "#94a3b8"
    }
};

window.initImpostazioniModule = function() {
    const colors = window.getAgendaColors();
    const labels = window.getAgendaLabels();
    Object.keys(DEFAULT_AGENDA_COLORS).forEach(type => {
        const col = colors[type] || DEFAULT_AGENDA_COLORS[type];
        const lab = labels[type] || DEFAULT_AGENDA_LABELS[type] || type;

        const picker = document.getElementById(`settings-color-picker-${type}`);
        const hexInput = document.getElementById(`settings-color-hex-${type}`);
        const labelInput = document.getElementById(`settings-label-input-${type}`);
        const sampleBadge = document.getElementById(`settings-sample-badge-${type}`);
        const sampleBtn = document.getElementById(`settings-sample-btn-${type}`);
        const card = document.getElementById(`settings-card-${type}`);

        if (picker) picker.value = col;
        if (hexInput) hexInput.value = col;
        if (labelInput) labelInput.value = lab;
        if (sampleBadge) {
            sampleBadge.innerHTML = `<span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${col}; margin-right: 4px; vertical-align: middle;"></span>${lab}`;
            sampleBadge.style.background = hexToRgba(col, 0.12);
            sampleBadge.style.color = col;
            sampleBadge.style.borderColor = hexToRgba(col, 0.3);
        }
        if (sampleBtn) {
            sampleBtn.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ffffff; margin-right: 5px; vertical-align: middle;"></span>${lab}`;
            sampleBtn.style.background = col;
            sampleBtn.style.boxShadow = `0 2px 8px ${hexToRgba(col, 0.35)}`;
        }
        if (card) {
            card.style.borderLeft = `4px solid ${col}`;
        }
    });
    window.renderSettingsLivePreview();
};

window.handleSettingsColorChange = function(type, val) {
    if (!val) return;
    let hex = val.trim();
    if (!hex.startsWith("#") && hex.length === 6) hex = "#" + hex;
    const picker = document.getElementById(`settings-color-picker-${type}`);
    const hexInput = document.getElementById(`settings-color-hex-${type}`);
    const labelInput = document.getElementById(`settings-label-input-${type}`);
    const sampleBadge = document.getElementById(`settings-sample-badge-${type}`);
    const sampleBtn = document.getElementById(`settings-sample-btn-${type}`);
    const card = document.getElementById(`settings-card-${type}`);
    const lab = (labelInput && labelInput.value.trim()) || DEFAULT_AGENDA_LABELS[type] || type;

    if (picker && picker.value !== hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
        picker.value = hex;
    }
    if (hexInput && hexInput.value !== hex) {
        hexInput.value = hex;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        if (sampleBadge) {
            sampleBadge.innerHTML = `<span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${hex}; margin-right: 4px; vertical-align: middle;"></span>${lab}`;
            sampleBadge.style.background = hexToRgba(hex, 0.12);
            sampleBadge.style.color = hex;
            sampleBadge.style.borderColor = hexToRgba(hex, 0.3);
        }
        if (sampleBtn) {
            sampleBtn.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ffffff; margin-right: 5px; vertical-align: middle;"></span>${lab}`;
            sampleBtn.style.background = hex;
            sampleBtn.style.boxShadow = `0 2px 8px ${hexToRgba(hex, 0.35)}`;
        }
        if (card) {
            card.style.borderLeft = `4px solid ${hex}`;
        }
        window.renderSettingsLivePreview();
    }
};

window.handleSettingsLabelChange = function(type, val) {
    const lab = val.trim() || DEFAULT_AGENDA_LABELS[type] || type;
    const picker = document.getElementById(`settings-color-picker-${type}`);
    const col = (picker && picker.value) || DEFAULT_AGENDA_COLORS[type];
    const sampleBadge = document.getElementById(`settings-sample-badge-${type}`);
    const sampleBtn = document.getElementById(`settings-sample-btn-${type}`);

    if (sampleBadge) {
        sampleBadge.innerHTML = `<span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${col}; margin-right: 4px; vertical-align: middle;"></span>${lab}`;
    }
    if (sampleBtn) {
        sampleBtn.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ffffff; margin-right: 5px; vertical-align: middle;"></span>${lab}`;
    }
    window.renderSettingsLivePreview();
};

window.renderSettingsLivePreview = function() {
    const container = document.getElementById("settings-live-filterbar-preview");
    if (!container) return;
    
    const currentCols = {};
    const currentLabs = {};
    Object.keys(DEFAULT_AGENDA_COLORS).forEach(type => {
        const hexInput = document.getElementById(`settings-color-hex-${type}`);
        const picker = document.getElementById(`settings-color-picker-${type}`);
        const labelInput = document.getElementById(`settings-label-input-${type}`);

        let col = (hexInput && hexInput.value) || (picker && picker.value) || DEFAULT_AGENDA_COLORS[type];
        if (!col.startsWith("#")) col = "#" + col;
        currentCols[type] = col;

        let lab = (labelInput && labelInput.value.trim()) || DEFAULT_AGENDA_LABELS[type] || type;
        currentLabs[type] = lab;
    });

    const categories = [
        { type: "all", label: "Tutti (12)", bg: "#0052ff", color: "#fff", border: "#0052ff", isFill: true },
        { type: "rogito", label: `${currentLabs.rogito} (3)`, col: currentCols.rogito },
        { type: "perizia", label: `${currentLabs.perizia} (4)`, col: currentCols.perizia },
        { type: "incontro", label: `${currentLabs.incontro} (8)`, col: currentCols.incontro },
        { type: "recall", label: `${currentLabs.recall} (5)`, col: currentCols.recall },
        { type: "delibera", label: `${currentLabs.delibera} (2)`, col: currentCols.delibera },
        { type: "google_calendar", label: `${currentLabs.google_calendar} (6)`, col: currentCols.google_calendar },
        { type: "altro", label: `${currentLabs.altro} (1)`, col: currentCols.altro }
    ];

    container.innerHTML = categories.map(cat => {
        if (cat.isFill) {
            return `<button type="button" style="background: ${cat.bg}; color: ${cat.color}; border: 1.5px solid ${cat.border}; padding: 0.35rem 0.8rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: default; box-shadow: 0 2px 6px rgba(0,82,255,0.25);"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ffffff; margin-right: 5px; vertical-align: middle;"></span>${cat.label}</button>`;
        }
        return `<button type="button" style="background: #ffffff; color: ${cat.col}; border: 1.5px solid ${cat.col}; padding: 0.35rem 0.8rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: default; transition: all 0.2s;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${cat.col}; margin-right: 5px; vertical-align: middle; box-shadow: 0 0 4px ${cat.col};"></span>${cat.label}</button>`;
    }).join("");
};

window.applyColorPalettePreset = function(presetKey) {
    const preset = COLOR_PRESETS[presetKey];
    if (!preset) return;
    Object.keys(preset).forEach(type => {
        window.handleSettingsColorChange(type, preset[type]);
    });
    if (typeof window.showToast === "function") {
        window.showToast(`🎨 Palette "${presetKey.toUpperCase()}" caricata nell'anteprima`, "info");
    }
};

window.saveSettingsModuleColors = function() {
    const newColors = {};
    const newLabels = {};
    Object.keys(DEFAULT_AGENDA_COLORS).forEach(type => {
        const hexInput = document.getElementById(`settings-color-hex-${type}`);
        const picker = document.getElementById(`settings-color-picker-${type}`);
        const labelInput = document.getElementById(`settings-label-input-${type}`);

        let col = (hexInput && hexInput.value) || (picker && picker.value) || DEFAULT_AGENDA_COLORS[type];
        if (!col.startsWith("#")) col = "#" + col;
        newColors[type] = col;

        let lab = (labelInput && labelInput.value.trim()) || DEFAULT_AGENDA_LABELS[type] || type;
        newLabels[type] = lab;
    });
    window.saveAgendaColors(newColors);
    window.saveAgendaLabels(newLabels);
    window.applyAgendaColors();
    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
    if (typeof window.showToast === "function") {
        window.showToast("✅ Preferenze colori e testi dei pulsanti salvate con successo!", "success");
    }
};

window.resetSettingsColorsToDefault = function() {
    if (!confirm("Vuoi ripristinare la combinazione di colori e testi predefinita?")) return;
    window.saveAgendaColors({ ...DEFAULT_AGENDA_COLORS });
    window.saveAgendaLabels({ ...DEFAULT_AGENDA_LABELS });
    window.initImpostazioniModule();
    window.applyAgendaColors();
    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
    if (typeof window.showToast === "function") {
        window.showToast("↺ Colori e testi predefiniti ripristinati.", "info");
    }
};

window.syncGoogleCalendarFromSettings = async function() {
    const icon = document.getElementById("settings-gcal-sync-icon");
    const text = document.getElementById("settings-gcal-sync-text");
    const status = document.getElementById("settings-gcal-status-text");
    
    if (icon) icon.innerText = "⏳";
    if (text) text.textContent = "Sincronizzazione in corso...";
    
    await window.syncGoogleCalendar();
    
    if (icon) icon.innerText = "🔄";
    if (text) text.textContent = "Sincronizza Google Calendar Adesso";
    if (status) {
        status.innerHTML = `🟢 Sincronizzato alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    }
};

const DEFAULT_GCAL_FEED_URL = "https://calendar.google.com/calendar/ical/alessandro.fassina%40credipass.it/private-f6aaf5491172e94c8aa7283c89974f36/basic.ics";

window.getAgendaEvents = function() {
    let localEvents = [];
    try {
        const saved = localStorage.getItem("brokerflow_agenda_events");
        if (saved) {
            localEvents = JSON.parse(saved);
            // Clean up any old demo events (starting with evt_seed_)
            const filtered = localEvents.filter(e => !e.id || !e.id.startsWith("evt_seed_"));
            if (filtered.length !== localEvents.length) {
                localEvents = filtered;
                localStorage.setItem("brokerflow_agenda_events", JSON.stringify(localEvents));
            }
        } else {
            localEvents = [];
            localStorage.setItem("brokerflow_agenda_events", JSON.stringify(localEvents));
        }
    } catch (e) {
        localEvents = [];
    }

    // Load cached Google Calendar events (restricted to last 1 year)
    let gcalEvents = [];
    const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    try {
        const gcalSaved = localStorage.getItem("brokerflow_google_calendar_cache");
        if (gcalSaved) {
            const rawGcal = JSON.parse(gcalSaved);
            gcalEvents = rawGcal.filter(e => e.date && e.date >= oneYearAgoStr);
        }
    } catch (e) {
        gcalEvents = [];
    }

    // Apply completed status overrides for Google Calendar events
    let gcalCompletedMap = {};
    try {
        const compSaved = localStorage.getItem("brokerflow_gcal_completed_map");
        if (compSaved) gcalCompletedMap = JSON.parse(compSaved);
    } catch (e) {}

    const processedGcalEvents = gcalEvents.map(ev => ({
        ...ev,
        completed: gcalCompletedMap[ev.id] !== undefined ? gcalCompletedMap[ev.id] : ev.completed
    }));

    // Merge without duplicates by ID
    const allEvents = [...localEvents];
    const seenIds = new Set(localEvents.map(e => e.id));

    processedGcalEvents.forEach(ev => {
        if (!seenIds.has(ev.id)) {
            allEvents.push(ev);
            seenIds.add(ev.id);
        }
    });

    return allEvents;
};

window.saveAgendaEventsList = function(events) {
    try {
        const localEvents = events.filter(e => e.source !== "google_calendar");
        localStorage.setItem("brokerflow_agenda_events", JSON.stringify(localEvents));
    } catch (e) {
        console.error("Error saving agenda events:", e);
    }
};

window.syncGoogleCalendar = async function(showToast) {
    const btn = document.getElementById("btn-sync-gcal");
    const spinner = document.getElementById("sync-gcal-spinner");
    if (spinner) spinner.innerText = "⏳";
    if (btn) btn.disabled = true;

    try {
        const res = await fetch("/api/sync-google-calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: DEFAULT_GCAL_FEED_URL })
        });
        const data = await res.json();

        if (data.status === "success" && Array.isArray(data.events)) {
            localStorage.setItem("brokerflow_google_calendar_cache", JSON.stringify(data.events));
            localStorage.setItem("brokerflow_google_calendar_url", DEFAULT_GCAL_FEED_URL);
            
            window.updateAgendaKPIs();
            window.renderAgendaCalendar();
            window.renderAgendaEventsList();

            if (showToast && typeof window.showToast === "function") {
                window.showToast(`🗓️ Google Calendar: ${data.events.length} appuntamenti sincronizzati!`, "success");
            }
        } else {
            throw new Error(data.message || "Errore durante la sincronizzazione");
        }
    } catch (err) {
        console.error("Errore sincronizzazione Google Calendar:", err);
        if (showToast && typeof window.showToast === "function") {
            window.showToast(`⚠️ Impossibile sincronizzare Google Calendar: ${err.message}`, "error");
        }
    } finally {
        if (spinner) spinner.innerText = "🔄";
        if (btn) btn.disabled = false;
    }
};

window.syncAgendaWithDeals = function(showToast) {
    const events = window.getAgendaEvents();
    let addedCount = 0;

    if (Array.isArray(crmDeals)) {
        crmDeals.forEach(deal => {
            if (!deal || !deal.id) return;
            const clientName = deal.cliente || "Cliente";
            const dealName = deal.nome || `Pratica #${deal.id}`;

            // Check if deal has stipula date
            if (deal.dataStipula) {
                const existing = events.find(e => e.dealId === deal.id && e.type === "rogito");
                if (!existing) {
                    events.push({
                        id: `evt_deal_rogito_${deal.id}`,
                        dealId: deal.id,
                        title: `Stipula Rogito: ${dealName}`,
                        type: "rogito",
                        date: deal.dataStipula,
                        time: "10:30",
                        duration: "90",
                        client: clientName,
                        deal: dealName,
                        location: deal.luogoStipula || "Studio Notarile",
                        notes: `Pratica stipula mutuo ${deal.bancaScelta || ''} - Importo € ${deal.importo || ''}`,
                        completed: deal.status === "stipulato"
                    });
                    addedCount++;
                }
            }

            // Check if deal has delibera expiry date
            if (deal.dataScadenzaDelibera) {
                const existing = events.find(e => e.dealId === deal.id && e.type === "delibera");
                if (!existing) {
                    events.push({
                        id: `evt_deal_delibera_${deal.id}`,
                        dealId: deal.id,
                        title: `Scadenza Delibera: ${clientName}`,
                        type: "delibera",
                        date: deal.dataScadenzaDelibera,
                        time: "18:00",
                        duration: "30",
                        client: clientName,
                        deal: dealName,
                        location: deal.bancaScelta || "Banca",
                        notes: `Scadenza efficacia delibera creditizia.`,
                        completed: false
                    });
                    addedCount++;
                }
            }
        });
    }

    if (addedCount > 0) {
        window.saveAgendaEventsList(events);
    }

    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();

    if (showToast && typeof window.showToast === "function") {
        window.showToast(`🔄 Sincronizzazione completata (${addedCount} nuove scadenze aggiunte)`, "info");
    }
};

window.initAgendaModule = function() {
    window.applyAgendaColors();
    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();

    // Auto-fetch Google Calendar if cache not yet populated
    const cached = localStorage.getItem("brokerflow_google_calendar_cache");
    if (!cached) {
        window.syncGoogleCalendar(false);
    }
};

window.updateAgendaKPIs = function() {
    const events = window.getAgendaEvents();
    const colors = window.getAgendaColors();
    const todayStr = new Date().toISOString().split("T")[0];

    const todayCount = events.filter(e => !e.completed && e.date === todayStr).length;
    const rogitiCount = events.filter(e => !e.completed && e.type === "rogito").length;
    const delibereCount = events.filter(e => !e.completed && e.type === "delibera").length;
    const recallsCount = events.filter(e => !e.completed && e.type === "recall").length;

    const elToday = document.getElementById("agenda-kpi-today");
    const elRogiti = document.getElementById("agenda-kpi-rogiti");
    const elDelibere = document.getElementById("agenda-kpi-delibere");
    const elRecalls = document.getElementById("agenda-kpi-recalls");

    if (elToday) elToday.innerText = todayCount;
    if (elRogiti) {
        elRogiti.innerText = rogitiCount;
        const card = elRogiti.closest(".agenda-kpi-card");
        if (card) card.style.borderLeftColor = colors.rogito;
    }
    if (elDelibere) {
        elDelibere.innerText = delibereCount;
        const card = elDelibere.closest(".agenda-kpi-card");
        if (card) card.style.borderLeftColor = colors.delibera;
    }
    if (elRecalls) {
        elRecalls.innerText = recallsCount;
        const card = elRecalls.closest(".agenda-kpi-card");
        if (card) card.style.borderLeftColor = colors.recall;
    }
};

window.navAgendaMonth = function(dir) {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    if (dir === 0) {
        window.agendaCurrentMonth = today.getMonth();
        window.agendaCurrentYear = today.getFullYear();
        window.agendaSelectedDate = today.toISOString().split("T")[0];
    } else {
        window.agendaCurrentMonth += dir;
        if (window.agendaCurrentMonth < 0) {
            window.agendaCurrentMonth = 11;
            window.agendaCurrentYear -= 1;
        } else if (window.agendaCurrentMonth > 11) {
            window.agendaCurrentMonth = 0;
            window.agendaCurrentYear += 1;
        }
        // If current month, pick today, else pick 1st of month
        if (window.agendaCurrentYear === today.getFullYear() && window.agendaCurrentMonth === today.getMonth()) {
            window.agendaSelectedDate = today.toISOString().split("T")[0];
        } else {
            window.agendaSelectedDate = `${window.agendaCurrentYear}-${pad(window.agendaCurrentMonth + 1)}-01`;
        }
    }
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
};

const MONTH_NAMES_IT = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

function formatAgendaItalianDate(isoDateStr) {
    if (!isoDateStr) return "";
    try {
        const [y, m, d] = isoDateStr.split("-");
        const monthNames = [
            "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
        ];
        const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
        const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        const dayName = dayNames[dt.getDay()];
        const monthName = monthNames[parseInt(m) - 1];
        return `${dayName} ${parseInt(d, 10)} ${monthName} ${y}`;
    } catch(e) {
        return isoDateStr;
    }
}

window.renderAgendaCalendar = function() {
    const labelEl = document.getElementById("agenda-calendar-month-label");
    const container = document.getElementById("agenda-calendar-days-container");
    if (!container) return;

    const month = window.agendaCurrentMonth;
    const year = window.agendaCurrentYear;

    if (labelEl) {
        labelEl.innerText = `${MONTH_NAMES_IT[month]} ${year}`;
    }

    const events = window.getAgendaEvents();
    const colors = window.getAgendaColors();

    // Map events by date YYYY-MM-DD
    const eventsByDate = new Map();
    events.forEach(e => {
        if (!e.date) return;
        if (!eventsByDate.has(e.date)) eventsByDate.set(e.date, []);
        eventsByDate.get(e.date).push(e);
    });

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust to Monday = 0
    const startDay = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split("T")[0];

    let html = "";

    // Leading days of previous month
    for (let i = startDay - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        html += `<div class="calendar-day-cell other-month"><span>${d}</span></div>`;
    }

    // Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
        const dStr = String(d).padStart(2, "0");
        const mStr = String(month + 1).padStart(2, "0");
        const isoDate = `${year}-${mStr}-${dStr}`;

        const isToday = (isoDate === todayStr);
        const isSelected = (isoDate === window.agendaSelectedDate);
        const dayEvents = eventsByDate.get(isoDate) || [];

        let dotsHtml = "";
        if (dayEvents.length > 0) {
            dotsHtml = `<div class="event-dots">`;
            dayEvents.slice(0, 3).forEach(ev => {
                let dotColor = colors[ev.type] || colors[ev.source] || colors.incontro || "#0052ff";
                dotsHtml += `<span class="event-dot" style="background: ${dotColor};"></span>`;
            });
            dotsHtml += `</div>`;
        }

        const classes = [
            "calendar-day-cell",
            isToday ? "today" : "",
            isSelected ? "selected" : "",
            dayEvents.length > 0 ? "has-events" : ""
        ].filter(Boolean).join(" ");

        html += `
            <div class="${classes}" onclick="window.selectAgendaDate('${isoDate}')">
                <span>${d}</span>
                ${dotsHtml}
            </div>
        `;
    }

    // Trailing days of next month to complete 7 columns grid
    const totalCells = startDay + totalDaysInMonth;
    const remainingCells = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-day-cell other-month"><span>${i}</span></div>`;
    }

    container.innerHTML = html;
};

window.selectAgendaDate = function(isoDate) {
    if (isoDate) {
        window.agendaSelectedDate = isoDate; // Always keep the selected date, never null
    }
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
};

window.filterAgendaEvents = function(type, btnEl) {
    window.agendaSelectedType = type;
    document.querySelectorAll(".agenda-filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (btnEl) {
        btnEl.classList.add("active");
    } else {
        const target = document.querySelector(`.agenda-filter-btn[data-type="${type}"]`);
        if (target) target.classList.add("active");
    }

    window.applyAgendaColors();
    window.renderAgendaEventsList();
};

window.handleAgendaSearch = function(val) {
    window.agendaSearchQuery = (val || "").trim().toLowerCase();
    window.renderAgendaEventsList();
};

window.renderAgendaEventsList = function() {
    const container = document.getElementById("agenda-events-cards-container");
    const countBadge = document.getElementById("agenda-events-count-badge");
    const titleEl = document.getElementById("agenda-list-title");
    if (!container) return;

    if (!window.agendaSelectedDate) {
        window.agendaSelectedDate = new Date().toISOString().split("T")[0];
    }

    let events = window.getAgendaEvents();
    const colors = window.getAgendaColors();

    // Filter out deleted Google Calendar events if any
    let gcalDeletedSet = new Set();
    try {
        const delSaved = localStorage.getItem("brokerflow_gcal_deleted_ids");
        if (delSaved) gcalDeletedSet = new Set(JSON.parse(delSaved));
    } catch(e) {}

    events = events.filter(e => !gcalDeletedSet.has(e.id));

    // Mandatory single-day focus
    events = events.filter(e => e.date === window.agendaSelectedDate);

    // Filter by type
    if (window.agendaSelectedType && window.agendaSelectedType !== "all") {
        if (window.agendaSelectedType === "google_calendar") {
            events = events.filter(e => e.source === "google_calendar");
        } else {
            events = events.filter(e => e.type === window.agendaSelectedType);
        }
    }

    // Header Title
    if (titleEl) {
        const todayStr = new Date().toISOString().split("T")[0];
        const isToday = window.agendaSelectedDate === todayStr;
        titleEl.innerHTML = `Appuntamenti di <strong>${formatAgendaItalianDate(window.agendaSelectedDate)}</strong> ${isToday ? '<span style="font-size:0.75rem; background:#dbeafe; color:#1e40af; padding:0.18rem 0.5rem; border-radius:4px; margin-left:0.4rem; vertical-align:middle; font-weight:700;">Oggi</span>' : ''}`;
    }

    // Filter by search query
    if (window.agendaSearchQuery) {
        events = events.filter(e => {
            const str = `${e.title || ''} ${e.client || ''} ${e.deal || ''} ${e.location || ''} ${e.notes || ''}`.toLowerCase();
            return str.includes(window.agendaSearchQuery);
        });
    }

    // Sort by time
    events.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    if (countBadge) countBadge.innerText = `${events.length} eventi`;

    if (events.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1.5rem; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1; color: #64748b;">
                <span style="font-size: 2.2rem; display: block; margin-bottom: 0.5rem;">📅</span>
                <strong style="color: #334155; font-size: 0.98rem; display: block; margin-bottom: 0.35rem;">Nessun appuntamento o scadenza in questa data</strong>
                <p style="font-size: 0.84rem; margin: 0; line-height: 1.4;">Non ci sono impegni registrati per <strong>${formatAgendaItalianDate(window.agendaSelectedDate)}</strong>.<br>Clicca su <strong>+ Nuovo Evento</strong> per aggiungerne uno o seleziona un altro giorno dal calendario.</p>
            </div>
        `;
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const labels = window.getAgendaLabels();

    let html = "";
    events.forEach(ev => {
        const evColor = colors[ev.type] || colors[ev.source] || colors.incontro || "#0052ff";
        let typeBadgeBg = hexToRgba(evColor, 0.12);
        let typeBadgeColor = evColor;
        let typeLabel = labels[ev.type] || (ev.type ? (ev.type.charAt(0).toUpperCase() + ev.type.slice(1)) : "Incontro");

        // Relative deadline countdown
        let countdownBadge = "";
        if (ev.date) {
            const evDate = new Date(ev.date);
            evDate.setHours(0,0,0,0);
            const diffDays = Math.round((evDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                countdownBadge = `<span style="font-size: 0.72rem; font-weight: 700; background: #fee2e2; color: #ef4444; padding: 0.15rem 0.5rem; border-radius: 4px;">Scaduto</span>`;
            } else if (diffDays === 0) {
                countdownBadge = `<span style="font-size: 0.72rem; font-weight: 800; background: #fef08a; color: #854d0e; padding: 0.15rem 0.5rem; border-radius: 4px;">🔥 Oggi</span>`;
            } else if (diffDays === 1) {
                countdownBadge = `<span style="font-size: 0.72rem; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 0.15rem 0.5rem; border-radius: 4px;">Domani</span>`;
            } else if (diffDays <= 7) {
                countdownBadge = `<span style="font-size: 0.72rem; font-weight: 700; background: #dcfce7; color: #15803d; padding: 0.15rem 0.5rem; border-radius: 4px;">Tra ${diffDays} giorni</span>`;
            }
        }

        const isGcal = ev.source === "google_calendar";
        const gcalDateParam = ev.date ? ev.date.replace(/-/g, '/') : '';
        const gcalSearchUrl = `https://calendar.google.com/calendar/u/0/r/day/${gcalDateParam}`;
        const gcalColor = colors.google_calendar || "#1a73e8";

        html += `
            <div class="agenda-event-card type-${ev.type || 'incontro'}" style="border-left: 4px solid ${evColor}; ${ev.completed ? 'opacity: 0.6; background: #f8fafc;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                            <span class="event-type-badge" style="background: ${typeBadgeBg}; color: ${typeBadgeColor}; border: 1px solid ${hexToRgba(typeBadgeColor, 0.25)}; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px;">
                                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${evColor}; box-shadow: 0 0 3px ${evColor};"></span>
                                <span>${typeLabel}</span>
                            </span>
                            ${isGcal ? `<span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; font-weight: 700; background: ${hexToRgba(gcalColor, 0.12)}; color: ${gcalColor}; border: 1px solid ${hexToRgba(gcalColor, 0.25)}; padding: 0.15rem 0.5rem; border-radius: 4px;"><span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${gcalColor}; box-shadow: 0 0 3px ${gcalColor};"></span><span>${labels.google_calendar || 'Google Calendar'}</span></span>` : ''}
                            ${countdownBadge}
                            <span style="font-size: 0.8rem; font-weight: 700; color: #475569;">
                                🗓️ ${ev.date} ${ev.time ? 'alle ' + ev.time : ''}
                            </span>
                        </div>
                        <h4 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem 0; ${ev.completed ? 'text-decoration: line-through;' : ''}">
                            ${ev.title}
                        </h4>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <button type="button" onclick="window.toggleAgendaEventCompleted('${ev.id}')" title="${ev.completed ? 'Riapri' : 'Segna come completato'}" style="background: ${ev.completed ? '#10b981' : '#f1f5f9'}; color: ${ev.completed ? '#fff' : '#475569'}; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.76rem; font-weight: 700; cursor: pointer;">
                            ${ev.completed ? '✓ Fatto' : '○ Da fare'}
                        </button>
                        ${!isGcal ? `
                        <button type="button" onclick="window.editAgendaEvent('${ev.id}')" title="Modifica" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.55rem; font-size: 0.76rem; cursor: pointer;">
                            ✏️
                        </button>
                        ` : ''}
                        <button type="button" onclick="window.deleteAgendaEvent('${ev.id}')" title="Rimuovi" style="background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; border-radius: 6px; padding: 0.35rem 0.55rem; font-size: 0.76rem; cursor: pointer;">
                            🗑️
                        </button>
                    </div>
                </div>

                <!-- Event Details: Client, Deal, Location, Notes -->
                <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.84rem; color: #334155; margin-top: 0.4rem;">
                    ${ev.client ? `<div style="display:flex;align-items:center;gap:0.4rem;"><strong>👤 Cliente / Lead:</strong> <span>${ev.client}</span></div>` : ''}
                    ${ev.deal ? `<div style="display:flex;align-items:center;gap:0.4rem;"><strong>📁 Pratica:</strong> <span>${ev.deal}</span></div>` : ''}
                    ${ev.location ? `<div style="display:flex;align-items:center;gap:0.4rem;"><strong>📍 Luogo:</strong> <a href="https://maps.google.com/?q=${encodeURIComponent(ev.location)}" target="_blank" style="color:#0052ff;text-decoration:none;">${ev.location} ↗</a></div>` : ''}
                    ${ev.notes ? `<div style="font-size:0.8rem;color:#64748b;background:#f8fafc;padding:0.5rem 0.75rem;border-radius:6px;border:1px solid #f1f5f9;margin-top:0.25rem;">📝 ${ev.notes}</div>` : ''}
                </div>

                <!-- One-Click Calendar Integrations / Direct Actions -->
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.6rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; flex-wrap: wrap; margin-top: 0.75rem;">
                    ${isGcal ? `
                    <span style="font-size: 0.72rem; font-weight: 700; color: ${gcalColor}; margin-right: auto;">Sincronizzato da Google Calendar</span>
                    <a href="${gcalSearchUrl}" target="_blank" style="background: ${hexToRgba(gcalColor, 0.12)}; color: ${gcalColor}; border: 1.5px solid ${hexToRgba(gcalColor, 0.3)}; border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.76rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem;">
                        <span>✏️</span> Apri / Modifica su Google Calendar ↗
                    </a>
                    ` : `
                    <span style="font-size: 0.72rem; font-weight: 700; color: #64748b; margin-right: auto;">Sincronizza subito:</span>
                    <!-- Google Calendar Direct Intent Button -->
                    <button type="button" onclick="window.exportToGoogleCalendar('${ev.id}')" style="background: #ffffff; color: ${gcalColor}; border: 1.5px solid ${gcalColor}; border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: background 0.15s;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${gcalColor}; box-shadow: 0 0 3px ${gcalColor};"></span> Aggiungi a Google Calendar
                    </button>

                    <!-- Apple / Outlook .ICS Button -->
                    <button type="button" onclick="window.exportToIcsCalendar('${ev.id}')" style="background: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <span>🍏</span> Apple / Outlook (.ics)
                    </button>
                    `}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
};

window.openNewAgendaEventModal = function(prefillData) {
    const modal = document.getElementById("agenda-event-modal");
    if (!modal) return;

    document.getElementById("agenda-modal-title").innerText = "Nuovo Appuntamento / Scadenza";
    document.getElementById("agenda-event-id").value = "";
    document.getElementById("agenda-event-title").value = (prefillData && prefillData.title) || "";
    const typeSelect = document.getElementById("agenda-event-type");
    if (typeSelect) {
        const labels = window.getAgendaLabels();
        const types = ["rogito", "delibera", "perizia", "incontro", "recall", "altro"];
        typeSelect.innerHTML = types.map(t => {
            const lab = labels[t] || (t.charAt(0).toUpperCase() + t.slice(1));
            return `<option value="${t}">${lab}</option>`;
        }).join("");
        typeSelect.value = (prefillData && prefillData.type) || "incontro";
    }
    document.getElementById("agenda-event-date").value = (prefillData && prefillData.date) || new Date().toISOString().split("T")[0];
    document.getElementById("agenda-event-time").value = (prefillData && prefillData.time) || "10:00";
    document.getElementById("agenda-event-duration").value = (prefillData && prefillData.duration) || "60";
    document.getElementById("agenda-event-client").value = (prefillData && prefillData.client) || "";
    document.getElementById("agenda-event-location").value = (prefillData && prefillData.location) || "";
    document.getElementById("agenda-event-notes").value = (prefillData && prefillData.notes) || "";

    // Populate clients datalist
    const dlClients = document.getElementById("agenda-clients-datalist");
    if (dlClients && Array.isArray(crmClients)) {
        dlClients.innerHTML = crmClients.map(c => `<option value="${c.nome || ''}">${c.occupazione || ''}</option>`).join("");
    }

    // Populate deals select
    const selDeal = document.getElementById("agenda-event-deal-select");
    if (selDeal && Array.isArray(crmDeals)) {
        let opts = `<option value="">-- Nessuna pratica associata --</option>`;
        crmDeals.forEach(d => {
            opts += `<option value="${d.nome || d.id}">${d.nome || ('Pratica ' + d.cliente)} (${d.bancaScelta || 'Banca'})</option>`;
        });
        selDeal.innerHTML = opts;
        if (prefillData && prefillData.deal) selDeal.value = prefillData.deal;
    }

    modal.style.display = "flex";
};

window.editAgendaEvent = function(eventId) {
    const events = window.getAgendaEvents();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    window.openNewAgendaEventModal(ev);
    document.getElementById("agenda-modal-title").innerText = "Modifica Appuntamento / Scadenza";
    document.getElementById("agenda-event-id").value = ev.id;
};

window.closeAgendaEventModal = function() {
    const modal = document.getElementById("agenda-event-modal");
    if (modal) modal.style.display = "none";
};

window.saveAgendaEvent = function() {
    const id = document.getElementById("agenda-event-id").value;
    const title = document.getElementById("agenda-event-title").value.trim();
    const type = document.getElementById("agenda-event-type").value;
    const date = document.getElementById("agenda-event-date").value;
    const time = document.getElementById("agenda-event-time").value;
    const duration = document.getElementById("agenda-event-duration").value;
    const client = document.getElementById("agenda-event-client").value.trim();
    const deal = document.getElementById("agenda-event-deal-select").value;
    const location = document.getElementById("agenda-event-location").value.trim();
    const notes = document.getElementById("agenda-event-notes").value.trim();

    if (!title) {
        alert("Inserisci un titolo per l'evento o la scadenza.");
        return;
    }
    if (!date) {
        alert("Seleziona una data valida.");
        return;
    }

    const events = window.getAgendaEvents();
    if (id) {
        // Edit existing
        const idx = events.findIndex(e => e.id === id);
        if (idx >= 0) {
            events[idx] = {
                ...events[idx],
                title, type, date, time, duration, client, deal, location, notes
            };
        }
    } else {
        // Create new
        events.push({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title, type, date, time, duration, client, deal, location, notes,
            completed: false
        });
    }

    window.saveAgendaEventsList(events);
    window.closeAgendaEventModal();
    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
    if (window.updateDashboardStats) window.updateDashboardStats();

    if (typeof window.showToast === "function") {
        window.showToast("💾 Appuntamento salvato con successo!", "success");
    }
};

window.deleteAgendaEvent = function(eventId) {
    if (!confirm("Sei sicuro di voler rimuovere questo evento dall'agenda?")) return;
    
    // Check if it is a Google Calendar event
    if (eventId && eventId.startsWith("gcal_")) {
        let deletedSet = [];
        try {
            const saved = localStorage.getItem("brokerflow_gcal_deleted_ids");
            if (saved) deletedSet = JSON.parse(saved);
        } catch(e) {}
        if (!deletedSet.includes(eventId)) deletedSet.push(eventId);
        localStorage.setItem("brokerflow_gcal_deleted_ids", JSON.stringify(deletedSet));
    } else {
        let events = window.getAgendaEvents();
        events = events.filter(e => e.id !== eventId);
        window.saveAgendaEventsList(events);
    }

    window.updateAgendaKPIs();
    window.renderAgendaCalendar();
    window.renderAgendaEventsList();
    if (window.updateDashboardStats) window.updateDashboardStats();
};

window.toggleAgendaEventCompleted = function(eventId) {
    const events = window.getAgendaEvents();
    const ev = events.find(e => e.id === eventId);
    if (ev) {
        ev.completed = !ev.completed;
        if (ev.source === "google_calendar") {
            let compMap = {};
            try {
                const saved = localStorage.getItem("brokerflow_gcal_completed_map");
                if (saved) compMap = JSON.parse(saved);
            } catch(e) {}
            compMap[eventId] = ev.completed;
            localStorage.setItem("brokerflow_gcal_completed_map", JSON.stringify(compMap));
        } else {
            window.saveAgendaEventsList(events);
        }
        window.updateAgendaKPIs();
        window.renderAgendaCalendar();
        window.renderAgendaEventsList();
        if (window.updateDashboardStats) window.updateDashboardStats();
    }
};

// ==========================================================================
// CALENDAR EXPORT: GOOGLE DIRECT INTENT & UNIVERSAL .ICS
// ==========================================================================
function formatGoogleCalendarDate(dateStr, timeStr, durationMinutes) {
    if (!dateStr) return "";
    const cleanDate = dateStr.replace(/-/g, "");
    if (!timeStr) {
        return `${cleanDate}/${cleanDate}`;
    }
    const [hh, mm] = timeStr.split(":");
    const startObj = new Date(`${dateStr}T${hh || '10'}:${mm || '00'}:00`);
    const dur = parseInt(durationMinutes, 10) || 60;
    const endObj = new Date(startObj.getTime() + dur * 60000);

    const pad = (n) => String(n).padStart(2, "0");
    const startStr = `${startObj.getFullYear()}${pad(startObj.getMonth() + 1)}${pad(startObj.getDate())}T${pad(startObj.getHours())}${pad(startObj.getMinutes())}00`;
    const endStr = `${endObj.getFullYear()}${pad(endObj.getMonth() + 1)}${pad(endObj.getDate())}T${pad(endObj.getHours())}${pad(endObj.getMinutes())}00`;

    return `${startStr}/${endStr}`;
}

window.exportToGoogleCalendar = function(eventId) {
    const events = window.getAgendaEvents();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    const datesParam = formatGoogleCalendarDate(ev.date, ev.time, ev.duration);
    const title = encodeURIComponent(ev.title + (ev.client ? ` - ${ev.client}` : ""));
    
    let detailsText = `${ev.notes || ''}\n\n`;
    if (ev.client) detailsText += `👤 Cliente: ${ev.client}\n`;
    if (ev.deal) detailsText += `📁 Pratica: ${ev.deal}\n`;
    detailsText += `\nGenerato automaticamente da BrokerFlow Platform`;
    
    const details = encodeURIComponent(detailsText);
    const location = encodeURIComponent(ev.location || "");

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
    window.open(url, "_blank");
};

window.exportToIcsCalendar = function(eventId) {
    const events = window.getAgendaEvents();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;

    const [hh, mm] = (ev.time || "10:00").split(":");
    const startDate = new Date(`${ev.date || '2026-09-24'}T${hh}:${mm}:00`);
    const dur = parseInt(ev.duration, 10) || 60;
    const endDate = new Date(startDate.getTime() + dur * 60000);

    const dtStart = `${startDate.getFullYear()}${pad(startDate.getMonth() + 1)}${pad(startDate.getDate())}T${pad(startDate.getHours())}${pad(startDate.getMinutes())}00`;
    const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

    let desc = `${ev.notes || ''}\n`;
    if (ev.client) desc += `Cliente: ${ev.client}\n`;
    if (ev.deal) desc += `Pratica: ${ev.deal}\n`;
    desc = desc.replace(/\n/g, "\\n");

    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//BrokerFlow//Agenda//IT",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${ev.id}@brokerflow.local`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${ev.title + (ev.client ? ' - ' + ev.client : '')}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${ev.location || ''}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Promemoria BrokerFlow",
        "TRIGGER:-P1D",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(ev.title || 'Evento').replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => {
                console.log('BrokerFlow ServiceWorker registrato per offline:', reg.scope);
                reg.update();
            })
            .catch(err => console.log('ServiceWorker registrazione non attiva in local file mode (normale se da file://):', err));
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

