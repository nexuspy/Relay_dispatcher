'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Brain, User, Bot, Clock, AlertTriangle, Send, CheckCircle2, FileText, Zap, ChevronDown, ChevronRight, Loader2, Link as LinkIcon, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

function tryParseJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function cleanResolution(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.suggested_resolution || text;
    } catch {
      return text;
    }
  }
  return text;
}

export default function TicketDetail() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant_id') || 'acme_corp';
  
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');

  const fetchTicket = () => {
    api.get(`/tickets/${id}?tenant_id=${tenantId}`)
      .then(data => {
        setTicket(data);
        setReplyText(cleanResolution(data.suggested_resolution));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Polling for background triage results
  useEffect(() => {
    let interval: any;
    if (ticket && (!ticket.priority || ticket.priority === 'Processing...')) {
      interval = setInterval(() => {
        fetchTicket();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ticket?.priority]);

  const handleSendReply = async () => {
    const message = (document.getElementById('reply-textarea') as HTMLTextAreaElement)?.value;
    if (!message) return;
    
    setSending(true);
    try {
      await api.post(`/tickets/${id}/reply`, { message });
      alert('Reply sent and ticket resolved!');
      fetchTicket();
    } catch (err) {
      console.error(err);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    try {
      await api.patch(`/tickets/${id}`, { 
        priority: 'high', 
        status: 'open',
        tenant_id: tenantId 
      });
      alert('Ticket escalated to High priority.');
      fetchTicket();
    } catch (err) {
      console.error(err);
      alert('Failed to escalate');
    }
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8 text-zinc-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      Loading ticket...
    </div>
  );
  
  if (error) return (
    <div className="p-8 max-w-5xl mx-auto space-y-4">
      <Link href="/tickets" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to All Tickets
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <p className="text-sm text-red-700">Failed to load ticket: {error}</p>
      </div>
    </div>
  );
  
  if (!ticket) return <div className="p-8">Ticket not found.</div>;

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-8 space-y-8 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-3">
          <Link href="/tickets" className="text-zinc-400 hover:text-black hover:bg-zinc-100 p-2 rounded-lg transition-colors border border-transparent hover:border-zinc-200">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center shadow-sm">
              <TicketIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 leading-tight">Ticket #{ticket.id}</h1>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{ticket.tenant_id}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            AI Draft Ready
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Conversation */}
        <div className="flex-1 min-w-0 space-y-6">
          
          {/* Subject Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 leading-snug mb-4 pr-12">
              {ticket.message.split('\n')[0] || "Support Request"}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                ticket.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                ticket.priority ? 'bg-zinc-100 text-zinc-700 border-zinc-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {ticket.priority === 'high' && <AlertTriangle className="w-3 h-3" />}
                {ticket.priority ? `${ticket.priority} Priority` : 'Pending'}
              </span>
              <span className="bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                {ticket.status}
              </span>
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 ml-auto">
                <Clock className="w-3.5 h-3.5" />
                {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Conversation Feed */}
          <div className="space-y-8 py-4">
            
            {/* Customer Message */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0 text-zinc-500 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900">{ticket.email}</span>
                  <span className="text-[11px] text-zinc-400 font-medium">Customer</span>
                </div>
                <div className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed mt-1">
                  {ticket.message}
                </div>
              </div>
            </div>

            {/* AI Response Draft */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-black border border-zinc-200 flex items-center justify-center flex-shrink-0 text-white shadow-sm ring-4 ring-zinc-50">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900">Relay AI Agent</span>
                  <span className="text-[11px] text-zinc-400 font-medium">Automated Draft</span>
                </div>
                
                <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl rounded-tl-sm mt-2 shadow-sm">
                  <div className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {cleanResolution(ticket.suggested_resolution) || <span className="text-zinc-400 italic">No resolution suggested yet.</span>}
                  </div>
                  
                  {/* AI Reasoning Collapsible */}
                  {ticket.logs && ticket.logs.length > 0 && (
                    <div className="mt-5 border-t border-zinc-200 pt-4">
                      <button 
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-black transition-colors group"
                      >
                        <Brain className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                        Agent Reasoning Logs
                        {showReasoning ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                      </button>
                      
                      {showReasoning && (
                        <div className="mt-4 space-y-3">
                          {ticket.logs.map((log: any) => (
                            <div key={log.id} className="border-l-2 border-zinc-300 pl-4 py-1">
                              <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-2">{log.step}</p>
                              <pre className="text-[11px] bg-white border border-zinc-200 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-zinc-700 font-mono shadow-sm">
                                {tryParseJSON(log.output)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Inline Reply Editor (Replaces fixed footer) */}
          <div id="reply-section" className="mt-8 pt-8 border-t border-zinc-200">
            <div className="bg-white border border-zinc-300 rounded-xl p-4 shadow-sm focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <textarea 
                id="reply-textarea"
                className="w-full bg-transparent border-none focus:ring-0 text-sm min-h-[150px] resize-y outline-none leading-relaxed text-zinc-800 placeholder-zinc-400" 
                placeholder="Type your reply here or review the AI draft..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t border-zinc-100 gap-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Pre-filled by AI
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-[11px] font-bold text-zinc-500 group-hover:text-black uppercase tracking-wider transition-colors">Approve Draft</span>
                    <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer" defaultChecked />
                  </label>
                  <button 
                    disabled={sending}
                    onClick={handleSendReply}
                    className="flex-1 sm:flex-none bg-black hover:bg-zinc-800 text-white font-medium py-2 px-5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Sidebar */}
        <aside className="w-full lg:w-80 space-y-6 flex-shrink-0">
          
          {/* Customer Profile */}
          <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-4">Customer Details</h3>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-zinc-900 truncate">{ticket.email}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <LinkIcon className="w-3 h-3 text-zinc-400" />
                  <p className="text-xs text-zinc-500 truncate">{ticket.email.split('@')[1]}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4">
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Total Tickets</p>
                <p className="text-lg font-bold text-zinc-900">{ticket.customer_ticket_count || 1}</p>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Status</p>
                <p className="text-lg font-bold text-emerald-600">Active</p>
              </div>
            </div>
          </section>

          {/* Metadata Section */}
          <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-4">Ticket Context</h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium">Assigned To</span>
                <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                  <Bot className="w-3 h-3 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-700">AI Agent</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium">Tenant</span>
                <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wide">
                  {ticket.tenant_id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium">Source</span>
                <span className="text-xs font-semibold text-zinc-900">
                  Email
                </span>
              </div>
            </div>
          </section>

          {/* Smart Actions */}
          <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-zinc-900">Smart Actions</h3>
            </div>
            <div className="space-y-2.5">
              <button 
                onClick={() => {
                  const el = document.getElementById('reply-textarea');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => el.focus(), 500);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all text-left group shadow-sm"
              >
                <div className="bg-white border border-zinc-200 p-1.5 rounded-md group-hover:border-zinc-300 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-black transition-colors" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 group-hover:text-black">Review AI Draft</span>
              </button>
              
              <button 
                onClick={handleEscalate}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-all text-left group shadow-sm"
              >
                <div className="bg-white border border-red-200 p-1.5 rounded-md shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                </div>
                <span className="text-sm font-bold text-red-700">Escalate to Human</span>
              </button>
            </div>
          </section>

        </aside>
      </div>

    </div>
  );
}
