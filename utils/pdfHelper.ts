
import { jsPDF } from 'jspdf';
import { SchoolProfile } from '../types';

/**
 * Draws the official school letterhead on a jsPDF document.
 * @param doc The jsPDF instance
 * @param profile The school profile data
 * @param orientation 'p' (portrait) or 'l' (landscape)
 * @returns The Y coordinate for the next element
 */
export const drawLetterhead = (doc: jsPDF, profile: SchoolProfile, orientation: 'p' | 'l' = 'p') => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const marginStart = 15;
  const marginEnd = pageWidth - 15;

  // 1. Logo Section
  if (profile.logo) {
    try {
      doc.addImage(profile.logo, 'PNG', marginStart, 10, 25, 25);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  // 2. Header Text Section
  doc.setFont("times", "bold");
  
  // Agency text (e.g., Pemerintah Provinsi)
  doc.setFontSize(11);
  doc.text((profile.agencyName || "").toUpperCase(), centerX, 12, { align: 'center' });
  doc.text((profile.subAgencyName || "").toUpperCase(), centerX, 17, { align: 'center' });
  doc.text((profile.branchAgencyName || "").toUpperCase(), centerX, 22, { align: 'center' });
  
  // School Name
  doc.setFontSize(14);
  doc.text((profile.name || "NAMA SEKOLAH").toUpperCase(), centerX, 29, { align: 'center' });
  
  // Address & Contact Info
  doc.setFontSize(8);
  doc.setFont("times", "italic");
  
  const addressLine = [
    profile.address,
    profile.phone ? `Telp: ${profile.phone}` : null,
    profile.fax ? `Fax: ${profile.fax}` : null
  ].filter(Boolean).join('; ');

  doc.text(addressLine, centerX, 34, { align: 'center' });
  
  const contactLine = [
    profile.email ? `Email: ${profile.email}` : null,
    profile.website ? `Website: ${profile.website}` : null
  ].filter(Boolean).join('; ');
  
  if (contactLine) {
    doc.text(contactLine, centerX, 38, { align: 'center' });
  }

  const lineY = contactLine ? 42 : 40;
  
  // 3. Double Line
  doc.setLineWidth(0.8);
  doc.line(marginStart, lineY, marginEnd, lineY);
  doc.setLineWidth(0.2);
  doc.line(marginStart, lineY + 1, marginEnd, lineY + 1);
  
  return lineY + 10; // Return next content Y position
};
