import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import ConfirmModal from '../ConfirmModal';
import { Search, X, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CURRENCIES = [
    { code: 'AED', name: 'UAE Dirham' }, { code: 'AFN', name: 'Afghan Afghani' },
    { code: 'ALL', name: 'Albanian Lek' }, { code: 'AMD', name: 'Armenian Dram' },
    { code: 'ARS', name: 'Argentine Peso' }, { code: 'AUD', name: 'Australian Dollar' },
    { code: 'AZN', name: 'Azerbaijani Manat' }, { code: 'BAM', name: 'Bosnian Mark' },
    { code: 'BDT', name: 'Bangladeshi Taka' }, { code: 'BGN', name: 'Bulgarian Lev' },
    { code: 'BHD', name: 'Bahraini Dinar' }, { code: 'BRL', name: 'Brazilian Real' },
    { code: 'CAD', name: 'Canadian Dollar' }, { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CLP', name: 'Chilean Peso' }, { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'COP', name: 'Colombian Peso' }, { code: 'CZK', name: 'Czech Koruna' },
    { code: 'DKK', name: 'Danish Krone' }, { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British Pound' },
    { code: 'GEL', name: 'Georgian Lari' }, { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'HKD', name: 'Hong Kong Dollar' }, { code: 'HRK', name: 'Croatian Kuna' },
    { code: 'HUF', name: 'Hungarian Forint' }, { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'ILS', name: 'Israeli Shekel' }, { code: 'INR', name: 'Indian Rupee' },
    { code: 'IQD', name: 'Iraqi Dinar' }, { code: 'IRR', name: 'Iranian Rial' },
    { code: 'ISK', name: 'Icelandic Króna' }, { code: 'JOD', name: 'Jordanian Dinar' },
    { code: 'JPY', name: 'Japanese Yen' }, { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'KGS', name: 'Kyrgyzstani Som' }, { code: 'KRW', name: 'South Korean Won' },
    { code: 'KWD', name: 'Kuwaiti Dinar' }, { code: 'KZT', name: 'Kazakhstani Tenge' },
    { code: 'LBP', name: 'Lebanese Pound' }, { code: 'LKR', name: 'Sri Lankan Rupee' },
    { code: 'MAD', name: 'Moroccan Dirham' }, { code: 'MKD', name: 'Macedonian Denar' },
    { code: 'MXN', name: 'Mexican Peso' }, { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'NGN', name: 'Nigerian Naira' }, { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'NPR', name: 'Nepalese Rupee' }, { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'OMR', name: 'Omani Rial' }, { code: 'PEN', name: 'Peruvian Sol' },
    { code: 'PHP', name: 'Philippine Peso' }, { code: 'PKR', name: 'Pakistani Rupee' },
    { code: 'PLN', name: 'Polish Zloty' }, { code: 'QAR', name: 'Qatari Riyal' },
    { code: 'RON', name: 'Romanian Leu' }, { code: 'RSD', name: 'Serbian Dinar' },
    { code: 'RUB', name: 'Russian Ruble' }, { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'SEK', name: 'Swedish Krona' }, { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'THB', name: 'Thai Baht' }, { code: 'TJS', name: 'Tajikistani Somoni' },
    { code: 'TMT', name: 'Turkmenistani Manat' }, { code: 'TND', name: 'Tunisian Dinar' },
    { code: 'TRY', name: 'Turkish Lira' }, { code: 'TWD', name: 'Taiwan Dollar' },
    { code: 'UAH', name: 'Ukrainian Hryvnia' }, { code: 'USD', name: 'US Dollar' },
    { code: 'UZS', name: 'Uzbekistani Som' }, { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'XAF', name: 'CFA Franc BEAC' }, { code: 'XOF', name: 'CFA Franc BCEAO' },
    { code: 'ZAR', name: 'South African Rand' }, { code: 'ZMW', name: 'Zambian Kwacha' },
];

const CURRENCY_SYMBOLS = {
    AED: 'د.إ', AFN: '؋', ALL: 'L', AMD: '֏', ARS: '$', AUD: 'A$', AZN: '₼',
    BAM: 'KM', BDT: '৳', BGN: 'лв', BHD: 'BD', BRL: 'R$', CAD: 'C$', CHF: 'CHF',
    CLP: '$', CNY: '¥', COP: '$', CZK: 'Kč', DKK: 'kr', EGP: 'E£', EUR: '€',
    GBP: '£', GEL: '₾', GHS: '₵', HKD: 'HK$', HRK: 'kn', HUF: 'Ft', IDR: 'Rp',
    ILS: '₪', INR: '₹', IQD: 'ع.د', IRR: '﷼', ISK: 'kr', JOD: 'JD', JPY: '¥',
    KES: 'KSh', KGS: 'с', KRW: '₩', KWD: 'KD', KZT: '₸', LBP: 'L£', LKR: 'Rs',
    MAD: 'د.م.', MKD: 'ден', MXN: '$', MYR: 'RM', NGN: '₦', NOK: 'kr', NPR: 'रू',
    NZD: 'NZ$', OMR: 'ر.ع.', PEN: 'S/', PHP: '₱', PKR: 'Rs', PLN: 'zł', QAR: 'ر.ق',
    RON: 'lei', RSD: 'din', RUB: '₽', SAR: 'ر.س', SEK: 'kr', SGD: 'S$', THB: '฿',
    TJS: 'SM', TMT: 'T', TND: 'DT', TRY: '₺', TWD: 'NT$', UAH: '₴', USD: '$',
    UZS: 'лв', VND: '₫', XAF: 'FCFA', XOF: 'CFA', ZAR: 'R', ZMW: 'ZK',
};

const PaymentView = ({ sectionId, section }) => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [currency, setCurrency] = useState(section?.currency || 'INR');
    const [paidByUserId, setPaidByUserId] = useState('');
    const [shares, setShares] = useState({});
    const [splitMode, setSplitMode] = useState('EVERYONE'); // CUSTOM | EVERYONE | PAYER_ONLY
    const [isCustomAuto, setIsCustomAuto] = useState(true);
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false); // only for editing
    // inline new-expense form is always visible (no toggle state needed)
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [showSettleConfirm, setShowSettleConfirm] = useState(false);
    const [expensesPage, setExpensesPage] = useState({ page: 0, totalPages: 0, totalElements: 0 });
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [memberExpenses, setMemberExpenses] = useState([]);
    const [memberExpensesPage, setMemberExpensesPage] = useState({ page: 0, totalPages: 0 });
    const [isMemberExpensesLoading, setIsMemberExpensesLoading] = useState(false);
    const memberScrollRef = useRef(null);
    const [serverTotal, setServerTotal] = useState(0);

    const isWholeAmount = (num) => {
        if (typeof num !== 'number' || !Number.isFinite(num)) return false;
        return Math.floor(num) === num;
    };

    const distributeIntegerShares = (totalInt, userIds) => {
        const n = userIds.length;
        if (!n || totalInt <= 0) return {};

        const shuffled = [...userIds];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const base = Math.floor(totalInt / n);
        const remainder = totalInt % n;

        const allocations = {};
        shuffled.forEach(id => {
            allocations[id] = base;
        });

        for (let i = 0; i < remainder; i++) {
            const id = shuffled[i];
            allocations[id] = (allocations[id] || 0) + 1;
        }

        return allocations;
    };

    useEffect(() => {
        fetchMembers();
        fetchData();
    }, [sectionId]);

    const fetchMembers = async () => {
        try {
            const groupId = localStorage.getItem('currentGroupId');
            if (!groupId) return;
            const res = await axiosClient.get(`/groups/${groupId}/members`);
            setMembers(res.data || []);
        } catch (err) {
            console.error('Failed to load members', err);
        }
    };

    const fetchExpensesPage = async (page = 0, append = false) => {
        try {
            setIsLoadingExpenses(true);
            const expRes = await axiosClient.get(`/groups/sections/${sectionId}/payments/expenses/paged`, {
                params: { page, size: 20 },
            });
            const pageData = expRes.data || {};
            const content = Array.isArray(pageData.content) ? pageData.content : [];

            setExpenses(prev => (append ? [...prev, ...content] : content));
            setExpensesPage({
                page: pageData.number ?? page,
                totalPages: pageData.totalPages ?? 0,
                totalElements: pageData.totalElements ?? content.length,
            });
        } catch (err) {
            console.error('Failed to load expenses', err);
        } finally {
            setIsLoadingExpenses(false);
        }
    };

    const fetchData = async () => {
        try {
            const [_, balRes, totalRes] = await Promise.all([
                fetchExpensesPage(0, false),
                axiosClient.get(`/groups/sections/${sectionId}/payments/balances`),
                axiosClient.get(`/groups/sections/${sectionId}/payments/expenses/total`),
            ]);
            setBalances(Array.isArray(balRes.data) ? balRes.data : []);
            const raw = totalRes?.data ?? 0;
            setServerTotal(typeof raw === 'number' ? raw : parseFloat(raw || '0'));
        } catch (err) {
            console.error('Failed to load payments', err);
        }
    };

    const loadMoreExpenses = async () => {
        if (expensesPage.page >= expensesPage.totalPages - 1) return;
        const nextPage = expensesPage.page + 1;
        await fetchExpensesPage(nextPage, true);
    };

    // Also trigger infinite scroll on window scroll so it works
    // even if the inner container isn't the one scrolling.
    useEffect(() => {
        const handleWindowScroll = () => {
            if (isLoadingExpenses) return;
            if (expensesPage.page >= expensesPage.totalPages - 1) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.documentElement.scrollHeight - 300;
            if (scrollPosition >= threshold) {
                loadMoreExpenses();
            }
        };

        window.addEventListener('scroll', handleWindowScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleWindowScroll);
    }, [isLoadingExpenses, expensesPage.page, expensesPage.totalPages, loadMoreExpenses]);

    const handleScroll = (e) => {
        const el = e.currentTarget;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom < 80 && !isLoadingExpenses && expensesPage.page < expensesPage.totalPages - 1) {
            loadMoreExpenses();
        }
    };

    useEffect(() => {
        if (members.length && !paidByUserId) {
            // Default to current logged-in user; fall back to first member
            const currentMember = members.find(m => m.userId === user?.id) || members[0];
            setPaidByUserId(String(currentMember.userId));
        }
        if (members.length) {
            const initialShares = {};
            members.forEach(m => {
                initialShares[m.userId] = '';
            });
            setShares(initialShares);
            setSelectedUserIds(members.map(m => m.userId));
        }
        // Only initialise when members list changes; changing payer shouldn't reset shares
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members]);

    // Auto-calc equal split when mode is EVERYONE
    useEffect(() => {
        if (splitMode !== 'EVERYONE') return;
        if (!members.length) return;
        const amountNum = parseFloat(totalAmount || '0');
        if (!amountNum || amountNum <= 0) return;
        if (!isWholeAmount(amountNum)) {
            // For non-whole amounts in Everyone mode, don't auto-override shares.
            // User should use Custom split for decimal amounts.
            return;
        }

        const userIds = members.map(m => m.userId);
        const intTotal = Math.trunc(amountNum);
        const allocations = distributeIntegerShares(intTotal, userIds);
        const next = {};
        userIds.forEach(id => {
            const share = allocations[id];
            next[id] = share != null ? share.toString() : '';
        });
        setShares(next);
        setSelectedUserIds(userIds);
    }, [splitMode, members, totalAmount]);

    const totalShares = useMemo(() => {
        return Object.values(shares).reduce((sum, v) => {
            const num = parseFloat(v || '0');
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    }, [shares]);

    // In CUSTOM mode, if an amount is entered and auto mode is on,
    // keep distributing equally across the currently selected members
    // until the user manually edits any share.
    useEffect(() => {
        if (splitMode !== 'CUSTOM') return;
        if (!isCustomAuto) return;
        if (!selectedUserIds.length) return;
        const amountNum = parseFloat(totalAmount || '0');
        if (!amountNum || amountNum <= 0) return;

        recalcCustomEqualShares(totalAmount, selectedUserIds);
    }, [splitMode, totalAmount, selectedUserIds, isCustomAuto]);

    const handleShareChange = (userId, value) => {
        setIsCustomAuto(false);
        setShares(prev => ({ ...prev, [userId]: value }));
    };

    const recalcCustomEqualShares = (baseAmount, selectedIds) => {
        const amountNum = parseFloat(baseAmount || '0');
        if (!amountNum || amountNum <= 0 || !selectedIds.length) {
            setShares(prev => {
                const next = { ...prev };
                selectedIds.forEach(id => { next[id] = ''; });
                return next;
            });
            return;
        }
        if (isWholeAmount(amountNum)) {
            const intTotal = Math.trunc(amountNum);
            const allocations = distributeIntegerShares(intTotal, selectedIds);
            setShares(prev => {
                const next = { ...prev };
                selectedIds.forEach(id => {
                    const share = allocations[id];
                    next[id] = share != null ? share.toString() : '';
                });
                return next;
            });
        } else {
            const per = +(amountNum / selectedIds.length).toFixed(2);
            setShares(prev => {
                const next = { ...prev };
                selectedIds.forEach(id => {
                    next[id] = per.toString();
                });
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amountNum = parseFloat(totalAmount || '0');
        if (!amountNum || amountNum <= 0) {
            toast.error('Amount must be greater than zero');
            return;
        }
        if (!paidByUserId) {
            toast.error('Please select who paid');
            return;
        }

        let shareInputs;

        if (splitMode === 'PAYER_ONLY') {
            // Record as an expense but fully personal to the payer
            shareInputs = [
                {
                    userId: Number(paidByUserId),
                    shareAmount: amountNum,
                },
            ];
        } else if (splitMode === 'EVERYONE') {
            if (!members.length) return;
            if (!isWholeAmount(amountNum)) {
                toast.error('For equal split between everyone, use a whole amount (no decimals). Use Custom split for decimals.');
                return;
            }
            const userIds = members.map(m => m.userId);
            const intTotal = Math.trunc(amountNum);
            const allocations = distributeIntegerShares(intTotal, userIds);
            shareInputs = userIds.map(id => ({
                userId: id,
                shareAmount: allocations[id] ?? 0,
            }));
        } else {
            // CUSTOM: use manual shares for selected users
            shareInputs = Object.entries(shares)
                .filter(([userId]) => selectedUserIds.includes(Number(userId)))
                .map(([userId, val]) => ({
                    userId: Number(userId),
                    shareAmount: parseFloat(val || '0') || 0,
                }))
                .filter(s => s.shareAmount > 0);
            if (!shareInputs.length) {
                toast.error('Enter at least one non-zero share');
                return;
            }
        }

        const sumShares = shareInputs.reduce((acc, s) => acc + (s.shareAmount || 0), 0);
        const roundedTotal = Math.round(amountNum * 100) / 100;
        const roundedShares = Math.round(sumShares * 100) / 100;
        if (Math.abs(roundedShares - roundedTotal) > 0.01) {
            toast.error('Sum of shares must equal total amount');
            return;
        }

        const payload = {
            description: description || null,
            totalAmount: amountNum,
            currency,
            expenseDate: null,
            paidByUserId: Number(paidByUserId),
            shares: shareInputs,
        };

        try {
            if (editingExpenseId) {
                await axiosClient.put(`/groups/sections/${sectionId}/payments/expenses/${editingExpenseId}`, payload);
                toast.success('Expense updated');
            } else {
                await axiosClient.post(`/groups/sections/${sectionId}/payments/expenses`, payload);
                toast.success('Expense added');
            }
            setDescription('');
            setTotalAmount('');
            setEditingExpenseId(null);
            setShowExpenseModal(false);
            setSplitMode('EVERYONE');
            setIsCustomAuto(true);
            const currentMember = members.find(m => m.userId === user?.id) || members[0];
            if (currentMember) setPaidByUserId(String(currentMember.userId));
            const resetShares = {};
            members.forEach(m => { resetShares[m.userId] = ''; });
            setShares(resetShares);
            setSelectedUserIds(members.map(m => m.userId));
            fetchData();
        } catch (err) {
            console.error('Failed to save expense', err);
            toast.error('Failed to save expense');
        }
    };

    const startEdit = (exp) => {
        setEditingExpenseId(exp.id);
        setShowExpenseModal(true);
        setDescription(exp.description || '');
        setTotalAmount(exp.totalAmount != null ? String(exp.totalAmount) : '');
        setPaidByUserId(String(exp.paidByUserId));

        const sharesArr = Array.isArray(exp.shares) ? exp.shares : [];
        const amount = exp.totalAmount || 0;
        let mode = 'CUSTOM';

        if (sharesArr.length === 1 && sharesArr[0].userId === exp.paidByUserId && sharesArr[0].shareAmount === amount) {
            mode = 'PAYER_ONLY';
        } else if (sharesArr.length === members.length && members.length > 0) {
            const per = +(amount / members.length).toFixed(2);
            const allEqual = sharesArr.every(s => Math.abs(s.shareAmount - per) < 0.01);
            if (allEqual) {
                mode = 'EVERYONE';
            }
        }

        setSplitMode(mode);
        // For existing expenses, don't auto-adjust custom shares
        setIsCustomAuto(false);

        const map = {};
        const selected = [];
        members.forEach(m => {
            const found = sharesArr.find(s => s.userId === m.userId);
            if (found && found.shareAmount && found.shareAmount > 0) {
                selected.push(m.userId);
                map[m.userId] = String(found.shareAmount);
            } else {
                map[m.userId] = '';
            }
        });
        setShares(map);
        setSelectedUserIds(selected.length ? selected : members.map(m => m.userId));
    };

    const cancelEdit = () => {
        setShowExpenseModal(false);
        setEditingExpenseId(null);
        setDescription('');
        setTotalAmount('');
        setSplitMode('EVERYONE');
        setIsCustomAuto(true);
        const currentMember = members.find(m => m.userId === user?.id) || members[0];
        if (currentMember) setPaidByUserId(String(currentMember.userId));
        const resetShares = {};
        members.forEach(m => { resetShares[m.userId] = ''; });
        setShares(resetShares);
        setSelectedUserIds(members.map(m => m.userId));
    };

    const deleteExpense = async (expId) => {
        try {
            await axiosClient.delete(`/groups/sections/${sectionId}/payments/expenses/${expId}`);
            if (editingExpenseId === expId) {
                cancelEdit();
            }
            toast.success('Expense removed');
            fetchData();
        } catch (err) {
            console.error('Failed to delete expense', err);
            toast.error('Failed to delete expense');
        }
    };

    const getMemberName = (userId) => {
        const m = members.find(x => x.userId === userId);
        if (!m) return 'Unknown';
        return `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email;
    };

    const displayCurrency = (code) => {
        if (!code) return '';
        return CURRENCY_SYMBOLS[code] || code;
    };

    const handleCurrencyChange = async (newCode) => {
        setCurrency(newCode);
        try {
            await axiosClient.patch(`/groups/sections/${sectionId}/currency`, { currency: newCode });
        } catch (err) {
            console.error('Failed to update currency', err);
        }
    };

    // Greedy creditor-debtor matching to produce "X should pay Y ₹Z" lines.
    const computeSettlements = (bals) => {
        const creditors = bals.filter(b => b.balance > 0.005).map(b => ({ userId: b.userId, amount: b.balance }));
        const debtors = bals.filter(b => b.balance < -0.005).map(b => ({ userId: b.userId, amount: -b.balance }));
        const result = [];
        let ci = 0, di = 0;
        while (ci < creditors.length && di < debtors.length) {
            const pay = Math.min(creditors[ci].amount, debtors[di].amount);
            if (pay > 0.005) {
                result.push({ debtorId: debtors[di].userId, creditorId: creditors[ci].userId, amount: pay });
            }
            creditors[ci].amount -= pay;
            debtors[di].amount -= pay;
            if (creditors[ci].amount < 0.005) ci++;
            if (debtors[di].amount < 0.005) di++;
        }
        return result;
    };

    const fetchMemberExpenses = async (userId, page = 0, append = false) => {
        try {
            setIsMemberExpensesLoading(true);
            const res = await axiosClient.get(`/groups/sections/${sectionId}/payments/expenses/paged`, {
                params: { page, size: 20, userId },
            });
            const pageData = res.data || {};
            const content = Array.isArray(pageData.content) ? pageData.content : [];
            setMemberExpenses(prev => (append ? [...prev, ...content] : content));
            setMemberExpensesPage({ page: pageData.number ?? page, totalPages: pageData.totalPages ?? 0 });
        } catch (err) {
            console.error('Failed to load member expenses', err);
        } finally {
            setIsMemberExpensesLoading(false);
        }
    };

    const handleMemberScroll = useCallback(() => {
        const el = memberScrollRef.current;
        if (!el || isMemberExpensesLoading) return;
        if (memberExpensesPage.page < memberExpensesPage.totalPages - 1 &&
            el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
            fetchMemberExpenses(selectedMemberId, memberExpensesPage.page + 1, true);
        }
    }, [isMemberExpensesLoading, memberExpensesPage, selectedMemberId]);

    const openMemberBreakdown = (userId) => {
        setSelectedMemberId(userId);
        setMemberExpenses([]);
        setMemberExpensesPage({ page: 0, totalPages: 0 });
        fetchMemberExpenses(userId, 0, false);
    };

    const closeMemberBreakdown = () => {
        setSelectedMemberId(null);
        setMemberExpenses([]);
    };

    const hasNonZeroBalance = useMemo(() => {
        return balances.some(b => Math.abs(b.balance || 0) > 0.01);
    }, [balances]);

    // Shared form body used for both inline-new and edit-modal
    const expenseFormBody = (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-2">
                <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What was this for?"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none"
                    autoFocus={false}
                />
                <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    placeholder={`Amount in ${displayCurrency(currency) || '₹'}`}
                    className="w-36 px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                <span className="mr-1 text-gray-500">Split between:</span>
                <button
                    type="button"
                    onClick={() => {
                        setSplitMode('CUSTOM');
                        setIsCustomAuto(true);
                        const allIds = members.map(m => m.userId);
                        setSelectedUserIds(allIds);
                        recalcCustomEqualShares(totalAmount, allIds);
                    }}
                    className={`px-2 py-1 rounded-full border ${splitMode === 'CUSTOM' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                    Custom
                </button>
                <button
                    type="button"
                    onClick={() => setSplitMode('EVERYONE')}
                    className={`px-2 py-1 rounded-full border ${splitMode === 'EVERYONE' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                    Everyone
                </button>
                <button
                    type="button"
                    onClick={() => setSplitMode('PAYER_ONLY')}
                    className={`px-2 py-1 rounded-full border ${splitMode === 'PAYER_ONLY' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                    No one
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="text-gray-500">Paid by</span>
                <select
                    value={paidByUserId}
                    onChange={e => setPaidByUserId(e.target.value)}
                    className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none"
                >
                    {members.map(m => (
                        <option key={m.userId} value={m.userId}>
                            {getMemberName(m.userId)}
                        </option>
                    ))}
                </select>
                {splitMode !== 'PAYER_ONLY' && (
                    <span className="text-[11px] text-gray-400 ml-auto">Shares total: {totalShares.toFixed(2)}</span>
                )}
            </div>

            {splitMode === 'CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 border rounded-lg p-2 bg-gray-50">
                    {members.map(m => {
                        const id = m.userId;
                        const checked = selectedUserIds.includes(id);
                        return (
                            <div key={id} className="flex items-center justify-between gap-2">
                                <label className="flex items-center gap-2 flex-1 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={e => {
                                            const isChecked = e.target.checked;
                                            setSelectedUserIds(prev => {
                                                let next;
                                                if (isChecked) {
                                                    next = [...prev, id];
                                                } else {
                                                    next = prev.filter(x => x !== id);
                                                }
                                                if (splitMode === 'CUSTOM') {
                                                    recalcCustomEqualShares(totalAmount, next);
                                                }
                                                return next;
                                            });
                                        }}
                                        className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                                    />
                                    <span className={`text-xs truncate ${checked ? 'text-gray-700' : 'text-gray-400'}`}>{getMemberName(id)}</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={shares[id] ?? ''}
                                    onChange={e => handleShareChange(id, e.target.value)}
                                    disabled={!checked}
                                    className={`w-24 px-2 py-1 border rounded-lg text-xs text-right focus:outline-none ${!checked ? 'opacity-40 bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="0.00"
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                    disabled={!totalAmount || !paidByUserId}
                >
                    {editingExpenseId ? 'Update expense' : 'Add expense'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="sm:p-4 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-1">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Expenses</h2>
                    <p className="text-xs text-gray-500">Track shared expenses in your group and see who owes whom.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={currency}
                        onChange={e => handleCurrencyChange(e.target.value)}
                        className="h-9 text-xs border border-gray-200 rounded-lg px-2 focus:outline-none bg-white text-gray-600"
                        title="Section currency"
                    >
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                        ))}
                    </select>
                    <div className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
                        <span className="uppercase tracking-wide font-semibold">Total</span>
                        <span className="font-semibold text-xs text-gray-900">{displayCurrency(currency)}{serverTotal.toFixed(2)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowSettleConfirm(true)}
                        disabled={!hasNonZeroBalance}
                        className="h-9 px-4 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Settle payments
                    </button>
                </div>
            </div>

            {/* Edit-expense modal */}
            {showExpenseModal && editingExpenseId && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-10 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/40" onClick={cancelEdit} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg my-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900">Edit expense</h3>
                            <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5">
                            {expenseFormBody}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 mt-2 lg:flex lg:gap-6 lg:items-start">
                {/* Left column — form + balances (sticky on lg) */}
                <div className="lg:w-[25dvw] lg:flex-shrink-0 lg:sticky lg:top-[15dvh] min-h-[80dvh] lg:self-start space-y-3">
                    {!editingExpenseId && (
                        <div className="border border-gray-200 rounded-xl shadow-sm p-4">
                            {expenseFormBody}
                        </div>
                    )}
                    <div className="border rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Balances</h3>
                        {balances.length > 0 && <span className="text-[10px] text-gray-400">(click a name for details)</span>}
                    </div>
                    {balances.length === 0 ? (
                        <p className="text-xs text-gray-400">No balances yet.</p>
                    ) : (
                        <ul className="grid grid-cols-1 lg:grid-cols-1 gap-x-4 gap-y-1 text-xs">
                            {balances.map(b => {
                                const bm = members.find(x => x.userId === b.userId);
                                const bmInitials = `${bm?.firstName?.charAt(0) || ''}${bm?.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
                                return (
                                    <li key={b.userId}>
                                        <button
                                            type="button"
                                            onClick={() => openMemberBreakdown(b.userId)}
                                            className="w-full flex items-center gap-2 px-1 py-1 rounded hover:bg-white transition-colors text-left"
                                        >
                                            <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                {bm?.pfpUrl
                                                    ? <img src={bm.pfpUrl} alt={getMemberName(b.userId)} className="w-full h-full object-cover" />
                                                    : bmInitials
                                                }
                                            </div>
                                            <span className="text-gray-700 underline decoration-dotted underline-offset-2 text-xs flex-1 truncate">{getMemberName(b.userId)}</span>
                                            <span className={b.balance > 0 ? 'text-emerald-600 font-medium' : b.balance < 0 ? 'text-red-500 font-medium' : 'text-gray-500'}>
                                                {b.balance > 0 ? '+' : b.balance < 0 ? '-' : ''}{displayCurrency(currency)}{Math.abs(b.balance).toFixed(2)}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                </div>{/* end left column */}

                {/* Right column — expenses (page scrolls, left stays sticky) */}
                <div className="lg:flex-1 mt-4 lg:mt-0" onScroll={handleScroll}>
                <div className="border rounded-lg bg-white p-3">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Expenses</h3>
                    {expenses.length > 4 && (
                        <div className="relative mb-3 max-w-xs">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                placeholder="Filter expenses…"
                                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none"
                            />
                        </div>
                    )}
                    {expenses.length === 0 ? (
                        <p className="text-xs text-gray-400">No expenses yet.</p>
                    ) : (
                        <ul className="space-y-2 text-xs">
                            {expenses.filter(exp => !filterText || (exp.description || '').toLowerCase().includes(filterText.toLowerCase())).map(exp => (
                                <li key={exp.id} className="border rounded-md p-2">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-sm text-gray-800">{exp.description || 'Expense'}</span>
                                        <span className="text-gray-700 font-semibold text-sm">{displayCurrency(exp.currency)}{exp.totalAmount?.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Paid by {exp.paidByFirstName} {exp.paidByLastName}
                                    </p>
                                    {(() => {
                                        const sharesArr = Array.isArray(exp.shares) ? exp.shares : [];
                                        const amount = exp.totalAmount || 0;
                                        const isSettlement = (exp.description || '').toLowerCase() === 'settlement';
                                        const isPayerOnly =
                                            sharesArr.length === 1 &&
                                            sharesArr[0].userId === exp.paidByUserId &&
                                            Math.abs((sharesArr[0].shareAmount || 0) - amount) < 0.01;

                                        if (isSettlement && sharesArr.length === 1) {
                                            const counterparty = sharesArr[0];
                                            const counterName = `${counterparty.firstName || ''} ${counterparty.lastName || ''}`.trim() || 'Member';
                                            return (
                                                <p className="text-xs text-emerald-700">
                                                    Dues settled between {exp.paidByFirstName} {exp.paidByLastName} and {counterName}.
                                                </p>
                                            );
                                        }

                                        if (isPayerOnly) {
                                            return (
                                                <p className="text-xs text-gray-400">
                                                    No one else shares this expense.
                                                </p>
                                            );
                                        }

                                        return (
                                            <ul className="text-xs text-gray-600 space-y-0.5">
                                                {sharesArr.map(s => {
                                                    const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Member';
                                                    const isPayer = s.userId === exp.paidByUserId;
                                                    const amountText = `${displayCurrency(exp.currency)}${(s.shareAmount || 0).toFixed(2)}`;
                                                    return (
                                                        <li key={s.userId}>
                                                            {!isPayer && `${name} owes ${amountText}.`}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        );
                                    })()}
                                    <div className="mt-2 flex justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(exp)}
                                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                                            title="Edit"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteExpense(exp.id)}
                                            className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                                            title="Delete"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                </div>{/* end right column */}
            </div>{/* end lg:flex */}
            {selectedMemberId && (() => {
                const memberBalance = balances.find(b => b.userId === selectedMemberId);
                const memberName = getMemberName(selectedMemberId);
                const balance = memberBalance?.balance ?? 0;
                const settlements = computeSettlements(balances);
                const owes = settlements.filter(s => s.debtorId === selectedMemberId);
                const owedBy = settlements.filter(s => s.creditorId === selectedMemberId);

                return (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-10 overflow-y-auto">
                        <div className="absolute inset-0 bg-black/40" onClick={closeMemberBreakdown} />
                        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg my-auto">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">{memberName}'s Breakdown</h3>
                                    <p className={`text-xs mt-0.5 ${balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                        Net balance: {balance > 0 ? '+' : ''}{displayCurrency(currency)}{balance.toFixed(2)}
                                        {balance > 0 ? ' (is owed money)' : balance < 0 ? ' (owes money)' : ' (settled)'}
                                    </p>
                                </div>
                                <button type="button" onClick={closeMemberBreakdown} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            </div>

                            <div ref={memberScrollRef} onScroll={handleMemberScroll} className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                {(owes.length > 0 || owedBy.length > 0) && (
                                    <div>
                                        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Settlement Summary</h4>
                                        {owes.length > 0 && (
                                            <ul className="space-y-1 mb-2">
                                                {owes.map((s, i) => (
                                                    <li key={i} className="flex items-center justify-between text-xs bg-red-50 border border-red-100 rounded-md px-3 py-1.5">
                                                        <span className="text-gray-700">
                                                            {memberName} → {getMemberName(s.creditorId)}
                                                        </span>
                                                        <span className="text-red-600 font-semibold">{displayCurrency(currency)}{s.amount.toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {owedBy.length > 0 && (
                                            <ul className="space-y-1">
                                                {owedBy.map((s, i) => (
                                                    <li key={i} className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-100 rounded-md px-3 py-1.5">
                                                        <span className="text-gray-700">
                                                            {getMemberName(s.debtorId)} → {memberName}
                                                        </span>
                                                        <span className="text-emerald-600 font-semibold">{displayCurrency(currency)}{s.amount.toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                                {balance === 0 && owes.length === 0 && owedBy.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-1">All settled up.</p>
                                )}

                                <div>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Transactions</h4>
                                    {isMemberExpensesLoading && memberExpenses.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
                                    ) : memberExpenses.length === 0 ? (
                                        <p className="text-xs text-gray-400">No transactions found.</p>
                                    ) : (
                                        <ul className="space-y-2 text-xs">
                                            {memberExpenses.map(exp => {
                                                const isSettlement = (exp.expenseType === 'SETTLEMENT') || ((exp.description || '').toLowerCase() === 'settlement');
                                                const sharesArr = Array.isArray(exp.shares) ? exp.shares : [];
                                                const memberShare = sharesArr.find(s => s.userId === selectedMemberId);
                                                const isPayer = exp.paidByUserId === selectedMemberId;
                                                return (
                                                    <li key={exp.id} className="border rounded-md p-2.5">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <span className="font-medium text-gray-800 leading-tight">{exp.description || 'Expense'}</span>
                                                            <span className="text-gray-900 font-semibold whitespace-nowrap">{displayCurrency(exp.currency)}{(exp.totalAmount || 0).toFixed(2)}</span>
                                                        </div>
                                                        {isSettlement ? (() => {
                                                            // Show who the settlement was with
                                                            const isPayer = exp.paidByUserId === selectedMemberId;
                                                            let counterName;
                                                            if (isPayer) {
                                                                const other = sharesArr.find(s => s.userId !== exp.paidByUserId);
                                                                counterName = other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'Member' : 'Member';
                                                            } else {
                                                                counterName = `${exp.paidByFirstName || ''} ${exp.paidByLastName || ''}`.trim() || 'Member';
                                                            }
                                                            return (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                                                                    Settled with {counterName}
                                                                </span>
                                                            );
                                                        })() : (
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {(() => {
                                                                    const isPayerOnly = sharesArr.length === 1 &&
                                                                        sharesArr[0].userId === exp.paidByUserId &&
                                                                        Math.abs((sharesArr[0].shareAmount || 0) - (exp.totalAmount || 0)) < 0.01;
                                                                    if (isPayerOnly) {
                                                                        return (
                                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                                                Personal (no split)
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                                {isPayer && !(sharesArr.length === 1 && sharesArr[0].userId === exp.paidByUserId) && (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                        PAID {displayCurrency(exp.currency)}{(exp.totalAmount || 0).toFixed(2)}
                                                                    </span>
                                                                )}
                                                                {memberShare && memberShare.userId !== exp.paidByUserId && (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
                                                                        OWES {`${exp.paidByFirstName || ''} ${exp.paidByLastName || ''}`.trim() || 'Member'} {displayCurrency(exp.currency)}{(memberShare.shareAmount || 0).toFixed(2)}
                                                                    </span>
                                                                )}
                                                                {isPayer && memberShare && Math.abs((memberShare.shareAmount || 0) - (exp.totalAmount || 0)) > 0.01 && !(sharesArr.length === 1 && sharesArr[0].userId === exp.paidByUserId) && (
                                                                    <span className="text-[10px] text-gray-400">their share: {displayCurrency(exp.currency)}{(memberShare.shareAmount || 0).toFixed(2)}</span>
                                                                )}
                                                                {!isPayer && !memberShare && (
                                                                    <span className="text-[10px] text-gray-400">Paid by {exp.paidByFirstName} {exp.paidByLastName}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                    {isMemberExpensesLoading && memberExpenses.length > 0 && (
                                        <div className="mt-3 flex justify-center">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showSettleConfirm && (
                <ConfirmModal
                    title="Settle all balances?"
                    message={"This will create settlement entries so that everyone's balance becomes zero."}
                    confirmLabel="Settle"
                    onCancel={() => setShowSettleConfirm(false)}
                    onConfirm={async () => {
                        setShowSettleConfirm(false);
                        try {
                            await axiosClient.post(`/groups/sections/${sectionId}/payments/settle`);
                            toast.success('Balances settled');
                            fetchData();
                        } catch (err) {
                            console.error('Failed to settle payments', err);
                            toast.error('Failed to settle payments');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default PaymentView;
