/**
 * BrokerFlow - Modulo di Autenticazione & RBAC Gerarchico con Gestione Comuni e Albero
 * v2.0.0
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
            bgColor: "rgba(147, 51, 234, 0.15)",
            borderColor: "rgba(147, 51, 234, 0.4)",
            description: "Accesso totale a sistema, tassi, configurazioni, sviluppo e gestione utenti"
        },
        direzione: {
            key: "direzione",
            level: 2,
            label: "Direzione Generale",
            badgeClass: "role-direzione",
            icon: "🟡",
            color: "#f59e0b",
            bgColor: "rgba(245, 158, 11, 0.15)",
            borderColor: "rgba(245, 158, 11, 0.4)",
            description: "Visualizzazione globale di tutte le aree, uffici e pratiche aziendali"
        },
        capo_area: {
            key: "capo_area",
            level: 3,
            label: "Capo Area",
            badgeClass: "role-capo-area",
            icon: "🔵",
            color: "#00D2FF",
            bgColor: "rgba(0, 210, 255, 0.15)",
            borderColor: "rgba(0, 210, 255, 0.4)",
            description: "Coordinamento e supervisione di tutti gli uffici e broker dell'area geografica"
        },
        responsabile_ufficio: {
            key: "responsabile_ufficio",
            level: 4,
            label: "Resp. Ufficio",
            badgeClass: "role-resp-ufficio",
            icon: "🟢",
            color: "#10B981",
            bgColor: "rgba(16, 185, 129, 0.15)",
            borderColor: "rgba(16, 185, 129, 0.4)",
            description: "Gestione operativa della sede / ufficio comunale e del proprio team di broker"
        },
        broker: {
            key: "broker",
            level: 5,
            label: "Broker / Consulente",
            badgeClass: "role-broker",
            icon: "⚪",
            color: "#E2E8F0",
            bgColor: "rgba(226, 232, 240, 0.1)",
            borderColor: "rgba(226, 232, 240, 0.3)",
            description: "Consulenza del credito e gestione diretta del proprio portafoglio pratiche clienti"
        }
    };

    // UTENTI PREDEFINITI CON GERARCHIA COMPLETA
    const DEFAULT_USERS = [
        {
            email: "direzione@brokerflow.it",
            password: "direzione",
            name: "Marco Valeri (Direzione)",
            company: "Credipass",
            initials: "DG",
            role: "direzione",
            comuneUfficio: "Milano (MI)",
            areaName: "Nazionale",
            officeName: "Direzione Generale",
            phone: "+39 02 8900 1000",
            avatar: null,
            createdAt: "2026-01-01"
        },
        {
            email: "dev@brokerflow.it",
            password: "1604",
            name: "Alessandro Fassina",
            company: "Credipass",
            initials: "AF",
            role: "super_admin",
            comuneUfficio: "Padova (PD)",
            areaName: "Nazionale / Sviluppo",
            officeName: "Headquarters & Dev",
            phone: "+39 02 8900 1100",
            avatar: null,
            createdAt: "2026-01-01"
        },
        {
            email: "area.nord@societa.it",
            password: "nord",
            name: "Roberto Bruni",
            company: "Credipass",
            initials: "RB",
            role: "capo_area",
            areaName: "Area Nord (Lombardia, Veneto, Piemonte)",
            comuneUfficio: "Milano (MI)",
            officeName: "Direzione Nord",
            phone: "+39 02 8900 1102",
            avatar: null,
            createdAt: "2026-01-10"
        },
        {
            email: "area.centro@societa.it",
            password: "centro",
            name: "Marco Valeri",
            company: "Credipass",
            initials: "MV",
            role: "capo_area",
            areaName: "Area Centro & Sud",
            comuneUfficio: "Roma (RM)",
            officeName: "Direzione Centro-Sud",
            phone: "+39 06 8900 2200",
            avatar: null,
            createdAt: "2026-01-12"
        },
        {
            email: "resp.milano@societa.it",
            password: "resp",
            name: "Elena Verdi",
            company: "Credipass",
            initials: "EV",
            role: "responsabile_ufficio",
            capoAreaEmail: "area.nord@societa.it",
            comuneUfficio: "Milano (MI)",
            officeName: "Sede Milano Duomo",
            phone: "+39 02 8900 1103",
            avatar: null,
            createdAt: "2026-01-15"
        },
        {
            email: "resp.padova@societa.it",
            password: "resp",
            name: "Stefano Rossi",
            company: "Credipass",
            initials: "SR",
            role: "responsabile_ufficio",
            capoAreaEmail: "area.nord@societa.it",
            comuneUfficio: "Padova (PD)",
            officeName: "Filiale Padova Centro",
            phone: "+39 049 8900 3301",
            avatar: null,
            createdAt: "2026-01-18"
        },
        {
            email: "resp.roma@societa.it",
            password: "resp",
            name: "Giulia Neri",
            company: "Credipass",
            initials: "GN",
            role: "responsabile_ufficio",
            capoAreaEmail: "area.centro@societa.it",
            comuneUfficio: "Roma (RM)",
            officeName: "Sede Roma Eur",
            phone: "+39 06 6900 2200",
            avatar: null,
            createdAt: "2026-01-20"
        },
        {
            email: "broker.rossi@societa.it",
            password: "rossi",
            name: "Marco Rossi",
            company: "Credipass",
            initials: "MR",
            role: "broker",
            managerEmail: "resp.milano@societa.it",
            comuneUfficio: "Milano (MI)",
            officeName: "Sede Milano Duomo",
            phone: "+39 02 8900 1104",
            avatar: null,
            createdAt: "2026-02-01"
        },
        {
            email: "broker.padova@societa.it",
            password: "padova",
            name: "Andrea Zanella",
            company: "Credipass",
            initials: "AZ",
            role: "broker",
            managerEmail: "resp.padova@societa.it",
            comuneUfficio: "Padova (PD)",
            officeName: "Filiale Padova Centro",
            phone: "+39 049 8900 3302",
            avatar: null,
            createdAt: "2026-02-03"
        },
        {
            email: "broker.bianchi@societa.it",
            password: "roma",
            name: "Luca Bianchi",
            company: "Credipass",
            initials: "LB",
            role: "broker",
            managerEmail: "resp.roma@societa.it",
            comuneUfficio: "Roma (RM)",
            officeName: "Sede Roma Eur",
            phone: "+39 06 6900 2201",
            avatar: null,
            createdAt: "2026-02-05"
        }
    ];

    // LOCAL STORAGE KEYS
    const USERS_STORAGE_KEY = "brokerflow_users_db_v2";
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
                    }
                    parsed.forEach(u => {
                        if (!u.company) u.company = "Credipass";
                        if (!u.comuneUfficio) u.comuneUfficio = "Milano (MI)";
                    });
                    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
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

    const Auth = {
        ROLES,
        currentUsersTab: "tree", // "tree" | "table"
        editingUserEmail: null,

        init() {
            getUsers();
            const session = this.getCurrentUser();

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
                company: user.company || "Credipass",
                initials: user.initials,
                role: user.role,
                comuneUfficio: user.comuneUfficio || "Milano (MI)",
                officeName: user.officeName || "Sede Generale",
                areaName: user.areaName || "",
                managerEmail: user.managerEmail || null,
                capoAreaEmail: user.capoAreaEmail || null,
                phone: user.phone || "",
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
            return { success: false, message: "Utente non trovato." };
        },

        logout() {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(LOCK_STORAGE_KEY);
            this.showLoginScreen();
        },

        updateProfile(updatedData) {
            const current = this.getCurrentUser();
            if (!current) return { success: false, message: "Nessun utente connesso." };

            const users = getUsers();
            const idx = users.findIndex(u => u.email.toLowerCase() === current.email.toLowerCase());
            
            const initials = updatedData.name ? updatedData.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) : current.initials;
            const updated = {
                ...current,
                ...updatedData,
                initials: initials || current.initials
            };

            if (idx !== -1) {
                users[idx] = { ...users[idx], ...updated };
                saveUsers(users);
            }

            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
            this.updateUIForUser(updated);
            return { success: true, user: updated };
        },

        openProfileModal() {
            const modal = document.getElementById("profile-edit-modal");
            if (!modal) return;
            const user = this.getCurrentUser();
            if (user) {
                const nameInp = document.getElementById("profile-edit-name");
                const companyInp = document.getElementById("profile-edit-company");
                const phoneInp = document.getElementById("profile-edit-phone");
                if (nameInp) nameInp.value = user.name || "";
                if (companyInp) companyInp.value = user.company || "Credipass";
                if (phoneInp) phoneInp.value = user.phone || "";
            }
            modal.style.display = "flex";
        },

        closeProfileModal() {
            const modal = document.getElementById("profile-edit-modal");
            if (modal) modal.style.display = "none";
        },

        handleSaveProfile(e) {
            if (e) e.preventDefault();
            const nameInp = document.getElementById("profile-edit-name");
            const companyInp = document.getElementById("profile-edit-company");
            const phoneInp = document.getElementById("profile-edit-phone");

            const name = nameInp ? nameInp.value.trim() : "";
            const company = companyInp ? companyInp.value.trim() : "Credipass";
            const phone = phoneInp ? phoneInp.value.trim() : "";

            if (!name) {
                alert("Il nome non può essere vuoto.");
                return;
            }

            const res = this.updateProfile({ name, company, phone });
            if (res.success) {
                this.closeProfileModal();
                if (typeof window.showToast === "function") window.showToast("Profilo aggiornato con successo!", "success");
            }
        },

        lockScreen() {
            localStorage.setItem(LOCK_STORAGE_KEY, "true");
            this.showLockScreen();
        },

        unlockScreen(password) {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                this.logout();
                return;
            }
            const users = getUsers();
            const user = users.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
            if (user && user.password === password) {
                localStorage.removeItem(LOCK_STORAGE_KEY);
                this.hideLockScreen();
                const pwdEl = document.getElementById("lock-screen-password");
                if (pwdEl) pwdEl.value = "";
                const errEl = document.getElementById("lock-screen-error");
                if (errEl) errEl.style.display = "none";
            } else {
                const errEl = document.getElementById("lock-screen-error");
                if (errEl) {
                    errEl.innerText = "Password errata.";
                    errEl.style.display = "block";
                }
            }
        },

        isScreenLocked() {
            return localStorage.getItem(LOCK_STORAGE_KEY) === "true";
        },

        // PERMESSI & VISIBILITÀ GERARCHICA PRATICHE E CLIENTI
        canViewDeal(deal, user = null) {
            const u = user || this.getCurrentUser();
            if (!u) return false;

            const role = u.role;
            if (role === "super_admin" || role === "direzione") return true;

            const dealOwner = String(deal.ownerEmail || deal.operatoreEmail || deal.brokerEmail || "").toLowerCase();
            const uEmail = u.email.toLowerCase();

            if (dealOwner && dealOwner === uEmail) return true;

            const users = getUsers();

            if (role === "responsabile_ufficio") {
                const managedBrokers = users.filter(usr => usr.managerEmail && usr.managerEmail.toLowerCase() === uEmail);
                if (managedBrokers.some(b => b.email.toLowerCase() === dealOwner)) return true;
                if (deal.comuneUfficio && u.comuneUfficio && deal.comuneUfficio.toLowerCase() === u.comuneUfficio.toLowerCase()) return true;
                return false;
            }

            if (role === "capo_area") {
                const managedResps = users.filter(usr => usr.capoAreaEmail && usr.capoAreaEmail.toLowerCase() === uEmail);
                const respEmails = managedResps.map(r => r.email.toLowerCase());
                if (respEmails.includes(dealOwner)) return true;
                
                const managedBrokers = users.filter(usr => usr.managerEmail && respEmails.includes(usr.managerEmail.toLowerCase()));
                if (managedBrokers.some(b => b.email.toLowerCase() === dealOwner)) return true;
                
                return false;
            }

            if (role === "broker") {
                return dealOwner === uEmail;
            }

            return false;
        },

        canViewClient(client, user = null) {
            const u = user || this.getCurrentUser();
            if (!u) return false;

            const role = u.role;
            if (role === "super_admin" || role === "direzione") return true;

            const clientOwner = String(client.ownerEmail || client.brokerEmail || client.operatoreEmail || "").toLowerCase();
            const uEmail = u.email.toLowerCase();

            if (clientOwner && clientOwner === uEmail) return true;

            const users = getUsers();

            if (role === "responsabile_ufficio") {
                const managedBrokers = users.filter(usr => usr.managerEmail && usr.managerEmail.toLowerCase() === uEmail);
                if (managedBrokers.some(b => b.email.toLowerCase() === clientOwner)) return true;
                return false;
            }

            if (role === "capo_area") {
                const managedResps = users.filter(usr => usr.capoAreaEmail && usr.capoAreaEmail.toLowerCase() === uEmail);
                const respEmails = managedResps.map(r => r.email.toLowerCase());
                if (respEmails.includes(clientOwner)) return true;
                const managedBrokers = users.filter(usr => usr.managerEmail && respEmails.includes(usr.managerEmail.toLowerCase()));
                if (managedBrokers.some(b => b.email.toLowerCase() === clientOwner)) return true;
                return false;
            }

            if (role === "broker") {
                return clientOwner === uEmail;
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

        getRoles() {
            return ROLES;
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
            const initials = userData.name ? userData.name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) : "UT";
            const newUser = {
                company: "Credipass",
                comuneUfficio: "Milano (MI)",
                officeName: "Sede Generale",
                ...userData,
                initials: initials || "UT",
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
            if (loginEl) loginEl.style.display = "flex";
            if (appLayout) appLayout.style.display = "none";
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
                lockRole.innerHTML = `<span style="background:${rInfo.bgColor}; color:${rInfo.color}; border:1px solid ${rInfo.borderColor}; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem;">${rInfo.icon} ${rInfo.label}</span>`;
            }
            if (lockAvatar) {
                lockAvatar.innerText = user.initials || "BF";
            }
            if (lockPwd) lockPwd.value = "";
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
            const company = user.company || "Credipass";
            const officeInfo = user.comuneUfficio ? `📍 ${user.comuneUfficio}` : (user.officeName || "Sede");

            const headerBadge = document.getElementById("header-user-badge");
            const sideAvatar = document.getElementById("sidebar-user-avatar");
            const sideName = document.getElementById("sidebar-user-name");
            const sideRole = document.getElementById("sidebar-user-role");

            if (headerBadge) {
                headerBadge.innerHTML = `
                    <span style="background: ${rInfo.bgColor}; color: ${rInfo.color}; border: 1px solid ${rInfo.borderColor}; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.35rem;">
                        <span>${rInfo.icon}</span> <span>${rInfo.label}</span>
                    </span>
                    <span style="font-size: 0.75rem; color: #94A3B8; font-weight: 600;">${officeInfo}</span>
                `;
            }

            if (sideAvatar) {
                sideAvatar.innerText = user.initials || "BF";
                sideAvatar.style.background = rInfo.color;
            }
            if (sideName) sideName.innerText = `${user.name}`;
            if (sideRole) sideRole.innerText = `${rInfo.icon} ${rInfo.label} • ${officeInfo}`;

            const welcomeSub = document.querySelector("#module-dashboard p");
            if (welcomeSub) {
                welcomeSub.innerText = `Benvenuto ${user.name} - Mediatore: ${company} (${rInfo.label} - ${officeInfo}).`;
            }

            const dashNameSpan = document.getElementById("dash-user-name-span");
            if (dashNameSpan) dashNameSpan.innerText = user.name;
            const dashCompanyBadge = document.getElementById("dash-user-company-badge");
            if (dashCompanyBadge) dashCompanyBadge.innerText = company;

            const adminTools = document.querySelectorAll(".super-admin-only");
            adminTools.forEach(el => {
                el.style.display = (user.role === "super_admin" || user.role === "direzione") ? "" : "none";
            });

            // Toggle visibility of 'Coordinati' module button (Level 4 and above)
            const canSeeCoordinati = ["responsabile_ufficio", "capo_area", "direzione", "super_admin"].includes(user.role);
            const navCoordinati = document.getElementById("crm-nav-coordinati");
            const mobileNavCoordinati = document.getElementById("mobile-nav-coordinati");
            
            if (navCoordinati) navCoordinati.style.display = canSeeCoordinati ? "flex" : "none";
            if (mobileNavCoordinati) mobileNavCoordinati.style.display = canSeeCoordinati ? "flex" : "none";

            // If user is currently in Coordinati module, re-render
            const modCoordinati = document.getElementById("module-coordinati");
            if (modCoordinati && modCoordinati.style.display !== "none" && typeof window.renderCoordinatiModule === "function") {
                window.renderCoordinatiModule();
            }
        },

        setupAutoLock() {
            let inactivityTimer;
            const resetTimer = () => {
                clearTimeout(inactivityTimer);
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

        // =========================================================================
        // MODALE GESTIONE UTENTI, COMUNI & ALBERO GERARCHICO
        // =========================================================================
        openUsersModal() {
            const modal = document.getElementById("users-management-modal");
            if (!modal) return;
            this.editingUserEmail = null;
            this.resetUserForm();
            this.populateHierarchyDropdowns();
            this.switchUsersTab(this.currentUsersTab || "tree");
            modal.style.display = "flex";
        },

        closeUsersModal() {
            const modal = document.getElementById("users-management-modal");
            if (modal) modal.style.display = "none";
            this.editingUserEmail = null;
        },

        switchUsersTab(tabName) {
            this.currentUsersTab = tabName;
            const tabTreeBtn = document.getElementById("tab-users-tree-btn");
            const tabTableBtn = document.getElementById("tab-users-table-btn");
            const treeContainer = document.getElementById("users-tree-container");
            const tableContainer = document.getElementById("users-table-container");

            if (tabName === "tree") {
                if (tabTreeBtn) {
                    tabTreeBtn.style.background = "#0052ff";
                    tabTreeBtn.style.color = "#FFFFFF";
                }
                if (tabTableBtn) {
                    tabTableBtn.style.background = "#0B1222";
                    tabTableBtn.style.color = "#94A3B8";
                }
                if (treeContainer) treeContainer.style.display = "block";
                if (tableContainer) tableContainer.style.display = "none";
                this.renderUsersTree();
            } else {
                if (tabTreeBtn) {
                    tabTreeBtn.style.background = "#0B1222";
                    tabTreeBtn.style.color = "#94A3B8";
                }
                if (tabTableBtn) {
                    tabTableBtn.style.background = "#0052ff";
                    tabTableBtn.style.color = "#FFFFFF";
                }
                if (treeContainer) treeContainer.style.display = "none";
                if (tableContainer) tableContainer.style.display = "block";
                this.renderUsersTable();
            }
        },

        populateHierarchyDropdowns() {
            const users = getUsers();
            const capiArea = users.filter(u => u.role === "capo_area" || u.role === "super_admin" || u.role === "direzione");
            const resps = users.filter(u => u.role === "responsabile_ufficio");

            const capoAreaSelect = document.getElementById("new-user-capo-area");
            if (capoAreaSelect) {
                capoAreaSelect.innerHTML = `<option value="">-- Seleziona Capo Area Superiore --</option>` +
                    capiArea.map(ca => `<option value="${ca.email}">🔵 ${ca.name} (${ca.areaName || ca.comuneUfficio || 'Area'})</option>`).join("");
            }

            const managerSelect = document.getElementById("new-user-manager");
            if (managerSelect) {
                managerSelect.innerHTML = `<option value="">-- Seleziona Responsabile Ufficio Diretto --</option>` +
                    resps.map(r => `<option value="${r.email}">🟢 ${r.name} - 📍 ${r.comuneUfficio || 'Ufficio'} (${r.officeName || 'Sede'})</option>`).join("");
            }
        },

        handleRoleSelectionChange(role) {
            const capoAreaGroup = document.getElementById("group-user-capo-area");
            const managerGroup = document.getElementById("group-user-manager");
            const areaNameGroup = document.getElementById("group-user-area-name");

            if (capoAreaGroup) capoAreaGroup.style.display = (role === "responsabile_ufficio") ? "block" : "none";
            if (managerGroup) managerGroup.style.display = (role === "broker") ? "block" : "none";
            if (areaNameGroup) areaNameGroup.style.display = (role === "capo_area") ? "block" : "none";
        },

        handleManagerSelectionChange(managerEmail) {
            if (!managerEmail) return;
            const users = getUsers();
            const manager = users.find(u => u.email.toLowerCase() === managerEmail.toLowerCase());
            if (manager) {
                const comuneInput = document.getElementById("new-user-comune");
                const officeInput = document.getElementById("new-user-office-name");
                if (comuneInput && !comuneInput.value) {
                    comuneInput.value = manager.comuneUfficio || "";
                }
                if (officeInput && !officeInput.value) {
                    officeInput.value = manager.officeName || "";
                }
            }
        },

        resetUserForm() {
            const nameEl = document.getElementById("new-user-name");
            const emailEl = document.getElementById("new-user-email");
            const pwdEl = document.getElementById("new-user-pwd");
            const roleEl = document.getElementById("new-user-role");
            const comuneEl = document.getElementById("new-user-comune");
            const officeEl = document.getElementById("new-user-office-name");
            const areaNameEl = document.getElementById("new-user-area-name");
            const phoneEl = document.getElementById("new-user-phone");
            const btnSave = document.getElementById("btn-save-user");
            const formTitle = document.getElementById("form-user-title");

            if (nameEl) nameEl.value = "";
            if (emailEl) {
                emailEl.value = "";
                emailEl.disabled = false;
            }
            if (pwdEl) pwdEl.value = "broker123";
            if (roleEl) {
                roleEl.value = "broker";
                this.handleRoleSelectionChange("broker");
            }
            if (comuneEl) comuneEl.value = "";
            if (officeEl) officeEl.value = "";
            if (areaNameEl) areaNameEl.value = "";
            if (phoneEl) phoneEl.value = "";
            if (btnSave) btnSave.innerText = "➕ Crea Collaboratore";
            if (formTitle) formTitle.innerHTML = "<span>➕</span> Aggiungi Nuovo Collaboratore";
            this.editingUserEmail = null;
        },

        editUser(email) {
            const users = getUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!user) return;

            this.editingUserEmail = user.email;
            this.populateHierarchyDropdowns();

            const nameEl = document.getElementById("new-user-name");
            const emailEl = document.getElementById("new-user-email");
            const pwdEl = document.getElementById("new-user-pwd");
            const roleEl = document.getElementById("new-user-role");
            const comuneEl = document.getElementById("new-user-comune");
            const officeEl = document.getElementById("new-user-office-name");
            const areaNameEl = document.getElementById("new-user-area-name");
            const capoAreaEl = document.getElementById("new-user-capo-area");
            const managerEl = document.getElementById("new-user-manager");
            const phoneEl = document.getElementById("new-user-phone");
            const btnSave = document.getElementById("btn-save-user");
            const formTitle = document.getElementById("form-user-title");

            if (nameEl) nameEl.value = user.name || "";
            if (emailEl) {
                emailEl.value = user.email;
                emailEl.disabled = true;
            }
            if (pwdEl) pwdEl.value = user.password || "";
            if (roleEl) {
                roleEl.value = user.role || "broker";
                this.handleRoleSelectionChange(user.role || "broker");
            }
            if (comuneEl) comuneEl.value = user.comuneUfficio || "";
            if (officeEl) officeEl.value = user.officeName || "";
            if (areaNameEl) areaNameEl.value = user.areaName || "";
            if (capoAreaEl) capoAreaEl.value = user.capoAreaEmail || "";
            if (managerEl) managerEl.value = user.managerEmail || "";
            if (phoneEl) phoneEl.value = user.phone || "";

            if (btnSave) btnSave.innerText = "💾 Salva Modifiche";
            if (formTitle) formTitle.innerHTML = `<span>✏️</span> Modifica Collaboratore: <strong>${user.name}</strong>`;

            const formBox = document.getElementById("user-form-container");
            if (formBox) formBox.scrollIntoView({ behavior: "smooth", block: "start" });
        },

        handleSaveNewUser() {
            const nameEl = document.getElementById("new-user-name");
            const emailEl = document.getElementById("new-user-email");
            const pwdEl = document.getElementById("new-user-pwd");
            const roleEl = document.getElementById("new-user-role");
            const comuneEl = document.getElementById("new-user-comune");
            const officeEl = document.getElementById("new-user-office-name");
            const areaNameEl = document.getElementById("new-user-area-name");
            const capoAreaEl = document.getElementById("new-user-capo-area");
            const managerEl = document.getElementById("new-user-manager");
            const phoneEl = document.getElementById("new-user-phone");

            if (!nameEl || !emailEl || !pwdEl || !roleEl) return;

            const name = nameEl.value.trim();
            const email = emailEl.value.trim().toLowerCase();
            const password = pwdEl.value.trim();
            const role = roleEl.value;
            const comuneUfficio = comuneEl ? comuneEl.value.trim() : "Milano (MI)";
            const officeName = officeEl ? officeEl.value.trim() : "Sede Operativa";
            const areaName = areaNameEl ? areaNameEl.value.trim() : "";
            const capoAreaEmail = capoAreaEl ? capoAreaEl.value.trim() : "";
            const managerEmail = managerEl ? managerEl.value.trim() : "";
            const phone = phoneEl ? phoneEl.value.trim() : "";

            if (!name || !email || !password) {
                alert("Compila tutti i campi obbligatori (Nome, Email, Password).");
                return;
            }

            const payload = {
                name,
                email,
                password,
                role,
                comuneUfficio: comuneUfficio || "Milano (MI)",
                officeName: officeName || `Sede ${comuneUfficio}`,
                areaName,
                capoAreaEmail,
                managerEmail,
                phone
            };

            if (this.editingUserEmail) {
                const res = this.updateUser(this.editingUserEmail, payload);
                if (res.success) {
                    alert(`Collaboratore ${name} aggiornato con successo!`);
                    this.resetUserForm();
                    this.populateHierarchyDropdowns();
                    if (this.currentUsersTab === "tree") this.renderUsersTree();
                    else this.renderUsersTable();
                } else {
                    alert("Errore: " + res.message);
                }
            } else {
                const res = this.addUser(payload);
                if (res.success) {
                    alert(`Collaboratore ${name} creato con successo nella gerarchia!`);
                    this.resetUserForm();
                    this.populateHierarchyDropdowns();
                    if (this.currentUsersTab === "tree") this.renderUsersTree();
                    else this.renderUsersTable();
                } else {
                    alert("Errore: " + res.message);
                }
            }
        },

        handleDeleteUser(email) {
            if (confirm(`Sei sicuro di voler eliminare l'utente ${email}?`)) {
                const res = this.deleteUser(email);
                if (res.success) {
                    this.populateHierarchyDropdowns();
                    if (this.currentUsersTab === "tree") this.renderUsersTree();
                    else this.renderUsersTable();
                } else {
                    alert(res.message);
                }
            }
        },

        // RENDER ALBERO GERARCHICO DALL'ALTO AL BASSO
        renderUsersTree() {
            const container = document.getElementById("users-tree-container");
            if (!container) return;

            const users = getUsers();
            const current = this.getCurrentUser();

            const allDeals = window.crmDeals || [];
            const countDeals = (uEmail) => allDeals.filter(d => (d.ownerEmail || d.operatoreEmail || "").toLowerCase() === uEmail.toLowerCase()).length;

            const superAdmins = users.filter(u => u.role === "super_admin" || u.role === "direzione");
            const capiArea = users.filter(u => u.role === "capo_area");
            const respsUfficio = users.filter(u => u.role === "responsabile_ufficio");
            const brokers = users.filter(u => u.role === "broker");

            let html = `
                <div style="display: flex; flex-direction: column; gap: 2rem; align-items: center; width: 100%;">
                    
                    <!-- LIVELLO 1: DIREZIONE GENERALE & SUPER ADMIN (TOP) -->
                    <div style="width: 100%; max-width: 860px; background: linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(13, 20, 36, 0.95) 100%), #0D1424; border: 2px solid #9333ea; border-radius: 14px; padding: 1.25rem 1.5rem; box-shadow: 0 0 20px rgba(147, 51, 234, 0.25);">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid rgba(147, 51, 234, 0.3); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem;">
                                <span style="font-size: 1.3rem;">🟣</span>
                                <div>
                                    <strong style="color: #FFFFFF; font-size: 1.05rem; display: block;">Direzione Generale &amp; Amministrazione Centrale</strong>
                                    <span style="font-size: 0.75rem; color: #d8b4fe;">Supervisione globale della rete commerciale, configurazione policy e gestione RBAC</span>
                                </div>
                            </div>
                            <span style="background: rgba(147, 51, 234, 0.25); color: #c084fc; border: 1px solid #9333ea; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 9999px;">
                                Livello 1 - 2
                            </span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            ${superAdmins.map(sa => {
                                const isSelf = current && current.email.toLowerCase() === sa.email.toLowerCase();
                                return `
                                    <div style="background: #080D1A; border: 1.5px solid #1C273E; border-radius: 10px; padding: 0.65rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex: 1; min-width: 260px;">
                                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #9333ea; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
                                                ${sa.initials || 'SA'}
                                            </div>
                                            <div>
                                                <strong style="color: #FFFFFF; font-size: 0.88rem; display: block;">${sa.name} ${isSelf ? '<span style="color:#00D2FF; font-size:0.7rem;">(Tu)</span>' : ''}</strong>
                                                <span style="color: #94A3B8; font-size: 0.74rem;">${sa.email} • 📍 ${sa.comuneUfficio || 'HQ'}</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 0.35rem;">
                                            <button type="button" onclick="window.Auth.quickLogin('${sa.email}')" style="background: rgba(0,210,255,0.15); border: 1px solid #00D2FF; color: #00D2FF; font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 5px; cursor: pointer;">⚡ Login</button>
                                            <button type="button" onclick="window.Auth.editUser('${sa.email}')" style="background: #1C273E; border: 1px solid #334155; color: #E2E8F0; font-size: 0.72rem; padding: 0.25rem 0.45rem; border-radius: 5px; cursor: pointer;">✏️</button>
                                        </div>
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    </div>

                    <!-- FRECCIA CONNETTORE GERARCHICO -->
                    <div style="display: flex; flex-direction: column; align-items: center; margin: -1.25rem 0;">
                        <div style="width: 2.5px; height: 28px; background: #00D2FF; box-shadow: 0 0 8px rgba(0,210,255,0.5);"></div>
                        <div style="color: #00D2FF; font-size: 0.9rem; margin-top: -4px;">▼</div>
                    </div>

                    <!-- LIVELLO 2: CAPI AREA (AREA MANAGERS) -->
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 1.75rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #1C273E; padding-bottom: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">🔵</span>
                                <strong style="color: #00D2FF; font-size: 1.05rem;">Capi Area Territoriali (Supervisori Macro-Aree)</strong>
                            </div>
                            <span style="color: #94A3B8; font-size: 0.78rem;">${capiArea.length} Capi Area attivi</span>
                        </div>

                        ${capiArea.map(ca => {
                            const isSelf = current && current.email.toLowerCase() === ca.email.toLowerCase();
                            const myResps = respsUfficio.filter(r => r.capoAreaEmail && r.capoAreaEmail.toLowerCase() === ca.email.toLowerCase());
                            const myRespEmails = myResps.map(r => r.email.toLowerCase());
                            const myBrokers = brokers.filter(b => b.managerEmail && myRespEmails.includes(b.managerEmail.toLowerCase()));

                            return `
                                <div style="background: #0D1424; border: 2px solid #00D2FF; border-radius: 14px; padding: 1.25rem; box-shadow: 0 4px 20px rgba(0, 210, 255, 0.15);">
                                    
                                    <!-- Capo Area Header Card -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; background: #080D1A; border: 1.5px solid #1C273E; border-radius: 10px; padding: 0.85rem 1.15rem; margin-bottom: 1.25rem;">
                                        <div style="display: flex; align-items: center; gap: 0.85rem;">
                                            <div style="width: 42px; height: 42px; border-radius: 50%; background: #00D2FF; color: #070B14; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; box-shadow: 0 0 12px rgba(0,210,255,0.4);">
                                                ${ca.initials || 'CA'}
                                            </div>
                                            <div>
                                                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                                    <strong style="color: #FFFFFF; font-size: 1rem;">${ca.name}</strong>
                                                    <span style="background: rgba(0, 210, 255, 0.15); color: #00D2FF; border: 1px solid #00D2FF; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 6px;">🔵 CAPO AREA</span>
                                                    ${isSelf ? '<span style="color:#00D2FF; font-size:0.72rem; font-weight:700;">(Tu)</span>' : ''}
                                                </div>
                                                <span style="color: #94A3B8; font-size: 0.78rem; display: block; margin-top: 0.15rem;">
                                                    📧 ${ca.email} • 📍 Sede: <strong style="color:#E2E8F0;">${ca.comuneUfficio || 'Non specificato'}</strong> • 🗺️ <em>${ca.areaName || 'Area di Competenza'}</em>
                                                </span>
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                                            <span style="background: #11192C; border: 1px solid #1C273E; color: #CBD5E1; font-size: 0.75rem; padding: 0.3rem 0.65rem; border-radius: 6px;">
                                                🏢 <strong>${myResps.length}</strong> Uffici • 👥 <strong>${myBrokers.length}</strong> Broker
                                            </span>
                                            <button type="button" onclick="window.Auth.quickLogin('${ca.email}')" style="background: rgba(0,210,255,0.15); border: 1.5px solid #00D2FF; color: #00D2FF; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer;">⚡ Login</button>
                                            <button type="button" onclick="window.Auth.editUser('${ca.email}')" style="background: #1C273E; border: 1.5px solid #334155; color: #E2E8F0; font-size: 0.75rem; padding: 0.35rem 0.6rem; border-radius: 6px; cursor: pointer;" title="Modifica">✏️</button>
                                            ${!isSelf ? `<button type="button" onclick="window.Auth.handleDeleteUser('${ca.email}')" style="background: rgba(239,68,68,0.15); border: 1.5px solid #EF4444; color: #EF4444; font-size: 0.75rem; padding: 0.35rem 0.6rem; border-radius: 6px; cursor: pointer;" title="Elimina">🗑️</button>` : ''}
                                        </div>
                                    </div>

                                    <!-- Responsabili Ufficio sotto questo Capo Area -->
                                    <div style="padding-left: 1rem; border-left: 2px dashed rgba(0, 210, 255, 0.4); margin-left: 1rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                        
                                        ${myResps.length === 0 ? `
                                            <div style="background: #080D1A; border: 1px dashed #1C273E; border-radius: 8px; padding: 0.85rem 1rem; color: #64748b; font-size: 0.8rem;">
                                                ℹ️ Nessun Responsabile di Ufficio ancora assegnato a questo Capo Area. Usa il modulo sopra selezionando il ruolo 'Responsabile di Ufficio' e collegandolo a questo Capo Area.
                                            </div>
                                        ` : myResps.map(resp => {
                                            const isRespSelf = current && current.email.toLowerCase() === resp.email.toLowerCase();
                                            const myOfficeBrokers = brokers.filter(b => b.managerEmail && b.managerEmail.toLowerCase() === resp.email.toLowerCase());

                                            return `
                                                <div style="background: #080D1A; border: 1.5px solid #10B981; border-radius: 12px; padding: 1rem 1.15rem; box-shadow: 0 2px 12px rgba(16, 185, 129, 0.1);">
                                                    
                                                    <!-- Responsabile Ufficio Header -->
                                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.65rem; border-bottom: 1px solid rgba(16, 185, 129, 0.25); padding-bottom: 0.65rem; margin-bottom: 0.75rem;">
                                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #10B981; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
                                                                ${resp.initials || 'RU'}
                                                            </div>
                                                            <div>
                                                                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                                                    <strong style="color: #FFFFFF; font-size: 0.92rem;">${resp.name}</strong>
                                                                    <span style="background: rgba(16, 185, 129, 0.18); color: #10B981; border: 1px solid #10B981; font-size: 0.7rem; font-weight: 800; padding: 0.1rem 0.45rem; border-radius: 5px;">🟢 RESP. UFFICIO</span>
                                                                    <span style="background: #11192C; color: #00D2FF; border: 1px solid #1C273E; font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 5px;">
                                                                        📍 Comune: <strong>${resp.comuneUfficio || 'Milano'}</strong>
                                                                    </span>
                                                                    ${isRespSelf ? '<span style="color:#00D2FF; font-size:0.7rem; font-weight:700;">(Tu)</span>' : ''}
                                                                </div>
                                                                <span style="color: #94A3B8; font-size: 0.75rem; display: block; margin-top: 0.1rem;">
                                                                    🏢 Filiale: <strong style="color:#E2E8F0;">${resp.officeName || 'Ufficio'}</strong> • 📧 ${resp.email} • 👥 Team: <strong>${myOfficeBrokers.length} broker</strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style="display: flex; align-items: center; gap: 0.45rem;">
                                                            <button type="button" onclick="window.Auth.quickLogin('${resp.email}')" style="background: rgba(16,185,129,0.15); border: 1.5px solid #10B981; color: #10B981; font-size: 0.72rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 5px; cursor: pointer;">⚡ Login</button>
                                                            <button type="button" onclick="window.Auth.editUser('${resp.email}')" style="background: #1C273E; border: 1.5px solid #334155; color: #E2E8F0; font-size: 0.72rem; padding: 0.3rem 0.5rem; border-radius: 5px; cursor: pointer;" title="Modifica">✏️</button>
                                                            ${!isRespSelf ? `<button type="button" onclick="window.Auth.handleDeleteUser('${resp.email}')" style="background: rgba(239,68,68,0.15); border: 1.5px solid #EF4444; color: #EF4444; font-size: 0.72rem; padding: 0.3rem 0.5rem; border-radius: 5px; cursor: pointer;" title="Elimina">🗑️</button>` : ''}
                                                        </div>
                                                    </div>

                                                    <!-- Broker sotto questo Responsabile Ufficio -->
                                                    <div style="padding-left: 0.75rem; border-left: 2px dashed rgba(16, 185, 129, 0.4); margin-left: 0.5rem;">
                                                        <div style="font-size: 0.75rem; font-weight: 700; color: #94A3B8; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.04em;">
                                                            👥 Consulenti / Broker del Team (${myOfficeBrokers.length}):
                                                        </div>

                                                        ${myOfficeBrokers.length === 0 ? `
                                                            <span style="color: #64748b; font-size: 0.78rem; font-style: italic;">Nessun broker ancora assegnato a questo ufficio.</span>
                                                        ` : `
                                                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.65rem;">
                                                                ${myOfficeBrokers.map(b => {
                                                                    const isBrokerSelf = current && current.email.toLowerCase() === b.email.toLowerCase();
                                                                    const dealsCount = countDeals(b.email);
                                                                    return `
                                                                        <div style="background: #0B1222; border: 1.5px solid #1C273E; border-radius: 8px; padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                                                                            <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
                                                                                <div style="width: 30px; height: 30px; border-radius: 50%; background: #1C273E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; flex-shrink: 0;">
                                                                                    ${b.initials || 'BK'}
                                                                                </div>
                                                                                <div style="min-width: 0;">
                                                                                    <strong style="color: #FFFFFF; font-size: 0.82rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.name} ${isBrokerSelf ? '<span style="color:#00D2FF; font-size:0.68rem;">(Tu)</span>' : ''}</strong>
                                                                                    <span style="color: #94A3B8; font-size: 0.72rem; display: block;">📍 ${b.comuneUfficio || resp.comuneUfficio} • 📁 ${dealsCount} pratiche</span>
                                                                                </div>
                                                                            </div>
                                                                            <div style="display: flex; gap: 0.25rem; flex-shrink: 0;">
                                                                                <button type="button" onclick="window.Auth.quickLogin('${b.email}')" style="background: rgba(0,210,255,0.15); border: 1px solid #00D2FF; color: #00D2FF; font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.45rem; border-radius: 4px; cursor: pointer;" title="Impersona">⚡</button>
                                                                                <button type="button" onclick="window.Auth.editUser('${b.email}')" style="background: #1C273E; border: 1px solid #334155; color: #E2E8F0; font-size: 0.68rem; padding: 0.2rem 0.4rem; border-radius: 4px; cursor: pointer;" title="Modifica">✏️</button>
                                                                                ${!isBrokerSelf ? `<button type="button" onclick="window.Auth.handleDeleteUser('${b.email}')" style="background: rgba(239,68,68,0.15); border: 1px solid #EF4444; color: #EF4444; font-size: 0.68rem; padding: 0.2rem 0.4rem; border-radius: 4px; cursor: pointer;" title="Elimina">🗑️</button>` : ''}
                                                                            </div>
                                                                        </div>
                                                                    `;
                                                                }).join("")}
                                                            </div>
                                                        `}
                                                    </div>

                                                </div>
                                            `;
                                        }).join("")}

                                    </div>

                                </div>
                            `;
                        }).join("")}

                    </div>

                </div>
            `;

            container.innerHTML = html;
        },

        // RENDER TABELLA UTENTI
        renderUsersTable() {
            const tbody = document.getElementById("users-table-body");
            if (!tbody) return;
            const users = getUsers();
            const current = this.getCurrentUser();

            tbody.innerHTML = users.map(u => {
                const rInfo = ROLES[u.role] || ROLES.broker;
                const isSelf = current && current.email.toLowerCase() === u.email.toLowerCase();
                
                let supText = "--";
                if (u.role === "broker") {
                    const manager = users.find(m => m.email.toLowerCase() === (u.managerEmail || "").toLowerCase());
                    supText = manager ? `🟢 Resp: ${manager.name}` : "Diretto HQ";
                } else if (u.role === "responsabile_ufficio") {
                    const capo = users.find(c => c.email.toLowerCase() === (u.capoAreaEmail || "").toLowerCase());
                    supText = capo ? `🔵 Capo Area: ${capo.name}` : "Diretto HQ";
                } else if (u.role === "capo_area") {
                    supText = "🟡 Direzione Generale";
                }

                return `
                    <tr style="border-bottom: 1px solid #1C273E;">
                        <td style="padding: 0.75rem 0.85rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${rInfo.color}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.78rem;">
                                    ${u.initials || "BF"}
                                </div>
                                <div>
                                    <strong style="font-size: 0.85rem; color: #FFFFFF; display: block;">${u.name} ${isSelf ? '<span style="color:#00D2FF; font-size:0.72rem;">(Tu)</span>' : ''}</strong>
                                    <span style="font-size: 0.75rem; color: #94A3B8;">${u.email}</span>
                                </div>
                            </div>
                        </td>
                        <td style="padding: 0.75rem 0.85rem;">
                            <span style="background: ${rInfo.bgColor}; color: ${rInfo.color}; border: 1px solid ${rInfo.borderColor}; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 6px;">
                                ${rInfo.icon} ${rInfo.label}
                            </span>
                        </td>
                        <td style="padding: 0.75rem 0.85rem; font-size: 0.82rem; color: #00D2FF; font-weight: 700;">
                            📍 ${u.comuneUfficio || 'Milano (MI)'}
                        </td>
                        <td style="padding: 0.75rem 0.85rem; font-size: 0.82rem; color: #CBD5E1;">
                            ${supText}
                        </td>
                        <td style="padding: 0.75rem 0.85rem; text-align: right;">
                            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                                <button type="button" onclick="window.Auth.quickLogin('${u.email}')" class="btn" style="background: rgba(0,210,255,0.15); border: 1px solid #00D2FF; color: #00D2FF; font-size: 0.72rem; font-weight: 700; padding: 0.3rem 0.55rem; border-radius: 5px; cursor: pointer;">
                                    ⚡ Impersona
                                </button>
                                <button type="button" onclick="window.Auth.editUser('${u.email}')" class="btn" style="background: #1C273E; border: 1px solid #334155; color: #E2E8F0; font-size: 0.72rem; padding: 0.3rem 0.5rem; border-radius: 5px; cursor: pointer;" title="Modifica">
                                    ✏️
                                </button>
                                ${(!isSelf && current.role === "super_admin") ? `
                                    <button type="button" onclick="window.Auth.handleDeleteUser('${u.email}')" style="background: rgba(239,68,68,0.15); border: 1px solid #EF4444; color: #EF4444; font-size: 0.72rem; padding: 0.3rem 0.5rem; border-radius: 5px; cursor: pointer;" title="Elimina">
                                        🗑️
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    };

    window.Auth = Auth;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => Auth.init());
    } else {
        Auth.init();
    }

})(window);
