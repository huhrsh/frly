import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import ConfirmModal from '../ConfirmModal';

const PaymentView = ({ sectionId }) => {
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [currency] = useState('INR');
    const [paidByUserId, setPaidByUserId] = useState('');
    const [shares, setShares] = useState({});
    const [splitMode, setSplitMode] = useState('EVERYONE'); // CUSTOM | EVERYONE | PAYER_ONLY
    const [isCustomAuto, setIsCustomAuto] = useState(true);
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [showSettleConfirm, setShowSettleConfirm] = useState(false);
    const [expensesPage, setExpensesPage] = useState({ page: 0, totalPages: 0, totalElements: 0 });
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

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
            const [_, balRes] = await Promise.all([
                fetchExpensesPage(0, false),
                axiosClient.get(`/groups/sections/${sectionId}/payments/balances`),
            ]);
            setBalances(Array.isArray(balRes.data) ? balRes.data : []);
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
            const currentUser = members[0];
            setPaidByUserId(String(currentUser.userId));
        }
        if (members.length) {
            const initialShares = {};
            members.forEach(m => {
                initialShares[m.userId] = '';
            });
            setShares(initialShares);
            setSelectedUserIds(members.map(m => m.userId));
        }
    }, [members, paidByUserId]);

    // Auto-calc equal split when mode is EVERYONE
    useEffect(() => {
        if (splitMode !== 'EVERYONE') return;
        if (!members.length) return;
        const amountNum = parseFloat(totalAmount || '0');
        if (!amountNum || amountNum <= 0) return;

        const per = +(amountNum / members.length).toFixed(2);
        const next = {};
        members.forEach(m => {
            next[m.userId] = per.toString();
        });
        setShares(next);
        setSelectedUserIds(members.map(m => m.userId));
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

        const per = +(amountNum / selectedIds.length).toFixed(2);
        setShares(prev => {
            const next = { ...prev };
            selectedIds.forEach(id => {
                next[id] = per.toString();
            });
            return next;
        });
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
            const per = +(amountNum / members.length).toFixed(2);
            shareInputs = members.map(m => ({
                userId: m.userId,
                shareAmount: per,
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
        if (Math.abs(sumShares - amountNum) > 0.01) {
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
        setEditingExpenseId(null);
        setDescription('');
        setTotalAmount('');
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
        if (code === 'INR') return '₹';
        return code;
    };

    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, e) => {
            const amt = typeof e.totalAmount === 'number' ? e.totalAmount : parseFloat(e.totalAmount || '0');
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [expenses]);

    const hasNonZeroBalance = useMemo(() => {
        return balances.some(b => Math.abs(b.balance || 0) > 0.01);
    }, [balances]);

    return (
        <div className="h-full flex flex-col sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-1">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Expenses</h2>
                    <p className="text-xs text-gray-500">Track shared expenses in your group and see who owes whom.</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
                        <span className="uppercase tracking-wide font-semibold">Total</span>
                        <span className="font-semibold text-gray-900">{displayCurrency(currency)}{totalExpenses.toFixed(2)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowSettleConfirm(true)}
                        disabled={!hasNonZeroBalance}
                        className="px-3 py-1 rounded-full text-[11px] font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Settle payments
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="What was this for?"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="number"
                        step="0.01"
                        value={totalAmount}
                        onChange={e => setTotalAmount(e.target.value)}
                        placeholder={`Amount in ${displayCurrency(currency) || '₹'}`}
                        className="w-36 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-2 bg-gray-50">
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
                                        <span className="text-xs text-gray-700 truncate">{getMemberName(id)}</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={shares[id] ?? ''}
                                        onChange={e => handleShareChange(id, e.target.value)}
                                        className="w-24 px-2 py-1 border rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-between items-center">
                    {editingExpenseId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="mt-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel edit
                        </button>
                    )}
                    <div className="flex-1" />
                    <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                        disabled={!totalAmount || !paidByUserId}
                    >
                        {editingExpenseId ? 'Update expense' : 'Add expense'}
                    </button>
                </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-4 mt-2" onScroll={handleScroll}>
                <div className="border rounded-lg bg-white p-3">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Balances</h3>
                    {balances.length === 0 ? (
                        <p className="text-xs text-gray-400">No balances yet.</p>
                    ) : (
                        <ul className="space-y-1 text-xs">
                            {balances.map(b => (
                                <li key={b.userId} className="flex justify-between">
                                    <span className="text-gray-700">{getMemberName(b.userId)}</span>
                                    <span className={b.balance > 0 ? 'text-emerald-600' : b.balance < 0 ? 'text-red-500' : 'text-gray-500'}>
                                        {b.balance > 0 ? '+' : ''}{displayCurrency(currency)}{b.balance.toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="border rounded-lg bg-white p-3">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Expenses</h3>
                    {expenses.length === 0 ? (
                        <p className="text-xs text-gray-400">No expenses yet.</p>
                    ) : (
                        <ul className="space-y-2 text-xs">
                            {expenses.map(exp => (
                                <li key={exp.id} className="border rounded-md p-2">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-gray-800">{exp.description || 'Expense'}</span>
                                        <span className="text-gray-900 font-semibold">{displayCurrency(exp.currency)}{exp.totalAmount?.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mb-1">
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
                                                <p className="text-[11px] text-emerald-700">
                                                    Dues settled between {exp.paidByFirstName} {exp.paidByLastName} and {counterName}.
                                                </p>
                                            );
                                        }

                                        if (isPayerOnly) {
                                            return (
                                                <p className="text-[11px] text-gray-400">
                                                    No one else shares this expense.
                                                </p>
                                            );
                                        }

                                        return (
                                            <ul className="text-[11px] text-gray-600 space-y-0.5">
                                                {sharesArr.map(s => {
                                                    const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Member';
                                                    const isPayer = s.userId === exp.paidByUserId;
                                                    const amountText = `${displayCurrency(exp.currency)}${(s.shareAmount || 0).toFixed(2)}`;
                                                    return (
                                                        <li key={s.userId}>
                                                            {isPayer ? `${name} pays ${amountText} as their share.` : `${name} owes ${amountText}.`}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        );
                                    })()}
                                    <div className="mt-2 flex justify-end gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(exp)}
                                            className="px-2 py-0.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteExpense(exp.id)}
                                            className="px-2 py-0.5 border border-red-300 rounded-md text-red-600 hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
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
