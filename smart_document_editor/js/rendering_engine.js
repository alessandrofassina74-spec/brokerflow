/**
 * SMART DOCUMENT EDITOR — Rendering & Typography Engine
 * 
 * Renders modified text with 100% optical fidelity, matching font family, weight,
 * exact pixel size, baseline, and deep solid ink color without fading.
 */

class DocumentRenderingEngine {
    constructor(characterBank, inpaintingEngine) {
        this.characterBank = characterBank;
        this.inpaintingEngine = inpaintingEngine;
    }

    /**
     * Extracts typography properties from options and original word.
     */
    _getTypographySpec(origWord = {}, options = {}) {
        const isManual = (options.fittingMode === 'MANUAL');
        const fontSize = (isManual && options.customSize) 
            ? options.customSize 
            : (options.customSize || origWord.fontSize || 20);

        let fontFamily = options.fontFamily || origWord.fontFamily || 'Arial, Helvetica, sans-serif';
        if (fontFamily === 'ARIAL') fontFamily = 'Arial, Helvetica, sans-serif';
        if (fontFamily === 'TIMES') fontFamily = '"Times New Roman", Times, Georgia, serif';
        if (fontFamily === 'CALIBRI') fontFamily = 'Calibri, "Segoe UI", sans-serif';
        if (fontFamily === 'GEORGIA') fontFamily = 'Georgia, serif';
        if (fontFamily === 'COURIER') fontFamily = '"Courier New", Courier, monospace';
        if (fontFamily === 'VERDANA') fontFamily = 'Verdana, sans-serif';

        const isBold = options.isBold !== undefined ? options.isBold : (origWord.isBold !== undefined ? origWord.isBold : false);
        const isItalic = options.isItalic !== undefined ? options.isItalic : (origWord.isItalic !== undefined ? origWord.isItalic : false);

        // Exact sampled ink color
        let inkColor = options.inkColor || origWord.inkColor || (isBold ? '#0f172a' : '#1e293b');
        if (typeof inkColor === 'object' && inkColor.r !== undefined) {
            inkColor = `rgb(${inkColor.r}, ${inkColor.g}, ${inkColor.b})`;
        }

        let fontSpec = '';
        if (isItalic) fontSpec += 'italic ';
        if (isBold) fontSpec += 'bold ';
        fontSpec += `${fontSize}px ${fontFamily}`;
        fontSpec = fontSpec.trim();

        return {
            fontSize,
            fontFamily,
            isBold,
            isItalic,
            inkColor,
            fontSpec
        };
    }

    /**
     * Directly renders photorealistic scanned text onto a target 2D context at the given bbox.
     * Applies optical micro-diffusion, edge bleed, and paper noise matching the original scan.
     */
    renderTextDirect(ctx, newText, bbox, options = {}) {
        if (!newText || newText.length === 0) return { glyphsUsed: [] };

        const [x, y, w, h] = bbox;
        const fittingMode = options.fittingMode || 'MAINTAIN_SIZE';
        const origWord = options.originalWord || {};

        const typo = this._getTypographySpec(origWord, options);

        // Baseline coordinate: use the exact optical baseline coordinate
        let baselineY;
        if (options.baseline !== undefined) {
            baselineY = options.baseline;
        } else if (origWord && origWord.baseline !== undefined) {
            baselineY = origWord.baseline;
        } else {
            // Precise typographic fallback: baseline is bottom of cap-height area
            baselineY = Math.round(y + h - (typo.fontSize * 0.22));
        }

        // Skew & Rotation Angle (degrees to radians)
        const angleDeg = options.rotationAngle !== undefined ? options.rotationAngle : (origWord.angle || 0);
        const angleRad = (angleDeg * Math.PI) / 180;

        // Measure text metrics
        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');
        measureCtx.font = typo.fontSpec;
        const textMetrics = measureCtx.measureText(newText);
        const textWidth = Math.ceil(textMetrics.width);
        const textHeight = Math.ceil(typo.fontSize * 1.5);
        const capHeight = Math.ceil(typo.fontSize * 0.82);

        // Fitting mode scale
        let scaleX = 1.0;
        let letterSpacing = 0;

        if (fittingMode === 'FIT_CONTAINER' && textWidth > w) {
            scaleX = Math.max(0.65, w / textWidth);
        } else if (fittingMode === 'MAINTAIN_WIDTH') {
            if (newText.length > 1 && textWidth < w) {
                letterSpacing = (w - textWidth) / (newText.length - 1);
            }
        }

        // Allocate offscreen canvas with generous padding for optical diffusion & edge blur
        const pad = 12;
        const bufWidth = Math.max(20, Math.ceil(textWidth * scaleX + (letterSpacing * newText.length) + pad * 2));
        const bufHeight = Math.max(20, Math.ceil(textHeight + pad * 2));

        const offCanvas = document.createElement('canvas');
        offCanvas.width = bufWidth;
        offCanvas.height = bufHeight;
        const offCtx = offCanvas.getContext('2d');

        // Draw solid text on offscreen buffer
        offCtx.font = typo.fontSpec;
        offCtx.fillStyle = typeof typo.inkColor === 'string' 
            ? typo.inkColor 
            : `rgb(${typo.inkColor.r}, ${typo.inkColor.g}, ${typo.inkColor.b})`;
        offCtx.textBaseline = 'alphabetic';

        const localBaseX = pad;
        const localBaseY = pad + capHeight;

        offCtx.save();
        offCtx.translate(localBaseX, localBaseY);

        if (scaleX !== 1.0) {
            offCtx.scale(scaleX, 1.0);
            offCtx.fillText(newText, 0, 0);
        } else if (letterSpacing > 0) {
            let curX = 0;
            for (let i = 0; i < newText.length; i++) {
                const ch = newText[i];
                offCtx.fillText(ch, curX, 0);
                curX += measureCtx.measureText(ch).width + letterSpacing;
            }
        } else {
            offCtx.fillText(newText, 0, 0);
        }
        offCtx.restore();

        // Check if we should render in Digital Native mode (ultra-crisp) or Scanned Paper mode (micro-diffusion)
        const edgeMode = options.edgeMode || 'AUTO';
        const noiseStd = (this.characterBank && this.characterBank.documentNoiseProfile)
            ? this.characterBank.documentNoiseProfile.noiseStdDev
            : 3.5;
        const isNativeDigital = (edgeMode === 'DIGITAL_SHARP') || (edgeMode === 'AUTO' && noiseStd <= 1.2);

        if (!isNativeDigital) {
            // Optical Degradation & Bleed: Transform razor vector edges into authentic scanned print
            const imgData = offCtx.getImageData(0, 0, bufWidth, bufHeight);
            const data = imgData.data;
            const copyData = new Uint8ClampedArray(data);
            const intensity = Math.min(1.0, Math.max(0.3, noiseStd / 3.5));

            for (let py = 1; py < bufHeight - 1; py++) {
                for (let px = 1; px < bufWidth - 1; px++) {
                    const idx = (py * bufWidth + px) * 4;
                    const alpha = copyData[idx + 3];

                    if (alpha > 8) {
                        // Sample 3x3 neighborhood alpha to generate soft optical diffusion
                        let sumAlpha = 0;
                        sumAlpha += copyData[((py - 1) * bufWidth + px) * 4 + 3] * 0.12 * intensity;
                        sumAlpha += copyData[((py + 1) * bufWidth + px) * 4 + 3] * 0.12 * intensity;
                        sumAlpha += copyData[(py * bufWidth + (px - 1)) * 4 + 3] * 0.12 * intensity;
                        sumAlpha += copyData[(py * bufWidth + (px + 1)) * 4 + 3] * 0.12 * intensity;
                        sumAlpha += alpha * (1.0 - 0.48 * intensity);

                        // Micro-roughness noise on strokes (matching paper grain & toner scatter)
                        const noise = (Math.random() - 0.5) * noiseStd * 3.0;
                        data[idx] = Math.max(0, Math.min(255, copyData[idx] + noise));
                        data[idx + 1] = Math.max(0, Math.min(255, copyData[idx + 1] + noise));
                        data[idx + 2] = Math.max(0, Math.min(255, copyData[idx + 2] + noise));

                        // Micro edge jitter to eliminate digital vector sharpness
                        if (alpha < 240) {
                            const alphaJitter = (Math.random() - 0.5) * 18 * intensity;
                            data[idx + 3] = Math.max(0, Math.min(255, Math.round(sumAlpha + alphaJitter)));
                        } else {
                            data[idx + 3] = Math.max(0, Math.min(255, Math.round(sumAlpha)));
                        }
                    } else {
                        // Subtle fiber bleed into adjacent background pixel
                        const topA = copyData[((py - 1) * bufWidth + px) * 4 + 3];
                        const botA = copyData[((py + 1) * bufWidth + px) * 4 + 3];
                        const leftA = copyData[(py * bufWidth + (px - 1)) * 4 + 3];
                        const rightA = copyData[(py * bufWidth + (px + 1)) * 4 + 3];
                        const maxAdj = Math.max(topA, botA, leftA, rightA);

                        if (maxAdj > 90) {
                            const bleedAlpha = Math.round((maxAdj * 0.08 + (Math.random() * 6)) * intensity);
                            if (bleedAlpha > 2) {
                                data[idx] = copyData[idx];
                                data[idx + 1] = copyData[idx + 1];
                                data[idx + 2] = copyData[idx + 2];
                                data[idx + 3] = bleedAlpha;
                            }
                        }
                    }
                }
            }

            offCtx.putImageData(imgData, 0, 0);
        }

        // Blit photorealistic scanned text onto destination canvas with rotation and baseline
        ctx.save();
        ctx.translate(x, baselineY);
        if (angleRad !== 0) {
            ctx.rotate(angleRad);
        }
        ctx.drawImage(offCanvas, -localBaseX, -localBaseY);
        ctx.restore();

        const glyphsUsed = [];
        for (let i = 0; i < newText.length; i++) {
            glyphsUsed.push({ char: newText[i], style: typo.fontSpec });
        }

        return {
            glyphsUsed,
            fontSize: typo.fontSize,
            fontFamily: typo.fontFamily,
            isBold: typo.isBold,
            inkColor: typo.inkColor
        };
    }

    /**
     * Applies modification directly to the base canvas:
     * 1. Inpaints original background (complete erasure of old ink)
     * 2. Directly renders new text with deep ink saturation and subpixel crispness
     */
    applyModification(baseCanvas, newText, bbox, options = {}) {
        // 1. Inpaint background with safety margin to completely erase any ghost ink
        this.inpaintingEngine.inpaintTextArea(baseCanvas, bbox, {
            gridLines: options.gridLines,
            safetyMargin: 4
        });

        // 2. Directly draw text onto the freshly reconstructed background
        const ctx = baseCanvas.getContext('2d');
        const res = this.renderTextDirect(ctx, newText, bbox, options);

        return res;
    }
}

if (typeof window !== 'undefined') {
    window.DocumentRenderingEngine = DocumentRenderingEngine;
}
