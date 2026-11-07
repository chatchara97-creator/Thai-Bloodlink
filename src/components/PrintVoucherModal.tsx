import React, { useEffect, useState } from 'react';
import { RequisitionOrder } from '../types/blood';
import {
  Printer,
  X,
  ArrowLeft,
  CheckSquare,
  FileText,
  RotateCcw,
  ArrowRightLeft,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Thermometer,
} from 'lucide-react';

export type VoucherDocType = 'order' | 'loan' | 'exchange' | 'return';

interface PrintVoucherModalProps {
  order: RequisitionOrder | null;
  initialDocType?: VoucherDocType;
  onClose: () => void;
}

export const PrintVoucherModal: React.FC<PrintVoucherModalProps> = ({
  order,
  initialDocType = 'order',
  onClose,
}) => {
  const [docType, setDocType] = useState<VoucherDocType>(initialDocType);

  // Sync initialDocType when order or initialDocType changes
  useEffect(() => {
    if (initialDocType) {
      setDocType(initialDocType);
    } else if (order) {
      const hasLoan = order.items.some((i) => i.transactionType === 'ยืม');
      const hasExchange = order.items.some((i) => i.transactionType === 'แลกเปลี่ยน');
      if (order.status === 'returned') {
        setDocType('return');
      } else if (hasLoan) {
        setDocType('loan');
      } else if (hasExchange) {
        setDocType('exchange');
      } else {
        setDocType('order');
      }
    }
  }, [order, initialDocType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalUnits = order.items.reduce((s, i) => s + i.units, 0);

  // Determine document title and subtitle based on selected docType
  const getDocTitles = () => {
    switch (docType) {
      case 'order':
        return {
          th: 'ใบสั่งการสร้างออเดอร์และขอเบิกโลหิตระหว่างโรงพยาบาล',
          en: 'Inter-Hospital Blood Bank Requisition & Dispatch Order Slip',
          badge: 'ใบสร้างออเดอร์ขอเบิก (Requisition Order)',
          color: 'border-rose-900 bg-rose-50/50',
        };
      case 'loan':
        return {
          th: 'ใบสำคัญการยืมโลหิตและข้อตกลงการส่งคืนทดแทน',
          en: 'Inter-Hospital Blood Loan Agreement & Handover Voucher',
          badge: 'ใบยืมโลหิต (Blood Loan Agreement)',
          color: 'border-blue-900 bg-blue-50/50',
        };
      case 'exchange':
        return {
          th: 'ใบสำคัญการแลกเปลี่ยนโลหิตและผลิตภัณฑ์โลหิตระหว่างโรงพยาบาล',
          en: 'Inter-Hospital Blood Exchange Settlement & Reciprocal Voucher',
          badge: 'ใบแลกเปลี่ยนโลหิต (Blood Exchange Voucher)',
          color: 'border-amber-900 bg-amber-50/50',
        };
      case 'return':
        return {
          th: 'ใบบันทึกและยืนยันการส่งคืนโลหิตทดแทน (ใบเสร็จรับคืน)',
          en: 'Inter-Hospital Blood Return & Clearance Certificate',
          badge: 'ใบบันทึกส่งคืนโลหิต (Blood Return Voucher)',
          color: 'border-emerald-900 bg-emerald-50/50',
        };
    }
  };

  const titles = getDocTitles();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in print:p-0 print:bg-white"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-300 print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Control Bar (Hidden when printing) */}
        <div className="no-print sticky top-0 z-20 bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Back button and Order Reference */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                title="ย้อนกลับไปหน้าก่อนหน้า (ESC)"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
              <div>
                <h3 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-xs font-mono">
                  {order.orderNumber}
                </h3>
              </div>
            </div>

            {/* Document Type Switcher Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setDocType('order')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  docType === 'order'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>ใบสร้างออเดอร์</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('loan')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  docType === 'loan'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>ใบยืม</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('exchange')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  docType === 'exchange'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>ใบแลกเปลี่ยน</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('return')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  docType === 'return'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>ใบส่งคืน</span>
              </button>
            </div>

            {/* Print and Close buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์เอกสาร / บันทึก PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="ปิดหน้าต่าง (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Printable Document Paper View */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white text-xs leading-relaxed max-w-full overflow-x-auto print:p-6 print:text-[10px]">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-700 inline" />
                  <span>เครือข่ายบริการโลหิตแห่งชาติ · กระทรวงสาธารณสุข &amp; สภากาชาดไทย</span>
                </div>
                <h1 className="text-base sm:text-xl font-extrabold text-slate-950 tracking-tight">
                  {titles.th}
                </h1>
                <p className="text-[10px] text-slate-500 font-mono">
                  {titles.en}
                </p>
              </div>

              {/* Barcode & Document Meta */}
              <div className="text-right shrink-0">
                <div className="font-mono text-xl tracking-[0.25em] font-bold text-slate-900 select-none">
                  ||| | |||| | ||||| | |||
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                  เลขที่: {order.orderNumber}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  วันที่ออกเอกสาร: {order.createdAt} น.
                </div>
              </div>
            </div>

            {/* Document Badges */}
            <div className="mt-4 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">แบบฟอร์ม:</span>
                <span className="px-2.5 py-0.5 rounded font-bold text-slate-900 border border-slate-400 bg-slate-50 font-mono text-xs">
                  {titles.badge}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">สถานะคำขอในระบบ:</span>
                <span className="font-mono font-bold text-slate-900">
                  {order.status === 'pending'
                    ? 'รออนุมัติ (Pending)'
                    : order.status === 'approved'
                    ? 'อนุมัติแล้ว (Approved)'
                    : order.status === 'in_transit'
                    ? 'ระหว่างการขนส่ง (In Transit)'
                    : order.status === 'received'
                    ? 'ได้รับแล้ว / อยู่ระหว่างยืม (Active)'
                    : order.status === 'returned'
                    ? 'คืนโลหิตสมบูรณ์แล้ว (Fully Returned)'
                    : 'เสร็จสิ้น (Completed)'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1 & 2: Hospital Information */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Requester */}
            <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/60">
              <div className="text-[10px] font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2">
                1. โรงพยาบาลผู้ขอเบิก / ขอยืม (Requesting Hospital)
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm">{order.requestingHospitalName}</div>
                <div>
                  <span className="text-slate-500">เจ้าหน้าที่ผู้ดำเนินการ:</span>{' '}
                  <span className="font-medium">{order.requestingStaffName}</span>
                </div>
                <div>
                  <span className="text-slate-500">อีเมล Gmail ผู้รับผิดชอบ:</span>{' '}
                  <span className="font-mono">{order.requestingStaffEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500">โทรศัพท์คลังเลือด:</span>{' '}
                  <span className="font-mono">{order.requestingStaffPhone}</span>
                </div>
              </div>
            </div>

            {/* Issuer */}
            <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/60">
              <div className="text-[10px] font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2">
                2. โรงพยาบาลผู้จ่าย / ให้ยืม (Issuing Hospital)
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm">{order.issuingHospitalName}</div>
                <div>
                  <span className="text-slate-500">เจ้าหน้าที่ผู้จ่ายโลหิต:</span>{' '}
                  <span className="font-medium">{order.issuingStaffName || 'เจ้าหน้าที่เวรคลังเลือด'}</span>
                </div>
                <div>
                  <span className="text-slate-500">เบอร์สายด่วนฉุกเฉิน:</span>{' '}
                  <span className="font-mono">{order.issuingStaffPhone || '02-XXX-XXXX'}</span>
                </div>
                <div>
                  <span className="text-slate-500">มาตรฐานการเชื่อมต่อ:</span>{' '}
                  <span className="font-medium text-emerald-700">ยืนยันผ่านระบบ Thai BloodLink</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Blood Products Table */}
          <div className="mb-5">
            <div className="text-[10px] font-bold text-slate-900 uppercase mb-2 flex items-center justify-between">
              <span>3. รายการโลหิตและผลิตภัณฑ์โลหิต (Blood Components &amp; Bags)</span>
              <span className="font-mono text-slate-500">จำนวน {order.items.length} รายการ</span>
            </div>
            <table className="w-full border-collapse border border-slate-400 text-center text-xs print:text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-[10px]">
                  <th className="p-2 border-r border-slate-300 w-8">ที่</th>
                  <th className="p-2 border-r border-slate-300 text-left">หมายเลขถุง (Bag ID)</th>
                  <th className="p-2 border-r border-slate-300 w-24">หมู่เลือด (ABO / Rh)</th>
                  <th className="p-2 border-r border-slate-300 w-24">ชนิดผลิตภัณฑ์</th>
                  <th className="p-2 border-r border-slate-300 w-16">ปริมาตร</th>
                  <th className="p-2 border-r border-slate-300 w-16">จำนวน</th>
                  <th className="p-2 border-r border-slate-300 w-24">วันหมดอายุ</th>
                  <th className="p-2 border-r border-slate-300">ประเภทคำขอ &amp; ข้อกำหนด</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-2 border-r border-slate-300 font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-300 text-left font-mono font-bold">
                      {item.bagNumber}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold">
                      <span className="text-sm font-extrabold">{item.bloodGroup}</span>{' '}
                      <span className="text-[10px] text-slate-600 font-mono">
                        ({item.rh === 'Negative' ? 'Rh-' : 'Rh+'})
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-300 font-mono font-semibold">
                      {item.productType}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-mono">
                      {item.volumeMl} ml
                    </td>
                    <td className="p-2 border-r border-slate-300 font-mono font-bold text-sm">
                      {item.units}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-mono">
                      {item.expiryDate}
                    </td>
                    <td className="p-2 text-left text-[10px]">
                      <div className="font-bold text-slate-900">{item.transactionType}</div>
                      {item.returnDueDate && (
                        <div className="text-rose-700 font-mono font-medium">
                          กำหนดส่งคืน: {item.returnDueDate}
                        </div>
                      )}
                      {item.exchangeOfferDescription && (
                        <div className="text-slate-600 italic">{item.exchangeOfferDescription}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-400">
                  <td colSpan={5} className="p-2 text-right border-r border-slate-300">
                    ยอดรวมโลหิตทั้งหมด:
                  </td>
                  <td className="p-2 font-mono text-base border-r border-slate-300 font-extrabold text-rose-800">
                    {totalUnits}
                  </td>
                  <td colSpan={2} className="p-2 text-left text-[10px] text-slate-600 font-normal">
                    ยูนิต (Units)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Section 4: Specific Clauses based on docType */}
          {docType === 'loan' && (
            <div className="p-3.5 border-2 border-blue-900/40 rounded-lg mb-5 bg-blue-50/40 text-[11px] space-y-2">
              <div className="font-bold text-blue-950 uppercase text-xs flex items-center gap-1.5 border-b border-blue-200 pb-1">
                <span>ข้อตกลงและเงื่อนไขการยืมโลหิต (Blood Loan Terms &amp; Covenant)</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                1. โรงพยาบาลผู้ขอยืมตกลงจะนำส่งโลหิตทดแทน (Component &amp; Group ที่ตกลงกัน) ให้แก่โรงพยาบาลผู้ให้ยืมภายในกำหนด{' '}
                <strong className="text-blue-950 font-mono font-bold">
                  {order.loanReturnDetails?.dueDate || '14 วันทำการนับจากวันที่เบิกจ่าย'}
                </strong>
              </p>
              <p className="text-slate-700 leading-relaxed">
                2. โลหิตที่นำมาส่งคืนทดแทนต้องผ่านการตรวจคัดกรองการติดเชื้อ 4 ชนิด (HIV, HCV, HBsAg, Syphilis) ตามมาตรฐานของศูนย์บริการโลหิตแห่งชาติ สภากาชาดไทย และมีอายุการใช้งานไม่น้อยกว่า 21 วัน
              </p>
              <p className="text-slate-700 leading-relaxed">
                3. การขนส่งโลหิตคืนจะต้องใช้กล่องควบคุมความเย็นและอุปกรณ์ตรวจวัดอุณหภูมิตามมาตรฐานสากล
              </p>
            </div>
          )}

          {docType === 'exchange' && (
            <div className="p-3.5 border-2 border-amber-900/40 rounded-lg mb-5 bg-amber-50/40 text-[11px] space-y-2">
              <div className="font-bold text-amber-950 uppercase text-xs flex items-center gap-1.5 border-b border-amber-200 pb-1">
                <span>ข้อตกลงการแลกเปลี่ยนโลหิตต่างหมู่ / ผลิตภัณฑ์ (Blood Exchange Covenant)</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                1. เอกสารนี้ใช้เป็นหลักฐานการแลกเปลี่ยนโลหิตเพื่อปรับสมดุลปริมาณเลือดสำรอง (Blood Inventory Balancing) ระหว่างโรงพยาบาลทั้งสองแห่ง
              </p>
              <p className="text-slate-700 leading-relaxed">
                2. สิ่งตอบแทนที่ส่งมอบแลกเปลี่ยน: <span className="font-medium text-amber-950">{order.items.map((i) => i.exchangeOfferDescription || `${i.bloodGroup} ${i.units} ยูนิต`).join(', ')}</span>
              </p>
              <p className="text-slate-700 leading-relaxed">
                3. โลหิตที่แลกเปลี่ยนทุกยูนิตได้รับการตรวจความเข้ากันได้และการคัดกรองตามเกณฑ์มาตรฐานเวชศาสตร์บริการโลหิต
              </p>
            </div>
          )}

          {docType === 'return' && (
            <div className="p-3.5 border-2 border-emerald-900/40 rounded-lg mb-5 bg-emerald-50/40 text-[11px] space-y-2">
              <div className="font-bold text-emerald-950 uppercase text-xs flex items-center justify-between border-b border-emerald-200 pb-1">
                <span>บันทึกการส่งคืนโลหิตทดแทน (Blood Return &amp; Settlement Log)</span>
                <span className="font-mono text-emerald-800">
                  ยอดยืม: {order.loanReturnDetails?.totalUnitsBorrowed || totalUnits} ยูนิต · คืนแล้ว: {order.loanReturnDetails?.totalUnitsReturned || 0} ยูนิต
                </span>
              </div>

              {order.loanReturnDetails && order.loanReturnDetails.returnLogs.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {order.loanReturnDetails.returnLogs.map((log, lidx) => (
                    <div
                      key={log.id}
                      className="text-[10px] p-2 bg-white rounded border border-emerald-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-emerald-950">ส่งคืนครั้งที่ {lidx + 1} ({log.returnDate} น.):</span> คืนจำนวน {log.unitsReturned} ยูนิต (ถุง: {log.returnedBagNumbers.join(', ')})
                      </div>
                      <div className="font-mono text-slate-700">
                        อุณหภูมิ: {log.coldChainTemp}°C · <span className="text-emerald-700 font-semibold">{log.conditionCheck}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 italic text-[10px]">
                  * อยู่ระหว่างขั้นตอนการจัดส่งคืน หรือส่งคืนครบถ้วนตามรายการในออเดอร์
                </div>
              )}
            </div>
          )}

          {/* Section 5: Cold Chain Transport Record */}
          <div className="p-3 border border-slate-300 rounded-lg mb-5">
            <div className="text-[10px] font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2">
              {docType === 'return' ? '5. การขนส่งควบคุมความเย็นในเที่ยวส่งคืน' : '4. บันทึกการควบคุมห่วงโซ่ความเย็นและการขนส่ง (Cold Chain Transport Validation)'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500">ภาชนะบรรจุ:</span>
                <div className="font-medium text-slate-900 mt-0.5">{order.coldChain.packagingType}</div>
              </div>
              <div>
                <span className="text-slate-500">อุณหภูมิเป้าหมาย:</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{order.coldChain.targetTemp}</div>
              </div>
              <div>
                <span className="text-slate-500">อุณหภูมิ ณ จุดจ่าย (ต้นทาง):</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  {order.coldChain.departureTemp !== undefined ? `${order.coldChain.departureTemp} °C` : 'รอตรวจวัด'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">อุณหภูมิ ณ จุดรับ (ปลายทาง):</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  {order.coldChain.arrivalTemp !== undefined ? `${order.coldChain.arrivalTemp} °C` : 'รอตรวจวัด'}
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
              <div><span className="text-slate-500">ผู้นำส่ง:</span> <span className="font-medium">{order.coldChain.courierName}</span></div>
              <div><span className="text-slate-500">เบอร์โทรผู้นำส่ง:</span> <span className="font-mono">{order.coldChain.courierPhone}</span></div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">สภาพบรรจุภัณฑ์:</span>
                <span className="flex items-center gap-1 font-medium text-slate-900">
                  <CheckSquare className="w-3.5 h-3.5 text-slate-800" /> สมบูรณ์ ซีลมิดชิด
                </span>
              </div>
            </div>
          </div>

          {/* Section 6: Official Signatures */}
          <div className="mt-6 pt-3 border-t-2 border-slate-900">
            <div className="text-[10px] font-bold text-slate-900 uppercase mb-3 text-center tracking-wider">
              การลงนามรับรองความถูกต้องตามมาตรฐานเวชศาสตร์บริการโลหิต
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {/* Sign 1: Requester */}
              <div className="border border-slate-300 p-2.5 rounded-lg flex flex-col justify-between h-32">
                <div className="text-[9px] text-slate-500 font-bold uppercase">1. ผู้ขอเบิก / ผู้รับผิดชอบ</div>
                <div className="border-b border-dashed border-slate-400 my-1 pt-6" />
                <div className="text-[9px] text-slate-800">
                  ({order.requestingStaffName})<br />
                  <span className="text-slate-500">นักเทคนิคการแพทย์ ผู้ขอเบิก</span>
                </div>
              </div>

              {/* Sign 2: Dispenser */}
              <div className="border border-slate-300 p-2.5 rounded-lg flex flex-col justify-between h-32">
                <div className="text-[9px] text-slate-500 font-bold uppercase">2. ผู้จ่ายโลหิต (ต้นทาง)</div>
                <div className="border-b border-dashed border-slate-400 my-1 pt-6" />
                <div className="text-[9px] text-slate-800">
                  ({order.issuingStaffName || 'เจ้าหน้าที่ผู้จ่ายโลหิต'})<br />
                  <span className="text-slate-500">นักเทคนิคการแพทย์ คลังเลือดต้นทาง</span>
                </div>
              </div>

              {/* Sign 3: Courier */}
              <div className="border border-slate-300 p-2.5 rounded-lg flex flex-col justify-between h-32">
                <div className="text-[9px] text-slate-500 font-bold uppercase">3. ผู้นำส่ง (Cold Chain)</div>
                <div className="border-b border-dashed border-slate-400 my-1 pt-6" />
                <div className="text-[9px] text-slate-800">
                  ({order.coldChain.courierName})<br />
                  <span className="text-slate-500">พนักงานขนส่งควบคุมความเย็น</span>
                </div>
              </div>

              {/* Sign 4: Receiver */}
              <div className="border border-slate-300 p-2.5 rounded-lg flex flex-col justify-between h-32">
                <div className="text-[9px] text-slate-500 font-bold uppercase">4. ผู้ตรวจรับโลหิต (ปลายทาง)</div>
                <div className="border-b border-dashed border-slate-400 my-1 pt-6" />
                <div className="text-[9px] text-slate-800">
                  (....................................................)<br />
                  <span className="text-slate-500">ผู้รับมอบและตรวจสอบคุณภาพถุง</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[9px] text-slate-400 flex items-center justify-between border-t border-slate-200 pt-2 font-mono">
              <span>Thai BloodLink System © {new Date().getFullYear()} · สำนักงานหลักประกันสุขภาพแห่งชาติ</span>
              <span>ต้นฉบับ: แนบพร้อมกล่องขนส่งโลหิต · สำเนา: บันทึกเวชระเบียนคลังเลือด</span>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับไปหน้าก่อนหน้า</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / บันทึก PDF (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
