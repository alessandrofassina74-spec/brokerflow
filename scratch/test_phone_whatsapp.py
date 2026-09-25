import os
import sys
from playwright.sync_api import sync_playwright

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.goto("http://localhost:8080/", wait_until="networkidle")
        
        # 1. Check Wizard Step 1 fields
        page.click("#btn-mode-manual")
        page.wait_for_timeout(500)
        tel_input = page.query_selector("#wiz-q1-telefono")
        email_input = page.query_selector("#wiz-q1-email")
        print(f"Wizard Step 1 Phone Input Found: {tel_input is not None}")
        print(f"Wizard Step 1 Email Input Found: {email_input is not None}")
        
        # 2. Go to Pratiche module
        page.click("text=Pratiche")
        page.wait_for_timeout(500)
        
        # 3. Open first deal scheda
        first_btn = page.query_selector(".btn-apri-scheda, button:has-text('Apri Scheda')")
        if first_btn:
            first_btn.click()
            page.wait_for_timeout(500)
            
            # Check Card 1 Telefono & Email
            tel_val = page.inner_text("#sp-telefono-val")
            email_val = page.inner_text("#sp-email-val")
            print(f"Scheda Pratica Telefono: {tel_val}")
            print(f"Scheda Pratica Email: {email_val}")
            
            # Check Scheda Documenti Tab
            page.click("#tab-btn-documenti")
            page.wait_for_timeout(500)
            
            whatsapp_btn = page.query_selector("button:has-text('Invia su WhatsApp')")
            print(f"WhatsApp Button Found: {whatsapp_btn is not None}")
            
            page.screenshot(path="scratch/scheda_documenti_whatsapp_verified.png")
            print("Screenshot saved to scratch/scheda_documenti_whatsapp_verified.png")
            
        browser.close()

if __name__ == "__main__":
    test_app()
