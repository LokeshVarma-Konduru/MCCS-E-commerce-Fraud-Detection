import React, { useState, useEffect } from 'react';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt, FaSync, FaInfoCircle } from 'react-icons/fa';
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
import { getMLModelMetrics, getModelById } from '../api';

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
  // State for model data
  const [allModels, setAllModels] = useState([]);
  const [primaryModelId, setPrimaryModelId] = useState(null);
  const [comparisonModelId, setComparisonModelId] = useState(null);
  const [primaryModel, setPrimaryModel] = useState(null);
  const [comparisonModel, setComparisonModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState('0'); // Default to Class 0
  
  // Fetch all available models
  useEffect(() => {
    const fetchAllModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMLModelMetrics();
        
        if (response.data.success && response.data.data.length > 0) {
          setAllModels(response.data.data);
          setPrimaryModelId(response.data.data[0]._id);
        } else {
          setError('No model data available');
        }
      } catch (err) {
        console.error('Error fetching models:', err);
        setError(err.message || 'Failed to fetch model data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllModels();
  }, []);
  
  // Fetch primary model data when primaryModelId changes
  useEffect(() => {
    const fetchPrimaryModel = async () => {
      if (!primaryModelId) return;
      
      try {
        setLoading(true);
        const response = await getModelById(primaryModelId);
        
        if (response.data.success) {
          setPrimaryModel(response.data.data);
        } else {
          setError('Failed to fetch primary model data');
        }
      } catch (err) {
        console.error('Error fetching primary model:', err);
        setError(err.message || 'Failed to fetch primary model');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrimaryModel();
  }, [primaryModelId]);
  
  // Fetch comparison model data when comparisonModelId changes
  useEffect(() => {
    const fetchComparisonModel = async () => {
      if (!comparisonModelId || !compareMode) {
        setComparisonModel(null);
        return;
      }
      
      try {
        setLoading(true);
        const response = await getModelById(comparisonModelId);
        
        if (response.data.success) {
          setComparisonModel(response.data.data);
        } else {
          setError('Failed to fetch comparison model data');
        }
      } catch (err) {
        console.error('Error fetching comparison model:', err);
        setError(err.message || 'Failed to fetch comparison model');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComparisonModel();
  }, [comparisonModelId, compareMode]);
  
  // Extract metrics from model data based on selected class
  const getModelMetrics = (model) => {
    if (!model || !model.metrics) return null;
    
    // Get metrics from model data
    const accuracyMetric = model.metrics?.find(m => m.name === 'accuracy');
    const classificationReport = model.metrics?.find(m => m.name === 'classification_report')?.value;
    
    if (!classificationReport) {
      return {
        accuracy: {
          label: 'Accuracy',
          value: `${((accuracyMetric?.value || 0) * 100).toFixed(1)}%`,
          change: model.additionalInfo?.accuracyChange || ''
        },
        precision: {
          label: 'Precision',
          value: `${(model.metrics.find(m => m.name === 'precision')?.value * 100 || 0).toFixed(1)}%`,
          change: model.additionalInfo?.precisionChange || ''
        },
        recall: {
          label: 'Recall',
          value: `${(model.metrics.find(m => m.name === 'recall')?.value * 100 || 0).toFixed(1)}%`,
          change: model.additionalInfo?.recallChange || ''
        },
        f1Score: {
          label: 'F1 Score',
          value: `${(model.metrics.find(m => m.name === 'f1_score')?.value * 100 || 0).toFixed(1)}%`,
          change: model.additionalInfo?.f1Change || ''
        }
      };
    }
    
    // Get the appropriate metrics based on selected class
    const classKey = selectedClass;
    const classData = classificationReport[classKey];
    
    // For macro/weighted average, the structure is slightly different
    const isSummary = classKey === 'macro avg' || classKey === 'weighted avg';
    
    // Format metrics for display
    return {
      accuracy: {
        label: 'Accuracy',
        value: `${((accuracyMetric?.value || 0) * 100).toFixed(1)}%`,
        change: model.additionalInfo?.accuracyChange || ''
      },
      precision: {
        label: 'Precision',
        value: classData ? 
          `${(classData.precision * 100).toFixed(1)}%` : 
          `${(model.metrics.find(m => m.name === 'precision')?.value * 100 || 0).toFixed(1)}%`,
        change: model.additionalInfo?.precisionChange || ''
      },
      recall: {
        label: 'Recall',
        value: classData ? 
          `${(classData.recall * 100).toFixed(1)}%` : 
          `${(model.metrics.find(m => m.name === 'recall')?.value * 100 || 0).toFixed(1)}%`,
        change: model.additionalInfo?.recallChange || ''
      },
      f1Score: {
        label: 'F1 Score',
        value: classData ? 
          `${(classData['f1-score'] * 100).toFixed(1)}%` : 
          `${(model.metrics.find(m => m.name === 'f1_score')?.value * 100 || 0).toFixed(1)}%`,
        change: model.additionalInfo?.f1Change || ''
      }
    };
  };
  
  // Get metrics for display
  const primaryMetrics = primaryModel ? getModelMetrics(primaryModel) : null;
  const comparisonMetrics = comparisonModel ? getModelMetrics(comparisonModel) : null;
  
  // Fallback to sample data if no real data is available
  const metrics = primaryMetrics || {
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

  // Generate ROC curve data from model data
  const generateRocData = () => {
    // Default x-axis values (false positive rate)
    const defaultLabels = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    
    // Get ROC data from primary model if available
    const primaryRocData = primaryModel?.metrics?.find(m => m.name === 'roc_curve')?.value;
    const primaryAuc = primaryModel?.metrics?.find(m => m.name === 'auc')?.value || 0.978;
    
    // Get ROC data from comparison model if available
    const comparisonRocData = comparisonModel?.metrics?.find(m => m.name === 'roc_curve')?.value;
    const comparisonAuc = comparisonModel?.metrics?.find(m => m.name === 'auc')?.value || 0.957;
    
    // Create datasets array
    const datasets = [];
    
    // Add primary model dataset
    datasets.push({
      label: `${primaryModel?.modelName || 'Current Model'} (AUC = ${primaryAuc.toFixed(3)})`,
      data: primaryRocData?.y || [0, 0.72, 0.85, 0.91, 0.94, 0.96, 0.97, 0.98, 0.99, 0.995, 1.0],
      borderColor: '#3498db',
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      tension: 0.4,
      fill: false,
      borderWidth: 2
    });
    
    // Add comparison model dataset if in compare mode
    if (compareMode && comparisonModel) {
      datasets.push({
        label: `${comparisonModel.modelName || 'Comparison Model'} (AUC = ${comparisonAuc.toFixed(3)})`,
        data: comparisonRocData?.y || [0, 0.65, 0.78, 0.86, 0.90, 0.93, 0.95, 0.96, 0.97, 0.98, 1.0],
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.4,
        fill: false,
        borderWidth: 2
      });
    } else {
      // Add previous model as fallback if not in compare mode
      datasets.push({
        label: 'Previous Model (AUC = 0.957)',
        data: [0, 0.65, 0.78, 0.86, 0.90, 0.93, 0.95, 0.96, 0.97, 0.98, 1.0],
        borderColor: '#95a5a6',
        backgroundColor: 'rgba(149, 165, 166, 0.1)',
        tension: 0.4,
        fill: false,
        borderWidth: 2,
        borderDash: [5, 5]
      });
    }
    
    return {
      labels: primaryRocData?.x || defaultLabels,
      datasets
    };
  };
  
  // Generate ROC curve data
  const rocData = generateRocData();

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

  // Generate confusion matrix data from model data
  const generateConfusionMatrix = (model) => {
    if (!model || !model.metrics) {
      // Return default data if no model data is available
      return {
        data: [
          [9750, 250],   // True Negatives, False Positives
          [150, 9850]    // False Negatives, True Positives
        ],
        labels: ['Actual Non-Fraud', 'Actual Fraud']
      };
    }
    
    // Get confusion matrix data from model
    const matrixData = model.metrics.find(m => m.name === 'confusion_matrix')?.value;
    
    if (!matrixData) {
      // Return default data if no confusion matrix data is available
      return {
        data: [
          [9750, 250],   // True Negatives, False Positives
          [150, 9850]    // False Negatives, True Positives
        ],
        labels: ['Actual Non-Fraud', 'Actual Fraud']
      };
    }
    
    return {
      data: matrixData,
      labels: ['Actual Non-Fraud', 'Actual Fraud']
    };
  };
  
  // Get confusion matrix data for primary and comparison models
  const primaryConfusionMatrix = generateConfusionMatrix(primaryModel);
  const comparisonConfusionMatrix = generateConfusionMatrix(comparisonModel);
  
  // Use primary confusion matrix as default
  const confusionMatrix = primaryConfusionMatrix;

  const [selectedDataset, setSelectedDataset] = useState('internal');
  const [trainingConfig, setTrainingConfig] = useState('default');

  const renderMetricCard = (metric) => {
    const hasChange = metric.change && metric.change.trim() !== '';
    const isPositive = hasChange && !metric.change.startsWith('-');
    
    return (
      <div className="metric-card">
        <div className="metric-label">{metric.label}</div>
        <div className="metric-value">
          {metric.value}
        </div>
        {hasChange && (
          <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
            {metric.change}
          </div>
        )}
      </div>
    );
  };

  const renderConfusionMatrix = (matrix, title = null) => {
    const total = matrix.data.flat().reduce((a, b) => a + b, 0);
    return (
      <div className="confusion-matrix-container">
        {title && <h5 className="matrix-title">{title}</h5>}
        <table className="confusion-matrix-table">
          <thead>
            <tr>
              <th></th>
              <th>Predicted Non-Fraud</th>
              <th>Predicted Fraud</th>
            </tr>
          </thead>
          <tbody>
            {matrix.data.map((row, i) => (
              <tr key={i}>
                <th>{matrix.labels[i]}</th>
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
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading model data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">Error: {error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="performance-header">
              <div className="model-controls">
                <div className="control-section primary-model-section">
                  <div className="section-label">Primary Model</div>
                  <div className="model-selector">
                    <select 
                      value={primaryModelId || ''} 
                      onChange={(e) => setPrimaryModelId(e.target.value)}
                      className="model-select"
                    >
                      <option value="">Select a model</option>
                      {allModels.map(model => (
                        <option key={model._id} value={model._id}>
                          {model.modelName} ({model.modelType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="control-section metrics-class-section">
                  <div className="section-label">Metrics Class</div>
                  <div className="class-selector">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="class-select"
                    >
                      <option value="0">Class 0 (Non-Fraud)</option>
                      <option value="1">Class 1 (Fraud)</option>
                      <option value="macro avg">Macro Average</option>
                      <option value="weighted avg">Weighted Average</option>
                    </select>
                  </div>
                </div>
                
                <div className="control-section comparison-section">
                  <div className="comparison-toggle">
                    <button 
                      className={`compare-button ${compareMode ? 'active' : ''}`}
                      onClick={() => setCompareMode(!compareMode)}
                    >
                      {compareMode ? 'Comparison Active' : 'Compare Models'}
                    </button>
                  </div>
                  
                  {compareMode && (
                    <div className="comparison-model-selector">
                      <div className="section-label">Comparison Model</div>
                      <select 
                        value={comparisonModelId || ''} 
                        onChange={(e) => setComparisonModelId(e.target.value)}
                        className="model-select comparison-select"
                      >
                        <option value="">Select a model</option>
                        {allModels
                          .filter(model => model._id !== primaryModelId)
                          .map(model => (
                            <option key={model._id} value={model._id}>
                              {model.modelName} ({model.modelType})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* <div className="last-retrained">
                Last Retrained: {primaryModel ? new Date(primaryModel.createdAt).toLocaleDateString() : 'N/A'}
              </div> */}
            </div>

            <div className="stats-grid">
              {compareMode && comparisonModel ? (
                <>
                  <div className="metrics-comparison">
                    <h4>Primary Model: {primaryModel?.modelName}</h4>
                    <div className="metrics-row">
                      {Object.values(metrics).map((metric) => renderMetricCard(metric))}
                    </div>
                  </div>
                  <div className="metrics-comparison">
                    <h4>Comparison Model: {comparisonModel?.modelName}</h4>
                    <div className="metrics-row">
                      {Object.values(comparisonMetrics || {}).map((metric) => renderMetricCard(metric))}
                    </div>
                  </div>
                </>
              ) : (
                Object.values(metrics).map((metric) => renderMetricCard(metric))
              )}
            </div>
          </>
        )}

        {!loading && !error && (
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
                {compareMode && comparisonModel ? (
                  <div className="matrix-comparison">
                    <div className="matrix-column">
                      {renderConfusionMatrix(primaryConfusionMatrix, primaryModel?.modelName)}
                    </div>
                    <div className="matrix-column">
                      {renderConfusionMatrix(comparisonConfusionMatrix, comparisonModel?.modelName)}
                    </div>
                  </div>
                ) : (
                  renderConfusionMatrix(confusionMatrix)
                )}
              </div>
            </div>
          </div>
        )}

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
