import React, { useEffect, useState } from 'react';
import { getMLModelMetrics } from '../api';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import Plot from 'react-plotly.js';
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
      <div className="matrix-plot" style={{ height: '400px', position: 'relative' }}>
        <ResponsiveHeatMap
          data={data}
          margin={{ top: 80, right: 120, bottom: 80, left: 120 }}
          valueFormat=">-.2s"
          axisTop={{
            tickSize: 5,
            tickPadding: 15,
            tickRotation: -45,
            legend: 'Predicted Class',
            legendPosition: 'middle',
            legendOffset: -60,
            tickColor: '#ffffff',
            textColor: '#ffffff'
          }}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 15,
            tickRotation: -45,
            legend: 'Predicted Class',
            legendPosition: 'middle',
            legendOffset: 60,
            tickColor: '#ffffff',
            textColor: '#ffffff'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 15,
            tickRotation: 0,
            legend: 'Actual Class',
            legendPosition: 'middle',
            legendOffset: -60,
            tickColor: '#ffffff',
            textColor: '#ffffff'
          }}
          theme={{
            axis: {
              ticks: {
                text: {
                  fill: '#ffffff',
                  fontSize: 12
                }
              },
              legend: {
                text: {
                  fill: '#ffffff',
                  fontSize: 14,
                  fontWeight: 'bold'
                }
              }
            },
            legends: {
              text: {
                fill: '#ffffff',
                fontSize: 12
              }
            }
          }}
          colors={{
            type: 'sequential',
            scheme: 'blues'
          }}
          emptyColor="#555555"
          borderColor="#ffffff"
          borderWidth={1}
          labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
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
              titleAlign: 'start',
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

const PlotVisualization = ({ plot, actualVsPredicted }) => {
  const { data, layout, type } = plot;
  
  // Create data array for both ROC curve and actual vs predicted line
  const plotData = [
    {
      x: data.x,
      y: data.y,
      name: data.name,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#4a90e2',
        width: 2
      }
    }
  ];

  // Add actual vs predicted line if it exists
  if (actualVsPredicted && type === "Logistic Regression_ROC_Curve") {
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

  // Create a deep copy of layout and modify it for dark theme
  const darkLayout = {
    ...layout,
    paper_bgcolor: '#2d2d2d',
    plot_bgcolor: '#383838',
    margin: {
      l: 80,  // left margin
      r: 50,  // right margin
      t: 100, // top margin
      b: 80   // bottom margin
    },
    font: {
      color: '#ffffff',
      size: 12
    },
    title: {
      ...layout.title,
      font: {
        color: '#ffffff',
        size: 16
      },
      y: 1.15  // Move title even higher
    },
    xaxis: {
      ...layout.xaxis,
      title: {
        ...layout?.xaxis?.title,
        font: {
          color: '#ffffff',
          size: 14
        },
        standoff: 20  // Add space between axis and its label
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
        standoff: 20  // Add space between axis and its label
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
    }
  };

  return (
    <div className="plot-container">
      <Plot
        data={plotData}
        layout={darkLayout}
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
            {filteredPlots.filter(plot => !plot.type.includes('Actual_vs_Predicted')).map((plot, index) => (
              <PlotVisualization 
                key={index} 
                plot={plot} 
                actualVsPredicted={plot.type === "Logistic Regression_ROC_Curve"}
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
        <div className="classification-report">
          <h3>Detailed Metrics</h3>
          <div className="report-grid">
            {Object.entries(classificationReport).map(([className, metrics]) => {
              if (className !== 'accuracy' && className !== 'macro avg' && className !== 'weighted avg') {
                return (
                  <div key={className} className="report-card">
                    <h4>Class {className}</h4>
                    <div className="report-metrics">
                      <p>Precision: {metrics.precision?.toFixed(4)}</p>
                      <p>Recall: {metrics.recall?.toFixed(4)}</p>
                      <p>F1-Score: {metrics['f1-score']?.toFixed(4)}</p>
                      <p>Support: {metrics.support}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
