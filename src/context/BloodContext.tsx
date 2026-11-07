import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BloodInventoryItem,
  CartItem,
  RequisitionOrder,
  OrderItem,
  OrderStatus,
  TransactionType,
  ReturnLog,
} from '../types/blood';
import { INITIAL_INVENTORY, INITIAL_ORDERS } from '../data/mockData';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType, testFirestoreConnection, safeSetDoc } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

interface BloodContextType {
  inventory: BloodInventoryItem[];
  cart: CartItem[];
  orders: RequisitionOrder[];
  isFirestoreConnected: boolean;
  // Inventory actions
  postInventoryItem: (item: Omit<BloodInventoryItem, 'id' | 'postedAt'>) => void;
  deleteInventoryItem: (id: string) => void;
  // Cart actions
  addToCart: (
    item: BloodInventoryItem,
    requestedUnits: number,
    transactionType: TransactionType,
    extra?: {
      returnDueDate?: string;
      exchangeOfferDescription?: string;
      transportColdChain?: string;
    }
  ) => void;
  removeFromCart: (inventoryId: string) => void;
  updateCartItemQuantity: (inventoryId: string, units: number) => void;
  clearCart: () => void;
  // Order actions
  submitOrderFromCart: (orderDetails: {
    courierName: string;
    courierPhone: string;
    packagingType: string;
    notes?: string;
  }) => RequisitionOrder[];
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    notes?: string,
    coldChainData?: { departureTemp?: number; arrivalTemp?: number }
  ) => void;
  recordBloodReturn: (
    orderId: string,
    unitsReturned: number,
    bagNumbers: string[],
    conditionCheck: 'ผ่านเกณฑ์มาตรฐาน' | 'ถุงชำรุด/อุณหภูมิเกิน',
    temp: number,
    notes?: string
  ) => void;
  resetToInitialData: () => void;
}

const BloodContext = createContext<BloodContextType | undefined>(undefined);

const STORAGE_KEY_INV = 'thai_bloodlink_inventory';
const STORAGE_KEY_ORDERS = 'thai_bloodlink_orders';
const STORAGE_KEY_CART = 'thai_bloodlink_cart';

export const BloodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  const [inventory, setInventory] = useState<BloodInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INV);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INVENTORY;
  });

  const [orders, setOrders] = useState<RequisitionOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORDERS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Test connection on mount
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsFirestoreConnected(connected);
    });
  }, []);

  // Connect Firestore Real-Time Listeners
  useEffect(() => {
    // 1. Inventory Listener
    const invCol = collection(db, 'inventory');
    const unsubInv = onSnapshot(
      invCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: BloodInventoryItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as BloodInventoryItem);
          });
          setInventory(items);
          localStorage.setItem(STORAGE_KEY_INV, JSON.stringify(items));
        } else {
          // If Firestore inventory is empty, seed with initial mock data
          INITIAL_INVENTORY.forEach(async (item) => {
            try {
              await safeSetDoc('inventory', item.id, item);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `inventory/${item.id}`);
            }
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'inventory');
      }
    );

    // 2. Orders Listener
    const ordersCol = collection(db, 'orders');
    const unsubOrders = onSnapshot(
      ordersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const ords: RequisitionOrder[] = [];
          snapshot.forEach((docSnap) => {
            ords.push(docSnap.data() as RequisitionOrder);
          });
          // Sort newest first
          ords.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setOrders(ords);
          localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(ords));
        } else {
          // If Firestore orders are empty, seed with initial orders
          INITIAL_ORDERS.forEach(async (order) => {
            try {
              await safeSetDoc('orders', order.id, order);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
            }
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      }
    );

    return () => {
      unsubInv();
      unsubOrders();
    };
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  }, [cart]);

  // Inventory Methods
  const postInventoryItem = async (itemData: Omit<BloodInventoryItem, 'id' | 'postedAt'>) => {
    const newItem: BloodInventoryItem = {
      ...itemData,
      id: 'inv-' + Date.now(),
      postedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    setInventory((prev) => [newItem, ...prev]);

    // Save to Firestore
    try {
      await safeSetDoc('inventory', newItem.id, newItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventory/${newItem.id}`);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
    }
  };

  // Cart Methods
  const addToCart = (
    item: BloodInventoryItem,
    requestedUnits: number,
    transactionType: TransactionType,
    extra?: {
      returnDueDate?: string;
      exchangeOfferDescription?: string;
      transportColdChain?: string;
    }
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.inventoryItem.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          requestedUnits: Math.min(item.unitsAvailable, updated[existingIndex].requestedUnits + requestedUnits),
          transactionType,
          returnDueDate: extra?.returnDueDate || updated[existingIndex].returnDueDate,
          exchangeOfferDescription: extra?.exchangeOfferDescription || updated[existingIndex].exchangeOfferDescription,
        };
        return updated;
      }
      return [
        ...prev,
        {
          inventoryItem: item,
          requestedUnits: Math.min(item.unitsAvailable, requestedUnits),
          transactionType,
          returnDueDate: extra?.returnDueDate,
          exchangeOfferDescription: extra?.exchangeOfferDescription,
          transportColdChain: extra?.transportColdChain || 'Cold Box with Ice Packs (2°C-6°C)',
        },
      ];
    });
  };

  const removeFromCart = (inventoryId: string) => {
    setCart((prev) => prev.filter((item) => item.inventoryItem.id !== inventoryId));
  };

  const updateCartItemQuantity = (inventoryId: string, units: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.inventoryItem.id === inventoryId) {
          return {
            ...c,
            requestedUnits: Math.max(1, Math.min(c.inventoryItem.unitsAvailable, units)),
          };
        }
        return c;
      })
    );
  };

  const clearCart = () => setCart([]);

  // Submit Order: Groups items by issuing hospital so each hospital gets their distinct official order
  const submitOrderFromCart = (orderDetails: {
    courierName: string;
    courierPhone: string;
    packagingType: string;
    notes?: string;
  }) => {
    if (!currentUser || cart.length === 0) return [];

    const groupedByHospital: Record<string, CartItem[]> = {};
    cart.forEach((item) => {
      const hid = item.inventoryItem.hospitalId;
      if (!groupedByHospital[hid]) groupedByHospital[hid] = [];
      groupedByHospital[hid].push(item);
    });

    const newOrders: RequisitionOrder[] = [];
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    Object.entries(groupedByHospital).forEach(([issuerHospitalId, itemsInGroup], idx) => {
      const issuingHospitalName = itemsInGroup[0].inventoryItem.hospitalName;
      const orderNumber = `BL-${new Date().getFullYear()}-${String(orders.length + idx + 101).padStart(4, '0')}`;

      // Calculate total units borrowed if any
      const totalBorrowed = itemsInGroup
        .filter((i) => i.transactionType === 'ยืม')
        .reduce((sum, i) => sum + i.requestedUnits, 0);

      // Default due date: 14 days from now for borrowed items
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 14);
      const defaultDueDate = dueDateObj.toISOString().slice(0, 10);

      const orderItems = itemsInGroup.map((ci, itemIndex) => {
        const item: any = {
          id: `ord-item-${Date.now()}-${itemIndex}`,
          originalInventoryId: ci.inventoryItem.id,
          bagNumber: ci.inventoryItem.bagNumber,
          bloodGroup: ci.inventoryItem.bloodGroup,
          rh: ci.inventoryItem.rh,
          productType: ci.inventoryItem.productType,
          units: ci.requestedUnits,
          volumeMl: ci.inventoryItem.volumeMl,
          expiryDate: ci.inventoryItem.expiryDate,
          transactionType: ci.transactionType,
          returnedUnits: 0,
          returnCompleted: false,
        };
        if (ci.returnDueDate) {
          item.returnDueDate = ci.returnDueDate;
        } else if (ci.transactionType === 'ยืม') {
          item.returnDueDate = defaultDueDate;
        }
        if (ci.exchangeOfferDescription) {
          item.exchangeOfferDescription = ci.exchangeOfferDescription;
        }
        return item as OrderItem;
      });

      const newOrder: any = {
        id: 'ord-' + Date.now() + '-' + idx,
        orderNumber,
        createdAt: timestamp,
        requestingHospitalId: currentUser.hospitalId,
        requestingHospitalName: currentUser.hospitalName,
        requestingStaffName: currentUser.name,
        requestingStaffEmail: currentUser.email,
        requestingStaffPhone: currentUser.phone,
        issuingHospitalId: issuerHospitalId,
        issuingHospitalName,
        issuingStaffName: itemsInGroup[0].inventoryItem.contactPerson || 'เจ้าหน้าที่คลังเลือด',
        issuingStaffPhone: itemsInGroup[0].inventoryItem.contactPhone || '02-XXX-XXXX',
        items: orderItems,
        status: 'pending',
        coldChain: {
          packagingType: orderDetails.packagingType || 'กล่องโฟมควบคุมอุณหภูมิพร้อม Ice Pack (2°C-6°C)',
          targetTemp: '2°C ถึง 6°C',
          courierName: orderDetails.courierName || 'ทีมเวชภัณฑ์ขนส่งด่วน',
          courierPhone: orderDetails.courierPhone || '08X-XXX-XXXX',
        },
        timeline: [
          {
            status: 'pending',
            title: 'ส่งคำขอเบิก/ยืม/แลกเปลี่ยนโลหิต',
            timestamp,
            actor: `${currentUser.name} (${currentUser.role})`,
            hospital: currentUser.hospitalName,
            notes: orderDetails.notes || `สร้างใบขอเบิกเลขที่ ${orderNumber} รวม ${orderItems.reduce((s: number, i: any) => s + i.units, 0)} ยูนิต`,
          },
        ],
      };

      if (totalBorrowed > 0) {
        newOrder.loanReturnDetails = {
          dueDate: defaultDueDate,
          isOverdue: false,
          totalUnitsBorrowed: totalBorrowed,
          totalUnitsReturned: 0,
          returnLogs: [],
        };
      }

      newOrders.push(newOrder as RequisitionOrder);

      // Save to Firestore safely without any undefined fields
      safeSetDoc('orders', newOrder.id, newOrder).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `orders/${newOrder.id}`);
      });

      // Decrement inventory stock
      setInventory((prevInv) =>
        prevInv.map((inv) => {
          const matchCart = itemsInGroup.find((ci) => ci.inventoryItem.id === inv.id);
          if (matchCart) {
            const remaining = Math.max(0, inv.unitsAvailable - matchCart.requestedUnits);
            const updatedInv = { ...inv, unitsAvailable: remaining };
            safeSetDoc('inventory', inv.id, updatedInv).catch((err) => {
              handleFirestoreError(err, OperationType.UPDATE, `inventory/${inv.id}`);
            });
            return updatedInv;
          }
          return inv;
        })
      );
    });

    setOrders((prev) => [...newOrders, ...prev]);
    clearCart();
    return newOrders;
  };

  // Update order status with automated timeline logging
  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
    coldChainData?: { departureTemp?: number; arrivalTemp?: number }
  ) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const timelineItem: any = {
          status: newStatus,
          title: getStatusTitle(newStatus),
          timestamp,
          actor: currentUser ? currentUser.name : 'เจ้าหน้าที่เวร',
          hospital: currentUser ? currentUser.hospitalName : ord.issuingHospitalName,
        };
        if (notes) {
          timelineItem.notes = notes;
        }

        const updatedTimeline = [...ord.timeline, timelineItem];

        const updatedColdChain: any = { ...ord.coldChain };
        if (newStatus === 'in_transit') {
          updatedColdChain.dispatchedAt = timestamp;
          if (coldChainData?.departureTemp !== undefined) {
            updatedColdChain.departureTemp = coldChainData.departureTemp;
          }
        } else if (newStatus === 'received') {
          updatedColdChain.receivedAt = timestamp;
          if (coldChainData?.arrivalTemp !== undefined) {
            updatedColdChain.arrivalTemp = coldChainData.arrivalTemp;
          }
        }

        const updatedOrder: RequisitionOrder = {
          ...ord,
          status: newStatus,
          coldChain: updatedColdChain,
          timeline: updatedTimeline,
        };

        // Sync to Firestore safely
        safeSetDoc('orders', orderId, updatedOrder).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        });

        return updatedOrder;
      })
    );
  };

  // Record Blood Return
  const recordBloodReturn = (
    orderId: string,
    unitsReturned: number,
    bagNumbers: string[],
    conditionCheck: 'ผ่านเกณฑ์มาตรฐาน' | 'ถุงชำรุด/อุณหภูมิเกิน',
    temp: number,
    notes?: string
  ) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const prevReturned = ord.loanReturnDetails?.totalUnitsReturned || 0;
        const totalBorrowed = ord.loanReturnDetails?.totalUnitsBorrowed || 0;
        const newTotalReturned = prevReturned + unitsReturned;
        const isFullyReturned = newTotalReturned >= totalBorrowed;

        const newReturnLog: ReturnLog = {
          id: 'ret-' + Date.now(),
          returnDate: timestamp,
          unitsReturned,
          returnedBagNumbers: bagNumbers,
          returnedByStaff: currentUser?.name || 'เจ้าหน้าที่ผู้ส่งคืน',
          returnedHospitalName: ord.requestingHospitalName,
          receivedByStaff: ord.issuingStaffName || 'เจ้าหน้าที่คลังเลือด',
          conditionCheck,
          coldChainTemp: temp,
        };
        if (notes) {
          newReturnLog.notes = notes;
        }

        const updatedLogs = [...(ord.loanReturnDetails?.returnLogs || []), newReturnLog];

        const updatedOrder: any = {
          ...ord,
          status: isFullyReturned ? 'returned' : ord.status,
          timeline: [
            ...ord.timeline,
            {
              status: isFullyReturned ? 'returned' : ord.status,
              title: isFullyReturned ? 'ส่งคืนโลหิตครบถ้วนตามสัญญา' : `บันทึกการส่งคืนโลหิต ${unitsReturned} ยูนิต`,
              timestamp,
              actor: currentUser ? currentUser.name : 'เจ้าหน้าที่เวร',
              hospital: ord.requestingHospitalName,
              notes: `ส่งคืนถุงเลขที่ ${bagNumbers.join(', ')} อุณหภูมิ ${temp}°C (${conditionCheck})`,
            },
          ],
        };

        if (ord.loanReturnDetails) {
          updatedOrder.loanReturnDetails = {
            ...ord.loanReturnDetails,
            totalUnitsReturned: newTotalReturned,
            returnLogs: updatedLogs,
          };
        }

        // Sync to Firestore safely
        safeSetDoc('orders', orderId, updatedOrder).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        });

        return updatedOrder as RequisitionOrder;
      })
    );
  };

  const resetToInitialData = async () => {
    setInventory(INITIAL_INVENTORY);
    setOrders(INITIAL_ORDERS);
    setCart([]);
    localStorage.removeItem(STORAGE_KEY_INV);
    localStorage.removeItem(STORAGE_KEY_ORDERS);
    localStorage.removeItem(STORAGE_KEY_CART);

    for (const item of INITIAL_INVENTORY) {
      try {
        await safeSetDoc('inventory', item.id, item);
      } catch (e) {
        console.error(e);
      }
    }
    for (const ord of INITIAL_ORDERS) {
      try {
        await safeSetDoc('orders', ord.id, ord);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <BloodContext.Provider
      value={{
        inventory,
        cart,
        orders,
        isFirestoreConnected,
        postInventoryItem,
        deleteInventoryItem,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        submitOrderFromCart,
        updateOrderStatus,
        recordBloodReturn,
        resetToInitialData,
      }}
    >
      {children}
    </BloodContext.Provider>
  );
};

export const useBlood = () => {
  const context = useContext(BloodContext);
  if (!context) {
    throw new Error('useBlood must be used within a BloodProvider');
  }
  return context;
};

function getStatusTitle(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'รอการอนุมัติ';
    case 'approved':
      return 'อนุมัติการเบิกจ่าย';
    case 'in_transit':
      return 'กำลังขนส่งควบคุมความเย็น';
    case 'received':
      return 'ยืนยันรับโลหิตเข้าคลัง';
    case 'returned':
      return 'ส่งคืนโลหิตเรียบร้อย';
    case 'completed':
      return 'การแลกเปลี่ยนเสร็จสมบูรณ์';
    case 'cancelled':
      return 'ยกเลิกรายการ';
    default:
      return status;
  }
}
