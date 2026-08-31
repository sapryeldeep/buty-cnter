import re

with open("src/utils/exportUtils.ts", "r") as f:
    content = f.read()

qr_data_old = r"""  const qrData = `المورد: \$\{clinic\?\.name \|\| 'مركز التجميل'\}
\$\{taxId \? `الرقم الضريبي: \$\{taxId\}` : ''\}
\$\{crNumber \? `السجل التجاري: \$\{crNumber\}` : ''\}
التاريخ: \$\{item\.isoDate \|\| item\.date \|\| new Date\(\)\.toLocaleDateString\('ar-EG'\)\}
الإجمالي: \$\{finalGrandTotal\.toFixed\(2\)\} \$\{clinic\?\.currency \|\| 'SAR'\}
\$\{showVat \? `الضريبة: \$\{vatAmount\.toFixed\(2\)\}` : ''\}
\$\{whatsapp \? `واتساب: \$\{whatsapp\}` : ''\}\`\.trim\(\);"""

qr_data_new = """  const qrData = `${invoiceTitle}
المورد: ${clinic?.name || 'مركز التجميل'}
${taxId ? `الرقم الضريبي: ${taxId}` : ''}
${crNumber ? `السجل التجاري: ${crNumber}` : ''}
رقم الفاتورة: ${item.id}
التاريخ: ${item.isoDate || item.date || new Date().toLocaleDateString('ar-EG')}
الإجمالي: ${finalGrandTotal.toFixed(2)} ${clinic?.currency || 'SAR'}
${showVat ? `الضريبة: ${vatAmount.toFixed(2)}` : ''}
${whatsapp ? `واتساب: ${whatsapp}` : ''}`.trim();"""

content = re.sub(qr_data_old, qr_data_new, content)

with open("src/utils/exportUtils.ts", "w") as f:
    f.write(content)
