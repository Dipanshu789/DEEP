import React, { useState } from "react";
import { useLocation } from "wouter";


const PrivacyPolicy: React.FC = () => {
  const [agreed, setAgreed] = useState(false);
  const [, setLocation] = useLocation();

  const handleCheckbox = () => {
    setAgreed(!agreed);
  };

  const handleSubmit = () => {
    if (!agreed) {
      alert("You must agree to the Privacy Notice to proceed.");
      return;
    }
    alert("Thank you for agreeing to the Privacy Notice.");
    // You can redirect or call an API here
  };

  const handleBack = () => {
    setLocation("/settings");
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg font-sans text-gray-900 dark:text-gray-100">
      <button
        onClick={handleBack}
        className="mb-6 px-4 py-2 rounded-md font-semibold flex items-center w-fit transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-gray-600"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <svg className="mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back to Settings
      </button>
      <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-600 dark:text-blue-400">
        Privacy Notice & Consent
      </h1>

      <p className="mb-4 leading-relaxed">
        We respect your privacy and are committed to protecting your personal information in accordance with applicable laws,
        including the <strong>General Data Protection Regulation (GDPR)</strong>, the <strong>California Consumer Privacy Act (CCPA)</strong>,
        and the privacy principles embodied in the <strong>Information Technology Act, 2000 (India)</strong> and relevant provisions
        of the <strong>Indian Penal Code (IPC)</strong>.
      </p>

      <p className="mb-4 leading-relaxed">
        This app, created and maintained by <strong>Dipanshu Sahoo</strong>, collects, stores, and processes the following information:
      </p>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>Your name, profile photo, and user ID.</li>
        <li>Attendance records (check-in/check-out times, facial data vectors).</li>
        <li>Messages exchanged with the administrator or team.</li>
      </ul>

      <h3 className="text-2xl font-semibold mb-3 text-blue-600 dark:text-blue-400">Purpose of Collection:</h3>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>Managing and recording attendance within your organization.</li>
        <li>Enabling communication between team members and the administrator.</li>
        <li>Improving the efficiency and transparency of organizational workflows.</li>
      </ul>

      <h3 className="text-2xl font-semibold mb-3 text-blue-600 dark:text-blue-400">Your Rights:</h3>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>You have the right to access, rectify, or delete your personal data.</li>
        <li>You may withdraw your consent at any time (which may affect your access to services).</li>
        <li>Your data is not sold or disclosed to unauthorized third parties.</li>
      </ul>

      <h3 className="text-2xl font-semibold mb-3 text-blue-600 dark:text-blue-400">Data Security:</h3>
      <p className="mb-6 leading-relaxed">
        We implement industry-standard security measures to protect your data from unauthorized access, disclosure, alteration, or destruction.
      </p>

      <h3 className="text-2xl font-semibold mb-3 text-blue-600 dark:text-blue-400">Legal Compliance:</h3>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>GDPR: We process your data based on your consent and legitimate interest.</li>
        <li>CCPA: You may request to know, delete, or opt-out of the sale of your data.</li>
        <li>IPC & IT Act: Unauthorized misuse or disclosure of your personal data may constitute an offence punishable under Indian law.</li>
      </ul>

      <p className="mb-6 leading-relaxed">
        If you have questions or concerns, please contact the administrator or reach out to <strong>Dipanshu Sahoo</strong> at <a href="mailto:dipansusahoo8@gmail.com" className="text-blue-600 dark:text-blue-400 underline">dipansusahoo8@gmail.com</a>.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={handleCheckbox} 
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="font-semibold text-lg">I Agree to the Privacy Notice and Terms of Use</span>
        </label>
        <button
          className={`px-6 py-2 rounded-md text-white font-semibold transition-colors duration-300 ${
            agreed ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={handleSubmit}
          disabled={!agreed}
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
