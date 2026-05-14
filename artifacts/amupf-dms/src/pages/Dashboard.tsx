import { useAuth } from "@/hooks/useAuth";
import { useGetDashboardStats, useListReports, useListAnnouncements, useListEvents, useListTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Users, CheckCircle2, FileText, CheckSquare, Calendar, Megaphone, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { enabled: !!user && user.role !== "student" } });
  
  // Student-specific data
  const { data: myReports } = useListReports({ 
    query: { enabled: user?.role === "student" } 
  });
  
  // Render different dashboards based on role
  if (!user) return null;

  if (user.role === "student") {
    return <StudentDashboard reports={myReports || []} />;
  }

  if (user.role === "member") {
    return <MemberDashboard stats={stats} />;
  }

  if (user.role === "executive") {
    return <ExecutiveDashboard stats={stats} />;
  }

  if (user.role === "president" || user.role === "higher_official") {
    return <PresidentDashboard stats={stats} userRole={user.role} />;
  }

  return <div>Unknown Role</div>;
}

function StudentDashboard({ reports }: { reports: any[] }) {
  const { data: announcements } = useListAnnouncements();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
        <Link href="/reports/new">
          <Button className="bg-primary hover:bg-primary/90">Submit Report</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              My Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.slice(0, 5).map(report => (
                  <div key={report.report_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-slate-500">{new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">You haven't submitted any reports yet.</p>
            )}
            <Link href="/reports">
              <Button variant="link" className="px-0 mt-4">View All Reports</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Megaphone className="mr-2 h-5 w-5 text-primary" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.slice(0, 5).map(ann => (
                  <div key={ann.id} className="p-3 bg-slate-50 rounded-lg border">
                    <p className="font-medium">{ann.title}</p>
                    <p className="text-sm text-slate-500 line-clamp-1">{ann.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No announcements.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberDashboard({ stats }: { stats: any }) {
  const { data: tasks } = useListTasks();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Member Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="My Tasks" value={stats?.total_tasks || 0} icon={CheckSquare} color="text-blue-600" />
        <StatCard title="Upcoming Events" value={stats?.upcoming_events || 0} icon={Calendar} color="text-green-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.task_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-slate-500">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</p>
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No tasks assigned to you.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExecutiveDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Executive Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={stats?.total_reports || 0} icon={FileText} color="text-primary" />
        <StatCard title="Pending" value={stats?.pending_reports || 0} icon={Clock} color="text-amber-500" />
        <StatCard title="In Progress" value={stats?.in_progress_reports || 0} icon={ShieldAlert} color="text-blue-500" />
        <StatCard title="Resolved" value={stats?.resolved_reports || 0} icon={CheckCircle2} color="text-green-600" />
      </div>
    </div>
  );
}

function PresidentDashboard({ stats, userRole }: { stats: any, userRole: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        {userRole === "president" ? "President Dashboard" : "Higher Official Dashboard"}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={stats?.total_members || 0} icon={Users} color="text-primary" />
        <StatCard title="Total Reports" value={stats?.total_reports || 0} icon={FileText} color="text-slate-700" />
        <StatCard title="Resolution Rate" value={`${stats?.resolution_rate || 0}%`} icon={CheckCircle2} color="text-green-600" />
        <StatCard title="Pending KYC" value={stats?.pending_kyc || 0} icon={Clock} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>High-level statistics</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-slate-600">Active Members</span>
                 <span className="font-bold">{stats?.active_members || 0}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-slate-600">Pending Reports</span>
                 <span className="font-bold">{stats?.pending_reports || 0}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-slate-600">In Progress Reports</span>
                 <span className="font-bold">{stats?.in_progress_reports || 0}</span>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 bg-slate-50 rounded-full ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    on_hold: "bg-orange-100 text-orange-800 border-orange-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    escalated: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <Badge className={`${statusColors[status] || "bg-slate-100 text-slate-800"} capitalize hover:${statusColors[status]}`}>
      {status.replace("_", " ")}
    </Badge>
  );
}
