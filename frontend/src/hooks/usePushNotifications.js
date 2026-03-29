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
            setIsSubscribed(subscribed);
            return subscribed;
        } catch (error) {
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
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                return false;
            }

            const keyResponse = await axiosClient.get('/notifications/push/public-key');
            const publicKey = keyResponse.data;

            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            const subscriptionData = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                    auth: arrayBufferToBase64(subscription.getKey('auth'))
                },
                deviceInfo: navigator.userAgent
            };

            await axiosClient.post('/notifications/push/subscribe', subscriptionData);

            setIsSubscribed(true);
            return true;
        } catch (error) {
            return false;
        }
    };

    const unsubscribe = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                await axiosClient.delete('/notifications/push/unsubscribe', {
                    params: { endpoint: subscription.endpoint }
                });
                setIsSubscribed(false);
            }
        } catch (error) {
            // Silently handle error
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
