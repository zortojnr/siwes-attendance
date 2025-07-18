import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  Users
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  locationName?: string;
}

interface SiwesLocation {
  id: string;
  studentName: string;
  location: string;
  assignedDate: string;
}

export default function SiwesApp() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'student-home' | 'admin-home' | 'admin-login'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const [students, setStudents] = useState<User[]>([]);
  const [siwesLocations, setSiwesLocations] = useState<SiwesLocation[]>([]);
  const [newLocation, setNewLocation] = useState({ studentName: '', location: '' });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedAttendance = localStorage.getItem('siwes-attendance');
    const savedStudents = localStorage.getItem('siwes-students');
    const savedLocations = localStorage.getItem('siwes-locations');
    
    if (savedAttendance) setAttendanceRecords(JSON.parse(savedAttendance));
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedLocations) setSiwesLocations(JSON.parse(savedLocations));
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('siwes-attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('siwes-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('siwes-locations', JSON.stringify(siwesLocations));
  }, [siwesLocations]);

  const handleLogin = (e: React.FormEvent) => {
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
    
    // Simulate student login
    setTimeout(() => {
      const user: User = {
        id: Date.now().toString(),
        name: 'Student User',
        email: loginForm.email,
        role: 'student'
      };
      
      setCurrentUser(user);
      setCurrentView('student-home');
      setIsLoading(false);
      
      toast({
        title: "Login Successful",
        description: `Welcome ${user.name}!`,
        variant: "default"
      });
      
      setLoginForm({ email: '', password: '' });
    }, 1000);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginForm.email || !adminLoginForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate admin login
    setTimeout(() => {
      const user: User = {
        id: Date.now().toString(),
        name: 'Admin User',
        email: adminLoginForm.email,
        role: 'admin'
      };
      
      setCurrentUser(user);
      setCurrentView('admin-home');
      setIsLoading(false);
      
      toast({
        title: "Admin Login Successful",
        description: `Welcome ${user.name}!`,
        variant: "default"
      });
      
      setAdminLoginForm({ email: '', password: '' });
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
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
    
    setTimeout(() => {
      const newUser: User = {
        id: Date.now().toString(),
        name: `${registerForm.firstName} ${registerForm.lastName}`,
        email: registerForm.email,
        role: 'student'
      };
      
      setStudents(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      setCurrentView('student-home');
      setIsLoading(false);
      
      toast({
        title: "Registration Successful",
        description: `Welcome ${newUser.name}!`,
        variant: "default"
      });
      
      setRegisterForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    }, 1000);
  };

  const handleGoogleSignUp = () => {
    toast({
      title: "Google Sign-up",
      description: "Google authentication will be implemented in the backend",
      variant: "default"
    });
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          studentId: currentUser!.id,
          studentName: currentUser!.name,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          latitude,
          longitude,
          locationName: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        };
        
        setAttendanceRecords(prev => [newRecord, ...prev]);
        setIsLoading(false);
        
        toast({
          title: "Check-in Successful",
          description: `Location recorded: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          variant: "default"
        });
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

  const handleDownloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Student Name,Date,Time,Latitude,Longitude\n" +
      attendanceRecords.map(record => 
        `${record.studentName},${record.date},${record.time},${record.latitude},${record.longitude}`
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

  const handleAssignLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.studentName || !newLocation.location) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const assignment: SiwesLocation = {
      id: Date.now().toString(),
      studentName: newLocation.studentName,
      location: newLocation.location,
      assignedDate: new Date().toLocaleDateString()
    };

    setSiwesLocations(prev => [assignment, ...prev]);
    setNewLocation({ studentName: '', location: '' });
    
    toast({
      title: "Location Assigned",
      description: `${newLocation.location} assigned to ${newLocation.studentName}`,
      variant: "default"
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
      variant: "default"
    });
  };

  const studentAttendance = attendanceRecords.filter(record => record.studentId === currentUser?.id);

  // Render Admin Login Page
  if (currentView === 'admin-login') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Admin Login</CardTitle>
            <CardDescription>Sign in to admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Admin Email"
                  value={adminLoginForm.email}
                  onChange={(e) => setAdminLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Admin Password"
                  value={adminLoginForm.password}
                  onChange={(e) => setAdminLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Admin Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Not an admin?{' '}
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-primary hover:underline font-medium"
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">SIWES Attendance</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentView('register')}
                  className="text-primary hover:underline font-medium"
                >
                  Register here
                </button>
              </p>
              <p className="text-sm text-muted-foreground">
                Are you an admin?{' '}
                <button
                  onClick={() => setCurrentView('admin-login')}
                  className="text-primary hover:underline font-medium"
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Create Account</CardTitle>
            <CardDescription>Register for SIWES Attendance</CardDescription>
          </CardHeader>
          <CardContent>
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
                className="w-full" 
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
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-primary hover:underline font-medium"
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
      <div className="min-h-screen bg-background">
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
                  <p className="font-medium">{currentUser?.name}</p>
                  <p className="text-sm opacity-90">{currentUser?.email}</p>
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
                    className="w-full"
                    onClick={handleCheckIn}
                    disabled={isLoading}
                  >
                    {isLoading ? "Getting Location..." : "Check In Now"}
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
                  <p className="font-medium">{currentUser?.name}</p>
                  <p className="text-sm opacity-90">{currentUser?.email}</p>
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
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No students registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary-foreground border-2 border-primary p-2 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Student</Badge>
                      </div>
                    ))}
                  </div>
                )}
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
                            <p className="font-medium">{record.studentName}</p>
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
                            <p className="font-medium">{assignment.studentName}</p>
                            <p className="text-sm text-muted-foreground">{assignment.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{assignment.assignedDate}</Badge>
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