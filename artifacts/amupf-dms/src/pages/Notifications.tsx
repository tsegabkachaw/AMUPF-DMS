import { useListNotifications, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
          <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading notifications...</div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div key={notif.id} className={`p-4 flex gap-4 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}>
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center ${!notif.is_read ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${!notif.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Bell className="h-8 w-8 mx-auto mb-3 text-slate-300" />
              <p>You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
