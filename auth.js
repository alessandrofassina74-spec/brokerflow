/**
 * BrokerFlow - Modulo di Autenticazione & RBAC Gerarchico a 5 Livelli
 * v1.0.0
 */

(function(window) {
    'use strict';

    // 1. CONFIGURAZIONE RUOLI & GERARCHIA
    const ROLES = {
        super_admin: {
            key: "super_admin",
            level: 1,
            label: "Super Admin",
            badgeClass: "role-super-admin",
            icon: "🟣",
            color: "#9333ea",
            bgColor: "#f3e8ff",
            borderColor: "#d8b4fe",
            description: "Accesso totale a sistema, tassi, configurazioni, sviluppo e gestione utenti"
        },
        direzione: {
            key: "direzione",
            level: 2,
            label: "Direzione Generale",
            badgeClass: "role-direzione",
            icon: "🟡",
            color: "#b45309",
            bgColor: "#fef3c7",
            borderColor: "#fde68a",
            description: "Visualizzazione globale di tutte le aree, uffici e pratiche aziendali"
        },
        capo_area: {
            key: "capo_area",
            level: 3,
            label: "Capo Area",
            badgeClass: "role-capo-area",
            icon: "🔵",
            color: "#1d4ed8",
            bgColor: "#dbeafe",
            borderColor: "#bfdbfe",
            description: "Visualizzazione di tutti gli uffici e consulenti dell'area geografica assegnata"
        },
        responsabile_ufficio: {
            key: "responsabile_ufficio",
            level: 4,
            label: "Resp. Ufficio",
            badgeClass: "role-resp-ufficio",
            icon: "🟢",
            color: "#15803d",
            bgColor: "#dcfce7",
            borderColor: "#bbf7d0",
            description: "Visualizzazione di tutti i consulenti e pratiche della propria filiale"
        },
        broker: {
            key: "broker",
            level: 5,
            label: "Broker / Consulente",
            badgeClass: "role-broker",
            icon: "⚪",
            color: "#475569",
            bgColor: "#f1f5f9",
            borderColor: "#cbd5e1",
            description: "Visualizzazione limitata esclusivamente alle proprie pratiche personali"
        }
    };

    // 2. CONFIGURAZIONE AREE & UFFICI
    const AREAS = {
        area_nord: { id: "area_nord", name: "Area Nord (Lombardia, Veneto, Piemonte)" },
        area_centro: { id: "area_centro", name: "Area Centro (Lazio, Toscana, Emilia-R.)" },
        area_sud: { id: "area_sud", name: "Area Sud & Isole (Campania, Puglia, Sicilia)" }
    };

    const OFFICES = {
        ufficio_milano: { id: "ufficio_milano", name: "Sede Milano Centro", areaId: "area_nord" },
        ufficio_padova: { id: "ufficio_padova", name: "Filiale Padova & Veneto", areaId: "area_nord" },
        ufficio_roma: { id: "ufficio_roma", name: "Sede Roma Eur", areaId: "area_centro" },
        ufficio_firenze: { id: "ufficio_firenze", name: "Filiale Firenze Centro", areaId: "area_centro" },
        ufficio_napoli: { id: "ufficio_napoli", name: "Sede Napoli City", areaId: "area_sud" }
    };

    // 3. SEED UTENTI PREDEFINITI PER TEST
    const DEFAULT_USERS = [
        {
            email: "dev@brokerflow.it",
            password: "1604",
            name: "Alessandro Fassina",
            initials: "AF",
            role: "super_admin",
            areaId: "area_nord",
            ufficioId: "ufficio_milano",
            phone: "+39 02 8900 1100",
            avatar: null,
            createdAt: "2026-01-01"
        },
        {
            email: "direzione@societa.it",
            password: "dir",
            name: "Dott. Mario Rossi",
            initials: "MR",
            role: "direzione",
            areaId: "area_nord",
            ufficioId: "ufficio_milano",
            phone: "+39 02 8900 1101",
            avatar: null,
            createdAt: "2026-01-01"
        },
        {
            email: "capoarea.nord@societa.it",
            password: "nord",
            name: "Roberto Bianchi",
            initials: "RB",
            role: "capo_area",
            areaId: "area_nord",
            ufficioId: "ufficio_milano",
            phone: "+39 02 8900 1102",
            avatar: null,
            createdAt: "2026-01-10"
        },
        {
            email: "resp.milano@societa.it",
            password: "resp",
            name: "Elena Verdi",
            initials: "EV",
            role: "responsabile_ufficio",
            areaId: "area_nord",
            ufficioId: "ufficio_milano",
            phone: "+39 02 8900 1103",
            avatar: null,
            createdAt: "2026-01-15"
        },
        {
            email: "broker.rossi@societa.it",
            password: "rossi",
            name: "Marco Rossi (Broker)",
            initials: "MR",
            role: "broker",
            areaId: "area_nord",
            ufficioId: "ufficio_milano",
            phone: "+39 02 8900 1104",
            avatar: null,
            createdAt: "2026-02-01"
        },
        {
            email: "broker.bianchi@societa.it",
            password: "roma",
            name: "Luca Bianchi (Broker)",
            initials: "LB",
            role: "broker",
            areaId: "area_centro",
            ufficioId: "ufficio_roma",
            phone: "+39 06 6900 2201",
            avatar: null,
            createdAt: "2026-02-05"
        }
    ];

    // GESTIONE DATABASE UTENTI IN LOCALSTORAGE
    const USERS_STORAGE_KEY = "brokerflow_users_db_v1";
    const SESSION_STORAGE_KEY = "brokerflow_active_session_v1";
    const LOCK_STORAGE_KEY = "brokerflow_is_locked_v1";

    function getUsers() {
        try {
            const saved = localStorage.getItem(USERS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const devUser = parsed.find(u => u.email && u.email.toLowerCase() === "dev@brokerflow.it");
                    if (devUser && devUser.password !== "1604") {
                        devUser.password = "1604";
                        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
                    }
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Error reading users db:", e);
        }
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        return [...DEFAULT_USERS];
    }

    function saveUsers(users) {
        try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        } catch (e) {
            console.error("Error saving users db:", e);
        }
    }

    // 4. AUTENTICAZIONE & SESSIONE
    const Auth = {
        ROLES,
        AREAS,
        OFFICES,

        init() {
            getUsers(); // seed if missing
            let session = this.getCurrentUser();
            if (!session) {
                // Default to Super Admin on initial load for immediate full access
                const defaultUser = getUsers().find(u => u.email === "dev@brokerflow.it");
                if (defaultUser) {
                    const sessionData = {
                        email: defaultUser.email,
                        name: defaultUser.name,
                        initials: defaultUser.initials,
                        role: defaultUser.role,
                        areaId: defaultUser.areaId,
                        ufficioId: defaultUser.ufficioId,
                        phone: defaultUser.phone,
                        loginTime: new Date().toISOString()
                    };
                    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
                    session = sessionData;
                }
            }

            if (session) {
                this.updateUIForUser(session);
                if (this.isScreenLocked()) {
                    this.showLockScreen();
                } else {
                    this.hideLoginScreen();
                }
            } else {
                this.showLoginScreen();
            }
            this.setupAutoLock();
        },

        getCurrentUser() {
            try {
                const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
                if (sessionStr) {
                    return JSON.parse(sessionStr);
                }
            } catch (e) {
                console.error("Error parsing current session:", e);
            }
            return null;
        },

        login(email, password, rememberMe = true) {
            const users = getUsers();
            const cleanEmail = String(email || "").trim().toLowerCase();
            const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
            
            if (!user) {
                return { success: false, message: "Email o password non corretti." };
            }

            const sessionData = {
                email: user.email,
                name: user.name,
                initials: user.initials,
                role: user.role,
                areaId: user.areaId,
                ufficioId: user.ufficioId,
                phone: user.phone,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
            localStorage.removeItem(LOCK_STORAGE_KEY);

            this.updateUIForUser(sessionData);
            this.hideLoginScreen();

            // Refresh CRM UI if loaded
            if (typeof window.renderCrmDeals === "function") window.renderCrmDeals();
            if (typeof window.renderCrmClients === "function") window.renderCrmClients();
            if (typeof window.updateDashboardMetrics === "function") window.updateDashboardMetrics();

            return { success: true, user: sessionData };
        },

        quickLogin(email) {
            const users = getUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (user) {
                return this.login(user.email, user.password);
            }
            return { success: false, message: "Utente demo non trovato." };
        },

        logout() {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(LOCK_STORAGE_KEY);
            this.showLoginScreen();
        },

        lockScreen() {
            const user = this.getCurrentUser();
            if (!user) return;
            localStorage.setItem(LOCK_STORAGE_KEY, "true");
            this.showLockScreen();
        },

        unlockScreen(password) {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                this.logout();
                return { success: false, message: "Sessione scaduta." };
            }

            const users = getUsers();
            const user = users.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
            if (user && user.password === password) {
                localStorage.removeItem(LOCK_STORAGE_KEY);
                this.hideLockScreen();
                return { success: true };
            }
            return { success: false, message: "Password non corretta." };
        },

        isScreenLocked() {
            return localStorage.getItem(LOCK_STORAGE_KEY) === "true";
        },

        // 5. DATA SCOPING & FILTRAGGIO GERARCHICO (RBAC ENGINE)
        canViewDeal(deal, user = null) {
            const u = user || this.getCurrentUser();
            if (!u) return false;

            const role = u.role;
            // Livello 1: Super Admin -> Tutto
            if (role === "super_admin") return true;

            // Livello 2: Direzione -> Tutto il portafoglio aziendale
            if (role === "direzione") return true;

            // Se la pratica non ha metadati, fallback prudenziale
            const dealOwner = deal.ownerEmail || deal.operatoreEmail || "";
            const dealArea = deal.areaId || (OFFICES[deal.ufficioId]?.areaId) || "";
            const dealUfficio = deal.ufficioId || "";

            // Livello 3: Capo Area -> Pratiche della propria area
            if (role === "capo_area") {
                if (dealArea && dealArea === u.areaId) return true;
                if (dealOwner && dealOwner.toLowerCase() === u.email.toLowerCase()) return true;
                return false;
            }

            // Livello 4: Responsabile Ufficio -> Pratiche del proprio ufficio
            if (role === "responsabile_ufficio") {
                if (dealUfficio && dealUfficio === u.ufficioId) return true;
                if (dealOwner && dealOwner.toLowerCase() === u.email.toLowerCase()) return true;
                return false;
            }

            // Livello 5: Broker -> Esclusivamente le proprie pratiche
            if (role === "broker") {
                return dealOwner.toLowerCase() === u.email.toLowerCase();
            }

            return false;
        },

        canViewClient(client, user = null) {
            const u = user || this.getCurrentUser();
            if (!u) return false;

            const role = u.role;
            if (role === "super_admin" || role === "direzione") return true;

            const clientOwner = client.ownerEmail || client.brokerEmail || "";
            const clientArea = client.areaId || (OFFICES[client.ufficioId]?.areaId) || "";
            const clientUfficio = client.ufficioId || "";

            if (role === "capo_area") {
                if (clientArea && clientArea === u.areaId) return true;
                if (clientOwner && clientOwner.toLowerCase() === u.email.toLowerCase()) return true;
                return false;
            }

            if (role === "responsabile_ufficio") {
                if (clientUfficio && clientUfficio === u.ufficioId) return true;
                if (clientOwner && clientOwner.toLowerCase() === u.email.toLowerCase()) return true;
                return false;
            }

            if (role === "broker") {
                return clientOwner.toLowerCase() === u.email.toLowerCase();
            }

            return false;
        },

        getVisibleDeals(allDeals, user = null) {
            const u = user || this.getCurrentUser();
            if (!u) return [];
            if (!Array.isArray(allDeals)) return [];
            return allDeals.filter(d => this.canViewDeal(d, u));
        },

        getVisibleClients(allClients, user = null) {
            const u = user || this.getCurrentUser();
            if (!u) return [];
            if (!Array.isArray(allClients)) return [];
            return allClients.filter(c => this.canViewClient(c, u));
        },

        getOfficeName(officeId) {
            return OFFICES[officeId]?.name || officeId || "Sede Generale";
        },

        getAreaName(areaId) {
            return AREAS[areaId]?.name || areaId || "Nazionale";
        },

        getRoles() {
            return ROLES;
        },

        getOffices() {
            return OFFICES;
        },

        getAreas() {
            return AREAS;
        },

        hasPermission(permission) {
            const u = this.getCurrentUser();
            if (!u) return false;

            switch (permission) {
                case "manage_users":
                    return u.role === "super_admin" || u.role === "direzione";
                case "manage_rates_policies":
                    return u.role === "super_admin";
                case "view_global_stats":
                    return u.role === "super_admin" || u.role === "direzione";
                case "view_area_stats":
                    return u.role === "super_admin" || u.role === "direzione" || u.role === "capo_area";
                case "view_office_stats":
                    return u.role !== "broker";
                default:
                    return true;
            }
        },

        // GESTIONE CRUD UTENTI
        getUsersList() {
            return getUsers();
        },

        addUser(userData) {
            const users = getUsers();
            if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                return { success: false, message: "Un utente con questa email esiste già." };
            }
            const initials = userData.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) || "UT";
            const newUser = {
                ...userData,
                initials,
                createdAt: new Date().toISOString().split("T")[0]
            };
            users.push(newUser);
            saveUsers(users);
            return { success: true, user: newUser };
        },

        updateUser(email, userData) {
            const users = getUsers();
            const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
            if (idx === -1) return { success: false, message: "Utente non trovato." };
            
            users[idx] = { ...users[idx], ...userData };
            saveUsers(users);

            // If current user updated, refresh session
            const current = this.getCurrentUser();
            if (current && current.email.toLowerCase() === email.toLowerCase()) {
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...current, ...userData }));
                this.updateUIForUser(this.getCurrentUser());
            }
            return { success: true, user: users[idx] };
        },

        deleteUser(email) {
            const current = this.getCurrentUser();
            if (current && current.email.toLowerCase() === email.toLowerCase()) {
                return { success: false, message: "Non puoi eliminare l'utente con cui sei attualmente connesso." };
            }
            let users = getUsers();
            users = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
            saveUsers(users);
            return { success: true };
        },

        // UI HELPERS
        showLoginScreen() {
            const loginEl = document.getElementById("module-login");
            const lockEl = document.getElementById("screen-lock-overlay");
            const appLayout = document.getElementById("app-layout-wrapper");
            if (lockEl) lockEl.style.display = "none";
            if (loginEl) {
                loginEl.style.display = "flex";
            }
            if (appLayout) {
                appLayout.style.display = "none";
            }
        },

        hideLoginScreen() {
            const loginEl = document.getElementById("module-login");
            const appLayout = document.getElementById("app-layout-wrapper");
            if (loginEl) loginEl.style.display = "none";
            if (appLayout) appLayout.style.display = "flex";
        },

        showLockScreen() {
            const lockEl = document.getElementById("screen-lock-overlay");
            const user = this.getCurrentUser();
            if (!lockEl || !user) return;
            
            const lockName = document.getElementById("lock-screen-username");
            const lockRole = document.getElementById("lock-screen-userrole");
            const lockAvatar = document.getElementById("lock-screen-avatar");
            const lockPwd = document.getElementById("lock-screen-password");
            const lockErr = document.getElementById("lock-screen-error");

            if (lockName) lockName.innerText = user.name;
            if (lockRole) {
                const rInfo = ROLES[user.role] || ROLES.broker;
                lockRole.innerHTML = `<span style="background:${rInfo.bgColor}; color:${rInfo.color}; border:1px solid ${rInfo.borderColor}; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight:700; font-size:0.75rem;">${rInfo.icon} ${rInfo.label}</span>`;
            }
            if (lockAvatar) lockAvatar.innerText = user.initials || "BF";
            if (lockPwd) {
                lockPwd.value = "";
                setTimeout(() => lockPwd.focus(), 100);
            }
            if (lockErr) lockErr.style.display = "none";

            lockEl.style.display = "flex";
        },

        hideLockScreen() {
            const lockEl = document.getElementById("screen-lock-overlay");
            if (lockEl) lockEl.style.display = "none";
        },

        updateUIForUser(user) {
            if (!user) return;
            const rInfo = ROLES[user.role] || ROLES.broker;
            const officeInfo = OFFICES[user.ufficioId]?.name || "Sede Generale";
            const areaInfo = AREAS[user.areaId]?.name || "Nazionale";

            // Update Header user badge
            const headerBadge = document.getElementById("header-user-badge");
            if (headerBadge) {
                headerBadge.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.75rem; background: #ffffff; border: 1px solid #e2e8f0; padding: 0.35rem 0.75rem; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: ${rInfo.color}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                            ${user.initials || "BF"}
                        </div>
                        <div style="text-align: left; line-height: 1.25;">
                            <div style="display: flex; align-items: center; gap: 0.4rem;">
                                <strong style="font-size: 0.85rem; color: #0f172a;">${user.name}</strong>
                                <span style="background: ${rInfo.bgColor}; color: ${rInfo.color}; border: 1px solid ${rInfo.borderColor}; font-size: 0.70rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px;">
                                    ${rInfo.icon} ${rInfo.label}
                                </span>
                            </div>
                            <span style="font-size: 0.72rem; color: #64748b;">📍 ${officeInfo}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.35rem; margin-left: 0.5rem; border-left: 1px solid #e2e8f0; padding-left: 0.6rem;">
                            ${(user.role === 'super_admin' || user.role === 'direzione') ? `
                                <button type="button" onclick="window.Auth.openUsersModal()" class="btn" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;" title="Gestione Collaboratori">
                                    👥 Utenti
                                </button>
                            ` : ''}
                            <button type="button" onclick="window.Auth.lockScreen()" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #64748b; font-size: 0.75rem; padding: 0.35rem 0.55rem; border-radius: 6px; cursor: pointer;" title="Blocca Schermo">
                                🔒
                            </button>
                            <button type="button" onclick="window.Auth.logout()" style="background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 6px; cursor: pointer;" title="Disconnetti">
                                🚪 Esci
                            </button>
                        </div>
                    </div>
                `;
            }

            // Update Sidebar Footer
            const sideAvatar = document.getElementById("sidebar-user-avatar");
            const sideName = document.getElementById("sidebar-user-name");
            const sideRole = document.getElementById("sidebar-user-role");
            if (sideAvatar) {
                sideAvatar.innerText = user.initials || "BF";
                sideAvatar.style.background = rInfo.color;
            }
            if (sideName) sideName.innerText = user.name;
            if (sideRole) sideRole.innerText = `${rInfo.icon} ${rInfo.label}`;

            // Update Top Welcome Title in Dashboard
            const welcomeSub = document.querySelector("#module-dashboard p");
            if (welcomeSub) {
                welcomeSub.innerText = `Benvenuto ${user.name.split(" ")[0]} (${rInfo.label} - ${officeInfo}).`;
            }

            // Show/hide Admin only tools
            const adminTools = document.querySelectorAll(".super-admin-only");
            adminTools.forEach(el => {
                el.style.display = (user.role === "super_admin") ? "" : "none";
            });
        },

        setupAutoLock() {
            let inactivityTimer;
            const resetTimer = () => {
                clearTimeout(inactivityTimer);
                // Auto lock after 30 minutes of inactivity
                inactivityTimer = setTimeout(() => {
                    if (this.getCurrentUser() && !this.isScreenLocked()) {
                        this.lockScreen();
                    }
                }, 30 * 60 * 1000);
            };

            ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
                window.addEventListener(evt, resetTimer, { passive: true });
            });
            resetTimer();
        },

        // MODALE GESTIONE UTENTI
        openUsersModal() {
            const modal = document.getElementById("users-management-modal");
            if (!modal) return;
            this.renderUsersTable();
            modal.style.display = "flex";
        },

        closeUsersModal() {
            const modal = document.getElementById("users-management-modal");
            if (modal) modal.style.display = "none";
        },

        renderUsersTable() {
            const tbody = document.getElementById("users-table-body");
            if (!tbody) return;
            const users = getUsers();
            const current = this.getCurrentUser();

            tbody.innerHTML = users.map(u => {
                const rInfo = ROLES[u.role] || ROLES.broker;
                const office = OFFICES[u.ufficioId]?.name || "Tutti / Generale";
                const area = AREAS[u.areaId]?.name || "Nazionale";
                const isSelf = current && current.email.toLowerCase() === u.email.toLowerCase();

                return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 0.75rem 0.85rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${rInfo.color}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.78rem;">
                                    ${u.initials || "BF"}
                                </div>
                                <div>
                                    <strong style="font-size: 0.85rem; color: #0f172a; display: block;">${u.name} ${isSelf ? '<span style="color:#0052ff; font-size:0.72rem;">(Tu)</span>' : ''}</strong>
                                    <span style="font-size: 0.75rem; color: #64748b;">${u.email}</span>
                                </div>
                            </div>
                        </td>
                        <td style="padding: 0.75rem 0.85rem;">
                            <span style="background: ${rInfo.bgColor}; color: ${rInfo.color}; border: 1px solid ${rInfo.borderColor}; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 6px;">
                                ${rInfo.icon} ${rInfo.label}
                            </span>
                        </td>
                        <td style="padding: 0.75rem 0.85rem; font-size: 0.82rem; color: #334155;">
                            ${office}
                        </td>
                        <td style="padding: 0.75rem 0.85rem; font-size: 0.82rem; color: #64748b;">
                            ${area}
                        </td>
                        <td style="padding: 0.75rem 0.85rem; text-align: right;">
                            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                                <button type="button" onclick="window.Auth.quickLogin('${u.email}')" class="btn" style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.72rem; font-weight: 700; padding: 0.3rem 0.55rem; border-radius: 5px; cursor: pointer;">
                                    ⚡ Impersona
                                </button>
                                ${(!isSelf && current.role === "super_admin") ? `
                                    <button type="button" onclick="window.Auth.handleDeleteUser('${u.email}')" style="background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; font-size: 0.72rem; padding: 0.3rem 0.5rem; border-radius: 5px; cursor: pointer;" title="Elimina">
                                        🗑️
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        },

        handleSaveNewUser() {
            const nameEl = document.getElementById("new-user-name");
            const emailEl = document.getElementById("new-user-email");
            const pwdEl = document.getElementById("new-user-pwd");
            const roleEl = document.getElementById("new-user-role");
            const officeEl = document.getElementById("new-user-office");
            const areaEl = document.getElementById("new-user-area");

            if (!nameEl || !emailEl || !pwdEl || !roleEl) return;

            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            const password = pwdEl.value.trim();
            const role = roleEl.value;
            const ufficioId = officeEl ? officeEl.value : "ufficio_milano";
            const areaId = areaEl ? areaEl.value : "area_nord";

            if (!name || !email || !password) {
                alert("Compila tutti i campi obbligatori (Nome, Email, Password).");
                return;
            }

            const res = this.addUser({
                name,
                email,
                password,
                role,
                ufficioId,
                areaId
            });

            if (res.success) {
                alert(`Collaboratore ${name} creato con successo!`);
                nameEl.value = "";
                emailEl.value = "";
                pwdEl.value = "";
                this.renderUsersTable();
            } else {
                alert("Errore: " + res.message);
            }
        },

        handleDeleteUser(email) {
            if (confirm(`Sei sicuro di voler eliminare l'utente ${email}?`)) {
                const res = this.deleteUser(email);
                if (res.success) {
                    this.renderUsersTable();
                } else {
                    alert(res.message);
                }
            }
        }
    };

    window.Auth = Auth;

    // Auto-init Auth when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => Auth.init());
    } else {
        Auth.init();
    }

})(window);
