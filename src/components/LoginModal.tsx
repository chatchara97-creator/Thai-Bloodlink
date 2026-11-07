import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_HOSPITALS } from '../data/mockData';
import { ShieldCheck, CheckCircle2, Hospital, Mail, UserCheck, AlertCircle } from 'lucide-react';

interface QuickUser {
  email: string;
  name: string;
  hospitalId: string;
  hospitalName: string;
  role: string;
}

const QUICK_ACCOUNTS: QuickUser[] = [
  {
    email: 'chatchara97@gmail.com',
    name: 'ทนพ. พัชรภัทร ชาญเจริญ',
    hospitalId: 'hosp-01',
    hospitalName: 'โรงพยาบาลศิริราช',
    role: 'หัวหน้างานคลังโลหิต (Senior MT)',
  },
  {
    email: 'napassorn.chula@gmail.com',
    name: 'ทนพญ. นภัสสร สุขสว่าง',
    hospitalId: 'hosp-02',
    hospitalName: 'โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย',
    role: 'นักเทคนิคการแพทย์ ชำนาญการ',
  },
  {
    email: 'thanyarat.rama@gmail.com',
    name: 'ทนพญ. ธัญญารัตน์ โพธิ์ทอง',
    hospitalId: 'hosp-03',
    hospitalName: 'โรงพยาบาลรามาธิบดี',
    role: 'ผู้ประสานงานคลังเลือดเร่งด่วน',
  },
  {
    email: 'pongsiri.cmu@gmail.com',
    name: 'ทนพ. พงษ์ศิริ เมฆมณี',
    hospitalId: 'hosp-04',
    hospitalName: 'โรงพยาบาลมหาราชนครเชียงใหม่',
    role: 'นักเทคนิคการแพทย์ประจำเวร',
  },
];

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginWithGmail, loginWithGooglePopup, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [customEmail, setCustomEmail] = useState('chatchara97@gmail.com');
  const [customName, setCustomName] = useState('ทนพ. ชัชชล เกียรติแพทย์');
  const [selectedHospitalId, setSelectedHospitalId] = useState(INITIAL_HOSPITALS[0].id);
  const [customRole, setCustomRole] = useState('นักเทคนิคการแพทย์ (Medical Technologist)');
  const [emailError, setEmailError] = useState('');

  if (!isLoginModalOpen && currentUser) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = customEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailError('กรุณากรอกอีเมล Gmail');
      return;
    }
    if (!trimmedEmail.endsWith('@gmail.com')) {
      setEmailError('ต้องใช้อีเมลที่ลงท้ายด้วย @gmail.com เท่านั้น ตามข้อกำหนดของระบบ');
      return;
    }
    setEmailError('');
    loginWithGmail(trimmedEmail, customName.trim() || 'เจ้าหน้าที่คลังเลือด', selectedHospitalId, customRole);
  };

  const handleQuickLogin = (acc: QuickUser) => {
    loginWithGmail(acc.email, acc.name, acc.hospitalId, acc.role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800 text-white px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Thai BloodLink Network</h2>
              <p className="text-xs text-rose-100 font-light">
                ระบบเครือข่ายแลกเปลี่ยนและยืมคืนโลหิตระหว่างโรงพยาบาล
              </p>
            </div>
          </div>
        </div>

        {/* Auth Box Body */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>มาตรการความปลอดภัยเวชศาสตร์บริการโลหิต:</strong> ผู้ใช้งานต้องยืนยันตัวตนด้วยบัญชี Gmail ที่ผูกกับโรงพยาบาลทุกครั้งก่อนเข้าใช้งานระบบ
            </span>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'quick'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เลือกบัญชีด่วน (Fast Pass)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'custom'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กรอกบัญชี Gmail เอง
            </button>
          </div>

          {activeTab === 'quick' ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => loginWithGooglePopup(INITIAL_HOSPITALS[0].id)}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>ลงชื่อเข้าใช้ด้วย Google Account จริง (Firebase Auth)</span>
              </button>

              <div className="flex items-center gap-2 text-slate-300 text-[11px] my-1">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-slate-400 font-medium">หรือเลือกบัญชีตัวอย่างประจำโรงพยาบาล</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Google G logo avatar */}
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-rose-300">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-rose-700">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                        <span>{acc.email}</span>
                        <span>·</span>
                        <span className="text-rose-600 font-sans font-medium">{acc.hospitalName}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-rose-600 font-medium group-hover:translate-x-0.5 transition-transform">
                    เข้าใช้งาน &rarr;
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCustomLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  อีเมล Gmail <span className="text-rose-500">* (ต้องลงท้ายด้วย @gmail.com)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => {
                      setCustomEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="เช่น yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {emailError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่ง
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="เช่น ทนพ. กิตติพงษ์ วงศ์วิจิตร"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  โรงพยาบาลต้นสังกัด <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hospital className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={selectedHospitalId}
                    onChange={(e) => setSelectedHospitalId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  >
                    {INITIAL_HOSPITALS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.province})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  บทบาทหน้าที่
                </label>
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="เช่น นักเทคนิคการแพทย์ งานคลังเลือด"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                ลงชื่อเข้าใช้งานด้วย Google Gmail
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Thai Red Cross & MOPH Standard</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> 256-bit SSL Data Security
            </span>
          </div>
        </div>

        {currentUser && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
