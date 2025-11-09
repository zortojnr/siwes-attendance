import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MapPin, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalStudents: number;
  totalAttendance: number;
  todayAttendance: number;
  attendanceRate: number;
  locationsAssigned: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalAttendance: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    locationsAssigned: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get total students - count users with student role
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      
      const studentCount = studentRoles?.length || 0;

      // Get total attendance records
      const { data: attendanceData, count: attendanceCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact' });

      // Get today's attendance
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count: todayCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      // Get locations assigned
      const { count: locationsCount } = await supabase
        .from('siwes_locations')
        .select('*', { count: 'exact', head: true });

      // Calculate attendance rate
      const totalPossibleDays = 30;
      const rate = attendanceCount && studentCount
        ? Math.round((attendanceCount / (studentCount * totalPossibleDays)) * 100)
        : 0;

      setStats({
        totalStudents: studentCount || 0,
        totalAttendance: attendanceCount || 0,
        todayAttendance: todayCount || 0,
        attendanceRate: Math.min(rate, 100),
        locationsAssigned: locationsCount || 0,
      });

      // Get recent attendance
      if (attendanceData) {
        setRecentAttendance(attendanceData.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Overview of SIWES program statistics and trends</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAttendance}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'MMMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Overall attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locationsAssigned}</div>
            <p className="text-xs text-muted-foreground">Assigned locations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Latest attendance check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAttendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attendance records yet</p>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{record.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.location || 'Unknown Location'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.date}</p>
                    <p className="text-xs text-muted-foreground">{record.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
