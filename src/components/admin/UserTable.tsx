import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Loader2, Eye, ShieldCheck, ShieldX, ShieldAlert, Clock, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import type { User } from "@/types/user";

export type SortField = 'balance' | 'last_activity' | 'created_at';
export type SortDirection = 'asc' | 'desc';

interface UserTableProps {
  users: User[];
  loading: boolean;
  onUserDeleted: () => void;
  onUserEdit: (user: User) => void;
  onUserDetail: (user: User) => void;
  onUnluckyStreakToggle: (userId: string, value: boolean) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
}

export function UserTable({ 
  users, 
  loading, 
  onUserDeleted, 
  onUserEdit, 
  onUserDetail, 
  onUnluckyStreakToggle,
  sortField,
  sortDirection,
  onSortChange
}: UserTableProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      // Call Edge Function to delete user (requires service_role key)
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Erfolg",
        description: "Benutzer wurde erfolgreich gelöscht.",
      });
      
      onUserDeleted();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fehler",
        description: error.message || "Benutzer konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const getDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email || 'Unbekannt';
  };

  const getUserRole = (user: User) => {
    if (!user.roles || user.roles.length === 0) return 'user';
    return user.roles[0].role;
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(balance);
  };

  const formatRegistrationDate = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: de });
  };

  const getKYCStatusBadge = (status: User['kycStatus']) => {
    switch (status) {
      case 'verifiziert':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verifiziert
          </Badge>
        );
      case 'abgelehnt':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
            <ShieldX className="h-3 w-3 mr-1" />
            Abgelehnt
          </Badge>
        );
      case 'in_pruefung':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            In Prüfung
          </Badge>
        );
      case 'offen':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Offen
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Nicht erforderlich
          </Badge>
        );
    }
  };

  const getLastActivityDisplay = (user: User) => {
    if (!user.lastActivity?.lastActiveAt) {
      return <span className="text-muted-foreground">Noch nie</span>;
    }

    if (user.lastActivity.isOnline) {
      return (
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Online
        </span>
      );
    }

    return (
      <span className="text-muted-foreground">
        {formatDistanceToNow(new Date(user.lastActivity.lastActiveAt), { 
          addSuffix: true,
          locale: de 
        })}
      </span>
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="text-foreground cursor-pointer hover:bg-accent/50 transition-colors select-none"
      onClick={() => onSortChange(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' 
            ? <ArrowUp className="h-4 w-4" /> 
            : <ArrowDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Benutzer werden geladen...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Keine Benutzer gefunden.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground">Name</TableHead>
            <TableHead className="text-foreground">E-Mail</TableHead>
            <TableHead className="text-foreground">Branding</TableHead>
            <SortableHeader field="balance">Guthaben</SortableHeader>
            <TableHead className="text-foreground">KYC-Status</TableHead>
            <SortableHeader field="last_activity">Letzte Aktivität</SortableHeader>
            <SortableHeader field="created_at">Registrierungsdatum</SortableHeader>
            <TableHead className="text-foreground">Pechsträhne</TableHead>
            <TableHead className="text-foreground">Rolle</TableHead>
            <TableHead className="text-right text-foreground">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-foreground">
                {getDisplayName(user)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.email || '-'}
              </TableCell>
              <TableCell>
                {user.branding ? (
                  <Badge variant="secondary" className="bg-accent/50 text-foreground">
                    {user.branding.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className={`font-medium ${user.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatBalance(user.balance)}
                </span>
              </TableCell>
              <TableCell>
                {getKYCStatusBadge(user.kycStatus)}
              </TableCell>
              <TableCell>
                {getLastActivityDisplay(user)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRegistrationDate(user.created_at)}
              </TableCell>
              <TableCell>
                <Switch
                  checked={user.unlucky_streak || false}
                  onCheckedChange={(checked) => onUnluckyStreakToggle(user.id, checked)}
                />
              </TableCell>
              <TableCell>
                <Badge 
                  variant={getUserRole(user) === 'admin' ? 'default' : 'outline'}
                  className={getUserRole(user) === 'admin' ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
                >
                  {getUserRole(user) === 'admin' ? 'Admin' : 'Benutzer'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUserDetail(user)}
                    className="h-8 w-8 p-0 border-input hover:bg-accent/50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUserEdit(user)}
                    className="h-8 w-8 p-0 border-input hover:bg-accent/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingUserId === user.id}
                        className="h-8 w-8 p-0 border-destructive text-destructive hover:bg-destructive/10"
                      >
                        {deletingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">
                          Benutzer löschen
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Sind Sie sicher, dass Sie {getDisplayName(user)} löschen möchten? 
                          Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-input hover:bg-accent/50">
                          Abbrechen
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}