import { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import SiwesApp from '@/components/SiwesApp';
import AnalyticsPage from './admin/AnalyticsPage';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'admin') {
      if (userProfile.role === 'student') {
        navigate('/student');
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

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<SiwesApp />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/students" element={<SiwesApp />} />
              <Route path="/locations" element={<SiwesApp />} />
              <Route path="/settings" element={<SiwesApp />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
