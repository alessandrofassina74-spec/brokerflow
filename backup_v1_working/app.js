// BrokerFlow UI Controller and Dynamic Rules/Rates Engine

// Mode Tracking
let currentMode = "free"; // "free" or "interview"

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

// ==================== BRAND NEW REBUILT LOANS ENGINE ====================
window.userLoans = [];

window.addNewLoanCard = function() {
    const newLoan = {
        id: "loan_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        tipo: "personale",
        rata: 150,
        finanziaria: "Compass",
        verraChiuso: false
    };
    window.userLoans.push(newLoan);
    window.renderLoansCards(true);
    if (typeof updateCalculations === "function") updateCalculations();
};

window.addLoanItem = window.addNewLoanCard; // alias for onclick handlers

window.deleteLoanCard = function(loanId) {
    window.userLoans = window.userLoans.filter(l => l.id !== loanId);
    window.renderLoansCards(true);
    if (typeof updateCalculations === "function") updateCalculations();
};

window.updateLoanProperty = function(loanId, propName, value) {
    const loan = window.userLoans.find(l => l.id === loanId);
    if (loan) {
        loan[propName] = value;
    }
    window.renderLoansCards(false);
    if (typeof updateCalculations === "function") updateCalculations();
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


// DOM Elements - Mode Switching Tabs
const tabBtnFree = document.getElementById("tab-btn-free");
const tabBtnInterview = document.getElementById("tab-btn-interview");
const panelFreeMode = document.getElementById("panel-free-mode");
const panelInterviewMode = document.getElementById("panel-interview-mode");
const panelResultsColumn = document.getElementById("panel-results-column");
const leftColumnWrapper = document.getElementById("left-column-wrapper");
const mainGridEl = document.querySelector(".main-grid");

tabBtnFree.addEventListener("click", () => {
    currentMode = "free";
    tabBtnFree.classList.add("btn-primary");
    tabBtnInterview.classList.remove("btn-primary");
    panelFreeMode.style.display = "flex";
    panelInterviewMode.style.display = "none";
    if (mainGridEl) mainGridEl.classList.remove("full-width-mode");
    if (panelResultsColumn) panelResultsColumn.style.display = "block";
    updateCalculations();
});

tabBtnInterview.addEventListener("click", () => {
    currentMode = "interview";
    tabBtnInterview.classList.add("btn-primary");
    tabBtnFree.classList.remove("btn-primary");
    panelInterviewMode.style.display = "flex";
    panelFreeMode.style.display = "none";
    
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
let currentModule = "dashboard"; // "dashboard", "clienti", "pratiche", "engine"

const crmNavDashboard = document.getElementById("crm-nav-dashboard");
const crmNavClienti = document.getElementById("crm-nav-clienti");
const crmNavPratiche = document.getElementById("crm-nav-pratiche");
const crmNavEngine = document.getElementById("crm-nav-engine");

const moduleDashboard = document.getElementById("module-dashboard");
const moduleClienti = document.getElementById("module-clienti");
const modulePratiche = document.getElementById("module-pratiche");
const moduleEngine = document.getElementById("module-engine");

function switchCrmModule(targetModule) {
    currentModule = targetModule;
    
    [crmNavDashboard, crmNavClienti, crmNavPratiche, crmNavEngine].forEach(btn => btn.classList.remove("active"));
    [moduleDashboard, moduleClienti, modulePratiche, moduleEngine].forEach(mod => mod.style.display = "none");
    
    if (targetModule === "dashboard") {
        crmNavDashboard.classList.add("active");
        moduleDashboard.style.display = "block";
    } else if (targetModule === "clienti") {
        crmNavClienti.classList.add("active");
        moduleClienti.style.display = "block";
        renderCrmClients();
    } else if (targetModule === "pratiche") {
        crmNavPratiche.classList.add("active");
        modulePratiche.style.display = "block";
        renderCrmDeals();
    } else if (targetModule === "engine") {
        crmNavEngine.classList.add("active");
        moduleEngine.style.display = "block";
        updateCalculations();
    }
}

crmNavDashboard.addEventListener("click", () => switchCrmModule("dashboard"));
crmNavClienti.addEventListener("click", () => switchCrmModule("clienti"));
crmNavPratiche.addEventListener("click", () => switchCrmModule("pratiche"));
crmNavEngine.addEventListener("click", () => switchCrmModule("engine"));

document.getElementById("btn-quick-engine").addEventListener("click", () => switchCrmModule("engine"));

let crmClients = [
    { id: 1, nome: "Karime Essali", cittadinanza: "Extra UE (Marocco)", occupazione: "Dipendente TI", netto: 2100.70, praticheCount: 1 },
    { id: 2, nome: "Hanane El Kotni", cittadinanza: "Italiana", occupazione: "Autonomo Ordinario", netto: 3769.92, praticheCount: 1 },
    { id: 3, nome: "Marco Rossi", cittadinanza: "Italiana", occupazione: "Dipendente TI + Forfettario", netto: 2633.33, praticheCount: 1 }
];

let crmDeals = [
    { id: "104", cliente: "Karime Essali", comune: "Como", mutuo: 160000, ltv: 80, banca: "ING Bank", rata: 758.74, stato: "deliberata", label: "Deliberata" },
    { id: "105", cliente: "Hanane El Kotni", comune: "Roma", mutuo: 180000, ltv: 72, banca: "BPER Banca", rata: 840.13, stato: "lavorazione", label: "In Lavorazione" },
    { id: "106", cliente: "Marco Rossi", comune: "Milano", mutuo: 200000, ltv: 66, banca: "MPS", rata: 822.61, stato: "nuova", label: "Nuova Analisi" }
];

function renderCrmClients() {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    crmClients.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${c.nome}</strong></td>
            <td>${c.cittadinanza}</td>
            <td>${c.occupazione}</td>
            <td><strong>${c.netto.toLocaleString('it-IT', { minimumFractionDigits: 2 })} €</strong></td>
            <td><span class="kpi-badge info">${c.praticheCount} Pratica</span></td>
            <td>
                <button class="btn" onclick="startDealForClient(${c.id})" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">⚡ Calcola Mutuo</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCrmDeals() {
    const tbody = document.getElementById("deals-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    crmDeals.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${d.id}</strong></td>
            <td>${d.cliente}</td>
            <td>${d.comune}</td>
            <td>${d.mutuo.toLocaleString('it-IT')} €</td>
            <td>${d.ltv}%</td>
            <td><strong style="color: var(--primary);">${d.banca}</strong></td>
            <td>${d.rata.toFixed(2)} €/m</td>
            <td><span class="badge-status ${d.stato}">${d.label}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function startDealForClient(clientId) {
    if (clientId === 1) {
        document.getElementById("btn-demo-dipendente")?.click();
    } else if (clientId === 2) {
        document.getElementById("btn-demo-autonomo")?.click();
    } else if (clientId === 3) {
        document.getElementById("btn-demo-combined")?.click();
    }
    switchCrmModule("engine");
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
    inputBaseEuribor1m, inputBaseEuribor3m, inputBaseIrs, inputBaseBce,
    inputProvImmobile, inputProvResidenza, inputProvLavoro
];
freeModeInputs.forEach(input => input.addEventListener("input", updateCalculations));
freeModeInputs.forEach(input => input.addEventListener("change", updateCalculations));


// Attach change listeners for Wizard Step 6 inputs
const wizStep6Inputs = [
    document.getElementById("wiz-costo-casa"),
    document.getElementById("wiz-importo-mutuo"),
    document.getElementById("wiz-durata"),
    document.getElementById("wiz-tasso-tipo"),
    document.getElementById("wiz-classe-en"),
    document.getElementById("wiz-zona"),
    document.getElementById("wiz-prov-immobile"),
    document.getElementById("wiz-prov-residenza"),
    document.getElementById("wiz-prov-lavoro")
];
wizStep6Inputs.forEach(input => {
    if (input) {
        input.addEventListener("input", updateCalculations);
        input.addEventListener("change", updateCalculations);
    }
});

const calcModeExactInput = document.getElementById("calc-mode-exact");
const calcModeMaxInput = document.getElementById("calc-mode-max");
if (calcModeExactInput) calcModeExactInput.addEventListener("change", () => {
    const resExact = document.getElementById("results-mode-exact");
    if (resExact) resExact.checked = true;
    updateCalculations();
});
if (calcModeMaxInput) calcModeMaxInput.addEventListener("change", () => {
    const resMax = document.getElementById("results-mode-max");
    if (resMax) resMax.checked = true;
    updateCalculations();
});

const resultsModeExact = document.getElementById("results-mode-exact");
const resultsModeMax = document.getElementById("results-mode-max");
if (resultsModeExact) resultsModeExact.addEventListener("change", () => {
    if (calcModeExactInput) calcModeExactInput.checked = true;
    const wizOb = document.getElementById("wiz-obiettivo");
    if (wizOb) wizOb.value = "cifra";
    updateCalculations();
});
if (resultsModeMax) resultsModeMax.addEventListener("change", () => {
    if (calcModeMaxInput) calcModeMaxInput.checked = true;
    const wizOb = document.getElementById("wiz-obiettivo");
    if (wizOb) wizOb.value = "max";
    updateCalculations();
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

function updateCalculations() {
    try {
        let value, loan, years, ratePref, isGreenPratica, otherRate, people, zona, finalita, isCo, totalIncome, c1Eta, c2Eta;
    let exclusions = { pignoramenti: false, ritardi: false };
    let subjects = [];
    let provImmobile, provResidenza, provLavoro;

    if (currentMode === "free") {
        value = parseFloat(inputValoreImmobile.value) || 0;
        loan = parseFloat(inputImportoMutuo.value) || 0;
        years = parseInt(inputDurata.value) || 25;
        ratePref = inputTipoTasso.value;
        isGreenPratica = inputClasseEnergetica.value === "green";
        otherRate = parseFloat(inputAltreRate.value) || 0;
        people = parseInt(inputPersoneNucleo.value) || 1;
        zona = inputZona.value;
        finalita = inputFinalita.value;
        isCo = cointestazioneCheckbox.checked;
        const c1Income = parseFloat(inputC1Netto.value) || 0;
        const c2Income = isCo ? (parseFloat(inputC2Netto.value) || 0) : 0;
        totalIncome = c1Income + c2Income;
        c1Eta = parseInt(inputC1Eta.value) || 30;
        c2Eta = isCo ? (parseInt(inputC2Eta.value) || 30) : 0;

        provImmobile = inputProvImmobile.value || "Milano";
        provResidenza = inputProvResidenza.value || "Milano";
        provLavoro = inputProvLavoro.value || "Milano";

        subjects.push({
            role: "Richiedente Principale",
            eta: c1Eta,
            netto: c1Income,
            isOwner: true,
            tipoContratto: inputC1TipoReddito.value,
            cittadinanza: "IT",
            permScadenza: "valido",
            famigliaSede: "italia"
        });
        if (isCo) {
            subjects.push({
                role: "Cointestatario",
                eta: c2Eta,
                netto: c2Income,
                isOwner: true,
                tipoContratto: inputC2TipoReddito.value,
                cittadinanza: "IT",
                permScadenza: "valido",
                famigliaSede: "italia"
            });
        }
    } else {
        // Wizard Interview Mode - null-safe DOM lookups
        const costoCasaEl = document.getElementById("wiz-costo-casa");
        const importoMutuoEl = document.getElementById("wiz-importo-mutuo");
        const durataEl = document.getElementById("wiz-durata");
        const tassoTipoEl = document.getElementById("wiz-tasso-tipo");
        const classeEnEl = document.getElementById("wiz-classe-en");
        const zonaEl = document.getElementById("wiz-zona");
        
        value = costoCasaEl ? (parseFloat(costoCasaEl.value) || 0) : 200000;
        loan = importoMutuoEl ? (parseFloat(importoMutuoEl.value) || 0) : 160000;
        years = durataEl ? (parseInt(durataEl.value) || 25) : 25;
        ratePref = tassoTipoEl ? tassoTipoEl.value : "any";
        isGreenPratica = classeEnEl ? (classeEnEl.value === "green") : false;
        zona = zonaEl ? zonaEl.value : "nord";
        finalita = "acquisto"; 
        
        const provImmEl = document.getElementById("wiz-prov-immobile");
        const provResEl = document.getElementById("wiz-prov-residenza");
        const provLavEl = document.getElementById("wiz-prov-lavoro");
        
        provImmobile = provImmEl ? (provImmEl.value || "Milano") : "Milano";
        provResidenza = provResEl ? (provResEl.value || "Milano") : "Milano";
        provLavoro = provLavEl ? (provLavEl.value || "Milano") : "Milano";

        if (wizardSubjects.length === 0) {
            saveCurrentSubject();
        }
        
        totalIncome = 0;
        wizardSubjects.forEach(s => {
            if (s.role === "Richiedente Principale" || s.role === "Cointestatario") {
                totalIncome += s.netto;
            }
            subjects.push({
                ...s
            });
        });
        
        if (subjects.length === 0 || totalIncome <= 0) {
            const defaultIncome = 2100;
            totalIncome = defaultIncome;
            subjects = [{
                role: "Richiedente Principale",
                eta: 30,
                netto: defaultIncome,
                isOwner: true,
                tipoContratto: "dipendente_ti",
                cittadinanza: "IT",
                permScadenza: "valido",
                famigliaSede: "italia"
            }];
        }
        
        let activeLoansRate = 0;
        window.userLoans.forEach(l => {
            if (!l.verraChiuso) {
                activeLoansRate += (parseFloat(l.rata) || 0);
            }
        });
        const inputAltreRate = document.getElementById("altre-rate");
        const manualRate = inputAltreRate ? (parseFloat(inputAltreRate.value) || 0) : 0;
        otherRate = window.userLoans.length > 0 ? activeLoansRate : manualRate;
        
        // Note: Current rent is NOT a loan commitment for primary home purchase (Acquisto Prima Casa)
        // as rent ceases upon moving into the new property.
        if (finalita !== "acquisto" && finalita !== "surroga") {
            const abitaTipoEl = document.getElementById("wiz-abita-tipo");
            const affittoValEl = document.getElementById("wiz-abita-affitto-valore");
            if (abitaTipoEl && abitaTipoEl.value === "affitto") {
                otherRate += affittoValEl ? (parseFloat(affittoValEl.value) || 0) : 0;
            }
        }
        
        const pignEl = document.getElementById("wiz-pignoramenti");
        const ritardiEl = document.getElementById("wiz-ritardi");
        exclusions.pignoramenti = pignEl ? (pignEl.value === "si") : false;
        exclusions.ritardi = ritardiEl ? (ritardiEl.value === "si") : false;
        
        const numFigliEl = document.getElementById("wiz-num-figli");
        const statoCivileEl = document.getElementById("wiz-stato-civile");
        const numFigliVal = numFigliEl ? (parseInt(numFigliEl.value) || 0) : 0;
        people = numFigliVal + wizardSubjects.filter(s => s.role !== "Garante").length;
        if (statoCivileEl && statoCivileEl.value === "sposato") {
            people++;
        }
    }
    
    // Auto-cap loan to property value if loan exceeds value
    if (value > 0 && loan > value) {
        loan = Math.round(value * 0.80);
        if (currentMode === "free") inputImportoMutuo.value = loan;
        else {
            const wizLoanEl = document.getElementById("wiz-importo-mutuo");
            if (wizLoanEl) wizLoanEl.value = loan;
        }
    }

    // Retrieve calcMode from results radio buttons or form inputs
    const resModeExact = document.getElementById("results-mode-exact");
    const calcModeExact = document.getElementById("calc-mode-exact");
    const wizObiettivo = document.getElementById("wiz-obiettivo");
    
    let calcMode = "exact";
    if (resModeExact) {
        calcMode = resModeExact.checked ? "exact" : "max";
    } else if (calcModeExact) {
        calcMode = calcModeExact.checked ? "exact" : "max";
    } else if (wizObiettivo) {
        calcMode = wizObiettivo.value === "max" ? "max" : "exact";
    }

    const ltv = value > 0 ? (loan / value) : 0;
    
    // Tassi base de-serialized from page inputs
    const tassiBase = {
        euribor1m: parseFloat(inputBaseEuribor1m.value) || 3.25,
        euribor3m: parseFloat(inputBaseEuribor3m.value) || 3.35,
        irs: parseFloat(inputBaseIrs.value) || 2.70,
        bce: parseFloat(inputBaseBce.value) || 3.75
    };
    
    const pratica = {
        calcMode: calcMode,
        valoreImmobile: value,
        importoMutuo: loan,
        durata: years,
        tipoTasso: ratePref,
        isGreen: isGreenPratica,
        altreRate: otherRate,
        personeNucleo: people,
        zona: zona,
        finalita: finalita,
        subjects: subjects,
        totalIncome: totalIncome,
        exclusions: exclusions,
        provImmobile: provImmobile,
        provResidenza: provResidenza,
        provLavoro: provLavoro
    };
    
    // Evaluate via modular BrokerFlowEngine
    const result = BrokerFlowEngine.evaluate(pratica, tassiBase);
    
    // Render Results
    const allBanks = result.allEvaluated || [];
    allBanks.sort((a, b) => {
        if (a.isNotFeasible && !b.isNotFeasible) return 1;
        if (!a.isNotFeasible && b.isNotFeasible) return -1;
        if (calcMode === "max") return b.maxLoanGrantable - a.maxLoanGrantable;
        return a.rata - b.rata;
    });

    if (!result.feasible) {
        sumRata.innerText = "--";
        sumTasso.innerText = "--";
        sumReddito.innerText = `${formatNumber(totalIncome, 2)} €`;
        sumLtv.innerText = `${(ltv * 100).toFixed(1)}%`;
        sumDsr.innerText = "--";
        
        let customMsg = "La combinazione di parametri supera le policy di tutti gli istituti operanti in questa zona.";
        if (exclusions.pignoramenti || exclusions.ritardi) {
            customMsg = "Esito KO automatico dovuto a segnalazioni creditizie negative (pignoramenti o ritardi di pagamento in corso).";
            cardsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="color: var(--text-light); margin-bottom: 0.5rem; font-size: 1.1rem;">Nessuna Banca Fattibile</h3>
                    <p style="font-size: 0.85rem;">${customMsg}</p>
                </div>
            `;
            return;
        }
    } else {
        const bestBank = result.banks[0];
        sumRata.innerText = calcMode === "max" ? `${formatNumber(bestBank.maxRataSimulated, 2)} €` : `${formatNumber(bestBank.rata, 2)} €`;
        sumTasso.innerText = `${bestBank.tan.toFixed(2)}%`;
        sumReddito.innerText = `${formatNumber(totalIncome, 2)} €`;
        sumLtv.innerText = calcMode === "max" ? `${(bestBank.maxLtvSimulated * 100).toFixed(1)}%` : `${(ltv * 100).toFixed(1)}%`;
        sumDsr.innerText = `${(bestBank.dsr * 100).toFixed(1)}%`;
    }
    
    cardsContainer.innerHTML = "";
    
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

    allBanks.forEach((card, idx) => {
        const cardEl = document.createElement("div");
        const cardClass = card.status === "ok" ? "approved" : (card.status === "deroga" ? "deroga" : "rejected");
        cardEl.className = `bank-card ${cardClass}`;
        
        if (card.status === "ok" && idx === 0) {
            cardEl.style.boxShadow = `0 0 15px ${card.color}25`;
            cardEl.style.borderColor = `${card.color}60`;
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
        
        // Recommended Branches rendering
        let branchesHtml = "";
        if (card.status !== "ko" && card.recommendedBranches && card.recommendedBranches.length > 0) {
            branchesHtml += `
                <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em;">📍 Filiali Fisiche Consigliate (Ordinate per Distanza):</div>
            `;
            card.recommendedBranches.forEach(b => {
                const metric = finalita === "consolido" ? `${b.countConsolido} pratiche cons. concluse` : `${b.countAcquisto} mutui acquisto conclusi`;
                const distText = b.distance !== null ? ` | 🚗 ${b.distance.toFixed(1)} km dal tuo immobile/residenza` : "";
                branchesHtml += `
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--surface-border); border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.4rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                        <div>
                            <span style="font-weight: 600; color: var(--text-light);">${b.name}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.1rem;">${b.address} (${b.prov})${distText}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.75rem; font-weight: bold; color: var(--success); display: block;">${metric}</span>
                            <span style="font-size: 0.7rem; color: var(--warning);">⭐ ${b.rating.toFixed(1)} / 5</span>
                        </div>
                    </div>
                `;
            });
            branchesHtml += `</div>`;
        }
        
        let rateDisplayHtml = "";
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
                        <div style="font-size: 0.75rem; color: var(--text-light); font-weight: 600; margin-top: 0.15rem;">Rata: ${formatNumber(card.maxRataSimulated, 2)} €/m | TAN: ${card.tan.toFixed(2)}%</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.1rem;">Fattore vincolante: <em>${card.limitingFactor}</em> | ${statusBadge}</div>
                    </div>
                `;
            }
        } else {
            if (card.status === "ko") {
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--danger); margin-bottom: 0.15rem;">Non Fattibile (Policy KO)</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-decoration: line-through;">${card.rata < 999999 ? formatNumber(card.rata, 2) + ' €/mese' : '--'}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">TAN: ${card.tan > 0 ? card.tan.toFixed(2) + '%' : '--'} (Simulato)</div>
                    </div>
                `;
            } else if (card.status === "deroga") {
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--warning); margin-bottom: 0.15rem;">In Deroga (Eccezione Gestibile)</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-light);">${formatNumber(card.rata, 2)} €/mese</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Tasso TAN: ${card.tan.toFixed(2)}%</div>
                    </div>
                `;
            } else {
                rateDisplayHtml = `
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--success); margin-bottom: 0.15rem;">Fattibile (Approved)</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-light);">${formatNumber(card.rata, 2)} €/mese</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Tasso TAN: ${card.tan.toFixed(2)}%</div>
                    </div>
                `;
            }
        }

        cardEl.innerHTML = `
            <div class="bank-card-header">
                <div class="bank-name-section">
                    <div class="bank-logo-placeholder" style="color: ${card.color}; border-color: ${card.color}40; background: ${card.color}10;">${card.logo}</div>
                    <div>
                        <span class="bank-title">${card.name}</span>
                        <div style="font-size: 0.78rem; color: var(--primary); font-weight: 600; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
                            <span style="color: var(--text-muted); font-size: 0.72rem;">🏷️ Prodotto:</span>
                            <span style="color: #ffffff; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">${card.prodName || 'Mutuo Standard'}</span>
                        </div>
                    </div>
                </div>
                ${rateDisplayHtml}
            </div>
            
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
        cardsContainer.appendChild(cardEl);
    });
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

// ------------------ INTERVIEW WIZARD LOGIC ------------------
const btnWizPrev = document.getElementById("btn-wiz-prev");
const btnWizNext = document.getElementById("btn-wiz-next");
const wizardProgress = document.getElementById("wizard-progress");
const subjectsMiniList = document.getElementById("wizard-subjects-list");
const chipsContainer = document.getElementById("wizard-chips-container");
const btnRestartWizard = document.getElementById("btn-restart-wizard");

btnRestartWizard.addEventListener("click", () => {
    wizardSubjects = [];
    wizardLoans = [];
    currentSubjectRole = "Richiedente Principale";
    document.getElementById("wiz-nome").value = "";
    document.getElementById("wiz-cognome").value = "";
    document.getElementById("wiz-nascita").value = "1994-07-17";
    document.getElementById("wiz-stato-civile").value = "celibe_nubile";
    document.getElementById("wiz-figli").value = "no";
    document.getElementById("wiz-cittadinanza").value = "IT";
    document.getElementById("wiz-contratto").value = "dipendente_ti";
    document.getElementById("wiz-anzianita").value = "12";
    document.getElementById("wiz-azienda-nome").value = "";
    document.getElementById("wiz-azienda-piva").value = "";
    document.getElementById("wiz-prov-immobile").value = "Milano";
    document.getElementById("wiz-prov-residenza").value = "Milano";
    document.getElementById("wiz-prov-lavoro").value = "Milano";
    
    // reset loans list
    renderLoansList();
    renderSubjectsChips();
    
    goToStep(1);
    updateCalculations();
});

// Conditionally show inputs in Step 1
document.getElementById("wiz-stato-civile").addEventListener("change", function() {
    document.getElementById("wiz-cond-sposato").style.display = this.value === "sposato" ? "block" : "none";
    document.getElementById("wiz-cond-divorziato").style.display = this.value === "divorziato" ? "block" : "none";
});
document.getElementById("wiz-alimenti-tipo").addEventListener("change", function() {
    document.getElementById("wiz-alimenti-coint-group").style.display = this.value !== "nessuno" ? "block" : "none";
});
document.getElementById("wiz-figli").addEventListener("change", function() {
    const isSi = this.value === "si";
    document.getElementById("wiz-num-figli-group").style.display = isSi ? "block" : "none";
    document.getElementById("wiz-cond-figli-dettaglio").style.display = isSi ? "block" : "none";
});
document.getElementById("wiz-assegno-unico").addEventListener("change", function() {
    document.getElementById("wiz-assegno-valore-group").style.display = this.value === "si" ? "block" : "none";
});
document.getElementById("wiz-cittadinanza").addEventListener("change", function() {
    document.getElementById("wiz-cond-extracom").style.display = this.value === "extra_UE" ? "block" : "none";
});

// Conditionally show inputs in Step 2 (Income)
const wizContrattoSelect = document.getElementById("wiz-contratto");
const wizGroupDipTi = document.getElementById("wiz-group-dipendente-ti");
const wizGroupDipTd = document.getElementById("wiz-group-dipendente-td");
const wizGroupAutonomo = document.getElementById("wiz-group-autonomo");

wizContrattoSelect.addEventListener("change", function() {
    wizGroupDipTi.style.display = "none";
    wizGroupDipTd.style.display = "none";
    wizGroupAutonomo.style.display = "none";
    
    const label = document.getElementById("wiz-anzianita-label");
    
    if (this.value === "dipendente_ti" || this.value === "pensionato") {
        wizGroupDipTi.style.display = "block";
        label.innerText = this.value === "pensionato" ? "Anni di pensione" : "Anzianità lavorativa (mesi)";
    } else if (this.value === "dipendente_td") {
        wizGroupDipTd.style.display = "block";
        label.innerText = "Durata residua contratto (mesi)";
    } else if (this.value === "autonomo") {
        wizGroupAutonomo.style.display = "block";
        label.innerText = "Anzianità Partita IVA (anni)";
    }
});

document.getElementById("wiz-auto-regime").addEventListener("change", function() {
    document.getElementById("wiz-auto-ordinario").style.display = this.value === "ordinario" ? "block" : "none";
    document.getElementById("wiz-auto-forfettario").style.display = this.value === "forfettario" ? "block" : "none";
});

// Step 4 (Habitation) conditional
document.getElementById("wiz-abita-tipo").addEventListener("change", function() {
    document.getElementById("wiz-abita-affitto-group").style.display = this.value === "affitto" ? "block" : "none";
    document.getElementById("wiz-abita-prop-group").style.display = this.value === "proprieta" ? "block" : "none";
});
document.getElementById("wiz-abita-mutuo").addEventListener("change", function() {
    document.getElementById("wiz-abita-mutuo-dettaglio").style.display = this.value === "si" ? "block" : "none";
});
document.getElementById("wiz-abita-mutuo-estinto").addEventListener("change", function() {
    document.getElementById("wiz-abita-mutuo-rata-group").style.display = this.value === "no" ? "block" : "none";
});

// Step 5 (Loans) conditional
document.getElementById("wiz-has-loans").addEventListener("change", function() {
    document.getElementById("wiz-loans-builder").style.display = this.value === "si" ? "block" : "none";
});

// Step 5 (Obiettivo) conditional
document.getElementById("wiz-obiettivo").addEventListener("change", function() {
    document.getElementById("wiz-obiettivo-cifra-group").style.display = this.value === "cifra" ? "block" : "none";
    const resExact = document.getElementById("results-mode-exact");
    const resMax = document.getElementById("results-mode-max");
    if (this.value === "cifra" && resExact) resExact.checked = true;
    if (this.value === "max" && resMax) resMax.checked = true;
    updateCalculations();
});

// Navigate wizard steps
btnWizPrev.addEventListener("click", () => {
    if (wizardStep > 1) {
        goToStep(wizardStep - 1);
    }
});

btnWizNext.addEventListener("click", () => {
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
    wizardProgress.style.width = `${pct}%`;
    
    // Toggle active classes
    document.querySelectorAll(".wizard-step").forEach(el => {
        el.classList.remove("active");
    });
    
    const stepEl = document.querySelector(`.wizard-step[data-step="${wizardStep}"]`);
    if (stepEl) stepEl.classList.add("active");
    
    // Enable/disable buttons
    btnWizPrev.disabled = wizardStep === 1;
    btnWizNext.style.display = "inline-block";
    btnWizNext.innerText = wizardStep === 5 ? "Calcola Strategia ✓" : "Avanti →";

    if (wizardStep === 5) {
        renderInterviewSummary();
    }
}

// Save currently input subject to memory list
function saveCurrentSubject(skipUpdateCalc = false) {
    try {
        const nomeEl = document.getElementById("wiz-nome");
        const cognomeEl = document.getElementById("wiz-cognome");
        const nascitaEl = document.getElementById("wiz-nascita");
        const sessoEl = document.getElementById("wiz-sesso");
        const citEl = document.getElementById("wiz-cittadinanza");
        const statoCivEl = document.getElementById("wiz-stato-civile");
        const isOwnerEl = document.getElementById("wiz-immobile-intestatario");
        
        const nome = (nomeEl && nomeEl.value) ? nomeEl.value : `Soggetto ${wizardSubjects.length + 1}`;
        const cognome = (cognomeEl && cognomeEl.value) ? cognomeEl.value : "";
        const birthStr = (nascitaEl && nascitaEl.value) ? nascitaEl.value : "";
        const eta = getAge(birthStr);
        const sesso = sessoEl ? sessoEl.value : "M";
        const cittadinanza = citEl ? citEl.value : "IT";
        const statoCivile = statoCivEl ? statoCivEl.value : "celibe_nubile";
        const isOwner = isOwnerEl ? isOwnerEl.checked : true;
        
        const contract = wizContrattoSelect ? wizContrattoSelect.value : "dipendente_ti";
        let netto = 0;
        let rawBoxData = {};
        
        if (contract === "dipendente_ti" || contract === "pensionato") {
            const p1 = parseFloat(document.getElementById("wiz-cu-1")?.value) || 0;
            const p2 = parseFloat(document.getElementById("wiz-cu-2")?.value) || 0;
            const p6 = parseFloat(document.getElementById("wiz-cu-6")?.value) || 365;
            const p21 = parseFloat(document.getElementById("wiz-cu-21")?.value) || 0;
            const p22 = parseFloat(document.getElementById("wiz-cu-22")?.value) || 0;
            const p26 = parseFloat(document.getElementById("wiz-cu-26")?.value) || 0;
            const p365 = parseFloat(document.getElementById("wiz-cu-365")?.value) || 0;
            
            const netAnnual = (p1 + p2) - (p21 + p22 + p26);
            netto = (p6 > 0) ? (((netAnnual / p6 * 365) / 12) + (p365 / 12)) : 0;
            if (netto <= 0) netto = 2100;
            rawBoxData = { p1, p2, p6, p21, p22, p26, p365 };
        } else if (contract === "dipendente_td") {
            const p2 = parseFloat(document.getElementById("wiz-cutd-2")?.value) || 0;
            const p21 = parseFloat(document.getElementById("wiz-cutd-21")?.value) || 0;
            const p22 = parseFloat(document.getElementById("wiz-cutd-22")?.value) || 0;
            const p26 = parseFloat(document.getElementById("wiz-cutd-26")?.value) || 0;
            const days = parseFloat(document.getElementById("wiz-cutd-days")?.value) || 365;
            
            const netAnnual = p2 - (p21 + p22 + p26);
            netto = (days > 0) ? ((netAnnual / days * 365) / 12) : 0;
            if (netto <= 0) netto = 1800;
            rawBoxData = { p2, p21, p22, p26, days };
        } else if (contract === "autonomo") {
            const regime = document.getElementById("wiz-auto-regime")?.value || "ordinario";
            if (regime === "ordinario") {
                const rn1_1 = parseFloat(document.getElementById("wiz-rn1-anno1")?.value) || 0;
                const rn26_1 = parseFloat(document.getElementById("wiz-rn26-anno1")?.value) || 0;
                const rn1_2 = parseFloat(document.getElementById("wiz-rn1-anno2")?.value) || 0;
                const rn26_2 = parseFloat(document.getElementById("wiz-rn26-anno2")?.value) || 0;
                
                const netY1 = (rn1_1 - rn26_1) / 12;
                const netY2 = (rn1_2 - rn26_2) / 12;
                netto = (netY1 + netY2) / 2;
                if (netto <= 0) netto = 2500;
                rawBoxData = { regime, rn1_1, rn26_1, rn1_2, rn26_2 };
            } else {
                const lm36 = parseFloat(document.getElementById("wiz-lm36")?.value) || 0;
                const lm39 = parseFloat(document.getElementById("wiz-lm39")?.value) || 0;
                netto = (lm36 - lm39) / 12;
                if (netto <= 0) netto = 2200;
                rawBoxData = { regime, lm36, lm39 };
            }
        } else {
            netto = 2000;
        }

        const permScadEl = document.getElementById("wiz-permesso-scadenza");
        const famSedeEl = document.getElementById("wiz-famiglia-sede");
        
        const newSubject = {
            role: currentSubjectRole,
            nome: nome,
            cognome: cognome,
            dataNascita: birthStr,
            eta: eta,
            sesso: sesso,
            cittadinanza: cittadinanza,
            statoCivile: statoCivile,
            isOwner: isOwner,
            tipoContratto: contract,
            netto: Math.max(0, netto),
            rawBoxData: rawBoxData,
            permScadenza: permScadEl ? permScadEl.value : "valido",
            famigliaSede: famSedeEl ? famSedeEl.value : "italia"
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
        
        renderSubjectsChips();
        if (!skipUpdateCalc) {
            updateCalculations();
        }
    } catch (err) {
        console.error("Error in saveCurrentSubject:", err);
    }
}

function renderSubjectsChips() {
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
    document.getElementById("wiz-nome").value = s.nome;
    document.getElementById("wiz-cognome").value = s.cognome;
    document.getElementById("wiz-nascita").value = s.dataNascita;
    document.getElementById("wiz-sesso").value = s.sesso;
    document.getElementById("wiz-cittadinanza").value = s.cittadinanza;
    document.getElementById("wiz-stato-civile").value = s.statoCivile;
    
    document.getElementById("wiz-stato-civile").dispatchEvent(new Event("change"));
    document.getElementById("wiz-cittadinanza").dispatchEvent(new Event("change"));
    
    document.getElementById("wiz-immobile-intestatario").checked = s.isOwner;
    
    // Step 2 values
    wizContrattoSelect.value = s.tipoContratto;
    wizContrattoSelect.dispatchEvent(new Event("change"));
    
    const r = s.rawBoxData || {};
    if (s.tipoContratto === "dipendente_ti" || s.tipoContratto === "pensionato") {
        document.getElementById("wiz-cu-1").value = r.p1 || 0;
        document.getElementById("wiz-cu-2").value = r.p2 || 0;
        document.getElementById("wiz-cu-6").value = r.p6 || 365;
        document.getElementById("wiz-cu-21").value = r.p21 || 0;
        document.getElementById("wiz-cu-22").value = r.p22 || 0;
        document.getElementById("wiz-cu-26").value = r.p26 || 0;
        document.getElementById("wiz-cu-365").value = r.p365 || 0;
    } else if (s.tipoContratto === "dipendente_td") {
        document.getElementById("wiz-cutd-2").value = r.p2 || 0;
        document.getElementById("wiz-cutd-21").value = r.p21 || 0;
        document.getElementById("wiz-cutd-22").value = r.p22 || 0;
        document.getElementById("wiz-cutd-26").value = r.p26 || 0;
        document.getElementById("wiz-cutd-days").value = r.days || 365;
    } else if (s.tipoContratto === "autonomo") {
        document.getElementById("wiz-auto-regime").value = r.regime || "ordinario";
        document.getElementById("wiz-auto-regime").dispatchEvent(new Event("change"));
        if (r.regime === "ordinario") {
            document.getElementById("wiz-rn1-anno1").value = r.rn1_1 || 0;
            document.getElementById("wiz-rn26-anno1").value = r.rn26_1 || 0;
            document.getElementById("wiz-rn1-anno2").value = r.rn1_2 || 0;
            document.getElementById("wiz-rn26-anno2").value = r.rn26_2 || 0;
        } else {
            document.getElementById("wiz-lm36").value = r.lm36 || 0;
            document.getElementById("wiz-lm39").value = r.lm39 || 0;
        }
    }
    
    document.getElementById("step-personal-title").innerText = `Modifica Anagrafica (${s.role})`;
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
    const abitaTipo = document.getElementById("wiz-abita-tipo").value;
    const rentVal = parseFloat(document.getElementById("wiz-abita-affitto-valore").value) || 0;
    const hasMutuo = document.getElementById("wiz-abita-mutuo").value === "si";
    const mutuoEstinto = document.getElementById("wiz-abita-mutuo-estinto").value === "si";
    const mutuoRata = parseFloat(document.getElementById("wiz-abita-mutuo-rata").value) || 0;
    
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
    const hasPign = document.getElementById("wiz-pignoramenti").value === "si";
    const hasRitardi = document.getElementById("wiz-ritardi").value === "si";
    if (hasPign || hasRitardi) {
        html += `<div style="color:var(--danger); font-weight:bold; margin-top:1rem;">⚠️ Segnalazioni Negative: ${hasPign ? 'Pignoramenti in corso' : ''} ${hasRitardi ? 'Ritardi di pagamento passati' : ''} (KO Strategico)</div>`;
    }
    
    summaryContainer.innerHTML = html;
}


window.removeSubject = function(idx) {
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
    document.getElementById("wiz-nome").value = "";
    document.getElementById("wiz-cognome").value = "";
    document.getElementById("wiz-nascita").value = "1994-07-17";
    document.getElementById("wiz-stato-civile").value = "celibe_nubile";
    document.getElementById("wiz-figli").value = "no";
    document.getElementById("wiz-cittadinanza").value = "IT";
    document.getElementById("wiz-contratto").value = "dipendente_ti";
    document.getElementById("wiz-anzianita").value = "12";
    document.getElementById("wiz-azienda-nome").value = "";
    document.getElementById("wiz-azienda-piva").value = "";
    document.getElementById("wiz-immobile-intestatario").checked = true;
    
    // Trigger visual updates for conditionals
    document.getElementById("wiz-cond-sposato").style.display = "none";
    document.getElementById("wiz-cond-divorziato").style.display = "none";
    document.getElementById("wiz-num-figli-group").style.display = "none";
    document.getElementById("wiz-cond-figli-dettaglio").style.display = "none";
    document.getElementById("wiz-cond-extracom").style.display = "none";
    
    wizContrattoSelect.dispatchEvent(new Event("change"));
    
    document.getElementById("step-personal-title").innerText = `Inserimento Anagrafica (${currentSubjectRole})`;
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

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        handleUploadedFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleUploadedFile(e.target.files[0]);
    }
});

function handleUploadedFile(file) {
    const filename = file.name.toLowerCase();
    
    filesList.innerHTML = `
        <div class="file-item">
            <span>📄 ${file.name}</span>
            <span class="remove-file" onclick="clearFiles()">Rimuovi</span>
        </div>
    `;
    
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
    filesList.innerHTML = "";
    fileInput.value = "";
    updateCalculations();
}

// Demo profiles buttons listeners (if present)
const btnDemoDip = document.getElementById("btn-demo-dipendente");
if (btnDemoDip) {
    btnDemoDip.addEventListener("click", () => handleUploadedFile({ name: "cu 2026.pdf" }));
}

const btnDemoAuto = document.getElementById("btn-demo-autonomo");
if (btnDemoAuto) {
    btnDemoAuto.addEventListener("click", () => handleUploadedFile({ name: "EL KOTNI HANANE PF 2026.pdf" }));
}

const btnDemoComb = document.getElementById("btn-demo-combined");
if (btnDemoComb) {
    btnDemoComb.addEventListener("click", () => {
        inputC1Eta.value = 32;
        inputC1TipoReddito.value = "dipendente_ti";
        inputC1Netto.value = 2100.70;
        
        cointestazioneCheckbox.checked = true;
        req2Section.style.display = "block";
        req1Title.innerText = "2. Primo Richiedente";
        
        inputC2Eta.value = 40;
        inputC2TipoReddito.value = "autonomo";
        inputC2Netto.value = 3769.92;
        
        // Sim parameters
        inputPersoneNucleo.value = 4;
        inputAltreRate.value = 400;
        inputValoreImmobile.value = 200000;
        inputImportoMutuo.value = 160000;
        inputDurata.value = 25;
        inputZona.value = "nord";
        inputFinalita.value = "acquisto";
        inputTipoTasso.value = "any";
        inputClasseEnergetica.value = "other";
        
        inputProvImmobile.value = "Milano";
        inputProvResidenza.value = "Monza";
        inputProvLavoro.value = "Milano";
        
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
            document.getElementById("wiz-costo-casa").value = 200000;
            document.getElementById("wiz-importo-mutuo").value = 160000;
            document.getElementById("wiz-durata").value = 25;
            document.getElementById("wiz-tasso-tipo").value = "any";
            document.getElementById("wiz-classe-en").value = "other";
            document.getElementById("wiz-zona").value = "nord";
            document.getElementById("wiz-prov-immobile").value = "Milano";
            document.getElementById("wiz-prov-residenza").value = "Monza";
            document.getElementById("wiz-prov-lavoro").value = "Milano";
            document.getElementById("wiz-num-figli").value = 2; // 2 subjects + 2 children = 4 members
            goToStep(3);
        }
        
        clearFiles();
        updateCalculations();
    });
}

document.getElementById("btn-reset").addEventListener("click", () => {
    hasSubmittedStrategy = false;
    // 1. Reset forms
    document.getElementById("pratica-form").reset();
    cointestazioneCheckbox.checked = false;
    req2Section.style.display = "none";
    req1Title.innerText = "2. Dettagli Richiedente";
    
    // 2. Clear uploaded files UI
    filesList.innerHTML = "";
    fileInput.value = "";

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
    inputValoreImmobile.value = 200000;
    inputImportoMutuo.value = 160000;
    inputDurata.value = 25;
    inputTipoTasso.value = "any";
    inputClasseEnergetica.value = "other";
    inputAltreRate.value = 0;
    inputPersoneNucleo.value = 1;
    inputZona.value = "nord";
    inputFinalita.value = "acquisto";
    
    inputC1Eta.value = 35;
    inputC1TipoReddito.value = "dipendente_ti";
    inputC1Netto.value = 2000;
    
    inputC2Eta.value = 35;
    inputC2TipoReddito.value = "dipendente_ti";
    inputC2Netto.value = 0;

    inputProvImmobile.value = "Milano";
    inputProvResidenza.value = "Milano";
    inputProvLavoro.value = "Milano";
    
    // Default rate benchmarks
    inputBaseEuribor1m.value = 3.25;
    inputBaseEuribor3m.value = 3.35;
    inputBaseIrs.value = 2.70;
    inputBaseBce.value = 3.75;
    
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
    const listToRender = (items && items.length > 0) ? items : (comuniData.slice(0, 50));
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

function setupDynamicComuniAutocomplete() {
    const inputIds = ["prov-immobile", "prov-residenza", "prov-lavoro", "wiz-prov-immobile", "wiz-prov-residenza", "wiz-prov-lavoro"];
    
    function updateDatalist(inputEl) {
        if (!inputEl || !comuniData.length) return;
        const val = inputEl.value.trim().toLowerCase();
        if (val.length < 2) {
            populateComuniDatalist(comuniData.slice(0, 50));
            return;
        }
        const matches = [];
        for (let i = 0; i < comuniData.length && matches.length < 50; i++) {
            const c = comuniData[i];
            if (c.name && c.name.toLowerCase().includes(val)) {
                matches.push(c);
            }
        }
        populateComuniDatalist(matches);
    }

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => updateDatalist(el));
            el.addEventListener("focus", () => updateDatalist(el));
        }
    });
}

async function loadDatabases() {
    try {
        const [comuniRes, policiesRes, productsRes] = await Promise.all([
            fetch("data/comuni.json"),
            fetch("data/policies.json"),
            fetch("data/products.json")
        ]);
        comuniData = await comuniRes.json();
        policiesData = await policiesRes.json();
        productsData = await productsRes.json();
        
        BrokerFlowEngine.init(policiesData, productsData, comuniData);
        console.log("Databases loaded successfully!");
        
        populateComuniDatalist();
        setupDynamicComuniAutocomplete();
        updateCalculations();
    } catch (err) {
        console.error("Error loading databases:", err);
    }
}

// Initial run on page load
function initApp() {
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
    switchCrmModule("engine");
    loadDatabases();
    updateCalculations();
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
