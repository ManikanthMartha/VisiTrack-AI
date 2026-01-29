// Test Database Connection
// Run with: node test-db-connection.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

console.log('Testing database connection...\n');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('1. Checking DATABASE_URL...');
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set in .env.local');
      process.exit(1);
    }
    console.log('✅ DATABASE_URL is set');
    console.log('   Preview:', process.env.DATABASE_URL.substring(0, 40) + '...\n');

    console.log('2. Testing connection...');
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    console.log('3. Checking for Better Auth tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'session', 'account', 'verification')
      ORDER BY table_name;
    `);

    if (result.rows.length === 0) {
      console.error('❌ No Better Auth tables found!');
      console.error('\nYou need to run the SQL schema in Supabase:');
      console.error('1. Open Supabase SQL Editor');
      console.error('2. Copy backend/supabase_schema.sql');
      console.error('3. Paste and run it');
      client.release();
      process.exit(1);
    }

    console.log('✅ Found tables:');
    result.rows.forEach(row => {
      console.log('   -', row.table_name);
    });

    // Check if all required tables exist
    const requiredTables = ['user', 'session', 'account', 'verification'];
    const foundTables = result.rows.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !foundTables.includes(t));

    if (missingTables.length > 0) {
      console.error('\n❌ Missing tables:', missingTables.join(', '));
      console.error('Run the SQL schema in Supabase to create them.');
      client.release();
      process.exit(1);
    }

    console.log('\n4. Checking table structure...');
    const userColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      ORDER BY ordinal_position;
    `);

    console.log('✅ User table columns:');
    userColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    client.release();
    await pool.end();

    console.log('\n✅ All checks passed! Database is ready.');
    console.log('\nYou can now start your dev server:');
    console.log('  npm run dev');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\nDatabase host not found. Check your DATABASE_URL.');
    } else if (error.code === '28P01') {
      console.error('\nAuthentication failed. Check your database password.');
    } else if (error.code === '3D000') {
      console.error('\nDatabase does not exist.');
    }
    
    console.error('\nTroubleshooting:');
    console.error('1. Check DATABASE_URL in .env.local');
    console.error('2. Verify password is correct');
    console.error('3. Make sure database is running in Supabase');
    
    process.exit(1);
  }
}

testConnection();
