import React, { useState } from 'react';
import { useBlood } from '../context/BloodContext';
import { useAuth } from '../context/AuthContext';
import { BloodGroup, RhType, ProductType, TransactionType } from '../types/blood';
import { X, PlusCircle, ShieldCheck, Thermometer, Calendar } from 'lucide-react';

interface PostBloodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostBloodModal: React.FC<PostBloodModalProps> = ({ isOpen, onClose }) => {
  const { postInventoryItem } = useBlood();
  const { currentUser, currentHospital } = useAuth();

  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O');
  const [rh, setRh] = useState<RhType>('Positive');
  const [productType, setProductType] = useState<ProductType>('PRC');
  const [bagNumber, setBagNumber] = useState<string>(
    `TH-B26-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [unitsAvailable, setUnitsAvailable] = useState<number>(4);
  const [volumeMl, setVolumeMl] = useState<number>(350);
  const [collectionDate, setCollectionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 35);
    return d.toISOString().slice(0, 10);
  });
  const [storageTemp, setStorageTemp] = useState<string>('2°C ถึง 6°C');
  const [allowedTransactions, setAllowedTransactions] = useState<TransactionType[]>(['ยืม', 'แลกเปลี่ยน']);
  const [anticoagulant, setAnticoagulant] = useState<string>('CPD-A1');
  const [notes, setNotes] = useState<string>('โลหิตสำรองพร้อมส่งมอบผ่านห่วงโซ่ความเย็น');
  const [contactPerson, setContactPerson] = useState<string>(currentUser?.name || 'นักเทคนิคการแพทย์');
  const [contactPhone, setContactPhone] = useState<string>(currentUser?.phone || '02-XXX-XXXX');

  if (!isOpen) return null;

  // Auto-adjust default expiry & storage temperature when product type changes
  const handleProductChange = (pt: ProductType) => {
    setProductType(pt);
    const today = new Date();
    if (pt === 'PRC' || pt === 'WB' || pt === 'LPRC') {
      today.setDate(today.getDate() + 35);
      setStorageTemp('2°C ถึง 6°C');
      setVolumeMl(350);
      setAnticoagulant('CPD-A1');
    } else if (pt === 'FFP' || pt === 'CRYO') {
      today.setDate(today.getDate() + 365);
      setStorageTemp('-20°C ถึง -30°C');
      setVolumeMl(pt === 'FFP' ? 250 : 50);
      setAnticoagulant('CPD-A1');
    } else if (pt === 'PC' || pt === 'SDP') {
      today.setDate(today.getDate() + 5);
      setStorageTemp('20°C ถึง 24°C (Agitator)');
      setVolumeMl(pt === 'SDP' ? 300 : 60);
      setAnticoagulant('ACD-A');
    }
    setExpiryDate(today.toISOString().slice(0, 10));
  };

  const handleToggleTx = (tx: TransactionType) => {
    setAllowedTransactions((prev) =>
      prev.includes(tx) ? prev.filter((t) => t !== tx) : [...prev, tx]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allowedTransactions.length === 0) {
      alert('กรุณาเลือกเงื่อนไขอย่างน้อย 1 รายการ (ยืม หรือ แลกเปลี่ยน)');
      return;
    }

    postInventoryItem({
      bagNumber: bagNumber.trim(),
      hospitalId: currentUser?.hospitalId || 'hosp-01',
      hospitalName: currentUser?.hospitalName || 'โรงพยาบาลศิริราช',
      hospitalProvince: currentHospital?.province || 'กรุงเทพมหานคร',
      bloodGroup,
      rh,
      productType,
      volumeMl,
      unitsAvailable,
      collectionDate,
      expiryDate,
      storageTemp,
      allowedTransactions,
      notes: notes.trim(),
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      anticoagulant,
      screeningPassed: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">โพสต์โลหิตพร้อมให้ยืม / แลกเปลี่ยน</h3>
              <p className="text-xs text-rose-100 font-light">
                {currentUser?.hospitalName} · โพสต์เข้าสู่เครือข่ายธนาคารเลือดกลาง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Blood Group and Rh Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                หมู่โลหิต (ABO) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['A', 'B', 'O', 'AB'] as BloodGroup[]).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setBloodGroup(grp)}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      bloodGroup === grp
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                หมู่ Rh Factor <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRh('Positive')}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                    rh === 'Positive'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Rh+ (Positive ทั่วไป)
                </button>
                <button
                  type="button"
                  onClick={() => setRh('Negative')}
                  className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                    rh === 'Negative'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Rh- (Negative หายาก)
                </button>
              </div>
            </div>
          </div>

          {/* Product Type & Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชนิดผลิตภัณฑ์โลหิต <span className="text-rose-500">*</span>
              </label>
              <select
                value={productType}
                onChange={(e) => handleProductChange(e.target.value as ProductType)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white font-mono"
              >
                <option value="PRC">PRC (Packed Red Cells)</option>
                <option value="FFP">FFP (Fresh Frozen Plasma)</option>
                <option value="PC">PC (Platelet Concentrate)</option>
                <option value="SDP">SDP (Single Donor Platelet)</option>
                <option value="CRYO">CRYO (Cryoprecipitate)</option>
                <option value="WB">WB (Whole Blood)</option>
                <option value="LPRC">LPRC (Leukocyte-Poor Red Cells)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                จำนวนยูนิตพร้อมให้ <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={unitsAvailable}
                onChange={(e) => setUnitsAvailable(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ปริมาตรต่อถุง (ml)
              </label>
              <input
                type="number"
                value={volumeMl}
                onChange={(e) => setVolumeMl(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          {/* Dates & Bag Number */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                หมายเลขถุง / Lot Barcode
              </label>
              <input
                type="text"
                required
                value={bagNumber}
                onChange={(e) => setBagNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันที่เจาะเก็บ (Collection)
              </label>
              <input
                type="date"
                required
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันหมดอายุ (Expiration)
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          {/* Storage & Anticoagulant */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                อุณหภูมิการจัดเก็บ
              </label>
              <input
                type="text"
                value={storageTemp}
                onChange={(e) => setStorageTemp(e.target.value)}
                placeholder="เช่น 2°C ถึง 6°C"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สารป้องกันการแข็งตัวของเลือด
              </label>
              <input
                type="text"
                value={anticoagulant}
                onChange={(e) => setAnticoagulant(e.target.value)}
                placeholder="เช่น CPD-A1, SAGM"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Allowed Transaction Types */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              เงื่อนไขที่ยินยอมให้ดำเนินการ <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              {(['ยืม', 'แลกเปลี่ยน', 'โอนให้ฟรี'] as TransactionType[]).map((tx) => (
                <label key={tx} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedTransactions.includes(tx)}
                    onChange={() => handleToggleTx(tx)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>{tx}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes & Contacts */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              บันทึก / ข้อกำหนดเฉพาะทางคลินิก
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น สามารถส่ง Cold chain ข้ามจังหวัดได้ หรือ ต้องการเคสฉุกเฉินเท่านั้น..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เจ้าหน้าที่ผู้รับผิดชอบ
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เบอร์โทรติดต่อคลังเลือด
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ยืนยันว่าโลหิตทุกยูนิตได้ผ่านการตรวจคัดกรองเชื้อก่อโรค (HIV, HCV, HBV, Treponema pallidum) และทดสอบหมู่เลือดตามมาตรฐานสภากาชาดไทยเรียบร้อยแล้ว
            </span>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>โพสต์รายการโลหิต ({unitsAvailable} ยูนิต)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
