const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const PORT = 5001

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// In-memory storage for demo
const receivedWebhooks = []
const orders = new Map()

// Webhook endpoint - receives callbacks from Payment Hub
app.post('/webhook', (req, res) => {
  const webhook = {
    id: receivedWebhooks.length + 1,
    timestamp: new Date().toISOString(),
    payload: req.body,
    headers: req.headers
  }
  
  receivedWebhooks.push(webhook)
  
  console.log('🔔 Webhook received from Payment Hub:')
  console.log('Timestamp:', webhook.timestamp)
  console.log('Payload:', JSON.stringify(req.body, null, 2))
  
  // Update order status based on payment status
  const { paymentRequestCode, status, amount, paidAmount } = req.body
  
  if (paymentRequestCode) {
    orders.set(paymentRequestCode, {
      paymentCode: paymentRequestCode,
      status: status,
      amount: amount,
      paidAmount: paidAmount,
      updatedAt: webhook.timestamp,
      splits: req.body.splits || []
    })
    
    console.log(`📋 Order ${paymentRequestCode} updated: ${status}`)
  }
  
  // Respond with success
  res.status(200).json({
    success: true,
    message: 'Webhook received successfully',
    webhookId: webhook.id
  })
})

// API to get received webhooks (for demo purposes)
app.get('/webhooks', (req, res) => {
  res.json({
    total: receivedWebhooks.length,
    webhooks: receivedWebhooks.slice(-10) // Last 10 webhooks
  })
})

// API to get order status (for demo purposes)
app.get('/orders/:paymentCode', (req, res) => {
  const { paymentCode } = req.params
  const order = orders.get(paymentCode)
  
  if (order) {
    res.json(order)
  } else {
    res.status(404).json({
      error: 'Order not found',
      paymentCode: paymentCode
    })
  }
})

// API to get all orders (for demo purposes)
app.get('/orders', (req, res) => {
  const allOrders = Array.from(orders.values())
  res.json({
    total: allOrders.length,
    orders: allOrders
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhooksReceived: receivedWebhooks.length,
    ordersTracked: orders.size
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Mock Tenant Backend',
    version: '1.0.0',
    description: 'Receives webhooks from Payment Hub for demo purposes',
    endpoints: {
      'POST /webhook': 'Receive payment webhooks from Payment Hub',
      'GET /webhooks': 'List received webhooks',
      'GET /orders': 'List all tracked orders',
      'GET /orders/:paymentCode': 'Get specific order status',
      'GET /health': 'Health check'
    },
    stats: {
      webhooksReceived: receivedWebhooks.length,
      ordersTracked: orders.size,
      uptime: process.uptime()
    }
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  })
})

// Start server
app.listen(PORT, () => {
  console.log('🚀 Mock Tenant Backend started')
  console.log(`📡 Listening on http://localhost:${PORT}`)
  console.log('🔔 Webhook endpoint: POST /webhook')
  console.log('📊 Dashboard: GET /')
  console.log('')
  console.log('Ready to receive Payment Hub webhooks! 🎯')
})