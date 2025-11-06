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
        // Create guest profile
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          first_name: 'Guest',
          last_name: 'User',
          role: 'guest'
        });

        // Assign guest role
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
      // Try to sign in
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      // If login fails, create the admin account
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

        if (signUpError) {
          if (signUpError.message.includes('email') || signUpError.message.includes('invalid')) {
            toast({
              title: "Invalid Email",
              description: "Please use a valid institutional email address (e.g., admin@fud.edu.ng)",
              variant: "destructive"
            });
            return;
          }
          throw signUpError;
        }

        if (signUpData.user) {
          // Create admin profile
          await supabase.from('profiles').upsert({
            user_id: signUpData.user.id,
            first_name: 'System',
            last_name: 'Administrator',
            role: 'admin'
          });

          // Assign admin role
          await supabase.from('user_roles').upsert({
            user_id: signUpData.user.id,
            role: 'admin'
          });

          // Sign in after creation
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

  const handleStudentLogin = async () => {
    if (!studentId) {
      toast({
        title: "Missing Information",
        description: "Please enter your Student ID",
        variant: "destructive"
      });
      return;
    }

    // Validate student ID format (FCP/CSS/20/XXXX) - accepts any 4+ digit number
    const studentIdPattern = /^FCP\/CSS\/20\/\d{4,}$/;
    if (!studentIdPattern.test(studentId.trim())) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be in format: FCP/CSS/20/1234 (4 or more digits)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Convert student ID to email
      const cleanStudentId = studentId.trim();
      const email = `${cleanStudentId}@student.fud.edu.ng`;
      const password = studentPassword.trim() || 'password';
      
      // Try to sign in
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If login fails, create the student account
      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: 'password', // Default password
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: 'Student',
              last_name: cleanStudentId.split('/').pop() || '',
              role: 'student',
              student_id: cleanStudentId
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('email') || signUpError.message.includes('invalid')) {
            toast({
              title: "Invalid Student ID",
              description: "Unable to create account with this Student ID. Please verify the format.",
              variant: "destructive"
            });
            return;
          }
          throw signUpError;
        }

        if (signUpData.user) {
          // Create student profile
          await supabase.from('profiles').upsert({
            user_id: signUpData.user.id,
            first_name: 'Student',
            last_name: cleanStudentId.split('/').pop() || '',
            role: 'student',
            student_id: cleanStudentId
          });

          // Assign student role
          await supabase.from('user_roles').upsert({
            user_id: signUpData.user.id,
            role: 'student'
          });

          // Sign in after creation
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password: 'password',
          });

          if (retryError) throw retryError;
        }
      }

      toast({
        title: "Welcome Student!",
        description: "Successfully logged in."
      });
    } catch (error: any) {
      console.error('Student login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login. Please check your Student ID and try again.",
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
                    placeholder="FCP/CSS/20/1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Password (default: password)</Label>
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
                <Button 
                  onClick={handleAdminLogin} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In as Admin
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guest">
            <Card>
              <CardHeader>
                <CardTitle>Guest Access</CardTitle>
                <CardDescription>
                  Try the system as a guest (limited features)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGuestLogin} 
                  disabled={loading} 
                  variant="outline"
                  className="w-full"
                >
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
