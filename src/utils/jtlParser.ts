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
}

export interface ChartDataPoint {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errors: number;
}

export class JTLParser {
  private records: JTLRecord[] = [];
  private lastParseResult?: ParseResult;

  parseFile(content: string): ParseResult {
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