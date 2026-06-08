import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout/Layout";
import { Linkedin, Twitter, Instagram } from "lucide-react";
import { useScrollTop } from '@/hooks/useScrollTop';

const Team = () => {
  useScrollTop();

  const { user } = useAuth();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, would send the form data to a backend service
    console.log("Form submitted:", formState);
    // Reset form
    setFormState({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
    // Show success notification (would implement with toast)
    alert("Message sent successfully! We'll get back to you soon.");
  };

  return (
    <Layout>
      {/* Meet Our Founders Section */}
      <section className="py-[120px] bg-black border-b border-[#292524]">
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h1 className="text-[64px] font-light mb-3">Meet Our Founders</h1>
            <p className="text-[20px] text-white/60 font-light">Visionaries Behind Our Journey</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* John Anderson Card */}
            <div className="bg-black/50 backdrop-blur-sm border border-primary/20 p-8 rounded-[32px]">
              <div className="flex flex-col">
                <div className="flex items-start gap-12 mb-8">
                  <div className="w-[166px] h-[166px] rounded-[16px] overflow-hidden shrink-0">
                    <img 
                      src="/lovable-uploads/john-anderson.png"
                      alt="John Anderson"
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <div className="pt-2">
                    <h2 className="text-[32px] font-light mb-1">John Anderson</h2>
                    <p className="text-[20px] text-white/60 font-light mb-4">Co-founder & CEO</p>
                    
                    {/* Social Links */}
                    <div className="flex gap-4">
                      <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80">
                        <Linkedin className="w-5 h-5 text-black" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80">
                        <Twitter className="w-5 h-5 text-black" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80">
                        <Instagram className="w-5 h-5 text-black" />
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-[16px] text-white/80 font-light leading-relaxed">
                  John is a product strategist and design leader with over a decade of experience in building digital solutions. With a deep understanding of user experience, he has worked with startups and enterprises to create scalable, user-centric products. His leadership ensures the company's vision translates into impactful digital experiences, driving both innovation and business growth. Outside of work, John enjoys mentoring young designers and speaking at industry conferences.
                </p>
              </div>
            </div>

            {/* Emily Carter Card */}
            <div className="bg-black/50 backdrop-blur-sm border border-primary/20 p-8 rounded-[32px]">
              <div className="flex flex-col">
                <div className="flex items-start gap-12 mb-8">
                  <div className="w-[166px] h-[166px] rounded-[16px] overflow-hidden shrink-0">
                    <img 
                      src="/lovable-uploads/emily-carter.png"
                      alt="Emily Carter"
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <div className="pt-2">
                    <h2 className="text-[32px] font-light mb-1">Emily Carter</h2>
                    <p className="text-[20px] text-white/60 font-light mb-4">Co-founder & CTO</p>
                    
                    {/* Social Links */}
                    <div className="flex gap-4">
                      <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80">
                        <Linkedin className="w-5 h-5 text-black" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80">
                        <Twitter className="w-5 h-5 text-black" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80">
                        <Instagram className="w-5 h-5 text-black" />
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-[16px] text-white/80 font-light leading-relaxed">
                  Emily is a tech entrepreneur and software architect specializing in AI-driven and cloud-based applications. With a background in software engineering and a passion for emerging technologies, she has built and scaled multiple digital products from the ground up. At the company, she leads the engineering team, ensuring seamless product execution and technological excellence. Emily is also an advocate for women in tech and regularly shares insights on software development and leadership.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Amazing Team Section */}
      <section className="py-[60px] lg:py-[120px] bg-black">
        <div className="container 2xl:max-w-[1740px] mx-auto px-4 lg:px-12">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-[40px] lg:text-[64px] font-light mb-2 lg:mb-3">Our Amazing Team</h2>
            <p className="text-[16px] lg:text-[20px] text-white/60 font-light">The People Who Make Notes Happen</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 lg:gap-y-16 max-w-[1248px] mx-auto">
            {/* Michael Smith */}
            <div className="mx-auto w-full max-w-[296px]">
              <div className="w-full aspect-square rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image10.png"
                  alt="Michael Smith"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[24px] lg:text-[32px] font-light leading-[1.2] mb-2">Michael Smith</h3>
              <p className="text-[16px] lg:text-[20px] text-white/60 font-light mb-4">Lead Designer</p>
              <p className="text-[14px] lg:text-[16px] text-white/80 font-light leading-[1.6]">
                Brings creativity and user-focused design solutions to every project.
              </p>
            </div>

            {/* Sophia Brown */}
            <div className="mx-auto">
              <div className="w-[296px] h-[296px] rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image11.png"
                  alt="Sophia Brown"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[32px] font-light leading-[1.2] mb-2">Sophia Brown</h3>
              <p className="text-[20px] text-white/60 font-light mb-4">Head of Marketing</p>
              <p className="text-[16px] text-white/80 font-light leading-[1.6]">
                Crafts compelling brand narratives and drives strategic growth.
              </p>
            </div>

            {/* David Wilson */}
            <div className="mx-auto">
              <div className="w-[296px] h-[296px] rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image12.png"
                  alt="David Wilson"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[32px] font-light leading-[1.2] mb-2">David Wilson</h3>
              <p className="text-[20px] text-white/60 font-light mb-4">Senior Developer</p>
              <p className="text-[16px] text-white/80 font-light leading-[1.6]">
                Builds high-performance web applications with cutting-edge technologies.
              </p>
            </div>

            {/* Olivia Johnson */}
            <div className="mx-auto">
              <div className="w-[296px] h-[296px] rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image13.png"
                  alt="Olivia Johnson"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[32px] font-light leading-[1.2] mb-2">Olivia Johnson</h3>
              <p className="text-[20px] text-white/60 font-light mb-4">Project Manager</p>
              <p className="text-[16px] text-white/80 font-light leading-[1.6]">
                Ensures seamless project execution with a focus on efficiency and collaboration.
              </p>
            </div>

            {/* James White */}
            <div className="mx-auto">
              <div className="w-[296px] h-[296px] rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image14.png"
                  alt="James White"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[32px] font-light leading-[1.2] mb-2">James White</h3>
              <p className="text-[20px] text-white/60 font-light mb-4">UX Researcher</p>
              <p className="text-[16px] text-white/80 font-light leading-[1.6]">
                Turns user insights into actionable design improvements.
              </p>
            </div>

            {/* Emma Davis */}
            <div className="mx-auto">
              <div className="w-[296px] h-[296px] rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image15.png"
                  alt="Emma Davis"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[32px] font-light leading-[1.2] mb-2">Emma Davis</h3>
              <p className="text-[20px] text-white/60 font-light mb-4">Content Strategist</p>
              <p className="text-[16px] text-white/80 font-light leading-[1.6]">
                Creates engaging content that aligns with brand identity and user needs.
              </p>
            </div>

            {/* Daniel Martinez */}
            <div className="mx-auto">
              <div className="w-[296px] h-[296px] rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image16.png"
                  alt="Daniel Martinez"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[32px] font-light leading-[1.2] mb-2">Daniel Martinez</h3>
              <p className="text-[20px] text-white/60 font-light mb-4">Software Engineer</p>
              <p className="text-[16px] text-white/80 font-light leading-[1.6]">
                Develops scalable and secure backend solutions for digital products.
              </p>
            </div>

            {/* Rachel Thompson */}
            <div className="mx-auto">
              <div className="w-[296px] h-[296px] rounded-[16px] overflow-hidden mb-6">
                <img 
                  src="/lovable-uploads/image17.png"
                  alt="Rachel Thompson"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <h3 className="text-[32px] font-light leading-[1.2] mb-2">Rachel Thompson</h3>
              <p className="text-[20px] text-white/60 font-light mb-4">Customer Success Manager</p>
              <p className="text-[16px] text-white/80 font-light leading-[1.6]">
                Builds strong client relationships and ensures user satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Team;