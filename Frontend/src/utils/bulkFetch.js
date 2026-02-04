// Utility function to fetch all records from Supabase, bypassing the 1000 limit
// This implements pagination to fetch all records

export const fetchAllRecords = async (supabaseClient, tableName, selectClause = '*', options = {}) => {
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
      let query = supabaseClient
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

    console.log(`📊 Fetched ${allData.length} records from ${tableName} in ${attempts} batches`);
    return { data: allData, error: null };

  } catch (error) {
    console.error(`❌ Error fetching all records from ${tableName}:`, error);
    return { data: [], error };
  }
};

// Wrapper for complex queries with joins
export const fetchAllRecordsWithJoins = async (supabaseClient, tableName, selectClause, options = {}) => {
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
  const maxAttempts = 100;

  try {
    while (hasMore && attempts < maxAttempts) {
      let query = supabaseClient
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

    console.log(`📊 Fetched ${allData.length} records from ${tableName} (with joins) in ${attempts} batches`);
    return { data: allData, error: null };

  } catch (error) {
    console.error(`❌ Error fetching all records from ${tableName} with joins:`, error);
    return { data: [], error };
  }
};

// For count-only queries where we need total counts
export const getTableCount = async (supabaseClient, tableName, filters = []) => {
  try {
    let query = supabaseClient
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    // Apply filters
    filters.forEach(filter => {
      const { column, operator, value } = filter;
      query = query[operator](column, value);
    });

    const { count, error } = await query;

    if (error) throw error;

    console.log(`📊 Total count for ${tableName}: ${count}`);
    return { count, error: null };

  } catch (error) {
    console.error(`❌ Error getting count for ${tableName}:`, error);
    return { count: 0, error };
  }
};