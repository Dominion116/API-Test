const express = require('express');
const crypto = require('crypto');

const app = express();

// Middleware to parse JSON and capture raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Your SmileID credentials for signature verification
const PARTNER_ID = '7790';
const API_KEY = 'your-api-key-here'; // Same as your main API key

// Function to verify SmileID signature
function verifySignature(receivedSignature, receivedTimestamp, partnerId, apiKey) {
  const hmac = crypto.createHmac('sha256', apiKey);
  hmac.update(receivedTimestamp);
  hmac.update(partnerId);
  hmac.update('sid_request');
  const generatedSignature = hmac.digest('base64');
  
  return generatedSignature === receivedSignature;
}

// Webhook endpoint to receive SmileID results
app.post('/webhook/smileid', (req, res) => {
  try {
    console.log('\n🔔 SmileID Webhook Received!');
    console.log('📅 Time:', new Date().toISOString());
    
    // Parse the request body
    const body = JSON.parse(req.body);
    
    // Extract headers for signature verification
    const receivedSignature = req.headers['x-signature'] || req.headers['signature'];
    const receivedTimestamp = req.headers['x-timestamp'] || req.headers['timestamp'];
    
    console.log('📨 Headers:', {
      signature: receivedSignature,
      timestamp: receivedTimestamp,
      'content-type': req.headers['content-type']
    });
    
    // Verify signature (optional but recommended for security)
    if (receivedSignature && receivedTimestamp) {
      const isValid = verifySignature(receivedSignature, receivedTimestamp, PARTNER_ID, API_KEY);
      console.log('🔐 Signature Valid:', isValid);
      
      if (!isValid) {
        console.log('❌ Invalid signature - rejecting webhook');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Log the full webhook data
    console.log('📋 Full Webhook Data:');
    console.log(JSON.stringify(body, null, 2));
    
    // Extract key information
    const {
      job_id,
      user_id,
      job_type,
      result_type,
      result_text,
      result_code,
      confidence,
      smile_job_id,
      partner_params,
      timestamp: job_timestamp,
      // Document verification specific fields
      id_type,
      country,
      // Enhanced KYC specific fields
      id_number,
      // Common result fields
      Actions,
      ResultCode,
      ResultText
    } = body;
    
    console.log('\n📊 Key Results:');
    console.log('👤 User ID:', user_id);
    console.log('🆔 Job ID:', job_id);
    console.log('📋 Job Type:', job_type);
    console.log('✅ Result:', result_text || ResultText);
    console.log('🔢 Result Code:', result_code || ResultCode);
    console.log('🎯 Confidence:', confidence);
    console.log('🌍 Country:', country);
    console.log('📄 ID Type:', id_type);
    
    // Process based on result
    if (result_code === '2814' || ResultCode === '2814') {
      console.log('✅ VERIFICATION SUCCESSFUL!');
      
      // Handle successful verification
      handleSuccessfulVerification({
        userId: user_id,
        jobId: job_id,
        idType: id_type,
        country: country,
        confidence: confidence,
        fullResult: body
      });
      
    } else if (result_code === '2815' || ResultCode === '2815') {
      console.log('❌ VERIFICATION FAILED');
      
      // Handle failed verification
      handleFailedVerification({
        userId: user_id,
        jobId: job_id,
        reason: result_text || ResultText,
        fullResult: body
      });
      
    } else {
      console.log('⏳ VERIFICATION PENDING OR OTHER STATUS');
      
      // Handle other statuses
      handleOtherStatus({
        userId: user_id,
        jobId: job_id,
        status: result_text || ResultText,
        code: result_code || ResultCode,
        fullResult: body
      });
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ 
      status: 'received',
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handler functions for different verification outcomes
function handleSuccessfulVerification(data) {
  console.log('\n🎉 Processing successful verification...');
  
  // Add your business logic here:
  // - Update user status in database
  // - Send confirmation email
  // - Enable account features
  // - Log successful verification
  
  // Example: Update user in database
  // await updateUserVerificationStatus(data.userId, 'verified', data);
  
  // Example: Send notification
  // await sendVerificationSuccessEmail(data.userId);
  
  console.log('✅ User verification completed for:', data.userId);
}

function handleFailedVerification(data) {
  console.log('\n❌ Processing failed verification...');
  
  // Add your business logic here:
  // - Update user status to failed
  // - Send retry instructions
  // - Log failure reason
  // - Trigger manual review if needed
  
  // Example: Update user status
  // await updateUserVerificationStatus(data.userId, 'failed', data);
  
  // Example: Send retry notification
  // await sendVerificationFailedEmail(data.userId, data.reason);
  
  console.log('❌ Verification failed for:', data.userId, 'Reason:', data.reason);
}

function handleOtherStatus(data) {
  console.log('\n⏳ Processing other verification status...');
  
  // Handle pending, review, or other statuses
  // - Update user status accordingly
  // - Set up follow-up actions
  // - Notify relevant teams
  
  console.log('ℹ️ Status update for:', data.userId, 'Status:', data.status);
}

// Health check endpoint
app.get('/webhook/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SmileID Webhook Server',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to simulate webhook (for testing)
app.post('/webhook/test', (req, res) => {
  console.log('🧪 Test webhook called');
  console.log('Body:', req.body);
  res.json({ message: 'Test webhook received' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SmileID Webhook Server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/smileid`);
  console.log(`🏥 Health check: http://localhost:${PORT}/webhook/health`);
  console.log('\n💡 For public access, use ngrok: ngrok http 3000');
  console.log('Then use: https://your-ngrok-url.ngrok.io/webhook/smileid');
});

module.exports = app;