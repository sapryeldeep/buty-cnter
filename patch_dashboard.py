import re

with open("src/tabs/DashboardTab.tsx", "r") as f:
    content = f.read()

# Add bell icon to imports
import_lucide = "import { \n  FileText, Clock, Trash2, Printer, Check, UserCog, Send, Volume2, Archive, Receipt, SlidersHorizontal, Edit, Bell\n} from 'lucide-react';"
content = re.sub(r"import\s*{\s*FileText.*?}\s*from\s*'lucide-react';", import_lucide, content, flags=re.DOTALL)

# Add state and effect
hook_code = """
export default function DashboardTab() {
  const { data, currentUser, updateData, setActiveTab } = useStore();
  const { currentClinicId, currentCurrency } = useClinicContext();
  
  const clinicAppointments = data.appointments?.[currentClinicId] || [];
  const [newAppointmentAlert, setNewAppointmentAlert] = React.useState<any>(null);
  const prevAppointmentsCount = React.useRef(clinicAppointments.length);

  React.useEffect(() => {
    if (clinicAppointments.length > prevAppointmentsCount.current) {
      const newAppt = clinicAppointments[clinicAppointments.length - 1];
      setNewAppointmentAlert(newAppt);
      const timer = setTimeout(() => {
        setNewAppointmentAlert(null);
      }, 8000);
      
      try {
        const audio = new Audio('/notification.mp3'); // Fallback if exists
        audio.play().catch(e => {});
      } catch (e) {}
      
      return () => clearTimeout(timer);
    }
    prevAppointmentsCount.current = clinicAppointments.length;
  }, [clinicAppointments.length]);

"""

content = content.replace("export default function DashboardTab() {\n  const { data, currentUser, updateData, setActiveTab } = useStore();\n  const { currentClinicId, currentCurrency } = useClinicContext();", hook_code)

# Add the UI
ui_code = """
  return (
    <div className="space-y-6">
      <SmartAlerts />
      
      {/* New Appointment Live Alert */}
      {newAppointmentAlert && (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg border-2 border-indigo-300 animate-in slide-in-from-top-4 fade-in duration-500 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full animate-pulse">
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">إشعار فوري: حجز جديد!</h4>
              <p className="text-indigo-100 text-sm">
                تم إضافة حجز جديد للعميل <strong className="text-white bg-white/20 px-2 py-0.5 rounded-md mx-1">{newAppointmentAlert.name}</strong> 
                بتاريخ <strong>{newAppointmentAlert.date}</strong> الساعة <strong>{newAppointmentAlert.time}</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setNewAppointmentAlert(null);
              setActiveTab('appointments');
            }}
            className="px-4 py-2 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap"
          >
            عرض المواعيد
          </button>
        </div>
      )}
"""

content = content.replace("  return (\n    <div className=\"space-y-6\">\n      <SmartAlerts />", ui_code)

with open("src/tabs/DashboardTab.tsx", "w") as f:
    f.write(content)

