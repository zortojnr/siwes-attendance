import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, GraduationCap, User } from 'lucide-react';
import fudLogo from '@/assets/fud-logo.jpg';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Admin login states
  const [adminEmail, setAdminEmail] = useState('university@admin.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  
  // Student login/registration states
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [showStudentRegister, setShowStudentRegister] = useState(false);

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;
      
      if (data.user) {
        // Create a guest profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            first_name: 'Guest',
            last_name: 'Student'
          });
        
        if (profileError) throw profileError;

        // Assign student role
        const { error: roleError } = await (supabase as any)
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: 'student'
          });

        if (roleError) throw roleError;
        
        toast({
          title: "Welcome!",
          description: "You're now logged in as a guest student."
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      // First try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (signInError) {
        // Handle email not confirmed or invalid credentials
        if (signInError.message.includes('Email not confirmed') || 
            signInError.message.includes('Invalid login credentials')) {
          // Create the admin account with auto-confirm
          const redirectUrl = `${window.location.origin}/`;
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                email_confirmed: true
              }
            }
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // Create admin profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                user_id: signUpData.user.id,
                first_name: 'System',
                last_name: 'Administrator'
              });

            if (profileError) throw profileError;

            // Assign admin role
            const { error: roleError } = await (supabase as any)
              .from('user_roles')
              .upsert({
                user_id: signUpData.user.id,
                role: 'admin'
              });

            if (roleError) throw roleError;

            // Try to sign in again after creation
            const { error: retrySignInError } = await supabase.auth.signInWithPassword({
              email: adminEmail,
              password: adminPassword,
            });

            if (retrySignInError && !retrySignInError.message.includes('Email not confirmed')) {
              throw retrySignInError;
            }

            toast({
              title: "Admin Access Granted",
              description: "Successfully logged in as administrator."
            });
          }
        } else {
          throw signInError;
        }
      } else {
        toast({
          title: "Welcome Admin",
          description: "Successfully logged in to admin dashboard."
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegister = async () => {
    if (!studentId || !studentPassword || !studentFirstName || !studentLastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create email from student ID
      const email = `${studentId}@student.fud.edu.ng`;
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: studentPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: studentFirstName,
            last_name: studentLastName,
            role: 'student',
            student_id: studentId
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. You can now log in."
      });

      setShowStudentRegister(false);
      // Clear form
      setStudentId('');
      setStudentPassword('');
      setStudentFirstName('');
      setStudentLastName('');
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
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

    // Validate student ID format (FCP/CCS/20U/XXXX where XXXX is any number)
    const studentIdPattern = /^FCP\/CCS\/20U\/\d+$/;
    if (!studentIdPattern.test(studentId)) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be in format: FCP/CCS/20U/XXXX (e.g., FCP/CCS/20U/1234)",
        variant: "destructive"
      });
      return;
    }

    // Auto-fill password to "password" if not provided
    const password = studentPassword || 'password';

    setLoading(true);
    try {
      // Convert student ID to email format
      const email = `${studentId}@student.fud.edu.ng`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed')) {
          // Auto-create student account with default password
          const redirectUrl = `${window.location.origin}/`;
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: 'password', // Always use default password
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                email_confirmed: true
              }
            }
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // Create student profile with student ID as name initially
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                user_id: signUpData.user.id,
                first_name: studentId.split('/')[0] || 'Student',
                last_name: studentId.split('/').pop() || '',
                student_id: studentId
              });

            if (profileError) throw profileError;

            // Assign student role
            const { error: roleError } = await (supabase as any)
              .from('user_roles')
              .upsert({
                user_id: signUpData.user.id,
                role: 'student'
              });

            if (roleError) throw roleError;

            // Try to sign in again
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: 'password',
            });

            if (retryError && !retryError.message.includes('Email not confirmed')) {
              throw retryError;
            }

            toast({
              title: "Welcome!",
              description: "Student account created and logged in successfully."
            });
            return;
          }
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Welcome Student!",
        description: "Successfully logged in to your dashboard."
      });
    } catch (error: any) {
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={fudLogo} 
              alt="Federal University Dutse (FUD) Logo" 
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
                <CardDescription>
                  {showStudentRegister ? 'Create your student account' : 'Access your student dashboard'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showStudentRegister ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={studentFirstName}
                          onChange={(e) => setStudentFirstName(e.target.value)}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={studentLastName}
                          onChange={(e) => setStudentLastName(e.target.value)}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="FCP/CCS/20U/1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentPassword">Password</Label>
                      <Input
                        id="studentPassword"
                        type="password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Create a strong password"
                      />
                    </div>
                    <Button 
                      onClick={handleStudentRegister} 
                      disabled={loading} 
                      className="w-full"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Register
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowStudentRegister(false)}
                      className="w-full"
                    >
                      Already have an account? Sign In
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="FCP/CCS/20U/1234"
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
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowStudentRegister(true)}
                      className="w-full"
                    >
                      Don't have an account? Register
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>
                  Access the administrative dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="university@admin.com"
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
                  Try the system as a guest student (limited features)
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