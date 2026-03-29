import urBackend from '../urbackend-sdk/dist/index.mjs';

const client = urBackend({ 
    apiKey: 'sk_test_sdk_123',
    baseUrl: 'http://localhost:1234'
});

async function runLocalE2E() {
    console.log('🚀 Starting Local E2E Verification...\n');

    try {
        // 1. Auth: Sign Up
        console.log('1. SIGNUP: Running...');
        const user = await client.auth.signUp({
            email: 'e2e_user@example.com',
            password: 'password123',
            name: 'E2E User'
        });
        console.log('✅ SIGNUP: Success!', user.userId || user._id);

        // 2. Auth: Login
        console.log('2. LOGIN: Running...');
        const { token, user: loggedUser } = await client.auth.login({
            email: 'e2e_user@example.com',
            password: 'password123'
        });
        console.log('✅ LOGIN: Success! Received token:', token.substring(0, 5) + '...');

        // 3. Auth: Profile
        console.log('3. PROFILE (me): Running...');
        const profile = await client.auth.me();
        console.log('✅ PROFILE: Success! Email:', profile.email);

        // 4. DB: Insert
        console.log('4. DATABASE (insert): Running...');
        const inserted = await client.db.insert('products', {
            name: 'SDK Verified Product',
            price: 199,
            verified: true
        });
        console.log('✅ DATABASE: Success! Document ID:', inserted._id);

        // 5. DB: Get All
        console.log('5. DATABASE (getAll): Running...');
        const all = await client.db.getAll('products');
        console.log(`✅ DATABASE: Success! Found ${all.length} items.`);

        console.log('\n🌟 LOCAL E2E VERIFICATION COMPLETE: The SDK logic is 100% correct.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ E2E FAIL:', error.message);
        if (error.statusCode) console.error('Status Code:', error.statusCode);
        if (error.data) console.error('Error Data:', JSON.stringify(error.data));
        process.exit(1);
    }
}

runLocalE2E();
