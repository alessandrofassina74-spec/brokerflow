with open("engine.js", "r", encoding="utf-8") as f:
    content = f.read()

old_loop_start = """        for (const [bankId, policy] of Object.entries(this.bankPolicies)) {
            const checks = [];
            const notes = [];
            let bankStatus = "ok"; // "ok" (🟢), "deroga" (🟡), or "ko" (🔴)"""

new_loop_start = """        for (const [bankId, policy] of Object.entries(this.bankPolicies)) {
            const checks = [];
            const notes = [];
            let bankStatus = "ok"; // "ok" (🟢), "deroga" (🟡), or "ko" (🔴)

            let maxLtvAcqBank = 0.80;
            let maxLtvRistrBank = 0.80;
            let isAcqOkBank = true;
            let isRistrOkBank = true;

            if (isAcquistoRistrutturazione) {
                const isSecondHome = (pratica.isSecondaCasa === true || pratica.finalitaSecondaCasa === true || pratica.secondaCasa === true);
                const lf = policy?.eccezioni_e_deroghe?.limiti_finalita?.acquisto_ristrutturazione || policy?.eccezioni_e_deroghe?.limiti_finalita?.acquisto_e_ristrutturazione;
                
                if (bankId === "mediobanca_premier" || bankId === "mediobanca premier") {
                    if (isSecondHome) {
                        maxLtvAcqBank = 0.75;
                        maxLtvRistrBank = 0.75;
                    } else {
                        maxLtvAcqBank = 0.80;
                        maxLtvRistrBank = 1.00; // Mediobanca Premier: 80% acquisto + 100% ristrutturazione
                    }
                } else if (bankId === "mps") {
                    maxLtvAcqBank = 0.80;
                    maxLtvRistrBank = 0.80; // MPS: 80% acquisto + 80% ristrutturazione
                } else if (bankId === "ing") {
                    maxLtvAcqBank = 0.80;
                    const hasAutonomoApplicant = (pratica.subjects || []).some(s => (s.role === "Richiedente Principale" || s.role === "Cointestatario") && (s.tipoContratto === "lavoratore_autonomo" || s.tipoContratto === "autonomo" || s.tipoContratto === "professionista"));
                    maxLtvRistrBank = hasAutonomoApplicant ? 0.60 : 0.80;
                } else if (lf) {
                    if (isSecondHome && lf.max_ltv_acquisto_seconda_casa) {
                        maxLtvAcqBank = lf.max_ltv_acquisto_seconda_casa;
                    } else {
                        maxLtvAcqBank = lf.max_ltv_acquisto ?? (policy.maxLtv ?? 0.80);
                    }
                    if (isSecondHome && lf.max_ltv_ristrutturazione_seconda_casa) {
                        maxLtvRistrBank = lf.max_ltv_ristrutturazione_seconda_casa;
                    } else {
                        maxLtvRistrBank = lf.max_ltv_ristrutturazione ?? (policy.maxLtv ?? 0.80);
                    }
                } else {
                    maxLtvAcqBank = policy.maxLtv ?? 0.80;
                    maxLtvRistrBank = policy.maxLtv ?? 0.80;
                }

                isAcqOkBank = acqLtv <= (maxLtvAcqBank + 0.005);
                isRistrOkBank = (ristrCosto === 0 && ristrMutuo === 0) || (ristrLtv <= (maxLtvRistrBank + 0.005));
            }"""

assert old_loop_start in content, "old_loop_start not found in engine.js"
content = content.replace(old_loop_start, new_loop_start)

# In the later checks block, replace the re-declaration with reuse of variables
old_check_redeclaration = """            let ltvStatus = "ok";
            let ltvText = "";
            let maxLtvAcqBank = 0.80;
            let maxLtvRistrBank = 0.80;
            let isAcqOkBank = true;
            let isRistrOkBank = true;

            if (isAcquistoRistrutturazione) {
                const isSecondHome = (pratica.isSecondaCasa === true || pratica.finalitaSecondaCasa === true || pratica.secondaCasa === true);
                const lf = policy?.eccezioni_e_deroghe?.limiti_finalita?.acquisto_ristrutturazione || policy?.eccezioni_e_deroghe?.limiti_finalita?.acquisto_e_ristrutturazione;
                
                if (bankId === "mediobanca_premier" || bankId === "mediobanca premier") {
                    if (isSecondHome) {
                        maxLtvAcqBank = 0.75;
                        maxLtvRistrBank = 0.75;
                    } else {
                        maxLtvAcqBank = 0.80;
                        maxLtvRistrBank = 1.00; // Mediobanca Premier: 80% acquisto + 100% ristrutturazione
                    }
                } else if (bankId === "mps") {
                    maxLtvAcqBank = 0.80;
                    maxLtvRistrBank = 0.80; // MPS: 80% acquisto + 80% ristrutturazione
                } else if (bankId === "ing") {
                    maxLtvAcqBank = 0.80;
                    const hasAutonomoApplicant = subjectsCopy.some(s => (s.role === "Richiedente Principale" || s.role === "Cointestatario") && (s.tipoContratto === "lavoratore_autonomo" || s.tipoContratto === "autonomo" || s.tipoContratto === "professionista"));
                    maxLtvRistrBank = hasAutonomoApplicant ? 0.60 : 0.80;
                } else if (lf) {
                    if (isSecondHome && lf.max_ltv_acquisto_seconda_casa) {
                        maxLtvAcqBank = lf.max_ltv_acquisto_seconda_casa;
                    } else {
                        maxLtvAcqBank = lf.max_ltv_acquisto ?? (policy.maxLtv ?? 0.80);
                    }
                    if (isSecondHome && lf.max_ltv_ristrutturazione_seconda_casa) {
                        maxLtvRistrBank = lf.max_ltv_ristrutturazione_seconda_casa;
                    } else {
                        maxLtvRistrBank = lf.max_ltv_ristrutturazione ?? (policy.maxLtv ?? 0.80);
                    }
                } else {
                    maxLtvAcqBank = policy.maxLtv ?? 0.80;
                    maxLtvRistrBank = policy.maxLtv ?? 0.80;
                }

                isAcqOkBank = acqLtv <= (maxLtvAcqBank + 0.005);
                isRistrOkBank = (ristrCosto === 0 && ristrMutuo === 0) || (ristrLtv <= (maxLtvRistrBank + 0.005));"""

new_check_redeclaration = """            let ltvStatus = "ok";
            let ltvText = "";

            if (isAcquistoRistrutturazione) {"""

assert old_check_redeclaration in content, "old_check_redeclaration not found in engine.js"
content = content.replace(old_check_redeclaration, new_check_redeclaration)

with open("engine.js", "w", encoding="utf-8") as f:
    f.write(content)

print("engine.js scope fixed successfully!")
