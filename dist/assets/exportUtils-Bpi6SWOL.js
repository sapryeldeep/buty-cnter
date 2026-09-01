const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./jspdf.es.min-8ucwgutF.js","./index-4UJYYN7s.js","./index-DkGEXOl2.css"])))=>i.map(i=>d[i]);
import{_ as y}from"./index-4UJYYN7s.js";const L=async(d,t)=>{const o=await y(()=>import("./xlsx-CkFp8p6R.js"),[],import.meta.url),e=o.utils.json_to_sheet(d),a=o.utils.book_new();o.utils.book_append_sheet(a,e,"Sheet1"),o.writeFile(a,`${t}.xlsx`)},_=(d,t="")=>{const o=document.getElementById(d);if(!o)return;const e=window.open("","_blank");if(!e)return;const a=`
    <html dir="rtl" lang="ar">
      <head>
        <title>${t}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f3f4f6; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${t?`<h2>${t}</h2>`:""}
        ${o.innerHTML}
      </body>
    </html>
  `;e.document.write(a),e.document.close(),e.focus(),setTimeout(()=>{e.print(),e.close()},500)},R=(d,t)=>{const o=window.open("","_blank");if(!o)return;const e=(t==null?void 0:t.invoiceSettings)||{},a=e.invoiceType==="pos80",s=e.showQrCode!==!1,l=e.showVat!==!1&&(e.vatRate||(t==null?void 0:t.vatRate)||0)>0,p=e.vatRate!==void 0?e.vatRate:(t==null?void 0:t.vatRate)||0,g=e.pricesIncludeVat!==!1,r=d.paid||d.total||0;let n=r,i=0,x=r;l&&p>0&&(g?(n=r/(1+p/100),i=r-n,x=r):(n=r,i=r*(p/100),x=n+i));const u=e.invoiceTitle||(l?"فاتورة ضريبية مبسطة":"فاتورة مبيعات وسند قبض"),m=e.invoiceSubtitle||(t==null?void 0:t.docName)||"",f=(t==null?void 0:t.taxId)||"",b=e.commercialRegister||(t==null?void 0:t.commercialRegister)||"",h=(t==null?void 0:t.invoiceAddress)||"",v=(t==null?void 0:t.whatsappNumber)||"",c=e.invoiceFooter||(t==null?void 0:t.invoiceMessage)||"شكراً لزيارتكم ونتمنى لكم دوام التألق والجمال.",w=e.invoiceTerms||"",z=e.qrLabel||(e.qrType==="zatca"?"فاتورة إلكترونية معتمدة":"امسح الرمز QR");e.qrPosition;let $="";if(s)if(e.qrType==="custom_image"&&e.customQrImageUrl)$=e.customQrImageUrl;else if(e.qrType==="url"&&e.customQrValue)$=`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(e.customQrValue)}`;else{const k=`${u}
المورد: ${(t==null?void 0:t.name)||"مركز التجميل"}
${f?`الرقم الضريبي: ${f}`:""}
${b?`السجل التجاري: ${b}`:""}
رقم الفاتورة: ${d.id}
التاريخ: ${d.isoDate||d.date||new Date().toLocaleDateString("ar-EG")}
الإجمالي: ${x.toFixed(2)} ${(t==null?void 0:t.currency)||"SAR"}
${l?`الضريبة: ${i.toFixed(2)}`:""}
${v?`واتساب: ${v}`:""}`.trim();$=`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(k)}`}const S=`
    <html dir="rtl" lang="ar">
      <head>
        <title>${u} - ${d.name||"عميل"}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { 
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, Arial, sans-serif; 
            color: #1e293b; 
            margin: 0 auto; 
            padding: ${a?"12px":"36px"};
            max-width: ${a?"340px":"780px"};
            background: #fff;
            font-size: ${a?"12px":"14px"};
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: ${a?"1px dashed #94a3b8":"2px solid #0f172a"}; 
            padding-bottom: ${a?"10px":"16px"}; 
            margin-bottom: ${a?"12px":"20px"}; 
          }
          .header img { 
            max-height: ${a?"50px":"75px"}; 
            max-width: 160px;
            margin-bottom: 8px; 
            object-fit: contain; 
          }
          .header h1 { margin: 0; color: #0f172a; font-size: ${a?"17px":"22px"}; font-weight: 800; }
          .header h2 { margin: 3px 0; color: #475569; font-size: ${a?"12px":"14px"}; font-weight: 600; }
          .invoice-badge { 
            display: inline-block; 
            background: #f1f5f9; 
            color: #0f172a; 
            padding: 3px 10px; 
            border-radius: 6px; 
            font-weight: 700; 
            font-size: ${a?"11px":"13px"}; 
            margin-top: 4px;
            border: 1px solid #e2e8f0;
          }
          
          .info-grid { 
            display: ${a?"block":"flex"}; 
            justify-content: space-between; 
            gap: 12px;
            margin-bottom: ${a?"12px":"18px"}; 
          }
          .info-box { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0;
            padding: ${a?"8px":"12px"}; 
            border-radius: 8px; 
            flex: 1; 
            margin-bottom: ${a?"8px":"0"};
            font-size: ${a?"11px":"12.5px"};
          }
          .info-box strong { display: block; margin-bottom: 4px; color: #0f172a; font-size: ${a?"11.5px":"13px"}; }
          .info-line { display: flex; justify-content: space-between; margin-bottom: 2px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: ${a?"6px 4px":"10px"}; text-align: right; }
          th { background-color: #f1f5f9; color: #1e293b; font-weight: 700; font-size: ${a?"11px":"13px"}; }
          
          .bottom-section { 
            display: ${a?"flex; flex-direction: column-reverse; align-items: center;":"flex"}; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-top: 15px; 
            border-top: ${a?"1px dashed #94a3b8":"2px solid #0f172a"}; 
            padding-top: 12px; 
            gap: 15px;
          }
          .qr-code { text-align: center; }
          .qr-code img { 
            width: ${a?"95px":"115px"}; 
            height: ${a?"95px":"115px"}; 
            border: 1px solid #e2e8f0; 
            padding: 4px; 
            border-radius: 8px; 
            background: #fff;
          }
          .totals { width: ${a?"100%":"55%"}; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: ${a?"12px":"13.5px"}; }
          .totals-row.grand { 
            font-size: ${a?"14px":"17px"}; 
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
            display: ${a?"none":"flex"};
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
            border-top: ${a?"1px dashed #cbd5e1":"1px solid #e2e8f0"}; 
            font-size: ${a?"10.5px":"12px"}; 
            color: #64748b; 
          }

          @media print {
            body { padding: 0; }
            @page { margin: ${a?"3mm":"8mm"}; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${t!=null&&t.logoUrl&&e.showClinicLogo!==!1?`<img src="${t.logoUrl}" alt="Logo" />`:""}
          <h1>${(t==null?void 0:t.name)||"مركز التجميل والعناية"}</h1>
          ${m?`<h2>${m}</h2>`:""}
          <div class="invoice-badge">${u}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <strong>بيانات الفاتورة والفرع:</strong>
            <div class="info-line"><span>رقم الفاتورة:</span> <span>#${d.id||Date.now().toString().slice(-6)}</span></div>
            <div class="info-line"><span>التاريخ والوقت:</span> <span>${d.isoDate||d.date||new Date().toLocaleDateString("ar-EG")}</span></div>
            ${f?`<div class="info-line"><span>الرقم الضريبي:</span> <span style="font-family:monospace;font-weight:bold">${f}</span></div>`:""}
            ${b?`<div class="info-line"><span>السجل التجاري:</span> <span style="font-family:monospace">${b}</span></div>`:""}
            ${h?`<div class="info-line"><span>العنوان:</span> <span>${h}</span></div>`:""}
          </div>
          
          <div class="info-box">
            <strong>بيانات العميل والجلسة:</strong>
            <div class="info-line"><span>اسم العميل:</span> <span style="font-weight:700">${d.name||"عميل نقدي"}</span></div>
            ${e.showCustomerPhone!==!1&&d.phone?`<div class="info-line"><span>رقم الهاتف:</span> <span>${d.phone}</span></div>`:""}
            ${e.showHandler!==!1&&d.handler?`<div class="info-line"><span>الخبير / الأخصائي:</span> <span>${d.handler}</span></div>`:""}
            ${e.showPaymentMethod!==!1?`<div class="info-line"><span>طريقة الدفع:</span> <span>${d.payMethod||"نقدي"}</span></div>`:""}
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
                <div style="font-weight: 600;">${d.service||d.desc||"خدمة تجميلية / استشارة"}</div>
                ${d.notes?`<div style="font-size: 11px; color: #64748b;">${d.notes}</div>`:""}
              </td>
              <td style="text-align: center; font-weight: bold;">
                ${(g?r:n).toFixed(2)} ${(t==null?void 0:t.currency)||"SAR"}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="bottom-section">
          <div class="totals">
            ${l?`
              <div class="totals-row">
                <span>المبلغ الخاضع للضريبة:</span>
                <span>${n.toFixed(2)} ${(t==null?void 0:t.currency)||"SAR"}</span>
              </div>
              <div class="totals-row">
                <span>ضريبة القيمة المضافة (${p}%):</span>
                <span>${i.toFixed(2)} ${(t==null?void 0:t.currency)||"SAR"}</span>
              </div>
            `:""}
            <div class="totals-row grand">
              <span>الإجمالي المستحق:</span>
              <span>${x.toFixed(2)} ${(t==null?void 0:t.currency)||"SAR"}</span>
            </div>
            ${d.paid!==void 0?`
              <div class="totals-row" style="color: #16a34a; font-weight: 600; margin-top: 4px;">
                <span>المدفوع:</span>
                <span>${Number(d.paid).toFixed(2)} ${(t==null?void 0:t.currency)||"SAR"}</span>
              </div>
            `:""}
            ${e.showDueBalance!==!1&&d.due&&d.due>0?`
              <div class="totals-row" style="color: #dc2626; font-weight: bold;">
                <span>المتبقي:</span>
                <span>${Number(d.due).toFixed(2)} ${(t==null?void 0:t.currency)||"SAR"}</span>
              </div>
            `:""}
          </div>

          ${s?`
            <div class="qr-code">
              <img src="${$}" alt="QR Code" />
              <div style="font-size: 9.5px; color: #64748b; margin-top: 3px;">${z}</div>
            </div>
          `:""}
        </div>

        ${w?`
          <div class="terms-box">
            <strong>الشروط والأحكام:</strong> ${w}
          </div>
        `:""}

        ${e.showSignatureStamp!==!1?`
          <div class="signatures">
            <div>توقيع المستلم / العميل: ....................</div>
            <div>ختم وتوقيع المركز: ....................</div>
          </div>
        `:""}

        <div class="footer">
          <div>${c.replace(/\n/g,"<br/>")}</div>
          ${v?`<div style="margin-top: 4px; font-weight: 600;">خدمة العملاء والواتساب: ${v}</div>`:""}
        </div>
      </body>
    </html>
  `;o.document.write(S),o.document.close(),o.focus(),setTimeout(()=>{o.print(),o.close()},500)},T=async(d,t,o=null,e="تقرير")=>{const a=document.getElementById(d);if(!a){alert("تعذر العثور على العنصر المراد تصديره");return}const s=document.createElement("div");s.style.position="absolute",s.style.left="-9999px",s.style.top="0",s.style.width="850px",s.style.backgroundColor="#ffffff",s.style.padding="30px",s.style.fontFamily="'Cairo', Arial, sans-serif",s.dir="rtl";const l=`
    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
      ${o!=null&&o.logoUrl?`<img src="${o.logoUrl}" style="max-height: 70px; margin-bottom: 10px; object-fit: contain;" />`:""}
      <h1 style="margin: 0; color: #1e1e1e; font-size: 22px;">${(o==null?void 0:o.name)||"مركز التجميل والعناية"}</h1>
      ${o!=null&&o.docName?`<h2 style="margin: 4px 0; color: #4f46e5; font-size: 15px;">${o.docName}</h2>`:""}
      <h3 style="margin: 6px 0; color: #111827; font-size: 18px; font-weight: bold;">${e}</h3>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 8px;">
        <span>تاريخ التقرير: ${new Date().toLocaleDateString("ar-EG")} - ${new Date().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</span>
        <span>الرقم الضريبي: ${(o==null?void 0:o.taxId)||"غير مسجل"}</span>
        <span>العملة: ${(o==null?void 0:o.currency)||"SAR"}</span>
      </div>
    </div>
  `,p=a.cloneNode(!0);p.querySelectorAll(".no-print").forEach(n=>n.remove()),s.innerHTML=l,s.appendChild(p);const r=document.createElement("div");r.style.marginTop="30px",r.style.borderTop="1px solid #e2e8f0",r.style.paddingTop="15px",r.style.display="flex",r.style.justifyContent="space-between",r.style.fontSize="11px",r.style.color="#94a3b8",r.innerHTML=`
    <span>تم استخراج هذا التقرير آلياً عبر نظام إدارة المراكز</span>
    <span>توقيع المحاسب / الإدارة: ................................</span>
  `,s.appendChild(r),document.body.appendChild(s);try{const{default:n}=await y(async()=>{const{default:h}=await import("./html2canvas.esm-QH1iLAAe.js");return{default:h}},[],import.meta.url),i=await n(s,{scale:2,useCORS:!0,logging:!1,backgroundColor:"#ffffff"}),x=i.toDataURL("image/png"),{default:u}=await y(async()=>{const{default:h}=await import("./jspdf.es.min-8ucwgutF.js").then(v=>v.j);return{default:h}},__vite__mapDeps([0,1,2]),import.meta.url),m=new u({orientation:"p",unit:"mm",format:"a4"}),f=m.internal.pageSize.getWidth(),b=i.height*f/i.width;m.addImage(x,"PNG",0,0,f,b),m.save(`${t}_${new Date().toISOString().split("T")[0]}.pdf`)}catch(n){console.error("Error generating PDF:",n),alert("حدث خطأ أثناء تصدير ملف PDF، يمكنك استخدام خيار الطباعة العادي للحفظ بصيغة PDF")}finally{document.body.removeChild(s)}},C=(d,t,o,e="")=>{const a=window.open("","_blank");if(!a)return;const s=`
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8"/>
        <title>${d} - ${(o==null?void 0:o.name)||"المركز"}</title>
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
            <h1>${(o==null?void 0:o.name)||"مركز التجميل والعناية"}</h1>
            <h3>${o!=null&&o.docName?"بإشراف: "+o.docName:"النظام المالي والمحاسبي"}</h3>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${(o==null?void 0:o.invoiceAddress)||""}</div>
          </div>
          <div class="clinic-meta">
            <div><strong>الرقم الضريبي:</strong> ${(o==null?void 0:o.taxId)||"غير محدد"}</div>
            <div><strong>هاتف:</strong> ${(o==null?void 0:o.whatsappNumber)||"--"}</div>
            <div><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString("ar-EG")}</div>
          </div>
        </div>

        <div class="report-title-bar">
          <h2>${d}</h2>
          <span style="font-size: 12px; color: #64748b;">العملة: <strong>${(o==null?void 0:o.currency)||"SAR"}</strong></span>
        </div>

        ${e?`<div class="summary-box">${e}</div>`:""}

        ${t}

        <div class="footer">
          <div>توقيع الموظف المسؤول: ..............................</div>
          <div>ختم واعتماد الإدارة: ..............................</div>
        </div>
      </body>
    </html>
  `;a.document.write(s),a.document.close(),a.focus(),setTimeout(()=>{a.print(),a.close()},400)},E=(d,t,o)=>{const e=window.open("","_blank");if(!e)return;const a=(o==null?void 0:o.currency)||"SAR",s=d.salary||d.basic||0,l=t.commission||0,p=t.bonus||0,g=t.deductions||0,r=t.advances||0,n=s+l+p-g-r,i=`
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8"/>
        <title>قسيمة راتب - ${d.name}</title>
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
            <h2>${(o==null?void 0:o.name)||"مركز التجميل"}</h2>
            <h4>قسيمة استلام راتب ومستحقات مالية</h4>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">عن شهر: ${new Date().toLocaleString("ar-EG",{month:"long",year:"numeric"})}</div>
          </div>

          <div class="meta-grid">
            <div><strong>اسم الموظف:</strong> ${d.name}</div>
            <div><strong>المسمى الوظيفي:</strong> ${d.role||"خبير / موظف"}</div>
            <div><strong>رقم الهاتف:</strong> ${d.phone||"--"}</div>
            <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString("ar-EG")}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>بند الاستحقاق / الاستقطاع</th>
                <th>المبلغ (${a})</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>الراتب الأساسي</td>
                <td>${s.toLocaleString()}</td>
                <td>الراتب التعاقدي الشهري</td>
              </tr>
              <tr>
                <td>حوافز وعمولات الجلسات</td>
                <td style="color: #16a34a;">+${l.toLocaleString()}</td>
                <td>عن إنجاز ${t.completedSessions||0} جلسة</td>
              </tr>
              ${p>0?`
              <tr>
                <td>مكافآت إضافية</td>
                <td style="color: #16a34a;">+${p.toLocaleString()}</td>
                <td>مكافأة تشجيعية</td>
              </tr>`:""}
              ${g>0?`
              <tr>
                <td>استقطاعات وخصومات</td>
                <td style="color: #dc2626;">-${g.toLocaleString()}</td>
                <td>جزاءات / غياب</td>
              </tr>`:""}
              ${r>0?`
              <tr>
                <td>سلف مستردة</td>
                <td style="color: #dc2626;">-${r.toLocaleString()}</td>
                <td>سداد سلفة سابقة</td>
              </tr>`:""}
            </tbody>
          </table>

          <div class="net-box">
            الصافي المستحق للصرف: ${n.toLocaleString()} ${a}
          </div>

          <div class="signatures">
            <div>توقيع واستلام الموظف: ........................</div>
            <div>اعتماد المدير المالي: ........................</div>
          </div>
        </div>
      </body>
    </html>
  `;e.document.write(i),e.document.close(),e.focus(),setTimeout(()=>{e.print(),e.close()},400)},j=(d,t,o)=>{const e=window.open("","_blank");if(!e)return;const a=(o==null?void 0:o.currency)||"SAR",s=d.total||0,l=d.paid||0,p=Math.max(0,s-l),g=t.map((n,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${n.isoDate||n.date}</td>
      <td>${n.service||"--"}</td>
      <td>${n.handler||"--"}</td>
      <td>${n.payMethod||"نقدي"}</td>
      <td>${n.total||0} ${a}</td>
      <td style="color: #16a34a; font-weight: bold;">${n.paid||0} ${a}</td>
      <td style="color: #dc2626; font-weight: bold;">${(n.total||0)-(n.paid||0)} ${a}</td>
    </tr>
  `).join(""),r=`
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8"/>
        <title>كشف حساب عميل - ${d.name}</title>
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
            <h2>${(o==null?void 0:o.name)||"مركز التجميل والعناية"}</h2>
            <h4>كشف حساب وتاريخ زيارات العميل</h4>
          </div>
          <div style="text-align: left; font-size: 12px; color: #64748b;">
            <div>تاريخ الاستخراج: ${new Date().toLocaleDateString("ar-EG")}</div>
            <div>هاتف المركز: ${(o==null?void 0:o.whatsappNumber)||"--"}</div>
          </div>
        </div>

        <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between;">
          <div><strong>اسم العميل:</strong> ${d.name}</div>
          <div><strong>رقم الهاتف:</strong> ${d.phone||"--"}</div>
          <div><strong>نقاط الولاء:</strong> ${d.points||0} نقطة</div>
        </div>

        <div class="info-cards">
          <div class="card">
            <div style="font-size: 12px; color: #64748b;">عدد الزيارات</div>
            <div class="val text-indigo-600">${t.length}</div>
          </div>
          <div class="card">
            <div style="font-size: 12px; color: #64748b;">إجمالي الخدمات</div>
            <div class="val">${s.toLocaleString()} ${a}</div>
          </div>
          <div class="card">
            <div style="font-size: 12px; color: #166534;">إجمالي المسدد</div>
            <div class="val text-green-600">${l.toLocaleString()} ${a}</div>
          </div>
          <div class="card" style="background: ${p>0?"#fef2f2":"#f0fdf4"}; border-color: ${p>0?"#fecaca":"#bbf7d0"};">
            <div style="font-size: 12px; color: ${p>0?"#991b1b":"#166534"};">الرصيد المتبقي (الآجل)</div>
            <div class="val" style="color: ${p>0?"#dc2626":"#16a34a"};">${p.toLocaleString()} ${a}</div>
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
            ${g||'<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">لا توجد سجلات زيارات سابقة لهذا العميل</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>توقيع قسم الحسابات: ........................</div>
          <div>ختم المركز: ........................</div>
        </div>
      </body>
    </html>
  `;e.document.write(r),e.document.close(),e.focus(),setTimeout(()=>{e.print(),e.close()},400)};export{E as a,j as b,C as c,T as d,L as e,_ as f,R as p};
