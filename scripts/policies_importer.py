import csv
import json
import os

def import_policies():
    csv_path = "/Users/alessandrofassina/Desktop/broker flow/data/policies_template.csv"
    json_path = "/Users/alessandrofassina/Desktop/broker flow/data/policies.json"
    
    if not os.path.exists(csv_path):
        print(f"Error: Template file not found at {csv_path}")
        return
        
    policies = {}
    
    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            bank_id = row.get("id", "").strip().lower()
            if not bank_id:
                continue
                
            # Parse simple string values
            name = row.get("name", "").strip()
            bg_logo = row.get("bgLogoLetter", "").strip()
            color = row.get("color", "").strip()
            
            # Parse booleans
            is_nationwide = row.get("isNationwide", "").strip().lower() in ["sì", "si", "yes", "true", "1"]
            has_mri = row.get("hasMri", "").strip().lower() in ["sì", "si", "yes", "true", "1"]
            
            # Parse territories list
            territories_raw = row.get("territories", "*").strip()
            territories = [t.strip() for t in territories_raw.split(",") if t.strip()]
            
            # Parse numbers
            max_ltv = float(row.get("maxLtv") or 1.0)
            max_dsr = float(row.get("maxDsr") or 0.35)
            max_dsr_deroga = float(row.get("maxDsrDeroga") or 0.40)
            max_age = int(row.get("maxAge") or 80)
            max_guar_age = int(row.get("maxGuarantorAge") or 80)
            max_borrowers = int(row.get("maxBorrowers") or 4)
            min_residency = int(row.get("minResidencyYears") or 0)
            min_sen_aut = int(row.get("minSeniorityAutonomo") or 24)
            min_sen_aut_der = int(row.get("minSeniorityAutonomoDeroga") or 18)
            min_loan = int(row.get("minLoan") or 50000)
            max_loan = int(row.get("maxLoan") or 1500000)
            min_dur = int(row.get("minDuration") or 10)
            max_dur = int(row.get("maxDuration") or 30)
            
            # Parse lists
            allowed_contracts_raw = row.get("allowedContracts", "").strip()
            allowed_contracts = [c.strip() for c in allowed_contracts_raw.split(",") if c.strip()]
            
            allowed_purposes_raw = row.get("allowedPurposes", "").strip()
            allowed_purposes = [p.strip() for p in allowed_purposes_raw.split(",") if p.strip()]
            
            # Construct policy object
            policies[bank_id] = {
                "name": name,
                "bgLogoLetter": bg_logo,
                "color": color,
                "isNationwide": is_nationwide,
                "territories": territories,
                "maxLtv": max_ltv,
                "maxDsr": max_dsr,
                "maxDsrDeroga": max_dsr_deroga,
                "maxAge": max_age,
                "maxGuarantorAge": max_guar_age,
                "maxBorrowers": max_borrowers,
                "hasMri": has_mri,
                "minResidencyYears": min_residency,
                "minSeniorityAutonomo": min_sen_aut,
                "minSeniorityAutonomoDeroga": min_sen_aut_der,
                "allowedContracts": allowed_contracts,
                "allowedPurposes": allowed_purposes,
                "minLoan": min_loan,
                "maxLoan": max_loan,
                "minDuration": min_dur,
                "maxDuration": max_dur
            }
            
    # Write to policies.json
    with open(json_path, mode="w", encoding="utf-8") as f:
        json.dump(policies, f, indent=4, ensure_ascii=False)
        
    print(f"Success: Imported {len(policies)} bank policies to {json_path}")
    print(f"Banks imported: {list(policies.keys())}")

if __name__ == "__main__":
    import_policies()
