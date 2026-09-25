/**
 * SMART DOCUMENT EDITOR — Character Bank Engine (Document-Local)
 * 
 * Manages glyph extraction, cataloging, selection, and coherent synthetic fallback
 * strictly isolated per document instance, preserving exact font weight, style, and baseline.
 */

class DocumentCharacterBank {
    constructor(documentId) {
        this.documentId = documentId || `doc_${Date.now()}`;
        this.glyphMap = new Map(); // char -> Array<GlyphSample>
        this.documentNoiseProfile = {
            meanLuminance: 245,
            noiseStdDev: 3.0,
            medianInkColor: { r: 25, g: 35, b: 50 },
            estimatedFontFamily: '"Times New Roman", Times, serif',
            averageStrokeWidth: 2.0
        };
        this.totalGlyphsExtracted = 0;
    }

    reset(newDocId) {
        this.documentId = newDocId || `doc_${Date.now()}`;
        this.glyphMap.clear();
        this.totalGlyphsExtracted = 0;
    }

    /**
     * Analyzes the document image and populates the Character Bank from OCR words/chars.
     */
    populateFromOCR(sourceCanvas, ocrWords) {
        const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
        const docWidth = sourceCanvas.width;
        const docHeight = sourceCanvas.height;

        this._analyzeBackgroundProfile(ctx, docWidth, docHeight);

        if (!ocrWords || ocrWords.length === 0) return;

        ocrWords.forEach((word) => {
            if (!word.text) return;

            // If word has explicit character bounding boxes
            if (word.chars && word.chars.length > 0) {
                word.chars.forEach((charObj) => {
                    if (!charObj.char || charObj.char.trim() === '') return;
                    const [cx, cy, cw, ch] = charObj.bbox;
                    this._extractAndStoreGlyph(ctx, charObj.char, cx, cy, cw, ch, word);
                });
            } else {
                this._sliceWordIntoGlyphs(ctx, word);
            }
        });

        console.log(`[Character Bank] Document ${this.documentId}: Populated with ${this.totalGlyphsExtracted} glyphs across ${this.glyphMap.size} unique characters.`);
    }

    _extractAndStoreGlyph(ctx, char, x, y, w, h, parentWord) {
        if (w <= 1 || h <= 3) return;

        // Pad slightly to capture soft anti-aliased edges
        const pad = 1;
        const sx = Math.max(0, Math.floor(x - pad));
        const sy = Math.max(0, Math.floor(y - pad));
        const sw = Math.min(ctx.canvas.width - sx, Math.ceil(w + pad * 2));
        const sh = Math.min(ctx.canvas.height - sy, Math.ceil(h + pad * 2));

        if (sw <= 0 || sh <= 0) return;

        const imgData = ctx.getImageData(sx, sy, sw, sh);
        const metrics = this._analyzeGlyphMetrics(imgData);

        const glyphCanvas = document.createElement('canvas');
        glyphCanvas.width = sw;
        glyphCanvas.height = sh;
        glyphCanvas.getContext('2d').putImageData(imgData, 0, 0);

        const alphaMaskCanvas = this._generateAlphaMaskCanvas(imgData);

        const charKey = char;
        if (!this.glyphMap.has(charKey)) {
            this.glyphMap.set(charKey, []);
        }

        const existingVariants = this.glyphMap.get(charKey);
        const variantId = `${charKey}_${String.fromCharCode(65 + existingVariants.length)}`;

        const sample = {
            id: variantId,
            char: charKey,
            x: sx,
            y: sy,
            width: sw,
            height: sh,
            originalBbox: [x, y, w, h],
            baseline: parentWord.baseline ? (parentWord.baseline - sy) : (sh - 2),
            fontFamily: parentWord.fontFamily || this.documentNoiseProfile.estimatedFontFamily,
            fontSize: parentWord.fontSize || Math.round(sh * 0.85),
            isBold: parentWord.isBold || false,
            isItalic: parentWord.isItalic || false,
            strokeWidth: metrics.strokeWidth,
            inkColor: parentWord.inkColor || metrics.inkColor,
            inkDensity: metrics.inkDensity,
            noiseLevel: metrics.noiseLevel,
            canvas: glyphCanvas,
            maskCanvas: alphaMaskCanvas,
            page: 1
        };

        existingVariants.push(sample);
        this.totalGlyphsExtracted++;
    }

    _sliceWordIntoGlyphs(ctx, word) {
        const [x, y, w, h] = word.bbox;
        const cleanText = word.text.replace(/\s+/g, '');
        if (cleanText.length === 0) return;

        const charWidth = w / cleanText.length;
        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            const cx = Math.floor(x + i * charWidth);
            const cw = Math.ceil(charWidth);
            this._extractAndStoreGlyph(ctx, char, cx, y, cw, h, word);
        }
    }

    _analyzeGlyphMetrics(imgData) {
        const data = imgData.data;
        let totalR = 0, totalG = 0, totalB = 0;
        let inkPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            const lum = r * 0.299 + g * 0.587 + b * 0.114;
            if (lum < 160) {
                totalR += r;
                totalG += g;
                totalB += b;
                inkPixels++;
            }
        }

        const totalPixels = imgData.width * imgData.height;
        const inkDensity = totalPixels > 0 ? (inkPixels / totalPixels) : 0;
        const inkColor = inkPixels > 0 
            ? { r: Math.round(totalR / inkPixels), g: Math.round(totalG / inkPixels), b: Math.round(totalB / inkPixels) }
            : { r: 30, g: 40, b: 55 };

        return {
            strokeWidth: Math.max(1.0, (inkDensity * imgData.width * 0.4).toFixed(1)),
            inkColor,
            inkDensity,
            noiseLevel: this.documentNoiseProfile.noiseStdDev
        };
    }

    _generateAlphaMaskCanvas(imgData) {
        const canvas = document.createElement('canvas');
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        const ctx = canvas.getContext('2d');

        const outData = ctx.createImageData(imgData.width, imgData.height);
        const bgLum = this.documentNoiseProfile.meanLuminance;

        for (let i = 0; i < imgData.data.length; i += 4) {
            const r = imgData.data[i];
            const g = imgData.data[i + 1];
            const b = imgData.data[i + 2];
            const lum = r * 0.299 + g * 0.587 + b * 0.114;

            // Invert luminance to alpha (dark ink = solid alpha, background paper = transparent)
            const alpha = Math.max(0, Math.min(255, (bgLum - lum) * 1.8));
            outData.data[i] = r;
            outData.data[i + 1] = g;
            outData.data[i + 2] = b;
            outData.data[i + 3] = alpha;
        }

        ctx.putImageData(outData, 0, 0);
        return canvas;
    }

    _analyzeBackgroundProfile(ctx, width, height) {
        const sampleSize = Math.min(40, Math.floor(width / 10));
        const regions = [
            [5, 5, sampleSize, sampleSize],
            [width - sampleSize - 5, 5, sampleSize, sampleSize],
            [5, height - sampleSize - 5, sampleSize, sampleSize],
            [width - sampleSize - 5, height - sampleSize - 5, sampleSize, sampleSize]
        ];

        let sumLum = 0, count = 0;
        const samples = [];

        regions.forEach(([rx, ry, rw, rh]) => {
            if (rw > 0 && rh > 0) {
                const data = ctx.getImageData(rx, ry, rw, rh).data;
                for (let i = 0; i < data.length; i += 16) {
                    const lum = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                    samples.push(lum);
                    sumLum += lum;
                    count++;
                }
            }
        });

        const meanLum = count > 0 ? (sumLum / count) : 246;
        let varianceSum = 0;
        samples.forEach(l => { varianceSum += Math.pow(l - meanLum, 2); });
        const stdDev = count > 0 ? Math.sqrt(varianceSum / count) : 3.0;

        const isNativeDigital = stdDev <= 1.2;
        this.documentNoiseProfile.meanLuminance = Math.round(meanLum);
        this.documentNoiseProfile.noiseStdDev = parseFloat(stdDev.toFixed(2));
        this.documentNoiseProfile.isNativeDigital = isNativeDigital;
        this.documentNoiseProfile.documentType = isNativeDigital ? 'NATIVE_DIGITAL' : 'SCANNED_OPTICAL';
    }

    /**
     * Selects best glyph variant prioritizing font style (bold/italic) and height.
     */
    selectBestGlyph(char, targetContext = {}) {
        const variants = this.glyphMap.get(char);

        if (variants && variants.length > 0) {
            // Find variant matching bold/style if specified
            let bestSample = variants[0];
            let minCost = Infinity;

            const tBold = targetContext.isBold || false;
            const tHeight = targetContext.targetHeight || 20;

            variants.forEach(variant => {
                let cost = Math.abs(variant.height - tHeight) / tHeight;
                if (variant.isBold !== tBold) {
                    cost += 2.0; // Penalty for mismatching font weight
                }
                if (cost < minCost) {
                    minCost = cost;
                    bestSample = variant;
                }
            });

            return { glyphSample: bestSample, isSyntheticFallback: false };
        }

        // Generate coherent synthetic fallback matching target font properties
        const synthetic = this._generateCoherentSyntheticGlyph(char, targetContext);
        return { glyphSample: synthetic, isSyntheticFallback: true };
    }

    _generateCoherentSyntheticGlyph(char, targetContext = {}) {
        const targetHeight = targetContext.targetHeight || 20;
        const fontName = targetContext.fontFamily || '"Times New Roman", Times, serif';
        const isBold = targetContext.isBold ? 'bold' : 'normal';
        const isItalic = targetContext.isItalic ? 'italic' : 'normal';
        const fontSize = Math.round(targetHeight);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const fontSpec = `${isItalic} ${isBold} ${fontSize}px ${fontName}`.trim();
        tempCtx.font = fontSpec;
        const metrics = tempCtx.measureText(char);

        const charW = Math.max(6, Math.ceil(metrics.width) + 4);
        const charH = Math.max(10, Math.ceil(fontSize * 1.25));

        const synthCanvas = document.createElement('canvas');
        synthCanvas.width = charW;
        synthCanvas.height = charH;
        const sCtx = synthCanvas.getContext('2d');

        // Draw ink in exact target color
        const targetColor = targetContext.targetColor || '#1e293b';
        sCtx.fillStyle = typeof targetColor === 'string' ? targetColor : `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`;
        sCtx.font = fontSpec;
        sCtx.textBaseline = 'top';
        sCtx.fillText(char, 2, 2);

        // Apply optical degradation (micro-blur and paper noise)
        const imgData = sCtx.getImageData(0, 0, charW, charH);
        const noiseStd = this.documentNoiseProfile.noiseStdDev;

        for (let i = 0; i < imgData.data.length; i += 4) {
            const alpha = imgData.data[i + 3];
            if (alpha > 15) {
                const noise = (Math.random() - 0.5) * noiseStd * 3;
                imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
                imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
                imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
            }
        }
        sCtx.putImageData(imgData, 0, 0);

        const maskCanvas = this._generateAlphaMaskCanvas(imgData);

        return {
            id: `SYNTH_${char}`,
            char,
            x: 0,
            y: 0,
            width: charW,
            height: charH,
            originalBbox: [0, 0, charW, charH],
            baseline: Math.round(fontSize * 0.9),
            fontFamily: fontName,
            fontSize: fontSize,
            isBold: targetContext.isBold || false,
            isItalic: targetContext.isItalic || false,
            strokeWidth: this.documentNoiseProfile.averageStrokeWidth,
            inkColor: targetColor,
            inkDensity: 0.35,
            noiseLevel: noiseStd,
            canvas: synthCanvas,
            maskCanvas: maskCanvas,
            isSynthetic: true
        };
    }

    getBankOverview() {
        const overview = [];
        this.glyphMap.forEach((samples, char) => {
            overview.push({
                char,
                count: samples.length,
                samples: samples.map(s => ({
                    id: s.id,
                    width: s.width,
                    height: s.height,
                    isBold: s.isBold,
                    fontFamily: s.fontFamily,
                    origin: [s.x, s.y]
                }))
            });
        });
        return {
            documentId: this.documentId,
            totalCharacters: this.glyphMap.size,
            totalSamples: this.totalGlyphsExtracted,
            noiseProfile: this.documentNoiseProfile,
            overview
        };
    }
}

if (typeof window !== 'undefined') {
    window.DocumentCharacterBank = DocumentCharacterBank;
}
