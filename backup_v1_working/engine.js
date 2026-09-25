// BrokerFlow Modular Rules & Policy Engine
// Handles territoriality screening, product matching, financial checks, exclusions, multi-income subjects, 3-tier feasibility statuses, and branch recommendations.

const BrokerFlowEngine = {
    // Dynamic Databases loaded from external JSON files
    bankPolicies: {
    "mps": {
        "name": "Monte dei Paschi di Siena",
        "bgLogoLetter": "M",
        "color": "#800020",
        "territories": [
            "Milano", "Roma", "Napoli", "Como", "Monza", "Bari", "Torino", "Firenze", "Bologna", "Venezia"
        ],
        "maxLtv": 1.0,
        "maxDsr": 0.35,
        "maxDsrDeroga": 0.40,
        "maxAge": 80,
        "maxGuarantorAge": 80,
        "maxBorrowers": 4,
        "hasMri": true,
        "minResidencyYears": 0,
        "minSeniorityAutonomo": 24,
        "minSeniorityAutonomoDeroga": 18,
        "allowedContracts": [
            "dipendente_ti", "dipendente_td", "autonomo", "pensionato"
        ],
        "allowedPurposes": [
            "acquisto", "ristrutturazione", "surroga", "aste"
        ],
        "minLoan": 45000,
        "maxLoan": 2000000,
        "minDuration": 10,
        "maxDuration": 40
    },
    "ing": {
        "name": "ING Bank",
        "bgLogoLetter": "I",
        "color": "#ff6200",
        "territories": [
            "Milano", "Roma", "Napoli", "Monza", "Torino", "Bari", "Firenze"
        ],
        "maxLtv": 0.95,
        "maxDsr": 0.50,
        "maxDsrDeroga": 0.55,
        "maxAge": 80,
        "maxGuarantorAge": 80,
        "maxBorrowers": 2,
        "hasMri": true,
        "minResidencyYears": 3,
        "minSeniorityAutonomo": 24,
        "minSeniorityAutonomoDeroga": 18,
        "allowedContracts": [
            "dipendente_ti", "dipendente_td", "autonomo", "pensionato"
        ],
        "allowedPurposes": [
            "acquisto", "surroga", "liquidita", "consolido", "ristrutturazione"
        ],
        "minLoan": 50000,
        "maxLoan": 1500000,
        "minDuration": 5,
        "maxDuration": 40
    },
    "bper": {
        "name": "BPER Banca",
        "bgLogoLetter": "B",
        "color": "#005a50",
        "territories": [
            "Milano", "Como", "Monza", "Bologna", "Torino", "Venezia"
        ],
        "maxLtv": 1.0,
        "maxDsr": 0.35,
        "maxDsrDeroga": 0.40,
        "maxAge": 78,
        "maxGuarantorAge": 80,
        "maxBorrowers": 4,
        "hasMri": false,
        "minResidencyYears": 2,
        "minSeniorityAutonomo": 18,
        "minSeniorityAutonomoDeroga": 12,
        "allowedContracts": [
            "dipendente_ti", "dipendente_td", "autonomo", "pensionato"
        ],
        "allowedPurposes": [
            "acquisto", "ristrutturazione", "surroga"
        ],
        "minLoan": 0,
        "maxLoan": 99999999,
        "minDuration": 1,
        "maxDuration": 30
    },
    "chebanca": {
        "name": "CheBanca!",
        "bgLogoLetter": "C",
        "color": "#ffc20e",
        "territories": [
            "Milano", "Roma", "Napoli", "Bari", "Firenze", "Venezia", "Bologna"
        ],
        "maxLtv": 1.0,
        "maxDsr": 0.35,
        "maxDsrDeroga": 0.40,
        "maxAge": 75,
        "maxGuarantorAge": 78,
        "maxBorrowers": 4,
        "hasMri": true,
        "minResidencyYears": 2,
        "minSeniorityAutonomo": 36,
        "minSeniorityAutonomoDeroga": 24,
        "allowedContracts": [
            "dipendente_ti", "dipendente_td", "autonomo", "pensionato"
        ],
        "allowedPurposes": [
            "acquisto", "surroga", "ristrutturazione", "liquidita", "consolido", "aste"
        ],
        "minLoan": 0,
        "maxLoan": 99999999,
        "minDuration": 1,
        "maxDuration": 30
    }
},
    bankProducts: {
        "mps": [
                {
                        "id": "MPS001",
                        "nome": "Mutuo MPS MIO Acquisto Abitazione",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "acquisto",
                                "acquisto",
                                "ristrutturazione"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.4
                                },
                                {
                                        "dMin": 35,
                                        "dMax": 40,
                                        "spread": 1.6
                                }
                        ]
                },
                {
                        "id": "MPS002",
                        "nome": "Mutuo MPS MIO Acquisto Abitazione",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto",
                                "acquisto",
                                "ristrutturazione"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.2
                                },
                                {
                                        "dMin": 35,
                                        "dMax": 40,
                                        "spread": 1.9
                                }
                        ]
                },
                {
                        "id": "MPS003",
                        "nome": "Mutuo MPS MIO Acquisto Abitazione Green",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": true,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.0
                                },
                                {
                                        "dMin": 35,
                                        "dMax": 40,
                                        "spread": 0.8
                                }
                        ]
                },
                {
                        "id": "MPS004",
                        "nome": "Mutuo MPS MIO Acquisto Abitazione Green",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": true,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.0
                                },
                                {
                                        "dMin": 35,
                                        "dMax": 40,
                                        "spread": 0.3
                                }
                        ]
                },
                {
                        "id": "MPS005",
                        "nome": "Mutuo MIO Acquisto Abitazione CONSAP 50% Prioritari",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.3
                                }
                        ]
                },
                {
                        "id": "MPS006",
                        "nome": "Mutuo MIO Acquisto Abitazione CONSAP 50% Prioritari",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.1
                                }
                        ]
                },
                {
                        "id": "MPS007",
                        "nome": "Mutuo MIO Acquisto Abitazione CONSAP 80% Prioritari",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                },
                {
                        "id": "MPS008",
                        "nome": "Mutuo MIO Acquisto Abitazione CONSAP 80% Prioritari",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                },
                {
                        "id": "MPS009",
                        "nome": "Mutuo MIO Acquisto Abitazione CONSAP 50% Prioritari ISEE > 40.000",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                },
                {
                        "id": "MPS010",
                        "nome": "Mutuo MIO Acquisto Abitazione CONSAP 50% Prioritari ISEE > 40.000",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                },
                {
                        "id": "MPS011",
                        "nome": "Mutuo MIO Acquisto Abitazione CAP",
                        "tipo": "Variabile CAP",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "acquisto",
                                "acquisto",
                                "ristrutturazione"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.5
                                }
                        ]
                },
                {
                        "id": "MPS012",
                        "nome": "Mutuo MIO Acquisto Abitazione BCE",
                        "tipo": "Variabile BCE",
                        "parametro": "BCE",
                        "finalita": [
                                "acquisto",
                                "acquisto",
                                "ristrutturazione"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 10,
                                        "spread": 2.5
                                },
                                {
                                        "dMin": 15,
                                        "dMax": 15,
                                        "spread": 2.6
                                },
                                {
                                        "dMin": 20,
                                        "dMax": 20,
                                        "spread": 2.7
                                },
                                {
                                        "dMin": 25,
                                        "dMax": 30,
                                        "spread": 2.9
                                },
                                {
                                        "dMin": 35,
                                        "dMax": 40,
                                        "spread": 3.0
                                }
                        ]
                },
                {
                        "id": "MPS013",
                        "nome": "Mutuo MIO Acquisto Abitazione BCE Green",
                        "tipo": "Variabile BCE",
                        "parametro": "BCE",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": true,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 10,
                                        "spread": 2.4
                                },
                                {
                                        "dMin": 15,
                                        "dMax": 15,
                                        "spread": 2.5
                                },
                                {
                                        "dMin": 20,
                                        "dMax": 20,
                                        "spread": 2.6
                                },
                                {
                                        "dMin": 25,
                                        "dMax": 30,
                                        "spread": 2.8
                                },
                                {
                                        "dMin": 35,
                                        "dMax": 40,
                                        "spread": 2.9
                                }
                        ]
                },
                {
                        "id": "MPS014",
                        "nome": "Mutuo MPS MIO Surroga",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.4
                                }
                        ]
                },
                {
                        "id": "MPS015",
                        "nome": "Mutuo MPS MIO Surroga",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.4
                                }
                        ]
                },
                {
                        "id": "MPS016",
                        "nome": "Mutuo MPS MIO Surroga CONSAP 50%",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.3
                                }
                        ]
                },
                {
                        "id": "MPS017",
                        "nome": "Mutuo MPS MIO Surroga CONSAP 50%",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.3
                                }
                        ]
                },
                {
                        "id": "MPS018",
                        "nome": "Mutuo MPS MIO Surroga CONSAP 50% e 80%",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                },
                {
                        "id": "MPS019",
                        "nome": "Mutuo MPS MIO Surroga CONSAP 50% e 80%",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                },
                {
                        "id": "MPS020",
                        "nome": "Mutuo MPS MIO Surroga Green",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": true,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.3
                                }
                        ]
                },
                {
                        "id": "MPS021",
                        "nome": "Mutuo MPS MIO Surroga Green",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": true,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.1
                                }
                        ]
                },
                {
                        "id": "MPS022",
                        "nome": "Mutuo MPS Mio Tandem",
                        "tipo": "Variabile/Fisso",
                        "parametro": "Euribor 1M / IRS",
                        "finalita": [
                                "acquisto",
                                "acquisto",
                                "ristrutturazione"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.5
                                }
                        ]
                },
                {
                        "id": "MPS023",
                        "nome": "Mutuo MPS Mio Surroga Tandem",
                        "tipo": "Variabile/Fisso",
                        "parametro": "Euribor 1M / IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.5
                                }
                        ]
                },
                {
                        "id": "MPS024",
                        "nome": "Mutuo MPS Mio Acquisto in Asta",
                        "tipo": "Variabile",
                        "parametro": "Euribor 1M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                }
        ],
        "ing": [
                {
                        "id": "ING001",
                        "nome": "Mutuo Arancio Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 5,
                                        "dMax": 40,
                                        "spread": 0.3
                                }
                        ]
                },
                {
                        "id": "ING002",
                        "nome": "Mutuo Arancio Variabile",
                        "tipo": "Variabile",
                        "parametro": "Euribor 3M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 5,
                                        "dMax": 40,
                                        "spread": 0.5
                                }
                        ]
                },
                {
                        "id": "ING003",
                        "nome": "Mutuo Arancio Green Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": true,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 5,
                                        "dMax": 40,
                                        "spread": 0.15
                                }
                        ]
                },
                {
                        "id": "ING004",
                        "nome": "Mutuo Arancio HLTV (Consap) - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 5,
                                        "dMax": 40,
                                        "spread": 0.7
                                }
                        ]
                },
                {
                        "id": "ING005",
                        "nome": "Mutuo Arancio Surroga - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 5,
                                        "dMax": 40,
                                        "spread": 0.4
                                }
                        ]
                }
        ],
        "bper": [
                {
                        "id": "BPE001",
                        "nome": "Mutuo BPER Acquisto - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.4
                                }
                        ]
                },
                {
                        "id": "BPE002",
                        "nome": "Mutuo BPER Acquisto - Variabile",
                        "tipo": "Variabile",
                        "parametro": "Euribor 3M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.6
                                }
                        ]
                },
                {
                        "id": "BPE003",
                        "nome": "Mutuo BPER Giovani CONSAP - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.5
                                }
                        ]
                },
                {
                        "id": "BPE005",
                        "nome": "Mutuo BPER Surroga - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.45
                                }
                        ]
                }
        ],
        "chebanca": [
                {
                        "id": "CB001",
                        "nome": "Mutuo CheBanca Acquisto - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.35
                                }
                        ]
                },
                {
                        "id": "CB002",
                        "nome": "Mutuo CheBanca Acquisto - Variabile",
                        "tipo": "Variabile",
                        "parametro": "Euribor 3M",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.55
                                }
                        ]
                },
                {
                        "id": "CB003",
                        "nome": "Mutuo CheBanca CONSAP - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "acquisto"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": true,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.65
                                }
                        ]
                },
                {
                        "id": "CB005",
                        "nome": "Mutuo CheBanca Surroga - Fisso",
                        "tipo": "Fisso",
                        "parametro": "IRS",
                        "finalita": [
                                "surroga"
                        ],
                        "ltvMax": 1.0,
                        "isGreen": false,
                        "isConsap": false,
                        "grigliaTassi": [
                                {
                                        "dMin": 10,
                                        "dMax": 30,
                                        "spread": 0.4
                                }
                        ]
                }
        ]
},

    // Subsistence Grid
    mriGrid: {
        nord: { 1: 863, 2: 863, 3: 1016, 4: 1300, 5: 1414 },
        centro: { 1: 843, 2: 843, 3: 1000, 4: 1200, 5: 1300 },
        sud: { 1: 780, 2: 780, 3: 900, 4: 1100, 5: 1200 }
    },

    branchesDb: {
        mps: [
            { name: "MPS Filiale Padova Centro - Via Roma 12", prov: "Padova", indirizzo: "Via Roma 12, Padova (PD)", telefono: "049 8211111" },
            { name: "MPS Filiale Milano Duomo - Via Mazzini 3", prov: "Milano", indirizzo: "Via Mazzini 3, Milano (MI)", telefono: "02 884411" },
            { name: "MPS Filiale Roma Centro - Via del Corso 150", prov: "Roma", indirizzo: "Via del Corso 150, Roma (RM)", telefono: "06 697711" }
        ],
        ing: [
            { name: "ING Hub Padova - Via San Fermo 4", prov: "Padova", indirizzo: "Via San Fermo 4, Padova (PD)", telefono: "049 990011" },
            { name: "ING Direct Hub Milano - Via Broletto 10", prov: "Milano", indirizzo: "Via Broletto 10, Milano (MI)", telefono: "02 89661" }
        ],
        bper: [
            { name: "BPER Banca Padova - Corso Garibaldi 88", prov: "Padova", indirizzo: "Corso Garibaldi 88, Padova (PD)", telefono: "049 773311" },
            { name: "BPER Banca Milano - Via Meravigli 16", prov: "Milano", indirizzo: "Via Meravigli 16, Milano (MI)", telefono: "02 85451" }
        ],
        chebanca: [
            { name: "CheBanca! Filiale Padova - Via San Fermo 18", prov: "Padova", indirizzo: "Via San Fermo 18, Padova (PD)", telefono: "049 655411" },
            { name: "CheBanca! Filiale Milano - Via Manzoni 12", prov: "Milano", indirizzo: "Via Manzoni 12, Milano (MI)", telefono: "02 72121" }
        ]
    },

    init(policies, products, comuni) {
        if (policies) this.bankPolicies = policies;
        if (products) this.bankProducts = products;
        if (comuni) {
            this.comuniDb = comuni;
            this.comuniByName = {};
            this.provinceCapitalByName = {};
            
            comuni.forEach(item => {
                const normName = item.name.toUpperCase().trim();
                this.comuniByName[normName] = {
                    name: item.name,
                    lat: item.lat,
                    lng: item.lng,
                    codice_prov_istat: item.codice_prov_istat
                };
                if (item.capoluogo_prov === true) {
                    this.provinceCapitalByName[item.codice_prov_istat] = item.name;
                }
            });
        }
    },

    resolveLocation(name) {
        if (!name) return null;
        if (!this.comuniByName) {
            this.init(this.bankPolicies, this.bankProducts, this.comuniDb);
        }
        if (!this.comuniByName) return null;
        const normName = name.toUpperCase().trim();
        let match = this.comuniByName[normName];
        if (!match) {
            for (const key of Object.keys(this.comuniByName || {})) {
                if (normName.includes(key) || key.includes(normName)) {
                    match = this.comuniByName[key];
                    break;
                }
            }
        }
        if (match) {
            const rawCap = (this.provinceCapitalByName && this.provinceCapitalByName[match.codice_prov_istat]) || match.name;
            const capName = rawCap.charAt(0).toUpperCase() + rawCap.slice(1).toLowerCase();
            return {
                name: match.name.charAt(0).toUpperCase() + match.name.slice(1).toLowerCase(),
                province: capName,
                lat: match.lat,
                lng: match.lng
            };
        }
        const cleanName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        return { name: cleanName, province: cleanName, lat: null, lng: null };
    },

    getHaversineDistance(lat1, lon1, lat2, lon2) {
        if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Multi-income net income calculation per subject
    calculateNetIncome(subject, bankId) {
        if (subject.incomes && Array.isArray(subject.incomes) && subject.incomes.length > 0) {
            let sumNet = 0;
            subject.incomes.forEach(inc => {
                sumNet += this.calculateSingleIncome(inc, bankId);
            });
            return sumNet;
        }
        return this.calculateSingleIncome(subject, bankId);
    },

    calculateSingleIncome(inc, bankId) {
        const raw = inc.rawBoxData;
        const contract = inc.tipoContratto;
        
        if (!raw || Object.keys(raw).length === 0) {
            return inc.netto || 0;
        }
        
        if (contract === "dipendente_ti" || contract === "pensionato") {
            const p1 = parseFloat(raw.p1) || 0;
            const p2 = parseFloat(raw.p2) || 0;
            const p6 = parseFloat(raw.p6) || 365;
            const p21 = parseFloat(raw.p21) || 0;
            const p22 = parseFloat(raw.p22) || 0;
            const p26 = parseFloat(raw.p26) || 0;
            const p365 = parseFloat(raw.p365) || 0;
            const netAnnual = (p1 + p2) - (p21 + p22 + p26);
            return (p6 > 0) ? ((netAnnual / p6 * 365) / 12 + (p365 / 12)) : 0;
        } else if (contract === "dipendente_td") {
            const p2 = parseFloat(raw.p2) || 0;
            const p21 = parseFloat(raw.p21) || 0;
            const p22 = parseFloat(raw.p22) || 0;
            const p26 = parseFloat(raw.p26) || 0;
            const days = parseFloat(raw.days) || 365;
            const netAnnual = p2 - (p21 + p22 + p26);
            return (days > 0) ? ((netAnnual / days * 365) / 12) : 0;
        } else if (contract === "autonomo") {
            if (raw.regime === "ordinario") {
                const rn1_1 = parseFloat(raw.rn1_1) || 0;
                const rn26_1 = parseFloat(raw.rn26_1) || 0;
                const rn1_2 = parseFloat(raw.rn1_2) || 0;
                const rn26_2 = parseFloat(raw.rn26_2) || 0;
                const netY1 = (rn1_1 - rn26_1) / 12;
                const netY2 = (rn1_2 - rn26_2) / 12;
                return (netY1 + netY2) / 2;
            } else {
                const lm36 = parseFloat(raw.lm36) || 0;
                const lm39 = parseFloat(raw.lm39) || 0;
                if (bankId === "ing") {
                    return ((lm36 * 0.80) - lm39) / 12;
                } else {
                    return (lm36 - lm39) / 12;
                }
            }
        }
        return inc.netto || 0;
    },

    getMortgagePayment(principal, annualRate, years) {
        if (annualRate === 0) return principal / (years * 12);
        const r = (annualRate / 100) / 12;
        const n = years * 12;
        return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    },

    getMaxLoanFromPayment(monthlyPayment, annualRate, years) {
        if (monthlyPayment <= 0) return 0;
        if (annualRate === 0) return monthlyPayment * years * 12;
        const i = (annualRate / 100) / 12;
        const N = years * 12;
        const factor = (Math.pow(1 + i, N) - 1) / (i * Math.pow(1 + i, N));
        return monthlyPayment * factor;
    },

    getMriRequired(zona, persone) {
        const grid = this.mriGrid[zona] || this.mriGrid.nord;
        if (persone <= 5) return grid[persone];
        return grid[5] + (persone - 5) * 300;
    },

    evaluate(pratica, tassiBase) {
        const evaluatedBanks = [];
        
        if (pratica.exclusions.pignoramenti || pratica.exclusions.ritardi) {
            return {
                feasible: false,
                reason: "exclusion",
                banks: [],
                allEvaluated: []
            };
        }

        const resolvedImmobile = this.resolveLocation(pratica.provImmobile);
        const resolvedResidenza = this.resolveLocation(pratica.provResidenza);
        const resolvedLavoro = this.resolveLocation(pratica.provLavoro);

        const ltv = pratica.valoreImmobile > 0 ? (pratica.importoMutuo / pratica.valoreImmobile) : 0;
        const isConsapRequired = ltv > 0.80;

        for (const [bankId, policy] of Object.entries(this.bankPolicies)) {
            const checks = [];
            let bankStatus = "ok"; // "ok" (🟢), "deroga" (🟡), or "ko" (🔴)

            // STEP 1: Cross-Territoriality (All banks operate nationwide)
            const isNationwide = true;
            const operatesImmobile = resolvedImmobile && policy.territories && policy.territories.includes(resolvedImmobile.province);
            const operatesResidenza = resolvedResidenza && policy.territories && policy.territories.includes(resolvedResidenza.province);
            const operatesLavoro = resolvedLavoro && policy.territories && policy.territories.includes(resolvedLavoro.province);
            const territorialityOk = isNationwide || operatesImmobile || operatesResidenza || operatesLavoro;

            checks.push({
                name: "Territorialità",
                status: territorialityOk ? "ok" : "ko",
                ok: territorialityOk,
                text: territorialityOk 
                    ? `Opera in tutto il territorio nazionale (inclusa la provincia di ${resolvedImmobile?.provinceName || resolvedImmobile?.province || "riferimento"})`
                    : `Nessuna copertura nelle province dell'immobile, residenza o lavoro.`
            });
            if (!territorialityOk) bankStatus = "ko";

            // STEP 2: General Practice parameters
            const loanMinOk = pratica.importoMutuo >= policy.minLoan;
            const loanMaxOk = pratica.importoMutuo <= policy.maxLoan;
            const loanOk = loanMinOk && loanMaxOk;
            checks.push({
                name: "Importo Mutuo",
                status: loanOk ? "ok" : "ko",
                ok: loanOk,
                text: loanOk 
                    ? `Richiesto: ${pratica.importoMutuo.toLocaleString()} €, Limiti: ${policy.minLoan.toLocaleString()} € - ${policy.maxLoan.toLocaleString()} €`
                    : `Importo ${pratica.importoMutuo.toLocaleString()} € fuori dai limiti (${policy.minLoan.toLocaleString()} - ${policy.maxLoan.toLocaleString()})`
            });
            if (!loanOk) bankStatus = "ko";

            const durationOk = pratica.durata >= policy.minDuration && pratica.durata <= policy.maxDuration;
            checks.push({
                name: "Durata",
                status: durationOk ? "ok" : "ko",
                ok: durationOk,
                text: durationOk
                    ? `Richiesta: ${pratica.durata} anni, Limiti: ${policy.minDuration} - ${policy.maxDuration} anni`
                    : `Durata ${pratica.durata} anni fuori dai limiti della banca (${policy.minDuration} - ${policy.maxDuration})`
            });
            if (!durationOk) bankStatus = "ko";

            const purposeOk = policy.allowedPurposes.includes(pratica.finalita);
            checks.push({
                name: "Finalità Operazione",
                status: purposeOk ? "ok" : "ko",
                ok: purposeOk,
                text: purposeOk
                    ? `Ammessa: ${pratica.finalita}`
                    : `La finalità '${pratica.finalita}' non è gestita da questo istituto`
            });
            if (!purposeOk) bankStatus = "ko";

            // STEP 3: Subjects & Incomes processing
            let calculatedTotalIncome = 0;
            let guarantorIncome = 0;
            const subjectsCopy = [];
            
            pratica.subjects.forEach(s => {
                const calculatedNetto = this.calculateNetIncome(s, bankId);
                subjectsCopy.push({ ...s, calculatedNetto });
                if (s.role === "Richiedente Principale" || s.role === "Cointestatario") {
                    calculatedTotalIncome += calculatedNetto;
                } else if (s.role === "Garante") {
                    guarantorIncome += calculatedNetto;
                }
            });

            // Age check for Borrowers & Guarantors (RC-008)
            let ageStatus = "ok";
            let ageDetails = "";
            const applicants = subjectsCopy.filter(s => s.role === "Richiedente Principale" || s.role === "Cointestatario");
            const guarantors = subjectsCopy.filter(s => s.role === "Garante");

            if (bankId === "bper") {
                if (applicants.length > 0) {
                    const agesAtMaturity = applicants.map(s => s.eta + pratica.durata);
                    const youngestAgeAtMaturity = Math.min(...agesAtMaturity);
                    if (youngestAgeAtMaturity <= 78) ageStatus = "ok";
                    else if (youngestAgeAtMaturity <= 79) ageStatus = "deroga";
                    else ageStatus = "ko";
                    ageDetails = `Youngest: ${youngestAgeAtMaturity} anni (Limite: 78)`;
                }
            } else {
                if (applicants.length > 0) {
                    const maxAgeReached = Math.max(...applicants.map(s => s.eta + pratica.durata));
                    if (maxAgeReached <= policy.maxAge) ageStatus = "ok";
                    else if (maxAgeReached <= policy.maxAge + 1) ageStatus = "deroga";
                    else ageStatus = "ko";
                    ageDetails = `Max a scadenza: ${maxAgeReached} anni (Limite: ${policy.maxAge})`;
                }
            }

            // Check Garanti Age
            if (guarantors.length > 0) {
                const maxGuarantorAgeReached = Math.max(...guarantors.map(s => s.eta + pratica.durata));
                const maxG = policy.maxGuarantorAge || 80;
                if (maxGuarantorAgeReached > maxG) {
                    ageStatus = "ko";
                    ageDetails += ` | Garante a scadenza: ${maxGuarantorAgeReached} anni (Limite Garante: ${maxG})`;
                }
            }

            checks.push({
                name: "Età a Scadenza",
                status: ageStatus,
                ok: ageStatus !== "ko",
                text: ageDetails || "Nessun intestatario presente"
            });
            if (ageStatus === "ko") bankStatus = "ko";
            else if (ageStatus === "deroga" && bankStatus !== "ko") bankStatus = "deroga";

            // Residency permit check (RC-010)
            let permitStatus = "ok";
            const nonEuSubjects = subjectsCopy.filter(s => s.cittadinanza === "extra_UE");
            nonEuSubjects.forEach(s => {
                if (s.permScadenza === "scaduto") {
                    permitStatus = "ko";
                }
            });
            checks.push({
                name: "Permesso di Soggiorno",
                status: permitStatus,
                ok: permitStatus === "ok",
                text: permitStatus === "ok"
                    ? (nonEuSubjects.length > 0 ? "In corso di validità o in fase di rinnovo" : "Non applicabile")
                    : "Presenza di richiedenti extracomunitari con permesso scaduto"
            });
            if (permitStatus === "ko") bankStatus = "ko";

            // Allowed contract types check (RC-002)
            let contractStatus = "ok";
            let contractDetails = [];
            subjectsCopy.forEach(s => {
                const contractsToCheck = (s.incomes && s.incomes.length > 0) ? s.incomes.map(i => i.tipoContratto) : [s.tipoContratto];
                contractsToCheck.forEach(ct => {
                    if (ct && !policy.allowedContracts.includes(ct)) {
                        contractStatus = "ko";
                        contractDetails.push(`${s.nome || s.role} (${ct})`);
                    }
                });
            });
            checks.push({
                name: "Tipologia Occupazione",
                status: contractStatus,
                ok: contractStatus === "ok",
                text: contractStatus === "ok"
                    ? "Tutte le occupazioni dei richiedenti sono accettate"
                    : `Occupazioni non ammesse: ${contractDetails.join(", ")}`
            });
            if (contractStatus === "ko") bankStatus = "ko";

            // TD co-applicant rule (RC-004)
            let tdStatus = "ok";
            const hasTd = subjectsCopy.some(s => (s.role === "Richiedente Principale" || s.role === "Cointestatario") && (s.tipoContratto === "dipendente_td" || (s.incomes && s.incomes.some(i => i.tipoContratto === "dipendente_td"))));
            if (hasTd) {
                const stableCoobbligati = subjectsCopy.filter(s => s.calculatedNetto > 0 && s.tipoContratto !== "dipendente_td" && (!s.incomes || s.incomes.some(i => i.tipoContratto !== "dipendente_td")));
                if (stableCoobbligati.length === 0) {
                    tdStatus = (bankId === "bper" || bankId === "chebanca") ? "deroga" : "ko";
                }
            }
            checks.push({
                name: "Coobbligazione TD",
                status: tdStatus,
                ok: tdStatus !== "ko",
                text: tdStatus === "ok"
                    ? (hasTd ? "Contratto TD supportato da coobbligato stabile" : "Non applicabile")
                    : (tdStatus === "deroga" ? "In Deroga: Richiedente TD privo di coobbligato stabile (eccezione gestibile con garante)" : "Richiedente TD privo di coobbligato con reddito stabile")
            });
            if (tdStatus === "ko") bankStatus = "ko";
            else if (tdStatus === "deroga" && bankStatus !== "ko") bankStatus = "deroga";

            // Seniority check (RC-005)
            let seniorityStatus = "ok";
            let seniorityDetails = [];
            const minSeniorityStd = policy.minSeniorityAutonomo || 24;
            const minSeniorityDeroga = policy.minSeniorityAutonomoDeroga || 18;

            subjectsCopy.forEach(s => {
                const incs = (s.incomes && s.incomes.length > 0) ? s.incomes : [s];
                incs.forEach(i => {
                    if (i.anzianita !== undefined && i.anzianita !== null) {
                        if (i.tipoContratto === "autonomo") {
                            if (i.anzianita >= minSeniorityStd) {
                                // OK
                            } else if (i.anzianita >= minSeniorityDeroga) {
                                seniorityStatus = "deroga";
                                seniorityDetails.push(`${s.nome || s.role}: autonomo da ${i.anzianita} mesi (Richiesta deroga, std: ${minSeniorityStd})`);
                            } else {
                                seniorityStatus = "ko";
                                seniorityDetails.push(`${s.nome || s.role}: autonomo da ${i.anzianita} mesi (Richiesto min: ${minSeniorityDeroga})`);
                            }
                        }
                    }
                });
            });
            checks.push({
                name: "Anzianità Lavorativa",
                status: seniorityStatus,
                ok: seniorityStatus !== "ko",
                text: seniorityStatus === "ok"
                    ? "Anzianità lavorativa conforme alle policy"
                    : (seniorityStatus === "deroga" ? `In Deroga: ${seniorityDetails.join("; ")}` : `Anzianità insufficiente: ${seniorityDetails.join("; ")}`)
            });
            if (seniorityStatus === "ko") bankStatus = "ko";
            else if (seniorityStatus === "deroga" && bankStatus !== "ko") bankStatus = "deroga";

            // Borrowers count limit (RC-012)
            const numOwners = PraticaHelper.countPropertyOwners(pratica);
            const borrowersOk = numOwners <= policy.maxBorrowers;
            checks.push({
                name: "Numero Co-Intestatari",
                status: borrowersOk ? "ok" : "ko",
                ok: borrowersOk,
                text: borrowersOk
                    ? `Richiesti: ${numOwners}, Massimo ammesso: ${policy.maxBorrowers}`
                    : `Numero di intestatari (${numOwners}) superiore al limite consentito (${policy.maxBorrowers})`
            });
            if (!borrowersOk) bankStatus = "ko";

            // Product Matching and Financial Metrics
            const products = this.bankProducts[bankId] || [];
            const candidates = [];

            products.forEach(prod => {
                if (!prod.finalita.includes(pratica.finalita)) return;
                if (pratica.tipoTasso !== "any" && prod.tipo !== pratica.tipoTasso) return;
                if (ltv > (policy.maxLtv + 0.005) && ltv > (prod.ltvMax + 0.005)) return;
                if (prod.isGreen && !pratica.isGreen) return;
                if (isConsapRequired && !prod.isConsap) return;

                let spreadVal = null;
                prod.grigliaTassi.forEach(g => {
                    if (pratica.durata >= g.dMin && pratica.durata <= g.dMax) {
                        spreadVal = g.spread;
                    }
                });
                if (spreadVal === null) return;

                let baseRate = 0;
                if (prod.parametro === "Euribor 1M") baseRate = tassiBase.euribor1m;
                else if (prod.parametro === "Euribor 3M") baseRate = tassiBase.euribor3m;
                else if (prod.parametro === "IRS") baseRate = tassiBase.irs;
                else if (prod.parametro === "BCE") baseRate = tassiBase.bce;

                const tan = baseRate + spreadVal;
                const rata = this.getMortgagePayment(pratica.importoMutuo, tan, pratica.durata);
                const totalCommitment = rata + PraticaHelper.calculateTotalCommitments(pratica);
                
                // Income for DSR includes primary borrowers + guarantors contribution in MRI
                const dsr = calculatedTotalIncome > 0 ? (totalCommitment / calculatedTotalIncome) : 0;
                const totalIncomeWithGuarantors = calculatedTotalIncome + guarantorIncome;
                const residual = totalIncomeWithGuarantors - totalCommitment;

                // DSR 3-tier status evaluation
                const maxDsrStd = policy.maxDsr;
                const maxDsrDeroga = policy.maxDsrDeroga || (maxDsrStd + 0.05);
                
                let dsrStatus = "ok";
                if (dsr <= maxDsrStd) {
                    dsrStatus = "ok";
                } else if (dsr <= maxDsrDeroga) {
                    dsrStatus = "deroga";
                } else {
                    dsrStatus = "ko";
                }

                // MRI evaluation
                const mriRequired = policy.hasMri ? this.getMriRequired(pratica.zona, PraticaHelper.countHouseholdMembers(pratica)) : 0;
                let mriStatus = "ok";
                if (!policy.hasMri) {
                    mriStatus = "ok";
                } else if (residual >= mriRequired) {
                    mriStatus = "ok";
                } else if (residual >= (mriRequired - 150)) {
                    mriStatus = "deroga";
                } else {
                    mriStatus = "ko";
                }
                // Max loan calculation for candidate
                let maxLoanByLtv = (pratica.valoreImmobile || 0) * policy.maxLtv;
                let maxRataByDsr = totalIncomeWithGuarantors * policy.maxDsr;
                let maxRataByMri = policy.hasMri ? (totalIncomeWithGuarantors - mriRequired) : maxRataByDsr;
                let maxRataAllowed = Math.max(0, Math.min(maxRataByDsr, maxRataByMri));
                
                let maxLoanByIncome = 0;
                if (tan > 0 && pratica.durata > 0) {
                    let iRate = tan / 100 / 12;
                    let nMonths = pratica.durata * 12;
                    maxLoanByIncome = maxRataAllowed * ((1 - Math.pow(1 + iRate, -nMonths)) / iRate);
                } else {
                    maxLoanByIncome = maxRataAllowed * pratica.durata * 12;
                }

                let maxLoanGrantable = maxLoanByIncome;
                if (pratica.calcMode !== "max" && pratica.valoreImmobile > 0) {
                    maxLoanGrantable = Math.max(0, Math.min(maxLoanByLtv, maxLoanByIncome));
                }
                let limitingFactor = (pratica.calcMode === "max")
                    ? "Capacità Reddituale Teorica (Sussistenza & DSR Max)"
                    : (maxLoanByLtv < maxLoanByIncome ? "LTV (Valore Immobile)" : "Reddito (Rata/Reddito o Sussistenza)");
                let maxRataSimulated = this.getMortgagePayment(maxLoanGrantable, tan, pratica.durata);
                let maxLtvSimulated = (pratica.valoreImmobile > 0) ? (maxLoanGrantable / pratica.valoreImmobile) : policy.maxLtv;

                candidates.push({
                    product: prod,
                    tan: tan,
                    rata: rata,
                    dsr: dsr,
                    residual: residual,
                    mriRequired: mriRequired,
                    dsrStatus: dsrStatus,
                    mriStatus: mriStatus,
                    maxLoanGrantable: maxLoanGrantable,
                    limitingFactor: limitingFactor,
                    maxRataSimulated: maxRataSimulated,
                    maxLtvSimulated: maxLtvSimulated
                });
            });

            // Evaluate Financial Checks
            let bestChoice = null;

            if (candidates.length > 0) {
                candidates.sort((a, b) => {
                    if (pratica.calcMode === "max") {
                        return b.maxLoanGrantable - a.maxLoanGrantable; // highest loan amount first
                    }
                    return a.rata - b.rata;
                });
                
                // Find candidates that do NOT have KO financial statuses
                const acceptableCandidates = candidates.filter(c => c.dsrStatus !== "ko" && c.mriStatus !== "ko");
                if (acceptableCandidates.length > 0) {
                    bestChoice = acceptableCandidates[0];
                } else {
                    bestChoice = candidates[0]; // fallback
                }

                // Financial checks status assignment
                const dsrCheckStatus = bestChoice.dsrStatus;
                checks.push({
                    name: "Rapporto Rata/Reddito (DSR)",
                    status: dsrCheckStatus,
                    ok: dsrCheckStatus !== "ko",
                    text: dsrCheckStatus === "ok" 
                        ? `Limite: ${(policy.maxDsr * 100).toFixed(0)}%, Calcolato: ${(bestChoice.dsr * 100).toFixed(1)}%`
                        : (dsrCheckStatus === "deroga"
                            ? `In Deroga: ${(bestChoice.dsr * 100).toFixed(1)}% (Std: ${(policy.maxDsr * 100).toFixed(0)}%, Max Deroga: ${(policy.maxDsrDeroga * 100).toFixed(0)}%)`
                            : `Limite: ${(policy.maxDsr * 100).toFixed(0)}%, Calcolato: ${(bestChoice.dsr * 100).toFixed(1)}% (Fuori Deroga)`)
                });
                if (dsrCheckStatus === "ko") bankStatus = "ko";
                else if (dsrCheckStatus === "deroga" && bankStatus !== "ko") bankStatus = "deroga";

                const mriCheckStatus = bestChoice.mriStatus;
                checks.push({
                    name: "Sussistenza Minima (MRI)",
                    status: mriCheckStatus,
                    ok: mriCheckStatus !== "ko",
                    text: policy.hasMri 
                        ? (mriCheckStatus === "ok"
                            ? `Richiesto: ${bestChoice.mriRequired} €, Residuo: ${Math.round(bestChoice.residual)} €`
                            : (mriCheckStatus === "deroga"
                                ? `In Deroga: Residuo ${Math.round(bestChoice.residual)} € sottosoglia (Richiesto: ${bestChoice.mriRequired} €)`
                                : `Richiesto: ${bestChoice.mriRequired} €, Residuo: ${Math.round(bestChoice.residual)} € (Insufficiente)`))
                        : "Soglia non prevista"
                });
                if (mriCheckStatus === "ko") bankStatus = "ko";
                else if (mriCheckStatus === "deroga" && bankStatus !== "ko") bankStatus = "deroga";
            } else {
                checks.push({ name: "Rapporto Rata/Reddito (DSR)", status: "ko", ok: false, text: "Nessun prodotto compatibile" });
                checks.push({ name: "Sussistenza Minima (MRI)", status: "ko", ok: false, text: "Nessun prodotto compatibile" });
                bankStatus = "ko";
            }

            const ltvOk = ltv <= policy.maxLtv;
            checks.push({
                name: "LTV Massimo",
                status: ltvOk ? "ok" : "ko",
                ok: ltvOk,
                text: `Limite standard: ${(policy.maxLtv * 100).toFixed(0)}%, Calcolato: ${(ltv * 100).toFixed(1)}%`
            });
            if (!ltvOk && pratica.calcMode !== "max") bankStatus = "ko";

            // Geolocation Recommended Branches
            const candidateBranches = (this.branchesDb && this.branchesDb[bankId]) || [];
            const recommendedBranches = candidateBranches.filter(b => 
                b.prov === resolvedImmobile?.province || 
                b.prov === resolvedResidenza?.province || 
                b.prov === resolvedLavoro?.province
            );

            recommendedBranches.forEach(b => {
                const branchLoc = this.resolveLocation(b.prov);
                const refLoc = resolvedImmobile || resolvedResidenza || resolvedLavoro;
                if (branchLoc && branchLoc.lat && refLoc && refLoc.lat) {
                    b.distance = this.getHaversineDistance(refLoc.lat, refLoc.lng, branchLoc.lat, branchLoc.lng);
                } else {
                    b.distance = null;
                }
            });

            recommendedBranches.sort((a, b) => {
                if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
                if (a.distance !== null) return -1;
                if (b.distance !== null) return 1;
                return (pratica.finalita === "consolido") ? (b.countConsolido - a.countConsolido) : (b.countAcquisto - a.countAcquisto);
            });

            evaluatedBanks.push({
                bankId: bankId,
                name: policy.name,
                logo: policy.bgLogoLetter,
                color: policy.color,
                status: bankStatus, // "ok", "deroga", or "ko"
                prodName: bestChoice ? bestChoice.product.nome : "Nessun Prodotto Compatibile",
                tan: bestChoice ? bestChoice.tan : 0,
                rata: bestChoice ? bestChoice.rata : 999999,
                dsr: bestChoice ? bestChoice.dsr : 0,
                maxLoanGrantable: bestChoice ? bestChoice.maxLoanGrantable : 0,
                limitingFactor: bestChoice ? bestChoice.limitingFactor : "--",
                maxRataSimulated: bestChoice ? bestChoice.maxRataSimulated : 0,
                maxLtvSimulated: bestChoice ? bestChoice.maxLtvSimulated : 0,
                checks: checks,
                recommendedBranches: recommendedBranches.slice(0, 2),
                isNotFeasible: bankStatus === "ko"
            });
        }

        const activeFeasible = evaluatedBanks.filter(b => b.status === "ok" || b.status === "deroga");
        activeFeasible.sort((a, b) => {
            // "ok" banks come before "deroga" banks
            if (a.status === "ok" && b.status === "deroga") return -1;
            if (a.status === "deroga" && b.status === "ok") return 1;
            return a.rata - b.rata;
        });

        return {
            feasible: activeFeasible.length > 0,
            banks: activeFeasible,
            allEvaluated: evaluatedBanks
        };
    }
};

BrokerFlowEngine.init(BrokerFlowEngine.bankPolicies, BrokerFlowEngine.bankProducts, BrokerFlowEngine.comuniDb);

const PraticaHelper = {
    calculateTotalCommitments(pratica) {
        return pratica.altreRate || 0;
    },
    countHouseholdMembers(pratica) {
        return pratica.personeNucleo || 1;
    },
    countPropertyOwners(pratica) {
        if (pratica.subjects && pratica.subjects.length > 0) {
            return pratica.subjects.filter(s => s.isOwner).length;
        }
        return 1;
    }
};
