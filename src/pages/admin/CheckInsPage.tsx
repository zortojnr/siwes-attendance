import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, Activity, Download, Calendar } from 'lucide-react';

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

export default function CheckInsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadRecords();

    // Set up real-time subscription
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records'
        },
        (payload) => {
          console.log('New check-in:', payload);
          setRecords(prev => [payload.new as AttendanceRecord, ...prev]);
          
          // Update today's count if it's today's record
          const today = format(new Date(), 'yyyy-MM-dd');
          if ((payload.new as AttendanceRecord).date === today) {
            setTodayCount(prev => prev + 1);
          }

          toast({
            title: "New Check-in",
            description: `${(payload.new as AttendanceRecord).student_name} just checked in!`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setRecords(data || []);

      // Calculate today's count
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRecords = (data || []).filter(r => r.date === today);
      setTodayCount(todayRecords.length);
    } catch (error: any) {
      console.error('Error loading records:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (records.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records to export.",
      });
      return;
    }

    try {
      const headers = ['Student Name', 'Student ID', 'Date', 'Time', 'Location'];
      const csvContent = [
        headers.join(','),
        ...records.map(record => [
          `"${record.student_name}"`,
          `"${record.student_id}"`,
          record.date,
          record.time,
          `"${record.location || 'Unknown'}"`
        ].join(','))
      ].join('\n');

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
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to download the report.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Check-ins</h1>
          <p className="text-muted-foreground">
            Monitor student attendance in real-time
          </p>
        </div>
        <Button onClick={handleDownloadReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">
              All-time attendance records
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
          <CardDescription>
            Latest student attendance records (updates automatically)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No check-in records yet.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const isToday = record.date === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.student_name}
                        </TableCell>
                        <TableCell>{record.student_id}</TableCell>
                        <TableCell>
                          {isToday ? (
                            <Badge variant="default">Today</Badge>
                          ) : (
                            format(new Date(record.date), 'MMM dd, yyyy')
                          )}
                        </TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.location || 'Unknown'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
