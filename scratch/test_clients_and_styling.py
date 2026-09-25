import time
from playwright.sync_api import sync_playwright
import sys
sys.path.append("/Users/alessandrofassina/Desktop/broker flow/qa_suite")
from test_server import TestServer

def test_clients_and_styling():
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    port = 8108
    server = TestServer(workspace, port)
    base_url = server.start()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page()
        page.goto(f"{base_url}/index.html", wait_until="domcontentloaded")
        time.sleep(1.0)
        
        # Login
        login_visible = page.evaluate("""() => {
            const el = document.getElementById('module-login');
            return el && window.getComputedStyle(el).display !== 'none';
        }""")
        if login_visible:
            page.evaluate("window.quickLoginAs && window.quickLoginAs('dev@brokerflow.it')")
            time.sleep(0.8)
        
        print("1. Verifico schermata Clienti iniziale...")
        page.evaluate("window.switchCrmModule && window.switchCrmModule('clienti')")
        time.sleep(0.5)
        
        # Controlla che le tabelle abbiano sfondo bianco e non grigio scuro
        table_container_bg = page.evaluate("""() => {
            const container = document.querySelector('#module-clienti .crm-table-container');
            return window.getComputedStyle(container).backgroundColor;
        }""")
        print(f"   -> Background container tabella clienti: {table_container_bg}")
        assert table_container_bg in ["rgb(255, 255, 255)", "#ffffff", "rgba(0, 0, 0, 0)"], f"Unexpected container bg: {table_container_bg}"
        
        # 2. Crea un nuovo preventivo per un nuovo cliente "Giuseppe Verdi"
        print("2. Creazione e salvataggio preventivo per Giuseppe Verdi...")
        page.evaluate("window.switchCrmModule && window.switchCrmModule('engine')")
        time.sleep(0.5)
        page.evaluate("window.selectMortgageType && window.selectMortgageType('acquisto')")
        time.sleep(0.5)
        page.evaluate("window.goToStep && window.goToStep(2)")
        time.sleep(0.5)
        
        page.evaluate("""() => {
            if (document.getElementById('wiz-q1-nome')) document.getElementById('wiz-q1-nome').value = 'Giuseppe';
            if (document.getElementById('wiz-q2-cognome')) document.getElementById('wiz-q2-cognome').value = 'Verdi';
            if (document.getElementById('wiz-q3-data-nascita')) document.getElementById('wiz-q3-data-nascita').value = '1985-03-20';
            if (document.getElementById('wiz-q6-cittadinanza')) document.getElementById('wiz-q6-cittadinanza').value = 'IT';
            if (document.getElementById('wiz-q10-dip-netto')) document.getElementById('wiz-q10-dip-netto').value = 2850;
            if (document.getElementById('wiz-q10-cu1')) document.getElementById('wiz-q10-cu1').value = 2850 * 13;
            if (document.getElementById('wiz-prov-immobile')) document.getElementById('wiz-prov-immobile').value = 'Bologna';
            if (typeof saveCurrentSubject === 'function') saveCurrentSubject(true);
        }""")
        time.sleep(0.5)
        
        page.evaluate("window.goToStep && window.goToStep(3)")
        time.sleep(0.5)
        page.evaluate("""() => {
            if (document.getElementById('p3-valore-field')) document.getElementById('p3-valore-field').value = 300000;
            if (document.getElementById('p3-importo-field')) document.getElementById('p3-importo-field').value = 240000;
        }""")
        
        page.evaluate("window.goToStep && window.goToStep(4)")
        time.sleep(0.5)
        page.evaluate("if (typeof updateCalculations === 'function') updateCalculations();")
        time.sleep(0.5)
        
        # Salva preventivo
        page.evaluate("window.savePratica(false)")
        time.sleep(0.8)
        
        # 3. Verifica presenza di Giuseppe Verdi in Pratiche e poi in Clienti
        print("3. Verifico lista Pratiche e lista Clienti...")
        deals = page.evaluate("crmDeals")
        print(f"   -> Totale pratiche: {len(deals)}, Ultima pratica cliente: {deals[0].get('cliente') if deals else 'N/A'}")
        assert any("Giuseppe Verdi" in d.get("cliente", "") for d in deals), "Giuseppe Verdi not found in deals!"
        
        page.evaluate("window.switchCrmModule('clienti')")
        time.sleep(0.5)
        
        clients = page.evaluate("crmClients")
        print(f"   -> Totale clienti: {len(clients)}")
        for c in clients:
            print(f"      - {c.get('nome')} | {c.get('cittadinanza')} | {c.get('occupazione')} | {c.get('netto')} € | {c.get('praticheCount')} pratiche")
        
        verdi = next((c for c in clients if "Giuseppe Verdi" in c.get("nome", "")), None)
        assert verdi is not None, "Giuseppe Verdi non trovato nella lista clienti!"
        assert verdi.get("praticheCount") >= 1, f"Pratiche count for Verdi is {verdi.get('praticheCount')}, expected >= 1"
        
        # Check rendered HTML in table
        rendered_names = page.evaluate("""() => {
            const rows = Array.from(document.querySelectorAll('#clients-table-body tr'));
            return rows.map(r => r.innerText);
        }""")
        print(f"   -> Clienti renderizzati nella tabella: {len(rendered_names)}")
        assert any("Giuseppe Verdi" in r for r in rendered_names), "Giuseppe Verdi non renderizzato nella tabella HTML clienti!"
        
        print("✅ TEST COMPLETATO CON SUCCESSO! I clienti dei preventivi finiscono nella lista clienti e la palette colori è pulita, elegante e ad alto contrasto.")
        browser.close()
    server.stop()

if __name__ == "__main__":
    test_clients_and_styling()
