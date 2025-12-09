import React, { useEffect, useState } from 'react';
import { getMLModelMetrics, getModelById } from '../api';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import Plot from 'react-plotly.js';
import '../styles/Dashboard.css';

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
    if (!searchName) return null;
    
    const normalizedSearch = normalizeName(searchName);
    
    // Try exact normalized match first
    let found = metrics.find(m => {
      if (!m || !m.name) return false;
      const normalizedMetricName = normalizeName(m.name);
      return normalizedMetricName === normalizedSearch;
    });
    
    // If not found, try flexible matching (for "Classification Report" vs "classification_report")
    if (!found) {
      found = metrics.find(m => {
        if (!m || !m.name) return false;
        const normalizedMetricName = normalizeName(m.name);
        
        // For classification report, check if both contain 'classification' and 'report'
        if (normalizedSearch.includes('classification') && normalizedSearch.includes('report')) {
          return normalizedMetricName.includes('classification') && normalizedMetricName.includes('report');
        }
        
        // For confusion matrix, check if both contain 'confusion' and 'matrix'
        if (normalizedSearch.includes('confusion') && normalizedSearch.includes('matrix')) {
          return normalizedMetricName.includes('confusion') && normalizedMetricName.includes('matrix');
        }
        
        // For other metrics, try contains match
        return normalizedMetricName.includes(normalizedSearch) || normalizedSearch.includes(normalizedMetricName);
      });
    }
    
    return found || null;
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

const MetricCard = ({ title, value, icon }) => (
  <div className="metric-card">
    <div className="metric-icon">{icon}</div>
    <div className="metric-content">
      <h3>{title}</h3>
      <p>{typeof value === 'number' ? value.toFixed(4) : value}</p>
    </div>
  </div>
);

const ConfusionMatrix = ({ matrix }) => {
  // Add null check for matrix
  if (!matrix || !Array.isArray(matrix) || matrix.length < 2) {
    return <div className="error-message">Confusion matrix data is missing or invalid</div>;
  }
  
  const data = [
    {
      id: 'Actual: Not Fraud',
      data: [
        { x: 'Predicted: Not Fraud', y: matrix[0][0] },
        { x: 'Predicted: Fraud', y: matrix[0][1] }
      ]
    },
    {
      id: 'Actual: Fraud',
      data: [
        { x: 'Predicted: Not Fraud', y: matrix[1][0] },
        { x: 'Predicted: Fraud', y: matrix[1][1] }
      ]
    }
  ];

  const CustomTooltip = ({ cell }) => {
    const actual = cell.serieId.replace('Actual: ', '');
    const predicted = cell.data.x.replace('Predicted: ', '');
    return (
      <div style={{
        background: 'white',
        padding: '8px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        color: '#1e293b',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div><strong>Actual:</strong> {actual}</div>
        <div><strong>Predicted:</strong> {predicted}</div>
        <div><strong>Count:</strong> {cell.data.y}</div>
      </div>
    );
  };

  return (
    <div className="confusion-matrix">
      <h3>Confusion Matrix</h3>
      <div className="matrix-plot" style={{ height: '500px', position: 'relative' }}>
        <ResponsiveHeatMap
          data={data}
          margin={{ top: 80, right: 120, bottom: 80, left: 140 }}
          valueFormat=">-.2s"
          axisTop={{
            tickSize: 5,
            tickPadding: 10,
            tickRotation: 0, // Horizontal alignment
            legend: 'Predicted Class',
            legendPosition: 'middle',
            legendOffset: -60,
            textColor: 'black'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 10,
            tickRotation: 0, // Horizontal alignment
            legend: 'Actual Class',
            legendPosition: 'middle',
            legendOffset: -80,
            textColor: 'black'
          }}
          theme={{
            axis: {
              ticks: {
                text: {
                  fill: 'black',
                  fontSize: 12
                }
              },
              legend: {
                text: {
                  fill: 'black',
                  fontSize: 15,
                  fontWeight: 'bold'
                }
              }
            },
            legends: {
              text: {
                fill: 'black',
                fontSize: 15
              }
            }
          }}
          colors={{
            type: 'sequential',
            scheme: 'blues'
          }}
          emptyColor="#ffffff"
          borderColor="black"
          borderWidth={1}
          cellOpacity={1}
          labelTextColor={(d) => (d.color === '#000000' ? '#ffffff' : '#000000')} // Dynamic label color
          label={(d) => `${d.value}`} // Format to show values directly
          labelTextSize={20} // Increased text size
          legends={[
            {
              anchor: 'bottom',
              translateX: 0,
              translateY: 30,
              length: 400,
              thickness: 8,
              direction: 'row',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              title: 'Number of Predictions',
              titleAlign: 'middle',
              titleOffset: 4
            }
          ]}
          tooltip={CustomTooltip}
          enableLabels={true}
          animate={false}
        />
      </div>
    </div>
  );
};

const PlotVisualization = ({ plot }) => {
  // Add null check for plot object
  if (!plot) {
    return <div className="error-message">Plot data is missing or invalid</div>;
  }
  const { data: rawData, layout: rawLayout, type } = plot;
  
  // Function to get formatted title based on plot type (using normalized matching)
  const getPlotTitle = (plotType) => {
    if (plotTypeMatches(plotType, 'Feature Importance')) {
      return 'Feature Importance Analysis';
    } else if (plotTypeMatches(plotType, 'ROC Curve')) {
      return 'ROC Curve Analysis';
    } else if (plotTypeMatches(plotType, 'Learning Curve')) {
      return 'Learning Curve Analysis';
    } else if (plotTypeMatches(plotType, 'Confusion Matrix')) {
      return 'Confusion Matrix';
    } else if (plotTypeMatches(plotType, 'Precision Recall Curve')) {
      return 'Precision-Recall Curve';
    } else {
      // Convert type to title case and remove underscores
      return plotType.split(/[\s_-]+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
  };
  
  // Parse data if it's a JSON string (v1.1.0 format) or use object directly (v1.0.0 format)
  let parsedData = null;
  let parsedLayout = rawLayout || {};
  
  try {
    if (typeof rawData === 'string') {
      // Check if it's base64 image data (for Confusion Matrix Heatmap)
      if (rawData.startsWith('iVBORw0KGgo') || rawData.startsWith('data:image')) {
        // It's a base64 encoded image - render as image
        return (
          <div className="plot-container">
            <img 
              src={rawData.startsWith('data:image') ? rawData : `data:image/png;base64,${rawData}`}
              alt={getPlotTitle(type)}
              style={{ width: '100%', height: 'auto', maxHeight: '600px' }}
            />
          </div>
        );
      }
      
      // v1.1.0: Data is a JSON string, need to parse it
      const parsed = JSON.parse(rawData);
      // Plotly.js format: { data: [...], layout: {...} }
      if (parsed.data && Array.isArray(parsed.data)) {
        parsedData = parsed.data;
        if (parsed.layout) {
          parsedLayout = { ...parsedLayout, ...parsed.layout };
        }
      } else {
        // Fallback: try to use parsed directly
        parsedData = parsed;
      }
    } else if (rawData && typeof rawData === 'object') {
      // v1.0.0: Data is already an object with x, y arrays
      parsedData = rawData;
    }
  } catch (e) {
    console.error('Error parsing plot data:', e);
    // If JSON parsing fails, it might be base64 image
    if (typeof rawData === 'string' && (rawData.startsWith('iVBORw0KGgo') || rawData.length > 1000)) {
      return (
        <div className="plot-container">
          <img 
            src={`data:image/png;base64,${rawData}`}
            alt={getPlotTitle(type)}
            style={{ width: '100%', height: 'auto', maxHeight: '600px' }}
          />
        </div>
      );
    }
    return <div className="error-message">Error parsing plot data</div>;
  }
  
  // If we have Plotly.js format data array, use it directly
  if (Array.isArray(parsedData)) {
    return (
      <div className="plot-container">
        <Plot
          data={parsedData}
          layout={{
            ...parsedLayout,
            paper_bgcolor: 'white',
            plot_bgcolor: '#f8fafc',
            font: { color: '#1e293b', size: 12 }
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
          }}
          style={{ width: '100%', height: '400px' }}
        />
      </div>
    );
  }
  
  // If no parsedData or it doesn't have x/y, return error
  if (!parsedData || (!parsedData.x && !parsedData.data)) {
    return <div className="error-message">Plot data format not recognized</div>;
  }

  // Create data array based on plot type (using normalized matching)
  let plotData;
  
  if (plotTypeMatches(type, 'Feature Importance')) {
    // For Feature Importance, use bar chart
    plotData = [{
      x: parsedData.x,
      y: parsedData.y,
      name: parsedData.name || 'Feature Importance',
      type: 'bar',
      marker: {
        color: '#4a90e2',
        opacity: 0.8
      },
      orientation: 'h'  // Horizontal bars
    }];
  } else {
    // For other plots, use line chart
    plotData = [{
      x: parsedData.x,
      y: parsedData.y,
      name: parsedData.name || 'Model Performance',
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#4a90e2',
        width: 2
      }
    }];

    // Add random classifier line for all ROC curves (using normalized matching)
    if (plotTypeMatches(type, 'ROC Curve')) {
      plotData.push({
        x: [0, 1],  // Diagonal line from (0,0) to (1,1)
        y: [0, 1],
        name: 'Random Classifier',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: '#ff6b6b',
          width: 2,
          dash: 'dash'
        }
      });
    }
  }

  // Create a deep copy of layout and modify it for white theme
  // Check if parsedLayout is defined before accessing its properties
  const darkLayout = {
    ...(parsedLayout || {}),
    paper_bgcolor: 'white',
    plot_bgcolor: '#f8fafc',
    margin: {
      l: plotTypeMatches(type, 'Feature Importance') ? 200 : 80,
      r: 50,
      t: 70,  // Increased top margin for title
      b: 50
    },
    font: {
      color: '#1e293b',
      size: 12
    },
    title: {
      text: getPlotTitle(type),
      font: {
        color: '#1e293b',
        size: 18,
        weight: 'bold'
      },
      y: 1.05,
      x: 0.5,
      xanchor: 'center',
      yanchor: 'top'
    },
    xaxis: {
      ...(parsedLayout && parsedLayout.xaxis ? parsedLayout.xaxis : {}),
      title: {
        ...(parsedLayout && parsedLayout.xaxis && parsedLayout.xaxis.title ? parsedLayout.xaxis.title : {}),
        font: {
          color: '#1e293b',
          size: 14
        },
        standoff: 20
      },
      gridcolor: '#e2e8f0',
      zerolinecolor: '#cbd5e1',
      tickfont: {
        color: '#1e293b',
        size: 12
      }
    },
    yaxis: {
      ...(parsedLayout && parsedLayout.yaxis ? parsedLayout.yaxis : {}),
      title: {
        ...(parsedLayout && parsedLayout.yaxis && parsedLayout.yaxis.title ? parsedLayout.yaxis.title : {}),
        font: {
          color: '#1e293b',
          size: 14
        },
        standoff: 20
      },
      gridcolor: '#e2e8f0',
      zerolinecolor: '#cbd5e1',
      tickfont: {
        color: '#1e293b',
        size: 12
      }
    },
    showlegend: true,
    legend: {
      x: 0.5,
      y: -0.2,
      xanchor: 'center',
      orientation: 'h',
      font: {
        color: '#1e293b',
        size: 12
      }
    },
    // Additional layout for Feature Importance (using normalized matching)
    bargap: plotTypeMatches(type, 'Feature Importance') ? 0.2 : undefined,
    height: plotTypeMatches(type, 'Feature Importance') ? 600 : 400  // Increased height for feature importance
  };

  const isFeatureImportance = plotTypeMatches(type, 'Feature Importance');

  return (
    <div className={`plot-container ${isFeatureImportance ? 'feature-importance-plot' : ''}`}>
      <Plot
        data={plotData}
        layout={darkLayout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d']
        }}
        style={{ 
          width: '100%', 
          height: isFeatureImportance ? '600px' : '400px'  // Adjusted height for feature importance
        }}
      />
    </div>
  );
};

const Dashboard = () => {
  const [modelMetrics, setModelMetrics] = useState(null);
  const [allModels, setAllModels] = useState([]);
  const [groupedModels, setGroupedModels] = useState({});
  const [selectedModelName, setSelectedModelName] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

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
          }
        } else {
          setError('No model data available');
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err.message || 'Failed to fetch model metrics');
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllModels();
  }, [retryCount]);

  // Fetch model data when version is selected
  useEffect(() => {
    const fetchModelData = async () => {
      if (!selectedVersionId) return;
      
      try {
        setLoading(true);
        const response = await getModelById(selectedVersionId);
        
        if (response.data.success) {
          setModelMetrics(response.data.data);
        } else {
          setError('Failed to fetch model data');
        }
      } catch (err) {
        console.error('Error fetching model:', err);
        setError(err.message || 'Failed to fetch model');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModelData();
  }, [selectedVersionId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading metrics{'.'.repeat((retryCount % 3) + 1)}</p>
        {retryCount > 0 && <p className="retry-message">Retry attempt {retryCount}/3</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        {retryCount < 3 && (
          <button 
            className="retry-button"
            onClick={() => setRetryCount(prev => prev + 1)}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!modelMetrics) {
    return (
      <div className="no-data-container">
        <p>No metrics available</p>
        <button 
          className="retry-button"
          onClick={() => setRetryCount(0)}
        >
          Refresh Data
        </button>
      </div>
    );
  }

  const { modelName, modelType, metrics, plots, createdAt } = modelMetrics;
  
  // Use normalized search for all metrics (works across all versions)
  const accuracyMetric = findMetric(metrics, 'accuracy');
  
  // Try multiple name variations for confusion matrix (v1.0.0 uses "confusion_matrix", v1.1.0 uses "Confusion Matrix")
  let confusionMatrixMetric = findMetric(metrics, 'confusion_matrix');
  if (!confusionMatrixMetric) {
    confusionMatrixMetric = findMetric(metrics, 'Confusion Matrix');
  }
  if (!confusionMatrixMetric) {
    confusionMatrixMetric = findMetric(metrics, 'confusion matrix');
  }
  const confusionMatrix = confusionMatrixMetric?.value;
  
  // Try multiple name variations for classification report (v1.0.0 uses "classification_report", v1.1.0 uses "Classification Report")
  let classificationReportMetric = findMetric(metrics, 'classification_report');
  if (!classificationReportMetric) {
    classificationReportMetric = findMetric(metrics, 'Classification Report');
  }
  if (!classificationReportMetric) {
    classificationReportMetric = findMetric(metrics, 'classification report');
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
  const rocCurveMetric = findMetric(metrics, 'roc_curve');
  let rocCurve = rocCurveMetric?.value;
  const precisionRecallCurveMetric = findMetric(metrics, 'precision_recall_curve');
  let precisionRecallCurve = precisionRecallCurveMetric?.value;
  
  // Extract ROC curve from plots if not found in metrics (v1.1.0 stores in plots)
  if (!rocCurve && plots && Array.isArray(plots)) {
    const rocPlot = plots.find(plot => plotTypeMatches(plot.type, 'ROC Curve'));
    if (rocPlot && rocPlot.data) {
      try {
        let plotData = rocPlot.data;
        // If data is a JSON string, parse it
        if (typeof plotData === 'string') {
          const parsed = JSON.parse(plotData);
          // Plotly format: { data: [{ x: [...], y: [...] }] }
          if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            const firstData = parsed.data[0];
            rocCurve = {
              fpr: firstData.x || [],
              tpr: firstData.y || []
            };
          }
        } else if (plotData.x && plotData.y) {
          // v1.0.0 format: { x: [...], y: [...] }
          rocCurve = {
            fpr: plotData.x || [],
            tpr: plotData.y || []
          };
        }
      } catch (e) {
        console.error('Error extracting ROC curve from plots:', e);
      }
    }
  }
  
  // Extract Precision-Recall curve from plots if not found in metrics (v1.1.0 stores in plots)
  if (!precisionRecallCurve && plots && Array.isArray(plots)) {
    const prPlot = plots.find(plot => plotTypeMatches(plot.type, 'Precision Recall Curve'));
    if (prPlot && prPlot.data) {
      try {
        let plotData = prPlot.data;
        // If data is a JSON string, parse it
        if (typeof plotData === 'string') {
          const parsed = JSON.parse(plotData);
          // Plotly format: { data: [{ x: [...], y: [...] }] }
          if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            const firstData = parsed.data[0];
            // Check if x is recall and y is precision (or vice versa)
            if (firstData.x && firstData.y) {
              precisionRecallCurve = {
                recall: firstData.x || [],
                precision: firstData.y || []
              };
            }
          }
        } else if (plotData.x && plotData.y) {
          // v1.0.0 format: { x: [...], y: [...] }
          precisionRecallCurve = {
            recall: plotData.x || [],
            precision: plotData.y || []
          };
        }
      } catch (e) {
        console.error('Error extracting Precision-Recall curve from plots:', e);
      }
    }
  }
  
  // Debug: Log ALL metrics to see what we have
  console.log('=== ALL METRICS DEBUG ===');
  console.log('Metrics array:', metrics);
  console.log('Metrics names:', metrics?.map(m => m.name));
  console.log('Classification Report Metric:', classificationReportMetric);
  console.log('Classification Report Value:', classificationReport);
  
  // Debug: Log classification report to help identify issues
  if (classificationReport) {
    console.log('Classification Report found:', {
      reportKeys: Object.keys(classificationReport),
      hasClass0String: !!classificationReport['0'],
      hasClass0Number: !!classificationReport[0],
      hasClass1String: !!classificationReport['1'],
      hasClass1Number: !!classificationReport[1],
      class0Data: classificationReport['0'] || classificationReport[0] || null,
      class1Data: classificationReport['1'] || classificationReport[1] || null,
      classificationReportType: typeof classificationReport,
      isArray: Array.isArray(classificationReport),
      fullReport: classificationReport
    });
  } else {
    console.log('Classification Report NOT FOUND!');
    console.log('Available metrics:', metrics?.map(m => ({ name: m.name, type: typeof m.value })));
  }
  
  // Helper to get class data (handles both string '0' and number 0 keys)
  const getClassData = (report, classKey) => {
    if (!report || typeof report !== 'object') {
      console.log('getClassData: report is not an object', report);
      return null;
    }
    
    // Try string key first
    if (report[String(classKey)]) {
      console.log(`getClassData: Found Class ${classKey} with string key`);
      return report[String(classKey)];
    }
    // Try number key
    if (report[Number(classKey)] !== undefined) {
      console.log(`getClassData: Found Class ${classKey} with number key`);
      return report[Number(classKey)];
    }
    
    // Try iterating all keys
    for (const key in report) {
      if (String(key) === String(classKey) || Number(key) === Number(classKey)) {
        console.log(`getClassData: Found Class ${classKey} via iteration with key:`, key);
        return report[key];
      }
    }
    
    console.log(`getClassData: Class ${classKey} NOT FOUND`);
    return null;
  };
  
  // Get Class 0 data (try both string and number keys)
  // IMPORTANT: classificationReport should be an object with '0' and '1' keys
  let class0Data = null;
  let class1Data = null;
  
  if (classificationReport && typeof classificationReport === 'object' && !Array.isArray(classificationReport)) {
    // Try ALL possible ways to access Class 0
    class0Data = classificationReport['0'] || 
                 classificationReport[0] || 
                 getClassData(classificationReport, '0') ||
                 null;
    
    // Try ALL possible ways to access Class 1
    class1Data = classificationReport['1'] || 
                 classificationReport[1] || 
                 getClassData(classificationReport, '1') ||
                 null;
    
    // Debug log
    console.log('=== Class Data Extraction Result ===');
    console.log('class0Data:', class0Data);
    console.log('class1Data:', class1Data);
    if (class0Data) {
      console.log('Class 0 - Precision:', class0Data.precision);
      console.log('Class 0 - Recall:', class0Data.recall);
      console.log('Class 0 - F1-Score:', class0Data['f1-score'] || class0Data.f1_score);
    }
  } else {
    console.log('Classification report is not a valid object:', typeof classificationReport, classificationReport);
  }

  // Filter plots using normalized matching
  const filteredPlots = plots ? plots.filter(plot => 
    !plotTypeMatches(plot.type, 'Confusion Matrix') // Works for "Confusion_Matrix" AND "Confusion Matrix Heatmap"
  ) : [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Hero Header - Matching Admin Dashboard */}
        <div className="dashboard-hero">
          <h1>ML Model Dashboard</h1>
          <p className="dashboard-hero-subtitle">
            Comprehensive ML model performance metrics and visualizations for fraud detection analysis
          </p>
        </div>

        {/* Main Content Card - Wraps all content like Admin Dashboard map card */}
        <div className="dashboard-main-card">
          {/* Model Selection Section */}
          <div className="dashboard-header">
            <div className="model-controls">
              <div className="model-selector">
                <div className="section-label">Model</div>
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
            
            {selectedModelName && groupedModels[selectedModelName] && (
              <div className="version-selector">
                <div className="section-label">Version</div>
                <select 
                  value={selectedVersionId || ''} 
                  onChange={(e) => setSelectedVersionId(e.target.value)}
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
            )}
          </div>
          
          {modelMetrics && (
            <div className="model-info">
              <p>Model: {modelName}</p>
              <p>Type: {modelType}</p>
              <p>Last Updated: {new Date(createdAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="metrics-grid">
          <MetricCard
            title="Accuracy"
            value={accuracyMetric?.value || 0}
            icon="📊"
          />
          {/* Always show Precision, Recall, F1-Score if classification report exists - exactly like v1.0.0 */}
          {class0Data ? (
            <>
              <MetricCard
                title="Precision (Class 0)"
                value={class0Data.precision || 0}
                icon="🎯"
              />
              <MetricCard
                title="Recall (Class 0)"
                value={class0Data.recall || 0}
                icon="📈"
              />
              <MetricCard
                title="F1-Score (Class 0)"
                value={class0Data['f1-score'] || class0Data.f1_score || class0Data['f1_score'] || 0}
                icon="⚖️"
              />
            </>
          ) : classificationReport ? (
            // If classification report exists but class0Data is null, try to extract directly
            (() => {
              // Try all possible ways to get Class 0 data
              const tryGetClass0 = () => {
                // Direct string access
                if (classificationReport['0'] && classificationReport['0'].precision) {
                  return classificationReport['0'];
                }
                // Direct number access
                if (classificationReport[0] && classificationReport[0].precision) {
                  return classificationReport[0];
                }
                // Try iterating keys
                for (const key in classificationReport) {
                  if ((key === '0' || key === 0 || String(key) === '0') && 
                      classificationReport[key] && 
                      typeof classificationReport[key] === 'object' &&
                      classificationReport[key].precision !== undefined) {
                    return classificationReport[key];
                  }
                }
                return null;
              };
              
              const extractedClass0 = tryGetClass0();
              
              if (extractedClass0) {
                return (
                  <>
                    <MetricCard
                      title="Precision (Class 0)"
                      value={extractedClass0.precision || 0}
                      icon="🎯"
                    />
                    <MetricCard
                      title="Recall (Class 0)"
                      value={extractedClass0.recall || 0}
                      icon="📈"
                    />
                    <MetricCard
                      title="F1-Score (Class 0)"
                      value={extractedClass0['f1-score'] || extractedClass0.f1_score || extractedClass0['f1_score'] || 0}
                      icon="⚖️"
                    />
                  </>
                );
              }
              
              // Fallback to Class 1 if Class 0 not found
              const tryGetClass1 = () => {
                if (classificationReport['1'] && classificationReport['1'].precision) {
                  return classificationReport['1'];
                }
                if (classificationReport[1] && classificationReport[1].precision) {
                  return classificationReport[1];
                }
                return null;
              };
              
              const extractedClass1 = tryGetClass1();
              
              if (extractedClass1) {
                return (
                  <>
                    <MetricCard
                      title="Precision (Class 1)"
                      value={extractedClass1.precision || 0}
                      icon="🎯"
                    />
                    <MetricCard
                      title="Recall (Class 1)"
                      value={extractedClass1.recall || 0}
                      icon="📈"
                    />
                    <MetricCard
                      title="F1-Score (Class 1)"
                      value={extractedClass1['f1-score'] || extractedClass1.f1_score || extractedClass1['f1_score'] || 0}
                      icon="⚖️"
                    />
                  </>
                );
              }
              
              return null;
            })()
          ) : null}
        </div>

        {confusionMatrix && (
          <div className="matrix-container">
            <ConfusionMatrix matrix={confusionMatrix} />
          </div>
        )}

        {filteredPlots.length > 0 && (
          <div className="plots-section">
            <h2>Model Performance Plots</h2>
            <div className="plots-grid">
              {filteredPlots.map((plot, index) => (
                <PlotVisualization 
                  key={index} 
                  plot={plot} 
                />
              ))}
            </div>
          </div>
        )}

        {rocCurve && (
          <div className="roc-curve-container">
            <h3>ROC Curve</h3>
            <Plot
              data={[
                {
                  x: rocCurve.fpr,
                  y: rocCurve.tpr,
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: '#4a90e2'
                  }
                }
              ]}
              layout={{
                paper_bgcolor: 'white',
                plot_bgcolor: '#f8fafc',
                font: {
                  color: '#1e293b'
                },
                title: {
                  text: 'ROC Curve',
                  font: {
                    color: '#1e293b',
                    size: 16
                  }
                },
                xaxis: {
                  title: {
                    text: 'False Positive Rate'
                  },
                  gridcolor: '#e2e8f0',
                  zerolinecolor: '#cbd5e1',
                  tickfont: {
                    color: '#1e293b'
                  }
                },
                yaxis: {
                  title: {
                    text: 'True Positive Rate'
                  },
                  gridcolor: '#e2e8f0',
                  zerolinecolor: '#cbd5e1',
                  tickfont: {
                    color: '#1e293b'
                  }
                }
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d']
              }}
              style={{ width: '100%', height: '400px' }}
            />
          </div>
        )}

        {precisionRecallCurve && (
          <div className="precision-recall-curve-container">
            <h3>Precision-Recall Curve</h3>
            <Plot
              data={[
                {
                  x: precisionRecallCurve.recall,
                  y: precisionRecallCurve.precision,
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: '#4a90e2'
                  }
                }
              ]}
              layout={{
                paper_bgcolor: 'white',
                plot_bgcolor: '#f8fafc',
                font: {
                  color: '#1e293b'
                },
                title: {
                  text: 'Precision-Recall Curve',
                  font: {
                    color: '#1e293b',
                    size: 16
                  }
                },
                xaxis: {
                  title: {
                    text: 'Recall'
                  },
                  gridcolor: '#e2e8f0',
                  zerolinecolor: '#cbd5e1',
                  tickfont: {
                    color: '#1e293b'
                  }
                },
                yaxis: {
                  title: {
                    text: 'Precision'
                  },
                  gridcolor: '#e2e8f0',
                  zerolinecolor: '#cbd5e1',
                  tickfont: {
                    color: '#1e293b'
                  }
                }
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d']
              }}
              style={{ width: '100%', height: '400px' }}
            />
          </div>
        )}

        {classificationReport && (
          <div className="Dashboard-report-section">
            <h3>Detailed Metrics</h3>
            <div className="metrics-table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>CLASS</th>
                    <th>PRECISION</th>
                    <th>RECALL</th>
                    <th>F1-SCORE</th>
                    <th>SUPPORT</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(classificationReport).map(([className, metrics]) => {
                    if (className !== 'accuracy' && typeof className !== 'number') {
                      const displayName =
                        className === 'macro avg' || className === 'macro_avg' ? 'Macro Average' :
                        className === 'weighted avg' || className === 'weighted_avg' ? 'Weighted Average' :
                        `Class ${className}`;
                      // Handle both 'f1-score' and 'f1_score' keys
                      const f1Score = metrics['f1-score'] || metrics.f1_score || metrics['f1_score'] || 0;
                      return (
                        <tr key={className}>
                          <td>{displayName}</td>
                          <td>{metrics.precision?.toFixed(4) || 'N/A'}</td>
                          <td>{metrics.recall?.toFixed(4) || 'N/A'}</td>
                          <td>{f1Score ? f1Score.toFixed(4) : 'N/A'}</td>
                          <td>{metrics.support || 'N/A'}</td>
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
        {/* End of dashboard-main-card */}
      </div>
    </div>
  );
};

export default Dashboard;