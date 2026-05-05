'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Users, 
  Ticket as TicketIcon,
  PieChart,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const { selectedTenant, tenants } = useTenant();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const path = selectedTenant !== 'all' 
        ? `/analytics?tenant_id=${selectedTenant}` 
        : '/analytics';
      
      const data = await api.get(path);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedTenant]);

  if (loading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-400 bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/tickets" className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-black uppercase tracking-wider mb-2 transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Back to Tickets
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {selectedTenant === 'all' ? 'System Analytics' : `${tenants.find(t => t.id === selectedTenant)?.name || selectedTenant} Analytics`}
          </h1>
          <p className="text-zinc-500">
            {selectedTenant === 'all' ? 'Real-time performance metrics across all tenants.' : `Performance metrics for ${selectedTenant}.`}
          </p>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-all text-sm font-medium shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Tickets" 
          value={stats?.total_tickets || 0} 
          icon={<TicketIcon className="w-5 h-5 text-zinc-900" />}
          trend="+12% from last week"
        />
        <MetricCard 
          title="Avg. Resolution" 
          value={`${stats?.avg_resolution_time_min || 0}m`} 
          icon={<Clock className="w-5 h-5 text-zinc-900" />}
          trend="-2.4m improvement"
        />
        <MetricCard 
          title="Active Tenants" 
          value={Object.keys(stats?.tenant_distribution || {}).length} 
          icon={<Users className="w-5 h-5 text-zinc-900" />}
        />
        <MetricCard 
          title="High Priority" 
          value={stats?.priority_distribution?.high || 0} 
          icon={<TrendingUp className="w-5 h-5 text-red-500" />}
          trend="Action required"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority Breakdown */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-zinc-400" />
            <h3 className="font-bold text-zinc-900">Priority Distribution</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(stats?.priority_distribution || {}).map(([priority, count]: any) => (
              <DistributionBar 
                key={priority}
                label={priority ? (priority.charAt(0).toUpperCase() + priority.slice(1)) : 'Unknown'}
                value={count}
                total={stats?.total_tickets || 0}
                color={priority === 'high' ? 'bg-red-500' : 'bg-emerald-500'}
              />
            ))}
          </div>
        </div>

        {/* Tenant Activity (only shown in system-wide view) */}
        {!stats?.tenant_id && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              <h3 className="font-bold text-zinc-900">Tenant Volume</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(stats?.tenant_distribution || {}).map(([tenant, count]: any) => (
                <DistributionBar 
                  key={tenant}
                  label={tenant}
                  value={count}
                  total={stats?.total_tickets || 0}
                  color="bg-zinc-900"
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {stats && (
        <p className="text-[11px] text-zinc-400 text-center uppercase tracking-widest font-medium">
          Last updated: {new Date(stats.last_updated).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-xl">
          {icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-zinc-300" />
      </div>
      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
      <h2 className="text-3xl font-bold text-zinc-900 mt-1">{value}</h2>
      {trend && (
        <p className="text-xs text-zinc-400 mt-2 font-medium">{trend}</p>
      )}
    </div>
  );
}

function DistributionBar({ label, value, total, color }: any) {
  const percentage = Math.round((value / total) * 100) || 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-zinc-700">{label}</span>
        <span className="text-zinc-500">{value} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
