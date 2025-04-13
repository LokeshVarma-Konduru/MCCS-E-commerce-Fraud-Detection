import React, { useState } from 'react';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors
} from 'chart.js';
import '../styles/Developer.css';
import '../styles/ModelPerformance.css';
import PageHeader from '../components/PageHeader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

const ModelPerformance = () => {
  const metrics = {
    accuracy: {
      label: 'Accuracy',
      value: '97.8%',
      change: '+2.1% from last month'
    },
    precision: {
      label: 'Precision',
      value: '95.3%',
      change: '+1.7% from last month'
    },
    recall: {
      label: 'Recall',
      value: '94.1%',
      change: '-0.5% from last month'
    },
    f1Score: {
      label: 'F1 Score',
      value: '94.7%',
      change: '+0.8% from last month'
    }
  };

  // Sample ROC curve data
  const rocData = {
    labels: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    datasets: [
      {
        label: 'Current Model (AUC = 0.978)',
        data: [0, 0.72, 0.85, 0.91, 0.94, 0.96, 0.97, 0.98, 0.99, 0.995, 1.0],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4,
        fill: false,
        borderWidth: 2
      },
      {
        label: 'Previous Model (AUC = 0.957)',
        data: [0, 0.65, 0.78, 0.86, 0.90, 0.93, 0.95, 0.96, 0.97, 0.98, 1.0],
        borderColor: '#95a5a6',
        backgroundColor: 'rgba(149, 165, 166, 0.1)',
        tension: 0.4,
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5]
      }
    ]
  };

  const rocOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          padding: 20,
          color: '#4a5568',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#2d3748',
        bodyColor: '#4a5568',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: '600'
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        displayColors: false
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'False Positive Rate',
          color: '#4a5568',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#718096',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'True Positive Rate',
          color: '#4a5568',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#718096',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      }
    }
  };

  // Confusion matrix data
  const confusionMatrix = {
    data: [
      [9750, 250],   // True Negatives, False Positives
      [150, 9850]    // False Negatives, True Positives
    ],
    labels: ['Actual Non-Fraud', 'Actual Fraud']
  };

  const [selectedDataset, setSelectedDataset] = useState('internal');
  const [trainingConfig, setTrainingConfig] = useState('default');

  const renderMetricCard = (metric) => {
    const isPositive = !metric.change.startsWith('-');
    return (
      <div className="metric-card">
        <div className="metric-label">{metric.label}</div>
        <div className="metric-value">
          {metric.value}
        </div>
        <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
          {metric.change}
        </div>
      </div>
    );
  };

  const renderConfusionMatrix = () => {
    const total = confusionMatrix.data.flat().reduce((a, b) => a + b, 0);
    return (
      <div className="confusion-matrix-container">
        <table className="confusion-matrix-table">
          <thead>
            <tr>
              <th></th>
              <th>Predicted Non-Fraud</th>
              <th>Predicted Fraud</th>
            </tr>
          </thead>
          <tbody>
            {confusionMatrix.data.map((row, i) => (
              <tr key={i}>
                <th>{confusionMatrix.labels[i]}</th>
                {row.map((value, j) => (
                  <td key={j} className={j === i ? 'correct' : 'incorrect'}>
                    <div className="cell-value">{value.toLocaleString()}</div>
                    <div className="cell-percentage">
                      {((value / total) * 100).toFixed(1)}%
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="developer-container model-performance">
      <div className="top-navigation">
        <nav className="nav-menu">
          <Link to="/developer" className="nav-item">
            <FaHome className="nav-icon" />
            <span>Dashboard</span>
          </Link>
          <Link to="/api-integration" className="nav-item">
            <FaCode className="nav-icon" />
            <span>API Integration</span>
          </Link>
          <Link to="/model-performance" className="nav-item active">
            <FaChartLine className="nav-icon" />
            <span>Model Performance</span>
          </Link>
          <Link to="/transaction-monitoring" className="nav-item">
            <FaExchangeAlt className="nav-icon" />
            <span>Transaction Monitoring</span>
          </Link>
        </nav>
      </div>

      <div className="main-content">
        <PageHeader title="Model Performance" />
        <div className="performance-header">
          <div className="last-retrained">Last Retrained: 2024-03-10</div>
        </div>

        <div className="stats-grid">
          {Object.values(metrics).map((metric) => renderMetricCard(metric))}
        </div>

        <div className="performance-comparison">
          <h3>Performance Comparison</h3>
          <div className="comparison-grid">
            <div className="comparison-chart">
              <h4>ROC Curve</h4>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line data={rocData} options={rocOptions} />
              </div>
            </div>
            <div className="confusion-matrix">
              <h4>Confusion Matrix</h4>
              {renderConfusionMatrix()}
            </div>
          </div>
        </div>

        <div className="retrain-section">
          <h3>Retrain Model</h3>
          <div className="retrain-options">
            <div className="option-group">
              <label>Dataset Selection</label>
              <select 
                value={selectedDataset} 
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="dataset-select"
              >
                <option value="internal">Internal Dataset (Recommended)</option>
                <option value="external">External Dataset</option>
                <option value="custom">Custom Dataset</option>
              </select>
            </div>
            <div className="option-group">
              <label>Training Parameters</label>
              <select 
                value={trainingConfig} 
                onChange={(e) => setTrainingConfig(e.target.value)}
                className="config-select"
              >
                <option value="default">Default Configuration</option>
                <option value="custom">Custom Configuration</option>
              </select>
            </div>
          </div>
          <button className="retrain-button">
            Trigger Retraining
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelPerformance;
