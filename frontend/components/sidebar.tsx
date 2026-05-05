'use client';

import Link from 'next/link';
import { Home, Ticket, PlusCircle, Settings, Layout, BarChart3, ChevronDown, Globe } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { useState } from 'react';

export function Sidebar() {
  const { tenants, selectedTenant, setSelectedTenant } = useTenant();
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  return (
    <div className="w-64 border-r bg-white h-screen flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs">R</div>
          Relay
        </div>
      </div>
      
      <div className="p-4 border-b bg-zinc-50/50">
        <div className="relative">
          <button 
            onClick={() => setShowTenantMenu(!showTenantMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate">{tenants.find(t => t.id === selectedTenant)?.name || selectedTenant}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${showTenantMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showTenantMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTenantMenu(false)} />
              <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 overflow-hidden py-1">
                <button
                  onClick={() => { setSelectedTenant('all'); setShowTenantMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 flex items-center justify-between ${selectedTenant === 'all' ? 'bg-zinc-50 font-bold text-black' : 'text-zinc-500'}`}
                >
                  System Wide
                  {selectedTenant === 'all' && <div className="w-1 h-1 rounded-full bg-black" />}
                </button>
                <div className="h-px bg-zinc-100 my-1" />
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTenant(t.id);
                      setShowTenantMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 flex items-center justify-between ${selectedTenant === t.id ? 'bg-zinc-50 font-bold text-black' : 'text-zinc-600'}`}
                  >
                    {t.name}
                    {selectedTenant === t.id && <div className="w-1 h-1 rounded-full bg-black" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium">
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Link>
        <Link href="/tickets" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium">
          <Ticket className="w-4 h-4" />
          All Tickets
        </Link>
        <Link href="/create" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium">
          <PlusCircle className="w-4 h-4" />
          New Ticket
        </Link>
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </div>
  );
}
