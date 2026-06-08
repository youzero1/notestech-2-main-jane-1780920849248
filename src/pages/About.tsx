import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { useScrollTop } from '@/hooks/useScrollTop';

const About = () => {
  const { user } = useAuth();
  useScrollTop();
  return (
    <Layout>
      {/* Mission Statement Section */}
      <section className="pt-[120px] bg-black">
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="mb-[120px]">
            <p className="text-[14px] font-normal leading-[150%] uppercase mb-6 text-white/80">Our Mission</p>
            <h1 className="text-[64px] font-light leading-[120%] tracking-[-0.02em]">
              EMPOWERING <span style={{ color: '#987D4D' }}>INDEPENDENT ARTISTS</span> WITH<br />
              FINANCIAL TOOLS, FUNDING, AND EDUCATION<br />
              TO TURN THEIR PASSION INTO LASTING WEALTH.
            </h1>
          </div>

          <div className="flex justify-between items-end pb-[120px] border-b" style={{ borderColor: '#292524' }}>
            <div className="max-w-[640px]">
              <p className="text-[14px] font-normal leading-[150%] uppercase mb-6 text-white/80">Our Vision</p>
              <p className="text-[20px] font-light leading-[150%] text-white/80">
                We envision a world where every artist has the financial literacy and<br />
                resources to turn their passion into a thriving career—without<br />
                industry gatekeepers holding them back.
              </p>
            </div>
            <div className="w-[120px]">
              <img 
                src="/lovable-uploads/notes.png"
                alt="NOTES Logo"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Notes Section */}
      <section className="pt-[120px] pb-[160px] bg-black border-b" style={{ borderColor: '#292524' }}>
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-24">
            {/* Left Column - Text Content */}
            <div>
              <div className="mb-16">
                <h2 className="text-[64px] font-light mb-3">About Notes</h2>
                <p className="text-[20px] text-white/60 font-light">Merging Music, Money & Knowledge</p>
              </div>
            </div>

            {/* Right Column - Text */}
            <div className="space-y-8">
              <p className="text-[20px] font-light leading-[150%] text-white/80">
                Notes is a revolutionary fintech platform designed to empower independent urban music artists and creators. Inspired by the legendary Paid in Full ethos of hip-hop icon Rakim, Notes provides the financial tools, funding, and education needed to help artists take control of their careers and build lasting wealth.
              </p>
              <p className="text-[20px] font-light leading-[150%] text-white/80">
                By combining fintech innovation, financial literacy, and music business education, Notes creates a community-driven ecosystem where culture and capital work together. Whether you're an independent artist, producer, or creative entrepreneur, Notes is your gateway to financial independence and long-term success.
              </p>
            </div>
          </div>

          {/* Video Section */}
          <div className="mt-24">
            <div className="relative rounded-[32px] overflow-hidden aspect-video w-full">
              <img 
                src="/lovable-uploads/rakim-performance.png"
                alt="Rakim Performance"
                className="w-full h-full object-cover grayscale"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-24 h-24 rounded-full bg-black/80 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#987D4D] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5.14v13.72c0 .23 0 .34.04.42.04.1.1.17.19.22.08.05.2.05.41.05l8.72-6.86c.17-.13.25-.2.28-.27.03-.06.03-.13 0-.19-.03-.07-.11-.14-.28-.27L8.64 5.1c-.21 0-.33 0-.41.05a.36.36 0 00-.19.22c-.04.08-.04.2-.04.42z" fill="white"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
