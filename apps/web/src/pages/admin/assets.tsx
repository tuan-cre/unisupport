import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import ConfirmDialog from '../../components/confirm-dialog';
import { Plus, Pencil, Trash2, Undo2 } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  notes?: string;
  assignments?: Assignment[];
  checkouts?: Checkout[];
  licenses?: License[];
}

interface Assignment {
  id: string;
  returnedAt?: string;
  user: { id: string; firstName: string; lastName: string };
}

interface Checkout {
  id: string;
  returnedAt?: string;
  user: { id: string; firstName: string; lastName: string };
}

interface License {
  id: string;
  name: string;
  key?: string;
  seats: number;
  usedSeats: number;
  vendor?: string;
  expirationDate?: string;
  notes?: string;
}

interface AssetForm {
  name: string;
  type: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  notes: string;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-slate-100 text-slate-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function AdminAssetsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'assets' | 'licenses'>('assets');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'HARDWARE',
    serialNumber: '',
    model: '',
    manufacturer: '',
    notes: '',
  });
  const [licForm, setLicForm] = useState({
    name: '',
    key: '',
    seats: 1,
    usedSeats: 0,
    vendor: '',
    notes: '',
    assetId: '',
    expirationDate: '',
  });
  const [assignAssetId, setAssignAssetId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['admin-assets'],
    queryFn: async () => {
      const r = await api.get('/assets');
      return r.data.data as Asset[];
    },
  });

  const create = useMutation({
    mutationFn: (body: AssetForm) => api.post('/assets', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      setShowCreate(false);
      setForm({
        name: '',
        type: 'HARDWARE',
        serialNumber: '',
        model: '',
        manufacturer: '',
        notes: '',
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<AssetForm>) =>
      api.patch(`/assets/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/assets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-assets'] }),
  });

  const assign = useMutation({
    mutationFn: () => api.post(`/assets/${assignAssetId}/assign/${assignUserId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      setAssignAssetId('');
      setAssignUserId('');
    },
  });

  const createLic = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/assets/licenses', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-assets'] });
      setLicForm({
        name: '',
        key: '',
        seats: 1,
        usedSeats: 0,
        vendor: '',
        notes: '',
        assetId: '',
        expirationDate: '',
      });
    },
  });

  const checkout = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/assets/checkouts', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-assets'] }),
  });

  const checkin = useMutation({
    mutationFn: (id: string) => api.patch(`/assets/checkouts/${id}/checkin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-assets'] }),
  });

  return (
    <AdminLayout>
      <div className="mb-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{t('Assets & Inventory')}</h2>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                {t('Add Asset')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('New Asset')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Input
                  placeholder={t('Name')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <select
                  className="rounded-md border border-border p-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="HARDWARE">{t('Hardware')}</option>
                  <option value="SOFTWARE">{t('Software')}</option>
                  <option value="NETWORK">{t('Network')}</option>
                  <option value="PERIPHERAL">{t('Peripheral')}</option>
                  <option value="OTHER">{t('Other')}</option>
                </select>
                <Input
                  placeholder={t('Serial number')}
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
                <Input
                  placeholder={t('Model')}
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
                <Input
                  placeholder={t('Manufacturer')}
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
                <Input
                  placeholder={t('Notes')}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <Button onClick={() => create.mutate(form)} disabled={create.isPending}>
                  {t('Create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 flex gap-2">
          <Button
            variant={tab === 'assets' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('assets')}
          >
            {t('Assets')}
          </Button>
          <Button
            variant={tab === 'licenses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('licenses')}
          >
            {t('Licenses')}
          </Button>
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {tab === 'assets' && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Input
              placeholder={t('Asset ID to assign')}
              value={assignAssetId}
              onChange={(e) => setAssignAssetId(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder={t('User ID')}
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-48"
            />
            <Button
              size="sm"
              onClick={() => assign.mutate()}
              disabled={!assignAssetId || !assignUserId}
            >
              {t('Assign')}
            </Button>
          </div>

          {assets?.map((a: Asset) => (
            <Card key={a.id} className="mb-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={statusColors[a.status]}>{a.status}</Badge>
                      <span className="text-sm font-medium text-foreground">{a.name}</span>
                      <span className="text-xs text-muted-foreground">({a.type})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {a.serialNumber && <span>S/N: {a.serialNumber}</span>}
                      {a.model && (
                        <span>
                          {t('Model')}: {a.model}
                        </span>
                      )}
                      {a.manufacturer && <span>{a.manufacturer}</span>}
                      {(a.checkouts?.filter((c: Checkout) => !c.returnedAt)?.length ?? 0) > 0 && (
                        <span className="text-amber-600">
                          {a.checkouts!.filter((c: Checkout) => !c.returnedAt).length}{' '}
                          {t('checked out')}
                        </span>
                      )}
                    </div>
                    {a.assignments
                      ?.filter((as: Assignment) => !as.returnedAt)
                      .map((as: Assignment) => (
                        <p key={as.id} className="mt-1 text-xs text-blue-600">
                          {t('Assigned to')} {as.user.firstName} {as.user.lastName}
                        </p>
                      ))}
                    {a.checkouts
                      ?.filter((c: Checkout) => !c.returnedAt)
                      .map((c: Checkout) => (
                        <div key={c.id} className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-amber-600">
                            {t('Checked out to')} {c.user.firstName} {c.user.lastName}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => checkin.mutate(c.id)}>
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {tab === 'licenses' && (
        <>
          <div className="mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  {t('Add License')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('New Software License')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder={t('Name')}
                    value={licForm.name}
                    onChange={(e) => setLicForm({ ...licForm, name: e.target.value })}
                  />
                  <Input
                    placeholder={t('License key')}
                    value={licForm.key}
                    onChange={(e) => setLicForm({ ...licForm, key: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder={t('Total seats')}
                    value={licForm.seats}
                    onChange={(e) => setLicForm({ ...licForm, seats: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder={t('Used seats')}
                    value={licForm.usedSeats}
                    onChange={(e) => setLicForm({ ...licForm, usedSeats: Number(e.target.value) })}
                  />
                  <Input
                    placeholder={t('Vendor')}
                    value={licForm.vendor}
                    onChange={(e) => setLicForm({ ...licForm, vendor: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder={t('Expiration')}
                    value={licForm.expirationDate}
                    onChange={(e) => setLicForm({ ...licForm, expirationDate: e.target.value })}
                  />
                  <Input
                    placeholder={t('Asset ID (optional)')}
                    value={licForm.assetId}
                    onChange={(e) => setLicForm({ ...licForm, assetId: e.target.value })}
                  />
                  <Button onClick={() => createLic.mutate(licForm)} disabled={createLic.isPending}>
                    {t('Create')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-2">
            {assets?.flatMap((a: Asset) =>
              a.licenses?.map((l: License) => (
                <Card key={l.id} className="mb-1">
                  <CardContent className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground">{l.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{l.vendor}</span>
                      </div>
                      <Badge
                        className={
                          l.seats - l.usedSeats > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {l.usedSeats}/{l.seats} {t('used')}
                      </Badge>
                    </div>
                    {l.expirationDate && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('Expires')}: {l.expirationDate.slice(0, 10)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )),
            )}
          </div>
        </>
      )}

      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit Asset')}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-3">
              <Input
                defaultValue={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <Input
                defaultValue={editing.serialNumber || ''}
                placeholder={t('Serial number')}
                onChange={(e) => setEditing({ ...editing, serialNumber: e.target.value })}
              />
              <Input
                defaultValue={editing.notes || ''}
                placeholder={t('Notes')}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
              <Button
                onClick={() =>
                  update.mutate({
                    id: editing.id,
                    name: editing.name,
                    serialNumber: editing.serialNumber,
                    notes: editing.notes,
                  })
                }
                disabled={update.isPending}
              >
                {t('Save')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => (deleteId ? remove.mutate(deleteId) : Promise.resolve())}
        title={t('Delete?')}
        confirmLabel={t('Delete')}
      />
    </AdminLayout>
  );
}
