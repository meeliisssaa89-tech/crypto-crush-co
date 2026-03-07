import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import AuthScreen from "@/components/screens/AuthScreen";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  return <AppShell />;
};

export default Index;
