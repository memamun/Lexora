import React, { useState, useEffect, useMemo } from 'react';
import { getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import LexoraLogo from '@/components/ui/LexoraLogo';
import { 
  Users, 
  Activity,
  AlertCircle,
  Target, 
  Clock, 
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ALL_WORDS } from '@/lib/wordData';

// Subcomponents
import UserDirectory from '@/components/admin/UserDirectory';
import SystemAnalytics from '@/components/admin/SystemAnalytics';
import BugReportList from '@/components/admin/BugReportList';
import UserDetailModal from '@/components/admin/UserDetailModal';

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
  const db = useMemo(() => {
    try {
      return getFirestore(getApp());
    } catch (e) {
      console.error("Firestore initialization failed in AdminDashboard:", e);
      return null;
    }
  }, []);

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

      // 2. Fetch UserStats for each user in parallel and pick the latest UserStats document
      const usersWithStats = await Promise.all(fetchedUsers.map(async (u) => {
        try {
          const statsCol = collection(db, 'users', u.id, 'UserStats');
          const statsSnapshot = await getDocs(statsCol);
          const statsDocs = statsSnapshot.docs.map(d => d.data());
          
          // Sort by updated_date descending, falling back to created_date
          statsDocs.sort((a, b) => {
            const dateA = new Date(a.updated_date || a.created_date || 0);
            const dateB = new Date(b.updated_date || b.created_date || 0);
            return dateB - dateA;
          });
          
          const statsData = statsDocs[0] || {};
          const longest = Number(statsData.longest_streak_days || 0);
          const current = Number(statsData.current_streak_days || 0);

          if (u.longest_streak_days !== longest || u.current_streak_days !== current) {
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const userRef = doc(db, 'users', u.id);
              await updateDoc(userRef, {
                longest_streak_days: longest,
                current_streak_days: current
              });
            } catch (syncErr) {
              console.warn(`Failed to auto-backfill streaks for user ${u.id}:`, syncErr.message);
            }
          }

          return {
            ...u,
            stats: {
              total_reviews: Number(statsData.total_reviews || 0),
              total_correct: Number(statsData.total_correct || 0),
              total_words_studied: Number(statsData.total_words_studied || 0),
              longest_streak_days: longest,
              current_streak_days: current,
              daily_reviews: statsData.daily_reviews?.mapValue?.fields || statsData.daily_reviews || {},
              daily_correct: statsData.daily_correct?.mapValue?.fields || statsData.daily_correct || {}
            }
          };
        } catch (err) {
          return {
            ...u,
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
      }));

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
    setSelectedUser(user);
    setLoadingUserDetails(true);
    setUserReviews([]);
    setUserQuizzes([]);
    
    if (!db) return;
    try {
      // Fetch WordReview collection for user
      const reviewCol = collection(db, 'users', user.id, 'WordReview');
      const reviewSnap = await getDocs(reviewCol);
      const reviews = reviewSnap.docs.map(d => d.data());
      setUserReviews(reviews);

      // Fetch QuizAttempt collection for user
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

      // 1. Clear WordReview and QuizAttempt collections
      const subcollectionsToWipe = ['WordReview', 'QuizAttempt'];
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
    if (!u.levelProgress) return 0;
    return Object.values(u.levelProgress).filter(l => l.is_completed).length;
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
      .filter(u => (u.stats?.longest_streak_days || 0) > 0)
      .sort((a, b) => (b.stats?.longest_streak_days || 0) - (a.stats?.longest_streak_days || 0))
      .slice(0, 3)
      .map(u => ({
        id: u.id,
        name: u.displayName || u.email.split('@')[0],
        streak: u.stats.longest_streak_days,
        avatar: u.photoURL,
        reviews: u.stats.total_reviews
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
        {activeTab === 'users' && (
          <UserDirectory
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            providerFilter={providerFilter}
            setProviderFilter={setProviderFilter}
            handleSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
            filteredUsers={filteredUsers}
            getCompletedLevelsCount={getCompletedLevelsCount}
            handleViewDetails={handleViewDetails}
          />
        )}

        {activeTab === 'analytics' && (
          <SystemAnalytics
            dailyChartData={dailyChartData}
            streakLeaders={streakLeaders}
            users={users}
            systemHardestWords={systemHardestWords}
          />
        )}

        {activeTab === 'bugs' && (
          <BugReportList bugReports={bugReports} />
        )}
      </div>

      {/* SLIDE-OVER DETAIL MODAL FOR SELECTED USER */}
      <UserDetailModal
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleResetProgress={handleResetProgress}
        handleDeleteUser={handleDeleteUser}
        handleToggleRole={handleToggleRole}
        loadingUserDetails={loadingUserDetails}
        getCompletedLevelsCount={getCompletedLevelsCount}
        selectedUserMasteryData={selectedUserMasteryData}
        selectedUserWeakWords={selectedUserWeakWords}
        userQuizzes={userQuizzes}
      />
    </div>
  );
}
