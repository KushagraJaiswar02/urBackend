import urBackend from 'urbackend-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const client = urBackend({
    apiKey: 'ub_key_85OMvfRf0NRxtzniKw7gLHzZw1gdtIi01zV0JtK1FKc',
    baseUrl: 'http://localhost:1234'
});

const RUN_ID = Date.now();
const email = `rider_${RUN_ID}@example.com`;
const bikesCol = `bikes_${RUN_ID}`;
const garageCol = `garage_${RUN_ID}`;
const emptyCol = `empty_${RUN_ID}`;

let score = 0;
let total = 0;
let bike1Id, bike2Id, bike3Id, gear1Id;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const pass = (msg) => { score++; total++; console.log(`  ✅ ${msg}`); };
const fail = (msg, got) => { total++; console.log(`  ❌ ${msg}${got !== undefined ? '\n     got: ' + JSON.stringify(got) : ''}`); };
const section = (title) => console.log(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`);
const check = (condition, passMsg, failMsg, got) =>
    condition ? pass(passMsg) : fail(failMsg, got);

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTH
// ─────────────────────────────────────────────────────────────────────────────

section('1. AUTH');

// signup
try {
    const signed = await client.auth.signUp({
        email,
        password: 'ride1234',
        name: 'Rider Test'
    });
    check(!!signed.userId, `Signup success | userId: ${signed.userId}`,
        'Signup failed', signed);
} catch (e) { fail(`Signup threw: ${e.message}`); }

// login
let loginToken;
try {
    const { token } = await client.auth.login({ email, password: 'ride1234' });
    loginToken = token;
    check(!!token, 'Login success | token received', 'Login failed — no token');
} catch (e) { fail(`Login threw: ${e.message}`); }

// wrong password → AuthError
try {
    await client.auth.login({ email, password: 'wrongpass' });
    fail('Wrong password should throw AuthError');
} catch (e) {
    check(e.constructor.name === 'AuthError',
        `Wrong password throws AuthError | status: ${e.statusCode}`,
        `Wrong error type: ${e.constructor.name}`);
}

// me()
try {
    const me = await client.auth.me();
    check(me.email === email,
        `me() returns correct user: ${me.email}`,
        'me() returned wrong user', me);
} catch (e) { fail(`me() threw: ${e.message}`); }

// logout + me() without token → AuthError
try {
    client.auth.logout();
    await client.auth.me();
    fail('me() after logout should throw AuthError');
} catch (e) {
    check(e.constructor.name === 'AuthError',
        'me() after logout throws AuthError correctly',
        `Wrong error after logout: ${e.constructor.name}`);
}

// re-login for rest of tests
await client.auth.login({ email, password: 'ride1234' });

// ─────────────────────────────────────────────────────────────────────────────
// 2. IMPLICIT COLLECTION CREATION
// ─────────────────────────────────────────────────────────────────────────────

section('2. IMPLICIT COLLECTION CREATION (zero dashboard setup)');

// getAll on brand new collection → [] not 404
try {
    const empty = await client.db.getAll(bikesCol);
    check(Array.isArray(empty) && empty.length === 0,
        `getAll on non-existent collection returns [] (no 404)`,
        'Expected empty array', empty);
} catch (e) { fail(`getAll on new collection threw: ${e.message}`); }

// getAll on second brand new collection → []
try {
    const empty2 = await client.db.getAll(emptyCol);
    check(Array.isArray(empty2) && empty2.length === 0,
        'Second fresh collection also returns []',
        'Expected empty array', empty2);
} catch (e) { fail(`getAll on emptyCol threw: ${e.message}`); }

// first insert auto-creates collection
try {
    const bike1 = await client.db.insert(bikesCol, {
        brand: 'Royal Enfield',
        model: 'Meteor 350',
        type: 'cruiser',
        cc: 349,
        color: 'fireball orange',
        available: true
    });
    bike1Id = bike1._id;
    const fields = ['brand', 'model', 'type', 'cc', 'color', 'available'];
    const missing = fields.filter(f => !(f in bike1));
    check(missing.length === 0,
        `Auto-created collection + all 6 fields persisted: ${bike1.brand} ${bike1.model}`,
        `Missing fields after insert: ${missing.join(', ')}`, bike1);
} catch (e) { fail(`First insert threw: ${e.message}`); }

// ─────────────────────────────────────────────────────────────────────────────
// 3. SCHEMA-LESS — DYNAMIC FIELDS
// ─────────────────────────────────────────────────────────────────────────────

section('3. SCHEMA-LESS DYNAMIC FIELDS');

// different field shapes in same collection
try {
    const bike2 = await client.db.insert(bikesCol, {
        brand: 'KTM',
        model: 'Duke 390',
        type: 'naked',
        cc: 373,
        color: 'orange',
        abs: true,
        quickshifter: true,
        topSpeed: 167
    });
    bike2Id = bike2._id;
    check('quickshifter' in bike2 && 'topSpeed' in bike2,
        `Extra fields persisted: quickshifter=${bike2.quickshifter}, topSpeed=${bike2.topSpeed}`,
        'Extra fields were dropped', bike2);
} catch (e) { fail(`Schema-less insert threw: ${e.message}`); }

// boolean field
try {
    const bike3 = await client.db.insert(bikesCol, {
        brand: 'Honda',
        model: 'CB300R',
        type: 'naked',
        cc: 286,
        color: 'pearl smoky gray',
        available: false,
        riderHeight: 'medium'
    });
    bike3Id = bike3._id;
    check(bike3.available === false,
        `Boolean field persisted correctly: available=false`,
        'Boolean field wrong', bike3);
} catch (e) { fail(`Boolean field insert threw: ${e.message}`); }

// number field precision
try {
    const updated = await client.db.update(bikesCol, bike1Id, {
        mileage: 35.4,
        available: false,
        lastService: '2026-01-15'
    });
    check(updated.mileage === 35.4,
        `Float number persisted: mileage=${updated.mileage}`,
        'Float precision lost', updated);
} catch (e) { fail(`Float field update threw: ${e.message}`); }

// array field
try {
    const gear1 = await client.db.insert(garageCol, {
        item: 'Gloves',
        brand: 'Alpinestars',
        price: 3200,
        waterproof: true,
        sizes: ['S', 'M', 'L', 'XL']
    });
    gear1Id = gear1._id;
    check(Array.isArray(gear1.sizes) && gear1.sizes.length === 4,
        `Array field persisted: sizes=${gear1.sizes.join(', ')}`,
        'Array field wrong', gear1);
} catch (e) { fail(`Array field insert threw: ${e.message}`); }

// nested object field
try {
    const gear2 = await client.db.insert(garageCol, {
        item: 'Helmet',
        brand: 'Steelbird',
        price: 4500,
        specs: { weight: 1.2, shell: 'fiberglass', visor: 'clear' }
    });
    check(typeof gear2.specs === 'object' && gear2.specs.shell === 'fiberglass',
        `Nested object persisted: specs.shell=${gear2.specs?.shell}`,
        'Nested object wrong', gear2);
} catch (e) { fail(`Nested object insert threw: ${e.message}`); }

// ─────────────────────────────────────────────────────────────────────────────
// 4. DATABASE CRUD
// ─────────────────────────────────────────────────────────────────────────────

section('4. DATABASE CRUD');

// getAll
try {
    const all = await client.db.getAll(bikesCol);
    check(all.length === 3 && all.every(b => 'brand' in b && 'cc' in b),
        `getAll: ${all.length} bikes, all with custom fields`,
        `getAll issue — count: ${all.length}`, all[0]);
} catch (e) { fail(`getAll threw: ${e.message}`); }

// getOne
try {
    const one = await client.db.getOne(bikesCol, bike1Id);
    check(one.brand === 'Royal Enfield' && one.cc === 349,
        `getOne: ${one.brand} ${one.model} | cc: ${one.cc}`,
        'getOne wrong document', one);
} catch (e) { fail(`getOne threw: ${e.message}`); }

// update existing field
try {
    const updated = await client.db.update(bikesCol, bike1Id, { available: false });
    check(updated.available === false,
        'Update existing field: available=false',
        'Update existing field failed', updated);
} catch (e) { fail(`Update existing field threw: ${e.message}`); }

// update adds new field
try {
    const updated = await client.db.update(bikesCol, bike1Id, {
        grade: 'A',
        inspectedAt: '2026-03-29'
    });
    check('grade' in updated && 'inspectedAt' in updated,
        `Update adds new fields: grade=${updated.grade}`,
        'New fields not added by update', updated);
} catch (e) { fail(`Update new fields threw: ${e.message}`); }

// verify update persisted via getOne
try {
    const verified = await client.db.getOne(bikesCol, bike1Id);
    check(verified.grade === 'A' && verified.available === false,
        `Update verified via getOne: grade=${verified.grade}, available=${verified.available}`,
        'Update not persisted', verified);
} catch (e) { fail(`Verify update threw: ${e.message}`); }

// delete
try {
    const deleted = await client.db.delete(bikesCol, bike3Id);
    check(!!(deleted.message || deleted.deleted),
        `Delete: ${deleted.message || deleted.deleted}`,
        'Delete response unexpected', deleted);
} catch (e) { fail(`Delete threw: ${e.message}`); }

// verify delete — count drops
try {
    const after = await client.db.getAll(bikesCol);
    check(after.length === 2,
        `Post-delete getAll: ${after.length} bikes remaining`,
        `Expected 2 after delete — got ${after.length}`);
} catch (e) { fail(`Post-delete getAll threw: ${e.message}`); }

// ─────────────────────────────────────────────────────────────────────────────
// 5. SECOND IMPLICIT COLLECTION
// ─────────────────────────────────────────────────────────────────────────────

section('5. SECOND IMPLICIT COLLECTION — garage');

try {
    const jacket = await client.db.insert(garageCol, {
        item: 'Jacket',
        brand: 'Rynox',
        price: 8500,
        material: 'mesh',
        armorIncluded: true,
        color: 'black'
    });
    check('armorIncluded' in jacket && jacket.armorIncluded === true,
        `Garage collection auto-created: ${jacket.item} by ${jacket.brand}`,
        'Garage insert failed', jacket);
} catch (e) { fail(`Garage insert threw: ${e.message}`); }

try {
    const allGear = await client.db.getAll(garageCol);
    check(allGear.length === 3,
        `getAll garage: ${allGear.length} items across different field shapes`,
        `Expected 3 — got ${allGear.length}`);
} catch (e) { fail(`Garage getAll threw: ${e.message}`); }

// ─────────────────────────────────────────────────────────────────────────────
// 6. ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────

section('6. ERROR HANDLING');

// NotFoundError on fake ID
try {
    await client.db.getOne(bikesCol, '000000000000000000000000');
    fail('Fake ID should throw NotFoundError');
} catch (e) {
    check(e.constructor.name === 'NotFoundError' && e.statusCode === 404,
        `NotFoundError on fake ID | status: ${e.statusCode}`,
        `Wrong error: ${e.constructor.name}`);
}

// NotFoundError after delete
try {
    await client.db.getOne(bikesCol, bike3Id);
    fail('Deleted ID should throw NotFoundError');
} catch (e) {
    check(e.constructor.name === 'NotFoundError',
        `NotFoundError on deleted document | status: ${e.statusCode}`,
        `Wrong error on deleted doc: ${e.constructor.name}`);
}

// update non-existent document
try {
    await client.db.update(bikesCol, '000000000000000000000000', { brand: 'Ghost' });
    fail('Update on fake ID should throw NotFoundError');
} catch (e) {
    check(e.constructor.name === 'NotFoundError',
        `NotFoundError on update with fake ID`,
        `Wrong error on fake update: ${e.constructor.name}`);
}

// delete non-existent document
try {
    await client.db.delete(bikesCol, '000000000000000000000000');
    fail('Delete on fake ID should throw NotFoundError');
} catch (e) {
    check(e.constructor.name === 'NotFoundError',
        `NotFoundError on delete with fake ID`,
        `Wrong error on fake delete: ${e.constructor.name}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

const failed = total - score;

console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS: ${score}/${total} passed${failed > 0 ? ` | ${failed} failed` : ''}`);
console.log(`${'═'.repeat(60)}`);
console.log(`\n  Run ID   : ${RUN_ID}`);
console.log(`  Bikes    : ${bikesCol}`);
console.log(`  Garage   : ${garageCol}`);
console.log(`  Empty    : ${emptyCol}`);
console.log(`\n  Dashboard: http://localhost:5173`);
console.log(`  → All 3 collections should appear automatically`);
console.log(`  → bikes_* should show 2 records with all fields`);
console.log(`  → garage_* should show 3 records with all fields`);
console.log(`  → empty_* should show 0 Records\n`);

if (failed === 0) {
    console.log('  🎉 All tests passed. SDK is production ready.\n');
} else {
    console.log(`  ⚠️  ${failed} test(s) failed. Check ❌ above.\n`);
    process.exit(1);
}