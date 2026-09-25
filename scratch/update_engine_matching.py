with open("engine.js", "r", encoding="utf-8") as f:
    content = f.read()

old_match = """                    } else if ((reqFin === "acquisto_ristrutturazione" || reqFin === "acquisto+ristrutturazione" || reqFin === "acquisto_e_ristrutturazione") && 
                               (prodFinList.includes("acquisto_ristrutturazione") || prodFinList.includes("acquisto+ristrutturazione") || (prodFinList.includes("acquisto") && prodFinList.includes("ristrutturazione")))) {"""

new_match = """                    } else if ((reqFin === "acquisto_ristrutturazione" || reqFin === "acquisto+ristrutturazione" || reqFin === "acquisto_e_ristrutturazione") && 
                               (prodFinList.includes("acquisto_ristrutturazione") || prodFinList.includes("acquisto+ristrutturazione") || prodFinList.includes("acquisto") || prodFinList.includes("ristrutturazione") || prodFinList.length === 0)) {"""

assert old_match in content, "old_match not found in engine.js"
content = content.replace(old_match, new_match)

with open("engine.js", "w", encoding="utf-8") as f:
    f.write(content)

print("engine.js product matching updated successfully!")
