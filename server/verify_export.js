const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const CREDENTIALS = { email: 'admin@demo.com', password: 'Admin123' };

async function verify() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CREDENTIALS)
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('   Login successful. Token received.');

        const headers = { Authorization: `Bearer ${token}` };

        const formats = ['json', 'csv', 'xlsx', 'pdf', 'docx'];

        for (const format of formats) {
            console.log(`\n2. Testing Export Format: ${format.toUpperCase()}...`);
            try {
                const res = await fetch(`${BASE_URL}/admin/questions/export?format=${format}`, { headers });

                console.log(`   Status: ${res.status}`);
                console.log(`   Content-Type: ${res.headers.get('content-type')}`);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`   ❌ Server Error (${res.status}):`, errorText);
                    continue;
                }

                const buffer = await res.arrayBuffer();
                console.log(`   Size: ${buffer.byteLength} bytes`);

                if (buffer.byteLength > 0) {
                    console.log(`   ✅ ${format.toUpperCase()} Export Verified.`);
                    fs.writeFileSync(`sample_export.${format}`, Buffer.from(buffer));
                } else {
                    console.error(`   ❌ ${format.toUpperCase()} Export Empty!`);
                }
            } catch (err) {
                console.error(`   ❌ Failed to export ${format}:`, err.message);
            }
        }

        console.log('\n3. Testing Subject Filtering (Export CSV for Subject 1)...');
        try {
            const res = await fetch(`${BASE_URL}/admin/questions/export?format=csv&subjectId=1`, { headers });
            const text = await res.text();
            console.log(`   Size: ${text.length} bytes`);

            if (text.includes('English') || text.includes('Mathematics')) {
                console.log(`   ✅ Filtered Export Verified (Content check passed).`);
            } else {
                console.log(`   ⚠️ Filtered Export Content Warning: Could not verify specific subject content.`);
            }
        } catch (err) {
            console.error(`   ❌ Failed to export filtered CSV:`, err.message);
        }

        console.log('\n4. Testing Question Move (Create -> Verify -> Move -> Verify)...');
        try {
            // 1. Create Question in Subject 1
            const qData = {
                text: 'E2E_TEST_QUESTION_' + Date.now(),
                options: ['A', 'B', 'C', 'D'],
                correctOption: 0,
                difficulty: 'easy',
                SubjectId: 1
            };
            const createRes = await fetch(`${BASE_URL}/admin/questions`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(qData)
            });
            const q = await createRes.json();
            console.log(`   Created Question ID: ${q.id} in Subject 1`);

            // 2. Verify in Subject 1 Export
            const res1 = await fetch(`${BASE_URL}/admin/questions/export?format=json&subjectId=1`, { headers });
            const data1 = await res1.json();
            if (data1.find(i => i.id === q.id)) {
                console.log(`   ✅ Question found in Subject 1 Export.`);
            } else {
                console.error(`   ❌ Question NOT found in Subject 1 Export!`);
            }

            // 3. Move to Subject 2
            await fetch(`${BASE_URL}/admin/questions/${q.id}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ SubjectId: 2 })
            });
            console.log(`   Moved Question to Subject 2`);

            // 4. Verify in Subject 2 Export
            const res2 = await fetch(`${BASE_URL}/admin/questions/export?format=json&subjectId=2`, { headers });
            const data2 = await res2.json();
            if (data2.find(i => i.id === q.id)) {
                console.log(`   ✅ Question found in Subject 2 Export.`);
            } else {
                console.error(`   ❌ Question NOT found in Subject 2 Export!`);
            }

            // 5. Verify NOT in Subject 1 Export
            const res1b = await fetch(`${BASE_URL}/admin/questions/export?format=json&subjectId=1`, { headers });
            const data1b = await res1b.json();
            if (!data1b.find(i => i.id === q.id)) {
                console.log(`   ✅ Question correctly REMOVED from Subject 1 Export.`);
            } else {
                console.error(`   ❌ Question STILL found in Subject 1 Export!`);
            }

        } catch (err) {
            console.error(`   ❌ Failed E2E Move Test:`, err.message);
        }

        console.log('\nVerification Complete.');

    } catch (err) {
        console.error('Verification Failed:', err.message);
        if (err.cause && err.cause.code === 'ECONNREFUSED') {
            console.error('Server is not running. Please start the server first.');
        }
    }
}

verify();
