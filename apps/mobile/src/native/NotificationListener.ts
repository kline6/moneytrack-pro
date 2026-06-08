import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription } from 'react-native';

export interface PaymentEvent {
  amount: number;
  merchant: string;
  source: 'wechat' | 'alipay';
  rawTitle: string;
  rawText: string;
  timestamp: number;
}

const hasNativeModule = !!NativeModules?.NotificationListener;

let eventEmitter: NativeEventEmitter | null = null;
try {
  if (hasNativeModule) {
    eventEmitter = new NativeEventEmitter(NativeModules.NotificationListener);
  }
} catch (e) {
  // NativeEventEmitter not available in this environment
  eventEmitter = null;
}

const EVENT_NAME = 'onPaymentDetected';

export function isPermissionGranted(): Promise<boolean> {
  if (Platform.OS !== 'android' || !hasNativeModule || !NativeModules?.NotificationListener) {
    return Promise.resolve(false);
  }
  return NativeModules.NotificationListener.isPermissionGranted();
}

export function requestPermission(): void {
  if (Platform.OS !== 'android' || !hasNativeModule || !NativeModules?.NotificationListener) {
    return;
  }
  NativeModules.NotificationListener.requestPermission();
}

export function onPaymentDetected(callback: (event: PaymentEvent) => void): EmitterSubscription {
  if (eventEmitter) {
    return eventEmitter.addListener(EVENT_NAME, (data: PaymentEvent) => {
      const event: PaymentEvent = {
        ...data,
        amount: Math.round(data.amount) / 100,
      };
      callback(event);
    });
  }
  // Return a dummy subscription when native module is not available
  return { remove: () => {} } as EmitterSubscription;
}
