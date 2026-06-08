import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SubscribeForm from "@/components/newsletter/SubscribeForm";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? "text-primary" : "text-white hover:text-black";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header/Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12 py-3 flex justify-between items-center">
          <RouterLink to="/">
            <img 
                src="/lovable-uploads/09c826bc-fcac-4dcc-8cb0-8005d2a77b8e.png" 
                alt="NOTES Logo" 
                className="h-5 md:h-8 object-contain"
            />
          </RouterLink>
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white p-1">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/95 border-primary/20 w-[80%]">
                <div className="flex flex-col gap-4 mt-8">
                  <RouterLink to="/">
                    <Button variant="ghost" className={`w-full justify-start ${isActive("/")}`}>
                      Home
                    </Button>
                  </RouterLink>
                  <RouterLink to="/about">
                    <Button variant="ghost" className={`w-full justify-start ${isActive("/about")}`}>
                      About
                    </Button>
                  </RouterLink>
                  <RouterLink to="/team">
                    <Button variant="ghost" className={`w-full justify-start ${isActive("/team")}`}>
                      Team
                    </Button>
                  </RouterLink>
                  {user && (
                    <RouterLink to="/dashboard" className="w-full">
                      <Button variant="default" className="bg-primary hover:bg-primary/90 w-full">
                        Dashboard
                      </Button>
                    </RouterLink>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 items-center">
            <RouterLink to="/">
              <Button variant="ghost" className={isActive("/")}>
                Home
              </Button>
            </RouterLink>
            <RouterLink to="/about">
              <Button variant="ghost" className={isActive("/about")}>
                About
              </Button>
            </RouterLink>
            <RouterLink to="/team">
              <Button variant="ghost" className={isActive("/team")}>
                Team
              </Button>
            </RouterLink>
            {user && (
              <RouterLink to="/dashboard">
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Dashboard
                </Button>
              </RouterLink>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="py-24 bg-black border-t" style={{ borderColor: '#292524' }}>
        <div className="container mx-auto px-6 lg:px-12 max-w-[1440px]">
          {/* Logo */}
          <div className="mb-16">
            <img 
              src="/lovable-uploads/Notes-logo(L).png"
              alt="NOTES Logo"
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column - Mission Statement & Newsletter */}
            <div className="lg:col-span-5">
              <div className="text-[14px] font-normal leading-[150%] uppercase mb-8" style={{ color: '#AEAEB2' }}>
                MERGING MUSIC, MONEY & KNOWLEDGE TO EMPOWER THE NEXT<br />
                GENERATION OF URBAN MUSIC LEGENDS
              </div>
              
              {/* Newsletter Section */}
              <div>
                <p className="text-[14px] font-normal leading-[150%] uppercase mb-4" style={{ color: '#AEAEB2' }}>
                  STAY UP TO DATE ON NOTES WITH THE NOTESPAPER NEWSLETTER!
                </p>
                <SubscribeForm />
              </div>
            </div>

            {/* Right Side Links */}
            <div className="lg:col-span-7 flex justify-end">
              <div className="grid grid-cols-3 gap-16">
                {/* Company Links */}
                <div>
                  <h4 className="text-[14px] text-white font-normal leading-[150%] uppercase mb-6">COMPANY</h4>
                  <ul className="space-y-4">
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}><RouterLink to="/about" className="hover:text-primary">About</RouterLink></li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}><RouterLink to="/team" className="hover:text-primary">Team</RouterLink></li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}><RouterLink to="/press-releases" className="hover:text-primary">Press Release</RouterLink></li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}>White Paper</li>
                  </ul>
                </div>

                {/* Legal Links */}
                <div>
                  <h4 className="text-[14px] text-white font-normal leading-[150%] uppercase mb-6">LEGAL</h4>
                  <ul className="space-y-4">
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}><RouterLink to="/terms" className="hover:text-primary">Terms of Service</RouterLink></li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}><RouterLink to="/privacy" className="hover:text-primary">Privacy Policy</RouterLink></li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}><RouterLink to="/disclosure" className="hover:text-primary">Disclosure</RouterLink></li>
                  </ul>
                </div>

                {/* Social Links */}
                <div>
                  <h4 className="text-[14px] text-white font-normal leading-[150%] uppercase mb-6">SOCIAL</h4>
                  <ul className="space-y-4">
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Facebook</a>
                    </li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Instagram</a>
                    </li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}>
                      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">X</a>
                    </li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}>
                      <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Tiktok</a>
                    </li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}>
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Youtube</a>
                    </li>
                    <li className="text-[14px] font-normal leading-[150%] uppercase" style={{ color: '#818181' }}>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">LinkedIn</a>
                    </li>
                 </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-20 text-[14px] font-normal leading-[150%] text-center uppercase">
            <p className="mb-6 text-[14px] text-gray-500 max-w-[800px] mx-auto text-center leading-[160%]">
              Notes Technology, Inc. (Notes) is not a bank, lender, or creditor. Loans or credit applied for via the Notes platform are originated or granted by respective third-party lenders or creditors. Loans or credit granted by respective third-party lenders or creditors via the Notes platform are subject to loan and credit approval, terms, and conditions, which are subject to change at any time without notice.
            </p>
            <p className="mb-1" style={{ color: '#AEAEB2' }}>© 2025 NOTES TECHNOLOGY, INC. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
