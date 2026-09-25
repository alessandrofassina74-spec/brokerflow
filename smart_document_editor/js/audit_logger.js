/**
 * SMART DOCUMENT EDITOR — Audit Trail & Version Control Engine
 * 
 * Manages immutable document version history, undo/redo state stacks,
 * cryptographic-style provenance records, and diff tracking.
 */

class DocumentAuditLogger {
    constructor(documentId) {
        this.documentId = documentId || `doc_${Date.now()}`;
        this.versions = []; // Array of VersionNode
        this.currentVersionIndex = -1;
        this.maxHistory = 50;
    }

    /**
     * Initializes version 1 (Original document snapshot).
     */
    initOriginal(canvasSnapshot) {
        this.versions = [];
        this.currentVersionIndex = -1;

        const originalNode = {
            versionNumber: 1,
            label: "Originale",
            timestamp: new Date().toISOString(),
            user: "Operatore",
            operation: "DOCUMENT_IMPORT",
            target: null,
            canvasSnapshot: this._cloneCanvas(canvasSnapshot),
            provenanceHash: this._computeSimpleHash(`ORIGINAL_${this.documentId}_${Date.now()}`)
        };

        this.versions.push(originalNode);
        this.currentVersionIndex = 0;
        console.log(`[Audit Logger] Version 1 (Original) initialized for ${this.documentId}`);
        return originalNode;
    }

    /**
     * Records a new edit operation and creates a new version node.
     */
    recordEdit(operationData, canvasSnapshot) {
        // Truncate any redo history if we are in the middle of the stack
        if (this.currentVersionIndex < this.versions.length - 1) {
            this.versions = this.versions.slice(0, this.currentVersionIndex + 1);
        }

        const newVersionNumber = this.versions.length + 1;
        const parentHash = this.versions[this.currentVersionIndex].provenanceHash;

        const versionNode = {
            versionNumber: newVersionNumber,
            label: `Modifica ${newVersionNumber - 1}`,
            timestamp: new Date().toISOString(),
            user: operationData.user || "Operatore",
            operation: operationData.type || "TEXT_REPLACE",
            target: {
                page: operationData.page || 1,
                bbox: operationData.bbox,
                originalText: operationData.originalText,
                newText: operationData.newText,
                fittingMode: operationData.fittingMode || "MAINTAIN_SIZE",
                glyphsUsed: operationData.glyphsUsed || []
            },
            canvasSnapshot: this._cloneCanvas(canvasSnapshot),
            parentHash: parentHash,
            provenanceHash: this._computeSimpleHash(`${parentHash}_V${newVersionNumber}_${JSON.stringify(operationData.bbox)}_${Date.now()}`)
        };

        this.versions.push(versionNode);
        this.currentVersionIndex = this.versions.length - 1;

        console.log(`[Audit Logger] Recorded Version ${newVersionNumber}:`, versionNode);
        return versionNode;
    }

    /**
     * Undo operation.
     */
    undo() {
        if (this.canUndo()) {
            this.currentVersionIndex--;
            return this.versions[this.currentVersionIndex];
        }
        return null;
    }

    /**
     * Redo operation.
     */
    redo() {
        if (this.canRedo()) {
            this.currentVersionIndex++;
            return this.versions[this.currentVersionIndex];
        }
        return null;
    }

    canUndo() {
        return this.currentVersionIndex > 0;
    }

    canRedo() {
        return this.currentVersionIndex < this.versions.length - 1;
    }

    getCurrentVersion() {
        return this.versions[this.currentVersionIndex] || null;
    }

    getOriginalVersion() {
        return this.versions[0] || null;
    }

    /**
     * Returns full audit trail history summary.
     */
    getHistory() {
        return this.versions.map((v, idx) => ({
            versionNumber: v.versionNumber,
            label: v.label,
            timestamp: v.timestamp,
            user: v.user,
            operation: v.operation,
            target: v.target,
            provenanceHash: v.provenanceHash,
            isCurrent: idx === this.currentVersionIndex
        }));
    }

    _cloneCanvas(sourceCanvas) {
        const copy = document.createElement('canvas');
        copy.width = sourceCanvas.width;
        copy.height = sourceCanvas.height;
        const ctx = copy.getContext('2d');
        ctx.drawImage(sourceCanvas, 0, 0);
        return copy;
    }

    _computeSimpleHash(inputStr) {
        let hash = 0;
        for (let i = 0; i < inputStr.length; i++) {
            const char = inputStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        return `0x${hex}${Math.random().toString(16).substr(2, 8)}`;
    }
}

if (typeof window !== 'undefined') {
    window.DocumentAuditLogger = DocumentAuditLogger;
}
