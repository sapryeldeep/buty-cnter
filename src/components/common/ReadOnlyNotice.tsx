import React from 'react';
import { Eye, ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface ReadOnlyNoticeProps {
  tabName: string;
  description?: string;
  allowedRolesText?: string;
  children?: React.ReactNode;
}

export const ReadOnlyNotice: React.FC<ReadOnlyNoticeProps> = ({
  tabName,
  description = 'هذا القسم متاح فقط للمشاهدة والاطلاع وفق صلاحيات حسابك الحالي. التعديل والحفظ والإجراءات الإدارية مقتصرة على مدراء المراكز والمطور.',
  allowedRolesText = 'أصحاب المراكز (Center Admins) / المطور الرئيسي',
  children
}) => {
  const { setActiveTab } = useStore();

  return (
    <div className="space-y-6 font-[Cairo]" dir="rtl">
      {/* Informative Banner */}
      <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/60 shadow-2xs">
            <Eye size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-900">وضع القراءة والاطلاع فقط (Read-Only Mode)</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-800 border border-amber-300">
                {tabName}
              </span>
            </div>
            <p className="text-xs text-amber-800/85 mt-0.5 font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-amber-900/80 bg-amber-100/60 px-3 py-1.5 rounded-xl border border-amber-200">
          <Lock size={14} className="text-amber-700" />
          <span>الصلاحيات الإدارية الكاملة: <strong className="text-amber-950">{allowedRolesText}</strong></span>
        </div>
      </div>

      {/* Read-Only Wrapped Content */}
      <div className="relative pointer-events-auto select-text">
        {children}
      </div>
    </div>
  );
};
