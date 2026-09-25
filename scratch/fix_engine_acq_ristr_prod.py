with open("engine.js", "r", encoding="utf-8") as f:
    content = f.read()

old_prod_ltv = """                let maxAllowedProductLtv = prod.isConsap ? prod.ltvMax : Math.min(policy.maxLtv, prod.ltvMax);
                if (hasSecondProperty && allowsPluriIpoteca) {
                    maxAllowedProductLtv = (bankId === "mediobanca_premier") ? 0.75 : 0.80;
                } else if (isCA_prod && isGreenPratica && !prod.isConsap) {
                    maxAllowedProductLtv = Math.max(maxAllowedProductLtv, 0.95);
                }
                if (effectiveBankLtv > (maxAllowedProductLtv + 0.005)) return;"""

new_prod_ltv = """                let maxAllowedProductLtv = prod.isConsap ? prod.ltvMax : Math.min(policy.maxLtv, prod.ltvMax);
                if (isAcquistoRistrutturazione) {
                    const maxGlobalLtvBank = totaleValoreAcqRistr > 0 
                        ? ((maxLtvAcqBank * acqPrezzo + maxLtvRistrBank * ristrCosto) / totaleValoreAcqRistr)
                        : 0.80;
                    if (isAcqOkBank && isRistrOkBank) {
                        maxAllowedProductLtv = Math.max(maxAllowedProductLtv, maxGlobalLtvBank);
                    }
                } else if (hasSecondProperty && allowsPluriIpoteca) {
                    maxAllowedProductLtv = (bankId === "mediobanca_premier") ? 0.75 : 0.80;
                } else if (isCA_prod && isGreenPratica && !prod.isConsap) {
                    maxAllowedProductLtv = Math.max(maxAllowedProductLtv, 0.95);
                }
                if (effectiveBankLtv > (maxAllowedProductLtv + 0.005)) return;"""

assert old_prod_ltv in content, "old_prod_ltv not found in engine.js"
content = content.replace(old_prod_ltv, new_prod_ltv)

with open("engine.js", "w", encoding="utf-8") as f:
    f.write(content)

print("engine.js product LTV check updated successfully for Acquisto + Ristrutturazione!")
