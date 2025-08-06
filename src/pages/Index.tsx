import { useState, useMemo } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { MetricsOverview } from "@/components/MetricsOverview";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ChartSelector, ChartConfig } from "@/components/ChartSelector";
import { TransactionTable } from "@/components/TransactionTable";
import { TopErrorsSection } from "@/components/TopErrorsSection";
import { ExportButton } from "@/components/ExportButton";
import { JTLParser } from "@/utils/jtlParser";
import { toast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, FileText } from "lucide-react";

const Index = () => {
  const [parser, setParser] = useState<JTLParser | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [availableCharts, setAvailableCharts] = useState<ChartConfig[]>([
    { id: 'response-time', title: 'Response Time Over Time', type: 'response-time', category: 'Response Time', enabled: true },
    { id: 'throughput', title: 'Throughput Over Time', type: 'throughput', category: 'Performance', enabled: true },
    { id: 'errors', title: 'Errors Over Time', type: 'errors', category: 'Error Analysis', enabled: true },
    { id: 'percentiles', title: 'Response Time Percentiles', type: 'percentiles', category: 'Response Time', enabled: false },
    { id: 'min-max-avg', title: 'Min/Max/Avg Response Time', type: 'min-max-avg', category: 'Response Time', enabled: false },
    { id: 'success-rate', title: 'Success Rate Over Time', type: 'success-rate', category: 'Error Analysis', enabled: false },
    { id: 'bandwidth', title: 'Bandwidth Utilization', type: 'bandwidth', category: 'Performance', enabled: false },
    { id: 'connect-latency', title: 'Connection Time vs Latency', type: 'connect-latency', category: 'Performance', enabled: false }
  ]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      const content = await file.text();
      const newParser = new JTLParser();
      const parseResult = newParser.parseFile(content);
      
      if (!parseResult.success) {
        const debugInfo = parseResult.debugInfo;
        console.log('Parse failed. Debug info:', debugInfo);
        
        toast({
          title: "Invalid File",
          description: parseResult.error || "No valid performance data found in the uploaded file.",
          variant: "destructive",
        });
        
        // Show detailed debug information in console
        console.log(`File parsing details:
          - Total lines: ${debugInfo.totalLines}
          - Header: ${debugInfo.headerLine}
          - Detected delimiter: "${debugInfo.detectedDelimiter}"
          - Detected headers: ${debugInfo.detectedHeaders.join(', ')}
          - Parsed records: ${debugInfo.parsedRecords}
          - Valid records: ${debugInfo.validRecords}
          - Sample record:`, debugInfo.sampleRecord);
        
        setIsProcessing(false);
        return;
      }
      
      setParser(newParser);
      toast({
        title: "File Processed Successfully",
        description: `Loaded ${parseResult.records.length.toLocaleString()} performance records from ${file.name}`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process the JTL file. Please ensure it's a valid JMeter results file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const metrics = useMemo(() => {
    if (!parser) return null;
    try {
      return parser.calculateMetrics();
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        totalRequests: parser.getRecords().length,
        successfulRequests: 0,
        failedRequests: parser.getRecords().length,
        p90ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        transactionsPerSecond: 0,
        testDuration: 0,
        avgConnectTime: 0,
        avgLatency: 0
      };
    }
  }, [parser?.getRecords().length]); // Use records length instead of parser instance
  
  const chartData = useMemo(() => {
    if (!parser) return null;
    try {
      return parser.generateChartData();
    } catch (error) {
      console.error('Error generating chart data:', error);
      return [];
    }
  }, [parser?.getRecords().length]);
  
  const transactions = useMemo(() => {
    if (!parser) return [];
    try {
      return parser.getTransactionBreakdown() || [];
    } catch (error) {
      console.error('Error getting transaction breakdown:', error);
      return [];
    }
  }, [parser?.getRecords().length]);

  const topErrors = useMemo(() => {
    if (!parser) return [];
    try {
      return parser.getTopErrors() || [];
    } catch (error) {
      console.error('Error getting top errors:', error);
      return [];
    }
  }, [parser?.getRecords().length]);

  if (!parser) {
    return (
      <div className="bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-hero text-white">
          <div className="container mx-auto px-6 py-16">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <BarChart3 className="w-12 h-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                JMeter Performance Analyzer
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Transform your JMeter test results into stunning, interactive reports
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="flex items-center space-x-2 text-white/80">
                  <FileText className="w-5 h-5" />
                  <span>100% Client-Side Processing</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <TrendingUp className="w-5 h-5" />
                  <span>Interactive Visualizations</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <BarChart3 className="w-5 h-5" />
                  <span>Exportable Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Get Started
              </h2>
              <p className="text-muted-foreground text-lg">
                Upload your JMeter JTL results file to generate comprehensive performance analysis
              </p>
            </div>
            
            <FileDropZone onFileUpload={handleFileUpload} />
            
            {isProcessing && (
              <div className="mt-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Processing your performance data...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Analysis Report</h1>
              <p className="text-primary-foreground/80">
                Analysis of {fileName} • {metrics?.totalRequests.toLocaleString()} total requests
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <ExportButton 
                data={{
                  metrics,
                  chartData: chartData || [],
                  transactionBreakdown: transactions,
                  fileName
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Metrics Overview */}
        {metrics && <MetricsOverview metrics={metrics} />}

        {/* Top Errors Section */}
        <TopErrorsSection errors={topErrors} />

        {/* Chart Selection */}
        <ChartSelector 
          charts={availableCharts}
          onChartsChange={setAvailableCharts}
        />

        {/* Charts */}
        {chartData && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableCharts
              .filter(chart => chart.enabled)
              .map(chart => (
                <div 
                  key={chart.id} 
                  className={chart.type === 'errors' || chart.type === 'min-max-avg' ? 'lg:col-span-2' : ''}
                >
                  <PerformanceChart 
                    data={chartData} 
                    title={chart.title} 
                    type={chart.type as any}
                  />
                </div>
              ))
            }
          </div>
        )}

        {/* Transaction Table */}
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
};

export default Index;