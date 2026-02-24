const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { openDb } = require('./database');
const request = require('http').request;

const PORT = 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';

async function testPutProfile() {
    try {
        const db = await openDb();
        const user = await db.get("SELECT * FROM users LIMIT 1");
        if (!user) {
            console.log("No users found to test with.");
            return;
        }

        console.log("Testing with user:", user.name, user.role);

        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            SECRET_KEY,
            { expiresIn: '15m' }
        );

        const testData = JSON.stringify({
            name: `${user.name} Edited`,
            profile_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        });

        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api/auth/profile',
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(testData)
            }
        };

        const req = request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    console.log("BODY:", JSON.parse(rawData));
                } catch (e) {
                    console.log("BODY (raw):", rawData);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        req.write(testData);
        req.end();

    } catch (err) {
        console.error("Test failed:", err);
    }
}

testPutProfile();
