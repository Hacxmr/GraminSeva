// Quick test script for backend API
const http = require('http');

const testEndpoints = [
  { path: '/health', method: 'GET' },
  { path: '/api/calls', method: 'GET' },
  { 
    path: '/api/voice', 
    method: 'POST',
    body: JSON.stringify({
      message: 'Mere bacche ko bukhar hai',
      phoneNumber: '+919876543210'
    })
  }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`✅ ${endpoint.method} ${endpoint.path} - Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('   Response:', JSON.stringify(json, null, 2).substring(0, 200));
        } catch (e) {
          console.log('   Response:', data.substring(0, 200));
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
      console.error('   Full error:', error);
      reject(error);
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing GraminSeva Backend API...\n');
  
  for (const endpoint of testEndpoints) {
    try {
      await testEndpoint(endpoint);
    } catch (error) {
      // Continue with next test
    }
    console.log('');
  }
  
  console.log('✨ Tests complete!\n');
}

runTests();
