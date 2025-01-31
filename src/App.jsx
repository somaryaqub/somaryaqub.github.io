import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, parse, isAfter, addMinutes, subMinutes } from 'date-fns';

function App() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hijriDate, setHijriDate] = useState(null);
  const [lastPrayer, setLastPrayer] = useState(null);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [animatingPrayer, setAnimatingPrayer] = useState(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const warningRef = useRef(null);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const response = await axios.get(
          'https://api.aladhan.com/v1/timingsByCity',
          {
            params: {
              city: 'Edmonton',
              country: 'Canada',
              method: 2
            }
          }
        );
        setPrayerTimes(response.data.data.timings);
        setHijriDate(response.data.data.date.hijri);
      } catch (err) {
        setError('Failed to fetch prayer times');
        console.error(err);
      }
    };

    fetchPrayerTimes();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prayerTimes) {
      const currentPrayer = getCurrentPrayer();
      if (currentPrayer !== lastPrayer) {
        if (lastPrayer) {
          setAnimatingPrayer(lastPrayer);
          setShouldAnimate(true);
        }
        setLastPrayer(currentPrayer);
      }
    }
  }, [currentTime, prayerTimes]);

  useEffect(() => {
    if (prayerTimes) {
      const period = getCurrentPrayerPeriod();
      if (period) {
        document.documentElement.style.setProperty('--bg-current', `var(--bg-${period.toLowerCase()})`);
        document.documentElement.style.setProperty('--gradient-current', `var(--gradient-${period.toLowerCase()})`);
      } else {
        document.documentElement.style.setProperty('--bg-current', 'var(--bg-night)');
        document.documentElement.style.setProperty('--gradient-current', 'var(--gradient-night)');
      }
    }
  }, [currentTime, prayerTimes]);

  useEffect(() => {
    let warningTimeout;
    if (prayerTimes) {
      const shouldShow = shouldShowWarning();
      if (shouldShow && !isWarningVisible) {
        setIsWarningVisible(true);
      } else if (!shouldShow && isWarningVisible) {
        if (warningRef.current) {
          warningRef.current.classList.add('fade-out');
          warningTimeout = setTimeout(() => {
            setIsWarningVisible(false);
          }, 10000); // Wait for the animation to complete
        }
      }
    }
    return () => {
      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
    };
  }, [currentTime, prayerTimes, isWarningVisible]);

  const timeToPosition = (timeStr) => {
    const time = parse(timeStr, 'HH:mm', new Date());
    const hours = time.getHours() + time.getMinutes() / 60;
    
    const startHour = 4;
    const endHour = 23;
    const totalHours = endHour - startHour;
    
    let position = ((hours - startHour) / totalHours) * 100;
    position = Math.max(0, Math.min(100, position));
    return 100 - position;
  };

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    const startHour = 4;
    const endHour = 23;
    const totalHours = endHour - startHour;
    
    let position = ((hours - startHour) / totalHours) * 100;
    position = Math.max(0, Math.min(100, position));
    return 100 - position;
  };

  const shouldShowWarning = () => {
    if (!prayerTimes) return false;
    
    const warningPrayers = ['Maghrib', 'Dhuhr', 'Sunrise'];
    const now = format(currentTime, 'HH:mm');
    
    for (const prayer of warningPrayers) {
      if (!prayerTimes[prayer]) continue;
      
      const prayerTime = parse(prayerTimes[prayer], 'HH:mm', new Date());
      const warningTime = subMinutes(prayerTime, 15);
      const currentDateTime = parse(now, 'HH:mm', new Date());
      
      if (isAfter(currentDateTime, warningTime) && !isAfter(currentDateTime, prayerTime)) {
        return true;
      }
    }
    return false;
  };

  const getCurrentPrayerPeriod = () => {
    if (!prayerTimes) return null;

    const now = format(currentTime, 'HH:mm');
    const times = {
      Fajr: prayerTimes.Fajr,
      Sunrise: prayerTimes.Sunrise,
      Dhuhr: prayerTimes.Dhuhr,
      Asr: prayerTimes.Asr,
      Maghrib: prayerTimes.Maghrib,
      Isha: prayerTimes.Isha
    };

    if (now >= times.Isha) return 'Isha';
    if (now < times.Fajr) return 'Night';
    if (now < times.Sunrise) return 'Fajr';
    if (now < times.Dhuhr) return 'Morning';
    if (now < times.Asr) return 'Dhuhr';
    if (now < times.Maghrib) return 'Asr';
    if (now < times.Isha) return 'Maghrib';
    return 'Isha';
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    const now = format(currentTime, 'HH:mm');
    const times = Object.entries(prayerTimes).filter(([key]) => prayerNames[key]);
    
    for (const [key, time] of times) {
      if (time > now) return key;
    }
    return null;
  };

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;
    const now = format(currentTime, 'HH:mm');
    const times = Object.entries(prayerTimes)
      .filter(([key]) => prayerNames[key])
      .sort((a, b) => a[1].localeCompare(b[1]));
    
    let currentPrayer = null;
    for (const [key, time] of times) {
      if (time > now) break;
      currentPrayer = key;
    }
    return currentPrayer;
  };

  const isCurrentPrayer = (key) => {
    return key === getCurrentPrayer();
  };

  const isNextPrayer = (key) => {
    return key === getNextPrayer();
  };

  const isPrayerPast = (prayerTime) => {
    const now = format(currentTime, 'HH:mm');
    return now > prayerTime;
  };

  const shouldTruncateName = (position) => {
    return Math.abs(position - 33) < 5;
  };

  const getBackgroundGradient = () => {
    return '';
  };

  const getTextColor = () => {
    const period = getCurrentPrayerPeriod();
    if (!period) return 'var(--text-light)';
    return ['Night', 'Fajr', 'Maghrib', 'Isha'].includes(period) 
      ? 'var(--text-dark)'
      : 'var(--text-light)';
  };

  const renderFlutterText = (text, position) => {
    return (
      <span className={`flutter-text ${shouldAnimate ? 'animate' : ''}`}>
        {text.split('').map((char, index) => (
          <span
            key={index}
            style={{ '--char-index': index }}
            onAnimationEnd={index === text.length - 1 ? () => setShouldAnimate(false) : undefined}
          >
            {char}
          </span>
        ))}
      </span>
    );
  };

  const solidTimeMarkers = [6, 9, 12, 15, 18, 21];
  const allHourMarkers = Array.from({ length: 20 }, (_, i) => i + 4);

  const prayerNames = {
    Fajr: 'Fajr',
    Sunrise: 'Sunrise',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha'
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!prayerTimes || !hijriDate) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading prayer times...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative use-background-images">
      <div className="prayer-background"></div>
      <div className="h-screen relative z-10">
        {/* Timeline Container */}
        <div className="absolute inset-0 pt-24 sm:pt-32 pb-4">
          {/* Hijri Date */}
          <div className="absolute w-full text-center" style={{ top: '33%' }}>
            <div className={`flex flex-col items-center ${getTextColor()}`}>
              <div className="text-2xl sm:text-3xl font-medium">{hijriDate.day}</div>
              <div className="text-xl sm:text-2xl">{hijriDate.month.en}</div>
              <div className="text-lg sm:text-xl">{hijriDate.year}</div>
              {isWarningVisible && (
                <div ref={warningRef} className="warning-sign text-red-600 text-2xl mt-2">⬣</div>
              )}
            </div>
          </div>

          {/* Hour markers */}
          {allHourMarkers.map(hour => {
            const isSolidMarker = solidTimeMarkers.includes(hour);
            return (
              <div
                key={hour}
                className="absolute right-0 flex items-center justify-end"
                style={{ top: `${100 - ((hour - 4) / 19) * 100}%` }}
              >
                <span className={`text-sm ${getTextColor()} mr-4`}>
                  {isSolidMarker ? (hour === 12 ? '12' : hour > 12 ? hour - 12 : hour) : '-'}
                </span>
              </div>
            );
          })}

          {/* Current time indicator */}
          <div
            className="absolute right-0 w-full flex justify-end items-center"
            style={{ top: `${getCurrentTimePosition()}%` }}
          >
            <div className={`text-white -translate-y-1/2 mr-6 text-xs`}>
              ✸
            </div>
          </div>

          {/* Prayer time markers */}
          {Object.entries(prayerNames).map(([key, name]) => {
            if (!prayerTimes[key]) return null;
            const position = timeToPosition(prayerTimes[key]);
            const isPast = isPrayerPast(prayerTimes[key]);
            const isCurrent = isCurrentPrayer(key);
            const isNext = isNextPrayer(key);
            const isAnimating = key === animatingPrayer;
            const truncateName = shouldTruncateName(position);
            
            return (
              <div
                key={key}
                className={`absolute w-full flex ${isPast && !isCurrent ? 'justify-start' : 'justify-end'} transition-all duration-1000`}
                style={{ top: `${position}%` }}
              >
                <div 
                  className={`
                    ${isPast && !isCurrent ? 'ml-4' : 'mr-8'}
                    ${isCurrent ? 'bg-white/20 rounded-full px-4' : 'px-2'} 
                    text-white py-2 -translate-y-1/2 transition-all duration-1000 
                    ${isPast && !isCurrent ? 'opacity-80' : ''}
                  `}
                >
                  {isAnimating ? (
                    renderFlutterText(`${truncateName ? name[0] : name} ${format(parse(prayerTimes[key], 'HH:mm', new Date()), 'h:mm')}`, position)
                  ) : (
                    <>
                      <span className={`text-sm sm:text-base ${isCurrent ? 'font-bold' : isNext ? 'font-normal' : 'font-medium'}`}>
                        {truncateName ? name[0] : name}
                      </span>
                      <span className="ml-2 text-sm sm:text-base">
                        {format(parse(prayerTimes[key], 'HH:mm', new Date()), 'h:mm')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;