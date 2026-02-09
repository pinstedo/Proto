const http = require('http');

const endpoints = [
    '/',
    '/api/debug-ping',
    '/api/sites/debug-test',
    '/api/sites'
];

async function testEndpoint(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:5000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`Endpoint: ${path}`);
                console.log('Status Code:', res.statusCode);
                console.log('Body:', data.substring(0, 50));
                console.log('---');
                resolve();
            });
        }).on('error', (err) => {
            console.log(`Endpoint: ${path}`);
            console.log('Error:', err.message);
            console.log('---');
            resolve();
        });
    });
}

async function runTests() {
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
    }
}

runTests();
