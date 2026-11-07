import React, { useState, useMemo } from 'react';
import { useBlood } from '../context/BloodContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_HOSPITALS } from '../data/mockData';
import {
  BarChart3,
  TrendingUp,
  RotateCcw,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
  Calendar,
  Printer,
  FileCheck,
  Flame,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const SummaryDashboard: React.FC = () => {
  const { orders } = useBlood();
  const { currentUser } = useAuth();

  const [timeRange, setTimeRange] = useState<'all' | '30days' | 'quarter' | 'year'>('all');

  // Filtered orders by time
  const currentOrders = useMemo(() => {
    return orders; // can filter by date string if needed
  }, [orders]);

  // Calculations
  const stats = useMemo(() => {
    let totalBorrowed = 0;
    let totalReturned = 0;
    let totalExchanged = 0;
    let totalDonation = 0;

    const groupBreakdown: Record<string, { borrowed: number; exchanged: number; returned: number }> = {
      A: { borrowed: 0, exchanged: 0, returned: 0 },
      B: { borrowed: 0, exchanged: 0, returned: 0 },
      O: { borrowed: 0, exchanged: 0, returned: 0 },
      AB: { borrowed: 0, exchanged: 0, returned: 0 },
    };

    const productBreakdown: Record<string, number> = {
      PRC: 0,
      FFP: 0,
      PC: 0,
      SDP: 0,
      CRYO: 0,
      WB: 0,
      LPRC: 0,
    };

    const overdueList: Array<{
      orderNumber: string;
      borrower: string;
      issuer: string;
      units: number;
      dueDate: string;
      daysRemaining: number;
      isOverdue: boolean;
    }> = [];

    const hospitalMatrix: Record<
      string,
      {
        name: string;
        borrowedFromOthers: number;
        lentToOthers: number;
        returnedToOthers: number;
        receivedReturns: number;
      }
    > = {};

    INITIAL_HOSPITALS.forEach((h) => {
      hospitalMatrix[h.id] = {
        name: h.name,
        borrowedFromOthers: 0,
        lentToOthers: 0,
        returnedToOthers: 0,
        receivedReturns: 0,
      };
    });

    currentOrders.forEach((ord) => {
      const isBorrow = ord.items.some((i) => i.transactionType === 'ยืม');
      const isExchange = ord.items.some((i) => i.transactionType === 'แลกเปลี่ยน');
      const orderUnits = ord.items.reduce((s, i) => s + i.units, 0);

      // Hospital matrix tracking
      if (hospitalMatrix[ord.requestingHospitalId]) {
        if (isBorrow) hospitalMatrix[ord.requestingHospitalId].borrowedFromOthers += orderUnits;
      }
      if (hospitalMatrix[ord.issuingHospitalId]) {
        if (isBorrow) hospitalMatrix[ord.issuingHospitalId].lentToOthers += orderUnits;
      }

      // Items aggregation
      ord.items.forEach((it) => {
        if (it.transactionType === 'ยืม') {
          totalBorrowed += it.units;
          if (groupBreakdown[it.bloodGroup]) {
            groupBreakdown[it.bloodGroup].borrowed += it.units;
          }
        } else if (it.transactionType === 'แลกเปลี่ยน') {
          totalExchanged += it.units;
          if (groupBreakdown[it.bloodGroup]) {
            groupBreakdown[it.bloodGroup].exchanged += it.units;
          }
        } else {
          totalDonation += it.units;
        }

        if (productBreakdown[it.productType] !== undefined) {
          productBreakdown[it.productType] += it.units;
        }
      });

      // Loan tracking
      if (ord.loanReturnDetails) {
        const returned = ord.loanReturnDetails.totalUnitsReturned || 0;
        totalReturned += returned;

        const borrowed = ord.loanReturnDetails.totalUnitsBorrowed || 0;
        const outstanding = borrowed - returned;

        if (hospitalMatrix[ord.requestingHospitalId]) {
          hospitalMatrix[ord.requestingHospitalId].returnedToOthers += returned;
        }
        if (hospitalMatrix[ord.issuingHospitalId]) {
          hospitalMatrix[ord.issuingHospitalId].receivedReturns += returned;
        }

        if (outstanding > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(ord.loanReturnDetails.dueDate);
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          overdueList.push({
            orderNumber: ord.orderNumber,
            borrower: ord.requestingHospitalName,
            issuer: ord.issuingHospitalName,
            units: outstanding,
            dueDate: ord.loanReturnDetails.dueDate,
            daysRemaining: diffDays,
            isOverdue: diffDays < 0,
          });
        }
      }
    });

    const outstandingBalance = Math.max(0, totalBorrowed - totalReturned);
    const returnRate = totalBorrowed > 0 ? Math.round((totalReturned / totalBorrowed) * 100) : 100;

    return {
      totalBorrowed,
      totalReturned,
      outstandingBalance,
      totalExchanged,
      totalDonation,
      returnRate,
      groupBreakdown,
      productBreakdown,
      overdueList,
      hospitalMatrix,
    };
  }, [currentOrders]);

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" /> สรุปผลการปฏิบัติการแลกเปลี่ยนและยืมคืนโลหิต
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            รายงานสถิติและสถานะคลังโลหิตเครือข่าย
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สรุปยอดการยืม คืน แลกเปลี่ยน บัญชีลูกหนี้-เจ้าหนี้ และรายการเตือนกำหนดส่งคืน
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '30days'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'year'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ปี {new Date().getFullYear()}
            </button>
          </div>

          {/* Print Summary */}
          <button
            type="button"
            onClick={handlePrintSummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงานสรุป</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Borrowed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยอดยืมสะสม (Borrowed)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            {stats.totalBorrowed}{' '}
            <span className="text-xs font-normal text-slate-500">ยูนิต</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            จากคำขอยืมระหว่างโรงพยาบาล
          </div>
        </div>

        {/* Card 2: Total Returned */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยอดส่งคืนแล้ว (Returned)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
            {stats.totalReturned}{' '}
            <span className="text-xs font-normal text-slate-500">ยูนิต</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> อัตราการคืน: {stats.returnRate}%
          </div>
        </div>

        {/* Card 3: Outstanding Loan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยอดค้างส่งคืน (Outstanding)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700 tabular-nums">
            {stats.outstandingBalance}{' '}
            <span className="text-xs font-normal text-slate-500">ยูนิต</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.overdueList.filter((o) => o.isOverdue).length > 0 ? (
              <span className="text-rose-600 font-bold">
                ⚠️ เกินกำหนด {stats.overdueList.filter((o) => o.isOverdue).length} รายการ
              </span>
            ) : (
              'ยังไม่มีรายการเกินกำหนด'
            )}
          </div>
        </div>

        {/* Card 4: Total Exchanged */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ยอดแลกเปลี่ยน (Exchanged)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-800 tabular-nums">
            {stats.totalExchanged}{' '}
            <span className="text-xs font-normal text-slate-500">ยูนิต</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            สลับหมู่ตามความต้องการของคลัง
          </div>
        </div>
      </div>

      {/* Overdue and Approaching Return Alerts */}
      {stats.overdueList.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900">
              รายการโลหิตที่อยู่ระหว่างการยืมและใกล้ครบกำหนด / เกินกำหนดส่งคืน ({stats.overdueList.length} รายการ)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.overdueList.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  item.isOverdue
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-amber-50/50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <div className="font-mono font-bold">{item.orderNumber}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {item.borrower} (ผู้ยืม) &larr; {item.issuer} (ผู้ให้ยืม)
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    กำหนดคืน: {item.dueDate}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-sm">{item.units} ยูนิต</div>
                  <div
                    className={`text-[10px] font-bold ${
                      item.isOverdue ? 'text-rose-600' : 'text-amber-700'
                    }`}
                  >
                    {item.isOverdue ? '⚠️ เกินกำหนด' : `เหลือ ${item.daysRemaining} วัน`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: ABO Blood Group Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">สัดส่วนการยืม-แลกเปลี่ยน แยกตามหมู่เลือด ABO</h3>
              <p className="text-[11px] text-slate-400">จำนวนยูนิตที่หมุนเวียนในเครือข่าย</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">ABO Matrix</span>
          </div>

          <div className="space-y-3">
            {(['A', 'B', 'O', 'AB'] as const).map((grp) => {
              const data = stats.groupBreakdown[grp];
              const totalForGrp = data.borrowed + data.exchanged;
              const maxUnits = Math.max(1, stats.totalBorrowed + stats.totalExchanged);
              const percentage = Math.round((totalForGrp / maxUnits) * 100);

              return (
                <div key={grp} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                      <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-900 text-[11px] border border-slate-200">
                        {grp}
                      </span>
                      หมู่ {grp}
                    </span>
                    <span className="font-mono text-slate-600">
                      <strong>{totalForGrp}</strong> ยูนิต (ยืม {data.borrowed} · แลก {data.exchanged})
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-rose-600 h-full transition-all"
                      style={{ width: `${(data.borrowed / maxUnits) * 100}%` }}
                      title={`ยืม ${data.borrowed} ยูนิต`}
                    />
                    <div
                      className="bg-blue-600 h-full transition-all"
                      style={{ width: `${(data.exchanged / maxUnits) * 100}%` }}
                      title={`แลกเปลี่ยน ${data.exchanged} ยูนิต`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> ยอดยืม (Loan)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> ยอดแลกเปลี่ยน (Exchange)
            </span>
          </div>
        </div>

        {/* Chart 2: Product Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">การหมุนเวียนแยกตามชนิดผลิตภัณฑ์โลหิต</h3>
              <p className="text-[11px] text-slate-400">PRC, FFP, Platelets, Cryoprecipitate</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">Components</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.productBreakdown).map(([prod, units]) => (
              <div
                key={prod}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold font-mono text-slate-900">{prod}</div>
                  <div className="text-[10px] text-slate-400">
                    {prod === 'PRC'
                      ? 'เม็ดเลือดแดงเข้มข้น'
                      : prod === 'FFP'
                      ? 'พลาสมาสดแช่แข็ง'
                      : prod === 'PC'
                      ? 'เกล็ดเลือดรวม'
                      : prod === 'SDP'
                      ? 'เกล็ดเลือดผู้บริจาคเดี่ยว'
                      : prod === 'CRYO'
                      ? 'ไครโอพรีซิพิเทต'
                      : 'เลือดรวม'}
                  </div>
                </div>
                <div className="font-mono text-base font-bold text-slate-800">
                  {units} <span className="text-[11px] font-normal text-slate-400">ยูนิต</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inter-Hospital Transaction Balance Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              บัญชีสะพัดการยืม-คืนระหว่างโรงพยาบาล (Inter-Hospital Balance Ledger)
            </h3>
            <p className="text-[11px] text-slate-500">
              สถานะหนี้-เจ้าหนี้คลังเลือดสุทธิของแต่ละโรงพยาบาลในเครือข่าย
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">หน่วย: ยูนิต (Units)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3">โรงพยาบาลในเครือข่าย</th>
                <th className="p-3 text-right">ยอดยืมจากผู้อื่น</th>
                <th className="p-3 text-right">ยอดคืนให้ผู้อื่นแล้ว</th>
                <th className="p-3 text-right">ยอดให้ผู้อื่นยืม</th>
                <th className="p-3 text-right">ยอดรับคืนแล้ว</th>
                <th className="p-3 text-right">ยอดสุทธิคงค้าง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {Object.entries(stats.hospitalMatrix).map(([hid, data]) => {
                const netOutstanding = data.borrowedFromOthers - data.returnedToOthers;
                const isCurrent = currentUser?.hospitalId === hid;

                return (
                  <tr
                    key={hid}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isCurrent ? 'bg-rose-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-900">{data.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono font-normal">
                            โรงพยาบาลคุณ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-800">{data.borrowedFromOthers}</td>
                    <td className="p-3 text-right text-emerald-700">{data.returnedToOthers}</td>
                    <td className="p-3 text-right text-slate-800">{data.lentToOthers}</td>
                    <td className="p-3 text-right text-blue-700">{data.receivedReturns}</td>
                    <td className="p-3 text-right font-bold">
                      {netOutstanding > 0 ? (
                        <span className="text-rose-600">ค้างคืน {netOutstanding} ยูนิต</span>
                      ) : (
                        <span className="text-emerald-700">สมดุล (0)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
