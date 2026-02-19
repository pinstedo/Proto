const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const API_URL = 'http://localhost:5000/api';

(async () => {
    try {
        console.log('--- Verifying Overtime Feature ---');

        // 1. Fetch Labours to get a valid ID
        console.log('\nFetching Labours...');
        const laboursRes = await fetch(`${API_URL}/labours?status=active`);
        if (!laboursRes.ok) throw new Error('Failed to fetch labours');
        const labours = await laboursRes.json();

        if (labours.length === 0) {
            console.log('No labours found. Skipping specific tests.');
            return;
        }

        const labour = labours[0];
        console.log(`Using Labour: ${labour.name} (ID: ${labour.id})`);

        const site_id = labour.site_id || 1; // Fallback
        const today = new Date().toISOString().split('T')[0];

        // 2. Add Overtime
        console.log('\nAdding Overtime Record...');
        const addRes = await fetch(`${API_URL}/overtime`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                labour_id: labour.id,
                site_id: site_id,
                date: today,
                hours: 2.5,
                amount: (labour.rate || 100) * 2.5,
                notes: 'Test Overtime',
                created_by: 1
            })
        });

        console.log(`Add response status: ${addRes.status}`);
        if (!addRes.ok) {
            const text = await addRes.text();
            throw new Error(`Failed to add overtime: ${addRes.status} ${text}`);
        }
        const addData = await addRes.json();
        console.log('Overtime added/updated:', addRes.status, addData);

        // 3. Fetch Overtime
        console.log(`\nFetching Overtime for date ${today}...`);
        const getRes = await fetch(`${API_URL}/overtime?date=${today}`);
        const getRecords = await getRes.json();
        console.log('Records found:', getRecords.length);

        const record = getRecords.find(r => r.labour_id === labour.id);
        if (record) {
            console.log('Verification Success: Record found matching labour ID.');
            console.log('Hours:', record.hours, 'Amount:', record.amount);
        } else {
            console.error('Verification Failed: Record not found.');
        }

    } catch (err) {
        console.error('Verification Error:', err);
    }
})();
