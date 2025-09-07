import React, { useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../services/supabase';
import { User, Building2, CreditCard, Save, Loader2 } from 'lucide-react';

type TabKey = 'profile' | 'organization' | 'donate';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [message, setMessage] = useState<string>('');

  const [profile, setProfile] = useState({
    full_name: '',
    display_name: '',
    bio: '',
    website: ''
  });

  const [organization, setOrganization] = useState({
    org_name: '',
    org_website: '',
    org_industry: '',
    org_description: ''
  });

  useEffect(() => {
    (async () => {
      const { user } = await getCurrentUser();
      if (user?.user_metadata) {
        const md = user.user_metadata as any;
        setProfile({
          full_name: md.full_name || '',
          display_name: md.display_name || '',
          bio: md.bio || '',
          website: md.website || ''
        });
        setOrganization({
          org_name: md.org_name || '',
          org_website: md.org_website || '',
          org_industry: md.org_industry || '',
          org_description: md.org_description || ''
        });
      }
      setInitializing(false);
    })();
  }, []);

  const saveProfile = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          display_name: profile.display_name,
          bio: profile.bio,
          website: profile.website
        }
      });
      if (error) throw error;
      setMessage('Profile updated successfully');
    } catch (e: any) {
      setMessage(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveOrganization = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          org_name: organization.org_name,
          org_website: organization.org_website,
          org_industry: organization.org_industry,
          org_description: organization.org_description
        }
      });
      if (error) throw error;
      setMessage('Organization details saved');
    } catch (e: any) {
      setMessage(e.message || 'Failed to save organization');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabKey; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  if (initializing) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center space-x-2 text-gray-600"><Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap gap-3">
        <TabButton id="profile" label="Profile" icon={User} />
        <TabButton id="organization" label="Organization" icon={Building2} />
        <TabButton id="donate" label="Donate" icon={CreditCard} />
      </div>

      {message && (
        <div className="px-4 py-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">{message}</div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input value={profile.full_name} onChange={e=>setProfile(p=>({...p, full_name: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Your full name" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Display Name</label>
              <input value={profile.display_name} onChange={e=>setProfile(p=>({...p, display_name: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Name shown in app" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Bio</label>
              <textarea value={profile.bio} onChange={e=>setProfile(p=>({...p, bio: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" rows={3} placeholder="Short bio" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Website</label>
              <input value={profile.website} onChange={e=>setProfile(p=>({...p, website: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://example.com" />
            </div>
          </div>
          <div>
            <button onClick={saveProfile} disabled={loading} className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'organization' && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Organization Name</label>
              <input value={organization.org_name} onChange={e=>setOrganization(o=>({...o, org_name: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="ACME Inc." />
            </div>
            <div>
              <label className="text-sm text-gray-600">Industry</label>
              <input value={organization.org_industry} onChange={e=>setOrganization(o=>({...o, org_industry: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Technology" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Website</label>
              <input value={organization.org_website} onChange={e=>setOrganization(o=>({...o, org_website: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://acme.com" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Description</label>
              <textarea value={organization.org_description} onChange={e=>setOrganization(o=>({...o, org_description: e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" rows={3} placeholder="About the organization" />
            </div>
          </div>
          <div>
            <button onClick={saveOrganization} disabled={loading} className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Organization</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'donate' && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Support Our Work</h3>
          <p className="text-gray-600">If you find SurveySense helpful, consider supporting development.</p>
          <div className="flex flex-wrap gap-3">
            <a href="https://www.buymeacoffee.com/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg border hover:bg-gray-50">Buy me a coffee</a>
            <a href="https://paypal.me/AbrarAli07" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg border hover:bg-gray-50">PayPal</a>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-1">UPI (India)</h4>
            <code className="px-2 py-1 bg-gray-100 rounded">shadowaz@airtel</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;


