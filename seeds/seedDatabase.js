const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Note = require('../models/Note');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-tenant-notes';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Note.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});

    // Create tenants
    console.log('Creating tenants...');
    const acmeTenant = await Tenant.create({
      name: 'Acme Corporation',
      slug: 'acme',
      subscription: 'FREE'
    });

    const globexTenant = await Tenant.create({
      name: 'Globex Corporation',
      slug: 'globex',
      subscription: 'FREE'
    });

    console.log('Tenants created successfully');

    // Create users
    console.log('Creating users...');
    
    // Hash the default password
    const hashedPassword = await bcrypt.hash('password', 12);

    const users = [
      {
        email: 'admin@acme.test',
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: acmeTenant._id
      },
      {
        email: 'user@acme.test',
        password: hashedPassword,
        role: 'MEMBER',
        tenantId: acmeTenant._id
      },
      {
        email: 'admin@globex.test',
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: globexTenant._id
      },
      {
        email: 'user@globex.test',
        password: hashedPassword,
        role: 'MEMBER',
        tenantId: globexTenant._id
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Users created successfully');

    // Create sample notes
    console.log('Creating sample notes...');
    
    const acmeAdmin = createdUsers.find(u => u.email === 'admin@acme.test');
    const acmeUser = createdUsers.find(u => u.email === 'user@acme.test');
    const globexAdmin = createdUsers.find(u => u.email === 'admin@globex.test');
    const globexUser = createdUsers.find(u => u.email === 'user@globex.test');

    const sampleNotes = [
      // Acme notes
      {
        title: 'Welcome to Acme Notes',
        content: 'This is your first note in the Acme tenant. You can create, edit, and delete notes here.',
        userId: acmeAdmin._id,
        tenantId: acmeTenant._id
      },
      {
        title: 'Team Meeting Notes',
        content: 'Discussion about Q4 goals and project timelines. Remember to follow up on action items.',
        userId: acmeUser._id,
        tenantId: acmeTenant._id
      },
      
      // Globex notes
      {
        title: 'Globex Project Overview',
        content: 'Initial planning for the new product launch. Market research indicates strong demand.',
        userId: globexAdmin._id,
        tenantId: globexTenant._id
      },
      {
        title: 'Daily Standup Notes',
        content: 'Progress on current sprint. All tasks on track for completion by Friday.',
        userId: globexUser._id,
        tenantId: globexTenant._id
      }
    ];

    await Note.insertMany(sampleNotes);
    console.log('Sample notes created successfully');

    console.log('\\n=== Database Seeding Complete ===');
    console.log('\\nTest Accounts Created:');
    console.log('1. admin@acme.test (Admin, Acme tenant) - password: password');
    console.log('2. user@acme.test (Member, Acme tenant) - password: password');
    console.log('3. admin@globex.test (Admin, Globex tenant) - password: password');
    console.log('4. user@globex.test (Member, Globex tenant) - password: password');
    console.log('\\nTenants Created:');
    console.log(`- Acme: ${acmeTenant._id} (FREE plan)`);
    console.log(`- Globex: ${globexTenant._id} (FREE plan)`);
    console.log('\\nSample notes created for each tenant to demonstrate isolation.');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\\nDatabase connection closed.');
    process.exit(0);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;