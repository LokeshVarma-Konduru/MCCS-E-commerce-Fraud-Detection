import React from 'react';

/**
 * FraudScoreIndicator component to visualize fraud risk scores
 * @param {number} score - Risk score from 0-100
 * @returns {JSX.Element} - Visual indicator with color-coded bar and score value
 */
const FraudScoreIndicator = ({ score }) => {
  // Determine color based on score severity
  const color = score > 70 ? '#ef4444' : score > 30 ? '#f59e0b' : '#10b981';
  const width = `${score}%`;
  
  return (
    <div className="fraud-score">
      <div className="score-bar-container">
        <div 
          className="score-bar" 
          style={{ 
            width,
            backgroundColor: color
          }}
        />
      </div>
      <span className="score-value" style={{ color }}>{score}</span>
    </div>
  );
};

export default FraudScoreIndicator;
