import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, GraduationCap, Shield, UserCircle } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const studentIdPattern = /^FCP\/CSS\/20\/\d{4,}$/;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = adminEmail.trim().toLowerCase();
      const password = adminPassword.trim();

      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
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
            email,
            password,
          });

          if (retryError) throw retryError;
        }
      }

      toast({
        title: "Welcome Admin!",
        description: "Successfully logged in."
      });

      navigate('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentIdPattern.test(studentId)) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be in format: FCP/CSS/20/XXXX (e.g., FCP/CSS/20/1234)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const email = `${studentId.replace(/\//g, '_')}@student.fud.edu.ng`;
      const password = studentPassword.trim();

      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              student_id: studentId,
              role: 'student'
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('profiles').upsert({
            user_id: signUpData.user.id,
            first_name: studentId.split('/')[3] || 'Student',
            last_name: 'User',
            student_id: studentId,
            role: 'student'
          });

          await supabase.from('user_roles').upsert({
            user_id: signUpData.user.id,
            role: 'student'
          });

          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (retryError) throw retryError;
        }
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
        description: error.message || "Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        if (error.message.includes("disabled")) {
          toast({
            title: "Guest Login Disabled",
            description: "Anonymous sign-ins are disabled in your Supabase settings.",
            variant: "destructive"
          });
        } else throw error;
        return;
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

        navigate('/student');
      }
    } catch (error: any) {
      console.error('Guest login error:', error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-white p-3 shadow-lg">
              <img
                src="/lovable-uploads/bdcd74c6-b4ce-411a-9a19-1281d6a1718e.png"
                alt="FUD Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">FUD SIWES Portal</h1>
          <p className="text-muted-foreground">Federal University Dutse</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your account type to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="admin">
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="student">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="guest">
                  <UserCircle className="h-4 w-4 mr-1" />
                  Guest
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@fud.edu.ng"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In as Admin'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      type="text"
                      placeholder="FCP/CSS/20/1234"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: FCP/CSS/20/XXXX
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="Enter password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In as Student'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="guest">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Continue as a guest to view the SIWES portal with limited access.
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleGuestLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Continue as Guest'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Secure SIWES Management System
        </p>
      </div>
    </div>
  );
}
