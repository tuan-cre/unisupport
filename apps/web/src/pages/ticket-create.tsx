import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import AppLayout from '../components/app-layout';

const TICKET_TYPES = ['INCIDENT', 'SERVICE_REQUEST', 'PROBLEM', 'CHANGE_REQUEST'];

function RelatedArticles({ query }: { query: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['kb-suggest', query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      const res = await api.get(`/kb/articles/search?q=${encodeURIComponent(query)}`);
      return res.data.data as { id: string; title: string; slug: string }[];
    },
    enabled: query.length >= 3,
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
      <p className="mb-1.5 text-xs font-medium text-blue-700">{t('page.knowledgeBase')}</p>
      <div className="flex flex-wrap gap-1.5">
        {data.map((a) => (
          <a
            key={a.id}
            href={`/kb/${a.slug}`}
            target="_blank"
            className="rounded-md bg-card px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {a.title}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function CreateTicketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [type, setType] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.get('/tags');
      return res.data.data as { id: string; name: string; color?: string }[];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await api.get('/templates');
      return res.data.data as {
        id: string;
        name: string;
        subject: string;
        description: string;
        priority: string;
        departmentId?: string;
      }[];
    },
  });

  useEffect(() => {
    if (selectedTemplate && templates) {
      const tmpl = templates.find((t) => t.id === selectedTemplate);
      if (tmpl) {
        setSubject(tmpl.subject);
        setDescription(tmpl.description);
        setPriority(tmpl.priority);
      }
    }
  }, [selectedTemplate, templates]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/tickets', {
        subject,
        description,
        priority,
        type: type || undefined,
        tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      });
      const ticketId = res.data.data.id;
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        await api.post(`/tickets/${ticketId}/attachments`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return ticketId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/tickets');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || t('common.error');
      const lower = msg.toLowerCase();
      if (lower.includes('subject')) setErrors((prev) => ({ ...prev, subject: msg }));
      else if (lower.includes('description')) setErrors((prev) => ({ ...prev, description: msg }));
      else setGeneralError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    const fieldErrors: Record<string, string> = {};
    if (!subject || subject.length < 3) fieldErrors.subject = t('common.subjectMinError');
    if (!description || description.length < 10)
      fieldErrors.description = t('common.descriptionMinError');
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    mutation.mutate();
  };

  return (
    <AppLayout>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('page.createTicket')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{generalError}</p>
            )}

            {templates && templates.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('common.useTemplateOptional')}
                </label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('common.selectTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('common.noTemplate')}</SelectItem>
                    {templates.map((tmpl) => (
                      <SelectItem key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('ticket.subject')}
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={errors.subject ? 'border-red-400' : ''}
              />
              {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
            </div>

            <RelatedArticles query={subject} />

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('ticket.description')}
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className={errors.description ? 'border-red-400' : ''}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('ticket.type')}
                </label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('common.noType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('common.noType')}</SelectItem>
                    {TICKET_TYPES.map((ticketType) => (
                      <SelectItem key={ticketType} value={ticketType}>
                        {ticketType.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('ticket.priority')}
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{t('common.low')}</SelectItem>
                    <SelectItem value="MEDIUM">{t('common.medium')}</SelectItem>
                    <SelectItem value="HIGH">{t('common.high')}</SelectItem>
                    <SelectItem value="URGENT">{t('common.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tags && tags.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t('ticket.tags')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                      style={
                        tag.color && !selectedTagIds.includes(tag.id)
                          ? { backgroundColor: tag.color + '20', color: tag.color }
                          : undefined
                      }
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t('common.attachmentsOptional')}
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
                />
              </div>
              {files.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {files.map((f, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.creatingTicket') : t('common.createTicket')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
