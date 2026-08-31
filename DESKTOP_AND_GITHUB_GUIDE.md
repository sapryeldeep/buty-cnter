# 🚀 دليل الربط بـ GitHub والتحويل إلى برنامج سطح مكتب (ملف EXE)
## منظومة "شامل لإدارة مراكز وفروع التجميل ERP"

تمت تهيئة المشروع وفحصه بدقة ليكون متوافقاً 100% مع البناء المحلي، وحزم سطح المكتب (Desktop Packaging)، ومستودعات **GitHub**.

---

### 1️⃣ الخطوة الأولى: الربط بـ GitHub ورفع المشروع

افتح موجه الأوامر (Terminal / PowerShell / Git Bash) في مجلد المشروع ونفذ الأوامر التالية:

```bash
# 1. تهيئة مستودع Git محلي
git init

# 2. إضافة كافة الملفات (ملفات العمل النظيفة بعد استبعاد الملفات المؤقتة)
git add .

# 3. حفظ التغييرات الأولى (Initial Commit)
git commit -m "Initial commit - Shamel Beauty Centers ERP System"

# 4. تسمية الفرع الرئيسي
git branch -M main

# 5. ربط المستودع برابط GitHub الخاص بك (استبدل الرابط برابط مستودعك)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 6. رفع الكود إلى GitHub
git push -u origin main
```

---

### 2️⃣ الخطوة الثانية: بناء ملفات الإنتاج المجمعة (Build)

قبل تحويل التطبيق إلى ملف `exe`، يجب تجميع ملفات الواجهة من خلال الأمر:

```bash
npm install
npm run build
```

> **ملاحظة مهمة:** بعد تنفيذ هذا الأمر، سينتج مجلد اسمه `dist` يحتوي على ملفات الواجهة المجمعة والأصول بمسارات نسبية جاهزة للعمل دون الحاجة لأي خادم ويب خارجي.

---

### 3️⃣ الخيار الأول: التحويل إلى ملف EXE عبر Electron (الأسهل والأكثر استقراراً)

تم تجهيز ملف التشغيل المكتبي في المسار: `electron/main.cjs`.

#### خطوات إنشاء الـ EXE عبر Electron:

1. **تثبيت حزم Electron:**
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **تجربة التطبيق كنافذة سطح مكتب فورية:**
   ```bash
   npx electron electron/main.cjs
   ```

3. **استخراج ملف EXE مباشر (Portable / Installer):**
   نفذ الأمر التالي لبناء ملف التثبيت والتطبيق المباشر في مجلد `dist-electron`:
   ```bash
   npx electron-builder --win --dir
   # أو لإنشاء ملف تنصيب Setup.exe واحد:
   npx electron-builder --win nsis
   ```

---

### 4️⃣ الخيار الثاني: التحويل عبر نيترون (Neutralinojs) - حجم خفيف جداً (~5MB)

تم تجهيز ملف الإعدادات الخاص بـ Neutralino في جذر المشروع: `neutralino.config.json`.

1. **تثبيت أداة نيترون العامة:**
   ```bash
   npm install -g @neutralinojs/neu
   ```

2. **بناء المشروع وتشغيله:**
   ```bash
   npm run build
   neu build --release
   ```
3. ستجد ملف `Shamel-ERP.exe` تم إنشاؤه داخل مجلد `bin/` بحجم لا يتعدى بضعة ميغابايت ويعمل فوراً على أي جهاز Windows دون الحاجة لتثبيت أي برامج مسبقة.

---

### 5️⃣ الخيار الثالث: الدمج عبر Visual Studio (C# / WebView2)

إذا كنت ترغب في تشغيل التطبيق داخل بيئة **Visual Studio 2022 / 2025**:

1. افتح **Visual Studio** وأنشئ مشروع جديد من نوع:
   - **Windows Forms App (.NET 8.0)** أو **WPF Application (.NET 8.0)**.
2. من خلال **Manage NuGet Packages**، قم بتثبيت حزمة:
   - `Microsoft.Web.WebView2`
3. اسحب أداة `WebView2` وضعها على شاشة الفورم مع جعل `Dock = Fill`.
4. انسخ كامل محتويات مجلد `dist` المجمع وضعها في مجلد المشروع في Visual Studio واضبط خصائص الملفات على:
   `Copy to Output Directory = Copy if newer`.
5. في كود فتح الشاشة (`Form_Load`):
   ```csharp
   private async void Form1_Load(object sender, EventArgs e)
   {
       await webView21.EnsureCoreWebView2Async();
       string htmlPath = System.IO.Path.Combine(Application.StartupPath, "dist", "index.html");
       webView21.CoreWebView2.Navigate(htmlPath);
   }
   ```
6. اضغط على **Build > Build Solution (Release)** وسينتج لك ملف الـ `.exe` الخاص بك في مجلد `bin/Release`.

---

### 🛡️ نقاط القوة والمزايا التي تمت مراجعتها:
- ✅ **حفظ محلي وسحابي تلقائي:** البيانات تُحفظ في `localStorage` مع دعم التزامن مع Firebase، مما يعني أن التطبيق يعمل Offline بنسبة 100% دون انقطاع.
- ✅ **تصدير وطباعة متكاملة:** جداول Excel، ملفات PDF، فواتير ضريبية، قسائم رواتب، وتقارير أرباح.
- ✅ **تضمين الخطوط والأيقونات:** تم ضبط كل الرموز والأيقونات بدقة.
- ✅ **نظافة المجلدات:** تم تنظيف كافة الملفات المؤقتة وأصبح المستودع جاهزاً تماماً للإنتاج.
