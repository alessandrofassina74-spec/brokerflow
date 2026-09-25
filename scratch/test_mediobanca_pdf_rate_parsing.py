import os
import sys
import json
import base64

WORKSPACE_DIR = "/Users/alessandrofassina/Desktop/broker flow"
sys.path.append(os.path.join(WORKSPACE_DIR, "scripts"))
from manage_policies import load_env
from manage_rates import extract_pdf_rate_text, query_gemini_rates

def test_parse_mediobanca_pdf():
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY non trovata nel file .env")
        return
        
    pdf_path = os.path.join(WORKSPACE_DIR, "tabelle tassi", "mediobanca premier Listino Spread analitico_2026 05 01_CB.pdf")
    if not os.path.exists(pdf_path):
        print(f"File PDF non trovato: {pdf_path}")
        return
        
    print(f"📄 Estraggo testo e tabelle da: {pdf_path}")
    pdf_text = extract_pdf_rate_text(pdf_path)
    print(f"✅ Testo estratto ({len(pdf_text)} caratteri):")
    print(pdf_text[:500] + "...\n")
    
    with open(pdf_path, "rb") as f:
        pdf_b64 = base64.b64encode(f.read()).decode("utf-8")
        
    print("🤖 Invio richiesta di parsing a Gemini con PDF nativo + OCR strutturato...")
    res = query_gemini_rates(
        api_key=api_key,
        content_or_text=pdf_b64,
        is_pdf=True,
        bank_id="mediobanca_premier",
        pdf_text=pdf_text
    )
    
    print("✅ Risultato Parsing:")
    print(f"Status: {res.get('status')}")
    print(f"Banca: {res.get('bank_id')}")
    print(f"Summary: {res.get('summary')}")
    print(f"Totale Prodotti Estratti: {len(res.get('products', []))}")
    for p in res.get('products', []):
        print(f" - [{p.get('id')}] {p.get('nome')} | Tipo: {p.get('tipo')} | Parametro: {p.get('parametro')} | LTV Max: {p.get('ltvMax')} | Griglia: {p.get('grigliaTassi')}")
        
if __name__ == "__main__":
    test_parse_mediobanca_pdf()
