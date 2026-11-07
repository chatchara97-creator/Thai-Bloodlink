import React, { useState, useMemo } from 'react';
import { useBlood } from '../context/BloodContext';
import { useAuth } from '../context/AuthContext';
import { RequisitionOrder, OrderStatus } from '../types/blood';
import {
  FileText,
  Printer,
  RotateCcw,
  CheckCircle,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Building2,
  Calendar,
  Thermometer,
  ArrowRight,
  Filter,
  Search,
  Check,
  Send,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import { VoucherDocType } from './PrintVoucherModal';

interface OrderManagementProps {
  onPrintOrder: (order: RequisitionOrder, docType?: VoucherDocType) => void;
  onOpenReturnModal: (order: RequisitionOrder) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  onPrintOrder,
  onOpenReturnModal,
}) => {
  const { orders, updateOrderStatus } = useBlood();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'outgoing' | 'incoming' | 'loans'>('outgoing');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Modal for logging dispatch / receipt temperature
  const [tempModal, setTempModal] = useState<{
    orderId: string;
    type: 'dispatch' | 'receive';
    orderNumber: string;
  } | null>(null);
  const [inputTemp, setInputTemp] = useState<number>(3.8);

  const myHospitalId = currentUser?.hospitalId || 'hosp-01';

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Subtab routing
      if (activeSubTab === 'outgoing' && ord.requestingHospitalId !== myHospitalId) {
        return false;
      }
      if (activeSubTab === 'incoming' && ord.issuingHospitalId !== myHospitalId) {
        return false;
      }
      if (activeSubTab === 'loans') {
        const isLoan = ord.items.some((i) => i.transactionType === 'ยืม');
        if (!isLoan) return false;
      }

      // Status
      if (statusFilter !== 'all' && ord.status !== statusFilter) {
        return false;
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          ord.orderNumber.toLowerCase().includes(q) ||
          ord.requestingHospitalName.toLowerCase().includes(q) ||
          ord.issuingHospitalName.toLowerCase().includes(q) ||
          ord.items.some((i) => i.bagNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [orders, activeSubTab, myHospitalId, statusFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleApprove = (ord: RequisitionOrder) => {
    updateOrderStatus(ord.id, 'approved', 'โรงพยาบาลต้นทางตรวจสอบและอนุมัติจ่ายโลหิต');
  };

  const handleOpenDispatch = (ord: RequisitionOrder) => {
    setInputTemp(3.5);
    setTempModal({ orderId: ord.id, type: 'dispatch', orderNumber: ord.orderNumber });
  };

  const handleOpenReceive = (ord: RequisitionOrder) => {
    setInputTemp(4.0);
    setTempModal({ orderId: ord.id, type: 'receive', orderNumber: ord.orderNumber });
  };

  const handleConfirmTempAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempModal) return;

    if (tempModal.type === 'dispatch') {
      updateOrderStatus(
        tempModal.orderId,
        'in_transit',
        `บรรจุกล่องควบคุมความเย็นและเริ่มจัดส่ง (อุณหภูมิคลังจ่าย: ${inputTemp}°C)`,
        { departureTemp: inputTemp }
      );
    } else {
      updateOrderStatus(
        tempModal.orderId,
        'received',
        `ตรวจรับโลหิตเข้าคลังเรียบร้อย (อุณหภูมิเมื่อถึงปลายทาง: ${inputTemp}°C)`,
        { arrivalTemp: inputTemp }
      );
    }
    setTempModal(null);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">รออนุมัติ (Pending)</span>;
      case 'approved':
        return <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">อนุมัติแล้ว (Approved)</span>;
      case 'in_transit':
        return <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-medium border border-purple-200 flex items-center gap-1"><Truck className="w-3 h-3" /> กำลังขนส่ง</span>;
      case 'received':
        return <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">ได้รับแล้ว/อยู่ระหว่างยืม</span>;
      case 'returned':
        return <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-200">คืนครบถ้วน (Returned)</span>;
      case 'completed':
        return <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-300">แลกเปลี่ยนสำเร็จ</span>;
      case 'cancelled':
        return <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">ยกเลิก</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ระบบบันทึกและติดตามการยืม-คืน-แลกเปลี่ยน
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            โรงพยาบาลปัจจุบัน: <span className="font-semibold text-rose-700">{currentUser?.hospitalName}</span> (ตรวจสอบคำขอขาเข้า-ขาออก และพิมพ์เอกสารสั่งการ)
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('outgoing')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeSubTab === 'outgoing'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            คำขอที่เราส่งไป (Outgoing)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('incoming')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeSubTab === 'incoming'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            คำขอที่ส่งถึงเรา (Incoming)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('loans')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeSubTab === 'loans'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ติดตามการยืม-คืน (Loan Ledger)
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative min-w-[260px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาเลขที่ออเดอร์, ชื่อโรงพยาบาล หรือหมายเลขถุง..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">สถานะ:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending">รอการอนุมัติ (Pending)</option>
            <option value="approved">อนุมัติแล้ว (Approved)</option>
            <option value="in_transit">กำลังขนส่ง (In Transit)</option>
            <option value="received">ได้รับแล้ว/อยู่ระหว่างยืม</option>
            <option value="returned">ส่งคืนเรียบร้อย (Returned)</option>
            <option value="completed">แลกเปลี่ยนสำเร็จ (Completed)</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">ไม่พบรายการคำขอในหมวดนี้</h3>
          <p className="text-xs text-slate-500 mt-1">
            เมื่อมีการใส่ตระกร้าและส่งออเดอร์ รายการจะถูกบันทึกและแสดงที่นี่แบบเรียลไทม์
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;
            const isLoan = ord.items.some((i) => i.transactionType === 'ยืม');
            const totalUnits = ord.items.reduce((s, i) => s + i.units, 0);

            const isRequester = ord.requestingHospitalId === myHospitalId;
            const isIssuer = ord.issuingHospitalId === myHospitalId;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Order Summary Strip */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Number, Status, Direction */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {ord.orderNumber}
                      </span>
                      {getStatusBadge(ord.status)}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {ord.createdAt} น.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-slate-700">{ord.requestingHospitalName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-rose-700">{ord.issuingHospitalName}</span>
                    </div>
                  </div>

                  {/* Middle Column: Products preview */}
                  <div className="border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-4 py-1">
                    <div className="text-[11px] text-slate-500 font-medium">ผลิตภัณฑ์ที่ขอเบิก:</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {ord.items.map((it) => (
                        <div
                          key={it.id}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5"
                        >
                          <span className="font-bold text-rose-700">{it.bloodGroup}</span>
                          <span className="text-slate-500">{it.rh === 'Negative' ? 'Rh-' : 'Rh+'}</span>
                          <span className="text-slate-800 font-semibold">{it.productType}</span>
                          <span className="font-bold text-slate-900">x{it.units}</span>
                        </div>
                      ))}
                    </div>

                    {isLoan && ord.loanReturnDetails && (
                      <div className="mt-1.5 text-[11px] text-slate-600 flex items-center gap-2 font-mono">
                        <span>ยืม: {ord.loanReturnDetails.totalUnitsBorrowed} ยูนิต</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">
                          คืนแล้ว: {ord.loanReturnDetails.totalUnitsReturned} ยูนิต
                        </span>
                        <span>·</span>
                        <span className="text-rose-600 font-semibold">
                          ค้างคืน:{' '}
                          {Math.max(
                            0,
                            ord.loanReturnDetails.totalUnitsBorrowed - ord.loanReturnDetails.totalUnitsReturned
                          )}{' '}
                          ยูนิต
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Action 1: Issuer Approves pending order */}
                    {isIssuer && ord.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(ord)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                      >
                        อนุมัติจ่ายโลหิต
                      </button>
                    )}

                    {/* Action 2: Issuer Dispatches cold chain */}
                    {isIssuer && ord.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleOpenDispatch(ord)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>เริ่มจัดส่ง (Cold Chain)</span>
                      </button>
                    )}

                    {/* Action 3: Requester Confirms receipt */}
                    {isRequester && ord.status === 'in_transit' && (
                      <button
                        type="button"
                        onClick={() => handleOpenReceive(ord)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ยืนยันรับโลหิตเข้าคลัง</span>
                      </button>
                    )}

                    {/* Action 4: Return blood button for loans */}
                    {isLoan &&
                      (ord.status === 'received' || ord.status === 'approved') &&
                      ord.loanReturnDetails &&
                      ord.loanReturnDetails.totalUnitsReturned < ord.loanReturnDetails.totalUnitsBorrowed && (
                        <button
                          type="button"
                          onClick={() => onOpenReturnModal(ord)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>บันทึกส่งคืนโลหิต</span>
                        </button>
                      )}

                    {/* Action 5: Print Slips buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onPrintOrder(ord, 'order')}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 border border-slate-300 shadow-xs"
                        title="พิมพ์ใบสร้างออเดอร์ขอเบิกโลหิต"
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">ใบสร้างออเดอร์</span>
                      </button>

                      {isLoan && (
                        <button
                          type="button"
                          onClick={() => onPrintOrder(ord, 'loan')}
                          className="px-2 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 border border-blue-200 shadow-xs"
                          title="พิมพ์ใบยืมโลหิตและข้อตกลงส่งคืน"
                        >
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>ใบยืม</span>
                        </button>
                      )}

                      {(ord.status === 'returned' || (ord.loanReturnDetails && ord.loanReturnDetails.returnLogs.length > 0)) && (
                        <button
                          type="button"
                          onClick={() => onPrintOrder(ord, 'return')}
                          className="px-2 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200 shadow-xs"
                          title="พิมพ์ใบบันทึกการส่งคืนโลหิต"
                        >
                          <RotateCcw className="w-3 h-3 text-emerald-600" />
                          <span>ใบส่งคืน</span>
                        </button>
                      )}

                      {ord.items.some((i) => i.transactionType === 'แลกเปลี่ยน') && (
                        <button
                          type="button"
                          onClick={() => onPrintOrder(ord, 'exchange')}
                          className="px-2 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 border border-amber-200 shadow-xs"
                          title="พิมพ์ใบสำคัญการแลกเปลี่ยนโลหิต"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                          <span>ใบแลกเปลี่ยน</span>
                        </button>
                      )}
                    </div>

                    {/* Expand Details Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(ord.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                      title="ดูรายละเอียดเพิ่มเติม"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Expanded Details */}
                {isExpanded && (
                  <div className="bg-slate-50/70 p-4 border-t border-slate-200 text-xs space-y-4">
                    {/* Itemized Table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="p-2">หมายเลขถุง</th>
                            <th className="p-2">หมู่เลือด</th>
                            <th className="p-2">ชนิด</th>
                            <th className="p-2">จำนวน</th>
                            <th className="p-2">วันหมดอายุ</th>
                            <th className="p-2">เงื่อนไข</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ord.items.map((it) => (
                            <tr key={it.id}>
                              <td className="p-2 font-mono font-bold text-slate-800">{it.bagNumber}</td>
                              <td className="p-2 font-bold">
                                {it.bloodGroup} {it.rh === 'Negative' ? '(Rh-)' : '(Rh+)'}
                              </td>
                              <td className="p-2 font-mono">{it.productType} ({it.volumeMl} ml)</td>
                              <td className="p-2 font-mono font-bold">{it.units} ยูนิต</td>
                              <td className="p-2 font-mono text-slate-600">{it.expiryDate}</td>
                              <td className="p-2 text-slate-700">
                                <span className="font-semibold">{it.transactionType}</span>
                                {it.returnDueDate && (
                                  <span className="text-slate-500 font-mono ml-1.5">
                                    (กำหนดคืน {it.returnDueDate})
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Cold Chain Data & Logistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                          <Truck className="w-3.5 h-3.5 text-slate-600" /> การขนส่งควบคุมความเย็น
                        </div>
                        <div><span className="text-slate-500">บรรจุภัณฑ์:</span> {ord.coldChain.packagingType}</div>
                        <div><span className="text-slate-500">ผู้นำส่ง:</span> {ord.coldChain.courierName} ({ord.coldChain.courierPhone})</div>
                        <div className="font-mono pt-1 text-slate-700">
                          อุณหภูมิ ณ จุดจ่าย: {ord.coldChain.departureTemp !== undefined ? `${ord.coldChain.departureTemp}°C` : '-'} · ถึงปลายทาง: {ord.coldChain.arrivalTemp !== undefined ? `${ord.coldChain.arrivalTemp}°C` : '-'}
                        </div>
                      </div>

                      {/* Audit Trail Timeline */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                          <Clock className="w-3.5 h-3.5 text-slate-600" /> เส้นทางบันทึกประวัติ (Audit Timeline)
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {ord.timeline.map((step, sidx) => (
                            <div key={sidx} className="text-[11px] flex items-start gap-2 border-b border-slate-50 pb-1">
                              <span className="font-mono text-slate-400 shrink-0">{step.timestamp.slice(5)}</span>
                              <div>
                                <span className="font-semibold text-slate-800">{step.title}</span>
                                <span className="text-slate-500 font-normal"> โดย {step.actor} ({step.hospital})</span>
                                {step.notes && <div className="text-[10px] text-slate-400 italic">{step.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Temperature Prompt Modal for Dispatch / Receive */}
      {tempModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-rose-600" />
                {tempModal.type === 'dispatch' ? 'บันทึกอุณหภูมิก่อนจัดส่ง' : 'บันทึกอุณหภูมิเมื่อตรวจรับ'}
              </h3>
              <button
                type="button"
                onClick={() => setTempModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              อ้างอิงออเดอร์: <span className="font-mono font-bold text-slate-800">{tempModal.orderNumber}</span>
            </p>

            <form onSubmit={handleConfirmTempAction} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  อุณหภูมิวัดได้จาก Data Logger / กล่อง (°C)
                </label>
                <input
                  type="number"
                  step={0.1}
                  required
                  value={inputTemp}
                  onChange={(e) => setInputTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold text-base text-center"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  เกณฑ์มาตรฐาน PRC: 2.0°C ถึง 6.0°C / FFP: &le; -20°C
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTempModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  ยืนยันบันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
