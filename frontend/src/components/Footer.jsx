import React from 'react';

const Footer = () => {
    return (
        <footer className="mt-12 border-t border-gray-200 bg-white pt-10 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            FRYLY
                        </span>
                        <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                            Organise your shared spaces, notes, and reminders in one simple, beautiful place.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-blue-600 transition">Features</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Integrations</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Pricing</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-blue-600 transition">About</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Careers</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-blue-600 transition">Privacy</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Terms</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition">Security</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} FRYLY Inc. All rights reserved.
                    </p>
                    <div className="flex space-x-4">
                        {/* Social placeholders */}
                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
