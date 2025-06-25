const mongoose = require('mongoose');

const RequestLogSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST']
  },
  url: {
    type: String,
    required: true
  },
  requestHeaders: {
    type: Object,
    default: {}
  },
  requestBody: {
    type: Object,
    default: null
  },
  responseStatus: {
    type: Number,
    required: true
  },
  responseHeaders: {
    type: Object,
    default: {}
  },
  responseBody: {
    type: Object,
    default: null
  },
  responseTime: {
    type: Number,
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  error: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const EvaluationSchema = new mongoose.Schema({
  oasUrl: {
    type: String,
    required: true
  },
  oasContent: {
    type: Object,
    required: true
  },
  totalEndpoints: {
    type: Number,
    required: true
  },
  successfulRequests: {
    type: Number,
    default: 0
  },
  failedRequests: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  requestLogs: [RequestLogSchema],
  summary: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);