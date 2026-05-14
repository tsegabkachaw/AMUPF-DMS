import { useParams } from "wouter";
import { useGetReport, useUpdateReportStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./Dashboard";
import { MapPin, Calendar, User, Hash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getGetReportQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: report, isLoading } = useGetReport(id as string, {
    query: {
      enabled: !!id,
      queryKey: getGetReportQueryKey(id as string)
    }
  });

  const updateStatus = useUpdateReportStatus();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ 
        id: id as string, 
        data: { status: newStatus as any } 
      });
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: getGetReportQueryKey(id as string) });
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading report details...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-slate-500">Report not found.</div>;
  }

  const canEditStatus = user && ["executive", "president", "higher_official"].includes(user.role);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{report.title}</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-4">
            <span className="flex items-center"><Hash className="h-4 w-4 mr-1" /> {report.report_id.slice(0, 8)}</span>
            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {new Date(report.created_at).toLocaleDateString()}</span>
          </p>
        </div>
        
        {canEditStatus ? (
          <Select defaultValue={report.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <StatusBadge status={report.status} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-slate-700">{report.description}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 flex items-center"><User className="h-4 w-4 mr-2" /> Reporter</p>
                <p className="mt-1 font-medium">{report.is_anonymous ? "Anonymous" : report.student_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Location</p>
                <p className="mt-1 font-medium">{report.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 flex items-center"><Calendar className="h-4 w-4 mr-2" /> Incident Date</p>
                <p className="mt-1 font-medium">{new Date(report.incident_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Category</p>
                <p className="mt-1 font-medium capitalize">{report.category.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Department</p>
                <p className="mt-1 font-medium">{report.department_name}</p>
              </div>
            </CardContent>
          </Card>

          {(report.executive_notes || report.resolution_summary) && (
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle>Resolution Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.resolution_summary && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Resolution Summary</p>
                    <p className="mt-1 text-sm">{report.resolution_summary}</p>
                  </div>
                )}
                {report.executive_notes && canEditStatus && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Executive Notes (Internal)</p>
                    <p className="mt-1 text-sm">{report.executive_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
