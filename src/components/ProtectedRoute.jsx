import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LexoraLogo from '@/components/ui/LexoraLogo';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <LexoraLogo className="w-10 h-14 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80 animate-pulse">
        Verifying session...
      </div>
    </div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}