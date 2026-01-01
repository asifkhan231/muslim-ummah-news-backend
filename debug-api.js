const axios = require('axios');

async function testApi() {
    try {
        console.log('Fetching from http://127.0.0.1:5000/api/articles...');
        const response = await axios.get('http://127.0.0.1:5000/api/articles');
        console.log('Status:', response.status);
        console.log('Data keys:', Object.keys(response.data));
        console.log('Articles count:', response.data.articles ? response.data.articles.length : 'N/A');
        if (response.data.articles && response.data.articles.length > 0) {
            console.log('First article sample:', JSON.stringify(response.data.articles[0], null, 2));
        } else {
            console.log('No articles found in response.');
        }
    } catch (error) {
        console.error('Error fetching API:', error.message);
        if (error.response) {
            console.log('Response data:', error.response.data);
        }
    }
}

testApi();
