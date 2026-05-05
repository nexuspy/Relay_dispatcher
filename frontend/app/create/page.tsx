'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';

export default function CreateTicket() {
  const router = useRouter();
  const { tenants, selectedTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenant_id: selectedTenant,
    email: '',
    message: ''
  });

  // Keep tenant_id in sync with global context if it hasn't been changed manually
  useEffect(() => {
    if (selectedTenant !== 'all') {
      setFormData(prev => ({ ...prev, tenant_id: selectedTenant }));
    } else if (tenants.length > 0) {
      // Default to first real tenant if 'all' is selected
      setFormData(prev => ({ ...prev, tenant_id: tenants[0].id }));
    }
  }, [selectedTenant, tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post('/tickets', formData);
      router.push(`/tickets/${data.ticket_id}?tenant_id=${formData.tenant_id}`);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('Error creating ticket. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Ticket</h1>
        <p className="text-zinc-500">Submit a support request to be processed by the AI Agent.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-8 space-y-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tenant</label>
          <select 
            value={formData.tenant_id}
            onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
            required
          >
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Email</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            placeholder="customer@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <textarea 
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[150px]"
            placeholder="Describe the issue..."
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI Agent Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Ticket
            </>
          )}
        </button>
      </form>
    </div>
  );
}
