import time
from playwright.sync_api import sync_playwright

def test_multi_subject_summary():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page()
        page.goto("http://localhost:8080/index.html", wait_until="domcontentloaded")
        time.sleep(1.0)
        
        # Login
        page.evaluate("if (window.quickLoginAs) window.quickLoginAs('dev@brokerflow.it')")
        time.sleep(0.5)
        
        print("1. Test con Richiedente Principale + Cointestatario Autonomo...")
        page.evaluate("""() => {
            window.switchCrmModule('engine');
            window.initNuovaPratica();
            window.goToStep(2);
            
            if (document.getElementById('wiz-q1-nome')) document.getElementById('wiz-q1-nome').value = 'Marco';
            if (document.getElementById('wiz-q2-cognome')) document.getElementById('wiz-q2-cognome').value = 'Rossi';
            if (document.getElementById('wiz-q10-dip-netto')) document.getElementById('wiz-q10-dip-netto').value = '2100';
            
            wizardSubjects = [
                {
                    role: 'Richiedente Principale',
                    nome: 'Marco',
                    cognome: 'Rossi',
                    eta: 34,
                    sesso: 'M',
                    cittadinanza: 'IT',
                    statoCivile: 'celibe',
                    tipoContratto: 'dipendente_ti',
                    macroCategoria: 'dipendente',
                    anzianitaMesi: 48,
                    netto: 2100,
                    incomes: [{ tipoContratto: 'dipendente_ti', netto: 2100 }]
                },
                {
                    role: 'Cointestatario',
                    nome: 'Giulia',
                    cognome: 'Bianchi',
                    eta: 31,
                    sesso: 'F',
                    cittadinanza: 'IT',
                    statoCivile: 'celibe',
                    tipoContratto: 'autonomo',
                    macroCategoria: 'autonomo',
                    autRegime: 'forfettario',
                    anniAttivita: 4,
                    netto: 1800,
                    incomes: [{ tipoContratto: 'autonomo', netto: 1800 }]
                }
            ];
            
            window.goToStep(3);
            if (document.getElementById('p3-valore-field')) document.getElementById('p3-valore-field').value = '280000';
            if (document.getElementById('p3-importo-field')) document.getElementById('p3-importo-field').value = '220000';
            if (document.getElementById('wiz-prov-immobile')) document.getElementById('wiz-prov-immobile').value = 'Milano';
            
            window.goToStep(4);
            if (typeof updateCalculations === 'function') updateCalculations();
        }""")
        time.sleep(0.8)
        
        summary_html = page.inner_html("#phase4-client-profile-card")
        print("2. Verifica visualizzazione cointestatario e reddito cumulato:")
        print("   -> Contenuto HTML:")
        print(summary_html)
        print(f"   -> Presenza 'Marco Rossi': {'Marco Rossi' in summary_html}")
        print(f"   -> Presenza 'Giulia Bianchi': {'Giulia Bianchi' in summary_html}")
        print(f"   -> Presenza 'Autonomo Regime Forfettario': {'Autonomo Regime Forfettario' in summary_html}")
        print(f"   -> Presenza 'Reddito Complessivo': {'Reddito Complessivo' in summary_html}")
        
        assert "Marco Rossi" in summary_html
        assert "Giulia Bianchi" in summary_html
        assert "Autonomo Regime Forfettario" in summary_html
        assert "Reddito Complessivo" in summary_html
        
        print("✅ TEST MULTI-RICHIEDENTE COMPLETATO CON SUCCESSO!")
        browser.close()

if __name__ == "__main__":
    test_multi_subject_summary()
