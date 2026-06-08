import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

const Disclosure = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="pt-24 pb-12 bg-black min-h-screen">
        <div className="container mx-auto px-6 lg:px-12 max-w-[800px]">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-bold text-[#A3A3A3] mb-2">DISCLOSURE STATEMENT</h1>
            <p className="text-sm text-[#A3A3A3]">Last Updated: 15.03.25</p>
          </div>

          <p className="custom-paragraph mb-8">
            At Notes, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
          </p>

          {/* Content */}
          <div className="space-y-6">
            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">General Information</h2>
              <p className="custom-paragraph">
                The information provided by Notes on our platform, including our website, mobile application, and services (collectively, the "Services"), is for general informational and educational purposes only. While we strive to ensure accuracy, we do not guarantee that all information is complete or up-to-date.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">1. No Financial or Legal Advice</h2>
              <p className="custom-paragraph">
                Notes does not provide financial, legal, or investment advice. Any financial literacy content, tools, or resources available on our platform are for informational purposes only. Users should consult professional financial or legal advisors before making any financial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">2. Third-Party Content & Links</h2>
              <p className="custom-paragraph">
                Our Services may contain links to third-party websites, applications, or services. Notes is not responsible for the content, policies, or practices of any third-party platforms. Users interact with third-party content at their own risk.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">3. Affiliate & Sponsorship Disclosure</h2>
              <p className="custom-paragraph">
                Notes may participate in affiliate marketing and sponsored partnerships. This means we may earn commissions or benefits from certain links, products, or services promoted on our platform. Any sponsored content will be clearly labeled.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">4. User Responsibility</h2>
              <p className="custom-paragraph">
                Users are responsible for how they interact with the platform, including financial transactions, content creation, and community engagement. Notes is not liable for any losses, damages, or disputes arising from user activities.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">5. Earnings & Success Disclaimer</h2>
              <p className="custom-paragraph">
                Any discussions about earnings, success, or financial growth on Notes are for illustrative purposes only. There are no guarantees of income, and individual results may vary based on skills, effort, and external factors.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">6. Limitation of Liability</h2>
              <p className="custom-paragraph">
                Notes is not responsible for any direct, indirect, incidental, or consequential damages resulting from the use of our Services. Use of the platform is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">7. Changes to This Disclosure</h2>
              <p className="custom-paragraph">
                We reserve the right to update this disclosure statement at any time. Users will be notified of significant changes, and continued use of the Services signifies acceptance of the revised disclosure.
              </p>
            </section>

            <section>
              <h2 className="text-[32px] text-[#A3A3A3] font-semibold mb-2">8. Contact Us</h2>
              <p className="custom-paragraph mb-8">
                For any questions regarding this disclosure, please contact us at <a href="mailto:support@notes.com" className="text-[#987d4d] underline">support@notes.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Disclosure;
