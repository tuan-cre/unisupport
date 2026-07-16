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
import { Plus, Pencil, Trash2, Undo2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-slate-100 text-slate-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function AdminAssetsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'assets' | 'licenses'>('assets');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
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

  const { data: assets, isLoading } = useQuery({
    queryKey: ['admin-assets'],
    queryFn: async () => {
      const r = await api.get('/assets');
      return r.data.data;
    },
  });

  const create = useMutation({
    mutationFn: (body: any) => api.post('/assets', body),
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
    mutationFn: ({ id, ...body }: any) => api.patch(`/assets/${id}`, body),
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
    mutationFn: (body: any) => api.post('/assets/licenses', body),
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
    mutationFn: (body: any) => api.post('/assets/checkouts', body),
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
          <h2 className="text-xl font-semibold text-slate-900">Assets & Inventory</h2>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Asset</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <select
                  className="rounded-md border border-slate-200 p-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="HARDWARE">Hardware</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="NETWORK">Network</option>
                  <option value="PERIPHERAL">Peripheral</option>
                  <option value="OTHER">Other</option>
                </select>
                <Input
                  placeholder="Serial number"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
                <Input
                  placeholder="Model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
                <Input
                  placeholder="Manufacturer"
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
                <Input
                  placeholder="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <Button onClick={() => create.mutate(form)} disabled={create.isPending}>
                  Create
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
            Assets
          </Button>
          <Button
            variant={tab === 'licenses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('licenses')}
          >
            Licenses
          </Button>
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {tab === 'assets' && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Input
              placeholder="Asset ID to assign"
              value={assignAssetId}
              onChange={(e) => setAssignAssetId(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="User ID"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-48"
            />
            <Button
              size="sm"
              onClick={() => assign.mutate()}
              disabled={!assignAssetId || !assignUserId}
            >
              Assign
            </Button>
          </div>

          {assets?.map((a: any) => (
            <Card key={a.id} className="mb-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={statusColors[a.status]}>{a.status}</Badge>
                      <span className="text-sm font-medium text-slate-900">{a.name}</span>
                      <span className="text-xs text-slate-400">({a.type})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {a.serialNumber && <span>S/N: {a.serialNumber}</span>}
                      {a.model && <span>Model: {a.model}</span>}
                      {a.manufacturer && <span>{a.manufacturer}</span>}
                      {a.checkouts?.filter((c: any) => !c.returnedAt).length > 0 && (
                        <span className="text-amber-600">
                          {a.checkouts.filter((c: any) => !c.returnedAt).length} checked out
                        </span>
                      )}
                    </div>
                    {a.assignments
                      ?.filter((as: any) => !as.returnedAt)
                      .map((as: any) => (
                        <p key={as.id} className="mt-1 text-xs text-blue-600">
                          Assigned to {as.user.firstName} {as.user.lastName}
                        </p>
                      ))}
                    {a.checkouts
                      ?.filter((c: any) => !c.returnedAt)
                      .map((c: any) => (
                        <div key={c.id} className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-amber-600">
                            Checked out to {c.user.firstName} {c.user.lastName}
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
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate(a.id)}>
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
                  Add License
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Software License</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="Name"
                    value={licForm.name}
                    onChange={(e) => setLicForm({ ...licForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="License key"
                    value={licForm.key}
                    onChange={(e) => setLicForm({ ...licForm, key: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Total seats"
                    value={licForm.seats}
                    onChange={(e) => setLicForm({ ...licForm, seats: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder="Used seats"
                    value={licForm.usedSeats}
                    onChange={(e) => setLicForm({ ...licForm, usedSeats: Number(e.target.value) })}
                  />
                  <Input
                    placeholder="Vendor"
                    value={licForm.vendor}
                    onChange={(e) => setLicForm({ ...licForm, vendor: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="Expiration"
                    value={licForm.expirationDate}
                    onChange={(e) => setLicForm({ ...licForm, expirationDate: e.target.value })}
                  />
                  <Input
                    placeholder="Asset ID (optional)"
                    value={licForm.assetId}
                    onChange={(e) => setLicForm({ ...licForm, assetId: e.target.value })}
                  />
                  <Button onClick={() => createLic.mutate(licForm)} disabled={createLic.isPending}>
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-2">
            {assets?.flatMap((a: any) =>
              a.licenses?.map((l: any) => (
                <Card key={l.id} className="mb-1">
                  <CardContent className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-900">{l.name}</span>
                        <span className="ml-2 text-xs text-slate-400">{l.vendor}</span>
                      </div>
                      <Badge
                        className={
                          l.seats - l.usedSeats > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {l.usedSeats}/{l.seats} used
                      </Badge>
                    </div>
                    {l.expirationDate && (
                      <p className="mt-1 text-xs text-slate-500">
                        Expires: {l.expirationDate.slice(0, 10)}
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
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-3">
              <Input
                defaultValue={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <Input
                defaultValue={editing.serialNumber || ''}
                placeholder="Serial number"
                onChange={(e) => setEditing({ ...editing, serialNumber: e.target.value })}
              />
              <Input
                defaultValue={editing.notes || ''}
                placeholder="Notes"
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
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
