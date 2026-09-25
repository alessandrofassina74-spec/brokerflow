import os
import sys
import time
import json
from runner import QARunner

def run():
    workspace = "/Users/alessandrofassina/Desktop/broker flow"
    scenarios = [
        os.path.join(workspace, "qa_suite/scenarios/100ltv_cliente1_under36_single.json"),
        os.path.join(workspace, "qa_suite/scenarios/100ltv_cliente2_coppia_figli.json"),
        os.path.join(workspace, "qa_suite/scenarios/100ltv_cliente3_over36_37anni.json")
    ]

    print("\n" + "="*70)
    print("🌟 [QA LIVE BROWSER] Esecuzione Test Visivo Chrome (--headed)")
    print("   3 Clienti con Mutuo al 100% e differenti profili anagrafici")
    print("="*70)

    runner = QARunner(workspace_path=workspace, headed=True)
    all_results = []

    for i, sc in enumerate(scenarios, 1):
        print(f"\n>>> AVVIO TEST {i}/3 SULLO SCHERMO...")
        res = runner.run_scenario(sc)
        all_results.append(res)
        time.sleep(1.0)

    print("\n" + "="*70)
    print("🏁 RIEPILOGO FINALE DEI 3 CLIENTI (MUTUO 100%):")
    print("="*70)
    for r in all_results:
        print(f"\n📌 {r['scenario']}:")
        print(f"   • Stato: {r['status']}")
        print(f"   • Capacità Max Finanziabile: {r['calculated_results'].get('max_loan')}")
        print(f"   • Rata Massima Sostenibile: {r['calculated_results'].get('rata_sostenibile')}")
        print(f"   • Score: {r['calculated_results'].get('score')}")
        print(f"   • Banche Idonee: {len(r['banks_feasible'])}")
        print(f"   • Banche Escluse / Limite LTV: {len(r['banks_unfeasible'])}")
        if r['banks_feasible']:
            print(f"     -> Banche ok: " + ", ".join([b['title'] for b in r['banks_feasible'][:4]]))
        if r['banks_unfeasible']:
            print(f"     -> Banche ko: " + ", ".join([b['title'] for b in r['banks_unfeasible'][:4]]))

if __name__ == "__main__":
    run()
