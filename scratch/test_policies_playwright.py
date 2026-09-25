import asyncio
import os
from playwright.async_api import async_playwright

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        await page.goto("http://localhost:8889/index.html")
        await page.wait_for_timeout(2000)

        with open("/Users/alessandrofassina/Desktop/broker flow/scratch/test_bundle.js", "r") as f:
            js_code = f.read()

        test_results = await page.evaluate(f"() => {{ {js_code} }}")

        print("\n================ TEST EXECUTION RESULTS ================")
        all_ok = True
        for r in test_results:
            status = "✅ PASS" if r["passed"] else "❌ FAIL"
            if not r["passed"]:
                all_ok = False
            print(f"{status}: {r['test']}")
            print(f"   Details: {r['details']}")

        print("========================================================\n")

        if console_errors:
            print("Browser Console Errors:")
            for err in console_errors:
                print("  -", err)
        else:
            print("Zero console errors in index.html.")

        await browser.close()
        return all_ok

if __name__ == "__main__":
    success = asyncio.run(run_tests())
    exit(0 if success else 1)
