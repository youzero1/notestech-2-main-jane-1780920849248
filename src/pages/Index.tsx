import { Button } from "@/components/ui/button";
import { Menu, DollarSign, Wallet, BookOpen, Mic2, Music, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-[68px]">
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="relative h-[742px] rounded-[32px] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/914c2af8-68e7-49df-93c3-81b10f235104.png"
            alt="Artist Performance"
                className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-[64px] leading-none mb-4">
                <span className="text-primary font-light">Notes</span>
                <span className="text-white">—Don't Nothin' Move But The Money</span>
              </h1>
              <p className="text-[20px] text-white/80 font-light max-w-[600px]">
                Empowering independent urban music artists and creators
                with capital access and more.
              </p>
              <div className="flex gap-4 mt-8">
                {!user && (
                  <>
                    <Link to="/auth?type=signin">
                      <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 min-w-[160px]">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/auth?type=signup">
                      <Button className="bg-primary hover:bg-primary/90 min-w-[160px]">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* As Featured Via Section */}
      <section className="py-12 bg-black border-b" style={{ borderColor: '#292524' }}>
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <h2 className="text-[48px] font-medium leading-none tracking-[0px] mb-12 text-white">
            As Featured Via
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center">
            <img 
              src="/lovable-uploads/image1.png" 
              alt="Boom Bap Nation"
              className="w-[365px] h-[72px] object-contain filter brightness-0 invert"
            />
            <img 
              src="/lovable-uploads/image2.png" 
              alt="MSN"
              className="w-[365px] h-[72px] object-contain filter brightness-0 invert"
            />
            <img 
              src="/lovable-uploads/image3.png" 
              alt="Rock Bells"
              className="w-[365px] h-[72px] object-contain filter brightness-0 invert"
            />
            <img 
              src="/lovable-uploads/image4.png" 
              alt="The Source"
              className="w-[365px] h-[72px] object-contain filter brightness-0 invert"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-32 bg-black relative border-y" style={{ borderColor: '#292524' }}>
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="mb-16">
            <h2 className="text-[48px] font-medium mb-4">Why Notes?</h2>
            <p className="text-gray-400 text-lg font-light">
              Your gateway to financial independence and career success. Access the capital, knowledge,<br />
              and tools you need to thrive as an independent urban music artist and creator.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px]">
            {/* Music Card */}
            <div className="bg-black/50 backdrop-blur-sm border border-primary/20 p-8 rounded-l-[24px]">
              <div className="flex gap-6">
                <div className="text-primary w-12 h-12 flex-shrink-0">
                  <Music className="w-full h-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-medium text-white">Music</h3>
                  <p className="text-gray-400 text-base font-light">
                    Embedded in the power and legacy of urban culture.
                  </p>
                </div>
              </div>
            </div>

            {/* Money Card */}
            <div className="bg-black/50 backdrop-blur-sm border border-primary/20 p-8">
              <div className="flex gap-6">
                <div className="text-primary w-12 h-12 flex-shrink-0">
                  <DollarSign className="w-full h-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-medium text-white">Money</h3>
                  <p className="text-gray-400 text-base font-light">
                    Capital access to fund your creative projects.
                  </p>
                </div>
              </div>
            </div>

            {/* Knowledge Card */}
            <div className="bg-black/50 backdrop-blur-sm border border-primary/20 p-8 rounded-r-[24px]">
              <div className="flex gap-6">
                <div className="text-primary w-12 h-12 flex-shrink-0">
                  <BookOpen className="w-full h-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-medium text-white">Knowledge</h3>
                  <p className="text-gray-400 text-base font-light">
                    AI-powered financial literacy, entrepreneurship, and music business education.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All-In-One Platform Section */}
      <section className="py-32 bg-black relative border-y" style={{ borderColor: '#292524' }}>
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-[48px] font-medium mb-3">All-In-One Platform</h2>
            <p className="text-gray-400 text-lg font-light">
              What You Need To Succeed In The Urban Music Creator Economy
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left side - Image */}
            <div className="relative rounded-[24px] overflow-hidden">
              <img 
                src="/lovable-uploads/artist-mic.png"
                alt="Artist performing"
                className="w-full h-[600px] object-cover grayscale"
              />
            </div>

            {/* Right side - Features Grid */}
            <div className="grid grid-cols-2 gap-8 md:gap-x-10 md:gap-y-24">
              {/* Capital Access */}
              <div className="space-y-4">
                <div className="text-primary w-12 h-12">
                  <DollarSign className="w-full h-full" />
                </div>
                <h3 className="text-xl font-medium">Capital Access</h3>
                <p className="text-gray-400 text-sm font-light">
                  Secure the funding you need for creative projects.
                </p>
              </div>

              {/* Fintech Tools */}
              <div className="space-y-4">
                <div className="text-primary w-12 h-12">
                  <Wallet className="w-full h-full" />
                </div>
                <h3 className="text-xl font-medium">Fintech Tools</h3>
                <p className="text-gray-400 text-sm font-light">
                  Track royalties, manage your income, budget your capital, and build credit for financial success
                </p>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <div className="text-primary w-12 h-12">
                  <BookOpen className="w-full h-full" />
                </div>
                <h3 className="text-xl font-medium">Education</h3>
                <p className="text-gray-400 text-sm font-light">
                  Access the knowledge and learn the skills to successfully navigate and grow your career in the independent urban music industry.
                </p>
              </div>

              {/* Cultural Relevance */}
              <div className="space-y-4">
                <div className="text-primary w-12 h-12">
                  <Mic2 className="w-full h-full" />
                </div>
                <h3 className="text-xl font-medium">Cultural Relevance</h3>
                <p className="text-gray-400 text-sm font-light">
                  Built with the essence of urban music and culture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become Legendary Section */}
      <section className="py-32 bg-black relative border-y" style={{ borderColor: '#292524' }}>
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col items-center text-center max-w-[1080px] mx-auto">
            <h2 className="text-[48px] font-medium mb-12">Become Legendary</h2>
            <p className="text-gray-400 text-lg font-light mb-12 leading-relaxed">
              "With Notes, getting 'paid in full' is beyond just the money, it's also about the knowledge and understanding of the urban music game from a position of being conscious of how it all works as a business, and how to leverage that to thrive and succeed as independent urban music artists and creators."
            </p>
            <div className="text-center">
              <h3 className="text-[20px] font-medium mb-2" style={{ color: '#987D4D' }}>RAKIM</h3>
              <p className="text-gray-400 text-base font-light">Founder, Notes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Noteslink Section */}
      <section className="py-32 bg-black relative border-y" style={{ borderColor: '#292524' }}>
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-[64px] font-light leading-[1.1]">
                Your <span className="text-primary">Noteslink</span><br />
                One Link.<br />
                Everything You Are.
              </h2>
              <p className="text-gray-400 text-[20px] font-light leading-relaxed">
                Create your personalized landing page with Noteslink. Share all your<br />
                content, music, products, and social links in one beautiful page.<br />
                Connect with your fans and monetize your brand.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link to="/noteslink">
                    <Button className="bg-primary hover:bg-primary/90 text-white w-full sm:w-[200px] h-[56px] rounded-lg text-lg">
                      Create Your Link
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth?type=signup">
                    <Button className="bg-primary hover:bg-primary/90 text-white w-full sm:w-[200px] h-[56px] rounded-lg text-lg">
                      Get Started Free
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Unlimited Links</p>
                    <p className="text-gray-400 text-sm">Add all your content</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Monetize</p>
                    <p className="text-gray-400 text-sm">Sell products & accept tips</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-primary/20 to-transparent p-8">
              <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-8 border border-primary/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">N</span>
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-medium">@yourname</h3>
                    <p className="text-gray-400 text-sm">Independent Artist & Creator</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {['Latest Track 🎵', 'Shop Merch 🛍️', 'Book Me 📅', 'Instagram', 'YouTube Channel'].map((item, i) => (
                    <div key={i} className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-4 border border-white/10 flex items-center justify-between">
                      <span className="text-white">{item}</span>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-black relative border-y" style={{ borderColor: '#292524' }}>
        <div className="container 2xl:max-w-[1740px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-[64px] font-light leading-[1.1]">
                Join a <span className="text-primary">Movement</span><br />
                That's Changing<br />
                The Game.
              </h2>
              <p className="text-gray-400 text-[20px] font-light leading-relaxed">
                Built for independent urban music artists and creators, by<br />
                independent urban music artists and creators—empowering<br />
                the next generation of urban music legends.
              </p>
              <Button variant="default" className="bg-primary hover:bg-primary/90 text-white w-[379px] h-[56px] rounded-lg text-lg">
                Join Waitlist
              </Button>
            </div>
            <div className="relative rounded-[24px] overflow-hidden">
              <img 
                src="/lovable-uploads/d520e938-2939-4913-9611-5cd914d38d52.png"
                alt="Artist performing on stage"
                className="w-full h-[600px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
