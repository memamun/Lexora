import {
  LayoutDashboard,
  BookOpen,
  Book,
  Layers,
  Target,
  Swords,
  Keyboard,
  Zap,
  Brain,
  BarChart,
  Star
} from 'lucide-react';

export const NAV_CATEGORIES = [
  {
    category: 'Core Hub',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/levels', label: 'Synaptic Roadmap', icon: BookOpen },
      { path: '/words', label: 'Word Dictionary', icon: Book },
      { path: '/favorites', label: 'Favorites', icon: Star },
    ]
  },
  {
    category: 'Cognitive Drills',
    items: [
      { path: '/flashcards', label: 'Smart Flashcards', icon: Layers },
      { path: '/mcq', label: 'MCQ Practice', icon: Target },
      { path: '/battle', label: 'Battle Mode', icon: Swords },
      { path: '/spelling', label: 'Spelling Master', icon: Keyboard },
      { path: '/matching', label: 'Matching Drill', icon: Zap },
    ]
  },
  {
    category: 'Intelligence Lab',
    items: [
      { path: '/confusion', label: 'Confusion Lab', icon: Brain },
      { path: '/analytics', label: 'Performance Stats', icon: BarChart },
    ]
  }
];

export const isRouteActive = (currentPath, itemPath) => {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  if (itemPath === '/levels') {
    return currentPath === '/levels' || currentPath.startsWith('/study-level');
  }
  if (itemPath === '/words') {
    return currentPath === '/words' || currentPath.startsWith('/word/');
  }
  if (itemPath === '/favorites') {
    return currentPath === '/favorites';
  }
  return currentPath === itemPath;
};

const INITIALS_FALLBACK = '?';

export function getInitials(user) {
  if (!user) return INITIALS_FALLBACK;
  if (user.name && user.name !== 'User') {
    return user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  if (user.email) return user.email[0].toUpperCase();
  return INITIALS_FALLBACK;
}
