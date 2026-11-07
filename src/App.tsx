/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BloodProvider, useBlood } from './context/BloodContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { Marketplace } from './components/Marketplace';
import { CartDrawer } from './components/CartDrawer';
import { OrderManagement } from './components/OrderManagement';
import { PrintVoucherModal, VoucherDocType } from './components/PrintVoucherModal';
import { ReturnBloodModal } from './components/ReturnBloodModal';
import { SummaryDashboard } from './components/SummaryDashboard';
import { PostBloodModal } from './components/PostBloodModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { RequisitionOrder } from './types/blood';

const MainAppContent: React.FC = () => {
  const { currentUser, isLoginModalOpen } = useAuth();
  const { cart } = useBlood();

  const [currentTab, setCurrentTab] = useState<'marketplace' | 'orders' | 'dashboard'>('marketplace');
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<RequisitionOrder | null>(null);
  const [printDocType, setPrintDocType] = useState<VoucherDocType>('order');
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<RequisitionOrder | null>(null);

  const handleOpenDraftPrint = () => {
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
        returnDueDate:
          c.transactionType === 'ยืม'
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : undefined,
        exchangeOfferDescription:
          c.transactionType === 'แลกเปลี่ยน'
            ? `แลกเปลี่ยนโลหิต ${c.inventoryItem.bloodGroup} ${c.requestedUnits} ถุง`
            : undefined,
        returnedUnits: 0,
        returnCompleted: false,
      })),
      coldChain: {
        packagingType: 'กล่อง Cold Chain ได้รับการรับรองพร้อม Ice Pack (2°C-6°C)',
        targetTemp: '2°C - 6°C (Cold Chain Standard)',
        courierName: 'เจ้าหน้าที่ขนส่งเวชภัณฑ์ด่วน',
        courierPhone: '089-555-8899',
      },
      loanReturnDetails: cart.some((c) => c.transactionType === 'ยืม')
        ? {
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            isOverdue: false,
            totalUnitsBorrowed: cart
              .filter((c) => c.transactionType === 'ยืม')
              .reduce((s, c) => s + c.requestedUnits, 0),
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
          notes: 'ขอเบิกสำรองคลังเลือดระหว่างโรงพยาบาล',
        },
      ],
    };

    const chosen: VoucherDocType = cart.some((c) => c.transactionType === 'ยืม')
      ? 'loan'
      : cart.some((c) => c.transactionType === 'แลกเปลี่ยน')
      ? 'exchange'
      : 'order';
    setPrintDocType(chosen);
    setSelectedPrintOrder(draftOrder);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openPostModal={() => setIsPostModalOpen(true)}
        openCartDrawer={() => setIsCartDrawerOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
        {currentTab === 'marketplace' && (
          <Marketplace
            openPostModal={() => setIsPostModalOpen(true)}
            openCartDrawer={() => setIsCartDrawerOpen(true)}
          />
        )}

        {currentTab === 'orders' && (
          <OrderManagement
            onPrintOrder={(order, docType) => {
              setPrintDocType(docType || 'order');
              setSelectedPrintOrder(order);
            }}
            onOpenReturnModal={(order) => setSelectedReturnOrder(order)}
          />
        )}

        {currentTab === 'dashboard' && <SummaryDashboard />}
      </main>

      {/* Persistent Floating Cart Bar for Web and Tablet */}
      {!isCartDrawerOpen && (
        <FloatingCartBar
          openCartDrawer={() => setIsCartDrawerOpen(true)}
          onPrintDraftOrder={handleOpenDraftPrint}
        />
      )}

      {/* Modals & Drawers */}
      <LoginModal />

      <PostBloodModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onViewOrders={() => setCurrentTab('orders')}
        onPrintOrder={(order, docType) => {
          setIsCartDrawerOpen(false);
          setPrintDocType(docType || 'order');
          setSelectedPrintOrder(order);
        }}
      />

      <PrintVoucherModal
        order={selectedPrintOrder}
        initialDocType={printDocType}
        onClose={() => setSelectedPrintOrder(null)}
      />

      <ReturnBloodModal
        order={selectedReturnOrder}
        onClose={() => setSelectedReturnOrder(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-8 text-xs text-slate-500 text-center no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Thai BloodLink</span>
            <span>· เครือข่ายธนาคารเลือดเพื่อความมั่นคงทางโลหิตวิทยาแห่งชาติ</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Firebase Firestore &amp; Auth: เชื่อมต่อสำเร็จ</span>
            <span>·</span>
            <span>เข้าสู่ระบบด้วย Gmail ทุกครั้ง</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BloodProvider>
        <MainAppContent />
      </BloodProvider>
    </AuthProvider>
  );
}
