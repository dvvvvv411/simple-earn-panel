import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Loader2, Eye } from "lucide-react";
import type { User } from "@/types/user";

interface UserTableProps {
  users: User[];
  loading: boolean;
  onUserDeleted: () => void;
  onUserEdit: (user: User) => void;
  onUserDetail: (user: User) => void;
}

export function UserTable({ users, loading, onUserDeleted, onUserEdit, onUserDetail }: UserTableProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      // Delete user from Supabase Auth (this will cascade to profiles due to RLS)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;

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
            <TableHead className="text-foreground">Telefon</TableHead>
            <TableHead className="text-foreground">Branding</TableHead>
            <TableHead className="text-foreground">Guthaben</TableHead>
            <TableHead className="text-foreground">Rolle</TableHead>
            <TableHead className="text-foreground">Erstellt</TableHead>
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
              <TableCell className="text-muted-foreground">
                {user.phone || '-'}
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
                <Badge 
                  variant={getUserRole(user) === 'admin' ? 'default' : 'outline'}
                  className={getUserRole(user) === 'admin' ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
                >
                  {getUserRole(user) === 'admin' ? 'Admin' : 'Benutzer'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString('de-DE')}
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