import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <Layout>
      <div className="pt-24 pb-12 bg-black min-h-screen">
        <div className="container mx-auto px-6 lg:px-12 max-w-[800px]">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-bold text-[#A3A3A3] mb-2">TERMS OF SERVICES</h1>
            <p className="text-sm text-[#A3A3A3]">Last Updated: 15.03.25</p>
          </div>

          <p className="text-white text-[17px] mb-8">
          At Joi.se, we value your privacy and are committed to protecting your personal data in
          accordance with applicable laws, including thWelcome to Notes! These Terms of Service ("Terms") govern your access to and use of the Notes platform, including our website, mobile application, and services (collectively, the "Services"). By using our Services, you agree to these Terms.e EU General Data Protection Regulation
          (GDPR). This privacy policy explains how we collect, use, and protect your personal data.
          </p>

          {/* Content */}
          <div className="space-y-6">
            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">1. Acceptance of Terms</h2>
              <p className="text-white text-[17px] mb-8">
                By accessing or using Notes, you agree to comply with these Terms. If you do not agree, please do not use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">2. Eligibility</h2>
              <p className="text-white text-[17px] mb-8">
                You must be at least 18 years old to use Notes. By using our Services, you confirm that you meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">3. User Accounts</h2>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You agree to provide accurate and up-to-date information.</li>
                <li>You may not share your account with others or transfer it without our permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">4. Use of Services</h2>
              <p className="text-white text-[17px] mb-8">
                You agree to use Notes for lawful purposes and in compliance with these Terms. You may not:
              </p>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Violate any laws or regulations.</li>
                <li>Infringe on intellectual property rights.</li>
                <li>Engage in fraudulent or misleading activities.</li>
                <li>Interfere with or disrupt our Services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">5. Content Ownership & Usage</h2>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Your Content: You retain ownership of any content you upload, such as music, videos, or educational materials. However, you grant Notes a license to use, distribute, and promote your content within the platform.</li>
                <li>Our Content: All trademarks, logos, and materials created by Notes are owned by us and may not be used without permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">6. Payments & Subscriptions</h2>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Some features of Notes may require payment or subscription.</li>
                <li>All transactions are final, and refunds are provided only as stated in our refund policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">7. Termination & Suspension</h2>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>We reserve the right to suspend or terminate your account if you violate these Terms.</li>
                <li>You may terminate your account at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">8. Disclaimers & Limitation of Liability</h2>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Notes provides its Services "as is" without warranties of any kind.</li>
                <li>We are not responsible for any losses or damages resulting from your use of Notes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">9. Changes to Terms</h2>
              <p className="text-white text-[17px] mb-8">
                We may update these Terms from time to time. Continued use of the platform after changes indicates acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">10. Contact Us</h2>
              <p className="text-white text-[17px] mb-8">
                For questions or concerns regarding these Terms, please contact us at <a href="mailto:support@notes.com" className="text-[#987d4d] underline">support@notes.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;
