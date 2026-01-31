import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hotel, UtensilsCrossed, Calendar, User, Mail, Phone, School, MapPin, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../supabase';
import toast from 'react-hot-toast';

const AccommodationBooking = () => {
  const [showModal, setShowModal] = useState(false);
  const [bookingType, setBookingType] = useState(''); // 'accommodation' or 'lunch'
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [existingBookings, setExistingBookings] = useState({
    accommodation: null,
    lunch: null,
    bookedAccommodationDates: [],
    bookedLunchDates: []
  });
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    gender: '',
    collegeName: '',
    accommodationDates: [],
    lunchDates: []
  });

  useEffect(() => {
    fetchUserProfile();
    fetchExistingBookings();

    // Check for payment success in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const bookingType = urlParams.get('type');
    
    if (paymentStatus === 'success') {
      if (bookingType === 'accommodation') {
        toast.success('Accommodation booking confirmed successfully', {
          duration: 4000,
          position: 'top-center',
        });
      } else if (bookingType === 'lunch') {
        toast.success('Lunch booking confirmed successfully', {
          duration: 4000,
          position: 'top-center',
        });
      }
      
      // 🎁 Referral Count Increment Logic
      // After successful payment, check if user has a referred_by code and increment the referral count
      handleReferralIncrement();
      
      // Refresh bookings to show the new one
      setTimeout(() => {
        fetchExistingBookings();
      }, 1000);
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchExistingBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        // Fetch ALL accommodation bookings (can have multiple now)
        const { data: accDataArray } = await supabase
          .from('accommodation_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('payment_status', 'PAID');

        // Fetch ALL lunch bookings
        const { data: lunchDataArray } = await supabase
          .from('lunch_bookings')
          .select('*')
          .eq('user_id', user.id)
          .eq('payment_status', 'PAID');

        // Extract and combine all booked dates
        const bookedAccDates = [];
        const bookedLunchDates = [];
        let totalAccPrice = 0;
        let totalLunchPrice = 0;

        if (accDataArray && accDataArray.length > 0) {
          accDataArray.forEach(booking => {
            try {
              const data = JSON.parse(booking.special_requests || '{}');
              if (data.dates) bookedAccDates.push(...data.dates);
              totalAccPrice += parseFloat(booking.total_price || 0);
            } catch (e) {
              // Log JSON parsing errors in development mode only
              if (import.meta.env.DEV) {
                console.warn('Error parsing accommodation booking data:', e);
              }
            }
          });
        }

        if (lunchDataArray && lunchDataArray.length > 0) {
          lunchDataArray.forEach(booking => {
            if (booking.booked_dates) {
              const dates = booking.booked_dates.split(', ').map(d => d.trim());
              bookedLunchDates.push(...dates);
            }
            totalLunchPrice += parseFloat(booking.total_price || 0);
          });
        }

        // Create combined display object
        const combinedAcc = accDataArray && accDataArray.length > 0 ? {
          ...accDataArray[0],
          total_price: totalAccPrice,
          number_of_days: bookedAccDates.length.toString(),
          special_requests: JSON.stringify({ dates: bookedAccDates })
        } : null;

        const combinedLunch = lunchDataArray && lunchDataArray.length > 0 ? {
          ...lunchDataArray[0],
          total_price: totalLunchPrice,
          total_lunches: bookedLunchDates.length.toString(),
          booked_dates: bookedLunchDates.join(', ')
        } : null;

        setExistingBookings({
          accommodation: combinedAcc,
          lunch: combinedLunch,
          bookedAccommodationDates: bookedAccDates,
          bookedLunchDates: bookedLunchDates
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          setFormData({
            ...formData,
            fullName: profile.full_name || '',
            email: profile.email || user.email,
            mobile: profile.mobile_number || '',
            gender: profile.gender || '',
            collegeName: profile.college_name || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleBooking = (type) => {
    setBookingType(type);
    setShowModal(true);
  };

  const handleDateToggle = (date, type) => {
    if (type === 'accommodation') {
      setFormData(prev => ({
        ...prev,
        accommodationDates: prev.accommodationDates.includes(date)
          ? prev.accommodationDates.filter(d => d !== date)
          : [...prev.accommodationDates, date]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        lunchDates: prev.lunchDates.includes(date)
          ? prev.lunchDates.filter(d => d !== date)
          : [...prev.lunchDates, date]
      }));
    }
  };

  const calculateTotal = () => {
    if (bookingType === 'accommodation') {
      return formData.accommodationDates.length * 350;
    } else {
      return formData.lunchDates.length * 100;
    }
  };

  const handleReferralIncrement = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: userProfileForReferral } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', user.id)
        .single();

      if (userProfileForReferral && userProfileForReferral.referred_by) {
        const referralCode = userProfileForReferral.referred_by.trim();
        console.log(`🎁 User has referral code: ${referralCode}. Checking referral_code table...`);

        // Check if this referral code exists in the referral_code table
        const { data: existingReferral, error: referralFetchErr } = await supabase
          .from('referral_code')
          .select('referral_id, usage_count')
          .eq('referral_id', referralCode)
          .maybeSingle();

        if (referralFetchErr) {
          console.error("❌ Error fetching referral code:", referralFetchErr);
        } else if (existingReferral) {
          // Referral code exists - increment usage_count by 1
          const newCount = (existingReferral.usage_count || 0) + 1;
          
          const { error: updateErr } = await supabase
            .from('referral_code')
            .update({ usage_count: newCount })
            .eq('referral_id', referralCode);

          if (updateErr) {
            console.error("❌ Error updating referral count:", updateErr);
          } else {
            console.log(`✅ Referral count incremented for ${referralCode}: ${existingReferral.usage_count} → ${newCount}`);
          }
        } else {
          // Referral code not found in table - skip (it might be an invalid code or not tracked)
          console.log(`⚠️ Referral code ${referralCode} not found in referral_code table. Skipping increment.`);
        }
      } else {
        console.log("ℹ️ User has no referral code. Skipping referral increment.");
      }
    } catch (referralErr) {
      console.error("❌ Error processing referral increment:", referralErr);
      // Don't fail the payment callback if referral tracking fails
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        toast.error('Please login to continue', {
          duration: 3000,
          position: 'top-center',
        });
        setLoading(false);
        return;
      }

      if (bookingType === 'accommodation') {
        // Validate required fields
        if (!formData.fullName?.trim()) {
          toast.error('Please enter your full name', {
            duration: 3000,
            position: 'top-center',
          });
          setLoading(false);
          return;
        }

        if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
          toast.error('Please enter a valid 10-digit mobile number', {
            duration: 3000,
            position: 'top-center',
          });
          setLoading(false);
          return;
        }

        if (!formData.gender) {
          toast.error('Please select your gender', {
            duration: 3000,
            position: 'top-center',
          });
          setLoading(false);
          return;
        }

        if (formData.accommodationDates.length === 0) {
          toast.error('Please select at least one date', {
            duration: 3000,
            position: 'top-center',
          });
          setLoading(false);
          return;
        }

        const totalAmount = calculateTotal();
        
        toast.loading('Preparing payment...', {
          duration: 2000,
          position: 'top-center',
        });

        // Initiate payment via backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const paymentResponse = await fetch(`${apiUrl}/payment/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            booking_id: `ACC_${Date.now()}`,
            booking_type: 'accommodation',
            amount: totalAmount,
            accommodation_dates: formData.accommodationDates,
            full_name: formData.fullName,
            mobile_number: formData.mobile,
            gender: formData.gender,
            college_name: formData.collegeName
          })
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment initiation failed');
        }

        // Store pending booking data
        sessionStorage.setItem('pending_accommodation', JSON.stringify({
          dates: formData.accommodationDates,
          amount: totalAmount
        }));

        toast.success('Redirecting to payment gateway...', {
          duration: 1000,
          position: 'top-center',
        });

        // Redirect to payment gateway
        setTimeout(() => {
          window.location.href = paymentResult.payment_url;
        }, 1000);
        return;
      } else {
        if (formData.lunchDates.length === 0) {
          toast.error('Please select at least one lunch date', {
            duration: 3000,
            position: 'top-center',
          });
          setLoading(false);
          return;
        }

        const totalAmount = calculateTotal();
        
        toast.loading('Preparing payment...', {
          duration: 2000,
          position: 'top-center',
        });

        // Initiate payment via backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const paymentResponse = await fetch(`${apiUrl}/payment/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            booking_id: `LUNCH_${Date.now()}`,
            booking_type: 'lunch',
            amount: totalAmount,
            lunch_dates: formData.lunchDates,
            full_name: formData.fullName,
            mobile_number: formData.mobile
          })
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment initiation failed');
        }

        // Store pending booking data
        sessionStorage.setItem('pending_lunch', JSON.stringify({
          dates: formData.lunchDates,
          amount: totalAmount
        }));

        toast.success('Redirecting to payment gateway...', {
          duration: 1000,
          position: 'top-center',
        });

        // Redirect to payment gateway
        setTimeout(() => {
          window.location.href = paymentResult.payment_url;
        }, 1000);
        
        // Note: After payment success, user will be redirected back and bookings will be fetched
        return;
      }
    } catch (error) {
      console.error('Booking error:', error);
      
      toast.error(error.message || 'Booking failed. Please try again.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-12 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-orbitron">
          Accommodation & Dining
        </h1>
        <p className="text-gray-400">Book your stay and meals for DaKshaa 2026</p>
      </motion.div>

      {/* My Bookings Section */}
      {!loadingBookings && (existingBookings.accommodation || existingBookings.lunch) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={28} />
            My Confirmed Bookings
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {existingBookings.accommodation && (
              <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Hotel className="text-blue-400" size={24} />
                  <h3 className="text-xl font-bold text-white">Accommodation Booked</h3>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Name:</strong> {existingBookings.accommodation.full_name}</p>
                  <p><strong>Email:</strong> {existingBookings.accommodation.email}</p>
                  <p><strong>Phone:</strong> {existingBookings.accommodation.phone}</p>
                  <p><strong>Dates:</strong> {(() => {
                    try {
                      const data = JSON.parse(existingBookings.accommodation.special_requests || '{}');
                      return (data.dates || []).join(', ') || existingBookings.accommodation.number_of_days + ' day(s)';
                    } catch {
                      return existingBookings.accommodation.number_of_days + ' day(s)';
                    }
                  })()}</p>
                  <p><strong>Total:</strong> <span className="text-blue-400 font-bold">₹{existingBookings.accommodation.total_price}</span></p>
                  <p><strong>Status:</strong> <span className="text-green-400 font-bold">PAID ✓</span></p>
                </div>
              </div>
            )}
            {existingBookings.lunch && (
              <div className="bg-orange-500/10 border-2 border-orange-500/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <UtensilsCrossed className="text-orange-400" size={24} />
                  <h3 className="text-xl font-bold text-white">Lunch Booked</h3>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Name:</strong> {existingBookings.lunch.full_name}</p>
                  <p><strong>Email:</strong> {existingBookings.lunch.email}</p>
                  <p><strong>Phone:</strong> {existingBookings.lunch.phone}</p>
                  <p><strong>Dates:</strong> {existingBookings.lunch.booked_dates || existingBookings.lunch.total_lunches + ' lunch(es)'}</p>
                  <p><strong>Total:</strong> <span className="text-orange-400 font-bold">₹{existingBookings.lunch.total_price}</span></p>
                  <p><strong>Status:</strong> <span className="text-green-400 font-bold">PAID ✓</span></p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Cards Container */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* Accommodation Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Hotel className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-orbitron">Accommodation</h2>
              <p className="text-gray-400 text-sm">Rs. 350 per day</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                Accommodation will be provided along with <strong>dinner only</strong>. Breakfast is not included
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={16} />
                <span>February 12 Evening Stay (Dinner only)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={16} />
                <span>February 13 Night Stay (Dinner only)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={16} />
                <span>February 14 Stay (Dinner only)</span>
              </div>
            </div>
          </div>

          {existingBookings.accommodation && existingBookings.bookedAccommodationDates.length >= 3 ? (
            <div className="w-full py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-xl font-semibold text-center">
              ✓ All Dates Booked
            </div>
          ) : existingBookings.accommodation ? (
            <button
              onClick={() => handleBooking('accommodation')}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50"
            >
              ✓ Modify Booking
            </button>
          ) : (
            <button
              onClick={() => handleBooking('accommodation')}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              BOOK NOW
            </button>
          )}
        </motion.div>

        {/* Lunch Card 
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <UtensilsCrossed className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-orbitron">Lunch</h2>
              <p className="text-gray-400 text-sm">Rs. 100 per lunch</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                Only Lunch will be provided for <strong>12th, 13th and 14th February</strong>. Register here to reserve your meals.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={16} />
                <span>February 12 Lunch</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={16} />
                <span>February 13 Lunch</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={16} />
                <span>February 14 Lunch</span>
              </div>
            </div>
          </div>

          {existingBookings.lunch && existingBookings.bookedLunchDates.length >= 3 ? (
            <div className="w-full py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 rounded-xl font-semibold text-center">
              ✓ All Dates Booked
            </div>
          ) : existingBookings.lunch ? (
            <button
              onClick={() => handleBooking('lunch')}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50"
            >
              ✓ Modify Booking
            </button>
          ) : (
            <button
              onClick={() => handleBooking('lunch')}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-orange-500/50"
            >
              RESERVE NOW
            </button>
          )}
        </motion.div>
        */}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {bookingType === 'accommodation' ? (
                  <Hotel className="w-6 h-6 text-blue-400" />
                ) : (
                  <UtensilsCrossed className="w-6 h-6 text-orange-400" />
                )}
                <h3 className="text-2xl font-bold text-white">
                  {bookingType === 'accommodation' ? 'Book Accommodation' : 'Reserve Lunch'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* User Info (Pre-filled) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                    <User size={18} className="text-gray-500" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="bg-transparent text-white flex-1 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                    <Mail size={18} className="text-gray-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-transparent text-white flex-1 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Mobile</label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                    <Phone size={18} className="text-gray-500" />
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      className="bg-transparent text-white flex-1 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white outline-none"
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">College Name</label>
                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                  <School size={18} className="text-gray-500" />
                  <input
                    type="text"
                    value={formData.collegeName}
                    onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                    className="bg-transparent text-white flex-1 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">
                  Select {bookingType === 'accommodation' ? 'Stay' : 'Lunch'} Dates
                </label>
                <div className="flex gap-4">
                  {bookingType === 'accommodation' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDateToggle('February 12', 'accommodation')}
                        disabled={existingBookings.bookedAccommodationDates.includes('February 12')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          existingBookings.bookedAccommodationDates.includes('February 12')
                            ? 'border-green-500 bg-green-500/20 text-green-400 cursor-not-allowed'
                            : formData.accommodationDates.includes('February 12')
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-blue-500/50'
                        }`}
                      >
                        February 12 {existingBookings.bookedAccommodationDates.includes('February 12') ? '✓' : 'Evening'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateToggle('February 13', 'accommodation')}
                        disabled={existingBookings.bookedAccommodationDates.includes('February 13')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          existingBookings.bookedAccommodationDates.includes('February 13')
                            ? 'border-green-500 bg-green-500/20 text-green-400 cursor-not-allowed'
                            : formData.accommodationDates.includes('February 13')
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-blue-500/50'
                        }`}
                      >
                        February 13 {existingBookings.bookedAccommodationDates.includes('February 13') ? '✓' : 'Full Day'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateToggle('February 14', 'accommodation')}
                        disabled={existingBookings.bookedAccommodationDates.includes('February 14')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          existingBookings.bookedAccommodationDates.includes('February 14')
                            ? 'border-green-500 bg-green-500/20 text-green-400 cursor-not-allowed'
                            : formData.accommodationDates.includes('February 14')
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-blue-500/50'
                        }`}
                      >
                        February 14 {existingBookings.bookedAccommodationDates.includes('February 14') ? '✓' : 'Dinner only'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDateToggle('February 12', 'lunch')}
                        disabled={existingBookings.bookedLunchDates.includes('February 12')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          existingBookings.bookedLunchDates.includes('February 12')
                            ? 'border-green-500 bg-green-500/20 text-green-400 cursor-not-allowed'
                            : formData.lunchDates.includes('February 12')
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-orange-500/50'
                        }`}
                      >
                        February 12 {existingBookings.bookedLunchDates.includes('February 12') ? '✓ Booked' : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateToggle('February 13', 'lunch')}
                        disabled={existingBookings.bookedLunchDates.includes('February 13')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          existingBookings.bookedLunchDates.includes('February 13')
                            ? 'border-green-500 bg-green-500/20 text-green-400 cursor-not-allowed'
                            : formData.lunchDates.includes('February 13')
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-orange-500/50'
                        }`}
                      >
                        February 13 {existingBookings.bookedLunchDates.includes('February 13') ? '✓ Booked' : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateToggle('February 14', 'lunch')}
                        disabled={existingBookings.bookedLunchDates.includes('February 14')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                          existingBookings.bookedLunchDates.includes('February 14')
                            ? 'border-green-500 bg-green-500/20 text-green-400 cursor-not-allowed'
                            : formData.lunchDates.includes('February 14')
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-orange-500/50'
                        }`}
                      >
                        February 14 {existingBookings.bookedLunchDates.includes('February 14') ? '✓ Booked' : ''}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Total Price */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Amount:</span>
                  <span className="text-3xl font-bold text-white">₹{calculateTotal()}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                  bookingType === 'accommodation'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
              >
                {loading ? 'Processing...' : `Confirm ${bookingType === 'accommodation' ? 'Booking' : 'Reservation'}`}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AccommodationBooking;


