import React, { memo } from "react";

// Simple Section Title
const SectionTitle = memo(({ title, subtitle }) => (
  <div className="text-center mb-12">
    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">{subtitle}</p>
    )}
  </div>
));

SectionTitle.displayName = 'SectionTitle';

// Simple Card
const SimpleCard = memo(({ children, className = "" }) => (
  <div className={`relative p-6 bg-slate-800/50 border border-sky-800/50 rounded-xl hover:border-sky-600/50 transition-colors ${className}`}>
    {children}
  </div>
));

SimpleCard.displayName = 'SimpleCard';

const UltraAbout = memo(() => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-12 bg-slate-950">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionTitle
          title="About DaKshaa"
          subtitle="Where Innovation Meets Culture"
        />

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* About College */}
          <SimpleCard>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🏛️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">K.S.Rangasamy College of Technology</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  An autonomous institution affiliated to Anna University, Chennai. 
                  Established in 1994, KSRCT has been a pioneer in technical education, 
                  nurturing future engineers and innovators.
                </p>
              </div>
            </div>
          </SimpleCard>

          {/* About Event */}
          <SimpleCard>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🎉</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">The Festival</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  DaKshaa T26 is the annual National Level Techno-Cultural Fest featuring 
                  25+ events, 20+ workshops, hackathons, and cultural performances over 3 exciting days.
                </p>
              </div>
            </div>
          </SimpleCard>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "3", label: "Days of Events" },
            { value: "25+", label: "Technical Events" },
            { value: "20+", label: "Workshops" },
            { value: "5000+", label: "Participants" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-slate-800/30 rounded-xl border border-sky-900/30"
            >
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Event Highlights */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Event Highlights</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "💻", title: "Technical Events", desc: "Coding, robotics, and tech challenges" },
              { icon: "🎨", title: "Cultural Events", desc: "Dance, music, and art competitions" },
              { icon: "🔧", title: "Workshops", desc: "Hands-on learning with experts" },
              { icon: "🏆", title: "Hackathons", desc: "24-hour innovation marathons" },
              { icon: "🎤", title: "Guest Lectures", desc: "Industry leaders share insights" },
              { icon: "🎪", title: "Pro Shows", desc: "Entertainment and performances" },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-sky-600/50 transition-colors"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

UltraAbout.displayName = 'UltraAbout';

export default UltraAbout;
