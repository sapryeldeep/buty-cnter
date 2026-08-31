// Dynamic import for heavy libraries
// Generic Excel Export
export const exportToExcel = async (data: any[], filename: string) => {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Generic PDF Export
export const exportToPDF = async (headers: string[], data: any[][], title: string, filename: string) => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  
  const doc = new jsPDF('p', 'pt');
  
  doc.setFontSize(18);
  doc.text(title, 40, 40);
  
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 60,
    styles: { font: 'helvetica', halign: 'right' },
  });
  
  doc.save(`${filename}.pdf`);
};

// Native Print View (Best for Arabic Support)
export const printElement = (elementId: string, title: string = '') => {
  const content = document.getElementById(elementId);
  if (!content) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f3f4f6; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${title ? `<h2>${title}</h2>` : ''}
        ${content.innerHTML}
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

// Print specific Invoice (فاتورة ضريبية / إيصال كاشير مخصص)
export const printInvoice = (item: any, clinic: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const invSettings = clinic?.invoiceSettings || {};
  const isPos = invSettings.invoiceType === 'pos80';
  const showQr = invSettings.showQrCode !== false;
  const showVat = invSettings.showVat !== false && (invSettings.vatRate || clinic?.vatRate || 0) > 0;
  const vatRate = invSettings.vatRate !== undefined ? invSettings.vatRate : (clinic?.vatRate || 0);
  const pricesIncludeVat = invSettings.pricesIncludeVat !== false; // default true
  
  const rawTotal = item.paid || item.total || 0;
  let subtotal = rawTotal;
  let vatAmount = 0;
  let finalGrandTotal = rawTotal;

  if (showVat && vatRate > 0) {
    if (pricesIncludeVat) {
      subtotal = rawTotal / (1 + (vatRate / 100));
      vatAmount = rawTotal - subtotal;
      finalGrandTotal = rawTotal;
    } else {
      subtotal = rawTotal;
      vatAmount = rawTotal * (vatRate / 100);
      finalGrandTotal = subtotal + vatAmount;
    }
  }

  const invoiceTitle = invSettings.invoiceTitle || (showVat ? 'فاتورة ضريبية مبسطة' : 'فاتورة مبيعات وسند قبض');
  const invoiceSubtitle = invSettings.invoiceSubtitle || clinic?.docName || '';
  const taxId = clinic?.taxId || '';
  const crNumber = invSettings.commercialRegister || clinic?.commercialRegister || '';
  const address = clinic?.invoiceAddress || '';
  const whatsapp = clinic?.whatsappNumber || '';
  const footerMessage = invSettings.invoiceFooter || clinic?.invoiceMessage || 'شكراً لزيارتكم ونتمنى لكم دوام التألق والجمال.';
  const terms = invSettings.invoiceTerms || '';
  
  const qrLabel = invSettings.qrLabel || (invSettings.qrType === 'zatca' ? 'فاتورة إلكترونية معتمدة' : 'امسح الرمز QR');
  const qrPosition = invSettings.qrPosition || 'bottom';

  let qrUrl = '';
  if (showQr) {
    if (invSettings.qrType === 'custom_image' && invSettings.customQrImageUrl) {
      qrUrl = invSettings.customQrImageUrl;
    } else if (invSettings.qrType === 'url' && invSettings.customQrValue) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(invSettings.customQrValue)}`;
    } else {
      const qrData = `${invoiceTitle}
المورد: ${clinic?.name || 'مركز التجميل'}
${taxId ? `الرقم الضريبي: ${taxId}` : ''}
${crNumber ? `السجل التجاري: ${crNumber}` : ''}
رقم الفاتورة: ${item.id}
التاريخ: ${item.isoDate || item.date || new Date().toLocaleDateString('ar-EG')}
الإجمالي: ${finalGrandTotal.toFixed(2)} ${clinic?.currency || 'SAR'}
${showVat ? `الضريبة: ${vatAmount.toFixed(2)}` : ''}
${whatsapp ? `واتساب: ${whatsapp}` : ''}`.trim();
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;
    }
  }

  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <title>${invoiceTitle} - ${item.name || 'عميل'}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { 
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, Arial, sans-serif; 
            color: #1e293b; 
            margin: 0 auto; 
            padding: ${isPos ? '12px' : '36px'};
            max-width: ${isPos ? '340px' : '780px'};
            background: #fff;
            font-size: ${isPos ? '12px' : '14px'};
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: ${isPos ? '1px dashed #94a3b8' : '2px solid #0f172a'}; 
            padding-bottom: ${isPos ? '10px' : '16px'}; 
            margin-bottom: ${isPos ? '12px' : '20px'}; 
          }
          .header img { 
            max-height: ${isPos ? '50px' : '75px'}; 
            max-width: 160px;
            margin-bottom: 8px; 
            object-fit: contain; 
          }
          .header h1 { margin: 0; color: #0f172a; font-size: ${isPos ? '17px' : '22px'}; font-weight: 800; }
          .header h2 { margin: 3px 0; color: #475569; font-size: ${isPos ? '12px' : '14px'}; font-weight: 600; }
          .invoice-badge { 
            display: inline-block; 
            background: #f1f5f9; 
            color: #0f172a; 
            padding: 3px 10px; 
            border-radius: 6px; 
            font-weight: 700; 
            font-size: ${isPos ? '11px' : '13px'}; 
            margin-top: 4px;
            border: 1px solid #e2e8f0;
          }
          
          .info-grid { 
            display: ${isPos ? 'block' : 'flex'}; 
            justify-content: space-between; 
            gap: 12px;
            margin-bottom: ${isPos ? '12px' : '18px'}; 
          }
          .info-box { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0;
            padding: ${isPos ? '8px' : '12px'}; 
            border-radius: 8px; 
            flex: 1; 
            margin-bottom: ${isPos ? '8px' : '0'};
            font-size: ${isPos ? '11px' : '12.5px'};
          }
          .info-box strong { display: block; margin-bottom: 4px; color: #0f172a; font-size: ${isPos ? '11.5px' : '13px'}; }
          .info-line { display: flex; justify-content: space-between; margin-bottom: 2px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: ${isPos ? '6px 4px' : '10px'}; text-align: right; }
          th { background-color: #f1f5f9; color: #1e293b; font-weight: 700; font-size: ${isPos ? '11px' : '13px'}; }
          
          .bottom-section { 
            display: ${isPos ? 'flex; flex-direction: column-reverse; align-items: center;' : 'flex'}; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-top: 15px; 
            border-top: ${isPos ? '1px dashed #94a3b8' : '2px solid #0f172a'}; 
            padding-top: 12px; 
            gap: 15px;
          }
          .qr-code { text-align: center; }
          .qr-code img { 
            width: ${isPos ? '95px' : '115px'}; 
            height: ${isPos ? '95px' : '115px'}; 
            border: 1px solid #e2e8f0; 
            padding: 4px; 
            border-radius: 8px; 
            background: #fff;
          }
          .totals { width: ${isPos ? '100%' : '55%'}; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: ${isPos ? '12px' : '13.5px'}; }
          .totals-row.grand { 
            font-size: ${isPos ? '14px' : '17px'}; 
            font-weight: 800; 
            border-top: 1.5px solid #0f172a; 
            padding-top: 6px; 
            margin-top: 6px;
            color: #0f172a; 
          }
          
          .terms-box {
            margin-top: 14px;
            padding: 8px;
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 6px;
            font-size: 10.5px;
            color: #92400e;
            text-align: center;
          }

          .signatures {
            display: ${isPos ? 'none' : 'flex'};
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
            font-size: 12px;
            color: #64748b;
          }

          .footer { 
            text-align: center; 
            margin-top: 16px; 
            padding-top: 10px; 
            border-top: ${isPos ? '1px dashed #cbd5e1' : '1px solid #e2e8f0'}; 
            font-size: ${isPos ? '10.5px' : '12px'}; 
            color: #64748b; 
          }

          @media print {
            body { padding: 0; }
            @page { margin: ${isPos ? '3mm' : '8mm'}; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${clinic?.logoUrl && invSettings.showClinicLogo !== false ? `<img src="${clinic.logoUrl}" alt="Logo" />` : ''}
          <h1>${clinic?.name || 'مركز التجميل والعناية'}</h1>
          ${invoiceSubtitle ? `<h2>${invoiceSubtitle}</h2>` : ''}
          <div class="invoice-badge">${invoiceTitle}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <strong>بيانات الفاتورة والفرع:</strong>
            <div class="info-line"><span>رقم الفاتورة:</span> <span>#${item.id || Date.now().toString().slice(-6)}</span></div>
            <div class="info-line"><span>التاريخ والوقت:</span> <span>${item.isoDate || item.date || new Date().toLocaleDateString('ar-EG')}</span></div>
            ${taxId ? `<div class="info-line"><span>الرقم الضريبي:</span> <span style="font-family:monospace;font-weight:bold">${taxId}</span></div>` : ''}
            ${crNumber ? `<div class="info-line"><span>السجل التجاري:</span> <span style="font-family:monospace">${crNumber}</span></div>` : ''}
            ${address ? `<div class="info-line"><span>العنوان:</span> <span>${address}</span></div>` : ''}
          </div>
          
          <div class="info-box">
            <strong>بيانات العميل والجلسة:</strong>
            <div class="info-line"><span>اسم العميل:</span> <span style="font-weight:700">${item.name || 'عميل نقدي'}</span></div>
            ${invSettings.showCustomerPhone !== false && item.phone ? `<div class="info-line"><span>رقم الهاتف:</span> <span>${item.phone}</span></div>` : ''}
            ${invSettings.showHandler !== false && item.handler ? `<div class="info-line"><span>الخبير / الأخصائي:</span> <span>${item.handler}</span></div>` : ''}
            ${invSettings.showPaymentMethod !== false ? `<div class="info-line"><span>طريقة الدفع:</span> <span>${item.payMethod || 'نقدي'}</span></div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>الوصف والخدمة</th>
              <th style="width: 30%; text-align: center;">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 600;">${item.service || item.desc || 'خدمة تجميلية / استشارة'}</div>
                ${item.notes ? `<div style="font-size: 11px; color: #64748b;">${item.notes}</div>` : ''}
              </td>
              <td style="text-align: center; font-weight: bold;">
                ${(pricesIncludeVat ? rawTotal : subtotal).toFixed(2)} ${clinic?.currency || 'SAR'}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="bottom-section">
          <div class="totals">
            ${showVat ? `
              <div class="totals-row">
                <span>المبلغ الخاضع للضريبة:</span>
                <span>${subtotal.toFixed(2)} ${clinic?.currency || 'SAR'}</span>
              </div>
              <div class="totals-row">
                <span>ضريبة القيمة المضافة (${vatRate}%):</span>
                <span>${vatAmount.toFixed(2)} ${clinic?.currency || 'SAR'}</span>
              </div>
            ` : ''}
            <div class="totals-row grand">
              <span>الإجمالي المستحق:</span>
              <span>${finalGrandTotal.toFixed(2)} ${clinic?.currency || 'SAR'}</span>
            </div>
            ${item.paid !== undefined ? `
              <div class="totals-row" style="color: #16a34a; font-weight: 600; margin-top: 4px;">
                <span>المدفوع:</span>
                <span>${Number(item.paid).toFixed(2)} ${clinic?.currency || 'SAR'}</span>
              </div>
            ` : ''}
            ${invSettings.showDueBalance !== false && item.due && item.due > 0 ? `
              <div class="totals-row" style="color: #dc2626; font-weight: bold;">
                <span>المتبقي:</span>
                <span>${Number(item.due).toFixed(2)} ${clinic?.currency || 'SAR'}</span>
              </div>
            ` : ''}
          </div>

          ${showQr ? `
            <div class="qr-code">
              <img src="${qrUrl}" alt="QR Code" />
              <div style="font-size: 9.5px; color: #64748b; margin-top: 3px;">${qrLabel}</div>
            </div>
          ` : ''}
        </div>

        ${terms ? `
          <div class="terms-box">
            <strong>الشروط والأحكام:</strong> ${terms}
          </div>
        ` : ''}

        ${invSettings.showSignatureStamp !== false ? `
          <div class="signatures">
            <div>توقيع المستلم / العميل: ....................</div>
            <div>ختم وتوقيع المركز: ....................</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>${footerMessage.replace(/\n/g, '<br/>')}</div>
          ${whatsapp ? `<div style="margin-top: 4px; font-weight: 600;">خدمة العملاء والواتساب: ${whatsapp}</div>` : ''}
        </div>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};


// HTML to PDF Export (Better for Arabic & Styling)
export const exportHTMLToPDF = async (elementId: string, filename: string, clinic: any = null, title: string = 'تقرير') => {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    alert('تعذر العثور على العنصر المراد تصديره');
    return;
  }

  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '850px'; // fixed width for A4 proportion
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '30px';
  container.style.fontFamily = "'Cairo', Arial, sans-serif";
  container.dir = 'rtl';
  
  // Header
  const headerHtml = `
    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
      ${clinic?.logoUrl ? `<img src="${clinic.logoUrl}" style="max-height: 70px; margin-bottom: 10px; object-fit: contain;" />` : ''}
      <h1 style="margin: 0; color: #1e1e1e; font-size: 22px;">${clinic?.name || 'مركز التجميل والعناية'}</h1>
      ${clinic?.docName ? `<h2 style="margin: 4px 0; color: #4f46e5; font-size: 15px;">${clinic.docName}</h2>` : ''}
      <h3 style="margin: 6px 0; color: #111827; font-size: 18px; font-weight: bold;">${title}</h3>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 8px;">
        <span>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
        <span>الرقم الضريبي: ${clinic?.taxId || 'غير مسجل'}</span>
        <span>العملة: ${clinic?.currency || 'SAR'}</span>
      </div>
    </div>
  `;
  
  // Clone the table/content
  const clonedContent = originalElement.cloneNode(true) as HTMLElement;
  
  // Clean up any "no-print" elements in the clone
  const noPrintElements = clonedContent.querySelectorAll('.no-print');
  noPrintElements.forEach(el => el.remove());
  
  // Append all to container
  container.innerHTML = headerHtml;
  container.appendChild(clonedContent);

  // Footer note
  const footerEl = document.createElement('div');
  footerEl.style.marginTop = '30px';
  footerEl.style.borderTop = '1px solid #e2e8f0';
  footerEl.style.paddingTop = '15px';
  footerEl.style.display = 'flex';
  footerEl.style.justifyContent = 'space-between';
  footerEl.style.fontSize = '11px';
  footerEl.style.color = '#94a3b8';
  footerEl.innerHTML = `
    <span>تم استخراج هذا التقرير آلياً عبر نظام إدارة المراكز</span>
    <span>توقيع المحاسب / الإدارة: ................................</span>
  `;
  container.appendChild(footerEl);

  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('حدث خطأ أثناء تصدير ملف PDF، يمكنك استخدام خيار الطباعة العادي للحفظ بصيغة PDF');
  } finally {
    document.body.removeChild(container);
  }
};

// Professional Report Printer with Header & Branding
export const printReport = (title: string, tableHtml: string, clinic: any, summaryHtml: string = '') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8"/>
        <title>${title} - ${clinic?.name || 'المركز'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { 
            font-family: 'Cairo', Arial, sans-serif; 
            padding: 30px; 
            color: #1e293b; 
            margin: 0;
            background: #fff;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .clinic-brand h1 {
            margin: 0;
            color: #1e293b;
            font-size: 22px;
            font-weight: 800;
          }
          .clinic-brand h3 {
            margin: 4px 0 0 0;
            color: #4f46e5;
            font-size: 14px;
          }
          .clinic-meta {
            text-align: left;
            font-size: 12px;
            color: #64748b;
          }
          .report-title-bar {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .report-title-bar h2 {
            margin: 0;
            font-size: 16px;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 13px;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            padding: 10px;
            border: 1px solid #cbd5e1;
            text-align: right;
            font-weight: 700;
          }
          td {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            text-align: right;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .summary-box {
            margin-top: 25px;
            padding: 15px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            display: flex;
            justify-content: space-around;
            text-align: center;
          }
          .summary-item .label {
            font-size: 12px;
            color: #166534;
            margin-bottom: 4px;
          }
          .summary-item .value {
            font-size: 18px;
            font-weight: 800;
            color: #14532d;
          }
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
          }
          .no-print { display: none !important; }
          @media print {
            body { padding: 10px; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="clinic-brand">
            <h1>${clinic?.name || 'مركز التجميل والعناية'}</h1>
            <h3>${clinic?.docName ? 'بإشراف: ' + clinic.docName : 'النظام المالي والمحاسبي'}</h3>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${clinic?.invoiceAddress || ''}</div>
          </div>
          <div class="clinic-meta">
            <div><strong>الرقم الضريبي:</strong> ${clinic?.taxId || 'غير محدد'}</div>
            <div><strong>هاتف:</strong> ${clinic?.whatsappNumber || '--'}</div>
            <div><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div class="report-title-bar">
          <h2>${title}</h2>
          <span style="font-size: 12px; color: #64748b;">العملة: <strong>${clinic?.currency || 'SAR'}</strong></span>
        </div>

        ${summaryHtml ? `<div class="summary-box">${summaryHtml}</div>` : ''}

        ${tableHtml}

        <div class="footer">
          <div>توقيع الموظف المسؤول: ..............................</div>
          <div>ختم واعتماد الإدارة: ..............................</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
};

// Print Individual Employee Payslip
export const printPaySlip = (staff: any, payroll: any, clinic: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const currency = clinic?.currency || 'SAR';
  const basic = staff.salary || staff.basic || 0;
  const commission = payroll.commission || 0;
  const bonus = payroll.bonus || 0;
  const deduction = payroll.deductions || 0;
  const advances = payroll.advances || 0;
  const net = basic + commission + bonus - deduction - advances;

  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8"/>
        <title>قسيمة راتب - ${staff.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; max-width: 700px; margin: 0 auto; }
          .payslip-card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; color: #1e293b; }
          .header h4 { margin: 5px 0 0; color: #4f46e5; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          th, td { padding: 10px; border: 1px solid #cbd5e1; text-align: right; }
          th { background: #f1f5f9; font-weight: 700; }
          .net-box { background: #e0e7ff; border: 1px solid #818cf8; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 800; color: #3730a3; margin-top: 15px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="payslip-card">
          <div class="header">
            <h2>${clinic?.name || 'مركز التجميل'}</h2>
            <h4>قسيمة استلام راتب ومستحقات مالية</h4>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">عن شهر: ${new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</div>
          </div>

          <div class="meta-grid">
            <div><strong>اسم الموظف:</strong> ${staff.name}</div>
            <div><strong>المسمى الوظيفي:</strong> ${staff.role || 'خبير / موظف'}</div>
            <div><strong>رقم الهاتف:</strong> ${staff.phone || '--'}</div>
            <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>بند الاستحقاق / الاستقطاع</th>
                <th>المبلغ (${currency})</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>الراتب الأساسي</td>
                <td>${basic.toLocaleString()}</td>
                <td>الراتب التعاقدي الشهري</td>
              </tr>
              <tr>
                <td>حوافز وعمولات الجلسات</td>
                <td style="color: #16a34a;">+${commission.toLocaleString()}</td>
                <td>عن إنجاز ${payroll.completedSessions || 0} جلسة</td>
              </tr>
              ${bonus > 0 ? `
              <tr>
                <td>مكافآت إضافية</td>
                <td style="color: #16a34a;">+${bonus.toLocaleString()}</td>
                <td>مكافأة تشجيعية</td>
              </tr>` : ''}
              ${deduction > 0 ? `
              <tr>
                <td>استقطاعات وخصومات</td>
                <td style="color: #dc2626;">-${deduction.toLocaleString()}</td>
                <td>جزاءات / غياب</td>
              </tr>` : ''}
              ${advances > 0 ? `
              <tr>
                <td>سلف مستردة</td>
                <td style="color: #dc2626;">-${advances.toLocaleString()}</td>
                <td>سداد سلفة سابقة</td>
              </tr>` : ''}
            </tbody>
          </table>

          <div class="net-box">
            الصافي المستحق للصرف: ${net.toLocaleString()} ${currency}
          </div>

          <div class="signatures">
            <div>توقيع واستلام الموظف: ........................</div>
            <div>اعتماد المدير المالي: ........................</div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
};

// Print Individual Customer Statement (كشف حساب عميل)
export const printCustomerStatement = (patient: any, visits: any[], clinic: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const currency = clinic?.currency || 'SAR';
  const total = patient.total || 0;
  const paid = patient.paid || 0;
  const due = Math.max(0, total - paid);

  const rows = visits.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${v.isoDate || v.date}</td>
      <td>${v.service || '--'}</td>
      <td>${v.handler || '--'}</td>
      <td>${v.payMethod || 'نقدي'}</td>
      <td>${v.total || 0} ${currency}</td>
      <td style="color: #16a34a; font-weight: bold;">${v.paid || 0} ${currency}</td>
      <td style="color: #dc2626; font-weight: bold;">${(v.total || 0) - (v.paid || 0)} ${currency}</td>
    </tr>
  `).join('');

  const html = `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8"/>
        <title>كشف حساب عميل - ${patient.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 30px; color: #1e293b; max-width: 900px; margin: 0 auto; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .header h2 { margin: 0; color: #1e293b; }
          .header h4 { margin: 4px 0 0; color: #4f46e5; }
          .info-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
          .card .val { font-size: 18px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { padding: 9px; border: 1px solid #cbd5e1; text-align: right; }
          th { background: #f1f5f9; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>${clinic?.name || 'مركز التجميل والعناية'}</h2>
            <h4>كشف حساب وتاريخ زيارات العميل</h4>
          </div>
          <div style="text-align: left; font-size: 12px; color: #64748b;">
            <div>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</div>
            <div>هاتف المركز: ${clinic?.whatsappNumber || '--'}</div>
          </div>
        </div>

        <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between;">
          <div><strong>اسم العميل:</strong> ${patient.name}</div>
          <div><strong>رقم الهاتف:</strong> ${patient.phone || '--'}</div>
          <div><strong>نقاط الولاء:</strong> ${patient.points || 0} نقطة</div>
        </div>

        <div class="info-cards">
          <div class="card">
            <div style="font-size: 12px; color: #64748b;">عدد الزيارات</div>
            <div class="val text-indigo-600">${visits.length}</div>
          </div>
          <div class="card">
            <div style="font-size: 12px; color: #64748b;">إجمالي الخدمات</div>
            <div class="val">${total.toLocaleString()} ${currency}</div>
          </div>
          <div class="card">
            <div style="font-size: 12px; color: #166534;">إجمالي المسدد</div>
            <div class="val text-green-600">${paid.toLocaleString()} ${currency}</div>
          </div>
          <div class="card" style="background: ${due > 0 ? '#fef2f2' : '#f0fdf4'}; border-color: ${due > 0 ? '#fecaca' : '#bbf7d0'};">
            <div style="font-size: 12px; color: ${due > 0 ? '#991b1b' : '#166534'};">الرصيد المتبقي (الآجل)</div>
            <div class="val" style="color: ${due > 0 ? '#dc2626' : '#16a34a'};">${due.toLocaleString()} ${currency}</div>
          </div>
        </div>

        <h3 style="font-size: 15px; margin: 20px 0 10px 0; color: #334155;">تفاصيل الفواتير والخدمات السابقة:</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>التاريخ</th>
              <th>الخدمة المقدمة</th>
              <th>المنفذ</th>
              <th>طريقة الدفع</th>
              <th>المطلوب</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">لا توجد سجلات زيارات سابقة لهذا العميل</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>توقيع قسم الحسابات: ........................</div>
          <div>ختم المركز: ........................</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
};

