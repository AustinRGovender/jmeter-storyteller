# JMeter Performance Analyzer

A modern, client-side web application for analyzing JMeter JTL result files. Generate stunning, interactive performance reports with comprehensive metrics and visualizations.

## Features

- **Drag & Drop Interface**: Simply drop your JTL files to start analysis
- **Interactive Charts**: Response time trends, throughput analysis, and error rate visualization
- **Comprehensive Metrics**: Response times, throughput, error rates, and transaction analysis
- **Export Reports**: Generate self-contained HTML reports for sharing
- **Client-Side Processing**: All data processing happens in your browser - no server uploads required
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Supported File Formats

- JTL (JMeter Test Log) files
- CSV format with JMeter column headers

## Getting Started

### Online Version

Visit the live application and start analyzing your JMeter results immediately.

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd jmeter-performance-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080`

## How to Use

1. **Upload JTL File**: Drag and drop your JMeter JTL file onto the upload area
2. **View Analysis**: Explore the automatically generated charts and metrics
3. **Review Transactions**: Examine detailed transaction-level performance data
4. **Export Report**: Click the export button to download a standalone HTML report

## Technology Stack

- **React** - Frontend framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling framework
- **Recharts** - Interactive chart library
- **Vite** - Fast build tool and development server

## Performance Metrics

The analyzer provides insights into:

- **Response Times**: Min, max, average, and percentile analysis
- **Throughput**: Requests per second over time
- **Error Analysis**: Error rates and failure patterns
- **Transaction Performance**: Individual transaction metrics
- **Load Patterns**: Request distribution and timing analysis

## Browser Compatibility

Supports all modern browsers including:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is open source and available under the MIT License.