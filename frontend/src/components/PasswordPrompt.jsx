import React, { useState } from 'react';

const PasswordPrompt = ({ onSubmit, onCancel, error }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-80">
                <h2 className="text-xl font-bold mb-4 text-center">Locked Section 🔒</h2>
                <p className="text-gray-500 mb-4 text-sm text-center">Enter password to unlock</p>

                {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border rounded-md p-2 mb-4 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Password..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Unlock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordPrompt;
