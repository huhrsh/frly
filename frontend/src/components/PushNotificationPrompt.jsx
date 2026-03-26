import React, { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const PushNotificationPrompt = ({ onClose }) => {
    const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
    const [loading, setLoading] = useState(false);

    const handleEnable = async () => {
        setLoading(true);
        const success = await subscribe();
        setLoading(false);
        if (success) {
            onClose();
        }
    };

    const handleDisable = async () => {
        setLoading(true);
        await unsubscribe();
        setLoading(false);
    };

    if (!isSupported) {
        return null;
    }

    // Don't show if already denied
    if (permission === 'denied') {
        return null;
    }

    // Show enable prompt if not subscribed
    if (!isSubscribed && permission === 'default') {
        return (
            <div className="fixed bottom-4 right-4 z-50 max-w-sm">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                Enable push notifications
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Get instant alerts for expenses, reminders, and group updates even when fryly is closed.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEnable}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Enabling...' : 'Enable'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200"
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show status if subscribed
    if (isSubscribed) {
        return (
            <div className="fixed bottom-4 right-4 z-50 max-w-sm">
                <div className="bg-green-50 rounded-lg shadow-lg border border-green-200 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <Bell className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-green-900 mb-1">
                                Push notifications enabled
                            </h3>
                            <p className="text-xs text-green-700 mb-3">
                                You'll receive important updates for expenses, reminders, and group activities.
                            </p>
                            <button
                                onClick={handleDisable}
                                disabled={loading}
                                className="px-3 py-1.5 bg-white text-green-700 border border-green-300 rounded-md text-xs font-medium hover:bg-green-50 disabled:opacity-50"
                            >
                                {loading ? 'Disabling...' : 'Disable notifications'}
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-green-400 hover:text-green-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default PushNotificationPrompt;
