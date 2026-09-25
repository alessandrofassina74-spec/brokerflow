import os
from playwright.sync_api import sync_playwright

def test_bank_docs_modal():
    html_path = os.path.abspath("index.html")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{html_path}")
        page.wait_for_timeout(1000)
        
        # Open modal for mediobanca_premier and wait for docs render
        res_mb = page.evaluate("""
            async () => {
                window.viewBankPolicyDetail("mediobanca_premier");
                await new Promise(r => setTimeout(r, 300));
                const docsContainer = document.getElementById("modal-policy-docs-container");
                const links = Array.from(docsContainer.querySelectorAll("a")).map(a => ({
                    text: a.innerText,
                    href: a.getAttribute("href")
                }));
                return links;
            }
        """)
        print("Mediobanca Premier Modal Docs:", res_mb)
        
        # Open modal for ing
        res_ing = page.evaluate("""
            async () => {
                window.viewBankPolicyDetail("ing");
                await new Promise(r => setTimeout(r, 300));
                const docsContainer = document.getElementById("modal-policy-docs-container");
                const links = Array.from(docsContainer.querySelectorAll("a")).map(a => ({
                    text: a.innerText,
                    href: a.getAttribute("href")
                }));
                return links;
            }
        """)
        print("ING Modal Docs:", res_ing)
        
        # Open modal for credit agricole
        res_ca = page.evaluate("""
            async () => {
                window.viewBankPolicyDetail("credit agricole italia");
                await new Promise(r => setTimeout(r, 300));
                const docsContainer = document.getElementById("modal-policy-docs-container");
                const links = Array.from(docsContainer.querySelectorAll("a")).map(a => ({
                    text: a.innerText,
                    href: a.getAttribute("href")
                }));
                return links;
            }
        """)
        print("Crédit Agricole Modal Docs:", res_ca)
        
        assert len(res_mb) > 0, "Mediobanca should have document link to mediobanca premier.pdf"
        assert any("mediobanca premier.pdf" in l["href"].lower() for l in res_mb)
        assert any("ing 2026.pdf" in l["href"].lower() for l in res_ing)
        assert any("credt agricole.pdf" in l["href"].lower() or "tassi credit agricole" in l["href"].lower() for l in res_ca)
        print("ALL DOCUMENT MODAL LINK TESTS PASSED!")
        browser.close()

if __name__ == "__main__":
    test_bank_docs_modal()
