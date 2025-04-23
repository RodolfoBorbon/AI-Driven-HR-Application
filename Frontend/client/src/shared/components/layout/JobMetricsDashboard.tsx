import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileText, Clock, CheckCircle, Send, TrendingUp } from "lucide-react";
import { fetchJobMetrics, fetchJobTrends } from "@/features/job-management/api/jobDescriptionAPIs";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

interface JobMetrics {
  totalJobs: number;
  pendingApproval: number;
  approved: number;
  formatted: number;
  published: number;
  byDepartment: { name: string; value: number }[];
  byLocation: { name: string; value: number }[];
}

interface JobTrend {
  month: string;
  count: number;
}

interface JobStatusTrend {
  month: string;
  status: string;
  count: number;
}

interface JobTrends {
  jobCreationByMonth: JobTrend[];
  statusChangesByMonth: JobStatusTrend[];
}

export function JobMetricsDashboard() {
  const [metrics, setMetrics] = useState<JobMetrics | null>(null);
  const [trends, setTrends] = useState<JobTrends | null>(null);
  const [statusTrends, setStatusTrends] = useState<JobTrends | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creationTimeRange, setCreationTimeRange] = useState<string>('6months');
  const [statusTimeRange, setStatusTimeRange] = useState<string>('6months');

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const metricsData = await fetchJobMetrics();
        setMetrics(metricsData);
      } catch (error) {
        console.error("Error fetching job metrics:", error);
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load metrics separately as it doesn't depend on time range
        await loadMetrics();
        
        // Load creation trends with creationTimeRange
        const creationTrendsData = await fetchJobTrends(creationTimeRange);
        setTrends(creationTrendsData);

        // Load status trends with statusTimeRange
        const statusTrendsData = await fetchJobTrends(statusTimeRange);
        setStatusTrends(statusTrendsData);
      } catch (error) {
        console.error("Error fetching job data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [creationTimeRange, statusTimeRange]);

  // Colors for the charts
  const COLORS = ["#FFBB28", "#00C49F", "#0088FE", "#FF8042"];
  const STATUS_COLORS = {
    "Pending for Approval": "#FFBB28",
    "Approved": "#00C49F",
    "Formatted": "#0088FE",
    "Published": "#FF8042"
  };

  if (isLoading && !metrics) {
    return <div className="flex justify-center p-8">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="flex justify-center p-8">No metrics available</div>;
  }

  // Prepare status data for the chart
  const statusData = [
    { name: "Pending", value: metrics.pendingApproval, color: "#FFBB28" },
    { name: "Approved", value: metrics.approved, color: "#00C49F" },
    { name: "Formatted", value: metrics.formatted, color: "#0088FE" },
    { name: "Published", value: metrics.published, color: "#FF8042" }
  ];

  // Prepare the job trends data
  const trendData = trends?.jobCreationByMonth || [];

  // Restructure status trends data for visualization
  interface StatusByMonth {
    month: string;
    [status: string]: string | number;
  }
  
  const statusTrendsByMonth = statusTrends?.statusChangesByMonth?.reduce((acc, item) => {
    const existingMonth = acc.find(m => m.month === item.month);
    if (existingMonth) {
      existingMonth[item.status] = item.count;
    } else {
      const newMonth: StatusByMonth = { month: item.month };
      newMonth[item.status] = item.count;
      acc.push(newMonth);
    }
    return acc;
  }, [] as StatusByMonth[]) || [];

  return (
    <div className="space-y-6">
      {/* Metric Cards - Compact Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
              <p className="text-2xl font-bold">{metrics.totalJobs}</p>
            </div>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{metrics.pendingApproval}</p>
            </div>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{metrics.approved}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{metrics.published}</p>
            </div>
            <Send className="h-5 w-5 text-indigo-500" />
          </CardContent>
        </Card>
      </div>

      {/* Charts - Compact Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-medium">Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} jobs`, name]} 
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Bar Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-medium">Top Departments</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.byDepartment?.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 5, left: 35, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} jobs`, 'Count']} 
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Job Creation Trends Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Job Creation Trends</CardTitle>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
              <Select value={creationTimeRange} onValueChange={setCreationTimeRange}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value} jobs`, 'Created']}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="New Jobs"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No trend data available for selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Status Trends Chart */}
       
          <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Job Status Changes Over Time</CardTitle>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
              <Select value={statusTimeRange} onValueChange={setStatusTimeRange}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              {statusTrendsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={statusTrendsByMonth}
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [`${value} jobs`, name]}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Legend />
                    {Object.keys(STATUS_COLORS).map((status) => (
                      <Line
                        key={status}
                        type="monotone"
                        dataKey={status}
                        stroke={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        name={status}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No status trend data available for selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Distribution - Full Width */}
      {metrics.byLocation?.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-medium">Top Locations</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.byLocation.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 5, left: 35, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} jobs`, 'Count']} 
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { FileText, Clock, CheckCircle, Send, TrendingUp } from "lucide-react";
// import { fetchJobMetrics, fetchJobTrends } from "@/lib/api";
// import { 
//   LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell, Legend
// } from "recharts";

// interface JobMetrics {
//   totalJobs: number;
//   pendingApproval: number;
//   approved: number;
//   formatted: number;
//   published: number;
//   byDepartment: { name: string; value: number }[];
// }

// interface JobTrend {
//   month: string;
//   count: number;
// }

// export function JobMetricsDashboard() {
//   const [metrics, setMetrics] = useState<JobMetrics | null>(null);
//   const [trends, setTrends] = useState<JobTrend[] | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const loadData = async () => {
//       setIsLoading(true);
//       try {
//         // Load metrics and trends in parallel
//         const [metricsData, trendsData] = await Promise.all([
//           fetchJobMetrics(),
//           fetchJobTrends('6months')
//         ]);
        
//         setMetrics(metricsData);
//         setTrends(trendsData.jobCreationByMonth);
//       } catch (error) {
//         console.error("Error fetching job data:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, []);

//   // Colors for the charts
//   const COLORS = ["#FFBB28", "#00C49F", "#0088FE", "#FF8042"];

//   if (isLoading) {
//     return <div className="flex justify-center py-4">Loading metrics...</div>;
//   }

//   if (!metrics) {
//     return <div className="flex justify-center py-4">No metrics available</div>;
//   }

//   // Prepare status data for the chart
//   const statusData = [
//     { name: "Pending", value: metrics.pendingApproval, color: "#FFBB28" },
//     { name: "Approved", value: metrics.approved, color: "#00C49F" },
//     { name: "Formatted", value: metrics.formatted, color: "#0088FE" },
//     { name: "Published", value: metrics.published, color: "#FF8042" }
//   ];

//   return (
//     <div className="space-y-4">
//       {/* Metric Cards - Compact Row */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <Card className="border shadow-sm">
//           <CardContent className="p-3 flex items-center justify-between">
//             <div>
//               <p className="text-xs text-muted-foreground">Total Jobs</p>
//               <p className="text-xl font-bold">{metrics.totalJobs}</p>
//             </div>
//             <FileText className="h-4 w-4 text-blue-500" />
//           </CardContent>
//         </Card>

//         <Card className="border shadow-sm">
//           <CardContent className="p-3 flex items-center justify-between">
//             <div>
//               <p className="text-xs text-muted-foreground">Pending</p>
//               <p className="text-xl font-bold">{metrics.pendingApproval}</p>
//             </div>
//             <Clock className="h-4 w-4 text-yellow-500" />
//           </CardContent>
//         </Card>

//         <Card className="border shadow-sm">
//           <CardContent className="p-3 flex items-center justify-between">
//             <div>
//               <p className="text-xs text-muted-foreground">Approved</p>
//               <p className="text-xl font-bold">{metrics.approved}</p>
//             </div>
//             <CheckCircle className="h-4 w-4 text-green-500" />
//           </CardContent>
//         </Card>

//         <Card className="border shadow-sm">
//           <CardContent className="p-3 flex items-center justify-between">
//             <div>
//               <p className="text-xs text-muted-foreground">Published</p>
//               <p className="text-xl font-bold">{metrics.published}</p>
//             </div>
//             <Send className="h-4 w-4 text-indigo-500" />
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {/* Status Distribution Chart */}
//         <Card className="border shadow-sm">
//           <CardHeader className="p-3 pb-0">
//             <div className="flex justify-between items-center">
//               <CardTitle className="text-xs font-medium">Status Distribution</CardTitle>
//               <TrendingUp className="h-4 w-4 text-muted-foreground" />
//             </div>
//           </CardHeader>
//           <CardContent className="p-3">
//             <div className="h-48">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={statusData}
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={60}
//                     fill="#8884d8"
//                     dataKey="value"
//                   >
//                     {statusData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <Tooltip 
//                     formatter={(value, name) => [`${value} jobs`, name]} 
//                     contentStyle={{ fontSize: '10px' }}
//                   />
//                   <Legend 
//                     layout="horizontal" 
//                     verticalAlign="bottom" 
//                     align="center"
//                     wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
//                   />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Job Creation Trend - Line Chart */}
//         <Card className="border shadow-sm">
//           <CardHeader className="p-3 pb-0">
//             <div className="flex justify-between items-center">
//               <CardTitle className="text-xs font-medium">Job Creation Trend</CardTitle>
//               <TrendingUp className="h-4 w-4 text-muted-foreground" />
//             </div>
//           </CardHeader>
//           <CardContent className="p-3">
//             <div className="h-48">
//               {trends && trends.length > 0 ? (
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart
//                     data={trends}
//                     margin={{ top: 5, right: 10, left: 5, bottom: 20 }}
//                   >
//                     <XAxis 
//                       dataKey="month" 
//                       tick={{ fontSize: 10 }}
//                       angle={-45}
//                       textAnchor="end"
//                       height={40}
//                     />
//                     <YAxis tick={{ fontSize: 10 }} />
//                     <Tooltip
//                       formatter={(value) => [`${value} jobs`, 'Created']}
//                       contentStyle={{ fontSize: '10px' }}
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="count" 
//                       stroke="#8884d8" 
//                       strokeWidth={2}
//                       dot={{ strokeWidth: 2, r: 3 }}
//                       activeDot={{ r: 5 }}
//                       name="New Jobs"
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="flex items-center justify-center h-full">
//                   <p className="text-xs text-muted-foreground">No trend data available</p>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }