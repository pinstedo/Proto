const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

let accessToken = '';
let refreshToken = '';

async function signup() {
    console.log('--- Signup ---');
    try {
        const body = {
            name: 'Test Admin',
            phone: '9999999999',
            password: 'password123'
        };
        const res = await axios.post(`${API_URL}/auth/signup`, body);
        console.log('Status:', res.status);
        console.log('Data:', res.data);
        accessToken = res.data.accessToken;
        refreshToken = res.data.refreshToken;
    } catch (err) {
        if (err.response && err.response.data.error === 'Phone number already registered') {
            console.log('User already exists, proceeding to signin...');
            await signin();
        } else {
            console.error('Signup failed:', err.message);
        }
    }
}

async function signin() {
    console.log('--- Signin ---');
    try {
        const body = {
            phone: '9999999999',
            password: 'password123'
        };
        const res = await axios.post(`${API_URL}/auth/signin`, body);
        console.log('Status:', res.status);
        console.log('Data:', res.data);
        accessToken = res.data.accessToken;
        refreshToken = res.data.refreshToken;
    } catch (err) {
        console.error('Signin failed:', err.message);
    }
}

async function accessProtected() {
    console.log('--- Access Protected Route ---');
    try {
        const res = await axios.get(`${API_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        console.log('Status:', res.status);
        console.log('Data:', res.data);
        return res.status;
    } catch (err) {
        console.log('Access failed:', err.response ? err.response.status : err.message);
        return err.response ? err.response.status : 500;
    }
}

async function refreshTokenFunc() {
    console.log('--- Refresh Token ---');
    if (!refreshToken) {
        console.log('No refresh token available');
        return;
    }
    try {
        const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        console.log('Status:', res.status);
        console.log('Data:', res.data);
        accessToken = res.data.accessToken;
        refreshToken = res.data.refreshToken;
    } catch (err) {
        console.log('Refresh failed:', err.response ? err.response.status : err.message);
    }
}

async function run() {
    await signup();
    if (!accessToken) return;

    await accessProtected();

    console.log('\n--- Corrupting Access Token ---');
    accessToken = 'invalid_token';
    const status = await accessProtected();

    if (status === 403 || status === 401) {
        console.log('Access denied as expected. Trying refresh...');
        await refreshTokenFunc();
        // Retry access
        console.log('--- Retrying Access ---');
        await accessProtected();
    }

    console.log('\n--- Corrupting Refresh Token ---');
    refreshToken = 'invalid_refresh_token';
    // Force immediate access token expiration (simulated by corrupting it again)
    accessToken = 'invalid_token';

    await refreshTokenFunc();
    // Should fail
}

run();
