const fs = require('fs');

async function uploadData() {
    console.log('Reading 98_new_mengenal_prodi.json...');
    const data = JSON.parse(fs.readFileSync('98_new_mengenal_prodi.json', 'utf8'));
    
    console.log(`Sending ${data.length} records to Cloudflare D1...`);
    
    try {
        const fetch = (await import('node-fetch')).default; // If available, but we can just use global fetch in Node 18+
    } catch (e) {
        // ignore
    }

    try {
        const response = await fetch('https://konselingsmandak.info/api/sync?table=star_mengenalProdi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Upload Success!', result);
        } else {
            console.error('Upload Failed!', response.status, response.statusText);
            const text = await response.text();
            console.error(text);
        }
    } catch (err) {
        console.error('Error during fetch:', err);
    }
}

uploadData();
