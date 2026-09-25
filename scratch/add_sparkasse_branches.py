import json

file_path = "/Users/alessandrofassina/Desktop/broker flow/data/branches.json"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        branches_db = json.load(f)
        
    sparkasse_branches = [
        {"name": "Cassa di Risparmio di Bolzano - Sede Bolzano Centro", "prov": "Bolzano", "indirizzo": "Via Cassa di Risparmio, 12, Bolzano (BZ)", "telefono": "0471 231111"},
        {"name": "Cassa di Risparmio di Bolzano - Trento Sede", "prov": "Trento", "indirizzo": "Via San Pietro, 24, Trento (TN)", "telefono": "0461 231222"},
        {"name": "Cassa di Risparmio di Bolzano - Verona Porta Nuova", "prov": "Verona", "indirizzo": "Corso Porta Nuova, 35, Verona (VR)", "telefono": "045 8011222"},
        {"name": "Cassa di Risparmio di Bolzano - Padova Centro", "prov": "Padova", "indirizzo": "Via Altinate, 56, Padova (PD)", "telefono": "049 8751222"},
        {"name": "Cassa di Risparmio di Bolzano - Milano Sede", "prov": "Milano", "indirizzo": "Via Broletto, 35, Milano (MI)", "telefono": "02 87561222"},
        {"name": "Cassa di Risparmio di Bolzano - Treviso Sede", "prov": "Treviso", "indirizzo": "Viale Appiani, 14, Treviso (TV)", "telefono": "0422 591222"},
        {"name": "Cassa di Risparmio di Bolzano - Mestre Centro", "prov": "Venezia", "indirizzo": "Via Carducci, 21, Mestre, Venezia (VE)", "telefono": "041 5312222"},
        {"name": "Cassa di Risparmio di Bolzano - Vicenza Centro", "prov": "Vicenza", "indirizzo": "Corso Andrea Palladio, 114, Vicenza (VI)", "telefono": "0444 321222"}
    ]
    
    branches_db["sparkasse"] = sparkasse_branches
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(branches_db, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully added {len(sparkasse_branches)} Sparkasse branches to branches.json!")
    
except Exception as e:
    print("Error updating branches.json:", e)
