const http = require('http');

console.log('Starting verification...');

const postData = JSON.stringify({
    labour_id: 1, // Assuming ID 1 exists
    site_id: 1,
    date: '2026-02-10',
    hours: 4,
    amount: 400,
    notes: 'Simple Verify',
    created_by: 1
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/overtime',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
