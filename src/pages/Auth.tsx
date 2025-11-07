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

  const studentIdPattern = /^FCP\/CCS\/20\/\d{4}$/;

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
        // User doesn't exist, create new admin account
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
          // Create profile
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: signUpData.user.id,
            first_name: 'System',
            last_name: 'Administrator',
            role: 'admin'
          });

          if (profileError) console.error('Profile creation error:', profileError);

          // Create role entry
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: signUpData.user.id,
            role: 'admin'
          });

          if (roleError) console.error('Role creation error:', roleError);

          toast({
            title: "Admin Account Created!",
            description: "Please sign in with your new credentials."
          });
          
          setLoading(false);
          return;
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
        description: "Student ID must be in format: FCP/CCS/20/XXXX (e.g., FCP/CCS/20/1234)",
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
        // User doesn't exist, create new student account
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
          // Create profile
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: signUpData.user.id,
            first_name: studentId.split('/')[3] || 'Student',
            last_name: 'User',
            student_id: studentId,
            role: 'student'
          });

          if (profileError) console.error('Profile creation error:', profileError);

          // Create role entry
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: signUpData.user.id,
            role: 'student'
          });

          if (roleError) console.error('Role creation error:', roleError);

          toast({
            title: "Student Account Created!",
            description: "Please sign in with your new credentials."
          });
          
          setLoading(false);
          return;
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white p-2 sm:p-3 shadow-lg">
              <img
                src="/lovable-uploads/bdcd74c6-b4ce-411a-9a19-1281d6a1718e.png"
                alt="FUD Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">FUD SIWES Portal</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Federal University Dutse</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">Sign In</CardTitle>
            <CardDescription className="text-sm">Choose your account type to continue</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="admin" className="text-xs sm:text-sm py-2">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                  <span className="sm:hidden">Adm</span>
                </TabsTrigger>
                <TabsTrigger value="student" className="text-xs sm:text-sm py-2">
                  <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Student</span>
                  <span className="sm:hidden">Std</span>
                </TabsTrigger>
                <TabsTrigger value="guest" className="text-xs sm:text-sm py-2">
                  <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Guest</span>
                  <span className="sm:hidden">Gst</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-sm">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@fud.edu.ng"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-sm">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="text-sm sm:text-base"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full text-sm sm:text-base" disabled={loading}>
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
                <form onSubmit={handleStudentLogin} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-id" className="text-sm">Student ID</Label>
                    <Input
                      id="student-id"
                      type="text"
                      placeholder="FCP/CCS/20/1234"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="text-sm sm:text-base"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: FCP/CCS/20/XXXX
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password" className="text-sm">Password</Label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="Enter password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="text-sm sm:text-base"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full text-sm sm:text-base" disabled={loading}>
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
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                    Continue as a guest to view the SIWES portal with limited access.
                  </p>
                  <Button
                    type="button"
                    className="w-full text-sm sm:text-base"
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

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
          Secure SIWES Management System
        </p>
      </div>
    </div>
  );
}
