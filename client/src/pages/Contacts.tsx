import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Contacts() {
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: contactsData, isLoading } = trpc.leads.getAllContactsWithAccounts.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

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
              <h1 className="text-3xl font-bold text-foreground">Decision Maker Contacts</h1>
              <p className="text-muted-foreground mt-1">
                Safety and operations contacts for each business
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading contacts...
              </div>
            ) : !contactsData || contactsData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No contacts found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Role Type</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Authority Score</TableHead>
                      <TableHead>LinkedIn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactsData.map((data) => {
                      const contact = data.contact;
                      const account = data.account;
                      
                      if (!account) return null;
                      
                      return (
                        <TableRow 
                          key={contact.id}
                          className={contact.roleType === "Primary" ? "bg-green-50" : ""}
                        >
                          <TableCell className="font-medium">{contact.contactName}</TableCell>
                          <TableCell className="max-w-xs">{contact.title || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={contact.roleType === "Primary" ? "default" : "secondary"}>
                              {contact.roleType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{account.companyName}</TableCell>
                          <TableCell>{account.county}</TableCell>
                          <TableCell>{contact.email || "N/A"}</TableCell>
                          <TableCell>{contact.phone || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${contact.safetyDecisionAuthority}%` }}
                                />
                              </div>
                              <span className="text-sm">{contact.safetyDecisionAuthority}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {contact.linkedInUrl ? (
                              <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
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

        {/* Pagination */}
        {contactsData && contactsData.length === pageSize && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1} to {(page + 1) * pageSize} contacts
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
                disabled={contactsData.length < pageSize}
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
