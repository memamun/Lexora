import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function BugReportList({ bugReports }) {
  return (
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
  );
}
