
with open("app.js", "r", encoding="utf-8") as f:
    content = f.read()

target_pratica = """        isConsap: isConsap,
        hasCpi: hasCpi,
        aperturaConto: isAperturaConto,"""

replacement_pratica = """        isConsap: isConsap,
        hasCpi: hasCpi,
        aperturaConto: isAperturaConto,
        bankOptions: window.bankDiscountOptions || {},"""

assert target_pratica in content, "target_pratica not found"
content = content.replace(target_pratica, replacement_pratica, 1)

target_card_render = """                ${rateDisplayHtml}
            </div>
            
            ${strategiesHtml}"""

replacement_card_render = """                ${rateDisplayHtml}
            </div>
            
            ${(card.supportsCpiDiscount || card.supportsAccountOption) ? `
                <div class="bank-card-discount-options" style="margin-top: 0.75rem; padding: 0.55rem 0.85rem; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                        <span style="font-size: 0.85rem;">🎁</span>
                        <span style="font-size: 0.74rem; font-weight: 700; color: #334155;">Opzioni Sconto ${card.name}:</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                        ${card.supportsCpiDiscount ? `
                            <label class="bank-cpi-toggle-label" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.76rem; font-weight: 700; cursor: pointer; color: ${card.currentCpiSetting ? "#15803d" : "#64748b"}; background: ${card.currentCpiSetting ? "#ffffff" : "#f8fafc"}; border: 1.5px solid ${card.currentCpiSetting ? "#86efac" : "#cbd5e1"}; padding: 0.3rem 0.6rem; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.2s;">
                                <input type="checkbox" class="bank-cpi-checkbox" data-bank-id="${card.bankId}" ${card.currentCpiSetting ? "checked" : ""} onchange="window.setBankDiscountOption('${card.bankId}', 'hasCpi', this.checked)" style="width: 15px; height: 15px; accent-color: #16a34a; cursor: pointer;">
                                <span>🛡️ Polizza CPI <span style="font-size: 0.7rem; color: #16a34a; font-weight: 800; background: #dcfce7; padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.2rem;">${card.cpiDiscountLabel || "-0,50%"}</span></span>
                            </label>
                        ` : ""}
                        ${card.supportsAccountOption ? `
                            <label class="bank-conto-toggle-label" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.76rem; font-weight: 700; cursor: pointer; color: ${card.currentAccountSetting ? "#1e40af" : "#64748b"}; background: ${card.currentAccountSetting ? "#ffffff" : "#f8fafc"}; border: 1.5px solid ${card.currentAccountSetting ? "#93c5fd" : "#cbd5e1"}; padding: 0.3rem 0.6rem; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.2s;">
                                <input type="checkbox" class="bank-conto-checkbox" data-bank-id="${card.bankId}" ${card.currentAccountSetting ? "checked" : ""} onchange="window.setBankDiscountOption('${card.bankId}', 'aperturaConto', this.checked)" style="width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer;">
                                <span>💳 Apertura Conto / Accredito</span>
                            </label>
                        ` : ""}
                    </div>
                </div>
            ` : ""}
            
            ${strategiesHtml}"""

assert target_card_render in content, "target_card_render not found"
content = content.replace(target_card_render, replacement_card_render, 1)

target_sync_func = """window.syncPhase4DiscountFlags = function() {"""

replacement_sync_func = """window.bankDiscountOptions = window.bankDiscountOptions || {};

window.setBankDiscountOption = function(bankId, optKey, val) {
    if (!bankId) return;
    window.bankDiscountOptions[bankId] = window.bankDiscountOptions[bankId] || {};
    window.bankDiscountOptions[bankId][optKey] = Boolean(val);
    if (typeof window.updateCalculations === "function") {
        window.updateCalculations();
    }
};

window.syncPhase4DiscountFlags = function() {"""

assert target_sync_func in content, "target_sync_func not found"
content = content.replace(target_sync_func, replacement_sync_func, 1)

with open("app.js", "w", encoding="utf-8") as f:
    f.write(content)

print("app.js updated successfully with per-bank discount options and toggles!")
