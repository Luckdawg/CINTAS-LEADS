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
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('contactName')} className="-ml-3 h-8 font-semibold text-xs">
                          Name
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[110px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('title')} className="-ml-3 h-8 font-semibold text-xs">
                          Title
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[75px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('roleType')} className="-ml-3 h-8 font-semibold text-xs">
                          Role
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[140px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('companyName')} className="-ml-3 h-8 font-semibold text-xs">
                          Company
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[75px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('county')} className="-ml-3 h-8 font-semibold text-xs">
                          County
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[140px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('email')} className="-ml-3 h-8 font-semibold text-xs">
                          Email
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[95px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('phone')} className="-ml-3 h-8 font-semibold text-xs">
                          Phone
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[85px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('authorityScore')} className="-ml-3 h-8 font-semibold text-xs">
                          Authority
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[55px] text-xs">Link</TableHead>
                      <TableHead className="w-[90px] sticky right-0 bg-background text-xs">Actions</TableHead>
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
                          <TableCell className="font-medium text-sm" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.contactName}
                                onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : (
                              contact.contactName
                            )}
                          </TableCell>
                          <TableCell className="text-sm" style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : (
                              contact.title || "N/A"
                            )}
                          </TableCell>
                          <TableCell style={{ maxWidth: '75px' }}>
                            <Badge variant={contact.roleType === "Primary" ? "default" : "secondary"} className="text-xs px-1">
                              {contact.roleType === "Primary" ? "Pri" : "Sec"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.companyName}</TableCell>
                          <TableCell className="text-sm" style={{ maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.county}</TableCell>
                          <TableCell className="text-sm" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : (
                              contact.email || "N/A"
                            )}
                          </TableCell>
                          <TableCell className="text-sm" style={{ maxWidth: '95px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : (
                              contact.phone || "N/A"
                            )}
                          </TableCell>
                          <TableCell style={{ maxWidth: '85px' }}>
                            <div className="flex items-center gap-1">
                              <div className="w-10 bg-muted rounded-full h-1.5">
                                <div 
                                  className="bg-primary h-1.5 rounded-full"
                                  style={{ width: `${contact.safetyDecisionAuthority}%` }}
                                />
                              </div>
                              <span className="text-xs">{contact.safetyDecisionAuthority}</span>
                            </div>
                          </TableCell>
                          <TableCell style={{ maxWidth: '55px' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.linkedInUrl}
                                onChange={(e) => setEditForm({ ...editForm, linkedInUrl: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : contact.linkedInUrl ? (
                              <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                </Button>
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="sticky right-0 bg-background" style={{ maxWidth: '90px' }}>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSave(contact.id)}
                                  disabled={updateContactMutation.isPending}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={handleCancel}
                                  disabled={updateContactMutation.isPending}
                                  className="h-6 px-2 text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEdit(contact)}
                                className="h-6 px-2 text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
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
        {contactsData && contactsData.length >= pageSize && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {page * pageSize + 1} to {page * pageSize + (contactsData?.length || 0)} contacts
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
                disabled={!contactsData || contactsData.length < pageSize}
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
