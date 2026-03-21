'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SavedTrain {
  train_number: string;
  train_name: string;
  from_station: string;
  to_station: string;
  saved_at: string;
}

export default function SavedTrainsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [trains, setTrains] = useState<SavedTrain[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!loading && isAuthenticated) {
      fetchSavedTrains();
    }
  }, [isAuthenticated, loading, router]);

  const fetchSavedTrains = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/user/saved-trains', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch saved trains');

      const data = await res.json();
      setTrains(data.trains);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleUnsave = async (trainNumber: string) => {
    if (!confirm('Remove this train from saved trains?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/user/saved-trains?trainNumber=${trainNumber}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to unsave train');

      setTrains(trains.filter(t => t.train_number !== trainNumber));
    } catch (err: any) {
      setError(err.message);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">❤️ Saved Trains</h1>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {trains.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No saved trains yet</p>
            <Link
              href="/search"
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Search for Trains
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {trains.map((train) => (
              <div key={train.train_number} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link
                      href={`/train/${train.train_number}`}
                      className="text-lg font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      {train.train_number} - {train.train_name}
                    </Link>
                    <p className="text-gray-600 mt-2">
                      {train.from_station} → {train.to_station}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Saved {new Date(train.saved_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnsave(train.train_number)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
