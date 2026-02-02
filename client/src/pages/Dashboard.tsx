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
                  Western Georgia Lead Generation
                </h1>
                <p className="text-muted-foreground mt-1">
                  First Aid & Safety Services - West of I-75
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
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => window.location.href = '/leads'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to view all leads
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => window.location.href = '/contacts'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to view all contacts
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => window.location.href = '/duplicates'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Possible Duplicates</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.duplicateLeads || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to view duplicates
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

        {/* Coverage by Product Lines */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Coverage by Product Line</CardTitle>
              <CardDescription>Distribution of leads by service offerings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.byProductLine.slice(0, 7).map((item: any, idx: number) => (
                  <div 
                    key={item.productLine} 
                    className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/leads?productLine=${item.productLine}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: `hsl(${(idx * 360) / 7}, 70%, 50%)` }}></div>
                      <span className="font-medium text-sm">{item.productLine}</span>
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

          {/* Coverage by ZIP Code (Top 15) */}
          <Card>
            <CardHeader>
              <CardTitle>Coverage by ZIP Code</CardTitle>
              <CardDescription>Top 15 ZIP codes by lead count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stats?.byZipCode.slice(0, 15).map((item: any, index: number) => (
                  <div 
                    key={`${item.zipCode}-${index}`} 
                    className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/leads?zipCode=${item.zipCode}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.zipCode}</span>
                        <span className="text-xs text-muted-foreground">{item.city || 'Unknown'}, {item.county}</span>
                      </div>
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
