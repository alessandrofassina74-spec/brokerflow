import json
import os

workspace = "/Users/alessandrofassina/Desktop/broker flow"
policies_path = os.path.join(workspace, "data", "policies.json")

with open(policies_path, "r", encoding="utf-8") as f:
    policies = json.load(f)

mps = policies.get("mps", {})
mri_grid = mps.get("mriGrid", {})

print("================================================================")
print("🏛️ TABELLA UFFICIALE SOGLIE DI SUSSISTENZA MINIMA (MRI) MPS")
print("================================================================")
print("Banca:", mps.get("name"))
print()

for area in ["nord", "centro", "sud"]:
    area_data = mri_grid.get(area, {})
    print(f"📍 Area Geografica: {area.upper()}")
    print("-" * 50)
    for n in range(1, 6):
        val = area_data.get(str(n))
        print(f"  • {n} Componente{'i' if n > 1 else ''}: € {val}/mese")
    add = area_data.get("additional", 300)
    print(f"  • Oltre 5 componenti: + € {add}/mese per ogni componente aggiuntivo")
    print()

# Test Practical calculation for 1 to 5 components
print("================================================================")
print("🔬 SIMULAZIONE CALCOLO PRATICA CON REDDITO & RATA")
print("================================================================")
netto = 2200.0
rata = 650.0
altre_rate = 150.0
residuo = netto - rata - altre_rate

print(f"Dati di prova: Reddito Netto € {netto:.2f} | Rata Mutuo € {rata:.2f} | Altri Prestiti € {altre_rate:.2f}")
print(f"Reddito Residuo post-rata disponibile per sussistenza: € {residuo:.2f}/mese\n")

print(f"{'Componenti':<12} | {'Soglia MRI (Nord)':<18} | {'Residuo':<12} | {'Verifica MPS':<15}")
print("-" * 65)

for n in range(1, 6):
    soglia = area_data = mri_grid.get("nord", {}).get(str(n), 0)
    is_ok = residuo >= soglia
    status_str = f"✅ OK (+€{residuo - soglia:.2f})" if is_ok else f"❌ KO (-€{soglia - residuo:.2f})"
    print(f"{n:<12} | € {soglia:<16} | € {residuo:<10.2f} | {status_str}")

