import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/lib/NavigationContext';

export default function PageHeader({ title, subtitle, backTo, showHamburger, action }) {
  const navigate = useNavigate();
  const { toggleMobile } = useNavigation();

  return (
    <div className="flex items-center gap-3 mb-6">
      {backTo ? (
        backTo === -1 ? (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link 
            to={backTo} 
            className="p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )
      ) : showHamburger ? (
        <button 
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0"
          aria-label="Open Navigation Menu"
        >
          {/* Custom staggered hamburger icon */}
          <div className="w-5 h-5 flex flex-col items-start justify-center gap-[4px]">
            <span className="w-5 h-0.5 bg-current rounded-full" />
            <span className="w-3.5 h-0.5 bg-current rounded-full" />
            <span className="w-5 h-0.5 bg-current rounded-full" />
          </div>
        </button>
      ) : null}
      
      {(title || subtitle) && (
        <div className="flex-1">
          {title && <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>}
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}
      
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
