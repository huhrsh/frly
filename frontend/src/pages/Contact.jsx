import React from 'react';

const Contact = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Contact</h1>
      <p className="text-sm text-gray-600 mb-4">
        Have feedback, ideas, or want to use fryly with a larger group?
      </p>
      <p className="text-sm text-gray-600 mb-2">
        The best way to reach us is via email. Use the same address you registered with so we can understand how you are using the product.
      </p>
      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-700">
        <p className="font-semibold mb-1">Email</p>
         <p>frylyapp@gmail.com</p>
      </div>
    </div>
  );
};

export default Contact;
