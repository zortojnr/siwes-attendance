import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, GraduationCap, User } from 'lucide-react';
import fudLogo from '@/assets/fud-logo.jpg';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userProfile, setUserProfile } = useAuth(); // include setter

  // Redirect if already logged in
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'admin') {
        navigate('/admin');
      } else if (userProfile.role === 'student') {
        navigate('/student');
      }
    }
  }, [userProfile, navigate]);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('admin@fud.edu.ng');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Student login state
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Guest login
  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        if (error.message.includes('Anonymous sign-ins are disabled')) {
          toast({
            title: "Guest Login Unavailable",
            description: "Anonymous sign-ins are currently disabled. Please use student/admin login.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          first_name: 'Guest',
          last_name: 'User',
          role: 'guest'
        });

        await supabase.from('user_roles').upsert({
          user_id: data.user.id,
          role: 'guest'
        });

        setUserProfile({
          user_id: data.user.id,
          role: 'guest',
          first_name: 'Guest',
          last_name: 'User'
        });

        toast({
          title: "Welcome Guest!",
          description: "You're logged in as a guest."
        });
      }
    } catch (error: any) {
      console.error('Guest login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Unable to login as guest.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Admin login
  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (signInError) {
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email: adminEmail.trim(),
          password: adminPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { first_name: 'System', last_name: 'Administrator', role: 'admin' }
          }
        });
        if (signUpError) throw signUpError;

        // Retry login
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: adminEmail.trim(),
          password: adminPassword,
        });
        if (retryError) throw retryError;
      }

      // Update context
      setUserProfile({
        user_id: signInData?.user?.id || '',
        role: 'admin',
        first_name: 'System',
        last_name: 'Administrator'
      });

      toast({
        title: "Welcome Admin!",
        description: "Successfully logged in."
      });
      navigate('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Check your credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Student login
  const handleStudentLogin = async () => {
    const cleanStudentId = studentId.trim();
    const password = studentPassword.trim() || '1234';

    // Validate ID format
    const studentIdPattern = /^FCP\/CCS\/20\/\d{4}$/;
    if (!studentIdPattern.test(cleanStudentId)) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be in format: FCP/CCS/20/1234",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', cleanStudentId)
        .eq('password', password)
        .single();

      if (error || !data) throw new Error("Student ID or password incorrect");

      // Update AuthContext
      setUserProfile({
        user_id: data.id,
        role: 'student',
        student_id: data.student_id,
        first_name: data.first_name,
        last_name: data.last_name
      });

      toast({
        title: "Welcome Student!",
        description: "Successfully logged in."
      });
      navigate('/student');
    } catch (error: any) {
      console.error('Student login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Check your ID and password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={fudLogo} alt="FUD Logo" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-primary">SIWES Portal</h1>
          <p className="text-muted-foreground mt-2">Federal University Dutse</p>
          <p className="text-sm text-muted-foreground">Student Industrial Work Experience Scheme</p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Student
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Admin
            </TabsTrigger>
            <TabsTrigger value="guest" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Guest
            </TabsTrigger>
          </TabsList>

          {/* Student */}
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Login</CardTitle>
                <CardDescription>Access your student dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="FCP/CCS/20/1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Password (default: 1234)</Label>
                  <Input
                    id="studentPassword"
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="1234"
                  />
                </div>
                <Button onClick={handleStudentLogin} disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Access the administrative dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@fud.edu.ng"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>
                <Button onClick={handleAdminLogin} disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In as Admin
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guest */}
          <TabsContent value="guest">
            <Card>
              <CardHeader>
                <CardTitle>Guest Access</CardTitle>
                <CardDescription>Try the system as a guest (limited features)</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGuestLogin} disabled={loading} variant="outline" className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue as Guest
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
