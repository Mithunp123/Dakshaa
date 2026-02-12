import React, { useState, useMemo } from 'react';
import { Search, Calendar, MapPin, Users, Clock, X } from 'lucide-react';
import {
  searchAllEvents,
  searchDayEvents,
  searchEventByName,
  searchEventByLocation,
  searchEventByType,
  getAllEvents,
} from '../../data/eventScheduleData';

const EventSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const days = {
    all: 'All Days',
    1: '12th Feb (Day 1)',
    2: '13th Feb (Day 2)',
    3: '14th Feb (Day 3)',
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    let searchResults = [];

    if (selectedDay === 'all') {
      if (searchType === 'all') {
        searchResults = searchAllEvents(searchTerm);
      } else if (searchType === 'name') {
        searchResults = searchEventByName(searchTerm);
      } else if (searchType === 'location') {
        searchResults = searchEventByLocation(searchTerm);
      } else if (searchType === 'type') {
        searchResults = searchEventByType(searchTerm);
      }
    } else {
      searchResults = searchDayEvents(parseInt(selectedDay), searchTerm);
    }

    setResults(searchResults);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedDay('all');
    setSearchType('all');
    setResults([]);
    setHasSearched(false);
  };

  const handleShowAll = () => {
    setHasSearched(true);
    const allEvents = getAllEvents();
    setResults(selectedDay === 'all' ? allEvents : allEvents.filter(e => e.day === parseInt(selectedDay)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Search Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Find Your Event</h1>
          <p className="text-slate-400">Search across all Dakshaa T26 events</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search event name, location, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Day Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(days).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Type Filter */}
            <div className="md:col-span-3">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Search All</option>
                <option value="name">By Name</option>
                <option value="location">By Location</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              type="button"
              onClick={handleShowAll}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto">
        {hasSearched && (
          <div className="mb-6">
            <p className="text-slate-300 text-lg">
              Found <span className="font-bold text-blue-400">{results.length}</span> event{results.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((event) => (
              <div
                key={`${event.day}-${event.id}`}
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-5 shadow-lg border border-slate-600 hover:border-blue-500 transition-all hover:shadow-xl hover:scale-105"
              >
                {/* Day Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    Day {event.day}
                  </span>
                  <span className="text-xs text-slate-400">{event.date}</span>
                </div>

                {/* Event Name */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-blue-400 transition-colors">
                  {event.eventName}
                </h3>

                {/* Type Badge */}
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded font-medium">
                    {event.type}
                  </span>
                </div>

                {/* Event Details */}
                <div className="space-y-2 text-sm text-slate-300 mb-4">
                  {/* Time */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{event.location}</span>
                  </div>

                  {/* Coordinator */}
                  {event.coordinatorName && (
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{event.coordinatorName}</p>
                        {event.coordinatorNumber && <p className="text-xs text-slate-400">{event.coordinatorNumber}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Map Link */}
                {event.mapUrl && (
                  <a
                    href={event.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                  >
                    View Location
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No events found matching your search.</p>
            <p className="text-slate-500 text-sm mt-2">Try different keywords or filters</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EventSearch;
