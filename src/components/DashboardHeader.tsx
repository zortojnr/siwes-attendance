import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, Shield, GraduationCap, Loader2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useState } from 'react';

export function DashboardHeader() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message || "Failed to sign out.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-white p-1 shadow">
            <img 
              src="/lovable-uploads/bdcd74c6-b4ce-411a-9a19-1281d6a1718e.png" 
              alt="FUD Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">FUD SIWES Portal</h1>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {userProfile?.first_name} {userProfile?.last_name}
          </span>
          <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'}>
            {userProfile?.role === 'admin' ? (
              <Shield className="h-3 w-3 mr-1" />
            ) : (
              <GraduationCap className="h-3 w-3 mr-1" />
            )}
            {userProfile?.role}
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
