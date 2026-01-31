import React, { useState, useEffect } from 'react';
import './ContestInfo.css';

interface ContestInfoProps {
  activeContest: any;
}

const ContestInfo: React.FC<ContestInfoProps> = ({ activeContest }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!activeContest) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(activeContest.fin).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeRemaining('Terminé');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const timeString = days > 0 
        ? `${days}j ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      setTimeRemaining(timeString);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeContest]);

  if (!activeContest) {
    return null;
  }

  return (
    <div className="contest-info-container">
      <div className="contest-header">
        <div className="contest-title-row">
          <h2>🏆 Contest</h2>
          <h3>{activeContest?.nom}</h3>
        </div>
      </div>
      
      {timeRemaining && (
        <div className={`countdown ${timeRemaining === 'Terminé' ? 'ended' : 'active'}`}>
          <div className="countdown-header">
            <span className="countdown-label">⏰ Temps restant</span>
            <span className="countdown-status">
              {timeRemaining === 'Terminé' ? '🔴 Terminé' : '🟢 En cours'}
            </span>
          </div>
          <div className="countdown-time">{timeRemaining}</div>
        </div>
      )}
    </div>
  );
};

export default ContestInfo;
