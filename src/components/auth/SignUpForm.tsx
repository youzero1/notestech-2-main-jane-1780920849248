import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export const SignUpForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    cityState: "",
    artistName: "",
    instagram: "",
    tiktok: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Thank you for joining the waitlist",
      description: "We'll notify you when Notes is live.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <Input
        placeholder="First Name*"
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
        required
      />
      <Input
        placeholder="Last Name*"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
        required
      />
      <Input
        type="email"
        placeholder="Email Address*"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
        required
      />
      <Input
        type="tel"
        placeholder="Phone Number*"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
        required
      />
      <Input
        placeholder="Country*"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
        required
      />
      <Input
        placeholder="City & State/Province*"
        value={formData.cityState}
        onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
        required
      />
      <Input
        placeholder="Artist/Creator Name"
        value={formData.artistName}
        onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
      />
      <Input
        placeholder="Instagram (e.g. @thegodrakim)"
        value={formData.instagram}
        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
      />
      <Input
        placeholder="TikTok (e.g. @thegodrakim)"
        value={formData.tiktok}
        onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
        className="bg-white border-none text-black placeholder:text-gray-500 h-10 md:h-12 rounded-xl text-sm md:text-base"
      />
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-white font-light py-4 md:py-6 rounded-xl text-sm md:text-base"
      >
        Join Waitlist
      </Button>
      <p className="text-xs md:text-sm text-gray-400 text-center">
        Your privacy matters to us. We do not share or sell your data. By joining our waitlist, you consent to receive occasional updates and marketing communications.
      </p>
    </form>
  );
};

export default SignUpForm;