import { useRef, useEffect, useState } from 'react';
import './LocalFactsCarousel.css';

const GET_FACTS = (loc) => [
  { img: 'https://loremflickr.com/400/300/beach,plastic,cleanup/all', title: `${loc} Coastal Cleanup`, body: `Recent data shows ${loc} has recovered over 2,500 lbs of ocean-bound plastic this year alone.`, color: '#0ea5e9' },
  { img: 'https://loremflickr.com/400/300/microplastic,ocean/all', title: `Microplastics Alert`, body: `Samples in the ${loc} district reveal 30% less microplastics than the national average! Great work.`, color: '#0369a1' },
  { img: 'https://loremflickr.com/400/300/coral,reef/all', title: `Coral Restoration`, body: `New ${loc} marine initiatives are replanting 500+ coral fragments to restore the local reef ecosystem.`, color: '#0284c7' },
  { img: 'https://loremflickr.com/400/300/fishing,net,underwater/all', title: `Ghost Net Recovery`, body: `Local divers in ${loc} successfully removed 4 major commercial fishing nets, saving countless sea turtles.`, color: '#0284c7' },
  { img: 'https://loremflickr.com/400/300/dolphin,ocean/all', title: 'Wildlife Sightings', body: `Proper waste sorting directly impacts the marine cleanliness of ${loc}, leading to increased dolphin sightings!`, color: '#38bdf8' }
];

export default function LocalFactsCarousel({ location }) {
  const tickerRef = useRef(null);
  const wrapRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Parse location to a shorter format if possible
  let shortLocation = location?.includes(',') ? location.split(',')[1].trim() : (location?.split(' ')[0] || 'Your Region');
  if (shortLocation.toLowerCase() === 'local') {
    shortLocation = 'Your City';
  }
  const facts = GET_FACTS(shortLocation);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    // Clone children for infinite scroll effect (handled purely by CSS if possible, but JS for seamless)
    // Actually, since user wants manual scroll, let's use a native CSS auto-scroll via keyframes 
    // and rely on overflow / drag for manual scroll, OR standard JS scroll.
    
    // Instead of raw transform translation which breaks native scrolling, 
    // let's animate the scrollLeft property directly!
    let raf;
    let pos = ticker.scrollLeft;

    const animate = () => {
      if (!isHovered && !isDragging) {
        pos += 0.5; // scroll speed
        if (pos >= ticker.scrollWidth / 2) {
           pos = 0; // reset
        }
        ticker.scrollLeft = pos;
      } else {
        // sync pos with manual scroll
        pos = ticker.scrollLeft;
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isHovered, isDragging]);

  // Handle Drag to scroll manually
  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - tickerRef.current.offsetLeft);
    setScrollLeft(tickerRef.current.scrollLeft);
  };
  const onMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
  };
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tickerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast
    tickerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div 
      className="local-facts" 
      ref={wrapRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={onMouseLeave}
    >
      <div 
         className="local-facts__track" 
         ref={tickerRef}
         onMouseDown={onMouseDown}
         onMouseUp={onMouseUp}
         onMouseMove={onMouseMove}
      >
        {/* Double the facts for infinite loop effect */}
        {[...facts, ...facts].map((f, i) => (
          <div key={i} className="local-fact-card">
            <div className="local-fact-card__img-wrap">
              <img src={f.img} alt={f.title} className="local-fact-card__img" />
            </div>
            <div className="local-fact-card__content">
              <h3 className="local-fact-card__title">{f.title}</h3>
              <p className="local-fact-card__body">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
