// Quick test script to simulate an Exotel call
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:5001';

async function testExotelWebhook() {
  console.log('🧪 Testing Exotel Webhook Simulation...\n');

  try {
    // Simulate an incoming call from Exotel
    console.log('📞 Simulating incoming call to 09513885656...');
    const response = await fetch(`${BACKEND_URL}/exotel/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: '+919876543210',
        To: '09513885656',
        SpeechResult: 'Mujhe bukhar aur sir dard hai, kya karoon?'
      })
    });

    const contentType = response.headers.get('content-type');
    console.log('✅ Response Status:', response.status);
    console.log('📄 Content-Type:', contentType);

    if (contentType && contentType.includes('xml')) {
      const xmlResponse = await response.text();
      console.log('\n🎯 Exotel XML Response:');
      console.log(xmlResponse);
    } else {
      const jsonResponse = await response.json();
      console.log('\n📦 JSON Response:', JSON.stringify(jsonResponse, null, 2));
    }

    // Check if call was logged
    console.log('\n📊 Checking call logs...');
    const logsResponse = await fetch(`${BACKEND_URL}/api/calls`);
    const logs = await logsResponse.json();
    console.log('✅ Total calls logged:', logs.length);
    if (logs.length > 0) {
      console.log('📝 Most recent call:');
      console.log('   Phone:', logs[0].user_phone_number);
      console.log('   Transcript:', logs[0].user_transcript?.substring(0, 50) + '...');
      console.log('   Critical:', logs[0].is_critical ? '⚠️ YES' : '✅ NO');
    }

    // Check dashboard stats
    console.log('\n📈 Checking dashboard stats...');
    const statsResponse = await fetch(`${BACKEND_URL}/api/stats`);
    const stats = await statsResponse.json();
    console.log('✅ Total Calls:', stats.totalCalls);
    console.log('⚠️  Critical Calls:', stats.criticalCalls);
    console.log('👥 Unique Users:', stats.uniqueUsers);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  GraminSeva - Exotel Call Flow Test');
console.log('═══════════════════════════════════════════════════════\n');

testExotelWebhook();
