import { useListReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Eye, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Reports() {
  const { data: reports, isLoading } = useListReports();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Incident Reports</h1>
        {user?.role === "student" && (
          <Link href="/reports/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Report
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading reports...</div>
          ) : reports && reports.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell className="capitalize">{report.category.replace("_", " ")}</TableCell>
                      <TableCell>{new Date(report.incident_date).toLocaleDateString()}</TableCell>
                      <TableCell><StatusBadge status={report.status} /></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/reports/${report.report_id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 border rounded-md border-dashed">
              No reports found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
