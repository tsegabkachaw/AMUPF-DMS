import { ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";

export default function PendingApproval() {
  const { user, setToken } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setToken(null);
      setLocation("/login");
    } catch (e) {
      setToken(null);
      setLocation("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center space-y-6 bg-white p-10 rounded-xl shadow-sm border border-slate-200">
        <div className="mx-auto h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Account Under Review
        </h2>
        <p className="text-slate-600">
          Hello {user?.full_name}, your account is currently pending KYC approval from the administration. You will be able to access the dashboard once your student identity is verified.
        </p>
        
        {user?.rejection_reason && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive mt-4 text-left">
            <strong>Update:</strong> {user.rejection_reason}
          </div>
        )}

        <div className="pt-6 border-t border-slate-100">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" /> Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
