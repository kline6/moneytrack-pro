import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  PaymentEvent,
  isPermissionGranted,
  requestPermission as nativeRequestPermission,
  onPaymentDetected,
} from '../native/NotificationListener';
import { transactionsApi, smartApi } from '../api/endpoints';

export interface SnackbarItem {
  id: string;
  transactionId: string;
  source: string;
  merchant: string;
  amount: number;
  categoryId?: string;
}

export function useNotificationListener(enabled: boolean = true) {
  const [snackbarItem, setSnackbarItem] = useState<SnackbarItem | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;
    isPermissionGranted().then((granted) => {
      setHasPermission(granted);
    });
  }, [enabled]);

  const handlePayment = useCallback(async (event: PaymentEvent) => {
    try {
      // 静默调用智能分类
      const predictRes = await smartApi.predict({
        rawText: event.merchant || event.rawTitle || '',
        source: event.source,
      });
      const prediction = predictRes.data.data;

      // 静默创建账单
      const createRes = await transactionsApi.create({
        type: 'EXPENSE',
        amount: Math.round(event.amount * 100),
        title: event.merchant || event.rawTitle || '自动记账',
        merchant: event.merchant || undefined,
        categoryId: prediction.categoryId || undefined,
        occurredAt: new Date().toISOString(),
        clientTxnId: 'auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        source: event.source,
      });

      const txnId = createRes.data.data?.id;

      setSnackbarItem({
        id: 'snack_' + Date.now(),
        transactionId: txnId || '',
        source: event.source,
        merchant: event.merchant || '未知',
        amount: Math.round(event.amount * 100),
        categoryId: prediction.categoryId,
      });
    } catch (err) {
      console.warn('Auto-log failed:', err);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;
    const sub = onPaymentDetected(handlePayment);
    listenerRef.current = sub;
    return () => { sub.remove(); };
  }, [enabled, handlePayment]);

  const dismissSnackbar = useCallback(() => setSnackbarItem(null), []);

  const checkPermission = useCallback(async () => {
    const granted = await isPermissionGranted();
    setHasPermission(granted);
    return granted;
  }, []);

  const requestPermission = useCallback(() => nativeRequestPermission(), []);

  return {
    snackbarItem,
    dismissSnackbar,
    hasPermission,
    checkPermission,
    requestPermission,
  };
}