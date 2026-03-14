'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  TrainFilters,
  SortOptions,
  filterTrains,
  sortTrains,
  getRecommendedSort,
  FilteredTrain,
} from '@/services/filterService';
import FilterControls from '@/components/FilterControls';
import TrainResults from '@/components/TrainResults';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock train data - in production, this would come from API
const MOCK_TRAINS: FilteredTrain[] = [
  {
    trainNumber: '12702',
    trainName: 'Rajdhani Express',
    speed: 110,
    delay: 15,
    status: 'delayed',
    region: 'North',
    distance: 2500,
  },
  {
    trainNumber: '17015',
    trainName: 'Maharaja Express',
    speed: 95,
    delay: 5,
    status: 'moving',
    region: 'South',
    distance: 1800,
  },
  {
    trainNumber: '12345',
    trainName: 'Express A',
    speed: 85,
    delay: 0,
    status: 'moving',
    region: 'East',
    distance: 1200,
  },
  {
    trainNumber: '12955',
    trainName: 'Somnath Express',
    speed: 60,
    delay: 45,
    status: 'halted',
    region: 'West',
    distance: 800,
  },
  {
    trainNumber: '14567',
    trainName: 'Premium Express',
    speed: 120,
    delay: 0,
    status: 'moving',
    region: 'North',
    distance: 3000,
  },
  {
    trainNumber: '15678',
    trainName: 'Slow Train',
    speed: 40,
    delay: 60,
    status: 'halted',
    region: 'South',
    distance: 500,
  },
  {
    trainNumber: '16789',
    trainName: 'Freight Express',
    speed: 75,
    delay: 25,
    status: 'delayed',
    region: 'East',
    distance: 2200,
  },
];

export function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<TrainFilters>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'name', direction: 'asc' });
  const [loading, setLoading] = useState(false);

  // Load filters from URL params
  useEffect(() => {
    const searchText = searchParams.get('q');
    const region = searchParams.get('region');
    const status = searchParams.get('status');

    if (searchText || region || status) {
      setFilters({
        searchText: searchText || undefined,
        region: region || undefined,
        status: (status as 'moving' | 'halted' | 'delayed') || undefined,
      });

      // Auto-suggest sort based on filters
      const newSort = getRecommendedSort({
        searchText: searchText || undefined,
        region: region || undefined,
        status: (status as 'moving' | 'halted' | 'delayed') || undefined,
      });
      setSort(newSort);
    }
  }, [searchParams]);

  // Apply filters and sorting
  const filteredAndSortedTrains = useMemo(() => {
    setLoading(true);

    // Simulate API delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    const filtered = filterTrains(MOCK_TRAINS, filters);
    const sorted = sortTrains(filtered, sort);

    return sorted;
  }, [filters, sort]);

  const handleFilterChange = (newFilters: TrainFilters) => {
    setFilters(newFilters);

    // Update URL
    const params = new URLSearchParams();
    if (newFilters.searchText) params.set('q', newFilters.searchText);
    if (newFilters.region) params.set('region', newFilters.region);
    if (newFilters.status) params.set('status', newFilters.status);

    const newUrl = params.toString()
      ? `/search?${params.toString()}`
      : '/search';
    router.push(newUrl);
  };

  const handleSortChange = (newSort: SortOptions) => {
    setSort(newSort);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-card p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-blue-dark">
            Advanced Train Search
          </h1>
          <p className="text-text-secondary">
            Filter and sort trains by region, status, speed, and more
          </p>
        </div>

        {/* Filters */}
        <FilterControls
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          activeFilters={filters}
          activeSort={sort}
          trainCount={filteredAndSortedTrains.length}
        />

        {/* Results */}
        <TrainResults
          trains={filteredAndSortedTrains}
          loading={loading}
          onTrainSelect={(trainNumber) => {
            router.push(`/train/${trainNumber}`);
          }}
        />

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-blue-900/20 border border-blue-700/50">
            <h3 className="font-semibold text-blue-300 mb-2">💡 Pro Tip</h3>
            <p className="text-xs text-blue-200">
              Use quick presets for common searches like delayed trains or fast trains
            </p>
          </div>
          <div className="card p-4 bg-green-900/20 border border-green-700/50">
            <h3 className="font-semibold text-green-300 mb-2">⚡ Real-time</h3>
            <p className="text-xs text-green-200">
              Results update instantly as you adjust filters
            </p>
          </div>
          <div className="card p-4 bg-purple-900/20 border border-purple-700/50">
            <h3 className="font-semibold text-purple-300 mb-2">🎯 Smart Sort</h3>
            <p className="text-xs text-purple-200">
              Recommended sort changes based on your filters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
