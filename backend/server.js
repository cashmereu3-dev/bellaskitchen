const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS securely for your custom domains and local development
app.use(cors({
  origin: [
    'https://bellaskitchen.online',
    'https://www.bellaskitchen.online',
    'http://localhost:5173'
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).send("🚀 Bella's Kitchen Twilio API Gateway is active and healthy!");
});

// Main SMS proxy relay endpoint
app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, body, twilioSettings } = req.body;
    
    console.log(`\n--- 📱 OUTGOING SMS ALERT REQUEST ---`);
    console.log(`Recipient: ${to}`);
    console.log(`Message: "${body}"`);

    if (twilioSettings && twilioSettings.twilioSid && twilioSettings.twilioToken && twilioSettings.twilioNumber) {
      console.log(`Routing through live Twilio SID: ${twilioSettings.twilioSid}`);
      
      const auth = Buffer.from(`${twilioSettings.twilioSid}:${twilioSettings.twilioToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', twilioSettings.twilioNumber);
      params.append('Body', body);

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSettings.twilioSid}/Messages.json`;
      
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ SMS Dispatched successfully. Twilio SID: ${data.sid}`);
        return res.status(200).json({ success: true, sid: data.sid });
      } else {
        console.error(`❌ Twilio REST API Error: ${data.message || 'Unknown error'}`);
        return res.status(400).json({ success: false, error: data.message || 'Twilio Gateway Error' });
      }
    }

    console.log(`ℹ️ Twilio credentials not provided. SMS alert is simulated (Mocked Mode).`);
    return res.status(200).json({ success: true, mocked: true });
  } catch (err) {
    console.error(`💥 Gateway server crash error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Bella's Kitchen stand-alone backend is up and running!`);
  console.log(`Listening on secure Port: ${PORT}`);
  console.log(`======================================================\n`);
});
