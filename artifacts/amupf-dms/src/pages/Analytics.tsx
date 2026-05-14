import { useGetReportsSummary, useGetDepartmentPerformance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Analytics() {
  const { data: summary } = useGetReportsSummary();
  const { data: deptPerf } = useGetDepartmentPerformance();

  const COLORS = ['#023D8F', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reports by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {summary?.by_status && summary.by_status.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.by_status}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {summary.by_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {deptPerf && deptPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPerf} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="resolved_cases" name="Resolved Cases" fill="#10b981" />
                  <Bar dataKey="total_cases" name="Total Cases" fill="#023D8F" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
