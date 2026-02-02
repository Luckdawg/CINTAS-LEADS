import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, ExternalLink, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, Maximize2, Minimize2, Building2, MapPin, Phone, Users, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

import { PRODUCT_LINES, WESTERN_GEORGIA_ZIPS } from "../../../shared/westernGeorgiaZips";

const WESTERN_GEORGIA_COUNTIES = [
  "Carroll", "Coweta", "Troup", "Muscogee", "Floyd",
  "Polk", "Haralson", "Douglas", "Paulding", "Bartow",
];

export default function Leads() {
  // Get parameters from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const zipFromUrl = urlParams.get('zipCode');
  const productLineFromUrl = urlParams.get('productLine');
  
  const [filters, setFilters] = useState({
    county: "all",
    productLines: productLineFromUrl ? [productLineFromUrl] : [] as string[],
    zipCodes: zipFromUrl ? [zipFromUrl] : [] as string[],
    westernGeorgiaOnly: false,
    searchQuery: "",
    duplicatesOnly: false,
    minEmployees: undefined as number | undefined,
    maxEmployees: undefined as number | undefined,
  });
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  
  // Column visibility and view mode
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('leadsTableVisibleColumns');
    return saved ? JSON.parse(saved) : {
      companyName: true,
      address: false,
      city: true,
      zipCode: true,
      productLines: true,
      employees: true,
      phone: false,
      links: false,
      status: true,
    };
  });
  const [isCompactView, setIsCompactView] = useState(() => {
    const saved = localStorage.getItem('leadsTableCompactView');
    return saved === 'true';
  });
  
  // Reduced column widths to fit viewport without horizontal scroll
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('leadsTableColumnWidths');
    return saved ? JSON.parse(saved) : {
      companyName: 150,
      address: 160,
      city: 85,
      zipCode: 55,
      productLines: 120,
      employees: 80,
      phone: 105,
      links: 65,
      status: 75,
    };
  });
  
  const [resizing, setResizing] = useState<{column: string, startX: number, startWidth: number} | null>(null);
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('leadsTableVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);
  
  useEffect(() => {
    localStorage.setItem('leadsTableCompactView', String(isCompactView));
  }, [isCompactView]);
  
  useEffect(() => {
    localStorage.setItem('leadsTableColumnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);
  
  const handleResizeStart = (column: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column as keyof typeof columnWidths] });
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const diff = e.clientX - resizing.startX;
        const newWidth = Math.max(50, resizing.startWidth + diff);
        setColumnWidths((prev: typeof columnWidths) => ({
          ...prev,
          [resizing.column]: newWidth
        }));
      }
    };
    
    const handleMouseUp = () => {
      setResizing(null);
    };
    
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  const pageSize = 50;
  const { data, isLoading } = trpc.leads.getAccounts.useQuery({
    county: filters.county === "all" ? undefined : filters.county,
    productLines: filters.productLines.length > 0 ? filters.productLines : undefined,
    zipCodes: filters.zipCodes.length > 0 ? filters.zipCodes : undefined,
    westernGeorgiaOnly: filters.westernGeorgiaOnly,
    searchQuery: filters.searchQuery || undefined,
    duplicatesOnly: filters.duplicatesOnly,
    minEmployees: filters.minEmployees,
    maxEmployees: filters.maxEmployees,
    limit: pageSize,
    offset: page * pageSize,
  });

  const exportMutation = trpc.export.generateExcel.useMutation({
    onSuccess: (result: any) => {
      // Create a download link
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel file generated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to generate Excel: ${error.message}`);
    }
  });

  const updateMutation = trpc.leads.updateAccount.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully!");
      setEditingId(null);
      setEditedData({});
    },
    onError: (error: any) => {
      toast.error(`Failed to update lead: ${error.message}`);
    }
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      county: "all",
      productLines: [],
      zipCodes: [],
      westernGeorgiaOnly: false,
      searchQuery: "",
      duplicatesOnly: false,
      minEmployees: undefined,
      maxEmployees: undefined,
    });
    setPage(0);
  };

  const handleExport = () => {
    exportMutation.mutate({
      county: filters.county === "all" ? undefined : filters.county,
      productLines: filters.productLines.length > 0 ? filters.productLines : undefined,
      zipCodes: filters.zipCodes.length > 0 ? filters.zipCodes : undefined,
      westernGeorgiaOnly: filters.westernGeorgiaOnly,
      searchQuery: filters.searchQuery || undefined,
      duplicatesOnly: filters.duplicatesOnly,
      minEmployees: filters.minEmployees,
      maxEmployees: filters.maxEmployees,
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 inline" />
      : <ArrowDown className="ml-2 h-4 w-4 inline" />;
  };

  const sortedData = data?.accounts ? [...data.accounts].sort((a, b) => {
    if (!sortBy) return 0;
    
    const aVal = a[sortBy as keyof typeof a];
    const bVal = b[sortBy as keyof typeof b];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  }) : [];

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    setEditedData({
      companyName: account.companyName,
      address: account.address,
      city: account.city,
      zipCode: account.zipCode,
      phone: account.phone,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedData({});
  };

  const handleSave = (accountId: number) => {
    updateMutation.mutate({
      id: accountId,
      ...editedData,
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns((prev: typeof visibleColumns) => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Business Leads</h1>
              <p className="text-muted-foreground">{data?.total || 0} leads found</p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.address}
                    onCheckedChange={() => toggleColumnVisibility('address')}
                  >
                    Address
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.phone}
                    onCheckedChange={() => toggleColumnVisibility('phone')}
                  >
                    Phone
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.links}
                    onCheckedChange={() => toggleColumnVisibility('links')}
                  >
                    Links
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCompactView(!isCompactView)}
              >
                {isCompactView ? <Maximize2 className="h-4 w-4 mr-2" /> : <Minimize2 className="h-4 w-4 mr-2" />}
                {isCompactView ? 'Comfortable' : 'Compact'}
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={exportMutation.isPending}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportMutation.isPending ? "Generating..." : "Export to Excel"}
              </Button>
            </div>
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
                    <SelectItem value="all">All counties</SelectItem>
                    {WESTERN_GEORGIA_COUNTIES.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Lines */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Lines</label>
                <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
                  {PRODUCT_LINES.map(pl => (
                    <label key={pl.value} className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.productLines.includes(pl.value)}
                        onChange={(e) => {
                          const newProductLines = e.target.checked
                            ? [...filters.productLines, pl.value]
                            : filters.productLines.filter(p => p !== pl.value);
                          handleFilterChange("productLines", newProductLines);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{pl.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Western Georgia Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Geographic Region</label>
                <Button
                  variant={filters.westernGeorgiaOnly ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleFilterChange("westernGeorgiaOnly", !filters.westernGeorgiaOnly)}
                >
                  {filters.westernGeorgiaOnly ? "Western GA Only" : "All Regions"}
                </Button>
              </div>

              {/* ZIP Code Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ZIP Codes</label>
                <div className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-2">
                  {WESTERN_GEORGIA_ZIPS.map(zip => (
                    <label key={zip} className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.zipCodes.includes(zip)}
                        onChange={(e) => {
                          const newZipCodes = e.target.checked
                            ? [...filters.zipCodes, zip]
                            : filters.zipCodes.filter(z => z !== zip);
                          handleFilterChange("zipCodes", newZipCodes);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-mono">{zip}</span>
                    </label>
                  ))}
                </div>
                {filters.zipCodes.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Filtering by {filters.zipCodes.length} ZIP code{filters.zipCodes.length > 1 ? 's' : ''}
                  </p>
                )}
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
        <Card className="shadow-md border-2">
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
              <div className="w-full overflow-x-auto">
                <Table className={`${isCompactView ? 'text-sm' : ''}`}>
                  <TableHeader className="bg-muted/50 border-b-2">
                    <TableRow>
                      <TableHead style={{ width: `${columnWidths.companyName}px`, minWidth: `${columnWidths.companyName}px`, position: 'relative' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('companyName')} className="-ml-3 h-8 font-semibold">
                          Company Name
                          {getSortIcon('companyName')}
                        </Button>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                          onMouseDown={(e) => handleResizeStart('companyName', e)}
                        />
                      </TableHead>
                      {visibleColumns.address && (
                        <TableHead style={{ width: `${columnWidths.address}px`, minWidth: `${columnWidths.address}px`, position: 'relative' }}>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('address')} className="-ml-3 h-8 font-semibold">
                            Address
                            {getSortIcon('address')}
                          </Button>
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                            onMouseDown={(e) => handleResizeStart('address', e)}
                          />
                        </TableHead>
                      )}
                      <TableHead style={{ width: `${columnWidths.city}px`, minWidth: `${columnWidths.city}px`, position: 'relative' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('city')} className="-ml-3 h-8 font-semibold">
                          City
                          {getSortIcon('city')}
                        </Button>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                          onMouseDown={(e) => handleResizeStart('city', e)}
                        />
                      </TableHead>
                      <TableHead style={{ width: `${columnWidths.zipCode}px`, minWidth: `${columnWidths.zipCode}px`, position: 'relative' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('zipCode')} className="-ml-3 h-8 font-semibold">
                          ZIP
                          {getSortIcon('zipCode')}
                        </Button>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                          onMouseDown={(e) => handleResizeStart('zipCode', e)}
                        />
                      </TableHead>
                      <TableHead style={{ width: `${columnWidths.productLines}px`, minWidth: `${columnWidths.productLines}px`, position: 'relative' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('productLines')} className="-ml-3 h-8 font-semibold">
                          Product Lines
                          {getSortIcon('productLines')}
                        </Button>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                          onMouseDown={(e) => handleResizeStart('productLines', e)}
                        />
                      </TableHead>
                      <TableHead style={{ width: `${columnWidths.employees}px`, minWidth: `${columnWidths.employees}px`, position: 'relative' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('employeeCountEstimated')} className="-ml-3 h-8 font-semibold">
                          Employees
                          {getSortIcon('employeeCountEstimated')}
                        </Button>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                          onMouseDown={(e) => handleResizeStart('employees', e)}
                        />
                      </TableHead>
                      {visibleColumns.phone && (
                        <TableHead style={{ width: `${columnWidths.phone}px`, minWidth: `${columnWidths.phone}px`, position: 'relative' }}>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('phone')} className="-ml-3 h-8 font-semibold">
                            Phone
                            {getSortIcon('phone')}
                          </Button>
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                            onMouseDown={(e) => handleResizeStart('phone', e)}
                          />
                        </TableHead>
                      )}
                      {visibleColumns.links && (
                        <TableHead style={{ width: `${columnWidths.links}px`, minWidth: `${columnWidths.links}px`, position: 'relative' }}>
                          Links
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                            onMouseDown={(e) => handleResizeStart('links', e)}
                          />
                        </TableHead>
                      )}
                      <TableHead style={{ width: `${columnWidths.status}px`, minWidth: `${columnWidths.status}px`, position: 'relative' }}>
                        Status
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                          onMouseDown={(e) => handleResizeStart('status', e)}
                        />
                      </TableHead>
                      <TableHead className="w-[100px] sticky right-0 bg-background">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((account) => {
                      const isEditing = editingId === account.id;
                      return (
                      <TableRow key={account.id} className={account.possibleDuplicate ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-muted/50"} style={{ transition: 'background-color 0.2s' }}>
                        <TableCell className="font-medium align-top py-3" style={{ maxWidth: `${columnWidths.companyName}px` }}>
                          {isEditing ? (
                            <Input
                              value={editedData.companyName}
                              onChange={(e) => handleFieldChange('companyName', e.target.value)}
                              className="min-w-full"
                            />
                          ) : (
                            <div className="flex items-start gap-2">
                              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span>{account.companyName}</span>
                            </div>
                          )}
                        </TableCell>
                        {visibleColumns.address && (
                        <TableCell className="align-top py-3" style={{ maxWidth: `${columnWidths.address}px` }}>
                          {isEditing ? (
                            <Input
                              value={editedData.address}
                              onChange={(e) => handleFieldChange('address', e.target.value)}
                              className="min-w-full"
                            />
                          ) : (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="block break-words">{account.address}</span>
                            </div>
                          )}
                        </TableCell>
                        )}
                        <TableCell className="align-top py-3" style={{ maxWidth: `${columnWidths.city}px` }}>
                          {isEditing ? (
                            <Input
                              value={editedData.city}
                              onChange={(e) => handleFieldChange('city', e.target.value)}
                              className="min-w-full"
                            />
                          ) : account.city || 'N/A'}
                        </TableCell>
                        <TableCell className="align-top py-3" style={{ maxWidth: `${columnWidths.zipCode}px` }}>
                          {isEditing ? (
                            <Input
                              value={editedData.zipCode}
                              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                              className="min-w-full"
                            />
                          ) : account.zipCode}
                        </TableCell>
                        <TableCell className="align-top py-3" style={{ maxWidth: `${columnWidths.productLines}px` }}>
                          <div className="flex flex-wrap gap-1">
                            {account.productLines?.split(',').slice(0, 2).map((pl, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {PRODUCT_LINES.find(p => p.value === pl.trim())?.label || pl.trim()}
                              </Badge>
                            ))}
                            {account.productLines && account.productLines.split(',').length > 2 && (
                              <Badge variant="outline" className="text-xs">+{account.productLines.split(',').length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top py-3" style={{ maxWidth: `${columnWidths.employees}px` }}>
                          {account.employeeCountEstimated ? (
                            <div className="flex items-start gap-2">
                              <Users className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium">{account.employeeCountEstimated}</span>
                                <span className="text-xs text-muted-foreground">
                                  {account.employeeEstimateConfidence}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </TableCell>
                        {visibleColumns.phone && (
                        <TableCell className="align-top py-3" style={{ maxWidth: `${columnWidths.phone}px` }}>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span>{account.phone || "N/A"}</span>
                          </div>
                        </TableCell>
                        )}
                        {visibleColumns.links && (
                          <TableCell className={`${isCompactView ? 'py-1' : ''}`} style={{ maxWidth: `${columnWidths.links}px` }}>
                          <div className="flex gap-1">
                            {account.website && (
                              <a href={account.website.startsWith("http") ? account.website : `https://${account.website}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </a>
                            )}
                            {account.linkedInCompanyUrl && (
                              <a href={account.linkedInCompanyUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                </Button>
                              </a>
                            )}
                          </div>
                          </TableCell>
                        )}
                        <TableCell className={`${isCompactView ? 'py-1' : ''}`} style={{ maxWidth: `${columnWidths.status}px` }}>
                          {account.possibleDuplicate && (
                            <Badge variant="destructive" className="text-xs">Dup</Badge>
                          )}
                        </TableCell>
                        <TableCell className={`w-[100px] sticky right-0 bg-background ${isCompactView ? 'py-1' : ''}`}>
                          {isEditing ? (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                onClick={() => handleSave(account.id)}
                                disabled={updateMutation.isPending}
                                className="text-xs px-2 py-1 h-7"
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleCancel}
                                disabled={updateMutation.isPending}
                                className="text-xs px-2 py-1 h-7"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(account)}
                              className="text-xs px-2 py-1 h-7"
                            >
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
