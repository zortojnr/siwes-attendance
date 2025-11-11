import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Plus, Trash2 } from 'lucide-react';

interface Location {
  id: string;
  student_id: string;
  location: string;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

interface StudentProfile {
  user_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    location: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('siwes_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

      // Load students
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      const studentIds = studentRoles?.map(r => r.user_id) || [];

      if (studentIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', studentIds);

        if (profilesError) throw profilesError;
        setStudents(profiles || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load locations data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLocation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Check if student already has a location
      const { data: existing } = await supabase
        .from('siwes_locations')
        .select('*')
        .eq('student_id', formData.student_id)
        .single();

      if (existing) {
        // Update existing location
        const { error } = await supabase
          .from('siwes_locations')
          .update({
            location: formData.location,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;

        toast({
          title: "Location Updated",
          description: "SIWES location updated successfully."
        });
      } else {
        // Insert new location
        const { error } = await supabase
          .from('siwes_locations')
          .insert({
            student_id: formData.student_id,
            location: formData.location
          });

        if (error) throw error;

        toast({
          title: "Location Assigned",
          description: "SIWES location assigned successfully."
        });
      }

      setFormData({ student_id: '', location: '' });
      setOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error assigning location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign location.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('siwes_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Location Removed",
        description: "SIWES location removed successfully."
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to remove location.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.student_id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
  };

  if (loading && locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SIWES Locations</h1>
          <p className="text-muted-foreground">
            Manage and assign student placement locations
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign SIWES Location</DialogTitle>
              <DialogDescription>
                Assign or update a student's SIWES placement location
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignLocation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  placeholder="e.g., FCP/CCS/20/1234"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Victoria Island, Lagos"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Assign Location'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Locations</CardTitle>
          <CardDescription>
            All SIWES location assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No locations assigned yet.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        {location.student_id}
                      </TableCell>
                      <TableCell>{getStudentName(location.student_id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          {location.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(location.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLocation(location.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
