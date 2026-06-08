import React from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarSeparator } from "@/components/ui/sidebar";
import { LayoutDashboard, Music, DollarSign, BookOpen, Users, Menu, ShoppingBag, Link, Package, Search, ChevronLeft, ArrowBigLeft, ArrowLeft, MessageSquare, MessageSquareText, MessageSquareTextIcon, BarChart, Mail } from "lucide-react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { AskNotes } from "@/components/chat/AskNotes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CartSheet } from "@/components/cart/CartSheet";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onSearch?: (term: string) => void;
  searchTerm?: string;
  showSearchBar?: boolean;
  headerTitle?: string;
  headerDescription?: string;
  showLink?: boolean;
  redirectionLink?: string;
  linkText?: string;
  tabs?: string[];
  selectedTab?: string;
  onTabChange?: (tab: string) => void;
}

export const DashboardLayout = ({
  children,
  onSearch,
  searchTerm = "",
  showSearchBar = false,
  headerTitle = "Dashboard",
  headerDescription,
  showLink = false,
  redirectionLink = "/",
  linkText = "",
  tabs = [],
  selectedTab,
  onTabChange
}: DashboardLayoutProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  const { data: roleData } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchUserProfile();

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload: any) => {
          if (payload.new.avatar_url) {
            setAvatarUrl(payload.new.avatar_url);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isAdmin = !!roleData;

  const menuItems = [
    {
      title: "Home",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Music",
      icon: Music,
      href: "/music",
    },
    {
      title: "Money",
      icon: DollarSign,
      href: "/money",
    },
    {
      title: "Knowledge",
      icon: BookOpen,
      href: "/knowledge",
    },
    {
      title: "Membership Community",
      icon: Users,
      href: "/community",
    },
    {
      title: "Shop Bazar",
      icon: ShoppingBag,
      href: "/marketplace",
    },
    {
      title: "Noteslink",
      icon: Link,
      href: "/noteslink",
    },
    // {
    //   title: "Messages",
    //   icon: MessageSquare,
    //   href: "/messages",
    // },
    {
      title: "Ask Notes",
      icon: () => (
        <img 
          src="/lovable-uploads/img.png" 
          alt="Ask Notes"
          className="h-3 w-3 object-contain"
          style={{ 
            imageRendering: '-webkit-optimize-contrast',
            transform: 'translateZ(0)',
          }}
        />
      ),
      href: "/asknotes",
    },
    {
      title: "Ask Rakim",
      icon: () => (
        <img 
          src="/lovable-uploads/img.png" 
          alt="Ask Rakim"
          className="h-3 w-3 object-contain"
          style={{ 
            imageRendering: '-webkit-optimize-contrast',
            transform: 'translateZ(0)',
          }}
        />
      ),
      href: "/askrakim",
    },
    
    // Admin-only menu items
    ...(isAdmin ? [
      {
        title: "Product Management",
        icon: Package,
        href: "/admin/product-management",
      },
      {
        title: "Analytics",
        icon: BarChart,
        href: "/analytics",
      },
      {
        title: "Affiliate Management",
        icon: () => (
          <img 
            src="/money/campaign.png" 
            alt="Affiliate Management"
            className="h-4 w-4 opacity-70"
          />
        ),
        href: "/admin/affiliate-management",
      },
      {
        title: "Newsletter Management",
        icon: Mail,
        href: "/admin/newsletters",
      },
      {
        title: "Press Releases Management",
        icon: Mail,
        href: "/admin/press-releases",
      },
      {
        title: "LMS Management",
        icon: () => (
          <img 
            src="/lovable-uploads/lms.png" 
            alt="Affiliate Management"
            className="h-4 w-4 opacity-70"
          />
        ),
        href: "/admin/lms",
      },
      {
        title: "Subscription History",
        icon: Mail,
        href: "/admin/subscription-history",
      },
    ] : []),
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#161618]">
        <div
          className="hidden md:block h-screen w-[250px] fixed left-0 top-0 z-50 bg-black overflow-y-auto 
          [&::-webkit-scrollbar]:!w-[2px]
          [&::-webkit-scrollbar]:!h-[2px]
          [&::-webkit-scrollbar-thumb]:!bg-[#2C2C30]
          [&::-webkit-scrollbar-track]:!bg-black
          [&::-webkit-scrollbar-corner]:!bg-black
          [-ms-overflow-style:none]
          [scrollbar-width:thin]
          [scrollbar-color:#2C2C30_black]
        "
        >
          <Sidebar className="min-h-full bg-black">
            <SidebarContent className="bg-black">
              <SidebarHeader className="flex flex-col p-4 bg-black">
                <RouterLink
                  to="/"
                  className="transition-transform duration-300 hover:scale-105 mb-6"
                >
                  <img
                    src="/lovable-uploads/09c826bc-fcac-4dcc-8cb0-8005d2a77b8e.png"
                    alt="NOTES Logo"
                    className="h-8 w-auto"
                  />
                </RouterLink>
                <h2 className="text-sm text-gray-500 font-medium tracking-wider mb-1 px-2">
                  MAIN MENU
                </h2>
              </SidebarHeader>

              <SidebarGroup className="bg-black">
                <SidebarGroupContent className="list-none px-2 bg-black">
                  {menuItems.map((item) => (
                    <SidebarMenuItem
                      key={item.title}
                      className="list-none mb-4"
                    >
                      <SidebarMenuButton asChild>
                        <RouterLink
                          to={item.href}
                          className={`flex items-center gap-4 w-full py-6 transition-all ${
                            location.pathname === item.href
                              ? "bg-[#2C2C30] text-white rounded-[16px] border border-[#292524] shadow-[0_8px_23px_rgba(0,0,0,0.5)] shadow-[#000000] inner-shadow-[0_-5px_10px_rgba(255,255,255,0.1)]"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <item.icon className="h-6 w-6" />
                          <span className="text-[14px] font-normal">
                            {item.title}
                          </span>
                        </RouterLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>

              <div className="flex-1 min-h-[100px]"></div>

              <div className="p-4 mt-auto">
                <div className="bg-[#1C1C1E] rounded-[16px] p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#987D4D] rounded-full flex items-center justify-center mb-3">
                    <span className="text-white text-xl font-bold">N</span>
                  </div>
                  <h3 className="text-white text-lg font-medium mb-2">
                    Upgrade to Pro
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Upgrade to Pro for uninterrupted access to premium features
                    and enhanced benefits.
                  </p>
                  <button onClick={() => navigate('/membership')} className="w-full py-2 px-4 bg-[#987D4D] hover:bg-[#876C3C] text-white rounded-lg transition-colors">
                    Upgrade
                  </button>
                </div>
              </div>
            </SidebarContent>
          </Sidebar>
        </div>

        <div className="flex-1 flex flex-col md:pl-[290px]">
          <div className="flex flex-col fixed top-0 right-0 left-0 md:left-[290px] z-40 bg-[#161618]">
            <div className="h-16 flex items-center justify-between px-6 pt-4">
              <div className="flex-1 pl-2 mr-4">
                {showSearchBar ? (
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={searchTerm}
                      onChange={handleSearch}
                      placeholder="Search posts by content or author..."
                      className="w-full pl-9 pr-4 py-2 h-10 bg-[#1C1C1E] border-0 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white"
                    />
                  </div>
                ) : (
                  <div>
                    {showLink ? (
                      <RouterLink
                        to={redirectionLink}
                        className="inline-flex items-center gap-2 hover:text-foreground text-white font-medium"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {linkText}
                      </RouterLink>
                    ) : 
                      tabs.length > 0 ? (
                        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex gap-1 border border-[#2A2A2A] rounded-full overflow-hidden w-full sm:w-auto">
                            {tabs.map(tab=>
                              <button 
                                onClick={() => onTabChange(tab)}
                                className={`px-4 sm:px-6 py-2.5 font-medium transition-colors flex-1 sm:flex-none ${
                                    selectedTab === tab 
                                        ? "bg-[#B69C6C] text-white" 
                                        : "text-gray-400 hover:bg-[#2A2A2A]"
                                }`}
                              >
                                {tab}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <h1 className="text-[24px] text-white font-medium">
                          {headerTitle}
                        </h1>
                      )}
                    {headerDescription && (
                      <div className="text-sm text-gray-400 mt-1">
                        {headerDescription}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 ml-4">
                <div
                  className="flex items-center bg-[#1C1C1E] p-2 rounded-full hover:opacity-80 transition-opacity relative cursor-pointer"
                  onClick={() => navigate('/messages')}
                >
                  <div className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></div>
                  <MessageSquareTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center bg-[#1C1C1E] p-2 rounded-full hover:opacity-80 transition-opacity relative">
                  <div className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></div>
                  <CartSheet />
                </div>
                <div className="flex items-center bg-[#1C1C1E] p-2 rounded-full hover:opacity-80 transition-opacity">
                  <NotificationPanel />
                </div>
                <ProfileDropdown
                  avatarUrl={avatarUrl}
                  className="flex items-center gap-2 bg-[#1C1C1E] px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
                />
              </div>
            </div>

            {showSearchBar && (
              <div className="px-6 mt-2 ml-12">
                <h1 className="text-[24px] text-white font-medium">
                  {headerTitle}
                </h1>
                {headerDescription && (
                  <div className="text-sm text-gray-400 mt-1">
                    {headerDescription}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#161618]">
            <div className="flex flex-col p-4 gap-4">
              <div className="flex items-center justify-between">
                <RouterLink to="/">
                  <img
                    src="/lovable-uploads/09c826bc-fcac-4dcc-8cb0-8005d2a77b8e.png"
                    alt="NOTES Logo"
                    className="h-6 w-auto"
                  />
                </RouterLink>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#1C1C1E] p-2 rounded-full hover:opacity-80 transition-opacity relative">
                    <div className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></div>
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center bg-[#1C1C1E] p-2 rounded-full hover:opacity-80 transition-opacity relative">
                    <div className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></div>
                    <CartSheet />
                  </div>
                  <div className="flex items-center bg-[#1C1C1E] p-2 rounded-full hover:opacity-80 transition-opacity">
                    <NotificationPanel />
                  </div>
                  <ProfileDropdown
                    avatarUrl={avatarUrl}
                    className="flex items-center gap-2 bg-[#1C1C1E] px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
                  />
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white"
                      >
                        <Menu className="h-6 w-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="bg-black/95 border-primary/20 w-[80%] flex flex-col overflow-y-auto max-h-screen
                        [&::-webkit-scrollbar]:!w-[2px]
                        [&::-webkit-scrollbar]:!h-[2px]
                        [&::-webkit-scrollbar-thumb]:!bg-[#2C2C30]
                        [&::-webkit-scrollbar-track]:!bg-black
                        [&::-webkit-scrollbar-corner]:!bg-black
                        [-ms-overflow-style:none]
                        [scrollbar-width:thin]
                        [scrollbar-color:#2C2C30_black]"
                    >
                      <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-col mt-4">
                          <h2 className="text-sm text-gray-500 font-medium tracking-wider mb-1 px-2">
                            MAIN MENU
                          </h2>
                          <div className="px-2 overflow-y-auto">
                            {menuItems.map((item) => (
                              <RouterLink
                                key={item.title}
                                to={item.href}
                                className={`flex items-center gap-3 w-full py-3 px-3 mb-2 transition-all rounded-xl ${
                                  location.pathname === item.href
                                    ? "bg-[#2C2C30] text-white border border-[#292524] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <item.icon className="h-5 w-5" />
                                </div>
                                <span className="text-[13px] font-normal">
                                  {item.title}
                                </span>
                              </RouterLink>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 mt-auto">
                        <div className="bg-[#1C1C1E] rounded-xl p-4 flex flex-col items-center text-center">
                          <div className="w-12 h-12 bg-[#987D4D] rounded-full flex items-center justify-center mb-3">
                            <span className="text-white text-xl font-bold">
                              N
                            </span>
                          </div>
                          <h3 className="text-white text-lg font-medium mb-2">
                            Upgrade to Pro
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">
                            Upgrade to Pro for uninterrupted access to premium
                            features and enhanced benefits.
                          </p>
                          <button onClick={() => navigate('/membership')} className="w-full py-2 px-4 bg-[#987D4D] hover:bg-[#876C3C] text-white rounded-lg transition-colors">
                            Upgrade
                          </button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              {tabs.length > 0 && (
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-1 border border-[#2A2A2A] rounded-full overflow-hidden w-full">
                    {tabs.map(tab => (
                      <button 
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                          selectedTab === tab 
                            ? "bg-[#B69C6C] text-white" 
                            : "text-gray-400 hover:bg-[#2A2A2A]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search posts by content or author..."
                  className="w-full pl-9 pr-4 py-2 h-10 bg-[#1C1C1E] border-0 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white"
                />
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 md:p-6 mt-32 md:mt-16">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
