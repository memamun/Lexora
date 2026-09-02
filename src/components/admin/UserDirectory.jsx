import React from 'react';
import { Search, Filter, ArrowUpDown, Shield, User } from 'lucide-react';

export default function UserDirectory({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  providerFilter,
  setProviderFilter,
  handleSort,
  filteredUsers,
  getCompletedLevelsCount,
  handleViewDetails,
}) {
  return (
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
  );
}
