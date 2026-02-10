import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  School, 
  Users, 
  Search, 
  Download,
  Loader2,
  TrendingUp,
  Building2,
  ArrowUpDown,
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { fetchAllRecords } from '../../../utils/bulkFetch';

const CollegeStats = () => {
  const [collegeData, setCollegeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [sortBy, setSortBy] = useState('count'); // 'count', 'name', 'paid'
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalColleges, setTotalColleges] = useState(0);
  const [totalPaidUsers, setTotalPaidUsers] = useState(0);

  useEffect(() => {
    fetchCollegeStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize college name - dynamic approach to handle all variations
  const normalizeCollegeName = (name) => {
    if (!name || name.trim() === '') return 'NOT SPECIFIED';
    
    let normalized = name.trim().toUpperCase();
    
    // Step 1: Remove all punctuation (dots, commas, etc.)
    normalized = normalized
      .replace(/[.,;:'"!?()[\]{}\-_/\\]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim();
    
    // Step 2: Merge consecutive single letters at the start of the name
    // "K S RANGASAMY" -> "KSRANGASAMY", "P S G COLLEGE" -> "PSGCOLLEGE"
    // This handles patterns like: K S R, P S G, S R M, A B C, etc.
    const words = normalized.split(' ');
    let mergedInitials = '';
    let restOfName = [];
    let stillMerging = true;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // If word is a single letter and we're still in the initial sequence
      if (stillMerging && word.length === 1 && /^[A-Z]$/.test(word)) {
        mergedInitials += word;
      } else {
        stillMerging = false;
        restOfName.push(word);
      }
    }
    
    // Combine merged initials with rest of name (no space between initials and next word)
    if (mergedInitials) {
      normalized = mergedInitials + (restOfName.length > 0 ? restOfName.join(' ') : '');
    } else {
      normalized = restOfName.join(' ');
    }
    
    // Step 3: Remove spaces entirely for final comparison key
    // This ensures "KSRANGASAMY COLLEGE" = "KS RANGASAMY COLLEGE" = "K S RANGASAMY COLLEGE"
    const normalizedKey = normalized.replace(/\s+/g, '');
    
    // Step 4: Common abbreviation expansions (only for short abbreviations)
    const abbreviationMap = {
      'KSRCT': 'KSRANGASAMYCOLLEGEOFTECHNOLOGY',
      'KSRCE': 'KSRANGASAMYCOLLEGEOFENGINEERING',
      'SKCET': 'SRIKRISHNACOLLEGEOFENGINEERINGANDTECHNOLOGY',
      'PSGTECH': 'PSGCOLLEGEOFTECHNOLOGY',
      'PSGCT': 'PSGCOLLEGEOFTECHNOLOGY',
      'PSGCAS': 'PSGCOLLEGEOFARTSANDSCIENCE',
      'GCT': 'GOVERNMENTCOLLEGEOFTECHNOLOGY',
      'CIT': 'COIMBATOREINSTITUTEOFTECHNOLOGY',
      'KPRIET': 'KPRINSTITUTEOFENGINEERINGANDTECHNOLOGY',
      'SNSCT': 'SNSCOLLEGEOFTECHNOLOGY',
      'VCET': 'VELAMMALCOLLEGEOFENGINEERINGANDTECHNOLOGY',
      'ANNAUNIV': 'ANNAUNIVERSITY',
      'VIT': 'VELLOIREINSTITUTEOFTECHNOLOGY',
      'SRM': 'SRMUNIVERSITY',
      'SRMU': 'SRMUNIVERSITY',
      'NIT': 'NATIONALINSTITUTEOFTECHNOLOGY',
      'IIT': 'INDIANINSTITUTEOFTECHNOLOGY',
      'IIIT': 'INDIANINSTITUTEOFTECHNOLOGY'
    };
    
    // Check if normalizedKey matches an abbreviation
    if (abbreviationMap[normalizedKey]) {
      return abbreviationMap[normalizedKey];
    }
    
    // Return the space-removed normalized key for consistent grouping
    return normalizedKey;
  };

  const fetchCollegeStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching college statistics...');
      
      // Fetch all profiles using bulk fetch to bypass 1000 limit
      const { data: profiles, error: profileError } = await fetchAllRecords(
        supabase,
        'profiles',
        'id, college_name',
        { pageSize: 1000 }
      );
      
      if (profileError) throw profileError;

      // Fetch all event registrations with payment status
      const { data: registrations, error: regError } = await fetchAllRecords(
        supabase,
        'event_registrations_config',
        'user_id, payment_status',
        { pageSize: 1000 }
      );

      if (regError) {
        console.warn('Could not fetch registrations:', regError);
      }

      // Create a set of user IDs who have paid
      const paidUserIds = new Set();
      registrations?.forEach(reg => {
        if (reg.payment_status === 'PAID') {
          paidUserIds.add(reg.user_id);
        }
      });
      
      // Group by normalized college name and count (case-insensitive)
      const collegeCount = {};
      let total = 0;
      let totalPaid = 0;
      
      profiles?.forEach(profile => {
        const normalizedKey = normalizeCollegeName(profile.college_name);
        
        if (!collegeCount[normalizedKey]) {
          collegeCount[normalizedKey] = {
            count: 0,
            paidCount: 0,
            originalNames: new Map() // Track original variations with their counts
          };
        }
        
        collegeCount[normalizedKey].count++;
        
        // Track original name variations with counts to find most common
        if (profile.college_name?.trim()) {
          const originalName = profile.college_name.trim();
          const currentCount = collegeCount[normalizedKey].originalNames.get(originalName) || 0;
          collegeCount[normalizedKey].originalNames.set(originalName, currentCount + 1);
        }
        
        // Check if this user has paid
        if (paidUserIds.has(profile.id)) {
          collegeCount[normalizedKey].paidCount++;
          totalPaid++;
        }
        
        total++;
      });
      
      // Convert to array format - use most common original name as display name
      const collegeArray = Object.entries(collegeCount).map(([key, data]) => {
        // Find the most commonly used original name for display
        let displayName = key; // fallback to normalized key
        let maxCount = 0;
        
        for (const [originalName, count] of data.originalNames.entries()) {
          if (count > maxCount) {
            maxCount = count;
            displayName = originalName.toUpperCase(); // Use most common variation
          }
        }
        
        // Get all variations for tooltip/info
        const variations = Array.from(data.originalNames.keys()).slice(0, 5);
        
        return {
          name: displayName,
          key: key, // normalized key for filtering
          count: data.count,
          paidCount: data.paidCount,
          percentage: ((data.count / total) * 100).toFixed(1),
          paidPercentage: data.count > 0 ? ((data.paidCount / data.count) * 100).toFixed(1) : '0.0',
          variations: variations
        };
      });
      
      // Sort by count descending by default
      collegeArray.sort((a, b) => b.count - a.count);
      
      setCollegeData(collegeArray);
      setTotalUsers(total);
      setTotalColleges(collegeArray.length);
      setTotalPaidUsers(totalPaid);
      console.log(`✅ Found ${collegeArray.length} colleges with ${total} total users (${totalPaid} paid)`);
      
    } catch (error) {
      console.error('Error fetching college stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort data
  const filteredData = collegeData
    .filter(item => {
      const search = searchTerm.toLowerCase();
      // Search in display name, key, or any variation
      return item.name.toLowerCase().includes(search) ||
             item.key.toLowerCase().includes(search) ||
             item.variations?.some(v => v.toLowerCase().includes(search));
    })
    .sort((a, b) => {
      if (sortBy === 'count') {
        return sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
      } else if (sortBy === 'paid') {
        return sortOrder === 'desc' ? b.paidCount - a.paidCount : a.paidCount - b.paidCount;
      } else {
        return sortOrder === 'desc' 
          ? b.name.localeCompare(a.name) 
          : a.name.localeCompare(b.name);
      }
    });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['College Name', 'Total Users', 'Paid Users', 'Paid %', 'Percentage'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => 
        `"${item.name}",${item.count},${item.paidCount},${item.paidPercentage}%,${item.percentage}%`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college_stats_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">Loading college statistics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <School className="w-7 h-7 text-blue-500" />
            College-wise Statistics
          </h1>
          <p className="text-slate-400 mt-1">
            View user distribution across colleges
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Colleges</p>
              <p className="text-2xl font-bold text-white">{totalColleges.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Paid Users</p>
              <p className="text-2xl font-bold text-white">{totalPaidUsers.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg Users/College</p>
              <p className="text-2xl font-bold text-white">
                {totalColleges > 0 ? Math.round(totalUsers / totalColleges) : 0}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search colleges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700">
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-300">
                  #
                </th>
                <th 
                  className="px-4 py-4 text-left text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    College Name
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'name' ? 'text-blue-400' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('count')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Total Users
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'count' ? 'text-blue-400' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('paid')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Paid
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'paid' ? 'text-blue-400' : ''}`} />
                  </div>
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">
                  Paid %
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">
                  Share %
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-300">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <motion.tr
                  key={item.key || item.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-4 text-slate-500 text-sm">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-700/50 rounded-lg">
                        <School className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-white font-medium">{item.name}</span>
                        {item.variations && item.variations.length > 1 && item.name !== 'NOT SPECIFIED' && (
                          <p className="text-xs text-slate-500 mt-0.5" title={item.variations.join(', ')}>
                            Merged: {item.variations.length} variations
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-white font-bold text-lg">{item.count.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-bold text-lg ${item.paidCount > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                      {item.paidCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      parseFloat(item.paidPercentage) >= 50 
                        ? 'bg-green-500/20 text-green-400' 
                        : parseFloat(item.paidPercentage) >= 25 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {item.paidPercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      {item.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(parseFloat(item.percentage) * 2, 100)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <School className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No colleges found matching your search</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-center text-slate-500 text-sm">
        Showing {filteredData.length} of {collegeData.length} colleges
      </div>
    </div>
  );
};

export default CollegeStats;
