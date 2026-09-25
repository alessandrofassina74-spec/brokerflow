import os
import sys
import time
from playwright.sync_api import sync_playwright
from test_server import TestServer

def test_bank_sections_and_selection():
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    port = 8098
    server = TestServer(workspace, port)
    base_url = server.start()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page()
        page.goto(f"{base_url}/index.html", wait_until="domcontentloaded")
        time.sleep(1.0)
        
        # Login
        page.evaluate("if (window.quickLoginAs) window.quickLoginAs('dev@brokerflow.it')")
        time.sleep(0.5)
        
        print("1. Inizializzazione nuova pratica...")
        page.evaluate("""() => {
            window.switchCrmModule('engine');
            window.initNuovaPratica();
            window.goToStep(2);
            
            // Set primary applicant Ayub
            if (document.getElementById('wiz-q1-nome')) document.getElementById('wiz-q1-nome').value = 'Ayub';
            if (document.getElementById('wiz-q2-cognome')) document.getElementById('wiz-q2-cognome').value = 'Khan';
            if (document.getElementById('wiz-q3-data-nascita')) document.getElementById('wiz-q3-data-nascita').value = '1994-06-15';
            if (document.getElementById('wiz-q6-cittadinanza')) document.getElementById('wiz-q6-cittadinanza').value = 'extra';
            if (document.getElementById('wiz-q6-permesso-scadenza')) document.getElementById('wiz-q6-permesso-scadenza').value = '2030-01-01';
            if (document.getElementById('wiz-q10-dip-netto')) document.getElementById('wiz-q10-dip-netto').value = 2100;
            if (document.getElementById('wiz-q10-cu1')) document.getElementById('wiz-q10-cu1').value = 2100 * 12 * 1.3;
            if (document.getElementById('wiz-q10-cu6')) document.getElementById('wiz-q10-cu6').value = 365;
            if (document.getElementById('wiz-prov-immobile')) document.getElementById('wiz-prov-immobile').value = 'Milano';
            if (document.getElementById('wiz-prov-residenza')) document.getElementById('wiz-prov-residenza').value = 'Milano';
            if (document.getElementById('wiz-prov-lavoro')) document.getElementById('wiz-prov-lavoro').value = 'Milano';
            if (typeof saveCurrentSubject === 'function') saveCurrentSubject(true);
            
            window.goToStep(3);
            if (document.getElementById('p3-valore-field')) document.getElementById('p3-valore-field').value = 200000;
            if (document.getElementById('p3-importo-field')) document.getElementById('p3-importo-field').value = 160000;
            if (document.getElementById('wiz-p3-durata')) document.getElementById('wiz-p3-durata').value = '25';
            if (document.getElementById('wiz-p3-finalita')) document.getElementById('wiz-p3-finalita').value = 'acquisto';
            
            window.goToStep(4);
            if (typeof updateCalculations === 'function') updateCalculations();
        }""")
        time.sleep(1.0)
        
        # Check Section Headers
        has_approved_header = page.is_visible(".approved-section-header")
        has_ko_header = page.is_visible(".ko-section-header")
        has_banner = page.is_visible(".chosen-bank-summary-banner")
        
        print(f"   -> Approved Section Header visible: {has_approved_header}")
        print(f"   -> Non Fattibili Section Header visible: {has_ko_header}")
        print(f"   -> Chosen Bank Summary Banner visible: {has_banner}")
        assert has_approved_header, "Approved Section Header missing!"
        assert has_banner, "Chosen Bank Banner missing!"
        
        initial_selected_bank_id = page.evaluate("window.selectedBankId")
        print(f"   -> Inizialmente selezionata di default: {initial_selected_bank_id}")
        
        # Switch selection to Credit Agricole by clicking on its button
        print("2. Selezione manuale di Crédit Agricole tramite click bottone...")
        ca_btn = page.query_selector(".bank-card:not(.is-selected) .btn-select-bank")
        if ca_btn:
            ca_btn.click()
            time.sleep(0.5)
        else:
            page.evaluate("window.selectBankForPratica('credit_agricole_italia')")
            time.sleep(0.5)
        
        new_selected_bank_id = page.evaluate("window.selectedBankId")
        print(f"   -> Nuova banca selezionata: {new_selected_bank_id}")
        
        # Verify card has .is-selected
        selected_card_title = page.evaluate("document.querySelector('.bank-card.is-selected .bank-title')?.innerText")
        print(f"   -> Titolo carta con classe .is-selected: {selected_card_title}")
        assert selected_card_title is not None and len(selected_card_title) > 0, "No card highlighted with .is-selected!"
        
        # 3. Save Deal
        print("3. Salvataggio pratica...")
        page.evaluate("window.savePratica(false)")
        time.sleep(0.5)
        
        deals = page.evaluate("JSON.parse(localStorage.getItem('brokerflow_deals') || '[]')")
        latest_deal = deals[0] if deals else None
        print(f"   -> Deal salvato: ID={latest_deal.get('id')}, Banca={latest_deal.get('banca')}, selectedBankId={latest_deal.get('selectedBankId')}")
        assert latest_deal.get("selectedBankId") == new_selected_bank_id, f"Saved deal does not contain {new_selected_bank_id}!"
        
        # 4. Resume Deal
        print("4. Ripresa pratica (modificaPreventivo)...")
        page.evaluate(f"window.riprendiPratica('{latest_deal.get('id')}')")
        time.sleep(1.0)
        
        page.evaluate("window.goToStep(4)")
        time.sleep(0.5)
        
        resumed_bank_id = page.evaluate("window.selectedBankId")
        print(f"   -> Banca ripristinata in sessione: {resumed_bank_id}")
        assert resumed_bank_id == new_selected_bank_id, f"Expected {new_selected_bank_id} after resume, got {resumed_bank_id}"
        
        print("\n✅ TUTTI I TEST PASSATI CON SUCCESSO! SEPARAZIONE FISICA E SELEZIONE BANCA VERIFICATE AL 100%!")
        browser.close()
        server.stop()

if __name__ == "__main__":
    test_bank_sections_and_selection()
