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
  const { userProfile } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    }
  }, [userProfile, navigate]);

  // Admin login
  const [adminEmail, setAdminEmail] = useState('admin@fud.edu.ng');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Student login
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
            description: "Anonymous sign-ins are currently disabled. Please contact your administrator or use student/admin login.",
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

        toast({
          title: "Welcome Guest!",
          description: "You're logged in as a guest."
        });
      }
    } catch (error: any) {
      console.error('Guest login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Unable to login as guest. Please try again.",
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
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail.trim(),
          password: adminPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: 'System',
              last_name: 'Administrator',
              role: 'admin'
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('profiles').upsert({
            user_id: signUpData.user.id,
            first_name: 'System',
            last_name: 'Administrator',
            role: 'admin'
          });

          await supabase.from('user_roles').upsert({
            user_id: signUpData.user.id,
            role: 'admin'
          });

          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: adminEmail.trim(),
            password: adminPassword,
          });

          if (retryError) throw retryError;
        }
      }

      toast({
        title: "Welcome Admin!",
        description: "Successfully logged in."
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Student login (ID + Password only)
  const handleStudentLogin = async () => {
    const cleanStudentId = studentId.trim();
    const password = studentPassword.trim() || '1234';

    // Validate format
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
        .from('students') // use your students table
        .select('*')
        .eq('student_id', cleanStudentId)
        .eq('password', password) // plain text for now
        .single();

      if (error || !data) {
        throw new Error("Student ID or password incorrect");
      }

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
            <img 
              src={fudLogo} 
              alt="Federal University Dutse Logo" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary">SIWES Portal</h1>
          <p className="text-muted-foreground mt-2">Federal University Dutse</p>
          <p className="text-sm text-muted-foreground">Student Industrial Work Experience Scheme</p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Student
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </TabsTrigger>
            <TabsTrigger value="guest" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Guest
            </TabsTrigger>
          </TabsList>

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
                  <Label htmlFor="studentPassword">Password</Label>
                  <Input
                    id="studentPassword"
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="password"
                  />
                </div>
                <Button 
                  onClick={handleStudentLogin} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Access the administrative dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y
