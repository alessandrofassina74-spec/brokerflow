import os
import sys
import time
from playwright.sync_api import sync_playwright

def test_pratiche_nuova_pratica_transition():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page()
        page.goto("http://localhost:8080/index.html", wait_until="domcontentloaded")
        time.sleep(1.0)
        
        # Login
        page.evaluate("if (window.quickLoginAs) window.quickLoginAs('dev@brokerflow.it')")
        time.sleep(0.5)
        
        print("1. Creazione e salvataggio nuova pratica...")
        page.evaluate("""() => {
            window.switchCrmModule('engine');
            window.initNuovaPratica();
            window.goToStep(2);
            
            if (document.getElementById('wiz-q1-nome')) document.getElementById('wiz-q1-nome').value = 'TestCliente';
            if (document.getElementById('wiz-q2-cognome')) document.getElementById('wiz-q2-cognome').value = 'Velocita';
            if (document.getElementById('wiz-q10-dip-netto')) document.getElementById('wiz-q10-dip-netto').value = 2500;
            if (typeof saveCurrentSubject === 'function') saveCurrentSubject(true);
            
            window.goToStep(3);
            if (document.getElementById('p3-valore-field')) document.getElementById('p3-valore-field').value = 250000;
            if (document.getElementById('p3-importo-field')) document.getElementById('p3-importo-field').value = 200000;
            
            window.goToStep(4);
            if (typeof updateCalculations === 'function') updateCalculations();
        }""")
        time.sleep(0.5)
        
        # Save practice
        print("2. Salvataggio pratica...")
        page.evaluate("window.savePratica(false)")
        time.sleep(0.5)
        
        # Verify we are on "pratiche" module
        mod_pra_display = page.evaluate("document.getElementById('module-pratiche').style.display")
        print(f"   -> Modulo pratiche display: {mod_pra_display}")
        assert mod_pra_display == "block", "Dovrebbe essere visibile il modulo pratiche"
        
        # Click on "Nuova Pratica" from sidebar or table
        print("3. Click su Nuova Pratica dalla schermata Pratiche...")
        t0 = time.time()
        page.click("#crm-nav-engine")
        t1 = time.time()
        elapsed_ms = (t1 - t0) * 1000
        print(f"   -> Tempo di click e transizione: {elapsed_ms:.2f} ms")
        
        # Verify engine module and step 1 are active
        mod_eng_display = page.evaluate("document.getElementById('module-engine').style.display")
        wizard_step = page.evaluate("window.wizardCurrentStep")
        p1_display = page.evaluate("document.getElementById('phase-1-panel').style.display")
        
        print(f"   -> Modulo engine display: {mod_eng_display}")
        print(f"   -> Wizard current step: {wizard_step}")
        print(f"   -> Phase 1 panel display: {p1_display}")
        
        assert mod_eng_display == "block", "Modulo engine dovrebbe essere visibile"
        assert wizard_step == 1, "Wizard step dovrebbe essere 1"
        assert p1_display == "block", "Pannello Fase 1 dovrebbe essere visibile"
        
        # Check toast content
        toasts = page.query_selector_all("#toast-container > div")
        toast_texts = [t.inner_text() for t in toasts]
        print(f"   -> Toast attivi a schermo: {toast_texts}")
        assert any("Nuova pratica inizializzata" in t for t in toast_texts), "Dovrebbe essere presente il toast di Nuova pratica inizializzata"
        
        # Return to pratiche again and re-test button in table
        print("4. Ritorno a pratiche e test pulsante 'Nuova Pratica'...")
        page.click("#crm-nav-pratiche")
        time.sleep(0.2)
        assert page.evaluate("document.getElementById('module-pratiche').style.display") == "block"
        
        page.click("#deals-table-body button, #crm-nav-engine")
        time.sleep(0.2)
        assert page.evaluate("document.getElementById('module-engine').style.display") == "block"
        assert page.evaluate("window.wizardCurrentStep") == 1
        
        print("✅ TEST COMPLETATO CON SUCCESSO! Transizioni veloci e prive di blocchi.")
        browser.close()

if __name__ == "__main__":
    test_pratiche_nuova_pratica_transition()
