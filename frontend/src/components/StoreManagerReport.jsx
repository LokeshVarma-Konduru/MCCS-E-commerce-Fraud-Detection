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
import { FaFilePdf, FaChartLine, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/logo.jpg';

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

const StoreManagerReport = ({ data }) => {
  const { period, fraudTrendData, transactionTypesData, stats, recentAlerts } = data;
  const reportRef = useRef(null);
  
  // Format the report period for display
  let periodDisplay = '';
  switch (period) {
    case 'Last 24 h.':
      periodDisplay = 'Last 24 Hours';
      break;
    case 'Last 7 days':
      periodDisplay = 'Last 7 Days';
      break;
    case 'Last 30 days':
      periodDisplay = 'Last 30 Days';
      break;
    default:
      periodDisplay = period;
  }

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
      pdf.save(`MCCS-Store-Manager-Report-${periodDisplay}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      // Remove the loading indicator
      document.body.removeChild(loadingElement);
    }
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
          <div className="summary-value">{stats.totalTransactions.value.toLocaleString()}</div>
          <div className={`summary-change ${stats.totalTransactions.change.includes('+') ? 'positive' : 'negative'}`}>
            {stats.totalTransactions.change}
          </div>
        </div>
        <div className="summary-card">
          <h3>Fraud Rate</h3>
          <div className="summary-value">{stats.fraudRate.value}</div>
          <div className={`summary-change ${stats.fraudRate.change.includes('+') ? 'negative' : 'positive'}`}>
            {stats.fraudRate.change}
          </div>
        </div>
        <div className="summary-card">
          <h3>Financial Impact</h3>
          <div className="summary-value">{stats.financialImpact.value}</div>
          <div className={`summary-change ${stats.financialImpact.change.includes('+') ? 'negative' : 'positive'}`}>
            {stats.financialImpact.change}
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="section-header" style={{ color: '#111827' }}>
          <h2>Fraud Detection Trend</h2>
          <p className="section-description">Fraud rate trend over {periodDisplay.toLowerCase()}</p>
        </div>
        <div className="chart-container elevated" style={{ background: 'white', height: 300 }}>
          <Line 
            data={fraudTrendData}
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
                  ticks: {
                    callback: value => value + '%'
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
            <p className="section-subheader">Distribution by transaction type</p>
          </div>
          <div className="chart-container">
            <Bar 
              data={transactionTypesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: 20
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    }
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      drawBorder: false
                    },
                    ticks: {
                      precision: 0
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
              data={{
                labels: ['Exchange', 'Commissary', 'Food & Hospitality', 'Recreation', 'Marine Mart'],
                datasets: [
                  {
                    data: [45, 25, 15, 10, 5],
                    backgroundColor: [
                      '#60a5fa', // Exchange (blue)
                      '#f87171', // Commissary (red)
                      '#4ade80', // Food & Hospitality (green)
                      '#fbbf24', // Recreation (yellow)
                      '#a78bfa'  // Marine Mart (purple)
                    ]
                  }
                ]
              }}
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

      <div className="report-section">
        <div className="section-header" style={{ color: '#111827' }}>
          <h2>Recent Alerts</h2>
          <p className="section-description">Most recent fraud alerts requiring attention</p>
        </div>
        <div className="alerts-table-container">
          {recentAlerts.length === 0 ? (
            <div className="no-alerts">No recent alerts found</div>
          ) : (
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert, index) => (
                  <tr key={index}>
                    <td>{alert.time}</td>
                    <td>{alert.transactionId}</td>
                    <td>{alert.type}</td>
                    <td>{alert.amount}</td>
                    <td>
                      <span className={`risk-badge ${alert.riskScore.toLowerCase()}`}>
                        {alert.riskScore}
                      </span>
                    </td>
                    <td>{alert.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="report-section insights-section">
        <div className="section-header">
          <h2>Key Insights & Recommendations</h2>
          <p className="section-subheader">Analysis and actionable insights from the data</p>
        </div>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon"><FaChartLine /></div>
            <h3>Trend Analysis</h3>
            <p>
              {parseFloat(stats.totalTransactions.change) > 0 
                ? `Transaction volume has increased by ${stats.totalTransactions.change}. This growth indicates increased store activity.` 
                : `Transaction volume has decreased by ${stats.totalTransactions.change}. Monitor this trend to identify potential issues.`}
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon"><FaExclamationTriangle /></div>
            <h3>Fraud Patterns</h3>
            <p>
              {parseFloat(stats.fraudRate.value) > 2
                ? "We've detected an elevated fraud rate. Most suspicious activities involve high-value transactions and gift card purchases."
                : "Fraud rate remains at acceptable levels. Continue monitoring for any unusual patterns in transaction behavior."}
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon"><FaLightbulb /></div>
            <h3>Recommendations</h3>
            <p>
              {parseFloat(stats.fraudRate.value) > 2
                ? "Consider implementing additional verification for transactions over $100. Review staff training on fraud detection procedures."
                : "Maintain current fraud prevention practices. Consider periodic staff refresher training on identifying suspicious transactions."}
            </p>
          </div>
        </div>
      </div>

      <div className="report-footer">
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} • MCCS Fraud Detection System</p>
      </div>
    </div>
  );
};

export default StoreManagerReport;
