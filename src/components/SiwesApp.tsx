import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { 
  User, 
  MapPin, 
  Clock, 
  Download, 
  UserPlus, 
  LogOut,
  Calendar,
  CheckCircle,
  AlertCircle,
  Users,
  Activity,
  Loader2,
  Shield,
  GraduationCap
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  matric_number: string;
  department: string;
  level: string;
  created_at: string;
  updated_at: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  student_name: string;
  matric_number?: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  created_at: string;
}

interface LocationAssignment {
  id: string;
  student_id: string;
  company: string;
  address: string;
  supervisor: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export default function SiwesApp() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('student');
  const { toast } = useToast();

  // Login form states
  const [loginEmail, setLoginEmail] = useState('university@admin.com');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // Student management
  const [students, setStudents] = useState<Student[]>([]);
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    matric_number: '',
    department: '',
    level: ''
  });

  // Attendance tracking
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [todayCheckInTime, setTodayCheckInTime] = useState('');

  // Location assignment
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [locationForm, setLocationForm] = useState({
    company: '',
    address: '',
    supervisor: '',
    phone: ''
  });

  // Stats
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
          await loadAttendanceRecords();
          await loadStudents();
          checkTodayAttendance(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStudents = async () => {
    // For now, we'll skip loading students since the table doesn't exist
    // This can be implemented later when the database is set up
    setStudents([]);
  };

  const loadAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const records = data || [];
      setAttendanceRecords(records);
      
      // Calculate today's attendance
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRecords = records.filter(record => record.date === today);
      setTodayAttendance(todayRecords.length);
      
      // Calculate attendance rate (simplified)
      const totalPossibleDays = 30; // Example: 30 working days
      const rate = records.length > 0 ? Math.round((records.length / totalPossibleDays) * 100) : 0;
      setAttendanceRate(Math.min(rate, 100));
      
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const checkTodayAttendance = async (userId: string) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (data) {
        setHasCheckedInToday(true);
        setTodayCheckInTime(data.time);
      }
    } catch (error) {
      // No attendance record for today
      setHasCheckedInToday(false);
    }
  };

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
            last_name: 'Student',
            role: 'student'
          });
        
        if (profileError) throw profileError;
        
        toast({
          title: "Welcome!",
          description: "You're now logged in as a guest student.",
          variant: "default"
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
        email: loginEmail,
        password: loginPassword,
      });

      if (signInError) {
        // If user doesn't exist, create the admin account
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: loginEmail,
            password: loginPassword,
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // Create admin profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                user_id: signUpData.user.id,
                first_name: 'System',
                last_name: 'Administrator',
                role: 'admin'
              });

            if (profileError) throw profileError;

            toast({
              title: "Admin Account Created",
              description: "Admin account created and logged in successfully.",
              variant: "default"
            });
          }
        } else {
          throw signInError;
        }
      } else {
        toast({
          title: "Welcome Admin",
          description: "Successfully logged in to admin dashboard.",
          variant: "default"
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setStudents([]);
      setAttendanceRecords([]);
      setHasCheckedInToday(false);
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feature Coming Soon",
      description: "Student management will be available soon.",
      variant: "default"
    });
  };

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const now = new Date();
          const attendanceData = {
            user_id: user?.id || '',
            student_name: `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Guest Student',
            matric_number: userProfile?.matric_number || '',
            date: format(now, 'yyyy-MM-dd'),
            time: format(now, 'HH:mm:ss'),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location_name: 'Current Location'
          };

          const { error } = await supabase
            .from('attendance_records')
            .insert([attendanceData]);

          if (error) throw error;

          setHasCheckedInToday(true);
          setTodayCheckInTime(attendanceData.time);
          
          toast({
            title: "Check-in Successful!",
            description: `Checked in at ${attendanceData.time}`,
            variant: "default"
          });

          await loadAttendanceRecords();
        } catch (error: any) {
          toast({
            title: "Check-in Failed",
            description: error.message,
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please enable location services.",
          variant: "destructive"
        });
        setLoading(false);
      }
    );
  };

  const handleDownloadReport = async () => {
    try {
      const csvContent = [
        ['Student Name', 'Matric Number', 'Date', 'Time', 'Latitude', 'Longitude'].join(','),
        ...attendanceRecords.map(record => [
          record.student_name,
          record.matric_number || '',
          record.date,
          record.time,
          record.latitude,
          record.longitude
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Attendance report downloaded successfully",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleClearAttendance = async () => {
    if (!user || userProfile?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only admins can clear attendance records",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      await loadAttendanceRecords(); // Reload the records
      toast({
        title: "Attendance Cleared",
        description: "All attendance records have been cleared",
        variant: "default"
      });
    }
  };

  const handleAssignLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feature Coming Soon",
      description: "Location assignment will be available soon.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      
      {!user ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white p-2 shadow-lg">
                <img 
                  src="/lovable-uploads/bdcd74c6-b4ce-411a-9a19-1281d6a1718e.png" 
                  alt="Federal University Dutse Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold">FUD SIWES Attendance</CardTitle>
              <CardDescription className="text-sm sm:text-base">Federal University Dutse - Track your internship attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
                  <TabsTrigger value="student" className="text-xs sm:text-sm">Student</TabsTrigger>
                  <TabsTrigger value="admin" className="text-xs sm:text-sm">Admin</TabsTrigger>
                </TabsList>

                <TabsContent value="student" className="space-y-4">
                  <Button 
                    onClick={handleGuestLogin} 
                    className="w-full h-12 text-sm sm:text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Signing in...</span>
                        <span className="sm:hidden">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Continue as Student</span>
                        <span className="sm:hidden">Student Login</span>
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="university@admin.com"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-10 text-sm"
                    />
                  </div>
                  <Button 
                    onClick={handleAdminLogin} 
                    className="w-full h-12 text-sm sm:text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Signing in...</span>
                        <span className="sm:hidden">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Admin Login</span>
                        <span className="sm:hidden">Admin</span>
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>Demo Admin Credentials:</p>
                    <p>Email: university@admin.com</p>
                    <p>Password: admin123</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          {/* Header */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="h-8 w-8 mr-3 rounded-full bg-white p-1 shadow-sm">
                    <img 
                      src="/lovable-uploads/bdcd74c6-b4ce-411a-9a19-1281d6a1718e.png" 
                      alt="FUD Logo" 
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 hidden sm:block">FUD SIWES Attendance</h1>
                  <h1 className="text-lg font-bold text-gray-900 sm:hidden">FUD SIWES</h1>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className="text-xs sm:text-sm text-gray-600 hidden md:block">
                    Welcome, {userProfile?.role === 'admin' ? 'Admin' : `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Student'}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm">
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">Out</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            {userProfile?.role === 'admin' ? (
              /* Admin Dashboard */
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">{students.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Active this session
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">{todayAttendance}</div>
                      <p className="text-xs text-muted-foreground">
                        Students checked in today
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg sm:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">{attendanceRate}%</div>
                      <p className="text-xs text-muted-foreground">
                        Overall attendance
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Student Management */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <UserPlus className="h-5 w-5 mr-2 text-primary" />
                        Student Management
                      </CardTitle>
                      <CardDescription className="text-sm">Add and manage student profiles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleStudentSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="studentName" className="text-sm">Full Name</Label>
                            <Input
                              id="studentName"
                              value={studentForm.full_name}
                              onChange={(e) => setStudentForm({...studentForm, full_name: e.target.value})}
                              placeholder="Enter student name"
                              className="text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="matricNumber" className="text-sm">Matric Number</Label>
                            <Input
                              id="matricNumber"
                              value={studentForm.matric_number}
                              onChange={(e) => setStudentForm({...studentForm, matric_number: e.target.value})}
                              placeholder="e.g., FUD/CSC/19/1234"
                              className="text-sm"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="department" className="text-sm">Department</Label>
                            <Input
                              id="department"
                              value={studentForm.department}
                              onChange={(e) => setStudentForm({...studentForm, department: e.target.value})}
                              placeholder="e.g., Computer Science"
                              className="text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="level" className="text-sm">Level</Label>
                            <Select value={studentForm.level} onValueChange={(value) => setStudentForm({...studentForm, level: value})}>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="200">200 Level</SelectItem>
                                <SelectItem value="300">300 Level</SelectItem>
                                <SelectItem value="400">400 Level</SelectItem>
                                <SelectItem value="500">500 Level</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" className="w-full text-sm" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span className="hidden sm:inline">Adding Student...</span>
                              <span className="sm:hidden">Adding...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Add Student</span>
                              <span className="sm:hidden">Add</span>
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Location Assignment */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <MapPin className="h-5 w-5 mr-2 text-primary" />
                        Location Assignment
                      </CardTitle>
                      <CardDescription className="text-sm">Assign students to industry locations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAssignLocation} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="studentSelect" className="text-sm">Select Student</Label>
                          <Select 
                            value={selectedStudentId} 
                            onValueChange={setSelectedStudentId}
                            required
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Choose a student" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id} className="text-sm">
                                  {student.full_name} ({student.matric_number})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-sm">Company/Organization</Label>
                          <Input
                            id="company"
                            value={locationForm.company}
                            onChange={(e) => setLocationForm({...locationForm, company: e.target.value})}
                            placeholder="e.g., MTN Nigeria"
                            className="text-sm"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm">Address</Label>
                          <Textarea
                            id="address"
                            value={locationForm.address}
                            onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                            placeholder="Complete address of the organization"
                            className="min-h-[60px] sm:min-h-[80px] text-sm"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="supervisor" className="text-sm">Supervisor</Label>
                            <Input
                              id="supervisor"
                              value={locationForm.supervisor}
                              onChange={(e) => setLocationForm({...locationForm, supervisor: e.target.value})}
                              placeholder="Supervisor name"
                              className="text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm">Phone</Label>
                            <Input
                              id="phone"
                              value={locationForm.phone}
                              onChange={(e) => setLocationForm({...locationForm, phone: e.target.value})}
                              placeholder="Contact number"
                              className="text-sm"
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full text-sm" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span className="hidden sm:inline">Assigning Location...</span>
                              <span className="sm:hidden">Assigning...</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Assign Location</span>
                              <span className="sm:hidden">Assign</span>
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Real-time Check-ins */}
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center text-lg">
                          <Clock className="h-5 w-5 mr-2 text-primary" />
                          Recent Check-ins
                        </CardTitle>
                        <CardDescription className="text-sm">Latest attendance records</CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadReport} className="text-xs sm:text-sm">
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Export CSV</span>
                          <span className="sm:hidden">Export</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleClearAttendance} className="text-xs sm:text-sm">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Clear All</span>
                          <span className="sm:hidden">Clear</span>
                        </Button>
                      </div>
                    </div>
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
                          <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm sm:text-base">{record.student_name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">{record.date} at {record.time}</p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <Badge variant="secondary" className="text-xs">
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
            ) : (
              /* Student Dashboard */
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Student Dashboard</h2>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Quick Check-in */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        Quick Check-in
                      </CardTitle>
                      <CardDescription className="text-sm">Mark your attendance for today</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleCheckIn} 
                        disabled={loading || hasCheckedInToday}
                        className="w-full h-12 text-sm sm:text-base"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            <span className="hidden sm:inline">Checking in...</span>
                            <span className="sm:hidden">Checking...</span>
                          </>
                        ) : hasCheckedInToday ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Already Checked In</span>
                            <span className="sm:hidden">Checked In</span>
                          </>
                        ) : (
                          <>
                            <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Check In Now</span>
                            <span className="sm:hidden">Check In</span>
                          </>
                        )}
                      </Button>
                      {hasCheckedInToday && (
                        <p className="mt-2 text-xs sm:text-sm text-green-600 text-center">
                          You checked in today at {todayCheckInTime}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* My Attendance */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Activity className="h-5 w-5 mr-2 text-primary" />
                        My Attendance
                      </CardTitle>
                      <CardDescription className="text-sm">Your attendance history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {attendanceRecords
                          .filter(record => record.user_id === user?.id)
                          .slice(0, 5)
                          .map((record) => (
                            <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="bg-green-100 p-2 rounded-full">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{record.date}</p>
                                  <p className="text-xs text-muted-foreground">{record.time}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Present
                              </Badge>
                            </div>
                          ))}
                        {attendanceRecords.filter(record => record.user_id === user?.id).length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">No attendance records yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}