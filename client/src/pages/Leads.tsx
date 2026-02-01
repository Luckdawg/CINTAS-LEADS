import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const ATLANTA_COUNTIES = [
  "Fulton", "DeKalb", "Cobb", "Gwinnett", "Clayton",
  "Cherokee", "Henry", "Rockdale", "Douglas", "Fayette",
  "Paulding", "Walton", "Barrow", "Spalding", "Coweta"
];

export default function Leads() {
  const [filters, setFilters] = useState({
    county: "",
    safetyVertical: "",
    searchQuery: "",
    duplicatesOnly: false,
    minEmployees: undefined as number | undefined,
    maxEmployees: undefined as number | undefined,
  });
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading, refetch } = trpc.leads.getAccounts.useQuery({
    ...filters,
    county: filters.county || undefined,
    safetyVertical: filters.safetyVertical as any || undefined,
    searchQuery: filters.searchQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const exportMutation = trpc.export.generateExcel.useMutation({
    onSuccess: (result) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Excel file downloaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to generate Excel file: " + error.message);
    },
  });

  const handleExport = () => {
    exportMutation.mutate({
      county: filters.county || undefined,
      safetyVertical: filters.safetyVertical as any || undefined,
      searchQuery: filters.searchQuery || undefined,
      duplicatesOnly: filters.duplicatesOnly || undefined,
      minEmployees: filters.minEmployees,
      maxEmployees: filters.maxEmployees,
    });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      county: "",
      safetyVertical: "",
      searchQuery: "",
      duplicatesOnly: false,
      minEmployees: undefined,
      maxEmployees: undefined,
    });
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Business Leads</h1>
                <p className="text-muted-foreground mt-1">
                  {data?.total || 0} leads found
                </p>
              </div>
            </div>
            <Button onClick={handleExport} disabled={exportMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Generating..." : "Export to Excel"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription>Refine your lead search</CardDescription>
              </div>
              <Button variant="ghost" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Company name or address..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* County */}
              <div className="space-y-2">
                <label className="text-sm font-medium">County</label>
                <Select value={filters.county} onValueChange={(v) => handleFilterChange("county", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All counties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All counties</SelectItem>
                    {ATLANTA_COUNTIES.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Safety Vertical */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Safety Vertical</label>
                <Select value={filters.safetyVertical} onValueChange={(v) => handleFilterChange("safetyVertical", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All verticals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All verticals</SelectItem>
                    <SelectItem value="FirstAidSafety">First Aid & Safety</SelectItem>
                    <SelectItem value="FireProtection">Fire Protection</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duplicates Only */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Show Duplicates Only</label>
                <Button
                  variant={filters.duplicatesOnly ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleFilterChange("duplicatesOnly", !filters.duplicatesOnly)}
                >
                  {filters.duplicatesOnly ? "Showing Duplicates" : "Show All"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading leads...
              </div>
            ) : data?.accounts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No leads found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Safety Vertical</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.accounts.map((account) => (
                      <TableRow key={account.id} className={account.possibleDuplicate ? "bg-yellow-50" : ""}>
                        <TableCell className="font-medium">{account.companyName}</TableCell>
                        <TableCell className="max-w-xs truncate">{account.address}</TableCell>
                        <TableCell>{account.county}</TableCell>
                        <TableCell>
                          <Badge variant={
                            account.safetyVertical === "Both" ? "default" :
                            account.safetyVertical === "FirstAidSafety" ? "secondary" :
                            "outline"
                          }>
                            {account.safetyVertical}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {account.employeeCountEstimated ? (
                            <div className="flex flex-col">
                              <span>{account.employeeCountEstimated}</span>
                              <span className="text-xs text-muted-foreground">
                                {account.employeeEstimateConfidence}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{account.phone || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {account.website && (
                              <a href={account.website.startsWith("http") ? account.website : `https://${account.website}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            {account.linkedInCompanyUrl && (
                              <a href={account.linkedInCompanyUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                </Button>
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.possibleDuplicate && (
                            <Badge variant="destructive">Duplicate</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.total)} of {data.total} leads
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={!data.hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
