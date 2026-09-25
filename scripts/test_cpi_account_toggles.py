import os, json

print("Audit of per-bank discount options in engine and app:")
# Verify that engine.js contains per-bank options support
with open("engine.js") as f:
    engine_txt = f.read()
assert "supportsCpiDiscount" in engine_txt, "supportsCpiDiscount missing in engine.js"
assert "supportsAccountOption" in engine_txt, "supportsAccountOption missing in engine.js"

# Verify that app.js contains per-bank toggles rendering
with open("app.js") as f:
    app_txt = f.read()
assert "bank-card-discount-options" in app_txt, "bank-card-discount-options missing in app.js"
assert "setBankDiscountOption" in app_txt, "setBankDiscountOption missing in app.js"

# Verify that index.html no longer contains the global top discount banner
with open("index.html") as f:
    html_txt = f.read()
assert "phase4-flag-cpi" not in html_txt, "phase4-flag-cpi should be removed from top of index.html"
assert "phase4-flag-conto" not in html_txt, "phase4-flag-conto should be removed from top of index.html"

print("✓ All structural and integrity checks for per-bank discount options PASSED 100%!")
