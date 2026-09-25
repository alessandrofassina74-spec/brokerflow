# 🏛️ REPORT COMPLETO DI AUDIT POLICY E REGOLE DI FATTIBILITÀ
**Sistema BrokerFlow** — Data generazione: 17/09/2026 alle ore 23:30

---

## 🎯 Obiettivo del Report
Questo documento raccoglie in modo non distruttivo l'analisi approfondita e il confronto banca per banca tra le **policy ufficiali censite**, le **regole di calcolo nell'Engine** e le **simulazioni su casistiche operative reali** (LTV 100% Consap, lavoratori autonomi forfettari, famiglie numerose con verifica sussistenza minima MRI, regole età e garanti).

Tutte le discrepanze, osservazioni e proposte di ottimizzazione sono elencate per consentirne la revisione condivisa.

---

## 📊 Sintesi Generale degli Istituti Analizzati

| Banca | Copertura | Max LTV | Max DTI | Max Età | Metodo Calcolo Età | Sussistenza (MRI) |
|---|---|---|---|---|---|---|
| **BPER Banca** | Nazionale | 80% | 35% | 78 anni | `youngest` | Attivo |
| **Banco di Sardegna** | Regionale / Filiali | 80% | 35% | 78 anni | `youngest` | Attivo |
| **Banca del Mezzogiorno (BdM - MCC)** | Regionale / Filiali | 80% | 35% | 80 anni | `oldest` | Disattivo |
| **BNL BNP Paribas** | Nazionale | 80% | 35% | 75 anni | `oldest` | Attivo |
| **Crédit Agricole Italia** | Nazionale | 80% | 35% | 75 anni | `oldest` | Disattivo |
| **ING Bank** | Nazionale | 80% | 50% | 80 anni | `oldest` | Attivo |
| **Mediobanca Premier** | Nazionale | 80% | 35% | 80 anni | `oldest` | Attivo |
| **Banca Monte dei Paschi di Siena** | Nazionale | 80% | 33% | 80 anni | `oldest` | Attivo |
| **Cassa di Risparmio di Bolzano (Sparkasse)** | Regionale / Filiali | 80% | 40% | 80 anni | `youngest` | Attivo |

---

## 🔍 Dettaglio Analisi e Proposte per Singolo Istituto

### 1. BPER Banca (`bper`)
#### ⚠️ Note e Discrepanze Rilevate:
- **[DISCREPANZA]** *Regola Età*: Discrepanza metodo calcolo età: Engine ha 'youngest', JSON di policy ha 'oldest'.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 999999.00 €/m | Limite/Fattore: --
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🔴 Respinta | Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Famiglia 4 Componenti (Reddito € 2.500)**: Esito 🔴 Respinta | Rata: 769.56 €/m | Esito MRI: Reddito (Rata/Reddito o Sussistenza)

---

### 2. Banco di Sardegna (`banco_di_sardegna`)
#### ⚠️ Note e Discrepanze Rilevate:
- **[DISCREPANZA]** *Regola Età*: Discrepanza metodo calcolo età: Engine ha 'youngest', JSON di policy ha 'oldest'.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 999999.00 €/m | Limite/Fattore: --
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🔴 Respinta | Fattore: --

---

### 3. Banca del Mezzogiorno (BdM - MCC) (`bdm`)
#### ✅ Conformità Policy:
- La logica implementata risulta allineata con i parametri base e le griglie di policy della banca.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 891.83 €/m | Limite/Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🟢 Fattibile | Fattore: Reddito (Rata/Reddito o Sussistenza)

---

### 4. BNL BNP Paribas (`bnl`)
#### ✅ Conformità Policy:
- La logica implementata risulta allineata con i parametri base e le griglie di policy della banca.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 999999.00 €/m | Limite/Fattore: --
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🔴 Respinta | Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Famiglia 4 Componenti (Reddito € 2.500)**: Esito 🔴 Respinta | Rata: 746.92 €/m | Esito MRI: Reddito (Rata/Reddito o Sussistenza)

---

### 5. Crédit Agricole Italia (`credit agricole italia`)
#### ✅ Conformità Policy:
- La logica implementata risulta allineata con i parametri base e le griglie di policy della banca.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 865.59 €/m | Limite/Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🟢 Fattibile | Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Famiglia 4 Componenti (Reddito € 2.500)**: Esito 🟢 Fattibile | Rata: 723.07 €/m | Esito MRI: Reddito (Rata/Reddito o Sussistenza)

---

### 6. ING Bank (`ing`)
#### ✅ Conformità Policy:
- La logica implementata risulta allineata con i parametri base e le griglie di policy della banca.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 999999.00 €/m | Limite/Fattore: --
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🔴 Respinta | Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Famiglia 4 Componenti (Reddito € 2.500)**: Esito 🔴 Respinta | Rata: 840.57 €/m | Esito MRI: Reddito (Rata/Reddito o Sussistenza)

---

### 7. Mediobanca Premier (`mediobanca_premier`)
#### ✅ Conformità Policy:
- La logica implementata risulta allineata con i parametri base e le griglie di policy della banca.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 999999.00 €/m | Limite/Fattore: --
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🔴 Respinta | Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Famiglia 4 Componenti (Reddito € 2.500)**: Esito 🔴 Respinta | Rata: 769.56 €/m | Esito MRI: Reddito (Rata/Reddito o Sussistenza)

---

### 8. Banca Monte dei Paschi di Siena (`mps`)
#### ✅ Conformità Policy:
- La logica implementata risulta allineata con i parametri base e le griglie di policy della banca.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Operazione 100% Consap Under 36**: Esito 🔴 Respinta | Rata: 865.59 €/m | Limite/Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🔴 Respinta | Fattore: Reddito (Rata/Reddito o Sussistenza)
- **Famiglia 4 Componenti (Reddito € 2.500)**: Esito 🔴 Respinta | Rata: 757.39 €/m | Esito MRI: Reddito (Rata/Reddito o Sussistenza)

---

### 9. Cassa di Risparmio di Bolzano (Sparkasse) (`sparkasse`)
#### ✅ Conformità Policy:
- La logica implementata risulta allineata con i parametri base e le griglie di policy della banca.

#### 🧪 Esiti Simulazioni di Stress Test:
- **Autonomo Forfettario (18 mesi anzianità)**: Esito 🔴 Respinta | Fattore: Reddito (Rata/Reddito o Sussistenza)

---

## 💡 Proposte di Allineamento e Prossimi Passi
1. **Revisione Congiunta**: Esaminare le schede delle banche che presentano eccezioni specifiche (es. agevolazioni Green Mediobanca, agevolazioni CPI Crédit Agricole/BNL).
2. **Conferma Soglie MRI Regionali**: Verificare la differenziazione delle tabelle ISTAT regionali applicate da ING e MPS.
3. **Mantenimento Stabilità**: Le attuali modifiche dell'Engine e della UI sono congelate e pronte per essere testate dal vivo.
