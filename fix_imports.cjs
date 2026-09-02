const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf-8');

// The file was reset to HEAD which doesn't have our refactor! We need to redo the refactor and then cleanup correctly.
// First, redo the replace:
content = content.replace(/import\s*\{\s*AreaChart,[\s\S]*?\}\s*from\s*'recharts';\s*import\s*\{\s*motion, AnimatePresence\s*\}\s*from\s*'framer-motion';\s*import\s*\{\s*toast\s*\}\s*from\s*'sonner';\s*import\s*\{\s*ALL_WORDS\s*\}\s*from\s*'@\/lib\/wordData';\s*export default function AdminDashboard\(\) \{/,
`import { toast } from 'sonner';
import { ALL_WORDS } from '@/lib/wordData';
import UserList from '@/components/admin/UserList';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import BugReportList from '@/components/admin/BugReportList';
import UserDetailModal from '@/components/admin/UserDetailModal';

export default function AdminDashboard() {`);

// Also we need to replace the body again
const startIdx = content.indexOf('{/* Main Tab Content */}');
const endIdx = content.indexOf('</div>\n  );\n}\n');

if (startIdx > -1 && endIdx > -1) {
  content = content.slice(0, startIdx) + `{/* Main Tab Content */}
      <div className="space-y-6">

        {/* TAB 1: USER DIRECTORY */}
        {activeTab === 'users' && (
          <UserList
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            providerFilter={providerFilter}
            setProviderFilter={setProviderFilter}
            sortField={sortField}
            sortOrder={sortOrder}
            handleSort={handleSort}
            filteredUsers={filteredUsers}
            handleViewDetails={handleViewDetails}
            getCompletedLevelsCount={getCompletedLevelsCount}
          />
        )}

        {/* TAB 2: SYSTEM ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            dailyChartData={dailyChartData}
            streakLeaders={streakLeaders}
            users={users}
            systemHardestWords={systemHardestWords}
          />
        )}

        {/* TAB 3: BUG REPORTS */}
        {activeTab === 'bugs' && (
          <BugReportList bugReports={bugReports} />
        )}
      </div>

      {/* SLIDE-OVER DETAIL MODAL FOR SELECTED USER */}
      <UserDetailModal
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        loadingUserDetails={loadingUserDetails}
        selectedUserMasteryData={selectedUserMasteryData}
        selectedUserWeakWords={selectedUserWeakWords}
        userQuizzes={userQuizzes}
        handleResetProgress={handleResetProgress}
        handleDeleteUser={handleDeleteUser}
        handleToggleRole={handleToggleRole}
        getCompletedLevelsCount={getCompletedLevelsCount}
      />
    ` + content.slice(endIdx);
}

// Now safely clean up unused imports from top
content = content.replace(/import \{ createPortal \} from 'react-dom';\n/, '');

// Clean lucide
const lucideMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+'lucide-react';/);
if (lucideMatch) {
  const unusedIcons = ['Search', 'Filter', 'ArrowUpDown', 'Shield', 'User', 'Trash2', 'RotateCcw', 'Trophy', 'Flame', 'CheckCircle2'];
  const imports = lucideMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  const usedImports = imports.filter(icon => !unusedIcons.includes(icon));
  const newImport = `import { ${usedImports.join(', ')} } from 'lucide-react';`;
  content = content.replace(lucideMatch[0], newImport);
}

fs.writeFileSync('src/pages/AdminDashboard.jsx', content);
