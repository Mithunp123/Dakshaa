const supabase = require('./db');

// Utility function to fetch all records from Supabase, bypassing the 1000 limit
// This implements pagination to fetch all records for the backend

const fetchAllRecords = async (tableName, selectClause = '*', options = {}) => {
  const {
    filters = [],
    orderBy = null,
    orderAscending = false,
    pageSize = 1000
  } = options;

  let allData = [];
  let from = 0;
  let hasMore = true;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  try {
    while (hasMore && attempts < maxAttempts) {
      let query = supabase
        .from(tableName)
        .select(selectClause)
        .range(from, from + pageSize - 1);

      // Apply filters
      filters.forEach(filter => {
        const { column, operator, value } = filter;
        query = query[operator](column, value);
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending: orderAscending });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        
        // If we got less than the page size, we've reached the end
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }

      attempts++;
    }

    console.log(`📊 [Backend] Fetched ${allData.length} records from ${tableName} in ${attempts} batches`);
    return { data: allData, error: null };

  } catch (error) {
    console.error(`❌ [Backend] Error fetching all records from ${tableName}:`, error);
    return { data: [], error };
  }
};

// For complex queries with specific where conditions
const fetchAllRecordsWithFilters = async (tableName, selectClause, whereConditions = {}) => {
  let allData = [];
  let from = 0;
  let hasMore = true;
  let attempts = 0;
  const maxAttempts = 100;
  const pageSize = 1000;

  try {
    while (hasMore && attempts < maxAttempts) {
      let query = supabase
        .from(tableName)
        .select(selectClause)
        .range(from, from + pageSize - 1);

      // Apply where conditions
      Object.keys(whereConditions).forEach(column => {
        const value = whereConditions[column];
        if (Array.isArray(value)) {
          query = query.in(column, value);
        } else {
          query = query.eq(column, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }

      attempts++;
    }

    console.log(`📊 [Backend] Fetched ${allData.length} records from ${tableName} with filters in ${attempts} batches`);
    return { data: allData, error: null };

  } catch (error) {
    console.error(`❌ [Backend] Error fetching filtered records from ${tableName}:`, error);
    return { data: [], error };
  }
};

module.exports = {
  fetchAllRecords,
  fetchAllRecordsWithFilters
};