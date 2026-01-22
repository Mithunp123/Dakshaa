import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Check,
  Sparkles,
  TrendingDown,
  Lock,
  Unlock,
  AlertCircle,
  Tag
} from 'lucide-react';

const ComboCard = ({ combo, onSelect, isSelected, userPurchasedCombos = [] }) => {
  const comboId = combo.id || combo.combo_id;
  const isPurchased = userPurchasedCombos.includes(comboId);
  const isAvailable = combo.is_active && !isPurchased;

  // Calculate discount percentage based on original_price if available
  const originalPrice = parseFloat(combo.original_price) || 0;
  const comboPrice = parseFloat(combo.price) || 0;
  const discount = originalPrice > comboPrice ? Math.round(((originalPrice - comboPrice) / originalPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isAvailable ? { y: -8, scale: 1.02 } : {}}
      onClick={() => isAvailable && onSelect(combo)}
      className={`group relative rounded-3xl overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-br from-secondary/20 to-primary/20 border-2 border-secondary shadow-2xl shadow-secondary/30'
          : isPurchased
          ? 'bg-white/5 border border-green-500/30 opacity-60 cursor-not-allowed'
          : !combo.is_active
          ? 'bg-white/5 border border-white/5 opacity-40 cursor-not-allowed'
          : 'bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/30 hover:shadow-xl cursor-pointer'
      }`}
    >
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-32 h-32 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header with Badge */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{combo.name || combo.combo_name}</h3>
                {discount > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <TrendingDown size={14} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400">Save {discount}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Icon */}
            {isPurchased ? (
              <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <span className="text-xs font-bold text-green-400">Purchased</span>
              </div>
            ) : !combo.is_active ? (
              <Lock size={20} className="text-gray-500" />
            ) : isSelected ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
              >
                <Check size={18} className="text-white" />
              </motion.div>
            ) : (
              <Unlock size={20} className="text-green-400" />
            )}
          </div>

          {(combo.description || combo.combo_description) && (
            <p className="text-sm text-gray-400 line-clamp-2">{combo.description || combo.combo_description}</p>
          )}
        </div>

        {/* Price Section */}
        <div className="flex items-end gap-3">
          {discount > 0 && originalPrice > 0 && (
            <span className="text-xl text-gray-500 line-through">₹{originalPrice}</span>
          )}
          <div>
            <span className="text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              ₹{comboPrice}
            </span>
          </div>
        </div>

        {/* Category Quotas - Shows how many events to select from each category */}
        {combo.category_quotas && Object.keys(combo.category_quotas).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Select Events From</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(combo.category_quotas).map(([category, count]) => {
                // Handle both number counts and any other format
                const displayCount = typeof count === 'number' ? count : 1;
                return (
                  <div
                    key={category}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs"
                  >
                    <span className="font-bold text-secondary">{displayCount}</span>
                    <span className="text-gray-400 ml-1 capitalize">{category}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 italic">
              You'll choose {Object.values(combo.category_quotas).reduce((sum, c) => sum + (typeof c === 'number' ? c : 1), 0)} events after selecting this combo
            </p>
          </div>
        )}

        {/* Purchases Count & Availability */}
        <div className="space-y-2">
          {combo.total_purchases !== undefined && combo.total_purchases > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-xs text-purple-400">
                <strong>{combo.total_purchases}</strong> students already purchased
              </span>
            </div>
          )}
          
          {/* Availability Status */}
          {combo.max_purchases && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
              combo.is_available !== false
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {combo.is_available !== false ? (
                <>
                  <Unlock size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">
                    <strong>{combo.max_purchases - (combo.current_purchases || 0)}</strong> spots left
                  </span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-red-400" />
                  <span className="text-xs text-red-400">Sold Out</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Status Message */}
        {!combo.is_active && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={14} className="text-red-400" />
            <span className="text-xs text-red-400 font-bold">Currently Unavailable</span>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      {isAvailable && !isSelected && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/50 rounded-3xl transition-all pointer-events-none" />
      )}

      {/* Best Value Badge */}
      {discount >= 20 && (
        <div className="absolute top-4 right-4">
          <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg">
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-white" />
              <span className="text-xs font-bold text-white">Best Value</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ComboCard;
