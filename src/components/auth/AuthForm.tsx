import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User2, ArrowLeft } from "lucide-react";

type AuthMode = "signin" | "signup" | "create-profile" | "forgot-password" | "reset-password" | "send-otp" | "success";

const styles = `
  .scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .scrollbar::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background-color: #333333;
    border-radius: 3px;
  }

  .scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #444444;
  }

  .scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #333333 #1a1a1a;
  }
`;

export const AuthForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [authData, setAuthData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    state: "",
    bio: "",
    country: "",
    website: "",
    instagram: "",
  });

  // Add this new state for OTP input
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Add new state for terms acceptance
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (mode === "signup") {
      // Add terms validation
      if (!acceptedTerms) {
        errors.terms = "You must accept the terms and conditions to continue";
      }
      
      if (!formData.firstName) errors.firstName = "First name is required";
      if (!formData.lastName) errors.lastName = "Last name is required";
      // if (!formData.city) errors.city = "City is required";
      // if (!formData.state) errors.state = "State is required";
      // if (!formData.phone) errors.phone = "Phone number is required";
      // if (!avatarFile) errors.avatar = "Profile photo is required";
    }
    
    if (mode === "create-profile") {
      if (!formData.username) {
        errors.username = "Username is required";
      } else if (!formData.username.startsWith("@")) {
        errors.username = "Username must start with @";
      } else if (formData.username.length > 15) {
        errors.username = "Username must be 15 characters or less";
      }
      
      if (!formData.phone) errors.phone = "Phone number is required";
      if (!formData.city) errors.city = "City is required";
      if (!formData.state) errors.state = "State is required";
      if (!formData.country) errors.country = "Country is required";
      if (!avatarFile) errors.avatar = "Profile photo is required";
      if (!formData.bio) errors.bio = "Bio is required";
    }
    
    if (mode !== "create-profile") {
      if (!formData.email) {
        errors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = "Email is invalid";
      }
      
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            signup: 'true'
          }
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error signing in with Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message === "Email not confirmed") {
           // Fetch specific user by email using adminAuthClient
        const { data, error: userError } = await supabase.auth.signInWithOtp({
          email: formData.email,
        });

        if (userError) throw userError;
        if (data) {
          setAuthData(data);
          setMode("send-otp");
          toast({
            title: "Email not verified",
            description: "Please verify your email to continue",
          });
        }
        } else {
          throw error;
        }
        return;
      }
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    console.log("handleSignUp");
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // First upload the avatar if present
      let avatarPublicUrl = null;
      
      // if (avatarFile) {
      //   const fileExt = avatarFile.name.split('.').pop();
      //   const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      //   const filePath = `avatars/${fileName}`;

      //   const { error: uploadError } = await supabase.storage
      //     .from('avatars')
      //     .upload(filePath, avatarFile);

      //   if (uploadError) {
      //     throw uploadError;
      //   }

      //   const { data: { publicUrl } } = supabase.storage
      //     .from('avatars')
      //     .getPublicUrl(filePath);
          
      //   avatarPublicUrl = publicUrl;
      //   setAvatarUrl(publicUrl);
      // }

      // Then sign up with the avatar URL included in metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            // username: formData.username,
            first_name: formData.firstName,
            last_name: formData.lastName,
            // phone: formData.phone,
            // city: formData.city,
            // state: formData.state,
            // avatar_url: avatarPublicUrl  // Include avatar URL in metadata
          },
        },
      });

      if (signUpError) throw signUpError;

       // Generate a unique username based on first and last name
    const baseUsername = `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}`;
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const username = `@${baseUsername}${randomSuffix}`;

const { data:userData } = await supabase.from("profiles").insert({
  id: authData.user.id,
  first_name: formData.firstName,
  last_name: formData.lastName,
  username:username
});

setAuthData(authData);
      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
      });
      
      setMode("send-otp");
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    console.log("handleCreateProfile",authData);
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
        // First upload the avatar if present
        let avatarPublicUrl = null;
      
        if (avatarFile) {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `avatars/${fileName}`;
  
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile);
  
          if (uploadError) {
            throw uploadError;
          }
  
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
            
          avatarPublicUrl = publicUrl;
          setAvatarUrl(publicUrl);
        }
  
      const { data:userData, error } = await supabase.from("profiles").update({
          username: formData.username,
          phone: formData.phone,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          bio: formData.bio,
          website: formData.website,
          instagram: formData.instagram,
          avatar_url: avatarPublicUrl  // Include avatar URL in metadata
      })
      .eq('id', authData.user.id);

      if (error) throw error;

      toast({
        title: "Profile created",
        description: "Your profile has been created successfully.",
      });

setMode("success");
    } catch (error: any) {  
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
  };
}

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setFormErrors({ email: "Email is required" });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;
      
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      
      setMode("signin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password) {
      setFormErrors({ password: "New password is required" });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });
      
      navigate("/auth");
      setMode("signin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const resendEmailOtp = async () => {
    try {
      const {error} = await supabase.auth.resend({
        type:'signup',
        email:formData.email
      })
      if(error) throw error;
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    }
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setFormErrors({ email: "Email is required" });
      return;
    }
    
    setLoading(true);
    try {

      const { data:otpData, error } = await supabase.auth.verifyOtp({ email:formData.email, token:otp.join(''), type: 'email'})
      if (error) throw error;
      if(!authData?.user?.id){
        const {data:{session}} = await supabase.auth.getSession();
        setAuthData(session);
      }
      setMode("create-profile");
      toast({
        title: "OTP verified",
        description: "Your account has been verified.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session); // Debug log
      
      if (event === 'SIGNED_IN' && session?.user && session.user.app_metadata.provider==="google") {
        const { user } = session;
        
        try {
          // Check if profile already exists
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found" error
            throw profileError;
          }

          if (!existingProfile) {
            console.log("No existing profile, creating new one for:", user);

            // Update user metadata to include first_name and last_name
        const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
          data: {
            first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            ...user.user_metadata // preserve existing metadata
          }
        });

        if (updateError) throw updateError;


            
            // Generate a username from email
            const emailUsername = user.user_metadata?.full_name?.split(' ')[0] || '';
            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const username = `@${emailUsername}${randomSuffix}`;

            // Create profile with Google user data
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: username,
                first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
                last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                avatar_url: user.user_metadata?.picture || null, // Google OAuth uses 'picture' for avatar
              });

            if (insertError) throw insertError;

            // After creating profile, redirect to create-profile page for additional info
            setAuthData(session);
            setFormData(prev => ({
              ...prev,
              email: user.email || '',
              firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
              lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            }));
            setMode('create-profile');
            return; // Exit early to prevent dashboard navigation
          }

          // If profile exists, navigate to dashboard
          console.log("Existing profile found, redirecting to dashboard");
          navigate('/dashboard');

        } catch (error: any) {
          console.error("Error handling profile:", error);
          toast({
            title: "Error setting up profile",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, setMode, setFormData, setAuthData]);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.replace('#', ''));
    
    const type = params.get("type") || hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    
    if (type === "recovery" || (accessToken && hash.includes("type=recovery"))) {
      setMode("reset-password");
    } else if (type === "signup") {
      setMode("signup");
    } else if (type === "signin") {
      setMode("signin");
    }
    
    if (accessToken) {
      const setSession = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          console.error('Error setting session:', error);
          toast({
            title: "Error",
            description: "Invalid or expired reset link. Please request a new one.",
            variant: "destructive",
          });
          navigate("/auth");
        }
      };
      setSession();
    }
  }, [location.search, location.hash, navigate]);

  return (
    <>
      <style>{styles}</style>
      <div className="grid lg:grid-cols-2 h-screen overflow-hidden">
        {/* Left side - Sign In Form */}
        <div className={`relative min-h-screen ${mode === "signup" || mode === "create-profile" ? "overflow-y-auto scrollbar" : ""} ${mode === "forgot-password" || mode === "success" || mode === "send-otp" || mode === "create-profile" ? "lg:col-span-2" : ""}`}>
          {/* Logo */}
          <Link to="/">
            <div className="absolute top-8 left-8 z-10">
              <img 
                  src="/lovable-uploads/09c826bc-fcac-4dcc-8cb0-8005d2a77b8e.png" 
                  alt="NOTES Logo" 
                  className="h-8 w-auto"
                />
            </div>
          </Link>
          
          {/* Form Content */}
          <div className={`flex ${mode === "forgot-password" || mode === "send-otp" || mode === "success" ? "items-center justify-center" : mode === "create-profile" ? "items-start" : "items-start"} ${mode === "signup" || mode === "create-profile" ? "pt-24 pb-16" : "pt-24 pb-16"} px-4 md:px-8 lg:px-4 xl:px-40 min-h-full`}>
            <div className={`${mode === "forgot-password" || mode === "create-profile" || mode === "success" ? "max-w-md w-full mx-auto" : "w-full"}`}>
              {mode === "success" ? (
          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#39D76F] rounded-full flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-3xl font-light mb-4">Success</h2>
                    <p className="text-muted-foreground text-base">
                      Your account has been created successfully. Let's explore how Notes app can empower independent urban music artists.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Button 
                      type="button" 
                      className="w-full bg-[#987D4D] hover:bg-[#876C3C] h-12 text-base"
                      onClick={() => navigate("/dashboard")}
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    { mode === "reset-password" ? (
                      <Button
                        variant="ghost"
                        className="mb-6 text-gray-400 hover:text-white"
                        onClick={() => setMode("signin")}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    ) : null}
                    <h2 className="text-2xl font-light">
                      {mode === "signin" && "Login"}
                      {mode === "signup" && "Sign Up"}
                      {mode === "create-profile" && "Create Profile"}
                      {mode === "forgot-password" && "Forgot password"}
                      {mode === "reset-password" && "Set New Password"}
                    </h2>
                    <p className="text-muted-foreground mt-2">
                      {mode === "signin" && "Please enter your details to get started"}
                      {mode === "signup" && "Let's create your account"}
                      {mode === "forgot-password" && "Enter the email address associated with your account and we will send you a link to reset your password."}
                      {mode === "reset-password" && "Enter your new password below"}
                    </p>
                  </div>

                  <form 
                    onSubmit={
                      mode === "signin" 
                        ? handleSignIn 
                        : mode === "signup" 
                        ? handleSignUp
                        :mode === "create-profile"
                        ? handleCreateProfile
                        : mode === "forgot-password"
                        ? handleForgotPassword
                        : mode === "reset-password"
                        ? handleResetPassword
                        : handleSendOtp
                    } 
                    className={`${mode === "signup" ? "space-y-4 mt-6 pb-8" : "space-y-6 mt-8"}`}
                  >
                    {mode === "create-profile" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="avatar">Profile Photo</Label>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              {avatarPreview ? (
                                <AvatarImage src={avatarPreview} alt="Preview" />
                              ) : (
                                <AvatarFallback>
                                  <User2 className="h-8 w-8" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <Input
                              id="avatar"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="flex-1"
                            />
                          </div>
                          {formErrors.avatar && (
                            <p className="text-sm text-destructive">{formErrors.avatar}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            placeholder="@username"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          />
                          {formErrors.username && (
                            <p className="text-sm text-destructive">{formErrors.username}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Phone Number"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                          {formErrors.phone && (
                            <p className="text-sm text-destructive">{formErrors.phone}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <textarea
                            id="bio"
                            placeholder="Tell us about yourself..."
                            className="w-full h-32 bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] p-4 resize-none"
                            value={formData.bio || ""}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              placeholder="City"
                              className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                            {formErrors.city && (
                              <p className="text-sm text-destructive">{formErrors.city}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              placeholder="State"
                              className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                            {formErrors.state && (
                              <p className="text-sm text-destructive">{formErrors.state}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            placeholder="Country"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.country || ""}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website (Optional)</Label>
                          <Input
                            id="website"
                            placeholder="https://your-website.com"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.website || ""}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram Handle (Optional)</Label>
                          <Input
                            id="instagram"
                            placeholder="@your.instagram"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.instagram || ""}
                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                          />
                        </div>
                        <Button type="submit" className="w-full bg-[#987D4D] hover:bg-[#876C3C]" disabled={loading}>
                          Create Account
                        </Button>
                      </>
                    )}

                    {mode === "signup" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="First Name"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          />
                          {formErrors.firstName && (
                            <p className="text-sm text-destructive">{formErrors.firstName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Last Name"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                          {formErrors.lastName && (
                            <p className="text-sm text-destructive">{formErrors.lastName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Email Address"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                          {formErrors.email && (
                            <p className="text-sm text-destructive">{formErrors.email}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          />
                          <p className="text-sm text-gray-400">Must be at least 8 characters.</p>
                          {formErrors.password && (
                            <p className="text-sm text-destructive">{formErrors.password}</p>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="terms"
                              checked={acceptedTerms}
                              onChange={(e) => setAcceptedTerms(e.target.checked)}
                              className="rounded border-gray-800 bg-[#2C2C30]"
                            />
                            <Label htmlFor="terms" className="text-sm text-gray-400">
                              I agree to the terms and conditions.
                            </Label>
                          </div>
                          {formErrors.terms && (
                            <p className="text-sm text-destructive">{formErrors.terms}</p>
                          )}
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-[#987D4D] hover:bg-[#876C3C]" 
                          disabled={loading || !acceptedTerms}
                        >
                          Get started
                        </Button>

                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-800"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 text-gray-400 bg-black">Or</span>
                          </div>
                        </div>

                        <Button 
                          type="button" 
                          variant="outline"
                          className="w-full bg-transparent border-gray-800 hover:bg-gray-900 text-white"
                          onClick={handleGoogleSignIn}
                        >
                          <img src="/lovable-uploads/google.png" alt="Google" className="w-5 h-5 mr-2" />
                          Sign In with Google
                        </Button>

                        <p className="text-center text-sm text-gray-400 mt-4 mb-8">
                          {mode === "signup" ? (
                            <>
                              Already have an account?{" "}
                              <Button
                                variant="link"
                                className="p-0 h-auto text-[#987D4D] hover:text-[#876C3C]"
                                onClick={() => {
                                  setMode("signin");
                                  setFormErrors({});
                                  setFormData({
                                    email: "",
                                    password: "",
                                    username: "",
                                    firstName: "",
                                    lastName: "",
                                    phone: "",
                                    city: "",
                                    state: "",
                                    bio: "",
                                    country: "",
                                    website: "",
                                    instagram: "",
                                  });
                                  setAvatarFile(null);
                                  setAvatarPreview(null);
                                }}
                              >
                                Sign up
                              </Button>
                            </>
                          ) : mode === "signup" ? (
                            <>
                              Already have an account?{" "}
                              <Button
                                variant="link"
                                className="p-0 h-auto text-[#987D4D] hover:text-[#876C3C]"
                                onClick={() => {
                                  setMode("signin");
                                  setFormErrors({});
                                  setFormData({
                                    email: "",
                                    password: "",
                                    username: "",
                                    firstName: "",
                                    lastName: "",
                                    phone: "",
                                    city: "",
                                    state: "",
                                    bio: "",
                                    country: "",
                                    website: "",
                                    instagram: "",
                                  });
                                }}
                              >
                                Sign in
                              </Button>
                            </>
                          ) : null}
                        </p>
                      </>
                    )}

                    {(mode === "signin" || mode === "forgot-password") && (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email Address"
                          className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {formErrors.email && (
                          <p className="text-sm text-destructive">{formErrors.email}</p>
                        )}
                      </div>
                    )}

                    {(mode === "signin"  || mode === "reset-password") && (
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          {mode === "reset-password" ? "New Password" : "Password"}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder={mode === "reset-password" ? "New Password" : "Password"}
                          className="bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] py-6"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        {mode === "signin" && (
                          <div className="text-right">
                            <Button
                            type="button"
                              variant="link"
                              className="p-0 h-auto font-normal"
                              onClick={() => {
                                setMode("forgot-password");
                                setFormErrors({});
                                setFormData({ ...formData, password: "" });
                              }}
                            >
                              Forgot your password?
                            </Button>
                          </div>
                        )}
                        {formErrors.password && (
                          <p className="text-sm text-destructive">{formErrors.password}</p>
                        )}
                      </div>
                    )}

                    {mode === "send-otp" ? (
                      <div className="max-w-md w-full mx-auto">
                        <div className="text-center mb-8">
                          <h2 className="text-3xl font-light mb-4">Verify your email</h2>
                          <p className="text-muted-foreground text-base">
                            We have sent code to your email {formData.email.replace(/(\w{2})[\w.-]+@/g, '$1*****@')}
                          </p>
                        </div>

                        <div className="flex justify-between gap-4 mb-8">
                          {otp.map((digit, index) => (
                            <Input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              className="w-[64px] h-[64px] text-center text-2xl bg-[#2C2C30] border-0 text-white placeholder:text-gray-400 rounded-[10px] focus:ring-1 focus:ring-[#987D4D]"
                            />
                          ))}
                        </div>

                        <div className="space-y-4">
                          <Button 
                            type="submit" 
                            className="w-full bg-[#987D4D] hover:bg-[#876C3C] h-12 text-base" 
                            disabled={loading || otp.some(digit => !digit)}
                          >
                            Verify Account
                          </Button>

                          <Button
                            type="button"
                            variant="link"
                            className="w-full text-center text-sm text-gray-400 hover:text-white"
                            onClick={resendEmailOtp}
                          >
                            Resend Code!
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {mode === "signin" && (
                          <>
                            <Button type="submit" className="w-full bg-[#987D4D] hover:bg-[#876C3C]" disabled={loading}>
                              {loading ? "Loading..." : "Login"}
                            </Button>

                            <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-800"></div>
                              </div>
                              <div className="relative flex justify-center text-sm">
                                <span className="px-2 text-gray-400 bg-black">Or</span>
                              </div>
                            </div>
                            
                            <Button 
                              type="button" 
                              variant="outline"
                              className="w-full bg-transparent border-gray-800 hover:bg-gray-900 text-white"
                              onClick={handleGoogleSignIn}
                            >
                              <img src="/lovable-uploads/google.png" alt="Google" className="w-5 h-5 mr-2" />
                              Sign In with Google
                            </Button>

                            <p className="mt-4 text-center text-sm text-gray-400">
                              Create an account? {" "}
                              <Button
                                variant="link"
                                className="p-0 h-auto text-[#987D4D] hover:text-[#876C3C]"
                                onClick={() => {
                                  setMode("signup");
                                  setFormErrors({});
                                  setFormData({
                                    email: "",
                                    password: "",
                                    username: "",
                                    firstName: "",
                                    lastName: "",
                                    phone: "",
                                    city: "",
                                    state: "",
                                    bio: "",
                                    country: "",
                                    website: "",
                                    instagram: "",
                                  });
                                  setAvatarFile(null);
                                  setAvatarPreview(null);
                                }}
                              >
                                Sign up
                              </Button>
                            </p>
                          </>
                        )}

                        {mode === 'forgot-password' && (
                          <>
                          <Button type="submit" className="w-full bg-[#987D4D] hover:bg-[#876C3C]" disabled={loading}>
                          {loading ? "Loading..." : "Send Link"}
                        </Button>
                         <Button
                         variant="outline"
                                 className="w-full bg-black text-white hover:bg-gray-900 border-gray-800"
                         onClick={() => setMode("signin")}
                       >
                         Back
                       </Button>
                       </>
                        )}
                         {mode === 'reset-password' && (
                          <Button type="submit" className="w-full bg-[#987D4D] hover:bg-[#876C3C]" disabled={loading}>
                          {loading ? "Loading..." : "Reset Password"}
                        </Button>
                        
                        )}
                      </>
                    )}
                  </form>
                </>
              )}

              {/* Add Go to Home Link */}
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-400">Go to </span>
                <button 
                  type="button" 
                  className="text-sm text-[#987D4D] hover:underline"
                  onClick={() => navigate("/")}
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Image */}
        {mode !== "forgot-password" && mode !== "send-otp" && mode !== "create-profile" && mode !== "success" && (
          <div className="relative p-8 hidden lg:block h-screen">
            <img
              src={mode === "signup" 
                ? "/lovable-uploads/signup.png" 
                : "/lovable-uploads/signin.png"}
              alt={mode === "signup" 
                ? "Sign up illustration" 
                : "Hip hop artist performing"}
              className="object-cover h-full w-full rounded-[32px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30" />
          </div>
        )}
      </div>
    </>
  );
};

export default AuthForm;
