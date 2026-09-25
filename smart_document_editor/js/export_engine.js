/**
 * SMART DOCUMENT EDITOR — Export Engine
 * 
 * Generates high-fidelity PNG/JPG exports with optional audit watermark & metadata.
 */

class DocumentExportEngine {
    /**
     * Downloads the rendered document as high-resolution PNG.
     * @param {HTMLCanvasElement} canvas
     * @param {string} filename
     * @param {Object} auditTrail Optional audit trail data to embed in download
     */
    static exportPNG(canvas, filename = 'documento_modificato.png', auditTrail = null) {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log(`[Export Engine] Document exported as PNG: ${filename}`);
        }, 'image/png', 1.0);
    }

    /**
     * Exports the cryptographic audit log as a JSON file.
     */
    static exportAuditLogJSON(auditHistory, documentId) {
        const payload = {
            documentId: documentId,
            exportedAt: new Date().toISOString(),
            totalVersions: auditHistory.length,
            history: auditHistory
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${documentId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

if (typeof window !== 'undefined') {
    window.DocumentExportEngine = DocumentExportEngine;
}
