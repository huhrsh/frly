import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="mt-10 border-t border-gray-200 bg-white pt-6 pb-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6 text-sm">
                    <div className="col-span-2 sm:col-span-1">
                        <span className="lowercase text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            fryly
                        </span>
                        <p className="mt-3 text-xs text-gray-500 leading-relaxed max-w-xs">
                            Organise your shared spaces, notes, and reminders in one simple, beautiful place.
                        </p>
                    </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/features" className="hover:text-blue-600 transition">Features</Link></li>
                                <li><Link to="/integrations" className="hover:text-blue-600 transition">Integrations</Link></li>
                                <li><Link to="/pricing" className="hover:text-blue-600 transition">Pricing</Link></li>
                                <li><Link to="/changelog" className="hover:text-blue-600 transition">Changelog</Link></li>
                                <li><Link to="/faq" className="hover:text-blue-600 transition">FAQ</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/about" className="hover:text-blue-600 transition">About</Link></li>
                                <li><Link to="/careers" className="hover:text-blue-600 transition">Careers</Link></li>
                                <li><Link to="/blog" className="hover:text-blue-600 transition">Blog</Link></li>
                                <li><Link to="/contact" className="hover:text-blue-600 transition">Contact</Link></li>
                                <li><Link to="/feedback" className="hover:text-blue-600 transition">Feedback</Link></li>
                                <li><Link to="/review" className="hover:text-blue-600 transition">Reviews</Link></li>
                            </ul>
                        </div>

                        {/* <div className="col-span-2 sm:col-span-1">
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">FAQ</h4>
                            <ul className="space-y-2 text-xs text-gray-500 max-w-sm">
                                <li>
                                    <p className="font-medium text-gray-700">What is fryly for?</p>
                                    <p>Ongoing groups like flats, families and close crews who share everyday life together.</p>
                                </li>
                                <li>
                                    <p className="font-medium text-gray-700">Is fryly free?</p>
                                    <p>You can start using fryly for free. If we introduce paid plans later, we&apos;ll share details on the pricing page.</p>
                                </li>
                                <li>
                                    <p className="font-medium text-gray-700">Do you have a mobile app?</p>
                                    <p>fryly works great on mobile browsers and can be installed to your home screen as a lightweight app (PWA).</p>
                                </li>
                                <li>
                                    <p className="font-medium text-gray-700">Is my data private?</p>
                                    <p>Groups are invite-only and only members can see the content in their shared spaces.</p>
                                </li>
                            </ul>
                        </div> */}
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-400">
                    <p>
                        fryly · v0.1.2
                    </p>
                    <p>
                        Made with 💙 by 
                        <a
                            href="https://www.linkedin.com/in/harsh-jain-10467a22b/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 ml-1"
                        >
                            Harsh Jain
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
