import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <Layout>
      <div className="pt-24 pb-12 bg-black min-h-screen">
        <div className="container mx-auto px-6 lg:px-12 max-w-[800px]">
         
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-bold text-[#A3A3A3] mb-2">Privacy Policy</h1>
            <p className="text-sm text-[#A3A3A3]">Last Updated: 15.03.25</p>
          </div>

          <p className="custom-paragraph mb-8">
            At Notes, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
          </p>

          {/* Content */}
          <div className="space-y-6">
            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">1. Information We Collect</h2>
              <p className="custom-paragraph mb-8">
                We collect different types of information, including:
              </p>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Personal Information: Name, email, phone number, payment details, and other details you provide.</li>
                <li>Usage Data: Information about how you use our platform, including interactions and preferences.</li>
                <li>Device Information: IP address, browser type, and other technical data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">2. How We Use Your Information</h2>
              <p className="custom-paragraph mb-8">
                We use your data to:
              </p>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Provide and improve our services.</li>
                <li>Process transactions and payments.</li>
                <li>Send security updates and promotional content.</li>
                <li>Enhance security and prevent fraud.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">3. How We Share Your Information</h2>
              <p className="custom-paragraph mb-8">
                We do not sell your personal data. However, we may share information with:
              </p>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Service Providers: Third-party vendors who assist in delivering our services.</li>
                <li>Legal Authorities: If required by law or to protect our rights and users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">4. Data Security</h2>
              <p className="custom-paragraph">
                We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">5. Your Rights & Choices</h2>
              <p className="custom-paragraph mb-8">
                You have the right to:
              </p>
              <ul className="text-white text-[17px] list-disc pl-5 space-y-1">
                <li>Access, update, or delete your personal data.</li>
                <li>Opt out of marketing communications.</li>
                <li>Request data portability.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">6. Cookies & Tracking Technologies</h2>
              <p className="custom-paragraph">
                We use cookies to enhance your experience and analyze site traffic. You can manage cookie preferences in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">7. Third-Party Links</h2>
              <p className="custom-paragraph">
                Our platform may contain links to third-party sites. We are not responsible for their privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">8. Children's Privacy</h2>
              <p className="custom-paragraph">
                Our services are not intended for children under 13. We do not knowingly collect data from minors.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">9. Changes to This Policy</h2>
              <p className="custom-paragraph">
                We may update this policy from time to time. Continued use of our platform after changes indicates your acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">10. Contact Us</h2>
              <p className="custom-paragraph mb-8">
                For privacy-related inquiries, contact us at <a href="mailto:support@notes.com" className="text-[#987d4d] underline">support@notes.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
