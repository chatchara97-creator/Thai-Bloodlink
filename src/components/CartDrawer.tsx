import React, { useState } from 'react';
import { useBlood } from '../context/BloodContext';
import { useAuth } from '../context/AuthContext';
import { TransactionType, RequisitionOrder } from '../types/blood';
import {
  X,
  ShoppingBag,
  Trash2,
  Building2,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  Send,
  Truck,
  HeartPulse,
  ArrowRightLeft,
} from 'lucide-react';

import { VoucherDocType } from './PrintVoucherModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrders: () => void;
  onPrintOrder: (order: RequisitionOrder, docType?: VoucherDocType) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onViewOrders,
  onPrintOrder,
}) => {
  const { cart, removeFromCart, updateCartItemQuantity, clearCart, submitOrderFromCart } = useBlood();
  const { currentUser } = useAuth();

  // Logistics & Inter-hospital notes
  const [courierName, setCourierName] = useState('นายสมชาย ขนส่งเวชภัณฑ์ด่วน');
  const [courierPhone, setCourierPhone] = useState('089-555-8899');
  const [packagingType, setPackagingType] = useState('กล่อง Cold Chain ได้รับการรับรองพร้อม Ice Pack (2°C-6°C)');
  const [generalNotes, setGeneralNotes] = useState('ขอเบิกสำรองคลังเลือดระหว่างโรงพยาบาลตามระบบเครือข่าย');

  // Exchange and loan terms override per item
  const [returnDates, setReturnDates] = useState<Record<string, string>>({});
  const [exchangeNotes, setExchangeNotes] = useState<Record<string, string>>({});

  // Submission result state
  const [createdOrders, setCreatedOrders] = useState<RequisitionOrder[] | null>(null);

  if (!isOpen) return null;

  const totalUnits = cart.reduce((sum, item) => sum + item.requestedUnits, 0);

  // Group items by donor hospital
  const groupedByHospital = cart.reduce((acc, item) => {
    const hid = item.inventoryItem.hospitalId;
    if (!acc[hid]) acc[hid] = [];
    acc[hid].push(item);
    return acc;
  }, {} as Record<string, typeof cart>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrders = submitOrderFromCart({
      courierName: courierName.trim() || 'พนักงานขับรถขนส่งเวชภัณฑ์',
      courierPhone: courierPhone.trim() || '08X-XXX-XXXX',
      packagingType,
      notes: generalNotes.trim(),
    });

    setCreatedOrders(newOrders);
  };

  const handlePrintDraftOrder = (targetDocType?: VoucherDocType) => {
    if (cart.length === 0) return;
    const firstHospital = cart[0].inventoryItem;
    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    const draftOrder: RequisitionOrder = {
      id: 'draft-' + Date.now(),
      orderNumber: `REQ-${now.toISOString().slice(0, 10).replace(/-/g, '')}-DRAFT`,
      createdAt: `${dateStr} ${timeStr}`,
      requestingHospitalId: currentUser?.hospitalId || 'hosp-siriraj',
      requestingHospitalName: currentUser?.hospitalName || 'โรงพยาบาลศิริราช',
      requestingStaffName: currentUser?.name || 'เจ้าหน้าที่เวรคลังเลือด',
      requestingStaffEmail: currentUser?.email || 'siriraj.blood@moph.go.th',
      requestingStaffPhone: currentUser?.phone || '02-419-7000',
      issuingHospitalId: firstHospital.hospitalId,
      issuingHospitalName: firstHospital.hospitalName,
      issuingStaffName: firstHospital.contactPerson || 'เจ้าหน้าที่คลังเลือดต้นทาง',
      issuingStaffPhone: firstHospital.contactPhone,
      status: 'pending',
      items: cart.map((c, idx) => ({
        id: `draft-item-${idx}`,
        originalInventoryId: c.inventoryItem.id,
        bagNumber: c.inventoryItem.bagNumber,
        bloodGroup: c.inventoryItem.bloodGroup,
        rh: c.inventoryItem.rh,
        productType: c.inventoryItem.productType,
        units: c.requestedUnits,
        volumeMl: c.inventoryItem.volumeMl,
        expiryDate: c.inventoryItem.expiryDate,
        transactionType: c.transactionType,
        returnDueDate: returnDates[c.inventoryItem.id] || (c.transactionType === 'ยืม' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : undefined),
        exchangeOfferDescription: exchangeNotes[c.inventoryItem.id] || (c.transactionType === 'แลกเปลี่ยน' ? `แลกเปลี่ยนโลหิต ${c.inventoryItem.bloodGroup} ${c.requestedUnits} ถุง` : undefined),
        returnedUnits: 0,
        returnCompleted: false,
      })),
      coldChain: {
        packagingType,
        targetTemp: '2°C - 6°C (Cold Chain Standard)',
        courierName: courierName || 'เจ้าหน้าที่ขนส่งเวชภัณฑ์ด่วน',
        courierPhone: courierPhone || '08X-XXX-XXXX',
      },
      loanReturnDetails: cart.some((c) => c.transactionType === 'ยืม')
        ? {
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            isOverdue: false,
            totalUnitsBorrowed: cart.filter((c) => c.transactionType === 'ยืม').reduce((s, c) => s + c.requestedUnits, 0),
            totalUnitsReturned: 0,
            returnLogs: [],
          }
        : undefined,
      timeline: [
        {
          status: 'pending',
          title: 'สร้างร่างคำขอเบิก/ยืมคืนโลหิต (Draft Requisition)',
          timestamp: timeStr,
          actor: currentUser?.name || 'เจ้าหน้าที่',
          hospital: currentUser?.hospitalName || 'โรงพยาบาล',
          notes: generalNotes,
        },
      ],
    };

    const chosenType = targetDocType || (cart.some(c => c.transactionType === 'ยืม') ? 'loan' : cart.some(c => c.transactionType === 'แลกเปลี่ยน') ? 'exchange' : 'order');
    onPrintOrder(draftOrder, chosenType);
  };

  const handleFinish = () => {
    setCreatedOrders(null);
    onClose();
    onViewOrders();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">ตระกร้าขอเบิกโลหิต</h2>
                <p className="text-xs text-slate-400">
                  {cart.length > 0 ? `มีรายการโลหิตรอส่งออเดอร์ ${totalUnits} ยูนิต` : 'ตระกร้าว่าง'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {createdOrders ? (
              /* Success confirmation state with direct print vouchers */
              <div className="space-y-6 text-center py-6">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">ส่งคำขอเบิกโลหิตสำเร็จเรียบร้อย!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    ระบบได้ส่งออเดอร์ไปยังโรงพยาบาลต้นทางและบันทึกประวัติการยืม-แลกเปลี่ยนเข้าระบบกลางแล้ว
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="text-xs font-semibold text-slate-700">ใบออเดอร์ที่ถูกสร้าง:</div>
                  {createdOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-900">
                          {ord.orderNumber}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          ปลายทาง: <span className="font-medium text-rose-700">{ord.issuingHospitalName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          จำนวน: {ord.items.reduce((s, i) => s + i.units, 0)} ยูนิต ({ord.items.map((i) => i.transactionType).join(', ')})
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => onPrintOrder(ord, 'order')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold shadow-xs"
                          title="พิมพ์ใบสร้างออเดอร์ขอเบิก"
                        >
                          <Printer className="w-3.5 h-3.5 text-rose-600" />
                          <span>พิมพ์ใบสร้างออเดอร์</span>
                        </button>
                        {ord.items.some((i) => i.transactionType === 'ยืม') && (
                          <button
                            type="button"
                            onClick={() => onPrintOrder(ord, 'loan')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold shadow-xs"
                            title="พิมพ์ใบยืมโลหิต"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>พิมพ์ใบยืม</span>
                          </button>
                        )}
                        {ord.items.some((i) => i.transactionType === 'แลกเปลี่ยน') && (
                          <button
                            type="button"
                            onClick={() => onPrintOrder(ord, 'exchange')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold shadow-xs"
                            title="พิมพ์ใบแลกเปลี่ยนโลหิต"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                            <span>พิมพ์ใบแลกเปลี่ยน</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="w-full py-2.5 bg-rose-600 text-white font-medium text-xs rounded-xl hover:bg-rose-700 shadow-sm"
                  >
                    ดูประวัติคำขอและการยืม-คืนทั้งหมด &rarr;
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">ไม่มีรายการในตระกร้า</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  เลือกโลหิตที่ต้องการจากหน้าคลังแล้วกด "ใส่ตระกร้า" เพื่อรวมรายการส่งคำขอ
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
                >
                  กลับไปเลือกโลหิต
                </button>
              </div>
            ) : (
              <form id="cart-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Requester Hospital Summary */}
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="text-rose-900 font-semibold">โรงพยาบาลผู้ขอเบิก:</span>
                    <div className="text-rose-800 font-medium mt-0.5">
                      {currentUser?.hospitalName || 'โรงพยาบาลศิริราช'}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-rose-700 font-mono">
                    ผู้ดำเนินการ: {currentUser?.name || 'เจ้าหน้าที่คลังเลือด'}
                  </div>
                </div>

                {/* Items Grouped by Issuing Hospital */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>รายการโลหิตที่เลือก ({cart.length} รายการ)</span>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs text-rose-600 hover:text-rose-800 font-normal underline"
                    >
                      ล้างตระกร้า
                    </button>
                  </div>

                  {Object.entries(groupedByHospital).map(([hospId, items]) => (
                    <div key={hospId} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                      <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-rose-600" />
                          {items[0].inventoryItem.hospitalName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {items.reduce((s, i) => s + i.requestedUnits, 0)} ยูนิต
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 p-2 space-y-2">
                        {items.map((cartItem) => {
                          const item = cartItem.inventoryItem;
                          return (
                            <div key={item.id} className="p-2 bg-white rounded-lg border border-slate-100 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-bold font-mono text-xs border ${
                                      item.rh === 'Negative'
                                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                                        : 'bg-slate-100 text-slate-800 border-slate-200'
                                    }`}
                                  >
                                    <span>{item.bloodGroup}</span>
                                    <span className="text-[9px] leading-none">
                                      {item.rh === 'Negative' ? 'Rh-' : 'Rh+'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-900 font-mono">
                                      {item.productType} ({item.volumeMl} ml)
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono">
                                      ถุง: {item.bagNumber} · หมดอายุ: {item.expiryDate}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Stepper */}
                                  <div className="flex items-center border border-slate-200 rounded-md">
                                    <button
                                      type="button"
                                      onClick={() => updateCartItemQuantity(item.id, cartItem.requestedUnits - 1)}
                                      className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-mono text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 text-xs font-mono font-bold text-slate-800">
                                      {cartItem.requestedUnits}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateCartItemQuantity(item.id, cartItem.requestedUnits + 1)}
                                      className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-mono text-xs"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    title="ลบรายการ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Transaction Type Details */}
                              <div className="pt-1 text-[11px] space-y-1.5 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">ประเภทคำขอ:</span>
                                  <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                    {cartItem.transactionType}
                                  </span>
                                </div>

                                {cartItem.transactionType === 'ยืม' && (
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-500">กำหนดส่งคืน (ประมาณการ):</span>
                                    <input
                                      type="date"
                                      value={
                                        returnDates[item.id] ||
                                        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                                          .toISOString()
                                          .slice(0, 10)
                                      }
                                      onChange={(e) =>
                                        setReturnDates((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      className="px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                                    />
                                  </div>
                                )}

                                {cartItem.transactionType === 'แลกเปลี่ยน' && (
                                  <div>
                                    <label className="text-slate-500 block mb-0.5">
                                      ข้อเสนอแลกเปลี่ยนสิ่งตอบแทน:
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        exchangeNotes[item.id] ||
                                        `แลกเปลี่ยนด้วยหมู่ ${item.bloodGroup} Rh+ จำนวน ${cartItem.requestedUnits} ถุง`
                                      }
                                      onChange={(e) =>
                                        setExchangeNotes((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="เช่น แลกเปลี่ยนด้วย PRC Group O+ 2 ถุง..."
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-rose-500 focus:outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inter-hospital notes */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
                  <label className="block text-xs font-semibold text-slate-800">
                    บันทึก / วัตถุประสงค์การยืม-แลกเปลี่ยนระหว่างโรงพยาบาล
                  </label>
                  <input
                    type="text"
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="เช่น ขอเบิกสำรองคลังเลือดฉุกเฉิน, ปรับสมดุลคลังเลือดระหว่างเขต..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Cold Chain Transport Logistics */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-slate-700" />
                    การขนส่งควบคุมห่วงโซ่ความเย็น (Cold Chain Logistics)
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      มาตรฐานบรรจุภัณฑ์ขนส่ง
                    </label>
                    <select
                      value={packagingType}
                      onChange={(e) => setPackagingType(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                    >
                      <option value="กล่อง Cold Chain ได้รับการรับรองพร้อม Ice Pack (2°C-6°C)">
                        กล่องโฟมควบคุมอุณหภูมิพร้อม Ice Pack (2°C - 6°C) สำหรับ PRC, WB
                      </option>
                      <option value="Dry Ice Container ควบคุมความเย็นลึก (< -20°C)">
                        ภาชนะ Dry Ice ควบคุมความเย็นลึก (&lt; -20°C) สำหรับ FFP, CRYO
                      </option>
                      <option value="กล่องฉนวนความร้อนพร้อมเครื่องเขย่าอุณหภูมิห้อง (20°C-24°C)">
                        กล่องควบคุมอุณหภูมิห้อง (20°C - 24°C) สำหรับ Platelets (PC, SDP)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        ผู้มารับ / พนักงานขับรถพยาบาล
                      </label>
                      <input
                        type="text"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="ชื่อ-นามสกุล คนขับ"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        เบอร์ติดต่อคนขับ
                      </label>
                      <input
                        type="text"
                        value={courierPhone}
                        onChange={(e) => setCourierPhone(e.target.value)}
                        placeholder="08X-XXX-XXXX"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer Submit Actions */}
          {!createdOrders && cart.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>ยอดรวมโลหิตทั้งหมด:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {totalUnits} ยูนิต ({Object.keys(groupedByHospital).length} โรงพยาบาลปลายทาง)
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  form="cart-form"
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>ส่งคำขอเบิกไปยังโรงพยาบาลต้นทาง (สร้างใบออเดอร์)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintDraftOrder('order')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="พิมพ์ใบสร้างออเดอร์และใบยืมคืนก่อนส่ง"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-600" />
                  <span>พิมพ์ใบสร้างออเดอร์ / ใบยืมคืน (แบบร่างคำขอ)</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-500">
                ระบบจะสร้างใบสั่งการ Requisition Voucher พร้อมเลขที่เอกสารทางการแพทย์เพื่อพิมพ์ใช้แนบการขนส่ง
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
