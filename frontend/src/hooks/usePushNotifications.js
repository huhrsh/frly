import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Hook to manage push notification subscriptions
 */
export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        // Check if push notifications are supported
        const supported = 'PushManager' in window && 'serviceWorker' in navigator;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            const subscribed = !!subscription;
            console.log('[Push] Subscription check:', subscribed ? 'subscribed' : 'not subscribed');
            if (subscription) {
                console.log('[Push] Subscription endpoint:', subscription.endpoint);
            }
            setIsSubscribed(subscribed);
            return subscribed;
        } catch (error) {
            console.error('[Push] Error checking push subscription:', error);
            return false;
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribe = async () => {
        try {
            console.log('[Push] Starting subscription process...');
            
            // Request notification permission
            console.log('[Push] Requesting notification permission...');
            const perm = await Notification.requestPermission();
            setPermission(perm);
            console.log('[Push] Permission status:', perm);

            if (perm !== 'granted') {
                console.log('[Push] Notification permission denied');
                return false;
            }

            // Get VAPID public key from backend
            console.log('[Push] Fetching VAPID public key from backend...');
            const keyResponse = await axiosClient.get('/notifications/push/public-key');
            const publicKey = keyResponse.data;
            console.log('[Push] Received public key:', publicKey?.substring(0, 20) + '...');

            // Get service worker registration
            console.log('[Push] Waiting for service worker registration...');
            const registration = await navigator.serviceWorker.ready;
            console.log('[Push] Service worker ready');

            // Subscribe to push notifications
            console.log('[Push] Subscribing to push manager...');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
            console.log('[Push] Push manager subscription created');
            console.log('[Push] Subscription endpoint:', subscription.endpoint);

            // Send subscription to backend
            const subscriptionData = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                    auth: arrayBufferToBase64(subscription.getKey('auth'))
                },
                deviceInfo: navigator.userAgent
            };

            console.log('[Push] Sending subscription to backend...');
            await axiosClient.post('/notifications/push/subscribe', subscriptionData);
            console.log('[Push] Backend confirmed subscription');

            setIsSubscribed(true);
            console.log('[Push] Successfully subscribed to push notifications');
            return true;
        } catch (error) {
            console.error('[Push] Error subscribing to push notifications:', error);
            console.error('[Push] Error details:', error.response?.data || error.message);
            return false;
        }
    };

    const unsubscribe = async () => {
        try {
            console.log('[Push] Starting unsubscribe process...');
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                console.log('[Push] Unsubscribing from push manager...');
                await subscription.unsubscribe();
                console.log('[Push] Notifying backend...');
                await axiosClient.delete('/notifications/push/unsubscribe', {
                    params: { endpoint: subscription.endpoint }
                });
                setIsSubscribed(false);
                console.log('[Push] Successfully unsubscribed from push notifications');
            } else {
                console.log('[Push] No active subscription found');
            }
        } catch (error) {
            console.error('[Push] Error unsubscribing from push notifications:', error);
        }
    };

    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        subscribe,
        unsubscribe
    };
};
