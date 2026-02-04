import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, School, BookOpen, GraduationCap, ChevronRight, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { trackReferralCode } from '../../../services/referralService';

const SignUpForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    collegeName: '',
    department: '',
    yearOfStudy: '',
    rollNumber: '',
    referredBy: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    // Enforce numeric input for mobile number
    if (e.target.name === 'mobileNumber' && !/^\d*$/.test(e.target.value)) {
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate all required fields are filled
    const requiredFields = [
      { field: 'fullName', label: 'Full Name' },
      { field: 'gender', label: 'Gender' },
      { field: 'collegeName', label: 'College Name' },
      { field: 'department', label: 'Department' },
      { field: 'yearOfStudy', label: 'Year of Study' },
      { field: 'rollNumber', label: 'Roll Number' },
      { field: 'mobileNumber', label: 'Mobile Number' },
      { field: 'email', label: 'Email Address' },
      { field: 'password', label: 'Password' },
      { field: 'confirmPassword', label: 'Confirm Password' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        toast.error(`${label} is required`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
          },
        });
        setLoading(false);
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
        },
      });
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error("Mobile number must be exactly 10 numeric digits", {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
        },
      });
      setLoading(false);
      return;
    }

    // Validate mobile number starts with 6-9
    if (!/^[6-9]/.test(formData.mobileNumber)) {
      toast.error("Mobile number must start with 6, 7, 8, or 9", {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
        },
      });
      setLoading(false);
      return;
    }

    // Validate referral code - if provided and starts with 2, it's likely a roll number
    if (formData.referredBy && formData.referredBy.trim() !== '') {
      const referralCode = formData.referredBy.trim();
      
      // Check if it starts with 2 (likely a roll number like 7377212CS101)
      if (referralCode.startsWith('2')) {
        toast.error("For KSRCT students: Enter your friend's mobile number, not their registration number", {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
          },
        });
        setLoading(false);
        return;
      }
    }

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      // Ignore 406 errors (happens when no rows found)
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking email:', checkError);
      }

      if (existingUser) {
        toast.error('Email already registered. Please login or use a different email.', {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
          },
        });
        setLoading(false);
        return;
      }

      // Check if mobile number already exists
      const { data: existingMobile, error: mobileCheckError } = await supabase
        .from('profiles')
        .select('mobile_number')
        .eq('mobile_number', formData.mobileNumber)
        .maybeSingle();

      // Ignore 406 errors
      if (mobileCheckError && mobileCheckError.code !== 'PGRST116') {
        console.error('Error checking mobile number:', mobileCheckError);
      }

      if (existingMobile) {
        toast.error('Mobile number already registered. Please login or use a different number.', {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
          },
        });
        setLoading(false);
        return;
      }

      // 1. Sign up with Supabase Auth and pass metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: formData.fullName,
            gender: formData.gender,
            college_name: formData.collegeName,
            department: formData.department,
            year_of_study: formData.yearOfStudy,
            roll_number: formData.rollNumber,
            mobile_number: formData.mobileNumber,
            referred_by: formData.referredBy
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Track referral code if provided (mobile number or unique ID)
        if (formData.referredBy && formData.referredBy.trim() !== '') {
          const referralResult = await trackReferralCode(formData.referredBy);
          if (referralResult.success) {
            // Referral code tracked successfully
          } else {
            console.warn('⚠️ Failed to track referral code:', referralResult.error);
            // Don't block signup if referral tracking fails
          }
        }

        // Sign out the user immediately (they must verify email first)
        await supabase.auth.signOut();
        
        // Show email verification message
        toast.success('Registration successful! Please check your email to verify your account before logging in.', {
          duration: 8000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 10px 40px rgba(14, 165, 233, 0.3)',
          },
          icon: '📧',
        });

        // NOTE: Welcome email will be sent AFTER email verification
        // The verification email is automatically sent by Supabase
        // Welcome email is sent when user verifies and logs in for the first time
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Please login after verifying your email' 
            } 
          });
        }, 3000);
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl"
    >

      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 sm:mb-8 font-orbitron text-center">Create Your DaKshaa Account</h2>
      
      <form onSubmit={handleSignUp} className="space-y-6 sm:space-y-8">
        {/* Section 1: Personal Details */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <User className="text-secondary w-4 h-4 sm:w-5 sm:h-5" />
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Section 1: Personal Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Full Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  required
                  type="text"
                  name="fullName"
                  placeholder="Enter name as per College ID"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                />
              </div>
               <p className="text-[9px] sm:text-[10px] text-cyan-400 ml-1 italic font-medium">This exact name will appear on your certificates.</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Gender <span className="text-red-500">*</span></label>
              <select
                required
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">College Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <School className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  required
                  type="text"
                  name="collegeName"
                  placeholder="e.g., K.S. Rangasamy College of Technology"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                />
              </div>
              <p className="text-[9px] sm:text-[10px] text-cyan-400 ml-1 italic font-medium">This exact name will appear on your certificates.</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Department <span className="text-red-500">*</span></label>
              <div className="relative">
                <BookOpen className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  required
                  type="text"
                  name="department"
                  placeholder="e.g., CSE, ECE, Mech"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                />
              </div>
              <p className="text-[9px] sm:text-[10px] text-cyan-400 ml-1 italic font-medium">This exact name will appear on your certificates.</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Year of Study <span className="text-red-500">*</span></label>
              <div className="relative">
                <GraduationCap className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <select
                  required
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                >
                  <option value="">Select Year</option>
                  <option value="I Year">I Year</option>
                  <option value="II Year">II Year</option>
                  <option value="III Year">III Year</option>
                  <option value="IV Year">IV Year</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Register / Roll Number <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                name="rollNumber"
                placeholder="e.g., 7377212CS101"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Referred By (Optional)</label>
              <input
                type="text"
                name="referredBy"
                placeholder="KSRCT: enter mobile number | Others: enter DaKhaa T26 ID (DAK26-XXXXXXXX)"
                value={formData.referredBy}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
              />
              <p className="text-[9px] sm:text-[12px] text-gray-500 ml-1 italic">“Enter KSRCT student mobile number (for KSRCT referrals) or DaKhaa T26 referral ID (DAK26-XXXXXXXX) for other participants!</p>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Login Credentials */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Mail className="text-secondary w-4 h-4 sm:w-5 sm:h-5" />
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Section 2: Contact & Credentials</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Mobile Number (WhatsApp) <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  required
                  type="tel"
                  name="mobileNumber"
                  placeholder="10-digit mobile number"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                />
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-500 ml-1 italic">Used for event updates.</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="yourname@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  required
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-400 ml-1">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  required
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs sm:text-sm text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 sm:py-4 rounded-xl shadow-lg shadow-secondary/20 hover:shadow-secondary/40 transition-all flex items-center justify-center gap-2 group text-sm sm:text-base touch-manipulation"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Create Account <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <p className="text-center text-gray-400 text-xs sm:text-sm">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="text-secondary hover:underline font-semibold"
          >
            Login here
          </button>
        </p>
      </form>
    </motion.div>
  );
};

export default SignUpForm;

