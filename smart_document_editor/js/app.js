/**
 * SMART DOCUMENT EDITOR — Main Application Controller
 * 
 * Orchestrates UI interactions, document lifecycle, Character Bank inspector,
 * typography editing, live preview, version management, and exports.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Core Engines
    const ocrEngine = new DocumentOCREngine();
    let characterBank = new DocumentCharacterBank("doc_initial");
    const inpaintingEngine = new InpaintingEngine();
    let renderingEngine = new DocumentRenderingEngine(characterBank, inpaintingEngine);
    let auditLogger = new DocumentAuditLogger("doc_initial");

    // 2. DOM Elements
    const canvasContainer = document.getElementById('canvas-container');
    const fileInput = document.getElementById('file-input');
    const btnLoadSample = document.getElementById('btn-load-sample');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    const zoomDisplay = document.getElementById('zoom-display');

    const modeHand = document.getElementById('mode-hand');
    const modeWord = document.getElementById('mode-word');
    const modeLine = document.getElementById('mode-line');
    const modeBox = document.getElementById('mode-box');

    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnCompare = document.getElementById('btn-compare');
    const btnExport = document.getElementById('btn-export');
    const btnExportAudit = document.getElementById('btn-export-audit');

    // Sidebar & Info Elements
    const docNameDisplay = document.getElementById('doc-name');
    const docDimensionsDisplay = document.getElementById('doc-dimensions');
    const ocrWordCountDisplay = document.getElementById('ocr-word-count');
    const charBankCountDisplay = document.getElementById('char-bank-count');
    const noiseLevelDisplay = document.getElementById('noise-level');

    // Text Editor Modal / Dock
    const editorModal = document.getElementById('text-editor-modal');
    const txtOriginal = document.getElementById('txt-original');
    const txtNew = document.getElementById('txt-new');
    const selectFontFamily = document.getElementById('select-font-family');
    const inputInkColor = document.getElementById('input-ink-color');
    const valInkColor = document.getElementById('val-ink-color');
    const selectEdgeMode = document.getElementById('select-edge-mode');
    const selectFittingMode = document.getElementById('select-fitting-mode');
    const sliderCustomSize = document.getElementById('slider-custom-size');
    const valCustomSize = document.getElementById('val-custom-size');
    const btnToggleBold = document.getElementById('btn-toggle-bold');
    const btnToggleItalic = document.getElementById('btn-toggle-italic');
    const sliderRotationAngle = document.getElementById('slider-rotation-angle');
    const valRotationAngle = document.getElementById('val-rotation-angle');
    const btnAutoSkew = document.getElementById('btn-auto-skew');
    const btnPreview = document.getElementById('btn-preview');
    const btnApply = document.getElementById('btn-apply');
    const btnCancel = document.getElementById('btn-cancel');

    // Character Bank Drawer
    const btnOpenBank = document.getElementById('btn-open-bank');
    const bankDrawer = document.getElementById('bank-drawer');
    const btnCloseBank = document.getElementById('btn-close-bank');
    const bankGrid = document.getElementById('bank-grid');

    // History / Audit Drawer
    const btnOpenHistory = document.getElementById('btn-open-history');
    const historyDrawer = document.getElementById('history-drawer');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const historyList = document.getElementById('history-list');

    // Notification toast
    const toast = document.getElementById('toast');

    function showToast(msg, duration = 3000) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    // 3. Initialize Canvas Editor
    const canvasEditor = new DocumentCanvasEditor(canvasContainer, {
        onSelectionChanged: (selection) => {
            if (selection && selection.bbox[2] > 5 && selection.bbox[3] > 5) {
                openEditorForSelection(selection);
            } else {
                closeEditorModal();
            }
        },
        onZoomChanged: (scale) => {
            zoomDisplay.textContent = `${Math.round(scale * 100)}%`;
        },
        onFileDropped: (file) => {
            handleFileUpload(file);
        }
    });

    await ocrEngine.init();

    function handleFileUpload(file) {
        if (!file) return;
        showToast(`Caricamento "${file.name}"...`);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                processDocument(img, file.name);
                fileInput.value = '';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 4. Document Loading Pipeline
    async function processDocument(imageSource, docName = "Scansione_Documento.png") {
        showToast("Riconoscimento OCR e analisi del testo in corso...");

        // Generate clean document ID for strict Character Bank isolation
        const docId = `doc_${Date.now()}`;
        characterBank = new DocumentCharacterBank(docId);
        renderingEngine = new DocumentRenderingEngine(characterBank, inpaintingEngine);
        auditLogger = new DocumentAuditLogger(docId);

        // Load into Canvas
        canvasEditor.loadDocument(imageSource, docId);
        auditLogger.initOriginal(canvasEditor.baseCanvas);

        // Update UI Header
        docNameDisplay.textContent = docName;
        docDimensionsDisplay.textContent = `${canvasEditor.docWidth} × ${canvasEditor.docHeight} px`;

        // Run OCR and Layout Engine
        const ocrData = await ocrEngine.analyze(canvasEditor.baseCanvas);
        canvasEditor.setOCRData(ocrData);

        // Populate Document-Local Character Bank
        characterBank.populateFromOCR(canvasEditor.baseCanvas, ocrData.words);

        // Update Stats
        const overview = characterBank.getBankOverview();
        ocrWordCountDisplay.textContent = ocrData.words.length;
        charBankCountDisplay.textContent = `${overview.totalCharacters} caratteri (${overview.totalSamples} campioni)`;
        noiseLevelDisplay.textContent = `σ = ${overview.noiseProfile.noiseStdDev} px (Lum: ${overview.noiseProfile.meanLuminance})`;

        updateAuditUI();
        updateUndoRedoButtons();
        showToast(`Documento pronto (${ocrData.words.length} parole rilevate). Seleziona un testo per modificarlo.`, 4000);
    }

    function openEditorForSelection(selection) {
        activeSelection = selection;
        txtOriginal.value = selection.text || "";
        txtNew.value = selection.text || "";

        const targetBbox = selection.textBbox || selection.bbox;

        // Perform exact Optical Feature Extraction from the canvas
        const optical = DocumentOCREngine.extractOpticalAttributes(canvasEditor.baseCtx, targetBbox);
        activeSelection.optical = optical;

        const sourceWord = selection.sourceObj || (selection.words && selection.words[0]) || null;
        activeSelection.matchedWord = sourceWord;

        // Extract true original font size, font family, color, and styles
        const trueFontSize = optical.fontSize || sourceWord?.fontSize || 20;
        const isBold = optical.isBold !== undefined ? optical.isBold : (sourceWord?.isBold || false);
        const isItalic = optical.isItalic !== undefined ? optical.isItalic : (sourceWord?.isItalic || false);

        activeSelection.originalFontSize = trueFontSize;
        activeSelection.isBold = isBold;
        activeSelection.isItalic = isItalic;
        
        sliderCustomSize.value = trueFontSize;
        valCustomSize.textContent = `${trueFontSize}px`;
        selectFittingMode.value = "MAINTAIN_SIZE";

        if (selectFontFamily) {
            selectFontFamily.value = optical.fontFamilyKey || 'ARIAL';
        }
        if (inputInkColor) {
            inputInkColor.value = optical.inkColorHex || '#111827';
            if (valInkColor) valInkColor.textContent = optical.inkColorHex || '#111827';
        }

        btnToggleBold.classList.toggle('active', isBold);
        btnToggleItalic.classList.toggle('active', isItalic);

        // Initial rotation angle: strictly 0.0 for straight text
        const initialAngle = (sourceWord && sourceWord.angle !== undefined) ? sourceWord.angle : 0.0;
        sliderRotationAngle.value = initialAngle;
        valRotationAngle.textContent = `${initialAngle > 0 ? '+' : ''}${initialAngle.toFixed(1)}°`;

        // Keep the original text pristine on selection
        canvasEditor.clearPreview();
        btnPreview.classList.remove('active');

        editorModal.classList.add('open');
        txtNew.focus();
        txtNew.select();
    }

    function closeEditorModal() {
        editorModal.classList.remove('open');
        canvasEditor.clearPreview();
        btnPreview.classList.remove('active');
        activeSelection = null;
    }

    if (selectFontFamily) {
        selectFontFamily.addEventListener('change', () => triggerPreview());
    }

    if (inputInkColor) {
        inputInkColor.addEventListener('input', (e) => {
            if (valInkColor) valInkColor.textContent = e.target.value;
            triggerPreview();
        });
    }

    if (selectEdgeMode) {
        selectEdgeMode.addEventListener('change', () => triggerPreview());
    }

    btnToggleBold.addEventListener('click', () => {
        if (!activeSelection) return;
        activeSelection.isBold = !activeSelection.isBold;
        btnToggleBold.classList.toggle('active', activeSelection.isBold);
        triggerPreview();
    });

    btnToggleItalic.addEventListener('click', () => {
        if (!activeSelection) return;
        activeSelection.isItalic = !activeSelection.isItalic;
        btnToggleItalic.classList.toggle('active', activeSelection.isItalic);
        triggerPreview();
    });

    sliderCustomSize.addEventListener('input', (e) => {
        valCustomSize.textContent = `${e.target.value}px`;
        selectFittingMode.value = "MANUAL";
        triggerPreview();
    });

    sliderRotationAngle.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valRotationAngle.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)}°`;
        triggerPreview();
    });

    btnAutoSkew.addEventListener('click', () => {
        if (!activeSelection) return;
        const targetBbox = activeSelection.textBbox || activeSelection.bbox;
        const autoAngle = DocumentOCREngine.estimateSkewAngle(canvasEditor.baseCtx, targetBbox);
        sliderRotationAngle.value = autoAngle;
        valRotationAngle.textContent = `${autoAngle > 0 ? '+' : ''}${autoAngle.toFixed(1)}°`;
        triggerPreview();
    });

    function triggerPreview() {
        if (!activeSelection) return;
        const newText = txtNew.value;

        // If new text is identical to original, keep document pristine
        if (newText === txtOriginal.value) {
            canvasEditor.clearPreview();
            btnPreview.classList.remove('active');
            return;
        }

        const fittingMode = selectFittingMode.value;
        const targetBbox = activeSelection.textBbox || activeSelection.bbox;
        const rotationAngle = parseFloat(sliderRotationAngle.value) || 0;
        const fontFamily = selectFontFamily ? selectFontFamily.value : (activeSelection.optical?.fontFamily || 'ARIAL');
        const inkColor = inputInkColor ? inputInkColor.value : (activeSelection.optical?.inkColorHex || '#111827');
        const edgeMode = selectEdgeMode ? selectEdgeMode.value : 'AUTO';
        const baseline = activeSelection.optical?.baseline;

        canvasEditor.renderLivePreviewDirect(
            renderingEngine,
            inpaintingEngine,
            newText,
            targetBbox,
            {
                originalWord: activeSelection.matchedWord,
                fittingMode: fittingMode,
                customSize: parseInt(sliderCustomSize.value, 10),
                isBold: activeSelection.isBold,
                isItalic: activeSelection.isItalic,
                rotationAngle: rotationAngle,
                fontFamily: fontFamily,
                inkColor: inkColor,
                edgeMode: edgeMode,
                baseline: baseline,
                gridLines: canvasEditor.ocrData.gridLines
            }
        );
        btnPreview.classList.add('active');
    }

    txtNew.addEventListener('input', () => {
        triggerPreview();
    });

    selectFittingMode.addEventListener('change', () => {
        triggerPreview();
    });

    txtNew.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnApply.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            btnCancel.click();
        }
    });

    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) {
                e.preventDefault();
                btnRedo.click();
            } else {
                e.preventDefault();
                btnUndo.click();
            }
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            btnRedo.click();
        } else if (e.key === 'Escape' && editorModal.classList.contains('open')) {
            btnCancel.click();
        }
    });

    btnPreview.addEventListener('click', triggerPreview);

    btnApply.addEventListener('click', () => {
        if (!activeSelection) return;
        const originalText = txtOriginal.value;
        const newText = txtNew.value;
        const fittingMode = selectFittingMode.value;
        const targetBbox = activeSelection.textBbox || activeSelection.bbox;
        const rotationAngle = parseFloat(sliderRotationAngle.value) || 0;
        const fontFamily = selectFontFamily ? selectFontFamily.value : (activeSelection.optical?.fontFamily || 'ARIAL');
        const inkColor = inputInkColor ? inputInkColor.value : (activeSelection.optical?.inkColorHex || '#111827');
        const edgeMode = selectEdgeMode ? selectEdgeMode.value : 'AUTO';
        const baseline = activeSelection.optical?.baseline;

        // Apply Inpainting and Typography Rendering
        const { glyphsUsed } = renderingEngine.applyModification(
            canvasEditor.baseCanvas,
            newText,
            targetBbox,
            {
                originalWord: activeSelection.matchedWord,
                fittingMode: fittingMode,
                customSize: parseInt(sliderCustomSize.value, 10),
                isBold: activeSelection.isBold,
                isItalic: activeSelection.isItalic,
                rotationAngle: rotationAngle,
                fontFamily: fontFamily,
                inkColor: inkColor,
                edgeMode: edgeMode,
                baseline: baseline,
                gridLines: canvasEditor.ocrData.gridLines
            }
        );

        // Record in Audit Trail
        auditLogger.recordEdit({
            type: "TEXT_REPLACE",
            page: 1,
            bbox: targetBbox,
            originalText: originalText,
            newText: newText,
            fittingMode: fittingMode,
            isBold: activeSelection.isBold,
            isItalic: activeSelection.isItalic,
            fontFamily: fontFamily,
            inkColor: inkColor,
            rotationAngle: rotationAngle,
            glyphsUsed: glyphsUsed
        }, canvasEditor.baseCanvas);

        // Refresh Canvas & Close Editor
        canvasEditor.clearPreview();
        canvasEditor.clearSelection();
        closeEditorModal();
        updateUndoRedoButtons();
        updateAuditUI();

        showToast(`Modifica applicata (${newText.length} caratteri).`);
    });

    btnCancel.addEventListener('click', () => {
        closeEditorModal();
        canvasEditor.clearSelection();
    });

    // 6. Mode & Tool Switching
    [modeHand, modeWord, modeLine, modeBox].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            [modeHand, modeWord, modeLine, modeBox].forEach(b => b && b.classList.remove('active'));
            btn.classList.add('active');
            canvasEditor.setSelectionMode(btn.dataset.mode);
        });
    });

    // 7. Zoom Controls
    btnZoomIn.addEventListener('click', () => canvasEditor.setZoom(canvasEditor.scale * 1.2));
    btnZoomOut.addEventListener('click', () => canvasEditor.setZoom(canvasEditor.scale / 1.2));
    btnZoomFit.addEventListener('click', () => canvasEditor.fitToContainer());

    // 8. Undo / Redo
    function updateUndoRedoButtons() {
        btnUndo.disabled = !auditLogger.canUndo();
        btnRedo.disabled = !auditLogger.canRedo();
    }

    btnUndo.addEventListener('click', () => {
        const prevVersion = auditLogger.undo();
        if (prevVersion) {
            canvasEditor.baseCtx.drawImage(prevVersion.canvasSnapshot, 0, 0);
            canvasEditor.renderOverlay();
            updateUndoRedoButtons();
            updateAuditUI();
            showToast(`Annullato: tornato a ${prevVersion.label}`);
        }
    });

    btnRedo.addEventListener('click', () => {
        const nextVersion = auditLogger.redo();
        if (nextVersion) {
            canvasEditor.baseCtx.drawImage(nextVersion.canvasSnapshot, 0, 0);
            canvasEditor.renderOverlay();
            updateUndoRedoButtons();
            updateAuditUI();
            showToast(`Ripristinato: ${nextVersion.label}`);
        }
    });

    // 9. Comparison Mode ("Mostra Originale")
    let isComparing = false;
    btnCompare.addEventListener('click', () => {
        isComparing = !isComparing;
        btnCompare.classList.toggle('active', isComparing);
        canvasEditor.toggleComparisonMode(isComparing);
        if (isComparing) {
            showToast("Modalità Confronto: Trascina lo slider per confrontare con l'originale.");
        }
    });

    // 10. File Upload & Demo Sample
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });

    btnLoadSample.addEventListener('click', () => {
        const sampleCanvas = SampleDocumentGenerator.createScannedInvoiceCanvas();
        processDocument(sampleCanvas, "Estratto_Conto_Bancario_Demo.png");
    });

    // 11. Character Bank Inspector Drawer
    btnOpenBank.addEventListener('click', () => {
        renderCharacterBankDrawer();
        bankDrawer.classList.add('open');
    });

    btnCloseBank.addEventListener('click', () => {
        bankDrawer.classList.remove('open');
    });

    function renderCharacterBankDrawer() {
        bankGrid.innerHTML = '';
        const overview = characterBank.getBankOverview();

        if (overview.overview.length === 0) {
            bankGrid.innerHTML = `<div class="empty-state">Nessun glifo estratto per questo documento.</div>`;
            return;
        }

        overview.overview.forEach(item => {
            const card = document.createElement('div');
            card.className = 'glyph-card';

            const charTitle = document.createElement('div');
            charTitle.className = 'glyph-header';
            charTitle.innerHTML = `<strong>'${item.char}'</strong> <span class="badge">${item.count} varianti</span>`;
            card.appendChild(charTitle);

            const sampleList = document.createElement('div');
            sampleList.className = 'glyph-variants-container';

            const variants = characterBank.glyphMap.get(item.char) || [];
            variants.forEach(sample => {
                const sItem = document.createElement('div');
                sItem.className = 'variant-thumb';

                const imgPreview = document.createElement('img');
                imgPreview.src = sample.canvas.toDataURL();
                imgPreview.title = `ID: ${sample.id} | Spessore: ${sample.strokeWidth}px | Origine: [${sample.x}, ${sample.y}]`;

                const label = document.createElement('span');
                label.textContent = sample.id;

                sItem.appendChild(imgPreview);
                sItem.appendChild(label);
                sampleList.appendChild(sItem);
            });

            card.appendChild(sampleList);
            bankGrid.appendChild(card);
        });
    }

    // 12. History & Audit Drawer
    btnOpenHistory.addEventListener('click', () => {
        renderHistoryDrawer();
        historyDrawer.classList.add('open');
    });

    btnCloseHistory.addEventListener('click', () => {
        historyDrawer.classList.remove('open');
    });

    function updateAuditUI() {
        renderHistoryDrawer();
    }

    function renderHistoryDrawer() {
        historyList.innerHTML = '';
        const history = auditLogger.getHistory();

        history.forEach((v) => {
            const item = document.createElement('div');
            item.className = `history-item ${v.isCurrent ? 'current' : ''}`;

            const timeStr = new Date(v.timestamp).toLocaleTimeString();
            let details = `<em>Documento Originale</em>`;

            if (v.target) {
                details = `
                    <div class="diff-row"><span class="label-old">Orig:</span> "${v.target.originalText}"</div>
                    <div class="diff-row"><span class="label-new">Nuovo:</span> "${v.target.newText}"</div>
                    <div class="meta-row">Fitting: ${v.target.fittingMode} | Glifi: ${v.target.glyphsUsed.length}</div>
                `;
            }

            item.innerHTML = `
                <div class="history-item-header">
                    <span class="version-badge">${v.label}</span>
                    <span class="history-time">${timeStr}</span>
                </div>
                <div class="history-details">${details}</div>
                <div class="history-hash" title="Impronta crittografica di integrità">${v.provenanceHash}</div>
            `;

            historyList.appendChild(item);
        });
    }

    // 13. Export Actions
    btnExport.addEventListener('click', () => {
        DocumentExportEngine.exportPNG(canvasEditor.baseCanvas, `${docNameDisplay.textContent.replace(/\.[^/.]+$/, "")}_modificato.png`);
        showToast("File PNG esportato ad alta risoluzione.");
    });

    btnExportAudit.addEventListener('click', () => {
        DocumentExportEngine.exportAuditLogJSON(auditLogger.getHistory(), characterBank.documentId);
        showToast("Registro di Audit esportato in JSON.");
    });
});
