import React from 'react';

export default function SettingsProfile({ user }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3">
      <div className="relative group">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-3xl shadow-inner transition-transform group-hover:scale-105 duration-200 overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={`${user?.name || 'User'}'s avatar`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          ) : null}
          <span style={user?.avatar ? { display: 'none' } : {}} className="w-full h-full flex items-center justify-center">{user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}</span>
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">{user?.name || 'User'}</h2>
        <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
      </div>
    </div>
  );
}
