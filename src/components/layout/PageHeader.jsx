import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '@/lib/NavigationContext';

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {string|number} [props.backTo]
 * @param {function} [props.onBack]
 * @param {boolean} [props.showHamburger]
 * @param {React.ReactNode} [props.action]
 */
export default function PageHeader({ title, subtitle, backTo, onBack, showHamburger, action }) {
  const navigate = useNavigate();
  const { openMobile } = useNavigation();

  return (
    <div className="relative z-10 flex items-center gap-3 mb-6">
      {onBack ? (
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      ) : backTo ? (
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
          onClick={openMobile}
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
          {title && <h1 className="text-[26px] font-bold text-foreground">{title}</h1>}
          {subtitle && <p className="text-[13px] text-muted-foreground opacity-70 mt-1">{subtitle}</p>}
        </div>
      )}
      
      {action && (
        <div className="shrink-0 ml-auto">
          {action}
        </div>
      )}
    </div>
  );
}
