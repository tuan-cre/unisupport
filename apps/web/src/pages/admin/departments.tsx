import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

interface Department {
  id: string;
  name: string;
}

function DepartmentFormDialog({
  dept,
  open,
  onOpenChange,
}: {
  dept?: Department;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [name, setName] = useState(dept?.name ?? '');

  const mutation = useMutation({
    mutationFn: async () => {
      if (dept) {
        await api.patch(`/departments/${dept.id}`, { name });
      } else {
        await api.post('/departments', { name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: dept ? t('Department updated') : t('Department created') });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: err.response?.data?.message || t('Failed to save department'),
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dept ? t('Edit Department') : t('Create Department')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('Name')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Name')} />
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

export default function AdminDepartmentsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | undefined>(undefined);

  const { data: depts, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data.data as Department[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: t('Department deleted') });
    },
    onError: () => {
      toast({ title: t('Failed to delete department'), variant: 'destructive' });
    },
  });

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t('Departments')}</h2>
        <Button
          onClick={() => {
            setEditingDept(undefined);
            setShowForm(true);
          }}
        >
          {t('Create department')}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {depts && depts.length === 0 && (
        <p className="text-muted-foreground">{t('No departments yet.')}</p>
      )}

      {depts && depts.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted text-left text-sm font-medium text-muted-foreground">
                    <th className="px-4 py-3">{t('Name')}</th>
                    <th className="px-4 py-3 text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{d.name}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingDept(d);
                              setShowForm(true);
                            }}
                          >
                            {t('Edit')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(t('Delete department "{{name}}"?', { name: d.name }))) {
                                deleteMutation.mutate(d.id);
                              }
                            }}
                          >
                            {t('Delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {depts.map((d) => (
              <div key={d.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{d.name}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDept(d);
                        setShowForm(true);
                      }}
                    >
                      {t('Edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(t('Delete department "{{name}}"?', { name: d.name }))) {
                          deleteMutation.mutate(d.id);
                        }
                      }}
                    >
                      {t('Delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <DepartmentFormDialog
          dept={editingDept}
          open={showForm}
          onOpenChange={(v) => {
            if (!v) setShowForm(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
