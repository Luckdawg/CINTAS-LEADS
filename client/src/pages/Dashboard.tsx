import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.leads.getStatistics.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src="/cintas-logo.png" alt="CINTAS" className="h-16" />
              <div className="border-l-2 border-border pl-6">
                <h1 className="text-2xl font-bold text-foreground">
                  Atlanta Metro Lead Generation
                </h1>
                <p className="text-muted-foreground mt-1">
                  First Aid & Safety + Fire Protection Services
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/leads">
                <Button variant="outline">View All Leads</Button>
              </Link>
              <Link href="/contacts">
                <Button variant="outline">View Contacts</Button>
              </Link>
              <Link href="/duplicates">
                <Button variant="outline">View Duplicates</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Business accounts discovered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Decision makers identified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Possible Duplicates</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.duplicateLeads || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Flagged for review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Contacts/Account</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.avgContactsPerAccount.toFixed(1) || "0.0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Contact enrichment rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coverage by Safety Vertical */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Coverage by Safety Vertical</CardTitle>
              <CardDescription>Distribution of leads by service category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.byVertical.map((item: any) => (
                  <div key={item.vertical} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.vertical === "Both" ? "bg-primary" :
                        item.vertical === "FirstAidSafety" ? "bg-blue-500" :
                        "bg-red-500"
                      }`}></div>
                      <span className="font-medium">{item.vertical}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{item.count}</span>
                      <span className="text-sm text-muted-foreground">
                        ({((item.count / (stats?.totalLeads || 1)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Coverage by County (Top 10) */}
          <Card>
            <CardHeader>
              <CardTitle>Coverage by County</CardTitle>
              <CardDescription>Top 10 counties by lead count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.byCounty.slice(0, 10).map((item: any, index: number) => (
                  <div key={item.county} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
                      <span className="font-medium">{item.county}</span>
                    </div>
                    <span className="text-lg font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Navigate to different sections of the lead management system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/leads">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Building2 className="h-6 w-6" />
                  <span>Browse All Leads</span>
                </Button>
              </Link>
              <Link href="/contacts">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>View Contacts</span>
                </Button>
              </Link>
              <Link href="/duplicates">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Review Duplicates</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
