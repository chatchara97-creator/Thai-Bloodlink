export type BloodGroup = 'A' | 'B' | 'O' | 'AB';
export type RhType = 'Positive' | 'Negative';
export type ProductType = 'PRC' | 'FFP' | 'PC' | 'SDP' | 'CRYO' | 'WB' | 'LPRC';
export type TransactionType = 'ยืม' | 'แลกเปลี่ยน' | 'โอนให้ฟรี';
export type OrderStatus = 'pending' | 'approved' | 'in_transit' | 'received' | 'returned' | 'completed' | 'cancelled';

export interface Hospital {
  id: string;
  name: string;
  code: string;
  province: string;
  zone: string;
  bloodBankPhone: string;
  emergencyHotline: string;
  address: string;
  verified: boolean;
}

export interface UserProfile {
  email: string;
  name: string;
  avatar: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  role: string;
  licenseNo: string;
  phone: string;
}

export interface BloodInventoryItem {
  id: string;
  bagNumber: string;
  hospitalId: string;
  hospitalName: string;
  hospitalProvince: string;
  bloodGroup: BloodGroup;
  rh: RhType;
  productType: ProductType;
  volumeMl: number;
  unitsAvailable: number;
  collectionDate: string;
  expiryDate: string;
  storageTemp: string;
  allowedTransactions: TransactionType[];
  notes?: string;
  contactPerson: string;
  contactPhone: string;
  postedAt: string;
  anticoagulant: string;
  screeningPassed: boolean;
}

export interface CartItem {
  inventoryItem: BloodInventoryItem;
  requestedUnits: number;
  transactionType: TransactionType;
  returnDueDate?: string;
  exchangeOfferDescription?: string;
  transportColdChain: string;
}

export interface ReturnLog {
  id: string;
  returnDate: string;
  unitsReturned: number;
  returnedBagNumbers: string[];
  returnedByStaff: string;
  returnedHospitalName: string;
  receivedByStaff: string;
  conditionCheck: 'ผ่านเกณฑ์มาตรฐาน' | 'ถุงชำรุด/อุณหภูมิเกิน';
  coldChainTemp: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  originalInventoryId: string;
  bagNumber: string;
  bloodGroup: BloodGroup;
  rh: RhType;
  productType: ProductType;
  units: number;
  volumeMl: number;
  expiryDate: string;
  transactionType: TransactionType;
  returnDueDate?: string;
  exchangeOfferDescription?: string;
  returnedUnits: number;
  returnCompleted: boolean;
}

export interface RequisitionOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  // Requester (โรงพยาบาลผู้ขอเบิก)
  requestingHospitalId: string;
  requestingHospitalName: string;
  requestingStaffName: string;
  requestingStaffEmail: string;
  requestingStaffPhone: string;
  // Issuer (โรงพยาบาลต้นทางที่ให้ยืม/แลกเปลี่ยน)
  issuingHospitalId: string;
  issuingHospitalName: string;
  issuingStaffName?: string;
  issuingStaffPhone?: string;
  // Items
  items: OrderItem[];
  status: OrderStatus;
  // Cold Chain Logistics
  coldChain: {
    packagingType: string;
    targetTemp: string;
    departureTemp?: number;
    arrivalTemp?: number;
    courierName: string;
    courierPhone: string;
    dispatchedAt?: string;
    receivedAt?: string;
  };
  // Loan & Return Tracking
  loanReturnDetails?: {
    dueDate: string;
    isOverdue: boolean;
    totalUnitsBorrowed: number;
    totalUnitsReturned: number;
    returnLogs: ReturnLog[];
  };
  // Audit Timeline
  timeline: Array<{
    status: OrderStatus;
    title: string;
    timestamp: string;
    actor: string;
    hospital: string;
    notes?: string;
  }>;
}
