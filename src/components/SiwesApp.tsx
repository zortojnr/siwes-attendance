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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  student_id: string;
  date: string;
  time: string;
  location?: string | null;
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
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Popular locations in Nigeria
  const popularLocations = [
    'Victoria Island, Lagos State',
    'Ikeja, Lagos State', 
    'Lagos Island, Lagos State',
    'Abuja Central Business District, FCT',
    'Wuse 2, Abuja, FCT',
    'Garki, Abuja, FCT',
    'Port Harcourt, Rivers State',
    'Kano, Kano State',
    'Ibadan, Oyo State',
    'Benin City, Edo State',
    'Kaduna, Kaduna State',
    'Jos, Plateau State',
    'Calabar, Cross River State',
    'Warri, Delta State',
    'Enugu, Enugu State',
    'Aba, Abia State',
    'Maiduguri, Borno State',
    'Ilorin, Kwara State',
    'Akure, Ondo State',
    'Uyo, Akwa Ibom State'
  ];

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
    if (user) {
      loadAttendanceRecords();
      loadStudents();
      checkTodayAttendance(user.id);
    }
  }, [user]);

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
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

    if (hasCheckedInToday) {
      toast({
        title: "Already Checked In",
        description: `You already checked in today at ${todayCheckInTime}`,
        variant: "default"
      });
      return;
    }

    setLoading(true);
    
    // Add timeout for geolocation
    const timeoutId = setTimeout(() => {
      toast({
        title: "Location Timeout",
        description: "Location request timed out. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        try {
          const { latitude, longitude } = position.coords;
          const now = new Date();
          const date = format(now, 'yyyy-MM-dd');
          const time = format(now, 'HH:mm:ss');

          const { data, error } = await supabase
            .from('attendance_records')
            .insert({
              user_id: user?.id,
              student_name: `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim(),
              student_id: userProfile?.student_id || '',
              date,
              time,
              location: 'On-site'
            })
            .select()
            .single();

          if (error) throw error;

          // Update local state
          setHasCheckedInToday(true);
          setTodayCheckInTime(time);
          
          // Refresh attendance records
          await loadAttendanceRecords();

          toast({
            title: "Check-in Successful!",
            description: `Attendance recorded for ${date} at ${time}`,
            variant: "default"
          });
        } catch (error: any) {
          console.error('Check-in error:', error);
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
        clearTimeout(timeoutId);
        setLoading(false);
        
        let errorMessage = "Failed to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleLocationAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feature Coming Soon",
      description: "Location assignment will be available soon.",
      variant: "default"
    });
  };

  const handleDownloadReport = async () => {
    if (attendanceRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export.",
        variant: "default"
      });
      return;
    }

    try {
      // Create CSV content
      const headers = ['Student Name', 'Student ID', 'Date', 'Time', 'Location'];
      const csvContent = [
        headers.join(','),
        ...attendanceRecords.map(record => [
          `"${record.student_name}"`,
          `"${record.student_id}"`,
          record.date,
          record.time,
          `"${record.location || 'Unknown'}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Attendance report downloaded successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to download the report.",
        variant: "destructive"
      });
    }
  };

  const handleClearAttendance = async () => {
    if (attendanceRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to clear.",
        variant: "default"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) throw error;
      
      // Update local state
      setAttendanceRecords([]);
      setTodayAttendance(0);
      setAttendanceRate(0);
      setHasCheckedInToday(false);
      setTodayCheckInTime('');
      
      toast({
        title: "Records Cleared",
        description: "All attendance records have been cleared successfully.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Clear attendance error:', error);
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear attendance records.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = (location: string) => {
    setLocationForm(prev => ({ ...prev, address: location }));
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white p-2 shadow-lg">
              <img 
                src="/lovable-uploads/bdcd74c6-b4ce-411a-9a19-1281d6a1718e.png" 
                alt="Federal University Dutse Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-primary">FUD SIWES Portal</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Federal University Dutse</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm sm:text-base font-medium">
                {userProfile.first_name} {userProfile.last_name}
              </span>
              <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {userProfile.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <GraduationCap className="h-3 w-3 mr-1" />}
                {userProfile.role}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              disabled={loading}
              className="text-xs sm:text-sm"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </>
              )}
            </Button>
          </div>
        </header>

        <main>
          {userProfile.role === 'admin' ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{todayAttendance}</div>
                    <p className="text-xs text-muted-foreground">students checked in</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-muted-foreground">registered students</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{attendanceRate}%</div>
                    <p className="text-xs text-muted-foreground">overall attendance</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Student Management */}
                <div className="space-y-4 sm:space-y-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <UserPlus className="h-5 w-5 mr-2 text-primary" />
                        Student Management
                      </CardTitle>
                      <CardDescription className="text-sm">Add and manage SIWES students</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleStudentSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                          <Input
                            id="fullName"
                            type="text"
                            value={studentForm.full_name}
                            onChange={(e) => setStudentForm({...studentForm, full_name: e.target.value})}
                            placeholder="Enter student's full name"
                            className="h-10 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="matricNumber" className="text-sm">Matric Number</Label>
                          <Input
                            id="matricNumber"
                            type="text"
                            value={studentForm.matric_number}
                            onChange={(e) => setStudentForm({...studentForm, matric_number: e.target.value})}
                            placeholder="e.g., FUD/CSC/20/1234"
                            className="h-10 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="department" className="text-sm">Department</Label>
                            <Select value={studentForm.department} onValueChange={(value) => setStudentForm({...studentForm, department: value})}>
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="Physics">Physics</SelectItem>
                                <SelectItem value="Chemistry">Chemistry</SelectItem>
                                <SelectItem value="Biology">Biology</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="level" className="text-sm">Level</Label>
                            <Select value={studentForm.level} onValueChange={(value) => setStudentForm({...studentForm, level: value})}>
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="200">200 Level</SelectItem>
                                <SelectItem value="300">300 Level</SelectItem>
                                <SelectItem value="400">400 Level</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-10 text-sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Student
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
                      <CardDescription className="text-sm">Assign students to SIWES locations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLocationAssignment} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="studentSelect" className="text-sm">Select Student</Label>
                          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue placeholder="Choose a student" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map(student => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.full_name} - {student.matric_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-sm">Company/Organization</Label>
                          <Input
                            id="company"
                            type="text"
                            value={locationForm.company}
                            onChange={(e) => setLocationForm({...locationForm, company: e.target.value})}
                            placeholder="Enter company name"
                            className="h-10 text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm">Address</Label>
                          <Textarea
                            id="address"
                            value={locationForm.address}
                            onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                            placeholder="Enter complete address"
                            className="text-sm"
                            rows={3}
                          />
                        </div>

                        {/* Popular Locations */}
                        <div className="space-y-2">
                          <Label className="text-sm">Popular Locations in Nigeria</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {popularLocations.map((location, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLocationClick(location)}
                                className="text-xs justify-start h-auto py-1 px-2"
                              >
                                {location}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="supervisor" className="text-sm">Supervisor</Label>
                            <Input
                              id="supervisor"
                              type="text"
                              value={locationForm.supervisor}
                              onChange={(e) => setLocationForm({...locationForm, supervisor: e.target.value})}
                              placeholder="Supervisor name"
                              className="h-10 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm">Phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={locationForm.phone}
                              onChange={(e) => setLocationForm({...locationForm, phone: e.target.value})}
                              placeholder="Contact number"
                              className="h-10 text-sm"
                            />
                          </div>
                        </div>
                        
                        <Button type="submit" className="w-full h-10 text-sm">
                          <MapPin className="mr-2 h-4 w-4" />
                          Assign Location
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
                                {record.location || 'No location'}
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
    </div>
  );
}