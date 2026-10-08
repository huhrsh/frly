const types = {
    NOTE: { label: 'Note', color: '#60a5fa', badge: 'bg-blue-50 text-blue-700' },
    LIST: { label: 'Checklist', color: '#34d399', badge: 'bg-emerald-50 text-emerald-700' },
    LINKS: { label: 'Links', color: '#38bdf8', badge: 'bg-sky-50 text-sky-700' },
    GALLERY: { label: 'Files', color: '#fb7185', badge: 'bg-rose-50 text-rose-700' },
    REMINDER: { label: 'Reminder', color: '#fbbf24', badge: 'bg-amber-50 text-amber-700' },
    PAYMENT: { label: 'Expenses', color: '#a78bfa', badge: 'bg-purple-50 text-purple-700' },
    CALENDAR: { label: 'Calendar', color: '#818cf8', badge: 'bg-indigo-50 text-indigo-700' },
    FOLDER: { label: 'Folder', color: '#94a3b8', badge: 'bg-gray-100 text-gray-700' },
};

export const getSectionPresentation = (type) => types[type] || types.FOLDER;

export function formatSectionMoney(amount, currency = 'INR') {
    const value = Number(amount) || 0;
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: currency || 'INR',
            minimumFractionDigits: 2, maximumFractionDigits: 2,
        }).format(value);
    } catch {
        // Older sections can contain non-ISO currency values accepted by the API.
        return `${currency || 'INR'} ${value.toFixed(2)}`;
    }
}
