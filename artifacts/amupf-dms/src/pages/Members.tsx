import { useListMembers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Members() {
  const { data: members, isLoading } = useListMembers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Members Directory</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Peace Forum Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading members...</div>
          ) : members && members.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.member_id}>
                      <TableCell className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.profile_photo || ""} />
                          <AvatarFallback>{member.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.full_name}</span>
                      </TableCell>
                      <TableCell className="capitalize">{member.position.replace("_", " ")}</TableCell>
                      <TableCell>{member.department_name}</TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 border rounded-md border-dashed">
              No members found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
