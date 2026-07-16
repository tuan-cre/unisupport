import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import AdminLayout from './layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import { Clock } from 'lucide-react';

export default function AdminSlasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [resolutionTime, setResolutionTime] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const { data: slas, isLoading } = useQuery({
    queryKey: ['admin-slas'],
    queryFn: async () => {
      const res = await api.get('/slas');
      return res.data.data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name,
        description: description || undefined,
        priority,
        responseTime: parseInt(responseTime),
        resolutionTime: parseInt(resolutionTime),
        isDefault,
      };
      if (editing) {
        await api.patch(`/slas/${editing.id}`, body);
      } else {
        await api.post('/slas', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slas'] });
      toast({ title: editing ? 'SLA updated' : 'SLA created' });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/slas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slas'] });
      toast({ title: 'SLA deleted' });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
    setDescription('');
    setPriority('');
    setResponseTime('');
    setResolutionTime('');
    setIsDefault(false);
  };

  const openEdit = (sla: any) => {
    setEditing(sla);
    setName(sla.name);
    setDescription(sla.description ?? '');
    setPriority(sla.priority);
    setResponseTime(sla.responseTime.toString());
    setResolutionTime(sla.resolutionTime.toString());
    setIsDefault(sla.isDefault);
    setShowForm(true);
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-amber-100 text-amber-700',
    URGENT: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">SLA Policies</h2>
        <Button onClick={resetForm}>Create SLA</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {slas && slas.length === 0 && <p className="text-slate-500">No SLA policies yet.</p>}

      {slas && slas.length > 0 && (
        <div className="space-y-3">
          {slas.map((s: any) => (
            <div key={s.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{s.name}</h3>
                    {s.isDefault && <Badge>Default</Badge>}
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColors[s.priority] || ''}`}
                    >
                      {s.priority}
                    </span>
                  </div>
                  {s.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Response: {s.responseTime}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Resolution: {s.resolutionTime}m
                    </span>
                    {s.calendar && <span>Calendar: {s.calendar.name}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this SLA policy?')) deleteMutation.mutate(s.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Dialog
          open={showForm}
          onOpenChange={(v) => {
            if (!v) resetForm();
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit SLA' : 'Create SLA'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Response time (min)</label>
                  <Input
                    type="number"
                    min="1"
                    value={responseTime}
                    onChange={(e) => setResponseTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Resolution time (min)</label>
                  <Input
                    type="number"
                    min="1"
                    value={resolutionTime}
                    onChange={(e) => setResolutionTime(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Default SLA (applied to new tickets without priority match)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={
                    saveMutation.isPending ||
                    !name.trim() ||
                    !priority ||
                    !responseTime ||
                    !resolutionTime
                  }
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
