import React, { useState, useMemo } from 'react';
import { BloodInventoryItem, BloodGroup, RhType, ProductType, TransactionType } from '../types/blood';
import { useBlood } from '../context/BloodContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_HOSPITALS } from '../data/mockData';
import {
  Search,
  Filter,
  ShoppingBag,
  PlusCircle,
  Building2,
  Phone,
  Clock,
  Thermometer,
  ShieldCheck,
  Check,
  AlertTriangle,
  Flame,
  ArrowRightLeft,
  Calendar,
} from 'lucide-react';

interface MarketplaceProps {
  openPostModal: () => void;
  openCartDrawer: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ openPostModal, openCartDrawer }) => {
  const { inventory, addToCart, cart } = useBlood();
  const { currentUser } = useAuth();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedRh, setSelectedRh] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');

  // Quantity selection state per item
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Selected transaction type per item
  const [selectedTxTypes, setSelectedTxTypes] = useState<Record<string, TransactionType>>({});
  // Added notification toast indicator
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  // Quick helper to calculate days left
  const getDaysLeft = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Search
      const matchesSearch =
        item.bagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hospitalProvince.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Blood Group
      const matchesGroup = selectedGroup === 'all' || item.bloodGroup === selectedGroup;

      // Rh
      const matchesRh = selectedRh === 'all' || item.rh === selectedRh;

      // Product
      const matchesProduct = selectedProduct === 'all' || item.productType === selectedProduct;

      // Transaction
      const matchesTx =
        selectedTransaction === 'all' || item.allowedTransactions.includes(selectedTransaction as TransactionType);

      // Hospital
      const matchesHospital = selectedHospital === 'all' || item.hospitalId === selectedHospital;

      return matchesSearch && matchesGroup && matchesRh && matchesProduct && matchesTx && matchesHospital;
    });
  }, [inventory, searchQuery, selectedGroup, selectedRh, selectedProduct, selectedTransaction, selectedHospital]);

  const handleAddToCart = (item: BloodInventoryItem) => {
    const qty = quantities[item.id] || 1;
    const txType = selectedTxTypes[item.id] || item.allowedTransactions[0] || 'ยืม';

    addToCart(item, qty, txType);

    setAddedItemNotice(item.id);
    setTimeout(() => {
      setAddedItemNotice(null);
    }, 2000);
  };

  const totalUnitsInNetwork = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
  const rareUnitsCount = inventory
    .filter((i) => i.rh === 'Negative')
    .reduce((sum, item) => sum + item.unitsAvailable, 0);
  const totalCartUnits = cart.reduce((sum, item) => sum + item.requestedUnits, 0);

  return (
    <div className="space-y-6">
      {/* Network Live Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-rose-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <svg className="w-80 h-80 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2 text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            เครือข่ายแลกเปลี่ยนโลหิตสดระหว่างโรงพยาบาล (Inter-Hospital Blood Exchange)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            คลังโลหิตพร้อมให้ยืมและแลกเปลี่ยน
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            โรงพยาบาลที่มีโลหิตสำรองสามารถโพสต์เปิดให้ยืมหรือแลกเปลี่ยน
            โรงพยาบาลปลายทางสามารถเลือกใส่ตระกร้า ส่งออเดอร์ขอเบิก และติดตามบันทึกประวัติการยืม-คืนได้อย่างเป็นระบบ
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div>
              <div className="text-xs text-slate-400 font-medium">โลหิตพร้อมยืมในระบบ</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {totalUnitsInNetwork} <span className="text-xs font-normal text-slate-400">ยูนิต</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-rose-300 font-medium flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> หมู่หายาก (Rh-Negative)
              </div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                {rareUnitsCount} <span className="text-xs font-normal text-slate-400">ยูนิต</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">โรงพยาบาลในเครือข่าย</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {INITIAL_HOSPITALS.length} <span className="text-xs font-normal text-slate-400">แห่ง</span>
              </div>
            </div>
            <div className="flex items-end justify-start sm:justify-end">
              <button
                type="button"
                onClick={openPostModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>โพสต์เลือดโรงพยาบาลคุณ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
        {/* Search Bar & Primary Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขถุง, โรงพยาบาล, จังหวัด, หรืออาการ..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
            >
              <option value="all">โรงพยาบาลทั้งหมด ({INITIAL_HOSPITALS.length} แห่ง)</option>
              {INITIAL_HOSPITALS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedTransaction}
              onChange={(e) => setSelectedTransaction(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
            >
              <option value="all">เงื่อนไข: ทั้งหมด</option>
              <option value="ยืม">เฉพาะ ยืม (Borrow)</option>
              <option value="แลกเปลี่ยน">เฉพาะ แลกเปลี่ยน (Exchange)</option>
              <option value="โอนให้ฟรี">เฉพาะ ให้ฟรี (Free Transfer)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white font-mono"
            >
              <option value="all">ผลิตภัณฑ์: ทั้งหมด</option>
              <option value="PRC">PRC (Packed Red Cells)</option>
              <option value="FFP">FFP (Fresh Frozen Plasma)</option>
              <option value="PC">PC (Platelet Concentrate)</option>
              <option value="SDP">SDP (Single Donor Platelet)</option>
              <option value="CRYO">CRYO (Cryoprecipitate)</option>
              <option value="WB">WB (Whole Blood)</option>
            </select>
          </div>
        </div>

        {/* Blood Group & Rh Segmented Interactive Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> หมู่เลือด ABO:
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              {['all', 'A', 'B', 'O', 'AB'].map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    selectedGroup === grp
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {grp === 'all' ? 'ทั้งหมด' : grp}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500">หมู่ Rh:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedRh('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedRh === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setSelectedRh('Positive')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedRh === 'Positive'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rh+ (ทั่วไป)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRh('Negative')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedRh === 'Negative'
                    ? 'bg-rose-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rh- (หายากพิเศษ)
              </button>
            </div>

            {(selectedGroup !== 'all' ||
              selectedRh !== 'all' ||
              selectedProduct !== 'all' ||
              selectedTransaction !== 'all' ||
              selectedHospital !== 'all' ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup('all');
                  setSelectedRh('all');
                  setSelectedProduct('all');
                  setSelectedTransaction('all');
                  setSelectedHospital('all');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 underline ml-2"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Cart Banner on Tablet & Desktop */}
      {cart.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-rose-950 flex items-center gap-2 flex-wrap">
                <span>ตระกร้าขอเบิกโลหิตของคุณ: {totalCartUnits} ยูนิต ({cart.length} รายการ)</span>
                <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">
                  พร้อมส่งออเดอร์
                </span>
              </div>
              <div className="text-[11px] text-rose-800 mt-1 flex items-center gap-1.5 flex-wrap">
                {cart.map((c) => (
                  <span
                    key={c.inventoryItem.id}
                    className="bg-white px-2 py-0.5 rounded border border-rose-200 font-mono text-[11px] shadow-2xs"
                  >
                    <strong>{c.inventoryItem.bloodGroup}</strong>{' '}
                    <span className="text-slate-500">{c.inventoryItem.rh === 'Negative' ? 'Rh-' : 'Rh+'}</span>{' '}
                    <span className="text-slate-700">{c.inventoryItem.productType}</span>{' '}
                    <span className="text-rose-700 font-bold">x{c.requestedUnits}</span>{' '}
                    <span className="text-slate-500 font-sans">({c.transactionType})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openCartDrawer}
              className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>เปิดตระกร้า &amp; ส่งออเดอร์ ({totalCartUnits} ยูนิต)</span>
            </button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          พบรายการพร้อมให้ยืม-แลกเปลี่ยน <span className="font-mono font-bold text-slate-800">{filteredInventory.length}</span> รายการ
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>ทุกถุงผ่านการตรวจคัดกรองเชื้อ 4 ชนิด (HIV, HCV, HBsAg, Syphilis)</span>
        </div>
      </div>

      {/* Grid of Blood Bags */}
      {filteredInventory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">ไม่พบรายการโลหิตที่ค้นหา</h3>
          <p className="text-xs text-slate-500 mb-4">
            ไม่มีโลหิตที่ตรงกับเงื่อนไขการค้นหาในขณะนี้ คุณสามารถโพสต์ร้องขอหรือปรับตัวกรองใหม่
          </p>
          <button
            type="button"
            onClick={openPostModal}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-medium rounded-xl hover:bg-rose-700 shadow-sm transition-all"
          >
            โพสต์รายการโลหิตใหม่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => {
            const daysLeft = getDaysLeft(item.expiryDate);
            const isMine = currentUser && item.hospitalId === currentUser.hospitalId;
            const currentSelectedQty = quantities[item.id] || 1;
            const currentSelectedTx = selectedTxTypes[item.id] || item.allowedTransactions[0];
            const isAdded = addedItemNotice === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative ${
                  item.rh === 'Negative'
                    ? 'border-rose-300 shadow-xs ring-1 ring-rose-200/50'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Urgent Rare Tag Banner */}
                {item.rh === 'Negative' && (
                  <div className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-current" /> หมู่โลหิตหายากพิเศษ (Rare Blood)
                    </span>
                    <span className="font-mono">Rh-Negative</span>
                  </div>
                )}

                {/* Card Main Body */}
                <div className="p-4 space-y-3">
                  {/* Top Row: Blood Group Hero & Product Identifier */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Big Medical Blood Group Box */}
                      <div
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-center border shrink-0 ${
                          item.rh === 'Negative'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="text-2xl leading-none font-extrabold">{item.bloodGroup}</span>
                        <span className="text-[10px] font-mono mt-0.5 tracking-wider font-semibold">
                          {item.rh === 'Negative' ? 'Rh-' : 'Rh+'}
                        </span>
                      </div>

                      {/* Product Name & Bag Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 font-mono">
                            {item.productType}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {item.volumeMl} ml
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          เลขถุง: <span className="font-semibold text-slate-700">{item.bagNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          สารกันเลือดแข็ง: {item.anticoagulant}
                        </div>
                      </div>
                    </div>

                    {/* Available Stock Tag */}
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">คงเหลือให้ยืม</div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {item.unitsAvailable} <span className="text-xs font-normal text-slate-500">ยูนิต</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Clinical indications */}
                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                      {item.notes}
                    </p>
                  )}

                  {/* Metadata Indicators (Zero-Pill discipline: unboxed with separators) */}
                  <div className="text-[11px] text-slate-500 space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-medium text-slate-800">{item.hospitalName}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{item.hospitalProvince}</span>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>การจัดเก็บ: {item.storageTemp}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>หมดอายุ: {item.expiryDate}</span>
                        <span
                          className={`font-semibold ${
                            daysLeft <= 5 ? 'text-amber-600' : 'text-slate-600'
                          }`}
                        >
                          ({daysLeft > 0 ? `เหลือ ${daysLeft} วัน` : 'หมดอายุแล้ว'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1 text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ผลตรวจเชื้อ 4 ชนิด: ผ่านเกณฑ์ (Non-Reactive)</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.contactPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 space-y-2.5">
                  {/* Transaction Selector Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">เงื่อนไข:</span>
                    <div className="flex items-center gap-1">
                      {item.allowedTransactions.map((tx) => (
                        <button
                          key={tx}
                          type="button"
                          onClick={() =>
                            setSelectedTxTypes((prev) => ({
                              ...prev,
                              [item.id]: tx,
                            }))
                          }
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                            currentSelectedTx === tx
                              ? 'bg-rose-600 text-white font-semibold shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tx}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity and Add to Cart Action */}
                  <div className="flex items-center gap-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                          }))
                        }
                        className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 text-xs font-mono font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 text-xs font-mono font-bold text-slate-800 text-center min-w-[28px]">
                        {currentSelectedQty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.min(item.unitsAvailable, (prev[item.id] || 1) + 1),
                          }))
                        }
                        className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 text-xs font-mono font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Basket Button */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={item.unitsAvailable <= 0}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : item.unitsAvailable <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-rose-600 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>เพิ่มลงตระกร้าแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>ใส่ตระกร้า ({currentSelectedTx})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isMine && (
                    <div className="text-[10px] text-center text-rose-600 font-medium">
                      * รายการนี้เป็นโพสต์ของโรงพยาบาลคุณ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
