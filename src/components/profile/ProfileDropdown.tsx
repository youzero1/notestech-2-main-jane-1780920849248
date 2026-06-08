
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCog, LogOut, CreditCard, ChevronDown, ShoppingBag, Receipt } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

interface ProfileDropdownProps {
  avatarUrl?: string | null;
  className?: string;
}

export const ProfileDropdown = ({ avatarUrl, className }: ProfileDropdownProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user has admin role
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc(
          'has_role',
          { user_id: user.id, role: 'admin' }
        );
        
        if (error) {
          console.error('Error checking admin role:', error);
          return;
        }
        
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Failed to check admin role:', error);
      }
    };
    
    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error checking session:', sessionError);
        navigate("/auth");
        return;
      }

      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      navigate("/auth");
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img 
              src={avatarUrl || '/default-avatar.png'} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-medium text-white">
            {user?.user_metadata?.first_name || 'Mason'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-[#1C1C1E] border border-gray-800 mt-2 rounded-xl p-1"
      >
        <DropdownMenuItem 
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 px-3 py-2 text-gray-200 hover:bg-gray-800 rounded-lg cursor-pointer"
        >
          <UserCog className="h-4 w-4 text-gray-400" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Show My Orders only for non-admin users */}
        {!isAdmin && (
          <DropdownMenuItem 
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 px-3 py-2 text-gray-200 hover:bg-gray-800 rounded-lg cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 text-gray-400" />
            <span>My Orders</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem 
          onClick={() => navigate("/subscriptions")}
          className="flex items-center gap-2 px-3 py-2 text-gray-200 hover:bg-gray-800 rounded-lg cursor-pointer"
        >
          <Receipt className="h-4 w-4 text-gray-400" />
          <span>Subscriptions</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => navigate("/membership")}
          className="flex items-center gap-2 px-3 py-2 text-gray-200 hover:bg-gray-800 rounded-lg cursor-pointer"
        >
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span>Membership</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-gray-800" />

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-gray-800 rounded-lg cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
