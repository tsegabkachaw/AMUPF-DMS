import { useListEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar as CalendarIcon, Users } from "lucide-react";

export default function Events() {
  const { data: events, isLoading } = useListEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Events</h1>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-500">Loading events...</div>
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {event.attendee_count || 0} {event.max_attendees ? `/ ${event.max_attendees}` : ''} attendees
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No events found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
