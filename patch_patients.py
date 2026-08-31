import re

with open("src/tabs/PatientsTab.tsx", "r") as f:
    content = f.read()

# Add imports
import_lucide = "import { Users, Phone, Star, FileText, Plus, Trash2, ShieldAlert, Download } from 'lucide-react';\nimport { exportToExcel } from '../utils/exportUtils';"
content = re.sub(r"import\s*{\s*Users, Phone.*?}\s*from\s*'lucide-react';", import_lucide, content)

# Add currentUser to useStore
content = content.replace("const { data, updateData } = useStore();", "const { data, currentUser, updateData } = useStore();")

# Add getCenterForUser logic and export permission logic
logic_code = """
  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isExportAllowed = currentUser?.role === 'developer' || (center?.permissions?.devDisableExportExcel !== true && (center?.permissions?.printFull !== false || currentUser?.permissions?.canExportData !== false));

  const handleExportPatients = () => {
    const exportData = filteredPatients.map(p => ({
      'اسم العميل': p.name,
      'رقم الهاتف': p.phone || 'غير مسجل',
      'إجمالي المبالغ': p.total,
      'المدفوع': p.paid,
      'المتبقي (الآجل)': p.due,
      'نقاط الولاء': p.points
    }));
    exportToExcel(exportData, `سجل_العملاء_${new Date().toISOString().split('T')[0]}`);
  };

  const records = getCombinedAllRecords();
"""
content = content.replace("  const records = getCombinedAllRecords();", logic_code)

# Add Export Button to the UI
ui_header = """          <div className="flex justify-between items-center mb-4">
            <h6 className="font-bold text-indigo-600 m-0">دليل العملاء ونقاط الولاء</h6>
            {isExportAllowed && (
              <button 
                onClick={handleExportPatients}
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border border-emerald-200"
              >
                <Download size={14} />
                تصدير Excel
              </button>
            )}
          </div>"""
content = content.replace("          <div className=\"flex justify-between items-center mb-4\">\n            <h6 className=\"font-bold text-indigo-600 m-0\">دليل العملاء ونقاط الولاء</h6>\n          </div>", ui_header)

with open("src/tabs/PatientsTab.tsx", "w") as f:
    f.write(content)
