import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderType: string;
  senderName?: string;
  createdAt: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!convId || !email) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    try {
      const res = await fetch(
        `${baseUrl}/api/chat/conversations/${convId}/messages?email=${encodeURIComponent(email)}`,
        { signal: abortControllerRef.current.signal },
      );
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.data.messages || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }, [convId, email, baseUrl]);

  useEffect(() => {
    if (!started) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      abortControllerRef.current?.abort();
    };
  }, [started, fetchMessages]);

  const startChat = async () => {
    if (!email.trim()) return;
    setError('');
    try {
      const res = await fetch(`${baseUrl}/api/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorName: name || email.split('@')[0], visitorEmail: email }),
      });
      if (!res.ok) {
        setError('Failed to start chat');
        return;
      }
      const json = await res.json();
      setConvId(json.data.id);
      setMessages(json.data.messages || []);
      setStarted(true);
    } catch {
      setError('Failed to start chat');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !convId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${baseUrl}/api/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, senderName: name || email.split('@')[0] }),
      });
      if (!res.ok) return;
      setInput('');
      await fetchMessages();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col rounded-xl border bg-card shadow-2xl">
      <div className="flex items-center justify-between rounded-t-xl bg-blue-600 px-4 py-3 text-white">
        <span className="text-sm font-semibold">Live Chat</span>
        <button
          onClick={() => {
            setOpen(false);
            setError('');
            abortControllerRef.current?.abort();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex h-72 flex-col gap-2 overflow-y-auto p-3">
        {!started ? (
          <div className="flex flex-col gap-2 p-2">
            <p className="text-sm text-muted-foreground">
              Start a conversation with our support team.
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Your email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm"
            />
            <Button size="sm" onClick={startChat} disabled={!email.trim()}>
              Start chat
            </Button>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.senderType === 'VISITOR' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.senderType === 'VISITOR'
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {started && (
        <div className="flex gap-2 border-t p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            placeholder="Type a message..."
            className="text-sm"
          />
          <Button size="sm" onClick={sendMessage} disabled={!input.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
