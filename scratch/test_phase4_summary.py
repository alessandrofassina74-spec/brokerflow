import time
from playwright.sync_api import sync_playwright

def test_phase4_client_summary():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page()
        page.goto("http://localhost:8080/index.html", wait_until="domcontentloaded")
        time.sleep(1.0)
        
        # Login
        page.evaluate("if (window.quickLoginAs) window.quickLoginAs('dev@brokerflow.it')")
        time.sleep(0.5)
        
        print("1. Inizializzazione pratica con richiedente e parametri...")
        page.evaluate("""() => {
            window.switchCrmModule('engine');
            window.initNuovaPratica();
            window.goToStep(2);
            
            if (document.getElementById('wiz-q1-nome')) document.getElementById('wiz-q1-nome').value = 'Alessandro';
            if (document.getElementById('wiz-q2-cognome')) document.getElementById('wiz-q2-cognome').value = 'Fassina';
            if (document.getElementById('wiz-q3-data-nascita')) document.getElementById('wiz-q3-data-nascita').value = '1985-04-12';
            if (document.getElementById('wiz-q4-stato-civile')) document.getElementById('wiz-q4-stato-civile').value = 'sposato';
            if (document.getElementById('wiz-q4-regime')) document.getElementById('wiz-q4-regime').value = 'separazione';
            if (document.getElementById('wiz-q5-figli')) document.getElementById('wiz-q5-figli').value = 'si';
            if (document.getElementById('wiz-q5-num-figli')) document.getElementById('wiz-q5-num-figli').value = '2';
            if (document.getElementById('wiz-q5-eta-figli')) document.getElementById('wiz-q5-eta-figli').value = '6, 10';
            if (document.getElementById('wiz-persone-nucleo')) document.getElementById('wiz-persone-nucleo').value = '4';
            if (document.getElementById('wiz-prov-immobile')) document.getElementById('wiz-prov-immobile').value = 'Torino';
            if (document.getElementById('wiz-q10-dip-netto')) document.getElementById('wiz-q10-dip-netto').value = '3200';
            
            if (typeof saveCurrentSubject === 'function') saveCurrentSubject(true);
            
            window.goToStep(3);
            if (document.getElementById('p3-valore-field')) document.getElementById('p3-valore-field').value = '300000';
            if (document.getElementById('p3-importo-field')) document.getElementById('p3-importo-field').value = '240000';
            if (document.getElementById('wiz-p3-durata')) document.getElementById('wiz-p3-durata').value = '30';
            if (document.getElementById('wiz-p3-finalita')) document.getElementById('wiz-p3-finalita').value = 'acquisto';
            
            window.goToStep(4);
            if (typeof updateCalculations === 'function') updateCalculations();
        }""")
        time.sleep(0.8)
        
        # Check summary card content
        summary_html = page.inner_html("#phase4-client-profile-card")
        print("2. Verifica contenuto scheda sintesi richiedenti:")
        print(f"   -> Presenza 'Sintesi Pratica & Profilo Richiedenti': {'Sintesi Pratica' in summary_html}")
        print(f"   -> Presenza 'Alessandro Fassina': {'Alessandro Fassina' in summary_html}")
        print(f"   -> Presenza 'Coniugato/a (Separazione dei beni)': {'Separazione dei beni' in summary_html}")
        print(f"   -> Presenza '2 figli (età: 6, 10)': {'2 figli' in summary_html}")
        print(f"   -> Presenza 'Provincia: TORINO': {'TORINO' in summary_html}")
        
        assert "Sintesi Pratica" in summary_html
        assert "Alessandro Fassina" in summary_html
        assert "Separazione dei beni" in summary_html
        assert "2 figli" in summary_html
        assert "TORINO" in summary_html
        
        print("✅ TEST SCHEDA SINTESI CLIENTE COMPLETATO CON SUCCESSO!")
        browser.close()

if __name__ == "__main__":
    test_phase4_client_summary()
