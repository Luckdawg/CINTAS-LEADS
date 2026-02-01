import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Duplicates() {
  const { data: duplicates, isLoading } = trpc.leads.getAllDuplicatesWithAccounts.useQuery();
  const { data: groups } = trpc.leads.getDuplicateGroups.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Duplicate Analysis</h1>
              <p className="text-muted-foreground mt-1">
                Review potential duplicate leads for data quality
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duplicate Groups</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique duplicate clusters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duplicate Pairs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{duplicates?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pairwise comparisons flagged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Similarity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {duplicates && duplicates.length > 0
                  ? (duplicates.reduce((sum, d) => sum + Number(d.analysis.overallSimilarityScore || 0), 0) / duplicates.length).toFixed(1)
                  : "0.0"}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall similarity score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Duplicates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Duplicate Pairs</CardTitle>
            <CardDescription>
              These records have been flagged as potential duplicates based on name and address similarity
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading duplicate analysis...
              </div>
            ) : !duplicates || duplicates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No duplicates found. All leads are unique!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Company A</TableHead>
                      <TableHead>Company B</TableHead>
                      <TableHead>Name Similarity</TableHead>
                      <TableHead>Address Similarity</TableHead>
                      <TableHead>Overall Score</TableHead>
                      <TableHead>Match Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicates.map((dup) => {
                      const analysis = dup.analysis;
                      const accountA = dup.accountA;
                      
                      return (
                        <TableRow key={analysis.id} className="bg-yellow-50">
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {analysis.duplicateGroupId.slice(0, 8)}...
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium">{accountA?.companyName || "N/A"}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {accountA?.address || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium">Loading...</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {analysis.accountIdB}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-yellow-500 h-2 rounded-full"
                                  style={{ width: `${Number(analysis.nameSimilarityScore || 0)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {Number(analysis.nameSimilarityScore || 0).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full"
                                  style={{ width: `${Number(analysis.addressSimilarityScore || 0)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {Number(analysis.addressSimilarityScore || 0).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              Number(analysis.overallSimilarityScore || 0) >= 90 ? "destructive" :
                              Number(analysis.overallSimilarityScore || 0) >= 80 ? "default" :
                              "secondary"
                            }>
                              {Number(analysis.overallSimilarityScore || 0).toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm">{analysis.matchReason || "N/A"}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">About Duplicate Detection</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <p className="mb-2">
              Duplicates are identified using fuzzy matching algorithms that compare company names and addresses:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Company names with ≥85% similarity are flagged</li>
              <li>Addresses with ≥80% similarity are flagged</li>
              <li>Exact phone number or website matches are also considered</li>
              <li>Duplicates are <strong>flagged only</strong>, not removed from the database</li>
              <li>Each duplicate group is assigned a unique Group ID for tracking</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
