// Test script for session report API
// Node 18+ has native fetch, no import needed

const API_URL = 'https://interview-app-indol.vercel.app/api/interviews/session-report';
// const API_URL = 'http://localhost:3000/api/interviews/session-report'; // For local testing

const mockSessionReport = {
  roomName: "interview_user_33UbtypqpStJIx424rw9ZNwSM2A_test123",
  sessionReport: {
    room_name: "interview_user_33UbtypqpStJIx424rw9ZNwSM2A_test123",
    history: {
      items: [
        {
          id: "item_1",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Good morning. What is the purpose of your visit to the United States?",
            }
          ]
        },
        {
          id: "item_2",
          type: "message",
          role: "user",
          content: [
            {
              type: "transcript",
              text: "I am going to study at MIT for my master's degree in computer science.",
              transcript: "I am going to study at MIT for my master's degree in computer science.",
              start_time: 5.2,
              end_time: 8.7
            }
          ]
        },
        {
          id: "item_3",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "I see. Who is sponsoring your education?",
            }
          ]
        },
        {
          id: "item_4",
          type: "message",
          role: "user",
          content: [
            {
              type: "transcript",
              text: "My parents are sponsoring me. My father works as an engineer.",
              transcript: "My parents are sponsoring me. My father works as an engineer.",
              start_time: 12.1,
              end_time: 15.3
            }
          ]
        }
      ]
    },
    timestamp: new Date().toISOString()
  }
};

async function testSessionReport() {
  console.log('📤 Testing session report API...');
  console.log('🔗 URL:', API_URL);
  console.log('📦 Payload:', JSON.stringify(mockSessionReport, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockSessionReport),
    });

    console.log('📥 Response Status:', response.status, response.statusText);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers));
    
    const data = await response.text();
    console.log('📥 Response Body:', data);

    if (response.ok) {
      console.log('\n✅ SUCCESS! API is working correctly.');
      try {
        const json = JSON.parse(data);
        console.log('📊 Parsed response:', json);
      } catch (e) {
        console.log('⚠️ Response is not JSON');
      }
    } else {
      console.log('\n❌ FAILED! API returned error status.');
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

// Also test OPTIONS (preflight)
async function testOptions() {
  console.log('\n' + '='.repeat(80));
  console.log('📤 Testing OPTIONS (CORS preflight)...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'OPTIONS',
    });

    console.log('📥 OPTIONS Response Status:', response.status);
    console.log('📥 CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    });
  } catch (error) {
    console.error('❌ OPTIONS ERROR:', error.message);
  }
}

// Run tests
console.log('🧪 Starting API Tests\n');
await testOptions();
await testSessionReport();
console.log('\n✅ Tests complete!');

