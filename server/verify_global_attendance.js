const API_URL = 'http://localhost:5002';

async function testGlobalAttendance() {
    try {
        console.log(`Fetching global attendance...`);

        const response = await fetch(`${API_URL}/api/attendance?date=${new Date().toISOString().split('T')[0]}`);

        if (response.ok) {
            const data = await response.json();
            console.log('PASS: Data received:', Array.isArray(data) ? `Array[${data.length}]` : typeof data);
        } else {
            console.log(`FAIL: Status ${response.status}`);
            const text = await response.text();
            // detailed error
            console.log('Error Body Preview:', text.substring(0, 500));
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

testGlobalAttendance();
