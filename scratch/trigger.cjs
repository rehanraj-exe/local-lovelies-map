const http = require('https');

const data = JSON.stringify({ query: 'books' });

const options = {
  hostname: 'qmbarjeuypknukennyhv.supabase.co',
  path: '/functions/v1/smart-search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer sb_publishable_iqaHeZAg7SUKvOjLnfFI4w_pG4bhRyW',
    'apikey': 'sb_publishable_iqaHeZAg7SUKvOjLnfFI4w_pG4bhRyW'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Response status:', res.statusCode, 'Body:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
