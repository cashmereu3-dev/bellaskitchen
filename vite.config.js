import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/send-sms' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              try {
                const { to, body: text, twilioSettings } = JSON.parse(body);
                console.log(`[SMS API] Sending SMS text to ${to}: ${text}`);
                
                if (twilioSettings && twilioSettings.twilioSid && twilioSettings.twilioToken && twilioSettings.twilioNumber) {
                  const auth = Buffer.from(`${twilioSettings.twilioSid}:${twilioSettings.twilioToken}`).toString('base64');
                  const params = new URLSearchParams();
                  params.append('To', to);
                  params.append('From', twilioSettings.twilioNumber);
                  params.append('Body', text);
                  
                  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSettings.twilioSid}/Messages.json`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Basic ${auth}`,
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params.toString()
                  });
                  
                  const data = await response.json();
                  if (response.ok) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, sid: data.sid }));
                    return;
                  } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: data.message || 'Twilio Gateway Error' }));
                    return;
                  }
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, mocked: true }));
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
