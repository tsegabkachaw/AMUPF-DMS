import { useListAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

export default function Announcements() {
  const { data: announcements, isLoading } = useListAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-500">Loading announcements...</div>
      ) : announcements && announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{announcement.title}</CardTitle>
                  <Badge variant="secondary" className="capitalize">{announcement.type.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-500 mt-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {announcement.author_name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No announcements found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
