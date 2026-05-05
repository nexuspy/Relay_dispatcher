'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Bell, Shield, Bot, Loader2, Eye, EyeOff, Globe, Mail, Smartphone } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { selectedTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agent');
  const [showKey, setShowKey] = useState(false);
  
  const [settings, setSettings] = useState({
    tenant_id: selectedTenant,
    auto_triage_enabled: true,
    default_model: 'gemini-1.5-flash-latest',
    max_retry_attempts: 3
  });

  const [notifications, setNotifications] = useState({
    email_alerts: true,
    push_notifications: false,
    ai_triage_reports: true
  });

  const [apiKey, setApiKey] = useState('AIzaSyCikYZFTsexYhbkUEoZPOzTxlp-BCbKy8c');

  useEffect(() => {
    setInitialLoading(true);
    api.get(`/settings?tenant_id=${selectedTenant}`)
      .then(data => {
        if (data) {
          setSettings(data);
        }
      })
      .catch(err => console.error("Failed to load settings:", err))
      .finally(() => setInitialLoading(false));
  }, [selectedTenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/settings', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 min-h-screen flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-zinc-500 font-medium mt-1">Configure your AI agent, security, and notification preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1">
        {/* Settings Navigation */}
        <div className="space-y-1.5 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('agent')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'agent' ? 'bg-zinc-900 text-white shadow-md shadow-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Bot className="w-4 h-4" />
            AI Agent
          </button>
          <button 
            onClick={() => setActiveTab('keys')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'keys' ? 'bg-zinc-900 text-white shadow-md shadow-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Key className="w-4 h-4" />
            API Keys
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'notifications' ? 'bg-zinc-900 text-white shadow-md shadow-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 text-sm font-bold transition-all">
            <Shield className="w-4 h-4" />
            Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            {initialLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 gap-3">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <p className="text-sm font-medium">Syncing preferences...</p>
               </div>
            ) : (
              <div className="p-8 flex flex-col h-full">
                
                {/* AI Agent Tab */}
                {activeTab === 'agent' && (
                  <form onSubmit={handleSave} className="space-y-8 flex flex-col h-full">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-zinc-400" />
                        AI Agent Configuration
                      </h2>
                      <div className="space-y-8">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900">Auto-Triage Enabled</h3>
                            <p className="text-xs text-zinc-500 font-medium">Allow the AI to automatically analyze and route tickets.</p>
                          </div>
                          <Toggle 
                            checked={settings.auto_triage_enabled} 
                            onChange={(val) => setSettings({...settings, auto_triage_enabled: val})} 
                          />
                        </div>

                        <div className="space-y-2.5">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" />
                            Default AI Model
                          </label>
                          <select 
                            value={settings.default_model}
                            onChange={(e) => setSettings({...settings, default_model: e.target.value})}
                            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-zinc-100 bg-white font-medium text-sm transition-all"
                          >
                            <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Production)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
                            <option value="meta-llama-3.1">Llama 3.1 70B</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2.5">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Reasoning Depth (Retries)</label>
                          <input 
                            type="number" 
                            value={settings.max_retry_attempts}
                            onChange={(e) => setSettings({...settings, max_retry_attempts: parseInt(e.target.value) || 1})}
                            min="1" max="10"
                            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-zinc-100 font-medium text-sm transition-all"
                          />
                          <p className="text-xs text-zinc-400 font-medium italic">Max turns allowed for multi-step tool calling.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-zinc-100 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-200 active:scale-95 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Configuration
                      </button>
                    </div>
                  </form>
                )}

                {/* API Keys Tab */}
                {activeTab === 'keys' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                        <Key className="w-5 h-5 text-zinc-400" />
                        Management & Security
                      </h2>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Google Gemini API Key</label>
                          <div className="relative group">
                            <input 
                              type={showKey ? 'text' : 'password'}
                              value={apiKey}
                              readOnly
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-xs focus:outline-none transition-all pr-12 group-hover:border-zinc-300"
                            />
                            <button 
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-black transition-colors"
                            >
                              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-medium">This key is used for all AI triage operations across the {selectedTenant} tenant.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-zinc-400" />
                        Communication Preferences
                      </h2>
                      <div className="space-y-4">
                        <NotificationRow 
                          icon={<Mail className="w-4 h-4" />}
                          title="Email Alerts"
                          desc="Get notified via email when a high-priority ticket is created."
                          checked={notifications.email_alerts}
                          onChange={(val) => setNotifications({...notifications, email_alerts: val})}
                        />
                        <NotificationRow 
                          icon={<Smartphone className="w-4 h-4" />}
                          title="Push Notifications"
                          desc="Receive real-time browser alerts for agent activity."
                          checked={notifications.push_notifications}
                          onChange={(val) => setNotifications({...notifications, push_notifications: val})}
                        />
                        <NotificationRow 
                          icon={<Shield className="w-4 h-4" />}
                          title="Weekly AI Reports"
                          desc="Summary of resolution rates and triage accuracy."
                          checked={notifications.ai_triage_reports}
                          onChange={(val) => setNotifications({...notifications, ai_triage_reports: val})}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
    </label>
  );
}

function NotificationRow({ icon, title, desc, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-zinc-100 group">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-400 group-hover:text-black transition-colors">{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-500 font-medium">{desc}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
