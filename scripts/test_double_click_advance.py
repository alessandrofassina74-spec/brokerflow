import time
from playwright.sync_api import sync_playwright

def test_double_click_advance():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        
        # 1. Open home page
        page.goto("http://localhost:8080/", wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        
        # Authenticate if login overlay is visible
        login_visible = page.evaluate("""() => {
            const el = document.getElementById('module-login');
            return el && window.getComputedStyle(el).display !== 'none';
        }""")
        if login_visible:
            page.evaluate("window.quickLoginAs && window.quickLoginAs('dev@brokerflow.it')")
            page.wait_for_timeout(800)

        # Switch to Engine module -> Phase 1
        page.evaluate("window.initNuovaPratica && window.initNuovaPratica()")
        page.wait_for_timeout(800)

        assert page.is_visible("#phase-1-panel"), "❌ Phase 1 panel should be visible initially"
        assert not page.is_visible("#phase-2-panel"), "❌ Phase 2 panel should NOT be visible initially"
        print("✅ Started at Phase 1 (Nuova Pratica)")

        # 2. Test Single Click on "Liquidità": should select it, but STAY in Phase 1
        card_liquidita = page.locator('.mortgage-type-card[data-type="liquidita"]')
        assert card_liquidita.count() > 0, "❌ Liquidita card not found"
        
        card_liquidita.click()
        page.wait_for_timeout(300)

        is_active = page.evaluate("""() => {
            const el = document.querySelector('.mortgage-type-card[data-type="liquidita"]');
            return el && el.classList.contains('active');
        }""")
        assert is_active, "❌ Liquidita card should be active after single click"
        assert page.is_visible("#phase-1-panel"), "❌ Single click should stay in Phase 1"
        assert not page.is_visible("#phase-2-panel"), "❌ Single click should NOT advance to Phase 2"
        print("✅ Single click on Liquidità selects card and stays on Phase 1")

        # 3. Test Double Click on "Liquidità": should immediately advance to Phase 2
        card_liquidita.dblclick()
        page.wait_for_timeout(500)

        assert not page.is_visible("#phase-1-panel"), "❌ Phase 1 panel should be hidden after double click"
        assert page.is_visible("#phase-2-panel"), "❌ Phase 2 panel should be visible after double click"
        print("✅ Double click on Liquidità advances directly to Phase 2!")

        # Verify selected finalita
        finalita_val = page.evaluate("() => document.getElementById('wiz-p3-finalita')?.value")
        assert finalita_val == "liquidita", f"❌ Expected finalita 'liquidita', got '{finalita_val}'"
        print(f"✅ Verified wiz-p3-finalita is '{finalita_val}'")

        # 4. Go back to Phase 1
        page.click("#btn-wizard-back")
        page.wait_for_timeout(400)
        assert page.is_visible("#phase-1-panel"), "❌ Should be back in Phase 1"
        print("✅ Navigated back to Phase 1")

        # 5. Test Double Click on "Acquisto"
        card_acquisto = page.locator('.mortgage-type-card[data-type="acquisto"]')
        card_acquisto.dblclick()
        page.wait_for_timeout(500)

        assert not page.is_visible("#phase-1-panel"), "❌ Phase 1 panel should be hidden after double click on Acquisto"
        assert page.is_visible("#phase-2-panel"), "❌ Phase 2 panel should be visible after double click on Acquisto"
        
        finalita_val2 = page.evaluate("() => document.getElementById('wiz-p3-finalita')?.value")
        assert finalita_val2 == "acquisto", f"❌ Expected finalita 'acquisto', got '{finalita_val2}'"
        print(f"✅ Double click on Acquisto advances directly to Phase 2 with finalita='{finalita_val2}'!")

        # 6. Test Double Click on "Surroga"
        page.click("#btn-wizard-back")
        page.wait_for_timeout(400)
        card_surroga = page.locator('.mortgage-type-card[data-type="surroga"]')
        card_surroga.dblclick()
        page.wait_for_timeout(500)

        assert page.is_visible("#phase-2-panel"), "❌ Should advance to Phase 2 after double click on Surroga"
        finalita_val3 = page.evaluate("() => document.getElementById('wiz-p3-finalita')?.value")
        assert finalita_val3 == "surroga", f"❌ Expected finalita 'surroga', got '{finalita_val3}'"
        print(f"✅ Double click on Surroga advances directly to Phase 2 with finalita='{finalita_val3}'!")

        browser.close()
        print("\n🎉 ALL DOUBLE-CLICK ADVANCE TESTS PASSED FLAWLESSLY!")

if __name__ == "__main__":
    test_double_click_advance()
