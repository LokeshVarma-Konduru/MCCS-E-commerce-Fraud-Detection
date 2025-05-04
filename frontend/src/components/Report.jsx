import React, { useRef } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { FaFilePdf, FaChartLine, FaExchangeAlt, FaChartPie, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/logo.png';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Report = ({ data }) => {
  const { period, timeline, metrics, insights, anomalies, transactionTypes, merchantCategories, financialImpact } = data;
  const reportRef = useRef(null);
  
  // Determine which sections to show based on the period
  const showHourlyData = period === '24h';
  const showFinancialImpact = period === '30d';
  const showAnomalies = period === '24h';
  
  // Adjust chart height based on period
  const timelineChartHeight = showHourlyData ? 300 : 400;
  
  // Format the report period for display
  let periodDisplay = '';
  switch (period) {
    case '24h':
      periodDisplay = 'Last 24 Hours';
      break;
    case '7d':
      periodDisplay = 'Last 7 Days';
      break;
    case '30d':
      periodDisplay = 'Last 30 Days';
      break;
    default:
      periodDisplay = period;
  }
  
  // Determine report structure based on period
  const isPeriodShort = period === '24h';
  const isPeriodMedium = period === '7d';
  const isPeriodLong = period === '30d';
  
  // Adjust chart labels based on period
  const getTimelineLabels = () => {
    if (isPeriodShort) {
      return ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', '11 PM'];
    } else if (isPeriodMedium) {
      return timeline.labels; // Use the default days of week
    } else {
      // For longer periods, use dates
      const today = new Date();
      const dates = [];
      for (let i = 29; i >= 0; i -= 4) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }
      return dates;
    }
  };
  
  // Adjust transaction data based on period
  const getTimelineData = () => {
    if (isPeriodShort) {
      // Hourly data for 24 hours - lower volume during night, peaks at lunch and after work
      return [12, 8, 5, 3, 7, 15, 28, 42, 56, 68, 75, 92, 85, 76, 64, 72, 88, 95, 82, 65, 48, 32, 25, 18];
    } else if (isPeriodMedium) {
      return timeline.transactions; // Use the default weekly data
    } else {
      // Monthly data with more points - shows seasonal patterns
      return [285, 312, 345, 378, 425, 472, 498, 465, 412, 368, 325, 298];
    }
  };

  const lineChartData = {
    labels: getTimelineLabels(),
    datasets: [
      {
        label: 'Transactions',
        data: getTimelineData(),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const generatePDF = async () => {
    const report = reportRef.current;
    
    // Show a loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.padding = '20px';
    loadingElement.style.background = 'rgba(255, 255, 255, 0.9)';
    loadingElement.style.borderRadius = '8px';
    loadingElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    loadingElement.style.zIndex = '9999';
    loadingElement.textContent = 'Generating PDF...';
    document.body.appendChild(loadingElement);
    
    try {
      // Capture the entire report as a single image
      const canvas = await html2canvas(report, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: report.scrollWidth,
        windowHeight: report.scrollHeight,
        onclone: (clonedDoc) => {
          // Make sure all elements are visible in the clone
          const clonedReport = clonedDoc.querySelector('.report-container');
          if (clonedReport) {
            clonedReport.style.height = 'auto';
            clonedReport.style.overflow = 'visible';
            
            // Fix header layout for PDF
            const header = clonedDoc.querySelector('.report-header');
            if (header) {
              header.style.display = 'flex';
              header.style.justifyContent = 'space-between';
              header.style.alignItems = 'center';
              header.style.width = '100%';
              header.style.marginBottom = '40px';
              header.style.paddingBottom = '24px';
              header.style.borderBottom = '1px solid #e5e7eb';
            }
            
            // Fix logo container
            const logoContainer = clonedDoc.querySelector('.logo-container');
            if (logoContainer) {
              logoContainer.style.width = '120px';
              logoContainer.style.display = 'flex';
              logoContainer.style.justifyContent = 'flex-start';
              logoContainer.style.alignItems = 'center';
            }
            
            // Fix title container
            const titleContainer = clonedDoc.querySelector('.report-title');
            if (titleContainer) {
              titleContainer.style.textAlign = 'center';
              titleContainer.style.flexGrow = '1';
              titleContainer.style.margin = '0';
              titleContainer.style.padding = '0 20px';
            }
            
            // Fix download button container (hide it in PDF)
            const actionsContainer = clonedDoc.querySelector('.report-actions');
            if (actionsContainer) {
              actionsContainer.style.display = 'none';
            }
            
            // Ensure charts grid is properly displayed side by side in PDF
            const chartsGrid = clonedDoc.querySelector('.report-charts-grid');
            if (chartsGrid) {
              chartsGrid.style.display = 'grid';
              chartsGrid.style.gridTemplateColumns = '1fr 1fr';
              chartsGrid.style.gap = '32px';
              chartsGrid.style.margin = '40px 0';
              chartsGrid.style.width = '100%';
            }
            
            // Style each chart column for PDF
            const chartColumns = clonedDoc.querySelectorAll('.report-chart-column');
            chartColumns.forEach(column => {
              column.style.background = 'white';
              column.style.borderRadius = '12px';
              column.style.padding = '24px';
              column.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              column.style.border = '1px solid #e5e7eb';
              column.style.display = 'flex';
              column.style.flexDirection = 'column';
            });
            
            // Style chart containers for PDF
            const chartContainers = clonedDoc.querySelectorAll('.report-chart-column .chart-container');
            chartContainers.forEach(container => {
              container.style.height = '350px';
              container.style.flexGrow = '1';
              container.style.minHeight = '300px';
            });
            
            // Make sure all sections are visible
            const sections = clonedReport.querySelectorAll('.report-charts-grid, .report-charts, .report-metrics, .insights-section, .financial-metrics, .monthly-trends, .key-insights');
            sections.forEach(section => {
              if (section) {
                section.style.display = section.classList.contains('report-charts-grid') ? 'grid' : 'block';
                section.style.visibility = 'visible';
              }
            });
          }
        }
      });
      
      // Create a PDF with dimensions matching the canvas aspect ratio
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });
      
      // Add the image to fill the entire PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`MCCS-Fraud-Detection-Report-${periodDisplay}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      // Remove the loading indicator
      document.body.removeChild(loadingElement);
    }
  };

  const barChartData = {
    labels: ['Legitimate', 'Fraudulent', 'Suspicious'],
    datasets: [
      {
        label: 'Transaction Distribution',
        data: [metrics.legitimate, metrics.fraudulent, metrics.suspicious],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)'
        ]
      }
    ]
  };

  const pieChartData = {
    labels: Object.keys(merchantCategories),
    datasets: [
      {
        data: Object.values(merchantCategories),
        backgroundColor: [
          '#60a5fa',
          '#f87171',
          '#4ade80',
          '#fbbf24',
          '#a78bfa',
          '#34d399'
        ]
      }
    ]
  };

  return (
    <div className="report-container" ref={reportRef}>
      <div className="report-header">
        <div className="logo-container">
          <img src={logo} alt="MCCS Logo" className="report-logo" />
        </div>
        <div className="report-title">
          <h1>Fraud Detection Report</h1>
          <p className="report-period">{periodDisplay}</p>
        </div>
        <div className="report-actions">
          <button className="download-button" onClick={generatePDF}>
            <FaFilePdf className="button-icon" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <h3>Total Transactions</h3>
          <div className="summary-value">{metrics.total.toLocaleString()}</div>
          {!isPeriodShort && (
            <div className="summary-change positive">+{isPeriodMedium ? '5.2' : '12.4'}% from previous period</div>
          )}
        </div>
        <div className="summary-card">
          <h3>Fraud Detected</h3>
          <div className="summary-value">{metrics.fraudulent.toLocaleString()}</div>
          {!isPeriodShort && (
            <div className="summary-change negative">-{isPeriodMedium ? '2.8' : '8.7'}% from previous period</div>
          )}
        </div>
        <div className="summary-card">
          <h3>Detection Rate</h3>
          <div className="summary-value">{metrics.detectionRate}%</div>
          {!isPeriodShort && (
            <div className="summary-change positive">+{isPeriodMedium ? '0.5' : '1.2'}% from previous period</div>
          )}
        </div>
      </div>

      <div className="report-section">
        <div className="section-header" style={{ color: '#111827' }}>
          <h2>Executive Summary</h2>
          <p className="section-description">Key performance indicators and business impact</p>
        </div>
        <div className="executive-summary">
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>Fraud Prevention</h3>
              <div className="kpi-value">${(metrics.fraudulent * metrics.avgTransactionValue).toLocaleString()}</div>
              <div className="kpi-label">Potential Loss Prevented</div>
            </div>
            <div className="kpi-card">
              <h3>Detection Rate</h3>
              <div className="kpi-value">{((metrics.fraudulent / (metrics.fraudulent + metrics.legitimate)) * 100).toFixed(1)}%</div>
              <div className="kpi-label">Fraud Detection Rate</div>
            </div>
            <div className="kpi-card">
              <h3>Efficiency</h3>
              <div className="kpi-value">{((metrics.legitimate / (metrics.fraudulent + metrics.legitimate + metrics.suspicious)) * 100).toFixed(1)}%</div>
              <div className="kpi-label">Transaction Approval Rate</div>
            </div>
            <div className="kpi-card">
              <h3>Risk Score</h3>
              <div className="kpi-value">{insights.riskScore || "72"}/100</div>
              <div className="kpi-label">System Risk Assessment</div>
            </div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="section-header" style={{ color: '#111827' }}>
          <h2>Transaction Timeline</h2>
          <p className="section-description">
            {isPeriodShort 
              ? 'Hourly transaction volume over the last 24 hours' 
              : isPeriodMedium 
                ? 'Daily transaction volume over the last 7 days'
                : 'Transaction volume trend over the last 30 days'
            }
          </p>
        </div>
        <div className="chart-container elevated" style={{ background: 'white', height: timelineChartHeight }}>
          <Line 
            data={lineChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                      size: 12,
                      family: "'Inter', sans-serif"
                    },
                    color: '#374151'
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                  },
                  ticks: {
                    color: '#6b7280'
                  }
                },
                x: {
                  grid: {
                    display: false,
                    drawBorder: false
                  },
                  ticks: {
                    color: '#6b7280'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="report-charts-grid">
        <div className="report-chart-column">
          <div className="section-header">
            <h2>Transaction Types</h2>
            <p className="section-subheader">Distribution of transaction classifications</p>
          </div>
          <div className="chart-container">
            <Bar 
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="report-chart-column">
          <div className="section-header">
            <h2>Merchant Categories</h2>
            <p className="section-subheader">Transaction volume by merchant type</p>
          </div>
          <div className="chart-container">
            <Pie 
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 15,
                      padding: 15
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Only show detailed insights for longer periods */}
      {!isPeriodShort && (
        <div className="report-section insights-section">
          <div className="section-header">
            <h2>Key Insights & Recommendations</h2>
            <p className="section-subheader">Analysis and actionable insights from the data</p>
          </div>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon"><FaChartLine /></div>
              <h3>Trend Analysis</h3>
              <p>We're seeing a {timeline.transactions[6] > timeline.transactions[0] ? 'positive' : 'negative'} trend in transaction volume, with Saturdays being our busiest day. Our MCCS stores are typically packed on weekends, so we should ensure we have enough staff on hand during these peak times.</p>
            </div>
            <div className="insight-card">
              <div className="insight-icon"><FaExclamationTriangle /></div>
              <h3>Fraud Patterns</h3>
              <p>We've noticed higher fraud rates at our Exchange and Commissary locations. There's been a concerning uptick in suspicious activity targeting our PX/Exchange online store, particularly when units are deploying. This pattern suggests we need targeted monitoring during these periods.</p>
            </div>
            <div className="insight-card">
              <div className="insight-icon"><FaLightbulb /></div>
              <h3>Recommendations</h3>
              <p>Let's add an extra verification step for gift card purchases over $100, as these are frequently targeted. We should also beef up our monitoring during PCS season when we see unusual transaction patterns at Camp Lejeune and Pendleton. This approach has worked well at other installations.</p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Impact - Only show for 30d reports */}
      {isPeriodLong && (
        <div className="report-section">
          <div className="section-header">
            <h2>Financial Impact</h2>
            <p className="section-subheader">Cost-benefit analysis and ROI of fraud prevention</p>
          </div>
          
          <div className="financial-metrics">
            <div className="financial-metric-card">
              <h3>Cost of Fraud</h3>
              <div className="financial-value">${financialImpact?.costOfFraud || '4,331.25'}</div>
              <p>Including chargebacks, fees, and operational costs</p>
            </div>
            <div className="financial-metric-card">
              <h3>Prevention Savings</h3>
              <div className="financial-value">${financialImpact?.preventionSavings || '3,465'}</div>
              <p>Direct savings from fraud prevention</p>
            </div>
            <div className="financial-metric-card">
              <h3>System ROI</h3>
              <div className="financial-value">{financialImpact?.systemROI || '341'}%</div>
              <p>Return on investment for fraud detection system</p>
            </div>
          </div>
          
          <div className="monthly-trends">
            <h3>Monthly Fraud Trends</h3>
            <div className="monthly-trends-grid">
              <div className="monthly-trend">
                <h4>April 2025</h4>
                <div className="trend-metrics">
                  <div>Fraud Rate: <span className="highlight">1.8%</span></div>
                  <div>Transactions: <span>24,320</span></div>
                  <div>Flagged: <span>438</span></div>
                </div>
              </div>
              <div className="monthly-trend">
                <h4>March 2025</h4>
                <div className="trend-metrics">
                  <div>Fraud Rate: <span className="highlight">2.4%</span></div>
                  <div>Transactions: <span>22,156</span></div>
                  <div>Flagged: <span>532</span></div>
                </div>
              </div>
              <div className="monthly-trend">
                <h4>February 2025</h4>
                <div className="trend-metrics">
                  <div>Fraud Rate: <span className="highlight">2.7%</span></div>
                  <div>Transactions: <span>19,845</span></div>
                  <div>Flagged: <span>536</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anomaly detection section for 24-hour reports */}
      {showAnomalies && (
        <div className="report-section">
          <div className="section-header" style={{ color: '#111827' }}>
            <h2>Real-Time Anomaly Detection</h2>
            <p className="section-description">Recent unusual transaction patterns</p>
          </div>
          <div className="anomaly-container">
            <div className="anomaly-list">
              <div className="anomaly-item">
                <div className="anomaly-time">10:42 AM</div>
                <div className="anomaly-content">
                  <h4>Unusual Transaction Volume</h4>
                  <p>Spike in transaction volume from IP range 192.168.x.x (27% above normal)</p>
                  <div className="anomaly-severity high">High Severity</div>
                </div>
              </div>
              <div className="anomaly-item">
                <div className="anomaly-time">9:15 AM</div>
                <div className="anomaly-content">
                  <h4>Multiple Failed Authentication</h4>
                  <p>5 accounts experienced multiple failed authentication attempts within 10 minutes</p>
                  <div className="anomaly-severity medium">Medium Severity</div>
                </div>
              </div>
              <div className="anomaly-item">
                <div className="anomaly-time">3:27 AM</div>
                <div className="anomaly-content">
                  <h4>Unusual Geographic Pattern</h4>
                  <p>Account accessed from 3 different countries within 2 hours</p>
                  <div className="anomaly-severity high">High Severity</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="report-footer">
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} • MCCS Fraud Detection System</p>
      </div>
    </div>
  );
};

export default Report;
