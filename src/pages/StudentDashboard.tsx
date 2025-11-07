import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { StudentSidebar } from '@/components/StudentSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import SiwesApp from '@/components/SiwesApp';
import ProfilePage from './student/ProfilePage';
import { Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'student') {
      if (userProfile.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'student') {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<SiwesApp />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/attendance" element={<SiwesApp />} />
              <Route path="/location" element={<SiwesApp />} />
              <Route path="/reports" element={<SiwesApp />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
