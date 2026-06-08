import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Home, AlertTriangle } from 'lucide-react';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-muted-foreground/30">404</h1>
                        <div className="h-0.5 w-16 bg-border mx-auto"></div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-foreground">
                            Page Not Found
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The page <span className="font-medium text-foreground/80">"{pageName}"</span> could not be found in this application.
                        </p>
                    </div>

                    {isAuthenticated && user?.role === 'admin' && (
                        <div className="mt-8 p-4 bg-secondary/50 rounded-xl border border-border/60">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                    <AlertTriangle className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-medium text-foreground">Admin Note</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-foreground bg-secondary border border-border/80 rounded-xl hover:bg-secondary/80 transition-all duration-200 active:scale-95"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}