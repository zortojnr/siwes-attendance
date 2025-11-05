import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SiwesApp from '@/components/SiwesApp';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'admin') {
      // Redirect non-admin users to their appropriate dashboard
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

  return <SiwesApp />;
}
