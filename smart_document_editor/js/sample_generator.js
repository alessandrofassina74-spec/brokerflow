/**
 * SMART DOCUMENT EDITOR — Sample Document Generator & Optical Ground Truth
 * 
 * Generates an authentic scanned bank statement with table grid, realistic ink,
 * paper texture, and embeds high-precision character/word coordinates for instant OCR.
 */

class SampleDocumentGenerator {
    static createScannedInvoiceCanvas() {
        const width = 1200;
        const height = 1600;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Paper Background with warm antique tone and noise
        ctx.fillStyle = '#f8f7f2';
        ctx.fillRect(0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 6;
            imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
            imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
            imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        const words = [];
        const lines = [];

        function renderAndTrackText(text, x, y, font, fillStyle, isBold = false, isItalic = false) {
            ctx.font = font;
            ctx.fillStyle = fillStyle;
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(text, x, y);

            const m = ctx.measureText(text);
            const fontSize = parseInt(font.match(/\d+px/)?.[0] || '20', 10);
            const capHeight = Math.round(fontSize * 0.78);
            const boxY = y - capHeight;
            const boxH = Math.round(fontSize * 1.1);

            // Split into individual words
            let curX = x;
            const textWords = text.split(/(\s+)/);
            const lineWords = [];

            textWords.forEach(w => {
                if (w.trim() === '') {
                    curX += ctx.measureText(w).width;
                    return;
                }
                const wm = ctx.measureText(w);
                const wObj = {
                    id: `w_${words.length}`,
                    text: w,
                    confidence: 0.99,
                    bbox: [Math.round(curX), Math.round(boxY), Math.round(wm.width), Math.round(boxH)],
                    baseline: y,
                    fontFamily: font.includes('Arial') ? 'Arial, sans-serif' : '"Times New Roman", Times, serif',
                    fontSize: fontSize,
                    isBold: isBold,
                    isItalic: isItalic,
                    inkColor: fillStyle,
                    chars: []
                };

                // Track individual characters
                let charX = curX;
                for (let c = 0; c < w.length; c++) {
                    const ch = w[c];
                    const cm = ctx.measureText(ch);
                    wObj.chars.push({
                        char: ch,
                        confidence: 0.99,
                        bbox: [Math.round(charX), Math.round(boxY), Math.round(cm.width), Math.round(boxH)]
                    });
                    charX += cm.width;
                }

                words.push(wObj);
                lineWords.push(wObj);
                curX += wm.width;
            });

            lines.push({
                id: `line_${lines.length}`,
                text: text,
                bbox: [Math.round(x), Math.round(boxY), Math.round(m.width), Math.round(boxH)],
                confidence: 0.99,
                words: lineWords,
                baseline: y,
                fontSize: fontSize,
                fontFamily: font.includes('Arial') ? 'Arial, sans-serif' : '"Times New Roman", Times, serif',
                isBold: isBold,
                isItalic: isItalic,
                inkColor: fillStyle
            });
        }

        // 2. Document Header
        renderAndTrackText("ESTRATTO CONTO E CONVENZIONE BANCARIA", 120, 140, 'bold 34px "Times New Roman", Times, serif', '#1e293b', true);
        renderAndTrackText("Documento di Sintesi Periodico - Filiale Milano Centro", 120, 185, 'normal 20px "Times New Roman", Times, serif', '#334155');
        renderAndTrackText("Codice Pratica: PR-2026-98144 | Data Emissione: 15/05/2026", 120, 220, 'normal 20px "Times New Roman", Times, serif', '#334155');

        // Line under header
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(120, 250);
        ctx.lineTo(1080, 250);
        ctx.stroke();

        // 3. Customer Info Section
        renderAndTrackText("DATI INTESTATARIO E POSIZIONE", 120, 310, 'bold 22px Arial, sans-serif', '#0f172a', true);
        renderAndTrackText("Intestatario: Mario Rossi", 120, 350, 'normal 20px Arial, sans-serif', '#1e293b');
        renderAndTrackText("Codice Fiscale: RSSMRA80A01H501U", 120, 385, 'normal 20px Arial, sans-serif', '#1e293b');
        renderAndTrackText("Numero Conto Corrente: IT89B0306909606100000123456", 120, 420, 'normal 20px Arial, sans-serif', '#1e293b');

        // 4. Financial Table with Borders
        const tableY = 480;
        const rowH = 65;
        const colX = [120, 480, 720, 1080];

        // Header Background
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(colX[0], tableY, colX[3] - colX[0], rowH);

        // Grid Borders
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(colX[0], tableY, colX[3] - colX[0], rowH * 5);

        for (let r = 1; r <= 4; r++) {
            ctx.beginPath();
            ctx.moveTo(colX[0], tableY + r * rowH);
            ctx.lineTo(colX[3], tableY + r * rowH);
            ctx.stroke();
        }
        for (let c = 1; c <= 2; c++) {
            ctx.beginPath();
            ctx.moveTo(colX[c], tableY);
            ctx.lineTo(colX[c], tableY + rowH * 5);
            ctx.stroke();
        }

        // Table Header
        renderAndTrackText("Descrizione Operazione", colX[0] + 20, tableY + 42, 'bold 20px "Times New Roman", Times, serif', '#0f172a', true);
        renderAndTrackText("Data Valuta", colX[1] + 20, tableY + 42, 'bold 20px "Times New Roman", Times, serif', '#0f172a', true);
        renderAndTrackText("Importo (€)", colX[2] + 20, tableY + 42, 'bold 20px "Times New Roman", Times, serif', '#0f172a', true);

        // Table Rows
        const rows = [
            ["Rata Mutuo Ipotecario N. 48", "01/05/2026", "€ 1.850,00"],
            ["Spese Gestione e Amministrazione", "05/05/2026", "€ 45,00"],
            ["Accredito Bonifico Stipendio", "10/05/2026", "€ 3.200,00"],
            ["Imposta di Bollo Trimestrale", "15/05/2026", "€ 8,55"]
        ];

        rows.forEach((row, idx) => {
            const currentY = tableY + (idx + 1) * rowH + 42;
            renderAndTrackText(row[0], colX[0] + 20, currentY, 'normal 20px "Times New Roman", Times, serif', '#1e293b');
            renderAndTrackText(row[1], colX[1] + 20, currentY, 'normal 20px "Times New Roman", Times, serif', '#1e293b');
            renderAndTrackText(row[2], colX[2] + 20, currentY, 'bold 21px "Times New Roman", Times, serif', '#0f172a', true);
        });

        // 5. Total & Notes
        const summaryY = tableY + rowH * 5 + 70;
        renderAndTrackText("Saldo Disponibile al 15/05/2026: € 14.850,00", 120, summaryY, 'bold 24px Arial, sans-serif', '#0f172a', true);
        renderAndTrackText("Note legali: Il presente estratto conto ha valore di notifica ufficiale.", 120, summaryY + 50, 'italic 18px "Times New Roman", Times, serif', '#64748b', false, true);
        renderAndTrackText("In caso di discordanze, inviare comunicazione scritta entro 60 giorni.", 120, summaryY + 80, 'italic 18px "Times New Roman", Times, serif', '#64748b', false, true);

        // Attach Ground Truth OCR directly to the canvas
        canvas._groundTruthOCR = {
            words: words,
            lines: lines,
            gridLines: {
                horizontal: [
                    { y: tableY, x0: colX[0], x1: colX[3] },
                    { y: tableY + rowH, x0: colX[0], x1: colX[3] },
                    { y: tableY + rowH * 2, x0: colX[0], x1: colX[3] },
                    { y: tableY + rowH * 3, x0: colX[0], x1: colX[3] },
                    { y: tableY + rowH * 4, x0: colX[0], x1: colX[3] },
                    { y: tableY + rowH * 5, x0: colX[0], x1: colX[3] }
                ],
                vertical: [
                    { x: colX[0], y0: tableY, y1: tableY + rowH * 5 },
                    { x: colX[1], y0: tableY, y1: tableY + rowH * 5 },
                    { x: colX[2], y0: tableY, y1: tableY + rowH * 5 },
                    { x: colX[3], y0: tableY, y1: tableY + rowH * 5 }
                ]
            },
            overallConfidence: 0.99
        };

        return canvas;
    }
}

if (typeof window !== 'undefined') {
    window.SampleDocumentGenerator = SampleDocumentGenerator;
}
