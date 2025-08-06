export interface JTLRecord {
  timestamp: number;
  elapsed: number;
  label: string;
  responseCode: string;
  success: boolean;
  threadName: string;
  failureMessage?: string;
  bytes?: number;
  sentBytes?: number;
  grpThreads?: number;
  allThreads?: number;
  url?: string;
  filename?: string;
  latency?: number;
  encoding?: string;
  sampleCount?: number;
  errorCount?: number;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface ChartDataPoint {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errors: number;
}

export class JTLParser {
  private records: JTLRecord[] = [];

  parseFile(content: string): JTLRecord[] {
    const lines = content.trim().split('\n');
    const headers = lines[0].split('\t');
    
    this.records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length >= headers.length) {
        const record: Partial<JTLRecord> = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          switch (header.toLowerCase()) {
            case 'timestamp':
            case 'timstamp': // Common typo in JMeter
              record.timestamp = parseInt(value);
              break;
            case 'elapsed':
              record.elapsed = parseInt(value);
              break;
            case 'label':
              record.label = value;
              break;
            case 'responsecode':
            case 'response_code':
              record.responseCode = value;
              break;
            case 'success':
              record.success = value.toLowerCase() === 'true';
              break;
            case 'threadname':
            case 'thread_name':
              record.threadName = value;
              break;
            case 'failuremessage':
            case 'failure_message':
              record.failureMessage = value;
              break;
            case 'bytes':
              record.bytes = parseInt(value) || 0;
              break;
            case 'sentbytes':
            case 'sent_bytes':
              record.sentBytes = parseInt(value) || 0;
              break;
            case 'latency':
              record.latency = parseInt(value) || 0;
              break;
            case 'url':
              record.url = value;
              break;
          }
        });
        
        if (record.timestamp && record.elapsed !== undefined) {
          this.records.push(record as JTLRecord);
        }
      }
    }
    
    return this.records;
  }

  calculateMetrics(): PerformanceMetrics {
    if (this.records.length === 0) {
      return {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        p90ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      };
    }

    const responseTimes = this.records.map(r => r.elapsed);
    const successfulRequests = this.records.filter(r => r.success).length;
    const failedRequests = this.records.length - successfulRequests;
    
    // Sort response times for percentile calculations
    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
    
    const testDuration = (Math.max(...this.records.map(r => r.timestamp)) - 
                         Math.min(...this.records.map(r => r.timestamp))) / 1000; // Convert to seconds
    
    return {
      avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      throughput: testDuration > 0 ? this.records.length / testDuration : 0,
      errorRate: (failedRequests / this.records.length) * 100,
      totalRequests: this.records.length,
      successfulRequests,
      failedRequests,
      p90ResponseTime: this.calculatePercentile(sortedResponseTimes, 90),
      p95ResponseTime: this.calculatePercentile(sortedResponseTimes, 95),
      p99ResponseTime: this.calculatePercentile(sortedResponseTimes, 99)
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  generateChartData(bucketSize: number = 30): ChartDataPoint[] {
    if (this.records.length === 0) return [];

    const minTimestamp = Math.min(...this.records.map(r => r.timestamp));
    const maxTimestamp = Math.max(...this.records.map(r => r.timestamp));
    const bucketDuration = bucketSize * 1000; // Convert to milliseconds
    
    const buckets: Map<number, { responses: number[], errors: number }> = new Map();
    
    // Group records into time buckets
    this.records.forEach(record => {
      const bucketKey = Math.floor((record.timestamp - minTimestamp) / bucketDuration);
      
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { responses: [], errors: 0 });
      }
      
      const bucket = buckets.get(bucketKey)!;
      bucket.responses.push(record.elapsed);
      if (!record.success) {
        bucket.errors++;
      }
    });
    
    // Convert buckets to chart data
    const chartData: ChartDataPoint[] = [];
    
    for (const [bucketKey, bucket] of buckets.entries()) {
      const timestamp = new Date(minTimestamp + (bucketKey * bucketDuration));
      const avgResponseTime = bucket.responses.length > 0 
        ? bucket.responses.reduce((sum, time) => sum + time, 0) / bucket.responses.length 
        : 0;
      const throughput = bucket.responses.length / bucketSize; // requests per second
      
      chartData.push({
        timestamp: timestamp.toLocaleTimeString(),
        responseTime: Math.round(avgResponseTime),
        throughput: Math.round(throughput * 10) / 10, // Round to 1 decimal
        errors: bucket.errors
      });
    }
    
    return chartData.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  getTransactionBreakdown() {
    const breakdown = new Map<string, { count: number, avgTime: number, errorCount: number }>();
    
    this.records.forEach(record => {
      if (!breakdown.has(record.label)) {
        breakdown.set(record.label, { count: 0, avgTime: 0, errorCount: 0 });
      }
      
      const stats = breakdown.get(record.label)!;
      stats.count++;
      stats.avgTime = (stats.avgTime * (stats.count - 1) + record.elapsed) / stats.count;
      if (!record.success) {
        stats.errorCount++;
      }
    });
    
    return Array.from(breakdown.entries()).map(([label, stats]) => ({
      label,
      count: stats.count,
      avgResponseTime: Math.round(stats.avgTime),
      errorRate: (stats.errorCount / stats.count) * 100,
      errorCount: stats.errorCount
    }));
  }
}