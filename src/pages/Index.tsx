import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile) {
      // Redirect based on role
      if (userProfile.role === 'admin') {
        navigate('/admin');
      } else if (userProfile.role === 'student') {
        navigate('/student');
      } else {
        // Default to student dashboard for guests or unknown roles
        navigate('/student');
      }
    }
  }, [userProfile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
