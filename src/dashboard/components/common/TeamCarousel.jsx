import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────
   Team data — swap images / names as needed
───────────────────────────────────────────── */
const TEAM_MEMBERS = [
  {
    name: 'Emily Kim',
    role: 'Founder',
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=3687&auto=format&fit=crop',
  },
  {
    name: 'Michael Steward',
    role: 'Creative Director',
    image:
      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=3870&auto=format&fit=crop',
  },
  {
    name: 'Emma Rodriguez',
    role: 'Lead Developer',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&auto=format&fit=crop&q=60',
  },
  {
    name: 'Julia Gimmel',
    role: 'UX Designer',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60',
  },
  {
    name: 'Lisa Anderson',
    role: 'Marketing Manager',
    image:
      'https://images.unsplash.com/photo-1655249481446-25d575f1c054?w=900&auto=format&fit=crop&q=60',
  },
  {
    name: 'James Wilson',
    role: 'Product Manager',
    image:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=3687&auto=format&fit=crop',
  },
];

/* ─────────────────────────────────────────────
   Per-slot CSS transform + style identical to
   the original vanilla reference
───────────────────────────────────────────── */
function getSlotStyle(offset, total) {
  // offset = (cardIndex - currentIndex + total) % total
  if (offset === 0) {
    return {
      zIndex: 10,
      transform: 'scale(1.1) translateZ(0)',
      opacity: 1,
      pointerEvents: 'auto',
      filter: 'none',
    };
  }
  if (offset === 1) {
    return {
      zIndex: 5,
      transform: 'translateX(200px) scale(0.9) translateZ(-100px)',
      opacity: 0.9,
      pointerEvents: 'auto',
      filter: 'grayscale(100%)',
    };
  }
  if (offset === 2) {
    return {
      zIndex: 1,
      transform: 'translateX(400px) scale(0.8) translateZ(-300px)',
      opacity: 0.7,
      pointerEvents: 'auto',
      filter: 'grayscale(100%)',
    };
  }
  if (offset === total - 1) {
    return {
      zIndex: 5,
      transform: 'translateX(-200px) scale(0.9) translateZ(-100px)',
      opacity: 0.9,
      pointerEvents: 'auto',
      filter: 'grayscale(100%)',
    };
  }
  if (offset === total - 2) {
    return {
      zIndex: 1,
      transform: 'translateX(-400px) scale(0.8) translateZ(-300px)',
      opacity: 0.7,
      pointerEvents: 'auto',
      filter: 'grayscale(100%)',
    };
  }
  // hidden
  return {
    zIndex: 0,
    transform: 'scale(0.6)',
    opacity: 0,
    pointerEvents: 'none',
    filter: 'grayscale(100%)',
  };
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function TeamCarousel({ members = TEAM_MEMBERS }) {
  const total = members.length;
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nameVisible, setNameVisible] = useState(true);
  const touchStartX = useRef(0);

  const goTo = useCallback(
    (newIdx) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setNameVisible(false);

      const resolved = ((newIdx % total) + total) % total;

      setTimeout(() => {
        setCurrent(resolved);
        setNameVisible(true);
      }, 300);

      setTimeout(() => setIsAnimating(false), 800);
    },
    [isAnimating, total]
  );

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goTo]);

  /* touch swipe */
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  };

  return (
    <section
      className="relative w-full overflow-hidden py-12 select-none"
      style={{ background: '#f5f5f5' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── BIG TITLE ───────────────────────────────────── */}
      <h1
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap font-black uppercase"
        style={{
          fontFamily: '"Arial Black", "Arial Bold", Arial, sans-serif',
          fontSize: 'clamp(3rem, 9vw, 7.5rem)',
          letterSpacing: '-0.02em',
          background:
            'linear-gradient(to bottom, rgba(8,42,123,0.35) 30%, rgba(255,255,255,0) 76%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          lineHeight: 1,
        }}
      >
        OUR TEAM
      </h1>

      {/* ── CAROUSEL TRACK ──────────────────────────────── */}
      <div
        className="relative mx-auto mt-20 flex items-center justify-center"
        style={{
          maxWidth: 1200,
          height: 420,
          perspective: '1000px',
        }}
      >
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous member"
          className="absolute left-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-none text-white text-2xl transition-all duration-300 cursor-pointer hover:scale-110"
          style={{ background: 'rgba(8,42,123,0.6)', paddingRight: 3, paddingBottom: 4 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(8,42,123,0.6)')}
        >
          ‹
        </button>

        {/* Cards */}
        <div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {members.map((member, i) => {
            const offset = ((i - current) % total + total) % total;
            const slotStyle = getSlotStyle(offset, total);

            return (
              <div
                key={i}
                onClick={() => goTo(i)}
                className="absolute rounded-[20px] overflow-hidden bg-white shadow-[0_20px_40px_rgba(0,0,0,0.15)] cursor-pointer"
                style={{
                  width: 280,
                  height: 380,
                  /* center the card horizontally inside the track */
                  left: '50%',
                  top: '50%',
                  marginLeft: -140,
                  marginTop: -190,
                  transition: 'all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
                  ...slotStyle,
                }}
                aria-label={member.name}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  style={{
                    transition: 'filter 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
                    filter: slotStyle.filter,
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next member"
          className="absolute right-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-none text-white text-2xl transition-all duration-300 cursor-pointer hover:scale-110"
          style={{ background: 'rgba(8,42,123,0.6)', paddingLeft: 3, paddingBottom: 4 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
        >
          ›
        </button>
      </div>

      {/* ── MEMBER INFO ─────────────────────────────────── */}
      <div
        className="relative mt-10 text-center"
        style={{ transition: 'all 0.5s ease-out' }}
      >
        <h2
          className="relative inline-block font-bold"
          style={{
            color: 'rgb(8,42,123)',
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            marginBottom: 10,
            opacity: nameVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* left line */}
          <span
            className="absolute"
            style={{
              content: '""',
              top: '100%',
              left: -120,
              width: 100,
              height: 2,
              background: 'rgb(8,42,123)',
            }}
          />
          {members[current].name}
          {/* right line */}
          <span
            className="absolute"
            style={{
              content: '""',
              top: '100%',
              right: -120,
              width: 100,
              height: 2,
              background: 'rgb(8,42,123)',
            }}
          />
        </h2>

        <p
          className="font-medium uppercase tracking-widest"
          style={{
            color: '#848696',
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            opacity: nameVisible ? 0.8 : 0,
            transition: 'opacity 0.3s ease',
            marginTop: 8,
            letterSpacing: '0.1em',
          }}
        >
          {members[current].role}
        </p>
      </div>

      {/* ── DOTS ────────────────────────────────────────── */}
      <div className="mt-8 flex justify-center gap-2.5">
        {members.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to member ${i + 1}`}
            className="rounded-full border-none cursor-pointer transition-all duration-300"
            style={{
              width: i === current ? 14 : 12,
              height: i === current ? 14 : 12,
              background:
                i === current ? 'rgb(8,42,123)' : 'rgba(8,42,123,0.2)',
              transform: i === current ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </section>
  );
}
