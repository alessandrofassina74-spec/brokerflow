# 🏛️ BROKERFLOW — ARCHITETTURA TECNICA & DOCUMENTAZIONE COMPLETA DEL SISTEMA

**Data di Rilascio / Aggiornamento:** 04 Settembre 2026  
**Autore:** Alessandro Fassina  
**Piattaforma:** BrokerFlow Core CRM & AI Credit Advisor Engine  

---

## 1. 📋 PANORAMICA DEL SISTEMA & MISSION
**BrokerFlow** è una piattaforma professionale avanzata di comparazione, istruttoria e consulenza creditizia ideata per mediatori creditizi e consulenti del debito.
Il sistema automatizza l'analisi di fattibilità, il calcolo reddituale (DSR), il ranking multi-banca in tempo reale e fornisce un assistente AI specialistico basato sui testi integrali delle circolari e delle convenzioni bancarie ufficiali.

---

## 2. 🏗️ ARCHITETTURA GENERALE DEL SISTEMA

Il sistema opera su un'architettura ibrida locale ad altissime prestazioni e massima riservatezza:

1. **Frontend Interattivo (SPA):**
   - `index.html`: Interfaccia grafica completa, moduli CRM (Nuova Pratica, Parser & Documenti, Ricerca Territoriale, Report & Statistiche, Chat Advisor).
   - `app.js`: Controller applicativo, gestione eventi, navigazione wizard, gestione modali e chiamate API.
   - `styles.css`: Design system moderno, responsive e ottimizzato.

2. **Motore di Calcolo & Istruttoria Deterministica:**
   - `engine.js`: Motore analitico puro (Zero Allucinazioni). Calcola DSR, LTV, LTC, piani di ammortamento alla francese, sussistenza minima, scaglioni di reddito e filtri di ammissibilità vincolanti per tutte le banche.

3. **Backend Server & AI Engine:**
   - `server.py`: Server HTTP/JSON threading su porta `8080`.
   - `scripts/gui_launcher.py`: Server dedicato al Parser Documentale e Chatbot su porta `8085`.
   - Integrazione con **Google Gemini API** (multi-modello con fallback dinamico `gemini-3.8-flash`, `gemini-3.8-pro`, `gemini-3.7-flash`, `gemini-3.5-flash-lite`).

4. **Scraper Automatico Tassi di Mercato:**
   - `scripts/fetch_daily_rates.py`: Rilevazione quotidiana automatica degli indici Euribor (1M, 3M, 6M, 12M) e IRS (da 1 a 50 anni) da *Il Sole 24 Ore / MutuiOnline*.

---

## 3. 📂 STRUTTURA DEI DATABASE (DATA LAYER)

Tutti i dati risiedono in file JSON strutturati e versionabili all'interno della cartella `data/`:

- **`data/policies.json`**: Matrice completa delle policy creditizie per ogni istituto bancario convenzionato (LTV standard, LTV Consap, LTV Seconda Casa, Durata min/max, Età max richiedenti e garanti, Formule reddito, Anzianità lavorativa, Contratti ammessi, Note e Deroghe).
- **`data/products.json`**: Elenco dei prodotti di mutuo specifici, finalità supportate, spread base, sconti green e tipologie di tasso.
- **`data/branches.json`**: Anagrafica e geolocalizzazione (comune, provincia, CAP, coordinate o raggio) delle filiali bancarie.
- **`data/comuni.json`**: Database completo di tutti i comuni italiani con codici catastali, province e regioni.
- **`data/tassi_giornalieri.json`**: Fixings correnti di mercato per IRS ed Euribor aggiornati quotidianamente.
- **`data/historical_rates.json`**: Serie storica continua dei tassi lavorativi per la generazione dei grafici di andamento e tabelle comparative.

---

## 4. 🏦 SPECIFICHE REGOLAMENTARI DELLE BANCHE CONVENZIONATE

Il motore rispetta fedelmente le policy ufficiali documentate:

| Banca | LTV Standard (Prima Casa) | LTV Consap | Seconda Casa | Durata Max | Età Max Garante | Note Particolari |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Monte dei Paschi di Siena (MPS)** | Fino al **90%** | Fino al **100%** (max 30A, no garanti) | Fino all'**80%** | **40 Anni** | **80 anni ai 2/3 della durata** | Forfettari: Quadro LM rigo 34/36; Locazioni al 70%/80% |
| **ING** | Fino al **95%** | Non aderisce | Fino all'**80%** | **30 Anni** | **80 anni ai 2/3 della durata** | Paga base 12m secche; RN4; AU per fasce età (100%/50%/0%) |
| **Mediobanca Premier** | Fino all'**80%** (LTC 95% con max 80% perizia) | Canale dedicato | Fino all'**80%** | **30 Anni** | **80 anni ai 2/3 della durata** | P.IVA: 36 mesi standard (deroga 18); Locazioni al 70% |
| **BPER Banca** | Fino all'**80%** | Fino al **100%** | Fino all'**80%** | **30 Anni** | **80 anni a fine mutuo** (o clausola 2/3) | Straordinari continuativi al 50%; Anzianità P.IVA 36m |
| **Banco di Sardegna** | Fino all'**80%** | Fino al **100%** | Fino all'**80%** | **30 Anni** | Regole gruppo BPER | Presidio regionale Sardegna; Straordinari al 50% |
| **BNL BNP Paribas** | Fino all'**80%** | Fino al **100%** | Fino all'**80%** | **30 Anni** | Standard di gruppo | Scorporo straordinari una tantum; RN1; Locazioni al 70% |
| **Sparkasse** | Fino all'**80%** | Canale convenzionato | Fino all'**80%** | **30 Anni** | 75/80 anni | Tabella sussistenza tabellare; Anzianità P.IVA 24m (deroga 12m) |
| **BDM Banca** | Fino all'**80%** | Fino al **100%** | Fino all'**80%** | **30 Anni** | Standard Mediocredito | Presidio Sud Italia; Anzianità P.IVA 36m |
| **Crédit Agricole** | Fino all'**80%** | Fino al **100%** | Fino all'**80%** | **30 Anni** | Fino a 80 anni | Ottime condizioni Green; Straordinari continuativi al 50% |

---

## 4.1 📐 STANDARD ARCHITETTURALE DI CALCOLO REDDITO MULTI-BANCA (ZERO APPROSSIMAZIONI)

Per garantire la massima precisione contabile e scalare a 100+ banche, il motore `engine.js` adotta regole di determinazione reddituale rigorosamente differenziate:

```mermaid
graph TD
    A[Soggetto Richiedente o Garante] --> B{Tipologia Contratto / Reddito}
    
    B -->|Busta Paga Dipendente| C{Banca di Riferimento}
    C -->|ING Bank| C1[Paga Base Lorda - INPS 9.19% - Scaglioni IRPEF 12m]
    C -->|BPER / BDS / Crédit Agricole| C2[Media 3 buste con 13/14esima + Straordinari ponderati 50%]
    C -->|BNL / MPS / Mediobanca / Sparkasse / BDM| C3[Media 3 buste con 13/14esima - Voci una tantum]
    
    B -->|Certificazione Unica CU| D{Banca di Riferimento}
    D -->|ING Bank| D1[P1 + P2 - Imposte / 12 con pro-rata se P6 >= 200 gg]
    D -->|Standard Banche| D2[P1 + P2 - P21 - P22 - P26 / P6 * 365 / 12 + P365 / 12]
    
    B -->|Modello Unico Ordinario| E{Banca di Riferimento}
    E -->|ING Bank| E1[RN4 Imponibile - RN26 - RV2 - RV10 / 12]
    E -->|Standard Banche| E2[RN1 Lordo - RN26 - RV2 - RV10 - RV17 / 12]
    
    B -->|Regime Forfettario| F{Banca di Riferimento}
    F -->|MPS| F1[Quadro LM rigo 34 o 36 - LM39 Imposta / 12]
    F -->|ING Bank| F2[LM38 / LM36 * 0.80 - Imposta 15% / 12]
    F -->|Standard Banche| F3[LM36 - LM39 Imposta / 12]
    
    B -->|Assegno Unico INPS| G{Banca di Riferimento}
    G -->|ING Bank| G1[Figli <=11A: 100% | 12-17A: 50% | >=18A: 0%]
    G -->|Standard Banche| G2[Figli Minori <18A: 100% | Maggiorenni: 0%]
    
    B -->|Locazioni & Affitti| H{Banca di Riferimento}
    H -->|ING Bank| H1[Escluse 0%]
    H -->|MPS / Mediobanca / BNL / BPER| H2[Ponderate al 70% - 80% con cedolare secca]
    
    B -->|Mantenimento / Alimenti| I{Trattamento}
    I -->|Ricevuto| I1[100% con sentenza omologata e bonifici continui]
    I -->|Versato| I2[Decurtato dal reddito e inserito tra gli impegni DSR]
```

---

## 5. 🚀 FUNZIONALITÀ PRINCIPALI

### 1. Wizard Istruttoria "Nuova Pratica"
- Selezione finalità (Acquisto 1ª Casa, 2ª Casa, Acquisto + Ristrutturazione, Surroga, Liquidità, Ristrutturazione).
- Inserimento dati immobile, richiedenti e garanti (contratto tempo indeterminato, determinato, autonomo, forfettario, pensionato).
- Calcolo automatico del DSR (Debt Service Ratio) e della rata massima sostenibile.
- Visualizzazione immediata delle offerte bancarie fattibili con ranking per tasso, rata ed LTV.

### 2. Ricerca Territoriale & Geocoding Filiali
- Ricerca per comune, provincia o CAP.
- Verifica immediata della presenza di filiali operative nel raggio di competenza territoriale.

### 3. Report & Statistiche Indici di Mercato
- Monitoraggio grafico interattivo SVG e tabellare degli indici Euribor (1M, 3M, 6M) ed IRS (10Y, 15Y, 20Y, 25Y, 30Y).
- Pulsante di aggiornamento manuale istantaneo **🔄 Aggiorna Tassi Ora**.
- Thread daemon in background che sincronizza i tassi ogni 3 ore.

### 4. AI Advisor & Chat Documentale Multi-Banca
- Consultazione in linguaggio naturale per singola banca o in modalità multi-banca comparativa.
- Analisi approfondita che incrocia i parametri strutturati JSON e i documenti integrali in formato Word/Docx.
- Risposte stringate, analitiche, dirette e prive di formalismi inutili.

---

## 6. 🖥️ LANCIO E GESTIONE APPLICAZIONE SU MACOS

Per avviare il sistema in ambiente macOS:
- **Doppio click su `BrokerFlow.app` sul Desktop**: Avvia il server su porta `8080` e apre automaticamente l'interfaccia nel browser web.
- **Doppio click su `BrokerFlow_Parser.app` sul Desktop**: Avvia l'interfaccia di gestione regole e parser documentale su porta `8085`.
- **Da Terminale**: Eseguire `./start_brokerflow.sh`.

---

*BrokerFlow — Advanced Credit Advisory System.*
