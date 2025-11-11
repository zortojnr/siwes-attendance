import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Activity, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayCheckIns: 0,
    totalLocations: 0,
    totalCheckIns: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total students
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id', { count: 'exact' })
        .eq('role', 'student');

      // Get today's check-ins
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayRecords } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact' })
        .eq('date', today);

      // Get total check-ins
      const { data: allRecords } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact' });

      // Get total locations
      const { data: locations } = await supabase
        .from('siwes_locations')
        .select('id', { count: 'exact' });

      setStats({
        totalStudents: studentRoles?.length || 0,
        todayCheckIns: todayRecords?.length || 0,
        totalCheckIns: allRecords?.length || 0,
        totalLocations: locations?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of SIWES management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'MMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              All attendance records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground">
              SIWES placements
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • View and manage student registrations
            </p>
            <p className="text-sm text-muted-foreground">
              • Monitor real-time attendance check-ins
            </p>
            <p className="text-sm text-muted-foreground">
              • Download attendance reports for analysis
            </p>
            <p className="text-sm text-muted-foreground">
              • Assign and manage SIWES locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Authentication</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Real-time Updates</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
