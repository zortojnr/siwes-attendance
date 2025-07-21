import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { 
  User, 
  MapPin, 
  Clock, 
  Download, 
  UserCheck, 
  Settings, 
  LogOut,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  Star,
  Sparkles,
  Zap,
  Heart
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'student' | 'admin';
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  student_name: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  created_at: string;
}

interface SiwesLocation {
  id: string;
  student_name: string;
  location: string;
  assigned_date: string;
  assigned_by?: string;
  created_at: string;
}

export default function SiwesApp() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'student-home' | 'admin-home' | 'admin-login'>('login');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [adminLoginForm, setAdminLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // App data states
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [siwesLocations, setSiwesLocations] = useState<SiwesLocation[]>([]);
  const [newLocation, setNewLocation] = useState({ studentName: '', location: '' });

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (profile) {
              setUserProfile(profile as UserProfile);
              setCurrentView(profile.role === 'admin' ? 'admin-home' : 'student-home');
            }
          }, 0);
        } else {
          setUserProfile(null);
          setCurrentView('login');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load attendance and location data when user changes
  useEffect(() => {
    if (user) {
      loadAttendanceRecords();
      loadSiwesLocations();
    }
  }, [user]);

  const loadAttendanceRecords = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setAttendanceRecords(data as AttendanceRecord[]);
    }
  };

  const loadSiwesLocations = async () => {
    const { data, error } = await supabase
      .from('siwes_locations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setSiwesLocations(data as SiwesLocation[]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "default"
      });
      setLoginForm({ email: '', password: '' });
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // First try to login
    let { data, error } = await supabase.auth.signInWithPassword({
      email: "university@admin.com",
      password: "admin123",
    });

    // If login fails because user doesn't exist, create the admin account
    if (error && error.message.includes("Invalid login credentials")) {
      console.log("Admin account doesn't exist, creating it...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: "university@admin.com",
        password: "admin123",
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: "Admin",
            last_name: "User",
            role: "admin"
          }
        }
      });

      if (signUpError) {
        setIsLoading(false);
        toast({
          title: "Admin Account Creation Failed",
          description: signUpError.message,
          variant: "destructive"
        });
        return;
      }

      // Now try to login again
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: "university@admin.com",
        password: "admin123",
      });

      if (loginError) {
        setIsLoading(false);
        toast({
          title: "Admin Login Failed",
          description: loginError.message,
          variant: "destructive"
        });
        return;
      }
    } else if (error) {
      setIsLoading(false);
      toast({
        title: "Admin Login Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(false);
    toast({
      title: "Admin Login Successful",
      description: "Welcome Admin!",
      variant: "default"
    });
    setAdminLoginForm({ email: '', password: '' });
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInAnonymously();

    setIsLoading(false);

    if (error) {
      toast({
        title: "Guest Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Guest Login Successful",
        description: "Welcome Guest Student!",
        variant: "default"
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: registerForm.firstName,
          last_name: registerForm.lastName,
          role: 'student'
        }
      }
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Registration Successful",
        description: "Welcome! Please check your email to verify your account.",
        variant: "default"
      });
      setRegisterForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          hd: 'student.edu' // Restrict to student emails
        }
      }
    });

    if (error) {
      toast({
        title: "Google Sign-up Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCheckIn = async () => {
    if (!navigator.geolocation || !user || !userProfile) {
      toast({
        title: "Error",
        description: !navigator.geolocation ? "Geolocation is not supported by this browser" : "Please log in to check in",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const { error } = await supabase
          .from('attendance_records')
          .insert({
            user_id: user.id,
            student_name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
            latitude: latitude,
            longitude: longitude,
            location_name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          });

        setIsLoading(false);

        if (error) {
          toast({
            title: "Check-in Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          // Reload attendance records
          await loadAttendanceRecords();
          
          // Trigger celebration animation
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2000);
          
          toast({
            title: "Check-in Successful! 🎉",
            description: `Location recorded: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            variant: "default"
          });
        }
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location Error",
          description: "Failed to get your location. Please enable location services.",
          variant: "destructive"
        });
      }
    );
  };

  const renderConfetti = () => {
    return Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className={`absolute animate-confetti pointer-events-none`}
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2 + Math.random() * 2}s`
        }}
      >
        {i % 4 === 0 ? '🎉' : i % 4 === 1 ? '⭐' : i % 4 === 2 ? '🎊' : '✨'}
      </div>
    ));
  };

  const handleDownloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Student Name,Date,Time,Latitude,Longitude\n" +
      attendanceRecords.map(record => 
        `${record.student_name},${record.date},${record.time},${record.latitude},${record.longitude}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Complete",
      description: "Attendance report downloaded successfully",
      variant: "default"
    });
  };

  const handleAssignLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.studentName || !newLocation.location || !user) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('siwes_locations')
      .insert({
        student_name: newLocation.studentName,
        location: newLocation.location,
        assigned_by: user.id
      });

    if (error) {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      await loadSiwesLocations();
      setNewLocation({ studentName: '', location: '' });
      
      toast({
        title: "Location Assigned",
        description: `${newLocation.location} assigned to ${newLocation.studentName}`,
        variant: "default"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
      variant: "default"
    });
  };

  const studentAttendance = attendanceRecords.filter(record => record.user_id === user?.id);

  // Render Admin Login Page
  if (currentView === 'admin-login') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 animate-float">
            <Settings className="h-8 w-8 text-primary/20 animate-rotate-slow" />
          </div>
          <div className="absolute top-40 right-32 animate-float" style={{ animationDelay: '1s' }}>
            <Users className="h-6 w-6 text-secondary/20 animate-pulse-glow" />
          </div>
          <div className="absolute bottom-32 left-32 animate-float" style={{ animationDelay: '2s' }}>
            <Star className="h-10 w-10 text-accent/20 animate-rotate-slow" style={{ animationDirection: 'reverse' }} />
          </div>
          <div className="absolute bottom-20 right-20 animate-float" style={{ animationDelay: '0.5s' }}>
            <Sparkles className="h-7 w-7 text-primary/30 animate-pulse" />
          </div>
        </div>
        
        <Card className="w-full max-w-md shadow-xl animate-bounce-in relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-gradient-primary rounded-full animate-pulse-glow">
              <Settings className="h-8 w-8 text-primary-foreground animate-rotate-slow" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary animate-zoom-in">Admin Login</CardTitle>
            <CardDescription className="animate-slide-up">Sign in to admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Admin Email"
                  value={adminLoginForm.email}
                  onChange={(e) => setAdminLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full transition-all duration-300 focus:animate-pulse-glow"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Admin Password"
                  value={adminLoginForm.password}
                  onChange={(e) => setAdminLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full transition-all duration-300 focus:animate-pulse-glow"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full animate-pulse-glow" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Admin Sign In
                  </span>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Not an admin?{' '}
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-primary hover:underline font-medium transition-all hover:animate-shake"
                >
                  Student login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Student Login Page
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-16 animate-float">
            <UserCheck className="h-12 w-12 text-primary/20 animate-pulse" />
          </div>
          <div className="absolute top-32 right-24 animate-float" style={{ animationDelay: '1.5s' }}>
            <Heart className="h-8 w-8 text-accent/30 animate-pulse-glow" />
          </div>
          <div className="absolute bottom-40 left-24 animate-float" style={{ animationDelay: '3s' }}>
            <Sparkles className="h-10 w-10 text-secondary/25 animate-rotate-slow" />
          </div>
          <div className="absolute bottom-16 right-16 animate-float" style={{ animationDelay: '2s' }}>
            <Star className="h-6 w-6 text-primary/40 animate-bounce" />
          </div>
          <div className="absolute top-1/2 left-8 animate-float" style={{ animationDelay: '4s' }}>
            <Zap className="h-5 w-5 text-accent/20 animate-pulse" />
          </div>
          <div className="absolute top-1/2 right-8 animate-float" style={{ animationDelay: '2.5s' }}>
            <CheckCircle className="h-7 w-7 text-success/25 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
        </div>
        
        <Card className="w-full max-w-md shadow-xl animate-bounce-in relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-gradient-primary rounded-full animate-pulse-glow">
              <UserCheck className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary animate-zoom-in">SIWES Attendance</CardTitle>
            <CardDescription className="animate-slide-up">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full transition-all duration-300 focus:animate-pulse-glow"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full transition-all duration-300 focus:animate-pulse-glow"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full animate-pulse-glow" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
            <div className="mt-6 space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                size="lg" 
                className="w-full transition-all hover:animate-pulse-glow" 
                onClick={handleGuestLogin}
                disabled={isLoading}
              >
                <User className="h-4 w-4 mr-2" />
                Login as Guest Student
              </Button>
            </div>
            
            <div className="mt-6 text-center space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentView('register')}
                  className="text-primary hover:underline font-medium transition-all hover:animate-shake"
                >
                  Register here
                </button>
              </p>
              <p className="text-sm text-muted-foreground">
                Are you an admin?{' '}
                <button
                  onClick={() => setCurrentView('admin-login')}
                  className="text-primary hover:underline font-medium transition-all hover:animate-shake"
                >
                  Admin login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Register Page
  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-16 animate-float">
            <User className="h-10 w-10 text-primary/20 animate-bounce" />
          </div>
          <div className="absolute top-1/3 right-12 animate-float" style={{ animationDelay: '2s' }}>
            <Sparkles className="h-8 w-8 text-accent/25 animate-pulse-glow" />
          </div>
          <div className="absolute bottom-1/4 left-12 animate-float" style={{ animationDelay: '1s' }}>
            <Heart className="h-6 w-6 text-secondary/30 animate-pulse" />
          </div>
          <div className="absolute bottom-16 right-24 animate-float" style={{ animationDelay: '3s' }}>
            <CheckCircle className="h-9 w-9 text-success/20 animate-rotate-slow" />
          </div>
        </div>
        
        <Card className="w-full max-w-md shadow-xl animate-bounce-in relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-gradient-secondary rounded-full animate-pulse-glow">
              <User className="h-8 w-8 text-secondary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary animate-zoom-in">Create Account</CardTitle>
            <CardDescription className="animate-slide-up">Register for SIWES Attendance</CardDescription>
          </CardHeader>
          <CardContent className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="First Name"
                  value={registerForm.firstName}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Student Email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="lg" 
                className="w-full transition-all hover:animate-pulse-glow" 
                onClick={handleGoogleSignUp}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>
            </form>
            <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-primary hover:underline font-medium transition-all hover:animate-shake"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Student Dashboard
  if (currentView === 'student-home') {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Celebration Animation Overlay */}
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {renderConfetti()}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-celebration text-6xl">🎉</div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="bg-gradient-primary text-primary-foreground shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-8 w-8" />
                <div>
                  <h1 className="text-xl font-bold">SIWES Attendance</h1>
                  <p className="text-sm opacity-90">Student Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">{userProfile?.first_name} {userProfile?.last_name}</p>
                  <p className="text-sm opacity-90">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-white/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Check-in Section */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    Check-in
                  </CardTitle>
                  <CardDescription>Record your attendance with location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className={`w-full transition-all duration-300 ${showCelebration ? 'animate-celebration' : 'hover:animate-pulse-glow'}`}
                    onClick={handleCheckIn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 animate-pulse" />
                        Getting Location...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In Now
                      </span>
                    )}
                  </Button>
                  
                  {studentAttendance.length > 0 && (
                    <div className="p-4 bg-success-light rounded-lg">
                      <div className="flex items-center text-success mb-2">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="font-medium">Last Check-in</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {studentAttendance[0].date} at {studentAttendance[0].time}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Location: {studentAttendance[0].latitude.toFixed(4)}, {studentAttendance[0].longitude.toFixed(4)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Attendance History */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Attendance History
                  </CardTitle>
                  <CardDescription>Your check-in records</CardDescription>
                </CardHeader>
                <CardContent>
                  {studentAttendance.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No attendance records yet</p>
                      <p className="text-sm text-muted-foreground mt-2">Check in to start recording your attendance</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {studentAttendance.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-success-light p-2 rounded-full">
                              <CheckCircle className="h-4 w-4 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">{record.date}</p>
                              <p className="text-sm text-muted-foreground">{record.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">
                              <MapPin className="h-3 w-3 mr-1" />
                              {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  if (currentView === 'admin-home') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-gradient-primary text-primary-foreground shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8" />
                <div>
                  <h1 className="text-xl font-bold">SIWES Attendance</h1>
                  <p className="text-sm opacity-90">Admin Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">{userProfile?.first_name} {userProfile?.last_name}</p>
                  <p className="text-sm opacity-90">{user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-white/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Students List */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Registered Students
                </CardTitle>
                <CardDescription>List of all students in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">View students via attendance records</p>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Check-ins */}
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Recent Check-ins
                  </CardTitle>
                  <CardDescription>Latest attendance records</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No check-ins yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {attendanceRecords.slice(0, 10).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-success-light p-2 rounded-full">
                            <CheckCircle className="h-4 w-4 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">{record.student_name}</p>
                            <p className="text-sm text-muted-foreground">{record.date} at {record.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assign SIWES Locations */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  Assign SIWES Locations
                </CardTitle>
                <CardDescription>Assign placement locations to students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAssignLocation} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Student Name"
                    value={newLocation.studentName}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, studentName: e.target.value }))}
                  />
                  <Input
                    type="text"
                    placeholder="Company/Organization Location"
                    value={newLocation.location}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, location: e.target.value }))}
                  />
                  <Button type="submit" variant="secondary" className="w-full">
                    Assign Location
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Assigned Locations */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Assigned Locations
                </CardTitle>
                <CardDescription>Current student placements</CardDescription>
              </CardHeader>
              <CardContent>
                {siwesLocations.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No locations assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {siwesLocations.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-secondary-light p-2 rounded-full">
                            <Building className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium">{assignment.student_name}</p>
                            <p className="text-sm text-muted-foreground">{assignment.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{assignment.assigned_date}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}