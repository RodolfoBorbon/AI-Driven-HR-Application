import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { fetchJobMetrics, fetchJobTrends } from "@/features/job-management/api/jobDescriptionAPIs";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { USER_ROLES } from "@/features/auth/api/authService"; // Add this import
import { AlertCircle, FileText, Users, CheckCircle, Clock } from "lucide-react";

// Add this import if you have a chart component
// import JobMetricsChart from "@/components/dashboard/JobMetricsChart";

// Define types for metrics data
interface DepartmentData {
  name: string;
  value: number;
}

interface MetricsData {
  totalJobs: number;
  pendingApproval: number;
  approved: number;
  formatted: number;
  published: number;
  byDepartment: DepartmentData[];
  byLocation?: DepartmentData[];
}

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user can view metrics
  const canViewMetrics = hasPermission("canViewMetrics");

  useEffect(() => {
    if (canViewMetrics) {
      loadMetrics();
    } else {
      setIsLoading(false);
    }
  }, [canViewMetrics]);

  async function loadMetrics() {
    try {
      setIsLoading(true);
      const metricsData = await fetchJobMetrics();
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      console.error("Error loading metrics:", err);
      setError(err instanceof Error ? err.message : "Failed to load job metrics");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canViewMetrics) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limited Access</AlertTitle>
          <AlertDescription>
            Your current role ({user?.role}) doesn't have permission to view job metrics.
            This feature is available to HR Managers and IT Administrators.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Welcome, {user?.username}!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You're logged in as {user?.role}. You can access job creation and formatting features from the Hiring page.
              </p>
              <Button className="mt-4" asChild>
                <a href="/hiring">Go to Hiring</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {metrics && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{metrics.totalJobs}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">{metrics.pendingApproval}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">{metrics.approved}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold">{metrics.published}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* You could add more detailed charts here if you have a chart component */}
      {/* <JobMetricsChart data={metrics} /> */}

      {/* Department distribution section */}
      {metrics && metrics.byDepartment && metrics.byDepartment.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Jobs by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.byDepartment.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{dept.name}</span>
                  <div className="flex items-center">
                    <div className="w-40 bg-muted rounded-full h-2 mr-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (dept.value / metrics.totalJobs) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">{dept.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
