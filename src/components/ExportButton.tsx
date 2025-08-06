import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ExportData {
  metrics: any;
  chartData: any[];
  transactionBreakdown: any[];
  fileName: string;
}

interface ExportButtonProps {
  data: ExportData;
}

export const ExportButton = ({ data }: ExportButtonProps) => {
  const generateReportHTML = () => {
    const css = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          color: #334155;
          line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { 
          background: linear-gradient(135deg, #00A862 0%, #00BF63 100%);
          color: white;
          padding: 2rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 168, 98, 0.1);
        }
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
          gap: 1.5rem; 
          margin-bottom: 2rem; 
        }
        .metric-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border-left: 4px solid #00A862;
        }
        .metric-title { color: #64748b; font-size: 0.875rem; font-weight: 500; }
        .metric-value { font-size: 1.875rem; font-weight: bold; color: #1e293b; margin-top: 0.5rem; }
        .chart-section {
          background: white;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }
        .transaction-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .transaction-table th,
        .transaction-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .transaction-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
        }
        .export-info {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        h2 { color: #1e293b; margin-bottom: 1rem; font-size: 1.5rem; }
        .footer {
          text-align: center;
          color: #64748b;
          font-size: 0.875rem;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    `;

    const formatDuration = (ms: number) => {
      if (ms < 1000) return `${ms.toFixed(0)}ms`;
      return `${(ms / 1000).toFixed(2)}s`;
    };

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Performance Test Report - ${data.fileName}</title>
        ${css}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Performance Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Source: ${data.fileName}</p>
          </div>

          <div class="export-info">
            📊 This is a standalone HTML report. All data and styling are embedded for offline viewing.
          </div>

          <h2>Performance Metrics Overview</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Average Response Time</div>
              <div class="metric-value">${formatDuration(data.metrics.avgResponseTime)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Peak Response Time</div>
              <div class="metric-value">${formatDuration(data.metrics.maxResponseTime)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Throughput</div>
              <div class="metric-value">${data.metrics.throughput.toFixed(1)}/s</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Error Rate</div>
              <div class="metric-value">${data.metrics.errorRate.toFixed(2)}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Total Requests</div>
              <div class="metric-value">${data.metrics.totalRequests.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Successful Requests</div>
              <div class="metric-value">${data.metrics.successfulRequests.toLocaleString()}</div>
            </div>
          </div>

          <div class="chart-section">
            <h2>Transaction Breakdown</h2>
            <table class="transaction-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Count</th>
                  <th>Avg Response Time</th>
                  <th>Error Rate</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                ${data.transactionBreakdown.map(tx => `
                  <tr>
                    <td>${tx.label}</td>
                    <td>${tx.count.toLocaleString()}</td>
                    <td>${formatDuration(tx.avgResponseTime)}</td>
                    <td style="color: ${tx.errorRate > 5 ? '#ef4444' : tx.errorRate > 1 ? '#f59e0b' : '#10b981'}">${tx.errorRate.toFixed(2)}%</td>
                    <td>${tx.errorCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Report generated by JMeter Performance Analyzer</p>
            <p>Data processed entirely in your browser - no external services used</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const handleExport = () => {
    try {
      const htmlContent = generateReportHTML();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-report-${data.fileName.replace('.jtl', '')}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Exported",
        description: "Your performance report has been downloaded as a standalone HTML file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleExport}
      className="bg-gradient-primary hover:bg-primary-hover transition-all duration-300 shadow-elegant hover:shadow-glow"
    >
      <Download className="w-4 h-4 mr-2" />
      Export Report
    </Button>
  );
};