import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

interface Permission {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

function RoleFormDialog({
  role,
  open,
  onOpenChange,
}: {
  role?: Role;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'page']);
  const [name, setName] = useState(role?.name ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    role?.permissions.map((p) => p.id) ?? [],
  );

  const { data: allPermissions, isLoading: permsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/permissions');
      return res.data.data as Permission[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { name, permissionIds: selectedIds };
      if (role) {
        await api.patch(`/roles/${role.id}`, body);
      } else {
        await api.post('/roles', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: role ? t('Role updated') : t('Role created') });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: err.response?.data?.message || t('Failed to save role'),
        variant: 'destructive',
      });
    },
  });

  const togglePermission = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? t('Edit Role') : t('Create Role')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('Name')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Name')} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('Permissions')}</label>
            {permsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border p-2">
                {allPermissions?.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => togglePermission(p.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    {p.name}
                  </label>
                ))}
                {allPermissions?.length === 0 && (
                  <p className="text-sm text-slate-400">{t('No permissions available')}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? t('Saving...') : t('Save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminRolesPage() {
  const { t } = useTranslation(['common', 'page']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data as Role[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: t('Role deleted') });
    },
    onError: () => {
      toast({ title: t('Failed to delete role'), variant: 'destructive' });
    },
  });

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t('Roles')}</h2>
        <Button
          onClick={() => {
            setEditingRole(undefined);
            setShowForm(true);
          }}
        >
          {t('Create role')}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {roles && roles.length === 0 && <p className="text-slate-500">{t('No roles yet.')}</p>}

      {roles && roles.length > 0 && (
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{role.name}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRole(role);
                      setShowForm(true);
                    }}
                  >
                    {t('Edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(t('Delete role "{{name}}"?', { name: role.name }))) {
                        deleteMutation.mutate(role.id);
                      }
                    }}
                  >
                    {t('Delete')}
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <Badge key={p.id} variant="secondary">
                    {p.name}
                  </Badge>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-sm text-slate-400">{t('No permissions')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RoleFormDialog
          role={editingRole}
          open={showForm}
          onOpenChange={(v) => {
            if (!v) setShowForm(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
