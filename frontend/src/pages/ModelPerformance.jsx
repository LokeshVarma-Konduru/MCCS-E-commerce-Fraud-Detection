import React, { useState, useEffect, useRef } from "react";
import { FaInfoCircle } from "react-icons/fa";
import DeveloperNav from "../components/DeveloperNav";
import { Line } from "react-chartjs-2";
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
import "../styles/Developer.css";
import "../styles/ModelPerformance.css";
import PageHeader from "../components/PageHeader";
import { getMLModelMetrics, getModelById, uploadTrainingDataset } from "../api";

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

const SUPPORTED_FILE_TYPES = [".csv", ".xlsx", ".json", ".txt"];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const DEFAULT_CUSTOM_PARAMS = {
  learningRate: "0.15",
  nEstimators: "400",
  maxDepth: "10",
  minChildWeight: "3",
  gamma: "0.1",
  subsample: "0.8",
  colsampleByTree: "0.8",
  regAlpha: "0.1",
  cvFolds: "5",
  testSize: "0.2",
  scaler: "standard"
};

// Helper function to normalize names (handles case, spaces, underscores, prefixes)
const normalizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/^[^_]+_/, '') // Remove model prefix like "Logistic Regression_"
    .replace(/[\s_-]+/g, '_') // Convert spaces, hyphens to underscores
    .trim();
};

// Find metric by flexible name matching (works across all versions)
const findMetric = (metrics, searchName) => {
  if (!metrics || !Array.isArray(metrics)) return null;
  const normalizedSearch = normalizeName(searchName);
  
  return metrics.find(m => {
    if (!m || !m.name) return false;
    const normalizedMetricName = normalizeName(m.name);
    return normalizedMetricName === normalizedSearch;
  });
};

// Check if plot type matches search string (for filtering)
const plotTypeMatches = (plotType, searchString) => {
  if (!plotType || !searchString) return false;
  const normalizedType = normalizeName(plotType);
  const normalizedSearch = normalizeName(searchString);
  return normalizedType.includes(normalizedSearch);
};

// Group models by modelName for two-level dropdown
const groupModelsByName = (models) => {
  const grouped = {};
  
  models.forEach(model => {
    const key = model.modelName;
    
    if (!grouped[key]) {
      grouped[key] = {
        modelName: model.modelName,
        modelType: model.modelType,
        versions: []
      };
    }
    
    // Extract version from root or additionalInfo
    const version = model.version || model.additionalInfo?.version || 'v1.0.0';
    
    // Find accuracy for preview
    const accuracyMetric = findMetric(model.metrics, 'accuracy');
    
    grouped[key].versions.push({
      _id: model._id,
      version: version,
      createdAt: model.createdAt,
      accuracy: accuracyMetric?.value || null
    });
    
    // Sort versions by date (oldest first - v1.0.0 before v1.1.0)
    grouped[key].versions.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  });
  
  return grouped;
};

const ModelPerformance = () => {
  // State for model data
  const [allModels, setAllModels] = useState([]);
  const [groupedModels, setGroupedModels] = useState({});
  const [selectedModelName, setSelectedModelName] = useState(null); // Model name (e.g., "Logistic Regression")
  const [selectedVersionId, setSelectedVersionId] = useState(null); // Model _id (version)
  const [primaryModelId, setPrimaryModelId] = useState(null); // Keep for backward compatibility
  const [comparisonModelName, setComparisonModelName] = useState(null); // Comparison model name
  const [comparisonModelId, setComparisonModelId] = useState(null);
  const [primaryModel, setPrimaryModel] = useState(null);
  const [comparisonModel, setComparisonModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState('0'); // Default to Class 0
  
  // Fetch all available models and group them
  useEffect(() => {
    const fetchAllModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMLModelMetrics();
        
        if (response.data.success && response.data.data.length > 0) {
          const models = response.data.data;
          setAllModels(models);
          
          // Group models by name
          const grouped = groupModelsByName(models);
          setGroupedModels(grouped);
          
          // Auto-select first model and its oldest version (v1.0.0)
          const firstModelName = Object.keys(grouped)[0];
          if (firstModelName && grouped[firstModelName].versions.length > 0) {
            setSelectedModelName(firstModelName);
            // Select last version (oldest - v1.0.0) since we sort oldest first
            const lastVersionIndex = grouped[firstModelName].versions.length - 1;
            const oldestVersionId = grouped[firstModelName].versions[lastVersionIndex]._id;
            setSelectedVersionId(oldestVersionId);
            setPrimaryModelId(oldestVersionId);
          }
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
  
  // Sync selectedVersionId with primaryModelId
  useEffect(() => {
    if (selectedVersionId && selectedVersionId !== primaryModelId) {
      setPrimaryModelId(selectedVersionId);
    }
  }, [selectedVersionId]);

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
  
  // Extract metrics from model data based on selected class (using normalized search)
  const getModelMetrics = (model) => {
    if (!model || !model.metrics) return null;
    
    // Get metrics using normalized search (works for all versions)
    const accuracyMetric = findMetric(model.metrics, 'accuracy');
    
    // Try multiple name variations for classification report (v1.0.0 uses "classification_report", v1.1.0 uses "Classification Report")
    let classificationReportMetric = findMetric(model.metrics, 'classification_report');
    if (!classificationReportMetric) {
      classificationReportMetric = findMetric(model.metrics, 'Classification Report');
    }
    if (!classificationReportMetric) {
      classificationReportMetric = findMetric(model.metrics, 'classification report');
    }
    
    // Handle classification report - might be stored as JSON string or object
    let classificationReport = classificationReportMetric?.value;
    if (classificationReport && typeof classificationReport === 'string') {
      try {
        classificationReport = JSON.parse(classificationReport);
      } catch (e) {
        console.error('Error parsing classification report JSON:', e);
      }
    }
    
    if (!classificationReport) {
      const precisionMetric = findMetric(model.metrics, 'precision');
      const recallMetric = findMetric(model.metrics, 'recall');
      const f1ScoreMetric = findMetric(model.metrics, 'f1_score');
      
      return {
        accuracy: {
          label: 'Accuracy',
          value: `${((accuracyMetric?.value || 0) * 100).toFixed(1)}%`,
          change: model.additionalInfo?.accuracyChange || ''
        },
        precision: {
          label: 'Precision',
          value: `${(precisionMetric?.value * 100 || 0).toFixed(1)}%`,
          change: model.additionalInfo?.precisionChange || ''
        },
        recall: {
          label: 'Recall',
          value: `${(recallMetric?.value * 100 || 0).toFixed(1)}%`,
          change: model.additionalInfo?.recallChange || ''
        },
        f1Score: {
          label: 'F1 Score',
          value: `${(f1ScoreMetric?.value * 100 || 0).toFixed(1)}%`,
          change: model.additionalInfo?.f1Change || ''
        }
      };
    }
    
    // Helper to get class data (handles both string '0' and number 0 keys)
    const getClassData = (report, classKey) => {
      if (!report || typeof report !== 'object') return null;
      
      // Try string key first
      if (report[String(classKey)]) return report[String(classKey)];
      // Try number key
      if (report[Number(classKey)] !== undefined) return report[Number(classKey)];
      
      // Try iterating all keys
      for (const key in report) {
        if (String(key) === String(classKey) || Number(key) === Number(classKey)) {
          return report[key];
        }
      }
      
      return null;
    };
    
    // Get the appropriate metrics based on selected class
    const classKey = selectedClass;
    let classData = getClassData(classificationReport, classKey);
    
    // If not found with helper, try direct access
    if (!classData) {
      classData = classificationReport[classKey] || classificationReport[Number(classKey)] || null;
    }
    
    // Fallback metrics if class data not found
    const precisionMetric = findMetric(model.metrics, 'precision');
    const recallMetric = findMetric(model.metrics, 'recall');
    const f1ScoreMetric = findMetric(model.metrics, 'f1_score');
    
    // Format metrics for display
    return {
      accuracy: {
        label: 'Accuracy',
        value: `${((accuracyMetric?.value || 0) * 100).toFixed(1)}%`,
        change: model.additionalInfo?.accuracyChange || ''
      },
      precision: {
        label: 'Precision',
        value: classData && classData.precision !== undefined ? 
          `${(classData.precision * 100).toFixed(1)}%` : 
          `${(precisionMetric?.value * 100 || 0).toFixed(1)}%`,
        change: model.additionalInfo?.precisionChange || ''
      },
      recall: {
        label: 'Recall',
        value: classData && classData.recall !== undefined ? 
          `${(classData.recall * 100).toFixed(1)}%` : 
          `${(recallMetric?.value * 100 || 0).toFixed(1)}%`,
        change: model.additionalInfo?.recallChange || ''
      },
      f1Score: {
        label: 'F1 Score',
        value: classData && (classData['f1-score'] !== undefined || classData.f1_score !== undefined) ? 
          `${((classData['f1-score'] || classData.f1_score) * 100).toFixed(1)}%` : 
          `${(f1ScoreMetric?.value * 100 || 0).toFixed(1)}%`,
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
    
    // Get ROC data from primary model if available (using normalized search)
    const primaryRocMetric = primaryModel ? findMetric(primaryModel.metrics, 'roc_curve') : null;
    const primaryRocData = primaryRocMetric?.value;
    const primaryAucMetric = primaryModel ? findMetric(primaryModel.metrics, 'auc') : null;
    const primaryAuc = primaryAucMetric?.value || 0.978;
    
    // Get ROC data from comparison model if available (using normalized search)
    const comparisonRocMetric = comparisonModel ? findMetric(comparisonModel.metrics, 'roc_curve') : null;
    const comparisonRocData = comparisonRocMetric?.value;
    const comparisonAucMetric = comparisonModel ? findMetric(comparisonModel.metrics, 'auc') : null;
    const comparisonAuc = comparisonAucMetric?.value || 0.957;
    
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
    
    // Get confusion matrix data from model (using normalized search)
    const confusionMatrixMetric = findMetric(model.metrics, 'confusion_matrix');
    const matrixData = confusionMatrixMetric?.value;
    
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

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(null); // { message: string, version: string }
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    const precision = unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      // eslint-disable-next-line no-param-reassign
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

    if (!SUPPORTED_FILE_TYPES.includes(extension)) {
      setUploadError(`Unsupported file type. Accepted formats: ${SUPPORTED_FILE_TYPES.join(", ")}`);
      setUploadedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("File is too large. Please upload a file smaller than 25 MB.");
      setUploadedFile(null);
      return;
    }

    setUploadedFile({
      file,
      name: file.name,
      size: file.size,
      type: extension.replace(".", ""),
      mimeType: file.type || "unknown"
    });
    setUploadError("");
    setUploadSuccess(null); // Clear previous success message when new file is selected
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError("");
    resetFileInput();
  };

  const handleRetrain = async () => {
    if (!uploadedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess(null);

    try {
      // Upload dataset using API function from api.js
      const response = await uploadTrainingDataset(uploadedFile.file);
      
      if (response.data && response.data.success) {
        // Get version from backend response
        const version = response.data.data?.version || response.data.version || `v1.${Date.now().toString().slice(-6)}`;
        
        setUploadSuccess({
          message: "Dataset uploaded. We will let you know once training starts and completes.",
          version: version
        });

        // Clear the file input after successful upload
        setUploadedFile(null);
        resetFileInput();
        
        // Auto-clear success message after 8 seconds
        setTimeout(() => {
          setUploadSuccess(null);
        }, 8000);
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload dataset. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
      <DeveloperNav activePath="/model-performance" />

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
                {/* Left side: Model and Version stacked vertically */}
                <div className="primary-model-section">
                  <div className="control-section">
                    <div className="section-label">Model</div>
                    <div className="model-selector">
                      <select 
                        value={selectedModelName || ''} 
                        onChange={(e) => {
                          const modelName = e.target.value;
                          setSelectedModelName(modelName);
                          
                          // Auto-select oldest version (v1.0.0) of selected model
                          if (groupedModels[modelName]?.versions.length > 0) {
                            // Select last version (oldest - v1.0.0) since we sort oldest first
                            const lastVersionIndex = groupedModels[modelName].versions.length - 1;
                            const oldestVersionId = groupedModels[modelName].versions[lastVersionIndex]._id;
                            setSelectedVersionId(oldestVersionId);
                            setPrimaryModelId(oldestVersionId);
                          }
                        }}
                        className="model-select"
                      >
                        <option value="">Select a model</option>
                        {Object.keys(groupedModels).map(modelName => (
                          <option key={modelName} value={modelName}>
                            {modelName} ({groupedModels[modelName].modelType})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {selectedModelName && groupedModels[selectedModelName] && (
                    <div className="control-section version-section">
                      <div className="section-label">Version</div>
                      <div className="version-selector">
                        <select 
                          value={selectedVersionId || ''} 
                          onChange={(e) => {
                            const versionId = e.target.value;
                            setSelectedVersionId(versionId);
                            setPrimaryModelId(versionId);
                          }}
                          className="model-select"
                        >
                          {groupedModels[selectedModelName].versions.map(version => (
                            <option key={version._id} value={version._id}>
                              {version.version}
                              {version.accuracy && ` (${(version.accuracy * 100).toFixed(2)}%)`}
                              {` - ${new Date(version.createdAt).toLocaleDateString()}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
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
                    <>
                      <div className="comparison-model-selector">
                        <div className="section-label">Comparison Model</div>
                        <select 
                          value={comparisonModelName || ''} 
                          onChange={(e) => {
                            const compModelName = e.target.value;
                            setComparisonModelName(compModelName);
                            
                            // Auto-select oldest version (v1.0.0) of comparison model
                            if (compModelName && groupedModels[compModelName]?.versions.length > 0) {
                              // Select last version (oldest - v1.0.0) since we sort oldest first
                              const lastVersionIndex = groupedModels[compModelName].versions.length - 1;
                              const oldestVersionId = groupedModels[compModelName].versions[lastVersionIndex]._id;
                              setComparisonModelId(oldestVersionId);
                            } else {
                              setComparisonModelId(null);
                            }
                          }}
                          className="model-select comparison-select"
                        >
                          <option value="">Select a model</option>
                          {Object.keys(groupedModels).map(modelName => (
                            <option key={modelName} value={modelName}>
                              {modelName} ({groupedModels[modelName].modelType})
                            </option>
                          ))}
                        </select>
                      </div>
                      {comparisonModelName && groupedModels[comparisonModelName] && (
                        <div className="comparison-version-selector">
                          <div className="section-label">Comparison Version</div>
                          <select 
                            value={comparisonModelId || ''} 
                            onChange={(e) => setComparisonModelId(e.target.value)}
                            className="model-select"
                          >
                            {groupedModels[comparisonModelName].versions.map(version => (
                              <option key={version._id} value={version._id}>
                                {version.version}
                                {version.accuracy && ` (${(version.accuracy * 100).toFixed(2)}%)`}
                                {` - ${new Date(version.createdAt).toLocaleDateString()}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
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
          
          <div className="file-upload-section required">
            <div className="file-upload-header">
              <div className="file-upload-labels">
                <label htmlFor="dataset-upload-input">
                  Upload Training Dataset *
                </label>
                <span className="upload-hint">
                  Accepted formats: CSV, XLSX, JSON, TXT - Max size 25 MB
                </span>
              </div>
              <span className="upload-requirement">Required - Upload your dataset file for model training.</span>
            </div>
            <div className="file-upload-control">
              <input
                id="dataset-upload-input"
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_FILE_TYPES.join(",")}
                onChange={handleFileChange}
                className="file-input-hidden"
                disabled={isUploading}
              />
              <button
                type="button"
                className="file-upload-trigger"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {uploadedFile ? "Replace file" : "Select file"}
              </button>
              {uploadedFile && (
                <button
                  type="button"
                  className="file-remove-button"
                  onClick={handleRemoveFile}
                  aria-label="Remove selected training data file"
                  disabled={isUploading}
                >
                  Remove
                </button>
              )}
            </div>
            {uploadedFile && (
              <div className="file-info" role="status">
                <div className="file-info__details">
                  <span className="file-name">{uploadedFile.name}</span>
                  <span className="file-meta">
                    {uploadedFile.type.toUpperCase()} - {formatFileSize(uploadedFile.size)}
                  </span>
                </div>
              </div>
            )}
            {uploadError && (
              <p className="input-error" role="alert">
                {uploadError}
              </p>
            )}
            {uploadSuccess && (
              <div className="upload-success" role="status">
                <p className="success-message">
                  ✅ {uploadSuccess.message}
                </p>
                <p className="success-version">
                  Version: <strong>{uploadSuccess.version}</strong>
                </p>
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="retrain-button" 
            onClick={handleRetrain}
            disabled={!uploadedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelPerformance;

