import os
import glob
import json
import argparse
from runner import QARunner

def run_all_tests(headed=False):
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    scenarios_dir = os.path.join(workspace, "qa_suite", "scenarios")
    scenario_files = sorted(glob.glob(os.path.join(scenarios_dir, "*.json")))

    if not scenario_files:
        print("⚠️ Nessun file di scenario trovato in", scenarios_dir)
        return []

    print(f"\n========================================================")
    print(f"🤖 [QA AGENT] Esecuzione Batch di {len(scenario_files)} Scenari di Test")
    print(f"========================================================")

    results = []
    runner = QARunner(workspace_path=workspace, headed=headed)

    for sf in scenario_files:
        res = runner.run_scenario(sf)
        results.append(res)

    print("\n========================================================")
    print("📊 RIEPILOGO COMPLESSIVO DEI TEST QA")
    print("========================================================")
    passed = sum(1 for r in results if r["status"] == "PASSED")
    failed = sum(1 for r in results if r["status"] in ["FAILED", "ERROR"])

    for r in results:
        icon = "✅" if r["status"] == "PASSED" else "❌"
        print(f"{icon} {r['scenario']}: {r['status']}")
        if r.get("error_details"):
            print(f"   └─ Causa: {r['error_details']}")

    print(f"\nTotale: {len(results)} | Superati: {passed} | Falliti: {failed}")
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BrokerFlow QA Auto-Tester")
    parser.add_argument("--scenario", help="Path o nome file dello scenario")
    parser.add_argument("--all", action="store_true", help="Esegui tutti gli scenari")
    parser.add_argument("--headed", action="store_true", help="Apri finestra Chrome visibile")
    args = parser.parse_args()

    if args.all or not args.scenario:
        run_all_tests(headed=args.headed)
    else:
        sc_path = args.scenario
        if not os.path.exists(sc_path):
            sc_path = os.path.join("/Users/alessandrofassina/Desktop/broker flow/qa_suite/scenarios", args.scenario)
            if not sc_path.endswith(".json"):
                sc_path += ".json"
        
        runner = QARunner(headed=args.headed)
        res = runner.run_scenario(sc_path)
        print("\n--- RISULTATO ---")
        print(json.dumps(res, indent=2, ensure_ascii=False))
