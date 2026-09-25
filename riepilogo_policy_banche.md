# Riepilogo delle Policy Creditizie & Regole del Motore (BrokerFlow)

Questo documento riassume tutte le regole di policy creditizia, i limiti finanziari e le modalità di calcolo parametriche integrate all'interno del motore di fattibilità **BrokerFlow**. Tutte le regole di sussistenza (MRI) sono tenute **rigorosamente separate e specifiche per ciascun istituto bancario**.

---

## 1. Tabella Comparativa Parametri Generali

| Parametro / Regola | Monte dei Paschi (MPS) | ING Bank | BPER Banca | Mediobanca Premier | Sparkasse |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Operatività** | Nazionale (100%) | Nazionale (100%) | Nazionale (100%) | Nazionale (100%) | **Regionale (Nord Italia)** *[1]* |
| **LTV Massimo Standard** | 90% | 95% | 80% *[2]* | 95% | 80% |
| **LTV Massimo con CONSAP** | 100% | N.D. (No CONSAP) | 100% | N.D. (No CONSAP) | 100% |
| **DSR Standard (Rapporto Rata/Reddito)** | 35% | **50%** (Molto Elevato) | 35% | 35% | 35% |
| **DSR Massimo in Deroga** | 40% | **55%** | 40% | 40% | 40% |
| **Età Max a Scadenza (Richiedente)** | 80 anni | 80 anni | 78 anni | 75 anni | 80 anni |
| **Metodo di Controllo Età** | Più Anziano (`oldest`) | Più Anziano (`oldest`) | **Più Giovane** (`youngest`) | Più Anziano (`oldest`) | **Più Giovane** (`youngest`) |
| **Età Max a Scadenza (Garante)** | 80 anni | 80 anni | 80 anni | 75 anni | 80 anni |
| **Numero Massimo Richiedenti** | 4 | 2 | 4 | 4 | 4 |
| **Residenza in Italia Minima** | Nessun limite (0y) | **3 anni** | 2 anni | 2 anni | 2 anni |
| **Sussistenza Minima (MRI)** | **Attiva (Griglia ISTAT 2025)** | **Attiva (Griglia Metropoli/Centri)** | **Non Richiesta** | **Attiva (Griglia CheBanca)** | **Attiva (Griglia Sparkasse)** |
| **Min. Anzianità Autonomo (Std / Deroga)** | 24 / 18 mesi | 24 / 18 mesi | 18 / 12 mesi | 24 / 12 mesi | 24 / 12 mesi |
| **Gestione TD senza Co-obbligato Stabile** | 🔴 Non Ammesso (`ko`) | 🔴 Non Ammesso (`ko`) | 🟡 Ammesso in Deroga | 🟡 Ammesso in Deroga | 🔴 Non Ammesso (`ko`) |
| **Canale di Vendita Filiali** | Fisico (Geolocalizzato) | **100% Digitale** (800 717273) | Fisico (Geolocalizzato) | **Consulenza Mista/Digitale** (800 101030) | Fisico (Geolocalizzato) |
| **Importo Minimo/Massimo Mutuo** | 45.000 € / 2.000.000 € | 50.000 € / 1.500.000 € | 50.000 € / 1.500.000 € | 50.000 € / 1.000.000 € | 30.000 € / 1.500.000 € |
| **Durata Minima/Massima Mutuo** | 10 / 40 anni | 5 / 40 anni | 5 / 30 anni | 10 / 30 anni | 5 / 30 anni |

*   *[1] Province coperte da Sparkasse:* Bolzano, Trento, Verona, Padova, Venezia, Treviso, Vicenza, Udine, Pordenone, Trieste, Milano.
*   *[2] Nota BPER:* Nei listini standard l'LTV è all'80%, sale al 100% solo se si attiva la garanzia statale CONSAP Prima Casa.

---

## 2. Griglie di Sussistenza Minima (MRI) Specifiche per Banca

Le regole delle banche per la sussistenza minima sono separate e indipendenti:

### A. MONTE DEI PASCHI DI SIENA (Griglia ISTAT 2025)
Basata sull'aggiornamento ISTAT 2025 per area geografica:

| Componenti | NORD | CENTRO | SUD / ISOLE |
| :--- | :--- | :--- | :--- |
| **1 Richiedente** | 950 € | 850 € | 700 € |
| **2 Richiedenti (Coppia)** | 1.200 € | 1.100 € | 950 € |
| **3 Persone** | 1.500 € | 1.350 € | 1.200 € |
| **4 Persone** | 1.800 € | 1.600 € | 1.450 € |
| **5 Persone** | 2.100 € | 1.850 € | 1.700 € |
| **Oltre i 5 Componenti** | *+300 € per persona* | *+250 € per persona* | *+250 € per persona* |

---

### B. ING BANK (Griglia Multidimensionale ISTAT per Comune)
Segmentata per area geografica e tipologia di comune (Metropoli, Grandi Centri, Piccoli Centri):

#### 1. Area NORD
*   *Metropoli:* Milano, Torino, Bologna, Genova, Venezia.
*   *Grandi Centri:* Altri capoluoghi di provincia del Nord.
*   *Piccoli Centri:* Tutti gli altri comuni del Nord.

| Componenti | Metropoli | Grande Centro | Piccolo Centro |
| :--- | :--- | :--- | :--- |
| **1 Persona** | 913 € | 870 € | 820 € |
| **2 Persone** | 1.263 € | 1.211 € | 1.153 € |
| **3 Persone** | 1.577 € | 1.517 € | 1.451 € |
| **4 Persone** | 1.900 € | 1.826 € | 1.745 € |
| **5 Persone** | 2.191 € | 2.106 € | 2.015 € |
| **6 Persone** | 2.471 € | 2.375 € | 2.274 € |
| **7 Persone** | 2.739 € | 2.633 € | 2.522 € |

#### 2. Area CENTRO
*   *Metropoli:* Roma, Firenze.
*   *Grandi Centri:* Altri capoluoghi del Centro.
*   *Piccoli Centri:* Altri comuni del Centro.

| Componenti | Metropoli | Grande Centro | Piccolo Centro |
| :--- | :--- | :--- | :--- |
| **1 Persona** | 868 € | 824 € | 774 € |
| **2 Persone** | 1.189 € | 1.136 € | 1.077 € |
| **3 Persone** | 1.477 € | 1.416 € | 1.348 € |
| **4 Persone** | 1.776 € | 1.701 € | 1.618 € |
| **5 Persone** | 2.044 € | 1.958 € | 1.865 € |
| **6 Persone** | 2.302 € | 2.204 € | 2.101 € |
| **7 Persone** | 2.548 € | 2.441 € | 2.327 € |

#### 3. Area SUD / ISOLE
*   *Metropoli:* Napoli, Bari, Palermo, Catania, Cagliari, Messina, Reggio Calabria.
*   *Grandi Centri:* Altri capoluoghi del Sud.
*   *Piccoli Centri:* Altri comuni del Sud.

| Componenti | Metropoli | Grande Centro | Piccolo Centro |
| :--- | :--- | :--- | :--- |
| **1 Persona** | 679 € | 656 € | 617 € |
| **2 Persone** | 973 € | 947 € | 902 € |
| **3 Persone** | 1.238 € | 1.208 € | 1.158 € |
| **4 Persone** | 1.496 € | 1.461 € | 1.402 € |
| **5 Persone** | 1.733 € | 1.694 € | 1.629 € |
| **6 Persone** | 1.961 € | 1.918 € | 1.847 € |
| **7 Persone** | 2.161 € | 2.118 € | 2.047 € |

---

### C. MEDIOBANCA PREMIER (Griglia CheBanca)
Valori uguali per regione, segmentati geograficamente:

| Componenti | NORD | CENTRO | SUD / ISOLE |
| :--- | :--- | :--- | :--- |
| **1 Persona** | 845,91 € | 806,33 € | 719,98 € |
| **2 Persone** | 1.178,66 € | 1.109,88 € | 1.011,72 € |
| **3 Persone** | 1.476,87 € | 1.382,01 € | 1.273,51 € |
| **4 Persone** | 1.777,81 € | 1.659,47 € | 1.533,81 € |
| **5 Persone** | 2.051,39 € | 1.910,30 € | 1.771,38 € |
| **Oltre i 5 Componenti** | *+301 € per persona* | *+276 € per persona* | *+263 € per persona* |

---

### D. CASSA DI RISPARMIO DI BOLZANO (Sparkasse)
Soglie di sussistenza unificate per l'intera rete della banca:

*   **1 Componente:** 900 € (mensile) / 10.800 € (annuo)
*   **2 Componenti:** 1.150 € (mensile) / 13.800 € (annuo)
*   **3 Componenti:** 1.500 € (mensile) / 18.000 € (annuo)
*   **4 Componenti:** 1.800 € (mensile) / 21.600 € (annuo)
*   **5 Componenti:** 2.100 € (mensile) / 25.200 € (annuo)
*   **6 Componenti:** 2.400 € (mensile) / 28.800 € (annuo)
*   **>= 7 Componenti:** 2.700 € (mensile) / 32.400 € (annuo)

---

### E. BPER BANCA
*   **Soglia di sussistenza (MRI):** Non applicata (`hasMri: false`). La valutazione è basata esclusivamente sulla capienza del rapporto rata/reddito (DSR ≤ 35%).
