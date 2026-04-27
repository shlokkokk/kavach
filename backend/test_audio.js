const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function test() {
  try {
    const formData = new FormData();
    const filePath = path.join(__dirname, '../frontend/public/realistic_ai_scam.mp3');
    
    formData.append('file', fs.createReadStream(filePath), { 
      filename: 'realistic_ai_scam.mp3', 
      contentType: 'audio/mp3' 
    });

    console.log('Sending request to Node backend...');
    const res = await axios.post('http://localhost:4000/api/audio/scan', formData, {
      headers: formData.getHeaders(),
      timeout: 60000,
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log('Error Data:', err.response.data);
    } else {
      console.log('Network Error:', err.message);
    }
  }
}
test();
