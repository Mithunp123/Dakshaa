import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  BookOpen, 
  Calendar, 
  Shield, 
  Save,
  Camera,
  Lock,
  Loader2
} from "lucide-react";
import { supabase } from "../../../supabase";
import toast from 'react-hot-toast';

const ProfileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    mobile_number: "",
    college_name: "",
    department: "",
    roll_number: "",
    email: "",
    id: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setFormData({
            full_name: data.full_name || "",
            mobile_number: data.mobile_number || "",
            college_name: data.college_name || "",
            department: data.department || "",
            roll_number: data.roll_number || "",
            email: user.email || "",
            id: user.id.substring(0, 8).toUpperCase()
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const { error } = await supabase
        .from("profiles")
        .update({
          college_name: formData.college_name,
          department: formData.department,
          roll_number: formData.roll_number
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!', { position: 'top-center' });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile. Please try again.', { position: 'top-center' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Settings</h2>
          <p className="text-gray-400 text-sm">Manage your personal information and account details</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary-dark text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & ID */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden group">
            <div className="relative z-10">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-secondary to-primary p-1">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold">{formData.full_name}</h3>
              <p className="text-secondary font-mono font-bold mt-1">DAK26-{formData.id}</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/10 blur-3xl rounded-full"></div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex gap-4">
            <Shield className="text-primary-light shrink-0" size={20} />
            <p className="text-xs text-gray-400 leading-relaxed">
              Your Registration ID, Name, Email and Mobile Number are permanent and cannot be changed. Contact support if you need to update these.
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                  <User size={14} /> Full Name (Read-only)
                </label>
                <input 
                  type="text" 
                  name="full_name"
                  value={formData.full_name}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                  <Phone size={14} /> Mobile Number (Read-only)
                </label>
                <input 
                  type="text" 
                  name="mobile_number"
                  value={formData.mobile_number}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                  <School size={14} /> College Name
                </label>
                <input 
                  type="text" 
                  name="college_name"
                  value={formData.college_name}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                  <BookOpen size={14} /> Department
                </label>
                <input 
                  type="text" 
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                  <Calendar size={14} /> Roll Number
                </label>
                <input 
                  type="text" 
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                  <Mail size={14} /> Email Address (Read-only)
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
