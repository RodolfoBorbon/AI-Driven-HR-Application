import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight, ChevronRight, Building2, DollarSign, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import { JobMetricsDashboard } from "@/shared/components/layout/JobMetricsDashboard";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Simplified */}
      <section className="relative px-4 py-12 md:py-16 bg-gradient-to-b from-background to-slate-50">
        <div className="container mx-auto text-center">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              EXera
            </span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
            AI-Driven employee performance and pay equity HR Platform
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Sections */}
        <div className="grid gap-8">
          {/* Hiring Overview Section */}
          <section className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">Hiring Overview</h2>
              </div>
              <Link href="/hiring">
                <Button variant="outline" size="sm" className="gap-1">
                  View Details <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="p-4 md:p-6">
              <JobMetricsDashboard />
            </div>
          </section>

          {/* Pay Equity Overview Section - Placeholder for future implementation */}
          <section className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="bg-green-100 p-2 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Pay Equity Overview</h2>
              </div>
              <Link href="/pay-equity">
                <Button variant="outline" size="sm" className="gap-1">
                  View Details <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="p-4 md:p-6 flex items-center justify-center min-h-[220px] bg-gray-50">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Pay equity analytics coming soon</p>
                <Link href="/pay-equity">
                  <Button variant="secondary" size="sm" className="gap-1">
                    Explore <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Employee Performance Overview Section - Placeholder for future implementation */}
          <section className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="bg-purple-100 p-2 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold">Employee Performance Overview</h2>
              </div>
              <Link href="/performance">
                <Button variant="outline" size="sm" className="gap-1">
                  View Details <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="p-4 md:p-6 flex items-center justify-center min-h-[220px] bg-gray-50">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Performance analytics coming soon</p>
                <Link href="/performance">
                  <Button variant="secondary" size="sm" className="gap-1">
                    Explore <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

