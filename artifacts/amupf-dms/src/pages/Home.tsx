import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldAlert, Users, CheckCircle2, ChevronRight, PhoneCall, Megaphone } from "lucide-react";
import { useGetPublicStats, useListAnnouncements } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats } = useGetPublicStats();
  const { data: announcements } = useListAnnouncements({ query: { enabled: true } });
  
  const publicAnnouncements = announcements?.filter(a => a.type === "public") || [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 border-b">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl tracking-tight text-primary">AMUPF</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium">Log in</Button>
          </Link>
          <Link href="/register">
            <Button className="font-medium bg-primary text-primary-foreground">Register</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 px-6 lg:px-12 text-center bg-slate-50">
          <div className="max-w-3xl mx-auto space-y-8">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 mb-4 text-sm px-3 py-1">Official Portal</Badge>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Arbaminch University Peace Forum
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              PEACE • UNITY • PROGRESS
            </p>
            <p className="text-slate-600 max-w-2xl mx-auto">
              A professional campus safety and incident management platform dedicated to maintaining a secure and harmonious environment for all students and staff.
            </p>
            <div className="flex justify-center space-x-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-white">
                  Join as Student
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-300">
                  Access Portal
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6 lg:px-12 bg-white border-y">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center p-6 text-center space-y-2 rounded-xl bg-slate-50">
                <Users className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-4xl font-bold text-slate-900">{stats?.total_members || "0"}</h3>
                <p className="text-slate-600 font-medium">Total Members</p>
              </div>
              <div className="flex flex-col items-center p-6 text-center space-y-2 rounded-xl bg-slate-50">
                <CheckCircle2 className="h-10 w-10 text-green-600 mb-2" />
                <h3 className="text-4xl font-bold text-slate-900">{stats?.resolved_cases || "0"}</h3>
                <p className="text-slate-600 font-medium">Resolved Cases</p>
              </div>
              <div className="flex flex-col items-center p-6 text-center space-y-2 rounded-xl bg-slate-50">
                <ShieldAlert className="h-10 w-10 text-blue-600 mb-2" />
                <h3 className="text-4xl font-bold text-slate-900">{stats?.active_members || "0"}</h3>
                <p className="text-slate-600 font-medium">Active Peacekeepers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements & Emergency Contacts */}
        <section className="py-20 px-6 lg:px-12 bg-slate-50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <Megaphone className="mr-3 h-6 w-6 text-primary" />
                Latest Announcements
              </h2>
              {publicAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {publicAnnouncements.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-slate-900">{announcement.title}</h3>
                        <span className="text-sm text-slate-500">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-2">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                  No public announcements at this time.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <PhoneCall className="mr-3 h-6 w-6 text-destructive" />
                Emergency Contacts
              </h2>
              <div className="bg-white rounded-xl border border-destructive/20 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <p className="text-sm text-slate-500 font-medium">Campus Security Main</p>
                  <a href="tel:+251123456789" className="text-lg font-bold text-primary flex items-center mt-1">
                    +251 12 345 6789 <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
                  </a>
                </div>
                <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <p className="text-sm text-slate-500 font-medium">Student Clinic</p>
                  <a href="tel:+251123456790" className="text-lg font-bold text-primary flex items-center mt-1">
                    +251 12 345 6790 <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
                  </a>
                </div>
                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <p className="text-sm text-slate-500 font-medium">AMUPF President Office</p>
                  <a href="tel:+251123456791" className="text-lg font-bold text-primary flex items-center mt-1">
                    +251 12 345 6791 <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
                  </a>
                </div>
              </div>
            </div>
            
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <ShieldAlert className="h-6 w-6 text-slate-400" />
            <span className="font-bold text-lg text-white">AMUPF</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Arbaminch University Peace Forum. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Ensure Badge is imported correctly or extracted if not
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${className}`}>{children}</span>;
}
