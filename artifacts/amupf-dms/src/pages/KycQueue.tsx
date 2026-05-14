import { useGetKycQueue, useApproveKyc, useRejectKyc } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetKycQueueQueryKey } from "@workspace/api-client-react";

export default function KycQueue() {
  const { data: queue, isLoading } = useGetKycQueue();
  const approveKyc = useApproveKyc();
  const rejectKyc = useRejectKyc();
  const queryClient = useQueryClient();

  const handleApprove = async (userId: string) => {
    try {
      await approveKyc.mutateAsync({ id: userId });
      toast.success("User approved successfully");
      queryClient.invalidateQueries({ queryKey: getGetKycQueueQueryKey() });
    } catch (e: any) {
      toast.error(e.message || "Failed to approve user");
    }
  };

  const handleReject = async (userId: string) => {
    const reason = window.prompt("Enter rejection reason (min 20 characters):");
    if (!reason || reason.length < 20) {
      toast.error("Rejection reason must be at least 20 characters");
      return;
    }
    
    try {
      await rejectKyc.mutateAsync({ id: userId, data: { rejection_reason: reason } });
      toast.success("User rejected successfully");
      queryClient.invalidateQueries({ queryKey: getGetKycQueueQueryKey() });
    } catch (e: any) {
      toast.error(e.message || "Failed to reject user");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">KYC Approval Queue</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading queue...</div>
          ) : queue && queue.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                        <br/>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </TableCell>
                      <TableCell>{user.student_id}</TableCell>
                      <TableCell>{user.department_name}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(user.user_id)}
                          disabled={approveKyc.isPending || rejectKyc.isPending}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(user.user_id)}
                          disabled={approveKyc.isPending || rejectKyc.isPending}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 border rounded-md border-dashed">
              No pending registrations found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
