import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ExternalLink, Edit, Save, X, ArrowUpDown, ArrowUp, ArrowDown, Building2, MapPin, Phone, Mail, User, Award, Trash2 } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";

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

  const deleteContactMutation = trpc.leads.deleteContact.useMutation({
    onSuccess: () => {
      utils.leads.getAllContactsWithAccounts.invalidate();
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
      // Map sort column to correct data path
      let aVal: any;
      let bVal: any;
      
      // Contact fields
      if (['contactName', 'title', 'email', 'phone', 'roleType', 'authorityScore'].includes(sortBy)) {
        aVal = a.contact[sortBy as keyof typeof a.contact];
        bVal = b.contact[sortBy as keyof typeof b.contact];
      }
      // Account fields
      else if (['companyName', 'county'].includes(sortBy)) {
        aVal = a.account?.[sortBy as keyof typeof a.account];
        bVal = b.account?.[sortBy as keyof typeof b.account];
      }
      
      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      
      // For numeric fields (authorityScore), compare as numbers
      if (sortBy === 'authorityScore') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      {/* Page Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-gray-900">Decision Maker Contacts</h1>
          <p className="text-gray-600 mt-1">
            Safety and operations contacts for each business
          </p>
        </div>
      </div>

      <div className="container py-8">
        <Card className="shadow-md border-2">
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
                  <TableHeader className="bg-muted/50 border-b-2">
                    <TableRow>
                      <TableHead className="w-[130px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('contactName')} className="-ml-3 h-8 font-semibold text-xs">
                          Name
                          {sortBy === 'contactName' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[110px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('title')} className="-ml-3 h-8 font-semibold text-xs">
                          Title
                          {sortBy === 'title' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[75px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('roleType')} className="-ml-3 h-8 font-semibold text-xs">
                          Role
                          {sortBy === 'roleType' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[140px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('companyName')} className="-ml-3 h-8 font-semibold text-xs">
                          Company
                          {sortBy === 'companyName' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[75px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('county')} className="-ml-3 h-8 font-semibold text-xs">
                          County
                          {sortBy === 'county' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[140px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('email')} className="-ml-3 h-8 font-semibold text-xs">
                          Email
                          {sortBy === 'email' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[95px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('phone')} className="-ml-3 h-8 font-semibold text-xs">
                          Phone
                          {sortBy === 'phone' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[85px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('authorityScore')} className="-ml-3 h-8 font-semibold text-xs">
                          Authority
                          {sortBy === 'authorityScore' ? (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
                          )}
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
                          className={contact.roleType === "Primary" ? "bg-green-50 hover:bg-green-100" : "hover:bg-muted/50"}
                          style={{ transition: 'background-color 0.2s' }}
                        >
                          <TableCell className="font-medium text-sm align-top py-3" style={{ maxWidth: '130px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.contactName}
                                onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span>{contact.contactName}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm align-top py-3" style={{ maxWidth: '110px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
                          <TableCell className="align-top py-3" style={{ maxWidth: '75px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <Badge variant={contact.roleType === "Primary" ? "default" : "secondary"} className="text-xs px-1">
                              {contact.roleType === "Primary" ? "Pri" : "Sec"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm align-top py-3" style={{ maxWidth: '140px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <div className="flex items-start gap-2">
                              <Building2 className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="block break-words">{account.companyName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm align-top py-3" style={{ maxWidth: '75px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span>{account.county}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm align-top py-3" style={{ maxWidth: '140px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="break-all">{contact.email || "N/A"}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm align-top py-3" style={{ maxWidth: '95px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {isEditing ? (
                              <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="h-7 text-xs"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span>{contact.phone || "N/A"}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-top py-3" style={{ maxWidth: '85px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            <div className="flex items-center gap-1.5">
                              <Award className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <div className="flex items-center gap-1">
                                <div className="w-10 bg-muted rounded-full h-1.5">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full transition-all"
                                    style={{ width: `${contact.safetyDecisionAuthority}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{contact.safetyDecisionAuthority}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-3" style={{ maxWidth: '55px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
                          <TableCell className="sticky right-0 bg-background" style={{ maxWidth: '90px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleEdit(contact)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${contact.contactName}? This action cannot be undone.`)) {
                                      deleteContactMutation.mutate({ id: contact.id });
                                    }
                                  }}
                                  disabled={deleteContactMutation.isPending}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
