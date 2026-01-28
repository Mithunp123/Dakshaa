import React, { useState, useEffect } from "react";
import TeamMembers from "./Components/TeamMembers";
import TeamManagementTable from "../../Components/TeamManagement/TeamManagementTable";
import { motion } from "framer-motion";
import { Users, UserCog, Shield, AlertTriangle } from "lucide-react";
import { getCurrentUserProfile } from "../../utils/userUtils";

function Teams() {
  const [activeTab, setActiveTab] = useState("organizers");
  const [userProfile, setUserProfile] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const result = await getCurrentUserProfile();
      if (result.success) {
        setUserProfile(result.data);
        const role = result.data.role?.toLowerCase();
        const allowedRoles = ['admin', 'super_admin', 'event_coordinator'];
        setHasAccess(allowedRoles.includes(role));
        
        // Auto switch to management tab if user has access
        if (allowedRoles.includes(role)) {
          setActiveTab("management");
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const tabs = [
    { id: "organizers", label: "Organizers", icon: Users },
    ...(hasAccess ? [{ id: "management", label: "Team Management", icon: UserCog }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] pt-32 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-12 relative overflow-hidden">
      {/* Cyberpunk Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className="h-px bg-gradient-to-r from-transparent via-secondary to-transparent"
            />
            <h1 className="text-5xl md:text-7xl font-orbitron font-black text-white mt-4 tracking-[0.2em] uppercase">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary animate-gradient-x">Architects</span>
            </h1>
            <p className="font-orbitron text-secondary/60 text-xs md:text-sm tracking-[0.5em] uppercase mt-2">System Core // Personnel Directory</p>
            
            {/* User Role Display */}
            {userProfile && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm capitalize">
                  {userProfile.role?.replace('_', ' ')} Access
                </span>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Tab Navigation */}
        {tabs.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="flex bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Access Denied Message */}
        {!hasAccess && activeTab === "management" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-lg p-8 max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Access Restricted</h3>
              <p className="text-gray-400 mb-4">
                You need admin or coordinator privileges to access team management.
              </p>
              <p className="text-sm text-gray-500">
                Current Role: <span className="text-gray-300 capitalize">{userProfile?.role || 'Student'}</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === "organizers" && <TeamMembers />}
          {activeTab === "management" && hasAccess && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Paper Presentation Teams</h2>
                <p className="text-gray-400">Monitor and manage conference team registrations</p>
                {userProfile?.role === 'event_coordinator' && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Showing events you coordinate</span>
                  </div>
                )}
              </div>
              <TeamManagementTable eventId={null} onlyPaid={false} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Teams;
