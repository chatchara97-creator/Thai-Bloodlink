import React, { useState } from 'react';
import { RequisitionOrder } from '../types/blood';
import { useBlood } from '../context/BloodContext';
import { useAuth } from '../context/AuthContext';
import { X, RotateCcw, ShieldCheck, AlertCircle, CheckCircle2, Thermometer } from 'lucide-react';

interface ReturnBloodModalProps {
  order: RequisitionOrder | null;
  onClose: () => void;
}

export const ReturnBloodModal: React.FC<ReturnBloodModalProps> = ({ order, onClose }) => {
  const { recordBloodReturn } = useBlood();
  const { currentUser } = useAuth();

  const totalBorrowed = order?.loanReturnDetails?.totalUnitsBorrowed || 0;
  const currentReturned = order?.loanReturnDetails?.totalUnitsReturned || 0;
  const outstanding = Math.max(0, totalBorrowed - currentReturned);

  const [returnUnits, setReturnUnits] = useState<number>(outstanding || 1);
  const [bagNumbersStr, setBagNumbersStr] = useState<string>('');
  const [temp, setTemp] = useState<number>(3.8);
  const [condition, setCondition] = useState<'ผ่านเกณฑ์มาตรฐาน' | 'ถุงชำรุด/อุณหภูมิเกิน'>('ผ่านเกณฑ์มาตรฐาน');
  const [notes, setNotes] = useState<string>('ส่งคืนโลหิตทดแทนตรงตามกำหนด คุณภาพสมบูรณ์');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bagNumbers = bagNumbersStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const fallbackBags =
      bagNumbers.length > 0
        ? bagNumbers
        : Array.from({ length: returnUnits }, (_, i) => `TH-RET-B26-${Math.floor(10000 + Math.random() * 90000)}-${i + 1}`);

    recordBloodReturn(order.id, returnUnits, fallbackBags, condition, temp, notes);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">บันทึกการส่งคืนโลหิตทดแทน (Blood Return)</h3>
              <p className="text-xs text-slate-400">อ้างอิงใบออเดอร์: {order.orderNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">บันทึกการส่งคืนโลหิตสำเร็จ!</h4>
              <p className="text-xs text-slate-500">
                ระบบได้ตัดยอดหนี้คลังโลหิตและอัปเดตประวัติการส่งคืนเข้าระบบเรียบร้อยแล้ว
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Order Overview Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">โรงพยาบาลเจ้าหนี้ (ผู้ให้ยืม):</span>
                  <span className="font-bold text-rose-700">{order.issuingHospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">โรงพยาบาลผู้ยืม (ผู้ส่งคืน):</span>
                  <span className="font-bold text-slate-800">{order.requestingHospitalName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-mono">
                  <span className="text-slate-500">ยอดยืมทั้งหมด / ส่งคืนแล้ว:</span>
                  <span className="font-bold text-slate-900">
                    {totalBorrowed} ยูนิต / คืนแล้ว {currentReturned} ยูนิต
                  </span>
                </div>
                <div className="flex justify-between font-mono text-rose-700 font-bold">
                  <span>ยอดค้างส่งคืนคงเหลือ:</span>
                  <span>{outstanding} ยูนิต</span>
                </div>
              </div>

              {/* Input: Units Returning */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  จำนวนยูนิตที่ส่งคืนครั้งนี้ <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={outstanding || 10}
                    value={returnUnits}
                    onChange={(e) => setReturnUnits(Number(e.target.value))}
                    required
                    className="w-24 px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-center"
                  />
                  <span className="text-xs text-slate-500">
                    ยูนิต (จากยอดค้างส่งคืน {outstanding} ยูนิต)
                  </span>
                </div>
              </div>

              {/* Input: Bag numbers */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  หมายเลขถุงโลหิตที่ส่งคืน (คั่นด้วยจุลภาค)
                </label>
                <input
                  type="text"
                  value={bagNumbersStr}
                  onChange={(e) => setBagNumbersStr(e.target.value)}
                  placeholder="เช่น TH-RET-A-26-001, TH-RET-A-26-002"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  * หากเว้นว่าง ระบบจะสร้างรหัสถุงส่งคืนมาตรฐานให้อัตโนมัติ
                </p>
              </div>

              {/* Cold Chain Temp & Condition */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    อุณหภูมิส่งคืน (°C)
                  </label>
                  <div className="relative">
                    <Thermometer className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="number"
                      step={0.1}
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    การตรวจสอบสภาพถุง
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  >
                    <option value="ผ่านเกณฑ์มาตรฐาน">ผ่านเกณฑ์มาตรฐาน (สมบูรณ์)</option>
                    <option value="ถุงชำรุด/อุณหภูมิเกิน">ถุงชำรุด / อุณหภูมิเกินเกณฑ์</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  บันทึกเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกการส่งคืนโลหิต ({returnUnits} ยูนิต)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
