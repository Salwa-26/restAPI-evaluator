const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const OASParser = require('../services/oasParser');
const APITester = require('../services/apiTester');

// Create new evaluation
router.post('/', async (req, res) => {
  try {
    const { oasUrl, oasContent } = req.body;
    
    if (!oasUrl && !oasContent) {
      return res.status(400).json({ 
        error: 'Either oasUrl or oasContent must be provided' 
      });
    }

    // Parse OAS
    const parser = new OASParser();
    const parseResult = await parser.parseOAS(oasUrl || oasContent);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Failed to parse OAS', 
        details: parseResult.error 
      });
    }

    // Extract endpoints
    const endpoints = parser.extractEndpoints();
    
    // Create evaluation record
    const evaluation = new Evaluation({
      oasUrl: oasUrl || 'Provided as JSON',
      oasContent: parseResult.api,
      totalEndpoints: endpoints.length,
      status: 'pending'
    });

    await evaluation.save();

    // Start evaluation process (async)
    processEvaluation(evaluation._id, parser, endpoints);

    res.status(201).json({
      id: evaluation._id,
      status: 'pending',
      totalEndpoints: endpoints.length,
      message: 'Evaluation started'
    });

  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get evaluation by ID
router.get('/:id', async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all evaluations
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const evaluations = await Evaluation.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-requestLogs -oasContent'); 

    const total = await Evaluation.countDocuments();

    res.json({
      evaluations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete evaluation
router.delete('/:id', async (req, res) => {
  try {
    const evaluation = await Evaluation.findByIdAndDelete(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process evaluation asynchronously
async function processEvaluation(evaluationId, parser, endpoints) {
  try {
    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) return;

    evaluation.status = 'running';
    await evaluation.save();

    const tester = new APITester();
    const requestLogs = [];

    // Test each endpoint
    for (const endpoint of endpoints) {
      try {
        const requestData = parser.generateRequestData(endpoint);
        const result = await tester.executeEndpoint(requestData);
        requestLogs.push(result);
        
        // Update progress
        evaluation.requestLogs = requestLogs;
        if (result.success) {
          evaluation.successfulRequests++;
        } else {
          evaluation.failedRequests++;
        }
        await evaluation.save();
        
      } catch (error) {
        console.error(`Error testing endpoint ${endpoint.path}:`, error);
        requestLogs.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          url: endpoint.fullUrl,
          requestHeaders: {},
          requestBody: null,
          responseStatus: 0,
          responseHeaders: {},
          responseBody: null,
          responseTime: 0,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        evaluation.failedRequests++;
        await evaluation.save();
      }
    }

    // Generate summary report
    const summary = tester.generateSummaryReport(requestLogs);
    
    // Update final evaluation
    evaluation.status = 'completed';
    evaluation.requestLogs = requestLogs;
    evaluation.summary = summary;
    evaluation.successRate = summary.successRate;
    evaluation.completedAt = new Date();
    
    await evaluation.save();

  } catch (error) {
    console.error('Error processing evaluation:', error);
    
    // Mark as failed
    await Evaluation.findByIdAndUpdate(evaluationId, {
      status: 'failed',
      completedAt: new Date()
    });
  }
}

module.exports = router;