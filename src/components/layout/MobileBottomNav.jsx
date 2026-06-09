import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Brain, Book, BarChart } from 'lucide-react';
import { isRouteActive } from './navigation';

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-4 inset-x-4 max-w-lg md:mx-auto bg-card/65 backdrop-blur-xl border border-border/55 rounded-2xl z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="flex items-center justify-around px-2 h-16">
        {[
          { path: '/', label: 'Home', icon: LayoutDashboard },
          { path: '/levels', label: 'Roadmap', icon: BookOpen },
          { path: '/flashcards', label: 'Cards', icon: Brain },
          { path: '/words', label: 'Dictionary', icon: Book },
          { path: '/analytics', label: 'Stats', icon: BarChart },
        ].map((item) => {
          const active = isRouteActive(location.pathname, item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 group relative"
            >

              <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                active
                  ? 'text-primary scale-105 drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                  : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
              }`}>
                <Icon className="w-5 h-5 transition-transform duration-200 group-active:scale-90" />
              </div>
              <span className={`text-[9px] font-bold transition-colors tracking-wide ${
                active ? 'text-primary font-extrabold' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
