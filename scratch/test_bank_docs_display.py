import os
import urllib.request
import json

def test_bank_docs_api():
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/bank-documents?bankId=mediobanca_premier")
        with urllib.request.urlopen(req, timeout=5) as res:
            print("API Response Status:", res.status)
            data = json.loads(res.read().decode('utf-8'))
            print("Bank Docs Found:", len(data.get("documents", [])))
            for doc in data.get("documents", []):
                print(f" - [{doc.get('category')}] {doc.get('name')} (URL: {doc.get('url')})")
    except Exception as e:
        print("Server error or not reachable:", e)

if __name__ == "__main__":
    test_bank_docs_api()
