const http = require('http');

console.log('Testing /api/sites...');
const start = Date.now();

http.get('http://localhost:5000/api/sites', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Time taken:', Date.now() - start, 'ms');
        console.log('Body length:', data.length);
        console.log('Body:', data.substring(0, 100));
    });
}).on('error', (err) => {
    console.log('Error:', err.message);
    console.log('Time taken:', Date.now() - start, 'ms');
});
