
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize the session
    const initSession = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // If user is logged in, initialize presence tracking
        if (session?.user) {
          const channel = supabase.channel('online-users', {
            config: {
              presence: {
                key: session.user.id,
              },
            },
          });

          channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({
                user_id: session.user.id,
                online_at: new Date().toISOString(),
              });
            }
          });
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Track user presence when logging in
      if (event === 'SIGNED_IN' && session?.user) {
        const channel = supabase.channel('online-users', {
          config: {
            presence: {
              key: session.user.id,
            },
          },
        });

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: session.user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
