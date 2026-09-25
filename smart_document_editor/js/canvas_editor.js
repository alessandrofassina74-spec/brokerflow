/**
 * SMART DOCUMENT EDITOR — Interactive Canvas & Selection Engine
 * 
 * Provides multi-layer canvas rendering, precise sub-pixel mouse selection,
 * bounding box resize handles, pan/zoom, live preview, and split-screen comparison slider.
 */

class DocumentCanvasEditor {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.options = options;

        // Sub-layers
        this.baseCanvas = document.createElement('canvas'); // Active working document
        this.overlayCanvas = document.createElement('canvas'); // UI Selections, handles, bboxes
        this.previewCanvas = document.createElement('canvas'); // Temporary live preview

        this.baseCtx = this.baseCanvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // State
        this.imageLoaded = false;
        this.docWidth = 0;
        this.docHeight = 0;
        this.scale = 1.0;
        this.panX = 0;
        this.panY = 0;

        // Tool Mode: 'BOX', 'WORD', 'LINE'
        this.selectionMode = 'WORD';

        // Selection State
        this.currentSelection = null; // { bbox: [x, y, w, h], text: "", type: "WORD"|"LINE"|"BOX" }
        this.isDragging = false;
        this.isPanning = false;
        this.isResizing = false;
        this.resizeHandle = null; // 'tl', 'tr', 'bl', 'br', 'l', 'r', 't', 'b'

        this.dragStart = { x: 0, y: 0 };
        this.panStart = { x: 0, y: 0 };

        // Split-Screen Comparison Mode ("Mostra Originale")
        this.isComparisonMode = false;
        this.comparisonSliderX = 0.5; // 0.0 to 1.0
        this.originalCanvas = null;

        // OCR Data
        this.ocrData = { words: [], lines: [], gridLines: null };

        // Callbacks
        this.onSelectionChanged = options.onSelectionChanged || (() => {});
        this.onZoomChanged = options.onZoomChanged || (() => {});
        this.onFileDropped = options.onFileDropped || (() => {});

        this._initDOM();
        this._bindEvents();
    }

    _initDOM() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.userSelect = 'none';

        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.style.position = 'absolute';
        this.canvasWrapper.style.transformOrigin = '0 0';
        this.canvasWrapper.style.display = 'none';

        [this.baseCanvas, this.previewCanvas, this.overlayCanvas].forEach(c => {
            c.style.position = 'absolute';
            c.style.left = '0';
            c.style.top = '0';
            this.canvasWrapper.appendChild(c);
        });

        // Create Empty State Dropzone
        this.emptyStateEl = document.createElement('div');
        this.emptyStateEl.className = 'empty-dropzone';
        this.emptyStateEl.innerHTML = `
            <div class="empty-dropzone-icon">📄</div>
            <div class="empty-dropzone-title">Nessun Documento Caricato</div>
            <div class="empty-dropzone-subtitle">
                Trascina qui un file <strong>JPG</strong> o <strong>PNG</strong> scansionato,<br>
                oppure clicca qui per selezionarlo dal tuo computer.
            </div>
            <button class="btn primary empty-dropzone-btn">📁 Sfoglia Immagine...</button>
        `;

        this.emptyStateEl.addEventListener('click', () => {
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.click();
        });

        this.container.appendChild(this.canvasWrapper);
        this.container.appendChild(this.emptyStateEl);
    }

    /**
     * Loads a new document image from an Image object or Canvas.
     */
    loadDocument(sourceImage, docId = null) {
        this.docWidth = sourceImage.width;
        this.docHeight = sourceImage.height;

        [this.baseCanvas, this.previewCanvas, this.overlayCanvas].forEach(c => {
            c.width = this.docWidth;
            c.height = this.docHeight;
        });

        this.baseCtx.drawImage(sourceImage, 0, 0);

        // Copy ground-truth OCR if present, or explicitly reset to null for uploaded images
        this.baseCanvas._groundTruthOCR = sourceImage._groundTruthOCR || null;
        this.ocrData = { words: [], lines: [], gridLines: null };
        this.currentSelection = null;

        // Store pristine copy for comparison
        this.originalCanvas = document.createElement('canvas');
        this.originalCanvas.width = this.docWidth;
        this.originalCanvas.height = this.docHeight;
        this.originalCanvas.getContext('2d').drawImage(sourceImage, 0, 0);

        this.imageLoaded = true;
        this.emptyStateEl.style.display = 'none';
        this.canvasWrapper.style.display = 'block';
        this.clearPreview();

        this.fitToContainer();
        this.renderOverlay();
    }

    setOCRData(ocrData) {
        this.ocrData = ocrData || { words: [], lines: [] };
        this.renderOverlay();
    }

    setSelectionMode(mode) {
        this.selectionMode = mode; // 'WORD', 'LINE', 'BOX'
        this.renderOverlay();
    }

    fitToContainer() {
        if (!this.imageLoaded) return;
        const cWidth = this.container.clientWidth || 800;
        const cHeight = this.container.clientHeight || 600;

        const scaleX = (cWidth - 40) / this.docWidth;
        const scaleY = (cHeight - 40) / this.docHeight;
        this.scale = Math.min(scaleX, scaleY, 1.5);
        this.scale = Math.max(0.2, this.scale);

        this.panX = (cWidth - this.docWidth * this.scale) / 2;
        this.panY = (cHeight - this.docHeight * this.scale) / 2;

        this._updateTransform();
        this.onZoomChanged(this.scale);
    }

    setZoom(scale) {
        this.scale = Math.max(0.1, Math.min(5.0, scale));
        this._updateTransform();
        this.onZoomChanged(this.scale);
    }

    _updateTransform() {
        this.canvasWrapper.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }

    /**
     * Converts client mouse event coordinates to document pixel coordinates.
     */
    _clientToDocCoords(clientX, clientY) {
        const rect = this.container.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const docX = (mouseX - this.panX) / this.scale;
        const docY = (mouseY - this.panY) / this.scale;

        return {
            x: Math.max(0, Math.min(this.docWidth, docX)),
            y: Math.max(0, Math.min(this.docHeight, docY))
        };
    }

    _bindEvents() {
        // Drag & Drop Document Handling
        ['dragenter', 'dragover'].forEach(evt => {
            this.container.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.emptyStateEl) this.emptyStateEl.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            this.container.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.emptyStateEl) this.emptyStateEl.classList.remove('dragover');
            });
        });

        this.container.addEventListener('drop', (e) => {
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    this.onFileDropped(file);
                }
            }
        });

        // Pan & Drag Selection
        this.container.addEventListener('mousedown', (e) => {
            if (!this.imageLoaded) return;
            const coords = this._clientToDocCoords(e.clientX, e.clientY);

            if (e.button === 1 || e.spaceKey || e.altKey) {
                // Middle click or space pan
                this.isPanning = true;
                this.panStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
                return;
            }

            if (this.isComparisonMode) {
                this.isDraggingComparison = true;
                this._updateComparisonSplit(e.clientX);
                return;
            }

            // Check if clicking resize handles on existing selection
            if (this.currentSelection) {
                const handle = this._getHandleUnderPoint(coords.x, coords.y, this.currentSelection.bbox);
                if (handle) {
                    this.isResizing = true;
                    this.resizeHandle = handle;
                    this.dragStart = { ...coords };
                    return;
                }
            }

            if (this.selectionMode === 'HAND' || e.button === 1 || e.spaceKey || e.altKey) {
                // Hand / Pan Tool
                this.isPanning = true;
                this.container.style.cursor = 'grabbing';
                this.panStart = { x: e.clientX - this.panX, y: e.clientY - this.panStart ? e.clientY - this.panY : e.clientY };
                this.panStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
                return;
            }

            if (this.selectionMode === 'WORD') {
                const clickedWord = this._findWordAt(coords.x, coords.y);
                if (clickedWord) {
                    this.setSelection(clickedWord.bbox, clickedWord.text, 'WORD', clickedWord);
                    return;
                }
            } else if (this.selectionMode === 'LINE') {
                const clickedLine = this._findLineAt(coords.x, coords.y);
                if (clickedLine) {
                    this.setSelection(clickedLine.bbox, clickedLine.text, 'LINE', clickedLine);
                    return;
                }
            }

            // Otherwise, start box drag selection
            this.isDragging = true;
            this.dragStart = { ...coords };
            this.currentSelection = {
                bbox: [coords.x, coords.y, 0, 0],
                text: "",
                type: 'BOX'
            };
            this.renderOverlay();
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.panX = e.clientX - this.panStart.x;
                this.panY = e.clientY - this.panStart.y;
                this._updateTransform();
                return;
            }

            if (this.isDraggingComparison) {
                this._updateComparisonSplit(e.clientX);
                return;
            }

            if (!this.imageLoaded) return;
            const coords = this._clientToDocCoords(e.clientX, e.clientY);

            if (this.selectionMode === 'HAND') {
                this.container.style.cursor = this.isPanning ? 'grabbing' : 'grab';
            } else {
                this.container.style.cursor = 'crosshair';
            }

            if (this.isResizing && this.currentSelection) {
                this._performResize(coords);
                this.renderOverlay();
                return;
            }

            if (this.isDragging && this.currentSelection) {
                const x0 = Math.min(this.dragStart.x, coords.x);
                const y0 = Math.min(this.dragStart.y, coords.y);
                const w = Math.abs(coords.x - this.dragStart.x);
                const h = Math.abs(coords.y - this.dragStart.y);

                this.currentSelection.bbox = [x0, y0, w, h];
                this.renderOverlay();
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                if (this.selectionMode === 'HAND') {
                    this.container.style.cursor = 'grab';
                }
            }
            if (this.isDraggingComparison) this.isDraggingComparison = false;

            if (this.isResizing) {
                this.isResizing = false;
                this._finalizeSelection();
            }

            if (this.isDragging) {
                this.isDragging = false;
                if (this.currentSelection && (this.currentSelection.bbox[2] < 5 || this.currentSelection.bbox[3] < 5)) {
                    this.currentSelection = null;
                } else {
                    this._finalizeSelection();
                }
                this.renderOverlay();
            }
        });

        // Wheel: Natural Scroll (Up/Down/Left/Right) & Pinch/Ctrl-Zoom
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();

            // Zoom if Ctrl or Meta key is held (standard browser / trackpad pinch zoom)
            if (e.ctrlKey || e.metaKey) {
                const delta = e.deltaY < 0 ? 1.1 : 0.9;
                const newScale = Math.max(0.15, Math.min(5.0, this.scale * delta));
                this.setZoom(newScale);
            } else {
                // Natural Scrolling
                this.panY -= e.deltaY;
                this.panX -= (e.deltaX || 0);
                this._updateTransform();
            }
        }, { passive: false });
    }

    _finalizeSelection() {
        if (!this.currentSelection) return;
        const [bx, by, bw, bh] = this.currentSelection.bbox;

        // Auto-extract all overlapping words inside the drawn selection box
        const wordsInside = (this.ocrData.words || []).filter(w => {
            const [wx, wy, ww, wh] = w.bbox;
            const overlapX = Math.max(0, Math.min(bx + bw, wx + ww) - Math.max(bx, wx));
            const overlapY = Math.max(0, Math.min(by + bh, wy + wh) - Math.max(by, wy));
            const wordArea = ww * wh;
            return (overlapX * overlapY > 0 && (overlapX > 3 || overlapY > 3));
        });

        // Sort words by Y line, then X column
        wordsInside.sort((a, b) => {
            if (Math.abs(a.bbox[1] - b.bbox[1]) > 8) {
                return a.bbox[1] - b.bbox[1];
            }
            return a.bbox[0] - b.bbox[0];
        });

        if (wordsInside.length > 0) {
            this.currentSelection.text = wordsInside.map(w => w.text).join(' ');
            this.currentSelection.words = wordsInside;
            this.currentSelection.sourceObj = wordsInside[0];

            const minX = Math.min(...wordsInside.map(w => w.bbox[0]));
            const minY = Math.min(...wordsInside.map(w => w.bbox[1]));
            const maxX = Math.max(...wordsInside.map(w => w.bbox[0] + w.bbox[2]));
            const maxY = Math.max(...wordsInside.map(w => w.bbox[1] + w.bbox[3]));
            this.currentSelection.textBbox = [minX, minY, maxX - minX, maxY - minY];
        } else {
            this.currentSelection.text = "";
            this.currentSelection.words = [];
            this.currentSelection.sourceObj = null;
            this.currentSelection.textBbox = [...this.currentSelection.bbox];
        }

        this.onSelectionChanged(this.currentSelection);
    }

    setSelection(bbox, text, type, sourceObj = null) {
        this.currentSelection = {
            bbox: [...bbox],
            textBbox: [...bbox],
            text: text || "",
            type: type || 'BOX',
            sourceObj: sourceObj,
            words: sourceObj ? [sourceObj] : []
        };
        this.renderOverlay();
        this.onSelectionChanged(this.currentSelection);
    }

    clearSelection() {
        this.currentSelection = null;
        this.renderOverlay();
        this.onSelectionChanged(null);
    }

    _findWordAt(x, y) {
        const tol = 3;
        return (this.ocrData.words || []).find(w => {
            const [wx, wy, ww, wh] = w.bbox;
            return x >= wx - tol && x <= wx + ww + tol && y >= wy - tol && y <= wy + wh + tol;
        });
    }

    _findLineAt(x, y) {
        const tol = 4;
        return (this.ocrData.lines || []).find(l => {
            const [lx, ly, lw, lh] = l.bbox;
            return x >= lx - tol && x <= lx + lw + tol && y >= ly - tol && y <= ly + lh + tol;
        });
    }

    _getHandleUnderPoint(x, y, bbox) {
        const [bx, by, bw, bh] = bbox;
        const handleSize = 8 / this.scale;

        const handles = {
            tl: [bx, by],
            tr: [bx + bw, by],
            bl: [bx, by + bh],
            br: [bx + bw, by + bh]
        };

        for (const [key, [hx, hy]] of Object.entries(handles)) {
            if (Math.abs(x - hx) <= handleSize && Math.abs(y - hy) <= handleSize) {
                return key;
            }
        }
        return null;
    }

    _performResize(coords) {
        const [bx, by, bw, bh] = this.currentSelection.bbox;
        let x0 = bx, y0 = by, x1 = bx + bw, y1 = by + bh;

        switch (this.resizeHandle) {
            case 'tl': x0 = coords.x; y0 = coords.y; break;
            case 'tr': x1 = coords.x; y0 = coords.y; break;
            case 'bl': x0 = coords.x; y1 = coords.y; break;
            case 'br': x1 = coords.x; y1 = coords.y; break;
        }

        this.currentSelection.bbox = [
            Math.min(x0, x1),
            Math.min(y0, y1),
            Math.abs(x1 - x0),
            Math.abs(y1 - y0)
        ];
    }

    renderOverlay() {
        this.overlayCtx.clearRect(0, 0, this.docWidth, this.docHeight);

        // Render detected OCR bounding box outlines faintly
        if (this.ocrData && this.ocrData.words) {
            this.overlayCtx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
            this.overlayCtx.lineWidth = 1 / this.scale;
            this.ocrData.words.forEach(w => {
                const [x, y, width, height] = w.bbox;
                this.overlayCtx.strokeRect(x, y, width, height);
            });
        }

        // Render Active Selection
        if (this.currentSelection) {
            const [x, y, w, h] = this.currentSelection.bbox;

            // Highlight box
            this.overlayCtx.fillStyle = 'rgba(37, 99, 235, 0.18)';
            this.overlayCtx.fillRect(x, y, w, h);

            this.overlayCtx.strokeStyle = '#2563eb';
            this.overlayCtx.lineWidth = 2 / this.scale;
            this.overlayCtx.strokeRect(x, y, w, h);

            // Draw Corner Handles
            const hSize = 6 / this.scale;
            this.overlayCtx.fillStyle = '#ffffff';
            this.overlayCtx.strokeStyle = '#2563eb';
            this.overlayCtx.lineWidth = 2 / this.scale;

            const corners = [
                [x, y], [x + w, y], [x, y + h], [x + w, y + h]
            ];

            corners.forEach(([cx, cy]) => {
                this.overlayCtx.fillRect(cx - hSize / 2, cy - hSize / 2, hSize, hSize);
                this.overlayCtx.strokeRect(cx - hSize / 2, cy - hSize / 2, hSize, hSize);
            });
        }
    }

    // Comparison Mode: "Mostra Originale" Split-screen
    toggleComparisonMode(enable) {
        this.isComparisonMode = enable;
        if (enable) {
            this.renderComparisonSplit();
        } else {
            this.renderOverlay();
            this.baseCanvas.style.clipPath = 'none';
        }
    }

    _updateComparisonSplit(clientX) {
        const rect = this.container.getBoundingClientRect();
        this.comparisonSliderX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
        this.renderComparisonSplit();
    }

    renderComparisonSplit() {
        if (!this.isComparisonMode || !this.originalCanvas) return;
        const splitPixelX = this.docWidth * this.comparisonSliderX;

        this.overlayCtx.clearRect(0, 0, this.docWidth, this.docHeight);

        // Draw original on the left slice
        this.overlayCtx.save();
        this.overlayCtx.beginPath();
        this.overlayCtx.rect(0, 0, splitPixelX, this.docHeight);
        this.overlayCtx.clip();
        this.overlayCtx.drawImage(this.originalCanvas, 0, 0);
        this.overlayCtx.restore();

        // Draw Divider Line
        this.overlayCtx.strokeStyle = '#ef4444';
        this.overlayCtx.lineWidth = 2.5 / this.scale;
        this.overlayCtx.beginPath();
        this.overlayCtx.moveTo(splitPixelX, 0);
        this.overlayCtx.lineTo(splitPixelX, this.docHeight);
        this.overlayCtx.stroke();

        // Draw Badge Labels
        this.overlayCtx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        this.overlayCtx.fillRect(splitPixelX - 90 / this.scale, 20 / this.scale, 80 / this.scale, 26 / this.scale);
        this.overlayCtx.fillStyle = '#ffffff';
        this.overlayCtx.font = `bold ${12 / this.scale}px sans-serif`;
        this.overlayCtx.fillText("ORIGINALE", splitPixelX - 82 / this.scale, 38 / this.scale);

        this.overlayCtx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        this.overlayCtx.fillRect(splitPixelX + 10 / this.scale, 20 / this.scale, 95 / this.scale, 26 / this.scale);
        this.overlayCtx.fillStyle = '#ffffff';
        this.overlayCtx.fillText("MODIFICATO", splitPixelX + 16 / this.scale, 38 / this.scale);
    }

    /**
     * Renders a live preview of text replacement directly onto the preview layer,
     * ensuring maximum ink saturation, contrast, and subpixel crispness with zero fading.
     */
    renderLivePreviewDirect(renderingEngine, inpaintingEngine, newText, bbox, options = {}) {
        this.previewCtx.clearRect(0, 0, this.docWidth, this.docHeight);
        if (!newText || !bbox) return;

        const [x, y, w, h] = bbox;
        const pad = 4;
        const ex = Math.max(0, x - pad);
        const ey = Math.max(0, y - pad);

        // 1. Inpaint a clean background patch on the preview layer
        if (inpaintingEngine) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.docWidth;
            tempCanvas.height = this.docHeight;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(this.baseCanvas, 0, 0);

            const patch = inpaintingEngine.inpaintTextArea(tempCanvas, bbox, {
                gridLines: this.ocrData.gridLines,
                safetyMargin: pad
            });

            if (patch) {
                this.previewCtx.putImageData(patch, ex, ey);
            }
        }

        // 2. Directly render text onto the preview canvas for maximum crispness & deep contrast
        renderingEngine.renderTextDirect(this.previewCtx, newText, bbox, options);
    }

    clearPreview() {
        this.previewCtx.clearRect(0, 0, this.docWidth, this.docHeight);
    }
}

if (typeof window !== 'undefined') {
    window.DocumentCanvasEditor = DocumentCanvasEditor;
}
