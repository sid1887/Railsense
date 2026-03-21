'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Preferences {
  notification_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  theme: string;
  language: string;
  alert_frequency: string;
}

export default function PreferencesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>({
    notification_enabled: true,
    email_enabled: true,
    push_enabled: true,
    theme: 'dark',
    language: 'en',
    alert_frequency: 'immediate',
  });
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!loading && isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, loading, router]);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/user/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch preferences');

      const data = await res.json();
      setPreferences(data.preferences);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationEnabled: preferences.notification_enabled,
          emailEnabled: preferences.email_enabled,
          pushEnabled: preferences.push_enabled,
          theme: preferences.theme,
          language: preferences.language,
          alertFrequency: preferences.alert_frequency,
        }),
      });

      if (!res.ok) throw new Error('Failed to save preferences');

      setSuccess('Preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Preferences</h1>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            ← Back
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Notification Settings */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.notification_enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      notification_enabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="ml-3 text-gray-700">Enable all notifications</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      email_enabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="ml-3 text-gray-700">Email notifications</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.push_enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      push_enabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="ml-3 text-gray-700">Push notifications</span>
              </label>
            </div>
          </div>

          {/* Alert Frequency */}
          <div className="border-b pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Alert Frequency
            </label>
            <select
              value={preferences.alert_frequency}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  alert_frequency: e.target.value,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* Theme */}
          <div className="border-b pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <select
              value={preferences.theme}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  theme: e.target.value,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          {/* Language */}
          <div className="pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Language</label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  language: e.target.value,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
}
