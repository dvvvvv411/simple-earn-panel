import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Loader2, Eye, ArrowUp, ArrowDown, User as UserIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import type { User } from "@/types/user";
import { ConsultantAssignDialog } from "./ConsultantAssignDialog";

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
  consultants: { id: string; name: string }[];
  onConsultantAssign: (userId: string, consultantId: string) => void;
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
  onSortChange,
  consultants,
  onConsultantAssign
}: UserTableProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [consultantDialogUser, setConsultantDialogUser] = useState<User | null>(null);

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

  const getKYCStatusDot = (status: User['kycStatus']) => {
    const statusConfig = {
      verifiziert: { color: 'bg-green-500', title: 'Verifiziert' },
      abgelehnt: { color: 'bg-red-500', title: 'Abgelehnt' },
      in_pruefung: { color: 'bg-blue-500', title: 'In Prüfung' },
      offen: { color: 'bg-amber-500', title: 'Offen' },
      nicht_angefordert: { color: 'bg-gray-400', title: 'Nicht erforderlich' }
    };
    
    const config = statusConfig[status || 'nicht_angefordert'];
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${config.color}`} />
              <span className="text-sm text-muted-foreground">{config.title}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
    <>
      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">E-Mail</TableHead>
              <TableHead className="text-foreground">Branding</TableHead>
              <SortableHeader field="balance">Guthaben</SortableHeader>
              <TableHead className="text-foreground">KYC</TableHead>
              <SortableHeader field="last_activity">Letzte Aktivität</SortableHeader>
              <SortableHeader field="created_at">Registrierungsdatum</SortableHeader>
              <TableHead className="text-foreground">Pechsträhne</TableHead>
              <TableHead className="text-foreground">Berater</TableHead>
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
                    <span className="text-sm text-foreground">
                      {user.branding.name}
                    </span>
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
                  {getKYCStatusDot(user.kycStatus)}
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
                  <button
                    onClick={() => setConsultantDialogUser(user)}
                    className="flex items-center gap-1.5 hover:underline text-primary cursor-pointer text-sm"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    {user.consultant?.name || (
                      <span className="text-muted-foreground italic">Kein Berater</span>
                    )}
                  </button>
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

      <ConsultantAssignDialog
        open={!!consultantDialogUser}
        onOpenChange={(open) => !open && setConsultantDialogUser(null)}
        consultants={consultants}
        currentConsultantId={consultantDialogUser?.consultant_id}
        onAssign={(consultantId) => {
          if (consultantDialogUser) {
            onConsultantAssign(consultantDialogUser.id, consultantId);
          }
        }}
      />
    </>
  );
}