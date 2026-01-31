import React, { useState, useEffect, memo } from "react";

// Simple Digit Display
const CountdownDigit = memo(({ value, label }) => (
  <div className="flex flex-col items-center mx-1 sm:mx-2">
    <span className="text-[10px] sm:text-xs font-orbitron uppercase text-cyan-300 mb-1 tracking-wider">
      {label}
    </span>
    <div className="relative bg-gradient-to-b from-sky-900 to-sky-950 border border-sky-700/50 rounded-lg p-2 sm:p-3 min-w-[50px] sm:min-w-[70px]">
      <span
        className="block text-center text-2xl sm:text-4xl md:text-5xl font-bold text-white"
        style={{
          textShadow: "0 0 20px rgba(14, 165, 233, 0.6)",
        }}
      >
        {String(value).padStart(2, '0')}
      </span>
    </div>
  </div>
));

CountdownDigit.displayName = 'CountdownDigit';

// Separator
const Separator = memo(() => (
  <div className="flex flex-col items-center justify-center gap-1 mx-1 mt-6">
    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
  </div>
));

Separator.displayName = 'Separator';

const UltraCountdown = memo(() => {
  const targetDate = new Date("2026-02-12T09:00:00").getTime();
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date().getTime();
    const difference = targetDate - now;
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Event Badge */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-500/50 rounded-lg">
          <span className="text-red-400 text-lg">⚡</span>
          <span className="text-white font-orbitron text-sm sm:text-base">
            FEB 12-14, 2026
          </span>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="flex items-center justify-center flex-wrap">
        <CountdownDigit value={timeLeft.days} label="Days" />
        <Separator />
        <CountdownDigit value={timeLeft.hours} label="Hours" />
        <Separator />
        <CountdownDigit value={timeLeft.minutes} label="Mins" />
        <Separator />
        <CountdownDigit value={timeLeft.seconds} label="Secs" />
      </div>

      {/* Bottom text */}
      <p className="text-center text-gray-400 text-xs sm:text-sm mt-4">
        Until the event begins
      </p>
    </div>
  );
});

UltraCountdown.displayName = 'UltraCountdown';

export default UltraCountdown;
