import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const PaymentView = ({ sectionId }) => {
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [currency] = useState('INR');
    const [paidByUserId, setPaidByUserId] = useState('');
    const [shares, setShares] = useState({});
    const [splitMode, setSplitMode] = useState('CUSTOM'); // CUSTOM | EVERYONE | PAYER_ONLY
    const [editingExpenseId, setEditingExpenseId] = useState(null);

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

    const fetchData = async () => {
        try {
            const [expRes, balRes] = await Promise.all([
                axiosClient.get(`/groups/sections/${sectionId}/payments/expenses`),
                axiosClient.get(`/groups/sections/${sectionId}/payments/balances`),
            ]);
            setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
            setBalances(Array.isArray(balRes.data) ? balRes.data : []);
        } catch (err) {
            console.error('Failed to load payments', err);
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
    }, [splitMode, members, totalAmount]);

    const totalShares = useMemo(() => {
        return Object.values(shares).reduce((sum, v) => {
            const num = parseFloat(v || '0');
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    }, [shares]);

    const handleShareChange = (userId, value) => {
        setShares(prev => ({ ...prev, [userId]: value }));
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
            // Record as an expense but balanced entirely by the payer (no one owes anyone)
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
            // CUSTOM: use manual shares
            shareInputs = Object.entries(shares)
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

        // Infer split mode
        const shares = Array.isArray(exp.shares) ? exp.shares : [];
        const amount = exp.totalAmount || 0;
        let mode = 'CUSTOM';

        if (shares.length === 1 && shares[0].userId === exp.paidByUserId && shares[0].shareAmount === amount) {
            mode = 'PAYER_ONLY';
        } else if (shares.length === members.length && members.length > 0) {
            const per = +(amount / members.length).toFixed(2);
            const allEqual = shares.every(s => Math.abs(s.shareAmount - per) < 0.01);
            if (allEqual) {
                mode = 'EVERYONE';
            }
        }

        setSplitMode(mode);

        const map = {};
        members.forEach(m => {
            const found = shares.find(s => s.userId === m.userId);
            map[m.userId] = found ? String(found.shareAmount) : '';
        });
        setShares(map);
    };

    const cancelEdit = () => {
        setEditingExpenseId(null);
        setDescription('');
        setTotalAmount('');
        const resetShares = {};
        members.forEach(m => { resetShares[m.userId] = ''; });
        setShares(resetShares);
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

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Payments</h2>
            <p className="text-xs text-gray-500 mb-4">Track shared expenses and see who owes whom.</p>

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
                        placeholder="Amount"
                        className="w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="px-3 py-2 border rounded-lg text-xs text-gray-600 bg-gray-50 flex items-center">
                        INR
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                    <span className="mr-1">Split between:</span>
                    <button
                        type="button"
                        onClick={() => setSplitMode('CUSTOM')}
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
                        No split
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <span className="text-xs text-gray-500">Paid by</span>
                    <select
                        value={paidByUserId}
                        onChange={e => setPaidByUserId(e.target.value)}
                        className="px-2 py-1.5 border rounded-lg text-sm flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {members.map(m => (
                            <option key={m.userId} value={m.userId}>
                                {getMemberName(m.userId)}
                            </option>
                        ))}
                    </select>
                    {splitMode !== 'PAYER_ONLY' && (
                        <span className="text-xs text-gray-400 ml-auto">Shares total: {totalShares.toFixed(2)}</span>
                    )}
                </div>

                {splitMode !== 'PAYER_ONLY' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-2 bg-gray-50">
                        {members.map(m => (
                            <div key={m.userId} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-gray-700 truncate">{getMemberName(m.userId)}</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={shares[m.userId] ?? ''}
                                    onChange={e => handleShareChange(m.userId, e.target.value)}
                                    className={`w-24 px-2 py-1 border rounded-lg text-xs text-right focus:outline-none focus:ring-1 ${
                                        splitMode === 'EVERYONE'
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : 'focus:ring-blue-500'
                                    }`}
                                    placeholder="0.00"
                                    disabled={splitMode === 'EVERYONE'}
                                />
                            </div>
                        ))}
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

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
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
                                        <span className="text-gray-900 font-semibold">{exp.totalAmount?.toFixed(2)} {exp.currency}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mb-1">
                                        Paid by {exp.paidByFirstName} {exp.paidByLastName}
                                    </p>
                                    <ul className="text-[11px] text-gray-600 space-y-0.5">
                                        {exp.shares?.map(s => (
                                            <li key={s.userId}>
                                                {s.firstName} {s.lastName} owes {s.shareAmount?.toFixed(2)} {exp.currency}
                                            </li>
                                        ))}
                                    </ul>
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
                                        {b.balance > 0 ? '+' : ''}{b.balance.toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentView;
