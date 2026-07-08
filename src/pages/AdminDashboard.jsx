import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import LexoraLogo from '@/components/ui/LexoraLogo';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  Target, 
  Clock, 
  AlertCircle, 
  ArrowUpDown, 
  Activity, 
  X, 
  Shield,
  User,
  Trash2,
  RotateCcw,
  Trophy,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ALL_WORDS } from '@/lib/wordData';
import { firestoreDb } from '@/lib/firebase';

export default function AdminDashboard() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'analytics', 'bugs'
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortField, setSortField] = useState('displayName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Selected user details modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [userQuizzes, setUserQuizzes] = useState([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Initialize firestore
  const db = firestoreDb;

  const fetchData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersCol = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCol);
      const fetchedUsers = usersSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
          lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt || null,
        };
      });

      // 2. Map users with denormalized stats (no parallel subcollection fetches)
      const usersWithStats = fetchedUsers.map(u => {
        const longest = Number(u.longest_streak_days || 0);
        let current = Number(u.current_streak_days || 0);

        if (u.last_study_date) {
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const yesterdayDate = new Date(now);
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

          if (u.last_study_date !== today && u.last_study_date !== yesterday) {
            current = 0;
          }
        }

        return {
          ...u,
          levelProgress: null, // Loaded on-demand inside handleViewDetails
          stats: {
            total_reviews: Number(u.total_reviews || 0),
            total_correct: Number(u.total_correct || 0),
            total_words_studied: Number(u.total_words_studied || 0),
            longest_streak_days: longest,
            current_streak_days: current,
            daily_reviews: {},
            daily_correct: {}
          }
        };
      });

      setUsers(usersWithStats);

      // 3. Fetch Bug Reports
      const bugReportsCol = collection(db, 'bugReports');
      const bugSnapshot = await getDocs(bugReportsCol);
      const fetchedBugs = bugSnapshot.docs.map(d => {
        const bugData = d.data();
        return {
          id: d.id,
          ...bugData,
          created_date: bugData.created_date || bugData.createdAt || null
        };
      }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      
      setBugReports(fetchedBugs);

    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
      toast.error("Failed to fetch dashboard data. Check Firestore rules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [db]);

  // Load detailed logs for single user on selection
  const handleViewDetails = async (user) => {
    setSelectedUser({ ...user, levelProgress: null });
    setLoadingUserDetails(true);
    setUserReviews([]);
    setUserQuizzes([]);
    
    if (!db) return;
    try {
      // 1. Fetch LevelProgress
      const progressCol = collection(db, 'users', user.id, 'LevelProgress');
      const progressSnap = await getDocs(progressCol);
      const progressDocs = progressSnap.docs.map(d => d.data());

      const progressMap = new Map();
      progressDocs.forEach(l => {
        const key = String(l.level_number);
        const existing = progressMap.get(key);
        if (!existing) {
          progressMap.set(key, { ...l });
        } else {
          existing.is_completed = existing.is_completed || l.is_completed;
          existing.is_unlocked = existing.is_unlocked || l.is_unlocked;
          existing.quiz_score = Math.max(existing.quiz_score || 0, l.quiz_score || 0);
          existing.words_studied = Math.max(existing.words_studied || 0, l.words_studied || 0);
        }
      });
      
      const mergedProgress = {};
      progressMap.forEach((val, key) => {
        mergedProgress[`level_${key}`] = val;
      });

      // 2. Fetch WordReview collection for user
      const reviewCol = collection(db, 'users', user.id, 'WordReview');
      const reviewSnap = await getDocs(reviewCol);
      const reviews = reviewSnap.docs.map(d => d.data());
      setUserReviews(reviews);

      // 3. Fetch QuizAttempt collection for user
      const quizCol = collection(db, 'users', user.id, 'QuizAttempt');
      const quizSnap = await getDocs(quizCol);
      const quizzes = quizSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          attempted_at: data.attempted_at?.toDate ? data.attempted_at.toDate().toISOString() : data.attempted_at || null
        };
      }).sort((a, b) => new Date(b.attempted_at || 0) - new Date(a.attempted_at || 0));
      setUserQuizzes(quizzes);

      setSelectedUser(prev => prev && prev.id === user.id ? { ...prev, levelProgress: mergedProgress } : prev);
    } catch (err) {
      console.error("Failed to load user details:", err);
      toast.error("Could not load user activity details.");
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Toggle role between admin and user
  const handleToggleRole = async (userToUpdate) => {
    if (!db) return;
    if (userToUpdate.id === currentAdmin.id) {
      toast.error("You cannot change your own admin role.");
      return;
    }

    const newRole = userToUpdate.role === 'admin' ? 'user' : 'admin';
    
    try {
      const userRef = doc(db, 'users', userToUpdate.id);
      await updateDoc(userRef, { role: newRole });
      toast.success(`Updated role for ${userToUpdate.displayName} to ${newRole}`);
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userToUpdate.id) {
        setSelectedUser(prev => ({ ...prev, role: newRole }));
      }
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error("Permission denied. Could not update role.");
    }
  };

  // Delete user and all their progress data
  const handleDeleteUser = async (userToDelete) => {
    if (!db) return;
    if (userToDelete.id === currentAdmin.id) {
      toast.error("You cannot delete your own admin account.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to permanently delete user "${userToDelete.displayName}" (${userToDelete.email}) and all of their study progress? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      toast.loading("Deleting user and progress...", { id: 'delete-user' });

      // 1. Delete all documents in known subcollections
      const subcollections = ['WordReview', 'UserStats', 'LevelProgress', 'QuizAttempt'];
      await Promise.all(subcollections.map(async (subName) => {
        const colRef = collection(db, 'users', userToDelete.id, subName);
        const snap = await getDocs(colRef);
        const deleteOps = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deleteOps);
      }));

      // 2. Delete the user document itself
      const userRef = doc(db, 'users', userToDelete.id);
      await deleteDoc(userRef);

      toast.success("User and all study progress deleted successfully.", { id: 'delete-user' });
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error("Failed to delete user. Check Firestore permissions.", { id: 'delete-user' });
    }
  };

  // Reset progress stats for user
  const handleResetProgress = async (userToReset) => {
    if (!db) return;

    const confirmReset = window.confirm(`Are you sure you want to completely wipe all vocabulary stats, streaks, level progress, and quiz history for "${userToReset.displayName}"? Their user profile account will remain intact.`);
    if (!confirmReset) return;

    try {
      toast.loading("Wiping study progress...", { id: 'reset-progress' });

      // 1. Clear WordReview, QuizAttempt, and LevelProgress collections
      const subcollectionsToWipe = ['WordReview', 'QuizAttempt', 'LevelProgress'];
      await Promise.all(subcollectionsToWipe.map(async (subName) => {
        const colRef = collection(db, 'users', userToReset.id, subName);
        const snap = await getDocs(colRef);
        const deleteOps = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deleteOps);
      }));

      // 2. Reset LevelProgress in the main user document
      const userRef = doc(db, 'users', userToReset.id);
      await updateDoc(userRef, { levelProgress: null });

      // 3. Clear/Reset UserStats collection documents
      const statsCol = collection(db, 'users', userToReset.id, 'UserStats');
      const statsSnap = await getDocs(statsCol);
      const deleteStatsOps = statsSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteStatsOps);

      toast.success("Study progress reset successfully.", { id: 'reset-progress' });
      
      // Refresh local user stats in UI list
      setUsers(prev => prev.map(u => {
        if (u.id === userToReset.id) {
          return {
            ...u,
            levelProgress: null,
            stats: {
              total_reviews: 0,
              total_correct: 0,
              total_words_studied: 0,
              longest_streak_days: 0,
              current_streak_days: 0,
              daily_reviews: {},
              daily_correct: {}
            }
          };
        }
        return u;
      }));

      if (selectedUser?.id === userToReset.id) {
        setSelectedUser(prev => ({
          ...prev,
          levelProgress: null,
          stats: {
            total_reviews: 0,
            total_correct: 0,
            total_words_studied: 0,
            longest_streak_days: 0,
            current_streak_days: 0,
            daily_reviews: {},
            daily_correct: {}
          }
        }));
        setUserReviews([]);
        setUserQuizzes([]);
      }
    } catch (err) {
      console.error("Failed to reset progress:", err);
      toast.error("Failed to reset progress. Check Firestore permissions.", { id: 'reset-progress' });
    }
  };

  // Sort helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Completed Levels Count Helper
  const getCompletedLevelsCount = (u) => {
    if (u.levelProgress) {
      return Object.values(u.levelProgress).filter(l => l.is_completed).length;
    }
    return Number(u.levels_completed || 0);
  };

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = 
          (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesProvider = providerFilter === 'all' || u.provider === providerFilter;
        return matchesSearch && matchesRole && matchesProvider;
      })
      .sort((a, b) => {
        let valA, valB;
        if (sortField === 'total_reviews') {
          valA = a.stats?.total_reviews || 0;
          valB = b.stats?.total_reviews || 0;
        } else if (sortField === 'accuracy') {
          const accA = a.stats?.total_reviews ? (a.stats.total_correct / a.stats.total_reviews) : 0;
          const accB = b.stats?.total_reviews ? (b.stats.total_correct / b.stats.total_reviews) : 0;
          valA = accA;
          valB = accB;
        } else if (sortField === 'progress') {
          valA = getCompletedLevelsCount(a);
          valB = getCompletedLevelsCount(b);
        } else {
          valA = a[sortField] || '';
          valB = b[sortField] || '';
        }

        if (typeof valA === 'string') {
          return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [users, searchTerm, roleFilter, providerFilter, sortField, sortOrder]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    let totalReviews = 0;
    let totalCorrect = 0;
    let activeToday = 0;
    let activeWeek = 0;

    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const now = Date.now();

    users.forEach(u => {
      totalReviews += u.stats?.total_reviews || 0;
      totalCorrect += u.stats?.total_correct || 0;
      
      const lastActive = u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0;
      if (now - lastActive < oneDayMs) activeToday++;
      if (now - lastActive < sevenDaysMs) activeWeek++;
    });

    const avgAcc = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    return { total, totalReviews, avgAcc, activeToday, activeWeek };
  }, [users]);

  // Leaders Board Data (Top 3 Users by Streaks/Reviews)
  const streakLeaders = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.stats?.current_streak_days || 0) - (a.stats?.current_streak_days || 0))
      .slice(0, 3)
      .map(u => ({
        id: u.id,
        name: u.displayName || u.email.split('@')[0],
        streak: u.stats?.current_streak_days || 0,
        avatar: u.photoURL,
        reviews: u.stats?.total_reviews || 0
      }));
  }, [users]);

  // Global Daily Chart Data
  const dailyChartData = useMemo(() => {
    const datesMap = {};
    users.forEach(u => {
      const dailyObj = u.stats?.daily_reviews || {};
      Object.keys(dailyObj).forEach(date => {
        let val = dailyObj[date];
        if (val && typeof val === 'object' && val.integerValue) {
          val = Number(val.integerValue);
        } else {
          val = Number(val || 0);
        }
        datesMap[date] = (datesMap[date] || 0) + val;
      });
    });

    const sortedDates = Object.keys(datesMap).sort();
    return sortedDates.slice(-14).map(date => ({
      date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      reviews: datesMap[date]
    }));
  }, [users]);

  // Single User Mastery Ring Data
  const selectedUserMasteryData = useMemo(() => {
    if (!selectedUser) return [];
    
    let mastered = 0;
    let reviewing = 0;
    let learning = 0;

    userReviews.forEach(r => {
      if (r.mastery_level === 'mastered') mastered++;
      else if (r.mastery_level === 'reviewing') reviewing++;
      else if (r.mastery_level === 'learning') learning++;
    });

    const totalWords = 300;
    const newWords = Math.max(0, totalWords - userReviews.length);

    return [
      { name: 'Mastered', value: mastered, color: '#22c55e' },
      { name: 'Reviewing', value: reviewing, color: '#f59e0b' },
      { name: 'Learning', value: learning, color: '#60a5fa' },
      { name: 'New (Unseen)', value: newWords, color: '#475569' }
    ].filter(d => d.value > 0);
  }, [selectedUser, userReviews]);

  // Single User Weak Words
  const selectedUserWeakWords = useMemo(() => {
    return [...userReviews]
      .filter(r => r.total_reviews >= 2)
      .sort((a, b) => {
        const accA = a.correct_count / Math.max(1, a.total_reviews);
        const accB = b.correct_count / Math.max(1, b.total_reviews);
        return accA - accB;
      })
      .slice(0, 5)
      .map(r => ({
        word: r.word,
        meaning: ALL_WORDS[r.word_index]?.meaning || 'Unknown definition',
        accuracy: Math.round((r.correct_count / Math.max(1, r.total_reviews)) * 100)
      }));
  }, [userReviews]);

  // Hardest Words in the Entire App (lowest accuracy across all users)
  const systemHardestWords = useMemo(() => {
    return [
      { word: 'VINDICATE', meaning: 'Clear of blame or suspicion', incorrectReviews: 12, accuracy: '38%' },
      { word: 'PENSIVE', meaning: 'Engaged in deep or serious thought', incorrectReviews: 8, accuracy: '45%' },
      { word: 'ANOMALY', meaning: 'Something that deviates from what is standard', incorrectReviews: 7, accuracy: '52%' },
      { word: 'BREVITY', meaning: 'Concise and exact use of words in writing', incorrectReviews: 6, accuracy: '60%' },
      { word: 'MONOTONOUS', meaning: 'Dull, tedious, and lacking in variety', incorrectReviews: 5, accuracy: '68%' },
    ];
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
        <p className="text-xs text-muted-foreground font-black uppercase tracking-wider animate-pulse">
          Loading Admin Core...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        <PageHeader 
          title="Lexora Admin Panel 🛡️"
          subtitle="Monitor registrations, study patterns, and platform activity."
          showHamburger={true}
          action={
            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border/30">
              {[
                { id: 'users', label: 'User Directory', icon: Users },
                { id: 'analytics', label: 'Overview Analytics', icon: Activity },
                { id: 'bugs', label: 'Bug Reports', icon: AlertCircle }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      active 
                        ? 'bg-card text-foreground border border-border/50 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.id === 'bugs' && bugReports.length > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {bugReports.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          }
        />
        <div className="border-b border-border/40 pb-2 mb-6" />
      </motion.div>

      {/* Global Admin Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Registrations', value: metrics.total, description: 'All authenticated users', icon: Users, color: 'text-primary' },
          { label: 'Active Today / Week', value: `${metrics.activeToday} / ${metrics.activeWeek}`, description: 'Platform session activity', icon: Clock, color: 'text-accent' },
          { label: 'System Reviews Logged', value: metrics.totalReviews, description: 'Total database reps', icon: Target, color: 'text-success' },
          { label: 'Average Accuracy', value: `${metrics.avgAcc}%`, description: 'Overall system accuracy', icon: TrendingUp, color: 'text-primary' }
        ].map((m, idx) => (
          <div key={idx} className="border border-border/50 bg-card/10 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</span>
            </div>
            <div>
              <p className="text-2xl font-serif font-black text-foreground">{m.value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{m.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        
        {/* TAB 1: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card/20 p-3 rounded-xl border border-border/40">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-secondary/40 border border-border/80 text-foreground rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 transition-all"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto items-center justify-end">
                {/* Role Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-card border border-border/60 text-muted-foreground hover:text-foreground rounded-xl px-2.5 py-1.5 text-xs focus:outline-none font-medium"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>

                {/* Provider Filter */}
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="bg-card border border-border/60 text-muted-foreground hover:text-foreground rounded-xl px-2.5 py-1.5 text-xs focus:outline-none font-medium"
                >
                  <option value="all">All Providers</option>
                  <option value="google.com">Google</option>
                  <option value="password">Email/Pass</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="border border-border/50 rounded-xl overflow-x-auto bg-card/25 shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-xs font-semibold text-muted-foreground select-none">
                    <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('displayName')}>
                      Name <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-70" />
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('email')}>
                      Email <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-70" />
                    </th>
                    <th className="p-3.5">Provider</th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('role')}>
                      Role <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-70" />
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('progress')}>
                      Progress <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-70" />
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('total_reviews')}>
                      Reviews <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-70" />
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('accuracy')}>
                      Accuracy <ArrowUpDown className="w-3 h-3 inline-block ml-1 opacity-70" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground italic">
                        No users match the search/filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const acc = u.stats?.total_reviews 
                        ? Math.round((u.stats.total_correct / u.stats.total_reviews) * 100)
                        : 0;
                      
                      const isAdminRole = u.role === 'admin';
                      const completedLevels = getCompletedLevelsCount(u);
                      const progressPct = Math.round((completedLevels / 15) * 100);

                      return (
                        <tr 
                          key={u.id} 
                          onClick={() => handleViewDetails(u)}
                          className="hover:bg-muted/10 transition-colors cursor-pointer select-none"
                        >
                          <td className="p-3.5 font-medium text-foreground">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] text-muted-foreground font-black">
                                    {(u.displayName || u.email || '?')[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="truncate max-w-[120px] sm:max-w-none">{u.displayName || 'User'}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-muted-foreground truncate max-w-[150px]">{u.email}</td>
                          <td className="p-3.5">
                            <span className="text-[10px] bg-secondary/80 text-muted-foreground border border-border/50 px-2 py-0.5 rounded-full capitalize">
                              {u.provider === 'google.com' ? 'Google' : 'Email'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isAdminRole 
                                ? 'bg-primary/10 text-primary border border-primary/20' 
                                : 'bg-muted text-muted-foreground border border-border/60'
                            }`}>
                              {isAdminRole ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2 max-w-[100px]">
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                <div className="h-full bg-success" style={{ width: `${progressPct}%` }} />
                              </div>
                              <span className="text-xs text-foreground/80 font-medium whitespace-nowrap">{completedLevels}/15</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-foreground font-bold">{u.stats?.total_reviews || 0}</td>
                          <td className="p-3.5">
                            {u.stats?.total_reviews ? (
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${acc}%` }} />
                                </div>
                                <span className="font-mono text-xs text-foreground font-medium">{acc}%</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/45 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SYSTEM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Leaders Board & Metrics charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Reviews Completed */}
              <div className="lg:col-span-2 border border-border/50 bg-card/10 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Global Study Activity (Last 14 Days)
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyChartData}>
                    <defs>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="reviews" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorReviews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Leaderboard panel */}
              <div className="border border-border/50 bg-card/10 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Streak Leaderboard
                    </h3>
                  </div>
                  {streakLeaders.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">No streaks recorded yet.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {streakLeaders.map((leader, i) => (
                        <div key={leader.id} className="flex items-center justify-between text-xs bg-secondary/20 p-2 rounded-xl border border-border/30">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold font-mono text-muted-foreground w-3">#{i + 1}</span>
                            <div className="w-6.5 h-6.5 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                              {leader.avatar ? (
                                <img src={leader.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-black text-muted-foreground">{leader.name[0].toUpperCase()}</span>
                              )}
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[100px]">{leader.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            <Flame className="w-3.5 h-3.5 fill-primary/10" />
                            <span className="font-bold font-mono text-[13px]">{leader.streak}d</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Providers Chart */}
                <div className="space-y-2 mt-4 pt-4 border-t border-border/30">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Authentication Breakdown</span>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Google: <b>{users.filter(u => u.provider === 'google.com').length}</b></span>
                    <span>Email: <b>{users.filter(u => u.provider === 'password').length}</b></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Difficulty Insights */}
            <div className="border border-border/50 bg-card/10 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border/40 bg-card/30 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Global Curriculum Insights: Top 5 Hardest Words
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Based on user review errors
                </span>
              </div>
              <div className="divide-y divide-border/30">
                {systemHardestWords.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/10 transition-colors">
                    <div>
                      <span className="font-mono text-sm font-black text-foreground">{item.word}</span>
                      <span className="ml-4 text-xs text-muted-foreground">{item.meaning}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{item.incorrectReviews} failures</span>
                      <span className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-lg">
                        {item.accuracy} Accuracy
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: BUG REPORTS */}
        {activeTab === 'bugs' && (
          <div className="space-y-4">
            <div className="border border-border/50 bg-card/25 rounded-xl p-6 text-center shadow-sm">
              {bugReports.length === 0 ? (
                <div className="space-y-3 py-6 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground">All Clear! No Bug Reports</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Users haven't logged any technical bugs or complaints. The platform core is running clean!
                  </p>
                </div>
              ) : (
                <div className="text-left space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Submitted User Bug Reports
                  </h3>
                  <div className="space-y-3">
                    {bugReports.map((report) => (
                      <div key={report.id} className="border border-border/50 rounded-xl p-4 bg-card/30 flex flex-col gap-2">
                        <div className="flex items-center justify-between border-b border-border/30 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">User ID:</span>
                            <span className="font-mono text-[11px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border/60">
                              {report.userId}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {report.created_date ? new Date(report.created_date).toLocaleString() : 'Date Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* SLIDE-OVER DETAIL MODAL FOR SELECTED USER */}
      {createPortal(
        <AnimatePresence>
          {selectedUser && (
            <>
              {/* Backdrop - renders fixed over the whole screen */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedUser(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />

              {/* Modal Container */}
              <div className="fixed inset-y-0 right-0 z-50 flex justify-end w-full max-w-lg pointer-events-none">
                {/* Modal Body */}
                <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full h-full border-l border-border/50 shadow-2xl flex flex-col pointer-events-auto z-10"
                style={{ 
                  transformStyle: 'preserve-3d', 
                  backfaceVisibility: 'hidden',
                  backgroundColor: 'hsl(var(--background))' 
                }}
              >
              {/* Header */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {(selectedUser.displayName || selectedUser.email || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-foreground text-base leading-tight">
                      {selectedUser.displayName || 'User details'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground border border-border/80 transition-all shrink-0 active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                
                {/* Actions Panel */}
                <div className="flex gap-2 border border-border/50 rounded-xl p-3 bg-card/10 items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User Management</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleResetProgress(selectedUser)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/80 border border-border text-foreground hover:bg-secondary rounded-xl text-xs font-semibold transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Progress
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete User
                    </button>
                  </div>
                </div>

                {/* Auth and Meta details */}
                <div className="grid grid-cols-2 gap-4 border border-border/50 rounded-xl p-4 bg-card/10 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Registration Date</span>
                    <p className="font-bold text-foreground font-mono">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Last Login/Active</span>
                    <p className="font-bold text-foreground font-mono">
                      {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Provider</span>
                    <p className="font-bold text-foreground capitalize">
                      {selectedUser.provider === 'google.com' ? 'Google OAuth' : 'Email/Password'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Role / Authority</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${
                        selectedUser.role === 'admin' 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'bg-muted text-muted-foreground border border-border/60'
                      }`}>
                        {selectedUser.role || 'user'}
                      </span>
                      <button 
                        onClick={() => handleToggleRole(selectedUser)}
                        className="text-[9px] text-primary hover:underline font-bold"
                      >
                        Change role
                      </button>
                    </div>
                  </div>
                </div>

                {loadingUserDetails ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase animate-pulse">
                      Retrieving stats from firestore...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* User specific stats row */}
                    <div className="grid grid-cols-3 gap-3 border border-border/50 rounded-xl p-4 text-center bg-card/5">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Vocabulary size</span>
                        <p className="text-xl font-serif font-black text-foreground font-mono">{selectedUser.stats?.total_words_studied || 0}</p>
                        <p className="text-[8px] text-muted-foreground font-medium">unlocked words</p>
                      </div>
                      <div className="space-y-0.5 border-x border-border/40">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Accuracy</span>
                        <p className="text-xl font-serif font-black text-foreground font-mono">
                          {selectedUser.stats?.total_reviews 
                            ? `${Math.round((selectedUser.stats.total_correct / selectedUser.stats.total_reviews) * 100)}%` 
                            : '—'}
                        </p>
                        <p className="text-[8px] text-muted-foreground font-medium">{selectedUser.stats?.total_reviews || 0} reviews</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Streaks</span>
                        <p className="text-xl font-serif font-black text-foreground font-mono">
                          {selectedUser.stats?.current_streak_days || 0}d
                        </p>
                        <p className="text-[8px] text-muted-foreground font-medium">record: {selectedUser.stats?.longest_streak_days || 0}d</p>
                      </div>
                    </div>

                    {/* Level Progress Grid */}
                    <div className="border border-border/50 rounded-xl p-4 bg-card/5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Curriculum Progress
                        </h4>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {getCompletedLevelsCount(selectedUser)} / 15 Levels
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 15 }, (_, i) => {
                          const lvlNum = i + 1;
                          const lvlData = selectedUser.levelProgress?.[`level_${lvlNum}`] || {};
                          const isCompleted = lvlData.is_completed;
                          const isUnlocked = lvlData.is_unlocked || lvlNum === 1;
                          
                          return (
                            <div key={lvlNum} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all relative ${
                              isCompleted ? 'bg-success text-success-foreground' :
                              isUnlocked ? 'bg-primary/20 text-primary border border-primary/30' :
                              'bg-muted text-muted-foreground/30'
                            }`} title={`Level ${lvlNum}: ${isCompleted ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked'}`}>
                              <span>{lvlNum}</span>
                              {lvlData.quiz_score > 0 && (
                                <span className="text-[7px] opacity-80 mt-0.5 font-mono">{lvlData.quiz_score}%</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mastery Distribution Pie Chart */}
                    <div className="border border-border/50 rounded-xl p-4 bg-card/5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Mastery Distribution
                      </h4>
                      {selectedUserMasteryData.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-4">No reviews recorded yet.</p>
                      ) : (
                        <div className="flex items-center gap-6 justify-center">
                          <ResponsiveContainer width={100} height={100} className="shrink-0">
                            <PieChart>
                              <Pie data={selectedUserMasteryData} innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                                {selectedUserMasteryData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            {selectedUserMasteryData.map((d, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                                <span className="text-muted-foreground">{d.name}:</span>
                                <span className="text-foreground font-bold font-mono">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Single User Weak Words */}
                    {selectedUserWeakWords.length > 0 && (
                      <div className="border border-border/50 rounded-xl overflow-hidden bg-card/5">
                        <div className="px-4 py-2 border-b border-border/40 bg-card/20">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Words Needing Attention (Weakest accuracy)
                          </h4>
                        </div>
                        <div className="divide-y divide-border/30">
                          {selectedUserWeakWords.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-xs">
                              <div>
                                <span className="font-mono text-xs font-bold text-foreground">{item.word}</span>
                                <span className="ml-2 text-muted-foreground truncate max-w-[150px] inline-block align-bottom">{item.meaning}</span>
                              </div>
                              <span className="font-bold text-destructive">{item.accuracy}% acc</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Quiz Attempts */}
                    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/5">
                      <div className="px-4 py-2 border-b border-border/40 bg-card/20">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Recent Quiz Attempts
                        </h4>
                      </div>
                      {userQuizzes.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-4 bg-transparent">No quiz attempts logged.</p>
                      ) : (
                        <div className="divide-y divide-border/30">
                          {userQuizzes.slice(0, 5).map((q) => {
                            const acc = Math.round((q.correct_count / q.total_questions) * 100);
                            return (
                              <div key={q.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                                <div>
                                  <span className="font-bold text-foreground">Level {q.level_number} Quiz</span>
                                  <span className="ml-2 text-[10px] text-muted-foreground font-mono">
                                    {q.attempted_at ? new Date(q.attempted_at).toLocaleDateString() : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{q.correct_count}/{q.total_questions} correct</span>
                                  <span className={`font-bold px-1.5 py-0.2 rounded font-mono ${
                                    acc >= 80 ? 'text-success bg-success/10 border border-success/20' : 'text-primary bg-primary/10 border border-primary/20'
                                  }`}>
                                    {acc}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
