const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testAdvances() {
    try {
        console.log('--- Testing Advances API ---');

        // 1. Create a dummy labour
        console.log('Creating dummy labour...');
        const labourRes = await fetch(`${API_URL}/labours`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Labour Advance',
                phone: '9998887776',
                rate: 500,
                trade: 'Helper'
            })
        });

        if (!labourRes.ok) {
            throw new Error(`Failed to create labour: ${labourRes.statusText}`);
        }

        const labour = await labourRes.json();
        console.log('Labour created:', labour.id);

        // 2. Add Advance
        console.log('Adding advance...');
        const advanceRes = await fetch(`${API_URL}/labours/${labour.id}/advance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 1000,
                date: new Date().toISOString(),
                notes: 'Test advance',
                created_by: 1 // Assuming admin id 1 exists
            })
        });

        if (!advanceRes.ok) {
            const err = await advanceRes.json();
            throw new Error(`Failed to add advance: ${err.error}`);
        }

        const advance = await advanceRes.json();
        console.log('Advance added:', advance);

        // 3. Get Advances
        console.log('Fetching advances...');
        const getRes = await fetch(`${API_URL}/labours/${labour.id}/advances`);

        if (!getRes.ok) {
            throw new Error(`Failed to get advances: ${getRes.statusText}`);
        }

        const advances = await getRes.json();
        console.log('Advances fetched:', advances.length);

        if (advances.length > 0 && advances[0].amount === 1000) {
            console.log('SUCCESS: Advance verification passed!');
        } else {
            console.error('FAILURE: Advance data mismatch');
        }

        // Cleanup (optional, but good for tests)
        // await fetch(`${API_URL}/labours/${labour.id}`, { method: 'DELETE' });

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAdvances();
