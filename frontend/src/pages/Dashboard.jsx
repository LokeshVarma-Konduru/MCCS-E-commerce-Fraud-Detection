import React, { useEffect, useState } from 'react';
import { getMLModelMetrics } from '../api';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import Plot from 'react-plotly.js';
import Footer from '../components/Footer';
import '../styles/Dashboard.css';

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
        background: '#2d2d2d',
        padding: '8px 12px',
        border: '1px solid #ffffff33',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
  const { data, layout, type } = plot;
  
  // Function to get formatted title based on plot type
  const getPlotTitle = (plotType) => {
    if (plotType.includes('Feature_Importance')) {
      return 'Feature Importance Analysis';
    } else if (plotType.includes('ROC_Curve')) {
      return 'ROC Curve Analysis';
    } else if (plotType.includes('Learning_Curve')) {
      return 'Learning Curve Analysis';
    } else if (plotType.includes('Confusion_Matrix')) {
      return 'Confusion Matrix';
    } else if (plotType.includes('Precision_Recall_Curve')) {
      return 'Precision-Recall Curve';
    } else {
      // Convert type to title case and remove underscores
      return plotType.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
  };

  // Create data array based on plot type
  let plotData;
  
  if (type.includes('Feature_Importance')) {
    // For Feature Importance, use bar chart
    plotData = [{
      x: data.x,
      y: data.y,
      name: data.name,
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
      x: data.x,
      y: data.y,
      name: data.name,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#4a90e2',
        width: 2
      }
    }];

    // Add random classifier line for all ROC curves
    if (type.includes('ROC_Curve')) {
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

  // Create a deep copy of layout and modify it for dark theme
  const darkLayout = {
    ...layout,
    paper_bgcolor: '#2d2d2d',
    plot_bgcolor: '#383838',
    margin: {
      l: type.includes('Feature_Importance') ? 200 : 80,
      r: 50,
      t: 70,  // Increased top margin for title
      b: 50
    },
    font: {
      color: '#ffffff',
      size: 12
    },
    title: {
      text: getPlotTitle(type),
      font: {
        color: '#ffffff',
        size: 18,
        weight: 'bold'
      },
      y: 1.05,
      x: 0.5,
      xanchor: 'center',
      yanchor: 'top'
    },
    xaxis: {
      ...layout.xaxis,
      title: {
        ...layout?.xaxis?.title,
        font: {
          color: '#ffffff',
          size: 14
        },
        standoff: 20
      },
      gridcolor: '#4f4f4f',
      zerolinecolor: '#4f4f4f',
      tickfont: {
        color: '#ffffff',
        size: 12
      }
    },
    yaxis: {
      ...layout.yaxis,
      title: {
        ...layout?.yaxis?.title,
        font: {
          color: '#ffffff',
          size: 14
        },
        standoff: 20
      },
      gridcolor: '#4f4f4f',
      zerolinecolor: '#4f4f4f',
      tickfont: {
        color: '#ffffff',
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
        color: '#ffffff',
        size: 12
      }
    },
    // Additional layout for Feature Importance
    bargap: type.includes('Feature_Importance') ? 0.2 : undefined,
    height: type.includes('Feature_Importance') ? 600 : 400  // Increased height for feature importance
  };

  return (
    <div className={`plot-container ${type.includes('Feature_Importance') ? 'feature-importance-plot' : ''}`}>
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
          height: type.includes('Feature_Importance') ? '600px' : '400px'  // Adjusted height for feature importance
        }}
      />
    </div>
  );
};

const Dashboard = () => {
  const [modelMetrics, setModelMetrics] = useState(null);
  const [allModels, setAllModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
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
          setAllModels(response.data.data);
          setSelectedModelId(response.data.data[0]._id);
          setModelMetrics(response.data.data[0]);
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

  const handleModelChange = (modelId) => {
    const selectedModel = allModels.find(model => model._id === modelId);
    setSelectedModelId(modelId);
    setModelMetrics(selectedModel);
  };

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
  const accuracyMetric = metrics?.find(m => m.name === 'accuracy');
  const confusionMatrix = metrics?.find(m => m.name === 'confusion_matrix')?.value;
  const classificationReport = metrics?.find(m => m.name === 'classification_report')?.value;
  const rocCurve = metrics?.find(m => m.name === 'roc_curve')?.value;
  const precisionRecallCurve = metrics?.find(m => m.name === 'precision_recall_curve')?.value;

  const filteredPlots = plots.filter(plot => 
    !plot.type.includes('Confusion_Matrix') // Filter out confusion matrix
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>ML Model Dashboard</h1>
          <div className="model-selector">
            <select 
              value={selectedModelId} 
              onChange={(e) => handleModelChange(e.target.value)}
              className="model-select"
            >
              {allModels.map(model => (
                <option key={model._id} value={model._id}>
                  {model.modelName} ({model.modelType})
                </option>
              ))}
            </select>
          </div>
          <div className="model-info">
            <p>Model: {modelName}</p>
            <p>Type: {modelType}</p>
            <p>Last Updated: {new Date(createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="metrics-grid">
          <MetricCard
            title="Accuracy"
            value={accuracyMetric?.value || 0}
            icon="📊"
          />
          {classificationReport && (
            <>
              <MetricCard
                title="Precision (Class 0)"
                value={classificationReport['0']?.precision}
                icon="🎯"
              />
              <MetricCard
                title="Recall (Class 0)"
                value={classificationReport['0']?.recall}
                icon="📈"
              />
              <MetricCard
                title="F1-Score (Class 0)"
                value={classificationReport['0']?.['f1-score']}
                icon="⚖️"
              />
            </>
          )}
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
                paper_bgcolor: '#2d2d2d',
                plot_bgcolor: '#383838',
                font: {
                  color: '#ffffff'
                },
                title: {
                  text: 'ROC Curve',
                  font: {
                    color: '#ffffff',
                    size: 16
                  }
                },
                xaxis: {
                  title: {
                    text: 'False Positive Rate'
                  },
                  gridcolor: '#4a4a4a',
                  zerolinecolor: '#4a4a4a',
                  tickfont: {
                    color: '#ffffff'
                  }
                },
                yaxis: {
                  title: {
                    text: 'True Positive Rate'
                  },
                  gridcolor: '#4a4a4a',
                  zerolinecolor: '#4a4a4a',
                  tickfont: {
                    color: '#ffffff'
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
                paper_bgcolor: '#2d2d2d',
                plot_bgcolor: '#383838',
                font: {
                  color: '#ffffff'
                },
                title: {
                  text: 'Precision-Recall Curve',
                  font: {
                    color: '#ffffff',
                    size: 16
                  }
                },
                xaxis: {
                  title: {
                    text: 'Recall'
                  },
                  gridcolor: '#4a4a4a',
                  zerolinecolor: '#4a4a4a',
                  tickfont: {
                    color: '#ffffff'
                  }
                },
                yaxis: {
                  title: {
                    text: 'Precision'
                  },
                  gridcolor: '#4a4a4a',
                  zerolinecolor: '#4a4a4a',
                  tickfont: {
                    color: '#ffffff'
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
          <div className="report-section">
            <h3>Detailed Metrics</h3>
            <div className="metrics-table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1-Score</th>
                    <th>Support</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(classificationReport).map(([className, metrics]) => {
                    if (className !== 'accuracy') {
                      const displayName =
                        className === 'macro avg' ? 'Macro Average' :
                        className === 'weighted avg' ? 'Weighted Average' :
                        `Class ${className}`;
                      return (
                        <tr key={className}>
                          <td>{displayName}</td>
                          <td>{metrics.precision?.toFixed(4)}</td>
                          <td>{metrics.recall?.toFixed(4)}</td>
                          <td>{metrics['f1-score']?.toFixed(4)}</td>
                          <td>{metrics.support}</td>
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
      <Footer />
    </div>
  );
};

export default Dashboard;