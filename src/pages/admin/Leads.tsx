import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Search, RefreshCw, Loader2, Phone, Mail, Calendar, Building } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Lead {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  branding_id: string | null;
  brandings?: {
    name: string;
  } | null;
}

interface Branding {
  id: string;
  name: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandingFilter, setBrandingFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch leads with branding info
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*, brandings(name)')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // Fetch brandings for filter
      const { data: brandingsData, error: brandingsError } = await supabase
        .from('brandings')
        .select('id, name')
        .order('name');

      if (brandingsError) throw brandingsError;
      setBrandings(brandingsData || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error("Fehler beim Laden der Leads");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranding = brandingFilter === "all" || lead.branding_id === brandingFilter;
    
    return matchesSearch && matchesBranding;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Alle eingehenden Leads von Landingpages
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Aktualisieren
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead-Übersicht</CardTitle>
          <CardDescription>
            {filteredLeads.length} von {leads.length} Leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Name, Email oder Telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={brandingFilter} onValueChange={setBrandingFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Alle Brandings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Brandings</SelectItem>
                {brandings.map((branding) => (
                  <SelectItem key={branding.id} value={branding.id}>
                    {branding.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Leads gefunden</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Datum & Uhrzeit
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Voller Name
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefon
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Branding
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {format(new Date(lead.created_at), "dd.MM.yyyy, HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {lead.full_name}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`mailto:${lead.email}`} 
                          className="text-primary hover:underline"
                        >
                          {lead.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`tel:${lead.phone}`} 
                          className="text-primary hover:underline"
                        >
                          {lead.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        {lead.brandings?.name ? (
                          <Badge variant="secondary">
                            {lead.brandings.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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
    </div>
  );
}
