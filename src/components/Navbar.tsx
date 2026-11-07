import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBlood } from '../context/BloodContext';
import { ShoppingBag, LogOut, PlusCircle, Building2, User } from 'lucide-react';

interface NavbarProps {
  currentTab: 'marketplace' | 'orders' | 'dashboard';
  setCurrentTab: (tab: 'marketplace' | 'orders' | 'dashboard') => void;
  openPostModal: () => void;
  openCartDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openPostModal,
  openCartDrawer,
}) => {
  const { currentUser, logout, setIsLoginModalOpen } = useAuth();
  const { cart } = useBlood();

  const totalCartItems = cart.reduce((sum, item) => sum + item.requestedUnits, 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single element brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-200">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <button
            onClick={() => setCurrentTab('marketplace')}
            className="text-left font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap hover:text-rose-600 transition-colors"
          >
            Thai BloodLink
          </button>
        </div>

        {/* Zone 2: 4-5 clean, single-line text links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentTab('marketplace')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'marketplace'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            คลังโลหิตพร้อมยืม-แลกเปลี่ยน
          </button>
          <button
            onClick={() => setCurrentTab('orders')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'orders'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            ประวัติการยืม คืน แลกเปลี่ยน
          </button>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'dashboard'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            สรุปรายงานสถิติ
          </button>
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Post Blood Button */}
          <button
            type="button"
            onClick={openPostModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>โพสต์เลือดให้ยืม</span>
          </button>

          {/* Cart Drawer Trigger */}
          <button
            type="button"
            onClick={openCartDrawer}
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer ${
              totalCartItems > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="เปิดตระกร้าขอเบิกโลหิต"
          >
            <ShoppingBag className={`w-4 h-4 ${totalCartItems > 0 ? 'text-white' : 'text-slate-500'}`} />
            <span>ตระกร้าขอเบิก</span>
            {totalCartItems > 0 ? (
              <span className="bg-white text-rose-700 font-mono text-[11px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-xs">
                {totalCartItems}
              </span>
            ) : null}
          </button>

          {/* User profile / Gmail auth info */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden lg:block leading-tight">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-end gap-1">
                  <Building2 className="w-2.5 h-2.5 text-rose-500" />
                  <span className="truncate max-w-[130px] font-sans">{currentUser.hospitalName}</span>
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full ring-2 ring-rose-200 overflow-hidden bg-slate-100 focus:outline-none"
                  title={`${currentUser.name} (${currentUser.email})`}
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {/* Dropdown Menu on hover/focus */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-3 hidden group-hover:block hover:block z-50 animate-fade-in">
                  <div className="p-2 bg-slate-50 rounded-lg mb-2">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
                    <p className="text-[11px] text-rose-700 font-medium mt-1">
                      {currentUser.hospitalName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.role}</p>
                  </div>

                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-2 mb-1"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>สลับบัญชี Gmail / โรงพยาบาล</span>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              เข้าสู่ระบบด้วย Gmail
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
