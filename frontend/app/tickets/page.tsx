'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, Filter, ArrowRight, Clock, AlertTriangle, MessageSquare, Plus, Loader2, Bot, User, ChevronDown, BarChart3, Globe, Share2 } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function TicketsList() {
  const { tenants, selectedTenant, setSelectedTenant } = useTenant();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const filteredTickets = tickets.filter((ticket: any) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
                         ticket.email.toLowerCase().includes(query) || 
                         ticket.message.toLowerCase().includes(query) ||
                         ticket.id.toString().includes(query);
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const suggestions = searchQuery.length > 1 
    ? tickets.filter((t: any) => t.email.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const graphData = useMemo(() => {
    const nodes: any[] = [{ id: 'tenant', name: selectedTenant, val: 20, color: '#f43f5e' }];
    const links: any[] = [];
    const teams = new Set();

    filteredTickets.forEach((t: any) => {
      nodes.push({ id: `t-${t.id}`, name: t.email, val: 8, color: t.priority === 'high' ? '#ef4444' : '#ec4899', type: 'ticket' });
      links.push({ source: 'tenant', target: `t-${t.id}` });
      
      if (t.target_team) {
        teams.add(t.target_team);
        links.push({ source: `t-${t.id}`, target: `team-${t.target_team}` });
      }
    });

    Array.from(teams).forEach((team: any) => {
      nodes.push({ id: `team-${team}`, name: team, val: 12, color: '#8b5cf6', type: 'team' });
    });

    return { nodes, links };
  }, [filteredTickets, selectedTenant]);

  const [visualizerTab, setVisualizerTab] = useState('graph');

  useEffect(() => {
    setLoading(true);
    api.get(`/tickets?tenant_id=${selectedTenant}`)
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedTenant]);

  const router = useRouter();

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Support Inbox</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage and triage customer requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 text-zinc-700 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {tenants.find((t: any) => t.id === selectedTenant)?.name || selectedTenant}
            </button>
            
            {showTenantMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowTenantMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                  <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">
                    Switch Tenant
                  </div>
                  {tenants.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTenant(t.id);
                        setShowTenantMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors flex items-center justify-between ${selectedTenant === t.id ? 'bg-zinc-50 font-bold text-black' : 'text-zinc-600'}`}
                    >
                      {t.name}
                      {selectedTenant === t.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors z-10" />
            <input 
              type="text" 
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 w-full sm:w-64 transition-all bg-white shadow-sm"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <>
                <div className="fixed inset-0" onClick={() => setShowSuggestions(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl z-30 overflow-hidden py-1">
                   {suggestions.map((s: any) => (
                     <button
                        key={s.id}
                        onClick={() => {
                          router.push(`/tickets/${s.id}?tenant_id=${s.tenant_id}`);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 flex items-center justify-between group"
                     >
                        <span className="truncate text-zinc-700 font-medium">{s.email}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </button>
                   ))}
                </div>
              </>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm ${filterPriority !== 'all' ? 'bg-zinc-100 text-black border-zinc-300' : 'bg-white text-zinc-700'}`}
            >
              <Filter className="w-4 h-4" />
              {filterPriority === 'all' ? 'Filter' : `Priority: ${filterPriority}`}
            </button>
            
            {showFilterMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFilterMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                  {['all', 'high', 'medium', 'low'].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setFilterPriority(p);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors capitalize ${filterPriority === p ? 'bg-zinc-50 font-bold text-black' : 'text-zinc-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => setShowVisualizer(true)}
            className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Visualize
          </button>

          <Link href="/create" className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-md flex-shrink-0">
            <Plus className="w-4 h-4" />
            New
          </Link>
        </div>
      </div>

      {/* Visualizer Modal */}
      {showVisualizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowVisualizer(false)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-center bg-zinc-900 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">System Intelligence Graph</h2>
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">{selectedTenant} Ecosystem</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800">
                <button 
                  onClick={() => setVisualizerTab('graph')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${visualizerTab === 'graph' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Graph View
                </button>
                <button 
                  onClick={() => setVisualizerTab('graphql')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${visualizerTab === 'graphql' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  GraphQL Schema
                </button>
              </div>

              <button 
                onClick={() => setShowVisualizer(false)}
                className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-800/50 rounded-lg"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden relative bg-[#09090b]">
              {visualizerTab === 'graph' ? (
                <div className="w-full h-full">
                  <ForceGraph2D
                    graphData={graphData}
                    nodeLabel="name"
                    nodeAutoColorBy="color"
                    backgroundColor="#09090b"
                    linkColor={() => '#27272a'}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                      const label = node.name;
                      const fontSize = 12/globalScale;
                      ctx.font = `${fontSize}px Inter, system-ui`;
                      const textWidth = ctx.measureText(label).width;
                      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                      ctx.fillStyle = node.color || '#ec4899';
                      ctx.beginPath(); 
                      ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false); 
                      ctx.fill();

                      if (globalScale > 1.5) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#71717a';
                        ctx.fillText(label, node.x, node.y + (node.val / 2) + 5);
                      }
                    }}
                  />
                  <div className="absolute bottom-6 left-6 flex gap-4 pointer-events-none">
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-zinc-800 rounded-lg backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tenant</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-zinc-800 rounded-lg backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tickets</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-zinc-800 rounded-lg backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Teams</span>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full grid grid-cols-1 md:grid-cols-2">
                  {/* Query Side */}
                  <div className="p-8 border-r border-zinc-800 overflow-y-auto bg-zinc-900/30">
                    <h3 className="text-pink-500 text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                      GraphQL Query Definition
                    </h3>
                    <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
{`query GetTenantEcosystem($tenant: ID!) {
  tenant(id: $tenant) {
    name
    tickets {
      id
      customer {
        email
      }
      ai_analysis {
        priority
        suggested_reply
      }
      routing {
        team
      }
    }
  }
}`}
                    </pre>
                  </div>
                  
                  {/* Result Side */}
                  <div className="p-8 overflow-y-auto bg-black/40">
                    <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Dynamic Data Result
                    </h3>
                    <pre className="text-[11px] text-zinc-500 font-mono leading-relaxed">
{JSON.stringify({
  data: {
    tenant: {
      name: selectedTenant,
      tickets: filteredTickets.map(t => ({
        id: t.id,
        email: t.email,
        priority: t.priority,
        status: t.status,
        team: t.target_team || "Unassigned"
      }))
    }
  }
}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Graph-Engine v2.4 • Dynamic Multi-Tenant Resolution</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Loading inbox...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-zinc-50 border rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No tickets found</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-2 mb-6">
              {searchQuery || filterPriority !== 'all' 
                ? "No tickets match your search or filter criteria." 
                : "Your inbox is clear. When customers submit requests, they will appear here for triage."}
            </p>
            {!searchQuery && filterPriority === 'all' && (
              <Link href="/create" className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-md active:scale-95">
                Create a test ticket
              </Link>
            )}
            {(searchQuery || filterPriority !== 'all') && (
              <button 
                onClick={() => {setSearchQuery(''); setFilterPriority('all');}}
                className="text-sm font-bold text-black hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-sm text-left table-fixed">
              <thead className="bg-zinc-50/80 text-zinc-500 border-b border-zinc-200 text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-semibold w-[25%]">Customer</th>
                  <th className="px-6 py-3 font-semibold w-[40%]">Request</th>
                  <th className="px-6 py-3 font-semibold w-[15%]">Priority</th>
                  <th className="px-6 py-3 font-semibold w-[12%]">AI Draft</th>
                  <th className="px-6 py-3 font-semibold w-[8%] text-right pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredTickets.map((ticket: any) => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/tickets/${ticket.id}?tenant_id=${ticket.tenant_id}`)}
                  >
                    {/* Customer */}
                    <td className="px-6 py-4 truncate">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border flex items-center justify-center text-zinc-500 flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-zinc-900 truncate">{ticket.email}</span>
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Message Preview */}
                    <td className="px-6 py-4 truncate">
                      <div className="overflow-hidden">
                        <p className="text-zinc-900 font-medium truncate">
                          {ticket.message.split('\n')[0] || "Support Request"}
                        </p>
                        <p className="text-zinc-500 text-xs truncate mt-0.5">
                          {ticket.message}
                        </p>
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                        ticket.priority === 'high' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : ticket.priority === 'low'
                          ? 'bg-zinc-50 text-zinc-600 border-zinc-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ticket.priority === 'high' && <AlertTriangle className="w-3 h-3" />}
                        {ticket.priority || 'Pending'}
                      </span>
                    </td>

                    {/* AI Draft Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ticket.suggested_resolution ? (
                           <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                             <Bot className="w-3.5 h-3.5" />
                             Draft
                           </span>
                        ) : (
                           <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 px-2.5 py-1">
                             <Loader2 className="w-3.5 h-3.5 animate-spin" />
                             ...
                           </span>
                        )}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="inline-flex items-center justify-center p-1.5 text-zinc-400 group-hover:text-black transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
