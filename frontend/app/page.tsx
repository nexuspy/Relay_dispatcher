'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { selectedTenant } = useTenant();
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analyticsPath = selectedTenant === 'all' ? '/analytics' : `/analytics?tenant_id=${selectedTenant}`;
        const ticketsPath = selectedTenant === 'all' ? '/tickets?tenant_id=acme_corp' : `/tickets?tenant_id=${selectedTenant}`; 
        
        const [statsData, ticketsData] = await Promise.all([
          api.get(analyticsPath),
          api.get(ticketsPath)
        ]);

        setStats(statsData);
        setTickets(ticketsData.slice(0, 10)); // Show more since we are scrolling
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTenant]);

  if (loading && !stats) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500">Welcome back to Relay Dispatcher.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
        <StatsCard title="Total Tickets" value={stats?.total_tickets?.toString() || "0"} icon={<Clock className="w-4 h-4" />} />
        <StatsCard title="High Priority" value={stats?.priority_distribution?.high?.toString() || "0"} icon={<AlertCircle className="w-4 h-4" />} />
        <StatsCard title="Avg. Resolution" value={`${stats?.avg_resolution_time_min || 0}m`} icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      <div className="bg-white border rounded-xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="font-semibold">Recent Tickets</h2>
          <Link href="/tickets" className="text-sm text-zinc-500 hover:text-black">View all</Link>
        </div>
        <div className="divide-y overflow-y-auto flex-1">
          {tickets.length > 0 ? tickets.map((ticket) => (
            <Link 
              key={ticket.id} 
              href={`/tickets/${ticket.id}?tenant_id=${ticket.tenant_id}`}
              className="p-6 hover:bg-zinc-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium group-hover:text-black">{ticket.email}</p>
                <p className="text-sm text-zinc-500 line-clamp-1">{ticket.message}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium px-2 py-1 bg-zinc-100 rounded-md uppercase">{ticket.status}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${ticket.priority === 'high' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'}`}>
                  {ticket.priority || 'New'}
                </span>
              </div>
            </Link>
          )) : (
            <div className="p-12 text-center text-zinc-400">No recent tickets.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">{title}</span>
        <div className="text-zinc-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
