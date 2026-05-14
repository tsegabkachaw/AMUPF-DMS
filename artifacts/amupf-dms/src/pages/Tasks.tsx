import { useListTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors: Record<string, string> = {
      low: "bg-slate-100 text-slate-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return <Badge className={`${colors[priority]} capitalize`}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading tasks...</div>
          ) : tasks && tasks.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.task_id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.assigned_to_name}</TableCell>
                      <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{task.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 border rounded-md border-dashed">
              No tasks found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
