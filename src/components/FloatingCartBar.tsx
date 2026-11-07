import React from 'react';
import { useBlood } from '../context/BloodContext';
import { ShoppingBag, Printer, ArrowRight, Building2, Flame } from 'lucide-react';

interface FloatingCartBarProps {
  openCartDrawer: () => void;
  onPrintDraftOrder: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  openCartDrawer,
  onPrintDraftOrder,
}) => {
  const { cart } = useBlood();

  if (cart.length === 0) return null;

  const totalUnits = cart.reduce((sum, item) => sum + item.requestedUnits, 0);

  // Group by hospital to show count
  const hospitalNames = Array.from(new Set(cart.map((i) => i.inventoryItem.hospitalName)));

  return (
    <aside
      aria-label="ตระกร้าขอเบิกโลหิตที่เลือก"
      className="fixed bottom-4 inset-x-4 sm:inset-x-6 md:inset-x-8 max-w-5xl mx-auto z-40 no-print animate-fade-in"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-rose-500/40 ring-2 ring-rose-500/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Cart Info & Blood Bags pills */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/50">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 bg-white text-rose-700 font-mono text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900 shadow-xs">
              {totalUnits}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-wide">
                ตระกร้าขอเบิกโลหิตที่เลือก ({cart.length} รายการ · รวม {totalUnits} ยูนิต)
              </span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded font-mono">
                {hospitalNames.join(', ')}
              </span>
            </div>

            {/* Blood bags items pills */}
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto py-0.5 scrollbar-none">
              {cart.map((item) => {
                const inv = item.inventoryItem;
                return (
                  <div
                    key={inv.id}
                    className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5"
                  >
                    <span className="font-bold text-rose-400">{inv.bloodGroup}</span>
                    <span className="text-[10px] text-slate-400">
                      {inv.rh === 'Negative' ? 'Rh-' : 'Rh+'}
                    </span>
                    <span className="text-slate-300 font-semibold">{inv.productType}</span>
                    <span className="text-white font-bold bg-slate-700 px-1 rounded text-[10px]">
                      x{item.requestedUnits}
                    </span>
                    <span className="text-[10px] text-rose-300/80 font-sans">
                      ({item.transactionType})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          {/* Quick Print Order Slip button */}
          <button
            type="button"
            onClick={onPrintDraftOrder}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors shadow-sm whitespace-nowrap"
            title="พิมพ์ใบสร้างออเดอร์และใบยืมคืน"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>พิมพ์ใบสร้างออเดอร์</span>
          </button>

          {/* Open Drawer / Submit Order button */}
          <button
            type="button"
            onClick={openCartDrawer}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-900/40 whitespace-nowrap"
          >
            <span>ดูตระกร้า &amp; ส่งออเดอร์</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
