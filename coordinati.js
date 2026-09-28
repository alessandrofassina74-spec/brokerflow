/**
 * BrokerFlow - Modulo Coordinati & Visibilità Gerarchica (Livelli 1-4)
 * v1.0.0
 */

(function(window) {
    'use strict';

    // State for expanded accordions in the tree
    window._coordinatiExpandedState = {
        areas: {},
        offices: {},
        brokers: {}
    };

    window._coordinatiActiveFilter = {
        searchQuery: "",
        statusFilter: "all",
        brokerEmailFilter: "all"
    };

    function formatNumber(num, dec = 0) {
        if (num === undefined || num === null || isNaN(num)) return "0";
        return parseFloat(num).toLocaleString('it-IT', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }

    function getDeals() {
        if (typeof window.crmDeals !== "undefined" && Array.isArray(window.crmDeals)) {
            return window.crmDeals;
        }
        try {
            const saved = localStorage.getItem("brokerflow_deals");
            if (saved) return JSON.parse(saved) || [];
        } catch(e) {}
        return [];
    }

    function getUsers() {
        if (window.Auth && typeof window.Auth.getUsers === "function") {
            return window.Auth.getUsers();
        }
        try {
            const saved = localStorage.getItem("brokerflow_users_db_v2");
            if (saved) return JSON.parse(saved) || [];
        } catch(e) {}
        return [];
    }

    function getStatusBadgeHtml(status) {
        const s = String(status || "").toLowerCase();
        if (s.includes("delibera") || s.includes("erogato") || s.includes("approv")) {
            return `<span style="background: rgba(16, 185, 129, 0.18); color: #10B981; border: 1px solid #10B981; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">🟢 Deliberata</span>`;
        } else if (s.includes("istruttoria") || s.includes("valutazione")) {
            return `<span style="background: rgba(245, 158, 11, 0.18); color: #F59E0B; border: 1px solid #F59E0B; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">🟡 Istruttoria</span>`;
        } else if (s.includes("ko") || s.includes("rifiut") || s.includes("annull")) {
            return `<span style="background: rgba(239, 68, 68, 0.18); color: #EF4444; border: 1px solid #EF4444; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">🔴 Rifiutata</span>`;
        } else if (s.includes("bozza")) {
            return `<span style="background: rgba(148, 163, 184, 0.18); color: #94A3B8; border: 1px solid #64748B; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">📁 Bozza</span>`;
        }
        return `<span style="background: rgba(0, 210, 255, 0.18); color: #00D2FF; border: 1px solid #00D2FF; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.74rem; font-weight: 800;">🔵 In Lavorazione</span>`;
    }

    function renderDealRowHtml(deal, brokerInfo = null) {
        const importo = deal.importoMutuo || deal.mutuo || 0;
        const valore = deal.valoreImmobile || deal.valore || 0;
        const ltv = (valore > 0 && importo > 0) ? Math.round((importo / valore) * 100) : (deal.ltv || 80);
        const rata = deal.rata || 0;
        const banca = deal.banca || (deal.praticaData && deal.praticaData.banca) || "Da definire";
        const dateStr = deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('it-IT') : "--";
        const bName = brokerInfo ? brokerInfo.name : (deal.brokerName || "Operatore");

        return `
            <div class="coordinati-deal-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem; transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; gap: 0.85rem; min-width: 240px; flex: 1.5;">
                    <div style="background: rgba(0, 210, 255, 0.12); border: 1.5px solid #00D2FF; color: #00D2FF; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.88rem; flex-shrink: 0; box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);">
                        #${deal.id}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <strong style="color: #FFFFFF; font-size: 0.98rem;">${deal.cliente || 'Cliente'}</strong>
                            ${getStatusBadgeHtml(deal.stato || deal.label)}
                        </div>
                        <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                            <span>🏛️ <strong style="color: #00D2FF;">${banca}</strong></span>
                            <span>•</span>
                            <span>📅 ${dateStr}</span>
                            <span>•</span>
                            <span style="background: #11192C; border: 1px solid #1C273E; padding: 0.1rem 0.45rem; border-radius: 4px; color: #CBD5E1; font-weight: 600;">👤 ${bName}</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 1.5rem; flex: 1; justify-content: space-between; min-width: 220px;">
                    <div>
                        <div style="font-size: 0.72rem; color: #94A3B8; font-weight: 600;">Importo Mutuo (LTV ${ltv}%)</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #10B981;">€ ${formatNumber(importo, 0)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.72rem; color: #94A3B8; font-weight: 600;">Rata Mensile</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #FFFFFF;">€ ${formatNumber(rata, 2)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                    <button type="button" class="btn" onclick="window.apriSchedaPratica('${deal.id}')" style="background: #00D2FF; color: #070B14; font-weight: 800; border: none; border-radius: 6px; padding: 0.4rem 0.75rem; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);">
                        🏛️ Avanzamento
                    </button>
                    <button type="button" class="btn" onclick="window.apriDocumentiPratica('${deal.id}')" style="background: #11192C; border: 1.5px solid #00D2FF; color: #00D2FF; font-weight: 700; border-radius: 6px; padding: 0.4rem 0.65rem; font-size: 0.78rem; cursor: pointer;">
                        📑 Documenti
                    </button>
                    <button type="button" class="btn" onclick="window.modificaPreventivo('${deal.id}')" style="background: #11192C; border: 1px solid #1C273E; color: #CBD5E1; font-weight: 700; border-radius: 6px; padding: 0.4rem 0.65rem; font-size: 0.78rem; cursor: pointer;">
                        ✏️ Modifica
                    </button>
                </div>
            </div>
        `;
    }

    // TOGGLE ACCORDION HELPERS
    window.toggleCoordinatiArea = function(areaKey) {
        window._coordinatiExpandedState.areas[areaKey] = !window._coordinatiExpandedState.areas[areaKey];
        window.renderCoordinatiModule();
    };

    window.toggleCoordinatiOffice = function(officeEmail) {
        window._coordinatiExpandedState.offices[officeEmail] = !window._coordinatiExpandedState.offices[officeEmail];
        window.renderCoordinatiModule();
    };

    window.toggleCoordinatiBroker = function(brokerEmail) {
        window._coordinatiExpandedState.brokers[brokerEmail] = !window._coordinatiExpandedState.brokers[brokerEmail];
        window.renderCoordinatiModule();
    };

    window.setCoordinatiBrokerFilter = function(email) {
        window._coordinatiActiveFilter.brokerEmailFilter = email;
        window.renderCoordinatiModule();
    };

    window.setCoordinatiSearch = function(query) {
        window._coordinatiActiveFilter.searchQuery = query.toLowerCase().trim();
        window.renderCoordinatiModule();
    };

    // MAIN RENDER FUNCTION
    window.renderCoordinatiModule = function() {
        const container = document.getElementById("module-coordinati");
        if (!container) return;

        const currentUser = (window.Auth && typeof window.Auth.getCurrentUser === "function") ? window.Auth.getCurrentUser() : null;
        if (!currentUser) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; background: #0D1424; border: 1.5px solid #1C273E; border-radius: 14px;">
                    <span style="font-size: 2.5rem;">🔒</span>
                    <h3 style="color: #FFFFFF; margin: 1rem 0 0.5rem 0;">Accesso Riservato</h3>
                    <p style="color: #94A3B8; font-size: 0.88rem;">Effettua l'accesso per visualizzare la gestione della rete e dei coordinati.</p>
                </div>
            `;
            return;
        }

        const role = currentUser.role || "broker";
        const allUsers = getUsers();
        const allDeals = getDeals();

        // Check permission level (Level 4 and above)
        if (role === "broker") {
            container.innerHTML = `
                <div style="padding: 2.5rem; text-align: center; background: #0D1424; border: 1.5px solid #1C273E; border-radius: 14px; max-width: 600px; margin: 2rem auto;">
                    <span style="font-size: 2.8rem;">👥</span>
                    <h3 style="color: #FFFFFF; margin: 1rem 0 0.5rem 0; font-size: 1.3rem;">Modulo Coordinati Riservato ai Manager</h3>
                    <p style="color: #94A3B8; font-size: 0.88rem; line-height: 1.5;">Il modulo Coordinati è attivo per <strong>Responsabili di Ufficio, Capi Area e Direzione Generale</strong> per monitorare l'andamento della propria squadra.<br>Come Broker puoi gestire tutte le tue operazioni personali nella sezione <strong>📁 Pratiche</strong>.</p>
                    <button type="button" class="btn btn-primary" onclick="window.switchCrmModule('pratiche')" style="margin-top: 1.25rem; background: #00D2FF; color: #070B14; font-weight: 800; padding: 0.65rem 1.4rem; border-radius: 8px; border: none; cursor: pointer;">
                        Vai alle Mie Pratiche ➔
                    </button>
                </div>
            `;
            return;
        }

        let mainHtml = "";

        // =========================================================================
        // CASE 1: LIVELLO 4 - RESPONSABILE DI UFFICIO
        // =========================================================================
        if (role === "responsabile_ufficio") {
            const officeBrokers = allUsers.filter(u => u.role === "broker" && (u.managerEmail || "").toLowerCase() === currentUser.email.toLowerCase());
            const supervisedEmails = [currentUser.email.toLowerCase(), ...officeBrokers.map(b => b.email.toLowerCase())];

            // Filter deals belonging to this office
            let officeDeals = allDeals.filter(d => {
                const bEmail = (d.brokerEmail || "").toLowerCase();
                return supervisedEmails.includes(bEmail) || (d.comune && currentUser.comuneUfficio && d.comune.includes(currentUser.comuneUfficio.split(" ")[0]));
            });

            // Calculate KPIs
            const totalDeals = officeDeals.length;
            const totalVolume = officeDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);
            const inLavorazione = officeDeals.filter(d => (d.stato || "").toLowerCase().includes("lavorazione") || (d.stato || "").toLowerCase().includes("bozza")).length;
            const inIstruttoria = officeDeals.filter(d => (d.stato || "").toLowerCase().includes("istruttoria") || (d.stato || "").toLowerCase().includes("delibera")).length;

            // Apply filters
            let filteredDeals = officeDeals;
            if (window._coordinatiActiveFilter.brokerEmailFilter !== "all") {
                filteredDeals = filteredDeals.filter(d => (d.brokerEmail || "").toLowerCase() === window._coordinatiActiveFilter.brokerEmailFilter.toLowerCase());
            }
            if (window._coordinatiActiveFilter.searchQuery) {
                const q = window._coordinatiActiveFilter.searchQuery;
                filteredDeals = filteredDeals.filter(d => (d.cliente || "").toLowerCase().includes(q) || String(d.id).includes(q) || (d.banca || "").toLowerCase().includes(q));
            }

            mainHtml = `
                <!-- Header Banner -->
                <div style="background: linear-gradient(135deg, #0D1424 0%, #11192C 100%); border: 1.5px solid #10B981; border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.85rem;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); border: 1.5px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #10B981; box-shadow: 0 0 14px rgba(16, 185, 129, 0.3);">
                                🏛️
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                    <h2 style="font-size: 1.4rem; font-weight: 800; color: #FFFFFF; margin: 0;">Coordinamento Ufficio: ${currentUser.officeName || currentUser.comuneUfficio}</h2>
                                    <span style="background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid #10B981; padding: 0.15rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800;">🟢 Resp. Ufficio</span>
                                </div>
                                <p style="color: #94A3B8; font-size: 0.84rem; margin: 0.25rem 0 0 0;">Responsabile: <strong style="color: #F8FAFC;">${currentUser.name}</strong> • Sede: <strong style="color: #00D2FF;">📍 ${currentUser.comuneUfficio}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="dash-kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">👥 Broker nel Team</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #00D2FF; margin-top: 0.25rem;">${officeBrokers.length}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Operativi in filiale</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">📁 Totale Pratiche Ufficio</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #FFFFFF; margin-top: 0.25rem;">${totalDeals}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Team + Pratiche Dirette</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">💶 Volume Mutui Gestito</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #10B981; margin-top: 0.25rem;">€ ${formatNumber(totalVolume, 0)}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Capitale intermediato</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">⚡ In Istruttoria / Delibera</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #F59E0B; margin-top: 0.25rem;">${inIstruttoria}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Pratiche in fase avanzata</div>
                    </div>
                </div>

                <!-- Broker Selection Chips -->
                <div style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.82rem; font-weight: 800; color: #00D2FF; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                        <span>👤</span> <span>Filtra per Componente del Team:</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                        <button type="button" onclick="window.setCoordinatiBrokerFilter('all')" class="btn" style="background: ${window._coordinatiActiveFilter.brokerEmailFilter === 'all' ? '#00D2FF' : '#11192C'}; color: ${window._coordinatiActiveFilter.brokerEmailFilter === 'all' ? '#070B14' : '#E2E8F0'}; border: 1.5px solid ${window._coordinatiActiveFilter.brokerEmailFilter === 'all' ? '#00D2FF' : '#1C273E'}; font-weight: 800; font-size: 0.8rem; padding: 0.4rem 0.85rem; border-radius: 8px; cursor: pointer;">
                            Tutto il Team (${totalDeals})
                        </button>
                        <button type="button" onclick="window.setCoordinatiBrokerFilter('${currentUser.email}')" class="btn" style="background: ${window._coordinatiActiveFilter.brokerEmailFilter === currentUser.email ? '#00D2FF' : '#11192C'}; color: ${window._coordinatiActiveFilter.brokerEmailFilter === currentUser.email ? '#070B14' : '#E2E8F0'}; border: 1.5px solid ${window._coordinatiActiveFilter.brokerEmailFilter === currentUser.email ? '#00D2FF' : '#1C273E'}; font-weight: 700; font-size: 0.8rem; padding: 0.4rem 0.85rem; border-radius: 8px; cursor: pointer;">
                            ⭐ Mie Pratiche Dirette (${officeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === currentUser.email.toLowerCase()).length})
                        </button>
                        ${officeBrokers.map(b => {
                            const count = officeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === b.email.toLowerCase()).length;
                            const isActive = window._coordinatiActiveFilter.brokerEmailFilter.toLowerCase() === b.email.toLowerCase();
                            return `
                                <button type="button" onclick="window.setCoordinatiBrokerFilter('${b.email}')" class="btn" style="background: ${isActive ? '#00D2FF' : '#11192C'}; color: ${isActive ? '#070B14' : '#E2E8F0'}; border: 1.5px solid ${isActive ? '#00D2FF' : '#1C273E'}; font-weight: 700; font-size: 0.8rem; padding: 0.4rem 0.85rem; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
                                    <span>👤</span> <span>${b.name} (${count})</span>
                                </button>
                            `;
                        }).join("")}
                    </div>
                </div>

                <!-- Practices List -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                    <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFFFFF; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
                        <span>📋</span> <span>Elenco Operazioni Gestite (${filteredDeals.length})</span>
                    </h3>
                    <div style="min-width: 220px;">
                        <input type="text" placeholder="🔍 Cerca cliente, banca o ID..." oninput="window.setCoordinatiSearch(this.value)" value="${window._coordinatiActiveFilter.searchQuery || ''}" style="width: 100%; padding: 0.5rem 0.85rem; background: #0D1424; border: 1.5px solid #1C273E; border-radius: 8px; color: #FFFFFF; font-size: 0.82rem; outline: none;">
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${filteredDeals.length > 0 ? filteredDeals.map(d => {
                        const bObj = allUsers.find(u => u.email.toLowerCase() === (d.brokerEmail || '').toLowerCase());
                        return renderDealRowHtml(d, bObj);
                    }).join("") : `
                        <div style="padding: 2rem; text-align: center; background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; color: #94A3B8;">
                            Nessuna pratica trovata con i filtri selezionati.
                        </div>
                    `}
                </div>
            `;
        }

        // =========================================================================
        // CASE 2: LIVELLO 3 - CAPO AREA
        // =========================================================================
        else if (role === "capo_area") {
            const areaOffices = allUsers.filter(u => u.role === "responsabile_ufficio" && (u.capoAreaEmail || "").toLowerCase() === currentUser.email.toLowerCase());
            
            // Collect all brokers under all offices in this area
            const areaBrokers = allUsers.filter(u => u.role === "broker" && areaOffices.some(off => off.email.toLowerCase() === (u.managerEmail || "").toLowerCase()));
            const allAreaEmails = [currentUser.email.toLowerCase(), ...areaOffices.map(o => o.email.toLowerCase()), ...areaBrokers.map(b => b.email.toLowerCase())];

            // Area deals
            const areaDeals = allDeals.filter(d => allAreaEmails.includes((d.brokerEmail || "").toLowerCase()) || (currentUser.areaName && d.areaName === currentUser.areaName));
            const totalDeals = areaDeals.length;
            const totalVolume = areaDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);

            mainHtml = `
                <!-- Header Banner -->
                <div style="background: linear-gradient(135deg, #0D1424 0%, #11192C 100%); border: 1.5px solid #00D2FF; border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem; box-shadow: 0 4px 20px rgba(0, 210, 255, 0.18);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.85rem;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0, 210, 255, 0.2); border: 1.5px solid #00D2FF; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #00D2FF; box-shadow: 0 0 14px rgba(0, 210, 255, 0.35);">
                                🗺️
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                    <h2 style="font-size: 1.4rem; font-weight: 800; color: #FFFFFF; margin: 0;">Coordinamento: ${currentUser.areaName || 'Area Commerciale'}</h2>
                                    <span style="background: rgba(0, 210, 255, 0.2); color: #00D2FF; border: 1px solid #00D2FF; padding: 0.15rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800;">🔵 Capo Area</span>
                                </div>
                                <p style="color: #94A3B8; font-size: 0.84rem; margin: 0.25rem 0 0 0;">Area Manager: <strong style="color: #F8FAFC;">${currentUser.name}</strong> • Sede Direzionale: <strong style="color: #00D2FF;">📍 ${currentUser.comuneUfficio}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="dash-kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">🏛️ Uffici Presidiati</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #00D2FF; margin-top: 0.25rem;">${areaOffices.length}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Filiali coordinate</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">👥 Forza Commerciale</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #38BDF8; margin-top: 0.25rem;">${areaBrokers.length + areaOffices.length}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">${areaOffices.length} Resp. + ${areaBrokers.length} Broker</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">📁 Totale Pratiche Area</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #FFFFFF; margin-top: 0.25rem;">${totalDeals}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Tutti gli uffici</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">💶 Volume Erogato Area</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #10B981; margin-top: 0.25rem;">€ ${formatNumber(totalVolume, 0)}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Intermediato complessivo</div>
                    </div>
                </div>

                <!-- Tree: Offices of this Area -->
                <div style="margin-top: 1.5rem;">
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: #FFFFFF; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.45rem;">
                        <span>🏛️</span> <span>Struttura Operativa Uffici &amp; Broker dell'Area</span>
                    </h3>

                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${areaOffices.map(office => {
                            const isOfficeOpen = window._coordinatiExpandedState.offices[office.email] !== false; // Default open
                            const officeBrokers = allUsers.filter(u => u.role === "broker" && (u.managerEmail || "").toLowerCase() === office.email.toLowerCase());
                            const officeEmails = [office.email.toLowerCase(), ...officeBrokers.map(b => b.email.toLowerCase())];
                            const currOfficeDeals = areaDeals.filter(d => officeEmails.includes((d.brokerEmail || '').toLowerCase()));
                            const currOfficeVolume = currOfficeDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);

                            return `
                                <div style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; overflow: hidden;">
                                    <!-- Office Header Accordion Bar -->
                                    <div onclick="window.toggleCoordinatiOffice('${office.email}')" style="background: #11192C; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: ${isOfficeOpen ? '1px solid #1C273E' : 'none'}; flex-wrap: wrap; gap: 0.75rem;">
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <span style="font-size: 1.3rem;">🏛️</span>
                                            <div>
                                                <strong style="font-size: 1.05rem; color: #FFFFFF; display: block;">${office.officeName || 'Sede'} - 📍 ${office.comuneUfficio}</strong>
                                                <span style="font-size: 0.78rem; color: #94A3B8;">Responsabile: <strong style="color: #4ADE80;">${office.name}</strong> • ${officeBrokers.length} Broker assegnati</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 1rem;">
                                            <div style="text-align: right;">
                                                <div style="font-size: 0.95rem; font-weight: 800; color: #10B981;">€ ${formatNumber(currOfficeVolume, 0)}</div>
                                                <div style="font-size: 0.72rem; color: #94A3B8;">${currOfficeDeals.length} pratiche</div>
                                            </div>
                                            <button type="button" class="btn" style="background: rgba(0,210,255,0.15); border: 1px solid #00D2FF; color: #00D2FF; font-size: 0.78rem; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 6px;">
                                                ${isOfficeOpen ? '▲ Comprimi' : '▼ Esplodi Ufficio'}
                                            </button>
                                        </div>
                                    </div>

                                    ${isOfficeOpen ? `
                                        <div style="padding: 1.25rem; background: #070B14; display: flex; flex-direction: column; gap: 1rem;">
                                            
                                            <!-- Direct Deals of Responsabile -->
                                            <div style="background: #0D1424; border: 1px solid #1C273E; border-radius: 10px; padding: 1rem;">
                                                <div style="font-size: 0.85rem; font-weight: 800; color: #4ADE80; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.4rem;">
                                                    <span>⭐</span> <span>Pratiche Dirette del Responsabile: ${office.name}</span>
                                                </div>
                                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                                    ${currOfficeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === office.email.toLowerCase()).length > 0 ? 
                                                        currOfficeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === office.email.toLowerCase()).map(d => renderDealRowHtml(d, office)).join("") :
                                                        `<div style="font-size: 0.78rem; color: #64748B; font-style: italic;">Nessuna pratica diretta gestita dal responsabile.</div>`
                                                    }
                                                </div>
                                            </div>

                                            <!-- Brokers of this Office -->
                                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                                <div style="font-size: 0.85rem; font-weight: 800; color: #00D2FF; display: flex; align-items: center; gap: 0.4rem;">
                                                    <span>👥</span> <span>Broker Coordinati dell'Ufficio (${officeBrokers.length}):</span>
                                                </div>

                                                ${officeBrokers.map(broker => {
                                                    const isBrokerOpen = window._coordinatiExpandedState.brokers[broker.email] !== false;
                                                    const bDeals = currOfficeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === broker.email.toLowerCase());
                                                    const bVol = bDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);

                                                    return `
                                                        <div style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 10px; overflow: hidden;">
                                                            <div onclick="window.toggleCoordinatiBroker('${broker.email}')" style="background: #11192C; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: ${isBrokerOpen ? '1px solid #1C273E' : 'none'}; flex-wrap: wrap; gap: 0.5rem;">
                                                                <div style="display: flex; align-items: center; gap: 0.6rem;">
                                                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #00D2FF; color: #070B14; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.78rem;">
                                                                        ${broker.initials || 'BK'}
                                                                    </div>
                                                                    <div>
                                                                        <strong style="color: #FFFFFF; font-size: 0.92rem;">${broker.name}</strong>
                                                                        <span style="font-size: 0.75rem; color: #94A3B8; margin-left: 0.5rem;">${broker.email}</span>
                                                                    </div>
                                                                </div>
                                                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                                    <div style="text-align: right;">
                                                                        <strong style="color: #10B981; font-size: 0.88rem;">€ ${formatNumber(bVol, 0)}</strong>
                                                                        <span style="font-size: 0.72rem; color: #94A3B8; margin-left: 0.4rem;">(${bDeals.length} pratiche)</span>
                                                                    </div>
                                                                    <button type="button" class="btn" style="background: #1C273E; color: #E2E8F0; font-size: 0.74rem; padding: 0.25rem 0.6rem; border-radius: 6px; border: 1px solid #334155;">
                                                                        ${isBrokerOpen ? '▲ Chiudi' : '▼ Esplodi Operazioni'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            ${isBrokerOpen ? `
                                                                <div style="padding: 0.85rem; background: #070B14; display: flex; flex-direction: column; gap: 0.5rem;">
                                                                    ${bDeals.length > 0 ? bDeals.map(d => renderDealRowHtml(d, broker)).join("") : `
                                                                        <div style="font-size: 0.78rem; color: #64748B; font-style: italic; padding: 0.5rem;">Nessuna operazione registrata per questo broker.</div>
                                                                    `}
                                                                </div>
                                                            ` : ''}
                                                        </div>
                                                    `;
                                                }).join("")}
                                            </div>

                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // CASE 3: LIVELLO 1 & 2 - DIREZIONE GENERALE & SUPER ADMIN
        // =========================================================================
        else {
            const areaManagers = allUsers.filter(u => u.role === "capo_area");
            const totalDeals = allDeals.length;
            const totalVolume = allDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);
            const totalOffices = allUsers.filter(u => u.role === "responsabile_ufficio").length;
            const totalBrokers = allUsers.filter(u => u.role === "broker").length;

            mainHtml = `
                <!-- Header Banner -->
                <div style="background: linear-gradient(135deg, #0D1424 0%, #11192C 100%); border: 1.5px solid #F59E0B; border-radius: 14px; padding: 1.5rem; margin-bottom: 1.75rem; box-shadow: 0 4px 24px rgba(245, 158, 11, 0.15);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.85rem;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245, 158, 11, 0.2); border: 1.5px solid #F59E0B; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #F59E0B; box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);">
                                👑
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                    <h2 style="font-size: 1.4rem; font-weight: 800; color: #FFFFFF; margin: 0;">Organigramma Esecutivo &amp; Monitoraggio Globale Rete</h2>
                                    <span style="background: rgba(245, 158, 11, 0.2); color: #F59E0B; border: 1px solid #F59E0B; padding: 0.15rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800;">🟡 Direzione Generale</span>
                                </div>
                                <p style="color: #94A3B8; font-size: 0.84rem; margin: 0.25rem 0 0 0;">Visualizzazione completa e drill-down a cascata: <strong>Area Manager ➔ Responsabili Ufficio ➔ Broker ➔ Operazioni</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- National KPI Cards -->
                <div class="dash-kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">🗺️ Aree Territoriali</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #00D2FF; margin-top: 0.25rem;">${areaManagers.length}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Macro-aree coordinate</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">🏛️ Uffici &amp; Filiali</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #10B981; margin-top: 0.25rem;">${totalOffices}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Sedi comunali attive</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">👥 Totale Broker &amp; Manager</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #F59E0B; margin-top: 0.25rem;">${allUsers.length}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">${totalBrokers} Broker accreditati</div>
                    </div>
                    <div class="dash-kpi-card" style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; padding: 1.15rem;">
                        <div style="font-size: 0.78rem; color: #94A3B8; font-weight: 700;">💶 Volume Rete Nazionale</div>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #4ADE80; margin-top: 0.25rem;">€ ${formatNumber(totalVolume, 0)}</div>
                        <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">${totalDeals} pratiche complessive</div>
                    </div>
                </div>

                <!-- 3-Level Explodable Tree: Area Managers -> Offices -> Brokers -> Operations -->
                <div style="margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                        <h3 style="font-size: 1.2rem; font-weight: 800; color: #FFFFFF; margin: 0; display: flex; align-items: center; gap: 0.45rem;">
                            <span>🏢</span> <span>Albero Gerarchico Area Manager (Clicca per esplodere)</span>
                        </h3>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                        ${areaManagers.map(areaManager => {
                            const areaKey = areaManager.email;
                            const isAreaOpen = window._coordinatiExpandedState.areas[areaKey] !== false; // Default open
                            
                            // Find offices under this area manager
                            const areaOffices = allUsers.filter(u => u.role === "responsabile_ufficio" && (u.capoAreaEmail || "").toLowerCase() === areaManager.email.toLowerCase());
                            const areaBrokers = allUsers.filter(u => u.role === "broker" && areaOffices.some(off => off.email.toLowerCase() === (u.managerEmail || "").toLowerCase()));
                            const areaEmails = [areaManager.email.toLowerCase(), ...areaOffices.map(o => o.email.toLowerCase()), ...areaBrokers.map(b => b.email.toLowerCase())];

                            const currAreaDeals = allDeals.filter(d => areaEmails.includes((d.brokerEmail || '').toLowerCase()) || (d.areaName && d.areaName === areaManager.areaName));
                            const currAreaVolume = currAreaDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);

                            return `
                                <div style="background: #0D1424; border: 2px solid ${isAreaOpen ? '#00D2FF' : '#1C273E'}; border-radius: 14px; overflow: hidden; box-shadow: ${isAreaOpen ? '0 0 20px rgba(0, 210, 255, 0.15)' : 'none'};">
                                    
                                    <!-- Area Manager Header Bar -->
                                    <div onclick="window.toggleCoordinatiArea('${areaKey}')" style="background: #11192C; padding: 1.15rem 1.4rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: ${isAreaOpen ? '1.5px solid #1C273E' : 'none'}; flex-wrap: wrap; gap: 1rem;">
                                        <div style="display: flex; align-items: center; gap: 0.85rem;">
                                            <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(0,210,255,0.15); border: 1.5px solid #00D2FF; color: #00D2FF; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                                🗺️
                                            </div>
                                            <div>
                                                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                                    <strong style="font-size: 1.1rem; color: #FFFFFF;">${areaManager.areaName || 'Macro Area'}</strong>
                                                    <span style="background: rgba(0,210,255,0.2); color: #00D2FF; border: 1px solid #00D2FF; padding: 0.15rem 0.5rem; border-radius: 5px; font-size: 0.72rem; font-weight: 800;">Area Manager</span>
                                                </div>
                                                <span style="font-size: 0.82rem; color: #94A3B8;">Capo Area: <strong style="color: #F8FAFC;">${areaManager.name}</strong> (${areaManager.email}) • 📍 Sede: ${areaManager.comuneUfficio}</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 1.25rem;">
                                            <div style="text-align: right;">
                                                <div style="font-size: 1.1rem; font-weight: 800; color: #10B981;">€ ${formatNumber(currAreaVolume, 0)}</div>
                                                <div style="font-size: 0.75rem; color: #94A3B8;">${currAreaDeals.length} pratiche • ${areaOffices.length} Uffici • ${areaBrokers.length} Broker</div>
                                            </div>
                                            <button type="button" class="btn" style="background: #00D2FF; color: #070B14; font-size: 0.82rem; font-weight: 800; padding: 0.45rem 0.95rem; border-radius: 8px; border: none; box-shadow: 0 0 12px rgba(0,210,255,0.3);">
                                                ${isAreaOpen ? '▲ Comprimi Area' : '📂 Esplodi Area'}
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Expanded Area Content -->
                                    ${isAreaOpen ? `
                                        <div style="padding: 1.25rem; background: #070B14; display: flex; flex-direction: column; gap: 1.25rem;">
                                            
                                            <!-- Direct Area Manager Deals -->
                                            ${currAreaDeals.filter(d => (d.brokerEmail || '').toLowerCase() === areaManager.email.toLowerCase()).length > 0 ? `
                                                <div style="background: #0D1424; border: 1.5px solid #00D2FF; border-radius: 12px; padding: 1rem;">
                                                    <div style="font-size: 0.88rem; font-weight: 800; color: #00D2FF; margin-bottom: 0.75rem;">⭐ Pratiche Dirette del Capo Area (${areaManager.name})</div>
                                                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                                        ${currAreaDeals.filter(d => (d.brokerEmail || '').toLowerCase() === areaManager.email.toLowerCase()).map(d => renderDealRowHtml(d, areaManager)).join("")}
                                                    </div>
                                                </div>
                                            ` : ''}

                                            <!-- Offices under Area Manager -->
                                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                                <div style="font-size: 0.88rem; font-weight: 800; color: #F59E0B; display: flex; align-items: center; gap: 0.4rem;">
                                                    <span>🏛️</span> <span>Responsabili di Ufficio dell'${areaManager.areaName} (${areaOffices.length}):</span>
                                                </div>

                                                ${areaOffices.map(office => {
                                                    const isOfficeOpen = window._coordinatiExpandedState.offices[office.email] !== false;
                                                    const officeBrokers = allUsers.filter(u => u.role === "broker" && (u.managerEmail || "").toLowerCase() === office.email.toLowerCase());
                                                    const officeEmails = [office.email.toLowerCase(), ...officeBrokers.map(b => b.email.toLowerCase())];
                                                    const currOfficeDeals = currAreaDeals.filter(d => officeEmails.includes((d.brokerEmail || '').toLowerCase()));
                                                    const currOfficeVolume = currOfficeDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);

                                                    return `
                                                        <div style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 12px; overflow: hidden; margin-left: 0.5rem;">
                                                            
                                                            <!-- Office Bar -->
                                                            <div onclick="window.toggleCoordinatiOffice('${office.email}')" style="background: #11192C; padding: 0.95rem 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: ${isOfficeOpen ? '1px solid #1C273E' : 'none'}; flex-wrap: wrap; gap: 0.75rem;">
                                                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                                    <span style="font-size: 1.3rem;">🏛️</span>
                                                                    <div>
                                                                        <strong style="color: #FFFFFF; font-size: 1rem;">${office.officeName || 'Sede'} - 📍 ${office.comuneUfficio}</strong>
                                                                        <div style="font-size: 0.78rem; color: #94A3B8;">Responsabile: <strong style="color: #4ADE80;">${office.name}</strong> • ${officeBrokers.length} Broker</div>
                                                                    </div>
                                                                </div>
                                                                <div style="display: flex; align-items: center; gap: 1rem;">
                                                                    <div style="text-align: right;">
                                                                        <strong style="color: #10B981; font-size: 0.95rem;">€ ${formatNumber(currOfficeVolume, 0)}</strong>
                                                                        <span style="font-size: 0.72rem; color: #94A3B8; margin-left: 0.35rem;">(${currOfficeDeals.length} pratiche)</span>
                                                                    </div>
                                                                    <button type="button" class="btn" style="background: #1C273E; border: 1.5px solid #334155; color: #E2E8F0; font-size: 0.78rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 6px;">
                                                                        ${isOfficeOpen ? '▲ Chiudi Ufficio' : '📂 Esplodi Ufficio'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <!-- Office Expanded Details -->
                                                            ${isOfficeOpen ? `
                                                                <div style="padding: 1.15rem; background: #050811; display: flex; flex-direction: column; gap: 0.85rem;">
                                                                    
                                                                    <!-- Direct Deals of Responsabile -->
                                                                    ${currOfficeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === office.email.toLowerCase()).length > 0 ? `
                                                                        <div style="background: #0D1424; border: 1px solid #1C273E; border-radius: 10px; padding: 0.85rem;">
                                                                            <div style="font-size: 0.82rem; font-weight: 800; color: #4ADE80; margin-bottom: 0.5rem;">⭐ Pratiche Dirette Responsabile (${office.name})</div>
                                                                            <div style="display: flex; flex-direction: column; gap: 0.45rem;">
                                                                                ${currOfficeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === office.email.toLowerCase()).map(d => renderDealRowHtml(d, office)).join("")}
                                                                            </div>
                                                                        </div>
                                                                    ` : ''}

                                                                    <!-- Brokers Tree inside this office -->
                                                                    <div style="display: flex; flex-direction: column; gap: 0.65rem;">
                                                                        <div style="font-size: 0.82rem; font-weight: 800; color: #00D2FF;">👤 Broker assegnati a ${office.officeName}:</div>

                                                                        ${officeBrokers.map(broker => {
                                                                            const isBrokerOpen = window._coordinatiExpandedState.brokers[broker.email] !== false;
                                                                            const bDeals = currOfficeDeals.filter(d => (d.brokerEmail || '').toLowerCase() === broker.email.toLowerCase());
                                                                            const bVol = bDeals.reduce((sum, d) => sum + (parseFloat(d.importoMutuo || d.mutuo) || 0), 0);

                                                                            return `
                                                                                <div style="background: #0D1424; border: 1.5px solid #1C273E; border-radius: 10px; overflow: hidden; margin-left: 0.5rem;">
                                                                                    
                                                                                    <!-- Broker Bar -->
                                                                                    <div onclick="window.toggleCoordinatiBroker('${broker.email}')" style="background: #11192C; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: ${isBrokerOpen ? '1px solid #1C273E' : 'none'}; flex-wrap: wrap; gap: 0.5rem;">
                                                                                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                                                                                            <div style="width: 32px; height: 32px; border-radius: 50%; background: #00D2FF; color: #070B14; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.78rem;">
                                                                                                ${broker.initials || 'BK'}
                                                                                            </div>
                                                                                            <div>
                                                                                                <strong style="color: #FFFFFF; font-size: 0.92rem;">${broker.name}</strong>
                                                                                                <span style="font-size: 0.75rem; color: #94A3B8; margin-left: 0.5rem;">${broker.email}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                                                            <div style="text-align: right;">
                                                                                                <strong style="color: #10B981; font-size: 0.88rem;">€ ${formatNumber(bVol, 0)}</strong>
                                                                                                <span style="font-size: 0.72rem; color: #94A3B8; margin-left: 0.35rem;">(${bDeals.length} pratiche)</span>
                                                                                            </div>
                                                                                            <button type="button" class="btn" style="background: rgba(0,210,255,0.15); border: 1px solid #00D2FF; color: #00D2FF; font-size: 0.74rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px;">
                                                                                                ${isBrokerOpen ? '▲ Chiudi' : '📂 Esplodi Operazioni'}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>

                                                                                    <!-- Broker Operations List -->
                                                                                    ${isBrokerOpen ? `
                                                                                        <div style="padding: 0.85rem; background: #070B14; display: flex; flex-direction: column; gap: 0.5rem;">
                                                                                            ${bDeals.length > 0 ? bDeals.map(d => renderDealRowHtml(d, broker)).join("") : `
                                                                                                <div style="font-size: 0.78rem; color: #64748B; font-style: italic; padding: 0.5rem;">Nessuna operazione registrata per questo broker.</div>
                                                                                            `}
                                                                                        </div>
                                                                                    ` : ''}
                                                                                </div>
                                                                            `;
                                                                        }).join("")}
                                                                    </div>

                                                                </div>
                                                            ` : ''}
                                                        </div>
                                                    `;
                                                }).join("")}
                                            </div>

                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        }

        container.innerHTML = mainHtml;
    };

    // Auto-init on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            if (window.renderCoordinatiModule) window.renderCoordinatiModule();
        });
    }

})(window);
