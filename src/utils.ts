import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const downloadAsPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    // We add a short timeout to let the UI finish rendering the report/planner before capturing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Function to exclude elements we don't want in the PDF (e.g. buttons)
    const filterNodes = (node: HTMLElement) => {
      if (node.tagName?.toLowerCase() === 'button' || (node.classList && node.classList.contains('print:hidden'))) {
        return false;
      }
      return true;
    };

    // toPng uses native browser rendering via SVG foreignObject, which supports modern CSS like oklch
    const dataUrl = await toPng(element, { 
      cacheBust: true, 
      pixelRatio: 2,
      backgroundColor: '#ffffff', // Clean white background
      filter: filterNodes as any
    });
    
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => img.onload = resolve);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const margin = 12;
    const headerHeight = 22; // Space for header
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (img.height * contentWidth) / img.width;
    
    let heightLeft = contentHeight;
    let position = 0; // The Y offset of the top of the image
    let currentY = margin + headerHeight; 
    const pageContentHeight = pageHeight - currentY - margin; // Space available for content per page
    
    const drawPageChrome = () => {
      // White top area to clear image bleed
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, currentY, 'F'); // Mask header area
      
      // White bottom area to clear image bleed
      pdf.rect(0, pageHeight - margin, pdfWidth, margin, 'F'); // Mask footer area
      
      // White left and right area (just in case)
      pdf.rect(0, 0, margin, pageHeight, 'F');
      pdf.rect(pdfWidth - margin, 0, margin, pageHeight, 'F');
      
      // Draw border
      pdf.setDrawColor(78, 205, 196); // Teal border
      pdf.setLineWidth(0.5);
      pdf.rect(margin/2, margin/2, pdfWidth - margin, pageHeight - margin);
      
      // Draw Header Text
      pdf.setFontSize(18);
      pdf.setTextColor(255, 107, 107); // #FF6B6B
      pdf.setFont("helvetica", "bold");
      pdf.text('Chef Nutri-Kid | NutriPeds AI', margin, margin + 8);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");
      pdf.text('Pediatric Health & Nutritional Plan', margin, margin + 14);
      
      // Draw line below header
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.line(margin, margin + 18, pdfWidth - margin, margin + 18);
    };

    // First page
    pdf.addImage(dataUrl, 'PNG', margin, currentY, contentWidth, contentHeight);
    drawPageChrome(); 
    
    heightLeft -= pageContentHeight;
    
    while (heightLeft > 0) {
      pdf.addPage();
      position -= pageContentHeight;
      pdf.addImage(dataUrl, 'PNG', margin, currentY + position, contentWidth, contentHeight);
      drawPageChrome();
      heightLeft -= pageContentHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Oops! Could not generate PDF. Please try again.');
  }
};
