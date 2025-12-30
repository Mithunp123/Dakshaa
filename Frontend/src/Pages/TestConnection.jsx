import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const TestConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState({});
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const errorList = [];
    const tableResults = {};

    try {
      // Test 1: Check if Supabase URL and Key are configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        errorList.push(
          "❌ Missing Supabase configuration. Check your .env file."
        );
        setConnectionStatus("Configuration Error");
        setErrors(errorList);
        return;
      }

      console.log("Supabase URL:", supabaseUrl);

      // Test 2: Check auth status
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        errorList.push(`⚠️ Auth check: ${authError.message}`);
      } else if (user) {
        setUser(user);
      } else {
        errorList.push("ℹ️ No user logged in (this may be expected)");
      }

      // Test 3: Test events_config table
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("events_config")
          .select("*")
          .limit(5);

        if (eventsError) {
          tableResults.events_config = {
            status: "❌ Error",
            error: eventsError.message,
          };
        } else {
          tableResults.events_config = {
            status: "✅ OK",
            count: eventsData?.length || 0,
          };
        }
      } catch (e) {
        tableResults.events_config = { status: "❌ Error", error: e.message };
      }

      // Test 4: Test events table (alternative)
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .limit(5);

        if (eventsError) {
          tableResults.events = {
            status: "❌ Error",
            error: eventsError.message,
          };
        } else {
          tableResults.events = {
            status: "✅ OK",
            count: eventsData?.length || 0,
          };
        }
      } catch (e) {
        tableResults.events = { status: "❌ Error", error: e.message };
      }

      // Test 5: Test registrations table
      try {
        const { data: regData, error: regError } = await supabase
          .from("registrations")
          .select("*")
          .limit(5);

        if (regError) {
          tableResults.registrations = {
            status: "❌ Error",
            error: regError.message,
          };
        } else {
          tableResults.registrations = {
            status: "✅ OK",
            count: regData?.length || 0,
          };
        }
      } catch (e) {
        tableResults.registrations = { status: "❌ Error", error: e.message };
      }

      // Test 6: Test profiles table
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .limit(5);

        if (profilesError) {
          tableResults.profiles = {
            status: "❌ Error",
            error: profilesError.message,
          };
        } else {
          tableResults.profiles = {
            status: "✅ OK",
            count: profilesData?.length || 0,
          };
        }
      } catch (e) {
        tableResults.profiles = { status: "❌ Error", error: e.message };
      }

      // Test 7: Test combos table
      try {
        const { data: combosData, error: combosError } = await supabase
          .from("combos")
          .select("*")
          .limit(5);

        if (combosError) {
          tableResults.combos = {
            status: "❌ Error",
            error: combosError.message,
          };
        } else {
          tableResults.combos = {
            status: "✅ OK",
            count: combosData?.length || 0,
          };
        }
      } catch (e) {
        tableResults.combos = { status: "❌ Error", error: e.message };
      }

      // Test 8: Test admin_notifications table
      try {
        const { data: notifData, error: notifError } = await supabase
          .from("admin_notifications")
          .select("*")
          .limit(5);

        if (notifError) {
          tableResults.admin_notifications = {
            status: "❌ Error",
            error: notifError.message,
          };
        } else {
          tableResults.admin_notifications = {
            status: "✅ OK",
            count: notifData?.length || 0,
          };
        }
      } catch (e) {
        tableResults.admin_notifications = {
          status: "❌ Error",
          error: e.message,
        };
      }

      setTables(tableResults);
      setConnectionStatus("Connected");
    } catch (error) {
      errorList.push(`❌ Connection failed: ${error.message}`);
      setConnectionStatus("Connection Failed");
    }

    setErrors(errorList);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔌 Supabase Connection Test
        </h1>

        {/* Connection Status */}
        <div
          className={`p-6 rounded-xl mb-6 ${
            connectionStatus === "Connected"
              ? "bg-green-500/20 border border-green-500"
              : connectionStatus === "Checking..."
              ? "bg-yellow-500/20 border border-yellow-500"
              : "bg-red-500/20 border border-red-500"
          }`}
        >
          <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
          <p className="text-2xl">{connectionStatus}</p>
        </div>

        {/* User Info */}
        <div className="bg-gray-800 p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 Current User</h2>
          {user ? (
            <div className="space-y-2">
              <p>
                <span className="text-gray-400">Email:</span> {user.email}
              </p>
              <p>
                <span className="text-gray-400">ID:</span> {user.id}
              </p>
            </div>
          ) : (
            <p className="text-yellow-400">No user logged in</p>
          )}
        </div>

        {/* Tables Status */}
        <div className="bg-gray-800 p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Database Tables</h2>
          <div className="space-y-3">
            {Object.entries(tables).map(([table, result]) => (
              <div
                key={table}
                className="flex justify-between items-center p-3 bg-gray-700 rounded-lg"
              >
                <span className="font-mono">{table}</span>
                <div className="text-right">
                  <span
                    className={
                      result.status.includes("OK")
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {result.status}
                  </span>
                  {result.count !== undefined && (
                    <span className="text-gray-400 ml-2">
                      ({result.count} records)
                    </span>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-300">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Errors/Warnings */}
        {errors.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold mb-4">⚠️ Messages</h2>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <p key={index} className="text-yellow-300">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Retry Button */}
        <button
          onClick={testConnection}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors"
        >
          🔄 Retry Connection Test
        </button>

        {/* Config Info */}
        <div className="mt-6 bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">⚙️ Configuration</h2>
          <p className="text-gray-400 text-sm mb-2">
            Make sure you have a{" "}
            <code className="bg-gray-700 px-2 py-1 rounded">.env</code> file
            with:
          </p>
          <pre className="bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
            {`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;
