import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ExternalLink, Edit, Save, X, ArrowUpDown } from "lucide-react";
import { Link } from "wouter";

export default function Contacts() {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const utils = trpc.useUtils();
  const { data: contactsData, isLoading } = trpc.leads.getAllContactsWithAccounts.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  const updateContactMutation = trpc.leads.updateContact.useMutation({
    onSuccess: () => {
      utils.leads.getAllContactsWithAccounts.invalidate();
      setEditingId(null);
      setEditForm({});
    },
  });

  const handleEdit = (contact: any) => {
    setEditingId(contact.id);
    setEditForm({
      contactName: contact.contactName,
      title: contact.title || "",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedInUrl: contact.linkedInUrl || "",
    });
  };

  const handleSave = async (contactId: number) => {
    await updateContactMutation.mutateAsync({
      id: contactId,
      contactName: editForm.contactName,
      title: editForm.title,
      email: editForm.email,
      phone: editForm.phone,
      linkedInUrl: editForm.linkedInUrl,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!contactsData || !sortBy) return contactsData;
    
    const sorted = [...contactsData].sort((a, b) => {
      let aVal: any = a[sortBy as keyof typeof a];
      let bVal: any = b[sortBy as keyof typeof b];
      
      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      
      // Convert to strings for comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [contactsData, sortBy, sortDirection]);

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
            <img src="/cintas-logo.png" alt="CINTAS" className="h-12" />
            <div className="border-l-2 border-border pl-4">
              <h1 className="text-2xl font-bold text-foreground">Decision Maker Contacts</h1>
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
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('contactName')} className="-ml-3 h-8 font-semibold">
                          Contact Name
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[140px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('title')} className="-ml-3 h-8 font-semibold">
                          Title
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[90px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('roleType')} className="-ml-3 h-8 font-semibold">
                          Role Type
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('companyName')} className="-ml-3 h-8 font-semibold">
                          Company
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[90px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('county')} className="-ml-3 h-8 font-semibold">
                          County
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('email')} className="-ml-3 h-8 font-semibold">
                          Email
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[110px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('phone')} className="-ml-3 h-8 font-semibold">
                          Phone
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[110px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('authorityScore')} className="-ml-3 h-8 font-semibold">
                          Authority
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[70px]">LinkedIn</TableHead>
                      <TableHead className="w-[100px] sticky right-0 bg-background">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sortedData || []).map((data) => {
                      const contact = data.contact;
                      const account = data.account;
                      
                      if (!account) return null;
                      
                      const isEditing = editingId === contact.id;
                      
                      return (
                        <TableRow 
                          key={contact.id}
                          className={contact.roleType === "Primary" ? "bg-green-50" : ""}
                        >
                          <TableCell className="font-medium w-[160px]">
                            {isEditing ? (
                              <Input
                                value={editForm.contactName}
                                onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              contact.contactName
                            )}
                          </TableCell>
                          <TableCell className="w-[140px]">
                            {isEditing ? (
                              <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              contact.title || "N/A"
                            )}
                          </TableCell>
                          <TableCell className="w-[90px]">
                            <Badge variant={contact.roleType === "Primary" ? "default" : "secondary"}>
                              {contact.roleType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium w-[180px]">{account.companyName}</TableCell>
                          <TableCell className="w-[90px]">{account.county}</TableCell>
                          <TableCell className="w-[180px]">
                            {isEditing ? (
                              <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              contact.email || "N/A"
                            )}
                          </TableCell>
                          <TableCell className="w-[110px]">
                            {isEditing ? (
                              <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              contact.phone || "N/A"
                            )}
                          </TableCell>
                          <TableCell className="w-[110px]">
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
                          <TableCell className="w-[70px]">
                            {isEditing ? (
                              <Input
                                value={editForm.linkedInUrl}
                                onChange={(e) => setEditForm({ ...editForm, linkedInUrl: e.target.value })}
                                className="h-8"
                                placeholder="LinkedIn URL"
                              />
                            ) : contact.linkedInUrl ? (
                              <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="sticky right-0 bg-background">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleSave(contact.id)}
                                  disabled={updateContactMutation.isPending}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={handleCancel}
                                  disabled={updateContactMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEdit(contact)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
