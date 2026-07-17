import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';
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
import { Plus } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

function UserEditDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [roleId, setRoleId] = useState(user.role?.id ?? '');
  const [departmentId, setDepartmentId] = useState(user.department?.id ?? '');
  const [status, setStatus] = useState(user.status);

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data as Role[];
    },
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data.data as Department[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = {};
      if (roleId !== (user.role?.id ?? '')) body.roleId = roleId || '';
      if (departmentId !== (user.department?.id ?? '')) body.departmentId = departmentId || '';
      if (status !== user.status) body.status = status;
      await api.patch(`/users/${user.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: t('User updated') });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: t('Failed to update user'), variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('Role')}</label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder={t('No role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('No role')}</SelectItem>
                {rolesData?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('Department')}</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder={t('No department')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('No department')}</SelectItem>
                {deptsData?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('Status')}</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t('Active')}</SelectItem>
                <SelectItem value="INACTIVE">{t('Inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? t('Saving...') : t('Save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const { t, ready } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleId: '',
  });

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('q', search);
      const res = await api.get(`/users?${params}`);
      return { users: res.data.data as User[], meta: res.data.meta };
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data as Role[];
    },
  });

  const createUser = useMutation({
    mutationFn: (body: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      roleId?: string;
    }) => api.post('/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setCreateForm({ email: '', firstName: '', lastName: '', password: '', roleId: '' });
      toast({ title: t('User created') });
    },
    onError: () => {
      toast({ title: t('Failed to create user'), variant: 'destructive' });
    },
  });

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t('Users')}</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('Create User')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Create User')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              <Input
                placeholder={t('Email')}
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
              <Input
                placeholder={t('First name')}
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
              />
              <Input
                placeholder={t('Last name')}
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              />
              <Input
                type="password"
                placeholder={t('Password')}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('Role')}</label>
                <Select
                  value={createForm.roleId}
                  onValueChange={(v) => setCreateForm({ ...createForm, roleId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('No role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('No role')}</SelectItem>
                    {rolesData?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createUser.mutate(createForm)}
                disabled={createUser.isPending || !createForm.email || !createForm.password}
              >
                {createUser.isPending ? t('Creating...') : t('Create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t('Search users...')}
          className="max-w-xs"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {data && data.users.length === 0 && (
        <p className="text-muted-foreground">{t('No users found.')}</p>
      )}

      {data && data.users.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Name')}</TableHead>
                  <TableHead>{t('Email')}</TableHead>
                  <TableHead>{t('Role')}</TableHead>
                  <TableHead>{t('Department')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">
                      {u.firstName} {u.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {u.role?.name ?? <span className="text-muted-foreground">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      {u.department?.name ?? <span className="text-muted-foreground">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setEditingUser(u)}>
                        {t('Edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('Page')} {data?.meta?.page} {t('of')} {data?.meta?.totalPages} ({data?.meta?.total}{' '}
              {t('users')})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data?.meta?.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('Next')}
              </Button>
            </div>
          </div>
        </>
      )}

      {editingUser && (
        <UserEditDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(v) => {
            if (!v) setEditingUser(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
