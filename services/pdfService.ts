
import { ProductionOrder, DailyLog, Employee } from "../types";

// Helper to get manager name (normally would pass as arg or fetch)
const getManagerName = (id: string): string => {
    // In a real PDF generator this would be fetched. 
    // For this browser print hack, we rely on what we have or a placeholder.
    return "Gerente ID: " + id;
}

export const printOrder = (order: ProductionOrder, managerName?: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const articlesHtml = order.articles && order.articles.length > 0 
        ? order.articles.map(art => `
            <tr>
                <td>
                    <strong>${art.name}</strong><br>
                    <small>${art.description}</small>
                </td>
                <td style="text-align: center;">${art.quantity}</td>
                <td>
                   ${art.photos.length} Fotos<br>
                   ${art.pdfs.length} Docs
                </td>
            </tr>
          `).join('')
        : `<tr><td colspan="3">Cantidad Genérica: ${order.materials?.length || 0} items (Modo Legado)</td></tr>`;

    // Logic to build the specific attachments appendix
    const hasAttachments = order.articles?.some(a => a.photos.length > 0 || a.pdfs.length > 0);
    
    const attachmentsHtml = hasAttachments 
        ? order.articles.map((art, index) => {
            if (art.photos.length === 0 && art.pdfs.length === 0) return '';
            
            const photosList = art.photos.map((p, i) => `
                <div class="file-badge photo">
                    <span>📷 Img_${i + 1}.jpg</span>
                </div>
            `).join('');

            const pdfsList = art.pdfs.map((p, i) => `
                <div class="file-badge pdf">
                    <span>📄 Doc_Tecnico_${i + 1}.pdf</span>
                </div>
            `).join('');

            return `
                <div class="attachment-box">
                    <div class="attachment-header">
                        <span class="att-index">#${index + 1}</span> 
                        ${art.name}
                        <span style="float:right; font-weight:normal; font-size:10px; color:#64748b;">ID: ${art.id.substring(0,8)}</span>
                    </div>
                    <div class="attachment-content">
                        ${art.photos.length > 0 ? `
                            <div class="file-section">
                                <div class="fs-title">Fotografías de Referencia</div>
                                <div class="badges-container">${photosList}</div>
                            </div>
                        ` : ''}
                        
                        ${art.pdfs.length > 0 ? `
                            <div class="file-section">
                                <div class="fs-title">Documentación Técnica y Planos</div>
                                <div class="badges-container">${pdfsList}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('')
        : '<div class="no-attachments">No hay archivos adjuntos registrados en esta orden.</div>';

    const html = `
        <html>
        <head>
            <title>Orden de Producción ${order.orderNumber}</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 30px; color: #333; font-size: 12px; -webkit-print-color-adjust: exact; }
                
                /* Layout Utility */
                .page-break { page-break-before: always; display: block; height: 1px; border-top: 1px dashed #ccc; margin: 30px 0; }
                
                /* Header */
                .header-container { border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
                .brand { font-size: 24px; font-weight: bold; color: #1e3a8a; }
                .order-id { font-size: 18px; color: #64748b; }
                
                /* Info Grid */
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .info-box { background: #f8fafc; padding: 15px; border-radius: 5px; border: 1px solid #e2e8f0; }
                .label { font-weight: bold; color: #475569; display: block; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
                .value { font-size: 14px; font-weight: 500; }

                /* Tables */
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
                th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                th { background-color: #e2e8f0; text-transform: uppercase; font-size: 11px; }
                
                /* Signatures */
                .signatures { display: flex; justify-content: space-between; margin-top: 60px; margin-bottom: 20px; }
                .sig-box { width: 40%; border-top: 1px solid #333; padding-top: 10px; text-align: center; }

                /* Attachments Section Styling */
                h3.section-title { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
                
                .attachment-box { border: 1px solid #cbd5e1; margin-bottom: 20px; border-radius: 6px; overflow: hidden; break-inside: avoid; }
                .attachment-header { background: #f1f5f9; padding: 10px 15px; border-bottom: 1px solid #cbd5e1; font-weight: bold; font-size: 13px; }
                .att-index { background: #1e3a8a; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 8px; font-size: 11px; }
                .attachment-content { padding: 15px; }
                
                .file-section { margin-bottom: 15px; }
                .file-section:last-child { margin-bottom: 0; }
                .fs-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px; }
                
                .badges-container { display: flex; flex-wrap: wrap; gap: 8px; }
                .file-badge { display: flex; items-center; border: 1px solid #ccc; border-radius: 4px; padding: 6px 10px; font-size: 12px; background: white; }
                .file-badge.photo { border-left: 4px solid #3b82f6; }
                .file-badge.pdf { border-left: 4px solid #ef4444; }

                .no-attachments { text-align: center; padding: 40px; color: #94a3b8; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; }

                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .page-break { page-break-before: always; border: none; margin: 0; }
                    .attachment-box { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <!-- Page 1: Order Details -->
            <div class="header-container">
                <div class="brand">ProControl Industrial</div>
                <div class="order-id">${order.orderNumber}</div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <span class="label">Proyecto / Cliente</span>
                    <div class="value">${order.projectName}</div>
                    <small>${order.client}</small>
                </div>
                <div class="info-box">
                    <span class="label">Encargado de Producción</span>
                    <div class="value">${managerName || order.managerId || 'No asignado'}</div>
                </div>
                <div class="info-box">
                    <span class="label">Fechas</span>
                    <div class="value"><strong>Recepción:</strong> ${order.receptionDate || 'N/A'}</div>
                    <div class="value"><strong>Entrega Est.:</strong> ${order.dueDate}</div>
                </div>
                 <div class="info-box">
                    <span class="label">Estado Actual</span>
                    <div class="value" style="text-transform: uppercase;">${order.status}</div>
                </div>
            </div>

            <h3>Lista de Artículos a Producir</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 60%">Descripción</th>
                        <th style="width: 20%; text-align: center;">Cantidad</th>
                        <th style="width: 20%">Resumen Adjuntos</th>
                    </tr>
                </thead>
                <tbody>
                    ${articlesHtml}
                </tbody>
            </table>

            <h3>Bitácora de Procesos</h3>
            <table>
                <thead>
                    <tr>
                        <th>Proceso</th>
                        <th>Estado</th>
                        <th>Notas</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.processes.map(p => `
                        <tr>
                            <td>${p.type}</td>
                            <td>${p.status}</td>
                            <td>${p.notes || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="signatures">
                <div class="sig-box">
                    <p>Firma Encargado Producción</p>
                </div>
                <div class="sig-box">
                    <p>Firma Control Calidad</p>
                </div>
            </div>

            <!-- Page 2: Attachments Appendix -->
            <div class="page-break"></div>

            <h3 class="section-title">Anexo: Archivos Adjuntos y Documentación</h3>
            <p style="color: #64748b; font-size: 11px; margin-bottom: 20px;">
                Listado detallado de referencias visuales y especificaciones técnicas asociadas a los artículos de esta orden.
            </p>
            
            ${attachmentsHtml}
            
            <div style="margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8;">
                Generado digitalmente por ProControl Industrial el ${new Date().toLocaleString()}
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
};

export const printDailyLog = (log: DailyLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
        <html>
        <head>
            <title>Bitácora Diaria ${log.date}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #1e40af; }
                .section { margin-bottom: 20px; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
                label { font-weight: bold; display: block; margin-bottom: 5px; }
            </style>
        </head>
        <body>
            <h1>Reporte Diario de Producción</h1>
            <p><strong>Fecha:</strong> ${log.date} | <strong>Turno:</strong> ${log.shift}</p>
            <p><strong>Supervisor:</strong> ${log.supervisor}</p>
            
            <div class="section">
                <label>Resumen de Avance:</label>
                <p>${log.progressSummary}</p>
            </div>

            <div class="section">
                <label>Incidencias:</label>
                <p>${log.incidents || 'Sin incidencias'}</p>
            </div>

            <div class="section">
                <label>Personal Ausente:</label>
                <p>${log.absenteeism.length > 0 ? log.absenteeism.join(', ') : 'Asistencia completa'}</p>
            </div>

            <div class="section">
                <label>Indicadores:</label>
                <p>Eficiencia: ${log.efficiency}%</p>
                <p>Piezas producidas: ${log.productionCount}</p>
            </div>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
};
