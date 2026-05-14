import { useListDelegations, useRevokeDelegation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDelegationsQueryKey } from "@workspace/api-client-react";

export default function Delegations() {
  const { data: delegations, isLoading } = useListDelegations();
  const revokeDelegation = useRevokeDelegation();
  const queryClient = useQueryClient();

  const handleRevoke = async (id: string) => {
    try {
      await revokeDelegation.mutateAsync({ id });
      toast.success("Delegation revoked successfully");
      queryClient.invalidateQueries({ queryKey: getListDelegationsQueryKey() });
    } catch (e: any) {
      toast.error(e.message || "Failed to revoke delegation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Delegations</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Shield className="mr-2 h-4 w-4" /> New Delegation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading delegations...</div>
          ) : delegations && delegations.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Granted To</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delegations.map((delegation) => (
                    <TableRow key={delegation.delegation_id}>
                      <TableCell className="font-medium">{delegation.granted_to_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {delegation.permission.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={delegation.is_active ? "default" : "secondary"}>
                          {delegation.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {delegation.expires_at ? new Date(delegation.expires_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        {delegation.is_active && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRevoke(delegation.delegation_id)}
                            disabled={revokeDelegation.isPending}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 border rounded-md border-dashed">
              No delegations found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
