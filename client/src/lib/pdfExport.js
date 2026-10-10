/**
 * PDF Export Module using pdf-lib + @pdf-lib/fontkit and Canvas Fallback for Tamil
 */

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/**
 * Render a Tamil form summary to a canvas and export as high-res PNG image.
 * This guarantees 100% perfect Tamil glyph rendering on any PDF viewer.
 */
export async function renderFormSummaryToCanvas(formTitle, fields, formValues, isPrivacyExport = false) {
  const canvas = document.createElement('canvas');
  const width = 1240; // High resolution A4 width (300 DPI approx)
  const lineSpacing = 65;
  const padding = 80;

  const totalLines = 5 + fields.length * 2;
  const height = Math.max(1754, padding * 2 + totalLines * lineSpacing);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Header Banner
  ctx.fillStyle = '#1646A2';
  ctx.fillRect(0, 0, width, 180);

  // App Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('குரல் படிவம் — Kural Padivam', padding, 75);

  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText('Voice-Powered Form Assistant | குரல் வழி படிவ சான்றிதழ்', padding, 125);

  // Form Title Section
  ctx.fillStyle = '#172033';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`படிவம்: ${formTitle}`, padding, 260);

  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#5B6475';
  const exportTypeStr = isPrivacyExport ? 'தனியுரிமைப் பாதுகாப்பு அறிக்கை (மறைக்கப்பட்ட விவரங்கள்)' : 'முழுமையான படிவ நகல்';
  const dateStr = new Date().toLocaleDateString('ta-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  ctx.fillText(`வகை: ${exportTypeStr} | உருவாக்கப்பட்டது: ${dateStr}`, padding, 305);

  // Divider Line
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, 335);
  ctx.lineTo(width - padding, 335);
  ctx.stroke();

  // Draw Field Entries
  let currentY = 400;

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    let val = formValues[field.id] || formValues[field.name] || '—';

    // Handle privacy export
    if (field.isSensitive) {
      if (isPrivacyExport) {
        val = '[தனியுரிமை பாதுகாப்பு காரணமாக தவிர்க்கப்பட்டது]';
      }
    }

    // Label
    ctx.fillStyle = '#1646A2';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${i + 1}. ${field.labelTa || field.label} (${field.labelEn || ''})`, padding, currentY);

    // Value Box
    currentY += 40;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.fillRect(padding, currentY - 30, width - padding * 2, 50);
    ctx.strokeRect(padding, currentY - 30, width - padding * 2, 50);

    ctx.fillStyle = field.isSensitive && isPrivacyExport ? '#B45309' : '#172033';
    ctx.font = '22px sans-serif';
    ctx.fillText(String(val), padding + 20, currentY + 4);

    currentY += 75;
  }

  // Footer Disclaimer
  currentY = Math.max(currentY + 40, height - 120);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(padding, currentY);
  ctx.lineTo(width - padding, currentY);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '18px sans-serif';
  ctx.fillText('குரல் படிவம் செயலி மூலம் உருவாக்கப்பட்ட சான்றளிக்கப்பட்ட வடிவம்.', padding, currentY + 40);
  ctx.fillText('Kural Padivam — Secured Voice Form Assistant', padding, currentY + 70);

  return canvas.toDataURL('image/png');
}

/**
 * Generate PDF document as Uint8Array
 */
export async function exportFormToPDF(formTitle, fields, formValues, isPrivacyExport = false) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Generate high-resolution summary page image
  const dataUrl = await renderFormSummaryToCanvas(formTitle, fields, formValues, isPrivacyExport);
  const imageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());

  const image = await pdfDoc.embedPng(imageBytes);

  // Add page with standard A4 dimensions (595.28 x 841.89 pt)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Draw rendered image onto PDF page
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: width,
    height: height
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Download generated PDF to browser
 */
export function downloadPDF(pdfBytes, filename = 'kural_padivam_form.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
