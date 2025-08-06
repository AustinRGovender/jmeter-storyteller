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

export interface ParseResult {
  success: boolean;
  records: JTLRecord[];
  error?: string;
  debugInfo: {
    totalLines: number;
    headerLine: string;
    detectedHeaders: string[];
    detectedDelimiter: string;
    parsedRecords: number;
    validRecords: number;
    sampleRecord?: Partial<JTLRecord>;
  };
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
  transactionsPerSecond: number;
  testDuration: number;
  avgConnectTime: number;
  avgLatency: number;
}

export interface ChartDataPoint {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errors: number;
  minResponseTime: number;
  maxResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
  avgConnectTime: number;
  avgLatency: number;
  bandwidth: number;
}

export class JTLParser {
  private records: JTLRecord[] = [];
  private lastParseResult?: ParseResult;
  private metricsCache?: PerformanceMetrics;

  parseFile(content: string): ParseResult {
    this.records = [];
    this.metricsCache = undefined; // Clear cache when parsing new file
    console.log('Starting JTL file parsing...');
    
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        records: [],
        error: 'File must contain at least a header and one data row',
        debugInfo: {
          totalLines: lines.length,
          headerLine: lines[0] || '',
          detectedHeaders: [],
          detectedDelimiter: '',
          parsedRecords: 0,
          validRecords: 0
        }
      };
    }

    // Auto-detect delimiter
    const headerLine = lines[0];
    const delimiter = this.detectDelimiter(headerLine);
    console.log(`Detected delimiter: "${delimiter}"`);

    const headers = this.parseRow(headerLine, delimiter);
    console.log('Detected headers:', headers);

    this.records = [];
    let parsedRecords = 0;
    let validRecords = 0;
    let sampleRecord: Partial<JTLRecord> | undefined;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = this.parseRow(line, delimiter);
      parsedRecords++;

      if (values.length >= Math.min(headers.length, 3)) { // At least 3 fields required
        const record: Partial<JTLRecord> = {};
        
        headers.forEach((header, index) => {
          if (index >= values.length) return;
          
          const value = values[index]?.trim();
          if (!value) return;

          this.mapFieldToRecord(header, value, record);
        });
        
        // More flexible validation - require either timestamp OR elapsed, and at least one other field
        const hasTimeData = record.timestamp || record.elapsed !== undefined;
        const hasLabel = record.label && record.label !== '';
        const hasResponseData = record.responseCode || record.success !== undefined;
        
        if (hasTimeData && (hasLabel || hasResponseData)) {
          // Fill in missing required fields with defaults
          if (!record.timestamp && record.elapsed !== undefined) {
            record.timestamp = Date.now() - (this.records.length * 1000); // Fake timestamps
          }
          if (record.elapsed === undefined && record.timestamp) {
            record.elapsed = 100; // Default response time
          }
          if (!record.label) record.label = 'Unknown';
          if (!record.responseCode) record.responseCode = '200';
          if (record.success === undefined) record.success = true;
          if (!record.threadName) record.threadName = 'Thread Group 1-1';

          this.records.push(record as JTLRecord);
          validRecords++;
          
          if (!sampleRecord) {
            sampleRecord = { ...record };
          }
        }
      }
    }

    console.log(`Parsing complete: ${validRecords}/${parsedRecords} valid records`);

    const result: ParseResult = {
      success: validRecords > 0,
      records: this.records,
      error: validRecords === 0 ? 'No valid records found. Check file format and required fields.' : undefined,
      debugInfo: {
        totalLines: lines.length,
        headerLine,
        detectedHeaders: headers,
        detectedDelimiter: delimiter,
        parsedRecords,
        validRecords,
        sampleRecord
      }
    };

    this.lastParseResult = result;
    return result;
  }

  private detectDelimiter(line: string): string {
    const delimiters = ['\t', ',', ';', '|'];
    let bestDelimiter = '\t';
    let maxFields = 0;

    for (const delimiter of delimiters) {
      const fields = this.parseRow(line, delimiter);
      if (fields.length > maxFields) {
        maxFields = fields.length;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  private parseRow(line: string, delimiter: string): string[] {
    // Handle quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === delimiter || inQuotes)) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    fields.push(current.trim());
    return fields.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
  }

  private mapFieldToRecord(header: string, value: string, record: Partial<JTLRecord>): void {
    const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove special chars
    
    switch (headerLower) {
      case 'timestamp':
      case 'timstamp':
      case 'time':
        const timestamp = parseInt(value);
        if (!isNaN(timestamp)) {
          record.timestamp = timestamp;
        }
        break;
      case 'elapsed':
      case 'responsetime':
      case 'rt':
        const elapsed = parseInt(value);
        if (!isNaN(elapsed)) {
          record.elapsed = elapsed;
        }
        break;
      case 'label':
      case 'sampler':
      case 'name':
        record.label = value;
        break;
      case 'responsecode':
      case 'responsemessage':
      case 'code':
      case 'status':
        record.responseCode = value;
        break;
      case 'success':
      case 'result':
        record.success = value.toLowerCase() === 'true' || value === '1';
        break;
      case 'threadname':
      case 'thread':
        record.threadName = value;
        break;
      case 'failuremessage':
      case 'error':
        record.failureMessage = value;
        break;
      case 'bytes':
      case 'size':
        record.bytes = parseInt(value) || 0;
        break;
      case 'sentbytes':
      case 'requestsize':
        record.sentBytes = parseInt(value) || 0;
        break;
      case 'latency':
        record.latency = parseInt(value) || 0;
        break;
      case 'url':
        record.url = value;
        break;
    }
  }

  getLastParseResult(): ParseResult | undefined {
    return this.lastParseResult;
  }

  getRecords(): JTLRecord[] {
    return this.records;
  }

  calculateMetrics(): PerformanceMetrics {
    // Return cached metrics if available
    if (this.metricsCache) {
      return this.metricsCache;
    }
    
    console.log('calculateMetrics called with', this.records.length, 'records');
    
    if (this.records.length === 0) {
      console.log('No records found, returning zero metrics');
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
          p99ResponseTime: 0,
          transactionsPerSecond: 0,
          testDuration: 0,
          avgConnectTime: 0,
          avgLatency: 0
        };
    }

    try {
      // Debug: log sample records
      console.log('Sample records:', this.records.slice(0, 3));
      
      // More robust filtering - handle different data types
      const responseTimes = this.records
        .map(r => {
          // Handle both number and string values
          const elapsed = typeof r.elapsed === 'string' ? parseFloat(r.elapsed) : r.elapsed;
          return elapsed;
        })
        .filter(time => time !== undefined && time !== null && !isNaN(time) && time >= 0);
      
      console.log('Valid response times found:', responseTimes.length, 'out of', this.records.length);
      console.log('Sample response times:', responseTimes.slice(0, 5));
      
      if (responseTimes.length === 0) {
        console.log('No valid response times found, checking raw elapsed values...');
        console.log('Raw elapsed values:', this.records.slice(0, 5).map(r => ({ elapsed: r.elapsed, type: typeof r.elapsed })));
        
        return {
          avgResponseTime: 0,
          maxResponseTime: 0,
          minResponseTime: 0,
          throughput: 0,
          errorRate: 100,
          totalRequests: this.records.length,
          successfulRequests: 0,
          failedRequests: this.records.length,
          p90ResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          transactionsPerSecond: 0,
          testDuration: 0,
          avgConnectTime: 0,
          avgLatency: 0
        };
      }

      const successfulRequests = this.records.filter(r => r.success === true).length;
      const failedRequests = this.records.length - successfulRequests;
      
      // Sort response times for percentile calculations
      const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
      
      // More robust timestamp handling
      const timestamps = this.records
        .map(r => {
          const timestamp = typeof r.timestamp === 'string' ? parseFloat(r.timestamp) : r.timestamp;
          return timestamp;
        })
        .filter(t => t !== undefined && t !== null && !isNaN(t) && t > 0);
      
      const testDuration = timestamps.length > 1 
        ? (Math.max(...timestamps) - Math.min(...timestamps)) / 1000 
        : 1; // Default to 1 second if no valid duration

      // Calculate additional metrics
      const connectTimes = this.records
        .map(r => r.latency || 0)
        .filter(time => time >= 0);
      
      const latencies = this.records
        .map(r => r.latency || 0)
        .filter(time => time >= 0);
      
      const metrics = {
        avgResponseTime: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length),
        maxResponseTime: Math.round(Math.max(...responseTimes)),
        minResponseTime: Math.round(Math.min(...responseTimes)),
        throughput: Math.round((testDuration > 0 ? this.records.length / testDuration : 0) * 100) / 100,
        errorRate: Math.round((failedRequests / this.records.length) * 100 * 100) / 100,
        totalRequests: this.records.length,
        successfulRequests,
        failedRequests,
        p90ResponseTime: Math.round(this.calculatePercentile(sortedResponseTimes, 90)),
        p95ResponseTime: Math.round(this.calculatePercentile(sortedResponseTimes, 95)),
        p99ResponseTime: Math.round(this.calculatePercentile(sortedResponseTimes, 99)),
        transactionsPerSecond: Math.round((testDuration > 0 ? this.records.length / testDuration : 0) * 100) / 100,
        testDuration: Math.round(testDuration * 100) / 100,
        avgConnectTime: connectTimes.length > 0 ? Math.round(connectTimes.reduce((sum, time) => sum + time, 0) / connectTimes.length) : 0,
        avgLatency: latencies.length > 0 ? Math.round(latencies.reduce((sum, time) => sum + time, 0) / latencies.length) : 0
      };
      
      console.log('Calculated metrics:', metrics);
      this.metricsCache = metrics; // Cache the result
      return metrics;
    } catch (error) {
      console.error('Error calculating metrics:', error);
      console.error('Records causing error:', this.records.slice(0, 3));
      return {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        totalRequests: this.records.length,
        successfulRequests: 0,
        failedRequests: 0,
        p90ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        transactionsPerSecond: 0,
        testDuration: 0,
        avgConnectTime: 0,
        avgLatency: 0
      };
    }
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (!sortedArray || sortedArray.length === 0) return 0;
    if (percentile <= 0) return sortedArray[0];
    if (percentile >= 100) return sortedArray[sortedArray.length - 1];
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    const safeIndex = Math.max(0, Math.min(index, sortedArray.length - 1));
    return sortedArray[safeIndex] || 0;
  }

  generateChartData(bucketSize: number = 30): ChartDataPoint[] {
    if (this.records.length === 0) return [];

    try {
      // Filter out invalid timestamps and records
      const validRecords = this.records.filter(record => 
        record.timestamp && 
        !isNaN(record.timestamp) && 
        record.timestamp > 0 &&
        record.elapsed !== undefined &&
        !isNaN(record.elapsed)
      );

      if (validRecords.length === 0) return [];

      const timestamps = validRecords.map(r => r.timestamp);
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);
      
      // Prevent division by zero or negative bucket duration
      if (bucketSize <= 0 || minTimestamp >= maxTimestamp) {
        return [{
          timestamp: new Date(minTimestamp).toLocaleTimeString(),
          responseTime: Math.round(validRecords[0].elapsed),
          throughput: validRecords.length,
          errors: validRecords.filter(r => !r.success).length,
          minResponseTime: Math.round(validRecords[0].elapsed),
          maxResponseTime: Math.round(validRecords[0].elapsed),
          p90ResponseTime: Math.round(validRecords[0].elapsed),
          p95ResponseTime: Math.round(validRecords[0].elapsed),
          p99ResponseTime: Math.round(validRecords[0].elapsed),
          successRate: 100,
          avgConnectTime: validRecords[0].latency || 0,
          avgLatency: validRecords[0].latency || 0,
          bandwidth: (validRecords[0].bytes || 0) / bucketSize
        }];
      }

      const bucketDuration = bucketSize * 1000; // Convert to milliseconds
      const buckets: Map<number, { responses: number[], errors: number, connectTimes: number[], latencies: number[], bytes: number[] }> = new Map();
      
      // Group records into time buckets
      validRecords.forEach(record => {
        const timeDiff = record.timestamp - minTimestamp;
        const bucketKey = Math.floor(timeDiff / bucketDuration);
        
        // Ensure bucketKey is valid
        if (bucketKey < 0 || !isFinite(bucketKey)) return;
        
        if (!buckets.has(bucketKey)) {
          buckets.set(bucketKey, { responses: [], errors: 0, connectTimes: [], latencies: [], bytes: [] });
        }
        
        const bucket = buckets.get(bucketKey)!;
        bucket.responses.push(record.elapsed);
        bucket.connectTimes.push(record.latency || 0);
        bucket.latencies.push(record.latency || 0);
        bucket.bytes.push(record.bytes || 0);
        if (!record.success) {
          bucket.errors++;
        }
      });
      
      // Convert buckets to chart data
      const chartData: ChartDataPoint[] = [];
      
      for (const [bucketKey, bucket] of buckets.entries()) {
        if (!isFinite(bucketKey) || bucketKey < 0) continue;
        
        const timestamp = new Date(minTimestamp + (bucketKey * bucketDuration));
        const avgResponseTime = bucket.responses.length > 0 
          ? bucket.responses.reduce((sum, time) => sum + time, 0) / bucket.responses.length 
          : 0;
        const throughput = bucket.responses.length / bucketSize; // requests per second
        
        // Calculate additional metrics for the bucket
        const sortedResponses = [...bucket.responses].sort((a, b) => a - b);
        const successCount = bucket.responses.length - bucket.errors;
        const successRate = bucket.responses.length > 0 ? (successCount / bucket.responses.length) * 100 : 0;
        const avgConnectTime = bucket.connectTimes.length > 0 
          ? bucket.connectTimes.reduce((sum, time) => sum + time, 0) / bucket.connectTimes.length 
          : 0;
        const avgLatency = bucket.latencies.length > 0 
          ? bucket.latencies.reduce((sum, time) => sum + time, 0) / bucket.latencies.length 
          : 0;
        const bandwidth = bucket.bytes.length > 0 
          ? bucket.bytes.reduce((sum, bytes) => sum + bytes, 0) / bucketSize / 1024 // KB/s
          : 0;
        
        chartData.push({
          timestamp: timestamp.toLocaleTimeString(),
          responseTime: Math.round(avgResponseTime || 0),
          throughput: Math.round((throughput || 0) * 10) / 10,
          errors: bucket.errors || 0,
          minResponseTime: Math.round(sortedResponses[0] || 0),
          maxResponseTime: Math.round(sortedResponses[sortedResponses.length - 1] || 0),
          p90ResponseTime: Math.round(this.calculatePercentile(sortedResponses, 90)),
          p95ResponseTime: Math.round(this.calculatePercentile(sortedResponses, 95)),
          p99ResponseTime: Math.round(this.calculatePercentile(sortedResponses, 99)),
          successRate: Math.round(successRate * 100) / 100,
          avgConnectTime: Math.round(avgConnectTime),
          avgLatency: Math.round(avgLatency),
          bandwidth: Math.round(bandwidth * 100) / 100
        });
      }
      
      return chartData.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } catch (error) {
      console.error('Error generating chart data:', error);
      return [];
    }
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