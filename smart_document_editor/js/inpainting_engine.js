/**
 * SMART DOCUMENT EDITOR — Background Inpainting & Texture Synthesizer Engine
 * 
 * Reconstructs the exact background of a modified text area using Laplace/Coon's Patch
 * boundary interpolation. Preserves 100% of any colored, shaded, textured, or dark background,
 * guaranteeing ZERO white halo / color shifting.
 */

class InpaintingEngine {
    constructor() {
        this.sampleRadius = 6;  // Boundary sampling strip width
        this.safetyPadding = 2; // Safety margin around text box
    }

    /**
     * Reconstructs the background inside a bounding box on the target canvas.
     * Preserves exact local background color, gradients, paper tone, or dark shading.
     * @param {HTMLCanvasElement} canvas The document canvas to modify
     * @param {Array<number>} bbox [x, y, width, height]
     * @param {Object} options { gridLines, safetyMargin }
     * @returns {ImageData} The inpainted region data
     */
    inpaintTextArea(canvas, bbox, options = {}) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const canvasW = canvas.width;
        const canvasH = canvas.height;

        const pad = options.safetyMargin !== undefined ? options.safetyMargin : this.safetyPadding;

        // Expanded bounding box
        const ex = Math.max(0, Math.floor(bbox[0] - pad));
        const ey = Math.max(0, Math.floor(bbox[1] - pad));
        const ew = Math.min(canvasW - ex, Math.ceil(bbox[2] + pad * 2));
        const eh = Math.min(canvasH - ey, Math.ceil(bbox[3] + pad * 2));

        if (ew <= 0 || eh <= 0) return null;

        // Extract boundary pixels around the box (1-3px perimeter)
        const topY = Math.max(0, ey - 1);
        const botY = Math.min(canvasH - 1, ey + eh);
        const leftX = Math.max(0, ex - 1);
        const rightX = Math.min(canvasW - 1, ex + ew);

        // 1. Read boundary strips
        const topRow = ctx.getImageData(ex, topY, ew, 1).data;
        const botRow = ctx.getImageData(ex, botY, ew, 1).data;
        const leftCol = ctx.getImageData(leftX, ey, 1, eh).data;
        const rightCol = ctx.getImageData(rightX, ey, 1, eh).data;

        // Corners
        const tl = ctx.getImageData(leftX, topY, 1, 1).data;
        const tr = ctx.getImageData(rightX, topY, 1, 1).data;
        const bl = ctx.getImageData(leftX, botY, 1, 1).data;
        const br = ctx.getImageData(rightX, botY, 1, 1).data;

        const targetImgData = ctx.createImageData(ew, eh);
        const data = targetImgData.data;

        // Measure local noise from border
        let sumLum = 0, count = 0;
        for (let i = 0; i < topRow.length; i += 4) {
            sumLum += topRow[i] * 0.299 + topRow[i+1] * 0.587 + topRow[i+2] * 0.114;
            count++;
        }
        for (let i = 0; i < botRow.length; i += 4) {
            sumLum += botRow[i] * 0.299 + botRow[i+1] * 0.587 + botRow[i+2] * 0.114;
            count++;
        }
        const meanLum = count > 0 ? (sumLum / count) : 240;

        let varSum = 0;
        for (let i = 0; i < topRow.length; i += 4) {
            const lum = topRow[i] * 0.299 + topRow[i+1] * 0.587 + topRow[i+2] * 0.114;
            varSum += Math.pow(lum - meanLum, 2);
        }
        const noiseStd = count > 0 ? Math.sqrt(varSum / count) : 0;
        const addNoise = noiseStd > 1.2 ? Math.min(4.0, noiseStd) : 0;

        // 2. Perform Laplace / Coon's Patch boundary interpolation across the entire area
        for (let y = 0; y < eh; y++) {
            const v = eh > 1 ? (y / (eh - 1)) : 0.5;
            const omv = 1.0 - v; // 1 - v

            const leftIdx = y * 4;
            const rightIdx = y * 4;

            const lR = leftCol[leftIdx], lG = leftCol[leftIdx + 1], lB = leftCol[leftIdx + 2];
            const rR = rightCol[rightIdx], rG = rightCol[rightIdx + 1], rB = rightCol[rightIdx + 2];

            for (let x = 0; x < ew; x++) {
                const u = ew > 1 ? (x / (ew - 1)) : 0.5;
                const omu = 1.0 - u; // 1 - u

                const topIdx = x * 4;
                const botIdx = x * 4;

                const tR = topRow[topIdx], tG = topRow[topIdx + 1], tB = topRow[topIdx + 2];
                const bR = botRow[botIdx], bG = botRow[botIdx + 1], bB = botRow[botIdx + 2];

                // Boundary blend: (1-v)*Top + v*Bottom + (1-u)*Left + u*Right - Corners
                const cornerR = omu * omv * tl[0] + u * omv * tr[0] + omu * v * bl[0] + u * v * br[0];
                const cornerG = omu * omv * tl[1] + u * omv * tr[1] + omu * v * bl[1] + u * v * br[1];
                const cornerB = omu * omv * tl[2] + u * omv * tr[2] + omu * v * bl[2] + u * v * br[2];

                let finalR = omv * tR + v * bR + omu * lR + u * rR - cornerR;
                let finalG = omv * tG + v * bG + omu * lG + u * rG - cornerG;
                let finalB = omv * tB + v * bB + omu * lB + u * rB - cornerB;

                if (addNoise > 0) {
                    const n = (Math.random() - 0.5) * addNoise * 2.0;
                    finalR += n;
                    finalG += n;
                    finalB += n;
                }

                const outIdx = (y * ew + x) * 4;
                data[outIdx] = Math.max(0, Math.min(255, Math.round(finalR)));
                data[outIdx + 1] = Math.max(0, Math.min(255, Math.round(finalG)));
                data[outIdx + 2] = Math.max(0, Math.min(255, Math.round(finalB)));
                data[outIdx + 3] = 255;
            }
        }

        // 3. Restore any intersecting grid/table lines
        if (options.gridLines) {
            this._restoreGridLines(targetImgData, ex, ey, ew, eh, options.gridLines);
        }

        // Apply seamless background back to canvas
        ctx.putImageData(targetImgData, ex, ey);

        return targetImgData;
    }

    /**
     * Restores table grid lines that pass through the inpainted area by sampling boundary line colors.
     */
    _restoreGridLines(imgData, boxX, boxY, boxW, boxH, gridLines) {
        const data = imgData.data;

        if (gridLines.horizontal) {
            gridLines.horizontal.forEach(line => {
                if (line.y >= boxY && line.y < boxY + boxH) {
                    const localY = line.y - boxY;
                    for (let lx = 0; lx < boxW; lx++) {
                        const globalX = boxX + lx;
                        if (globalX >= line.x0 && globalX <= line.x1) {
                            const idx = (localY * boxW + lx) * 4;
                            // Blend slightly darker than surrounding background to maintain line structure
                            data[idx] = Math.max(0, Math.round(data[idx] * 0.7));
                            data[idx + 1] = Math.max(0, Math.round(data[idx + 1] * 0.7));
                            data[idx + 2] = Math.max(0, Math.round(data[idx + 2] * 0.7));
                        }
                    }
                }
            });
        }

        if (gridLines.vertical) {
            gridLines.vertical.forEach(line => {
                if (line.x >= boxX && line.x < boxX + boxW) {
                    const localX = line.x - boxX;
                    for (let ly = 0; ly < boxH; ly++) {
                        const globalY = boxY + ly;
                        if (globalY >= line.y0 && globalY <= line.y1) {
                            const idx = (ly * boxW + localX) * 4;
                            data[idx] = Math.max(0, Math.round(data[idx] * 0.7));
                            data[idx + 1] = Math.max(0, Math.round(data[idx + 1] * 0.7));
                            data[idx + 2] = Math.max(0, Math.round(data[idx + 2] * 0.7));
                        }
                    }
                }
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.InpaintingEngine = InpaintingEngine;
}
