// Test script to verify Clerk webhook integration
// Run this with: node test-webhook.js

const https = require('https');
const crypto = require('crypto');

// Your webhook endpoint URL
const WEBHOOK_URL = 'https://your-domain.com/api/webhooks/clerk'; // Replace with your actual domain
const WEBHOOK_SECRET = 'whsec_/RXF2DJrUv+aSfW4e+H2e9C83aCgHunM'; // Your webhook secret from .env.local

// Mock user data
const mockUserData = {
  type: 'user.created',
  data: {
    id: 'user_test_123',
    email_addresses: [
      {
        email_address: 'test@example.com'
      }
    ],
    first_name: 'Test',
    last_name: 'User',
    image_url: 'https://example.com/avatar.jpg'
  }
};

// Create svix signature (simplified version)
function createSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');
  
  return {
    timestamp: timestamp.toString(),
    signature: `v1,${signature}`
  };
}

// Test the webhook
function testWebhook() {
  const payload = JSON.stringify(mockUserData);
  const signatureData = createSignature(mockUserData, WEBHOOK_SECRET);
  
  const options = {
    hostname: 'your-domain.com', // Replace with your actual domain
    port: 443,
    path: '/api/webhooks/clerk',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'svix-id': 'msg_test_123',
      'svix-timestamp': signatureData.timestamp,
      'svix-signature': signatureData.signature
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      if (res.statusCode === 200) {
        console.log('✅ Webhook test successful!');
      } else {
        console.log('❌ Webhook test failed!');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error testing webhook:', error.message);
  });

  req.write(payload);
  req.end();
}

console.log('🧪 Testing Clerk webhook integration...');
console.log('⚠️  Make sure to replace the domain in this script with your actual domain');
console.log('⚠️  Make sure your webhook endpoint is deployed and accessible');
console.log('');

testWebhook();
