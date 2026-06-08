
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

interface MembershipGuardProps {
  children: React.ReactNode;
  feature: "beats" | "production" | "entrepreneurship" | "music-business";
}

export const MembershipGuard = ({ children, feature }: MembershipGuardProps) => {
  const { hasAccess, isLoading: membershipLoading } = useMembership();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  if (isLoading || membershipLoading) {
    return <div>Loading...</div>;
  }

  // Allow access if user is admin, regardless of membership status
  if (isAdmin) {
    return <>{children}</>;
  }

  if (!hasAccess(feature)) {
    return (
      <Card className="p-6 text-center space-y-4">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-bold">Premium Feature</h2>
        <p className="text-muted-foreground">
          This feature is only available to premium members.
        </p>
        <Button 
          variant="default" 
          onClick={() => navigate("/membership")}
          className="mt-4"
        >
          View Plans
        </Button>
      </Card>
    );
  }

  return <>{children}</>;
};
