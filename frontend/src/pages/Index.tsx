import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to discover page on load
    navigate('/discover');
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 bg-gradient-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Discover...</p>
      </div>
    </div>
  );
};

export default Index;
