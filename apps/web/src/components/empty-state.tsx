import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'Nothing here',
  message = 'No items found',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileQuestion className="mb-4 h-12 w-12 text-slate-300" />
      <h3 className="text-base font-medium text-slate-500">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
