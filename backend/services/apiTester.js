const axios = require('axios');

class APITester {
  constructor() {
    this.timeout = 10000; // 10 seconds
    this.retryCount = 2;
    this.retryDelay = 1000; // 1 second
  }

  async executeEndpoint(requestData) {
    const startTime = Date.now();
    let attempt = 0;
    
    while (attempt <= this.retryCount) {
      try {
        const config = {
          url: requestData.url,
          method: requestData.method.toLowerCase(),
          headers: requestData.headers,
          timeout: this.timeout,
          validateStatus: () => true 
        };

        // Add query parameters
        if (Object.keys(requestData.params).length > 0) {
          config.params = requestData.params;
        }

        // Add request body for POST requests
        if (requestData.method === 'POST' && requestData.body) {
          config.data = requestData.body;
        }

        const response = await axios(config);
        const endTime = Date.now();
        
        const result = {
          endpoint: requestData.url,
          method: requestData.method,
          url: config.url,
          requestHeaders: requestData.headers,
          requestBody: requestData.body,
          responseStatus: response.status,
          responseHeaders: response.headers,
          responseBody: this.sanitizeResponseBody(response.data),
          responseTime: endTime - startTime,
          success: response.status >= 200 && response.status < 400,
          error: null,
          timestamp: new Date().toISOString()
        };

        return result;

      } catch (error) {
        attempt++;
        
        if (attempt > this.retryCount) {
          const endTime = Date.now();
          
          return {
            endpoint: requestData.url,
            method: requestData.method,
            url: requestData.url,
            requestHeaders: requestData.headers,
            requestBody: requestData.body,
            responseStatus: error.response?.status || 0,
            responseHeaders: error.response?.headers || {},
            responseBody: error.response?.data || null,
            responseTime: endTime - startTime,
            success: false,
            error: this.getErrorMessage(error),
            timestamp: new Date().toISOString()
          };
        }
        
        // Wait before retry
        await this.sleep(this.retryDelay * attempt);
      }
    }
  }

  sanitizeResponseBody(data) {
    if (!data) return null;
    
    // Limit response body size to prevent storage issues
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 10000) {
      return {
        _truncated: true,
        _originalSize: jsonString.length,
        data: JSON.parse(jsonString.substring(0, 10000))
      };
    }
    
    return data;
  }

  getErrorMessage(error) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout';
    } else if (error.code === 'ENOTFOUND') {
      return 'DNS resolution failed';
    } else if (error.code === 'ECONNREFUSED') {
      return 'Connection refused';
    } else if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else {
      return error.message;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateSummaryReport(requestLogs) {
    const summary = {
      totalRequests: requestLogs.length,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      endpointSummary: {},
      statusCodeDistribution: {},
      errorTypes: {}
    };

    let totalResponseTime = 0;

    requestLogs.forEach(log => {
      // Overall stats
      if (log.success) {
        summary.successfulRequests++;
      } else {
        summary.failedRequests++;
      }
      
      totalResponseTime += log.responseTime;

      // Endpoint-specific stats
      const endpointKey = `${log.method} ${log.endpoint}`;
      if (!summary.endpointSummary[endpointKey]) {
        summary.endpointSummary[endpointKey] = {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
          averageResponseTime: 0
        };
      }
      
      summary.endpointSummary[endpointKey].total++;
      if (log.success) {
        summary.endpointSummary[endpointKey].successful++;
      } else {
        summary.endpointSummary[endpointKey].failed++;
      }

      // Status code distribution
      const statusCode = log.responseStatus.toString();
      summary.statusCodeDistribution[statusCode] = 
        (summary.statusCodeDistribution[statusCode] || 0) + 1;

      // Error types
      if (log.error) {
        summary.errorTypes[log.error] = (summary.errorTypes[log.error] || 0) + 1;
      }
    });

    // Calculate rates and averages
    if (summary.totalRequests > 0) {
      summary.successRate = (summary.successfulRequests / summary.totalRequests) * 100;
      summary.averageResponseTime = totalResponseTime / summary.totalRequests;
    }

    // Calculate endpoint-specific rates
    Object.keys(summary.endpointSummary).forEach(endpoint => {
      const stats = summary.endpointSummary[endpoint];
      if (stats.total > 0) {
        stats.successRate = (stats.successful / stats.total) * 100;
        
        // Calculate average response time for this endpoint
        const endpointLogs = requestLogs.filter(log => 
          `${log.method} ${log.endpoint}` === endpoint
        );
        const totalTime = endpointLogs.reduce((sum, log) => sum + log.responseTime, 0);
        stats.averageResponseTime = totalTime / endpointLogs.length;
      }
    });

    return summary;
  }
}

module.exports = APITester;