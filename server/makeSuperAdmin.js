import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

// Load env variables
dotenv.config();

const makeSuperAdmin = async () => {
  // Read arguments from command line
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email) {
    console.log('\n======================================================');
    console.log('Usage Options:');
    console.log('  1. Elevate existing user:');
    console.log('     node makeSuperAdmin.js <email>');
    console.log('  2. Create a new Super Admin (or reset password):');
    console.log('     node makeSuperAdmin.js <email> <password>');
    console.log('======================================================\n');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await connectDB();

    const cleanEmail = email.toLowerCase().trim();
    console.log(`Checking if user with email "${cleanEmail}" exists...`);
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      console.log('User found! Elevating account status...');
      user.role = 'super_admin';
      user.status = 'active';
      
      if (password) {
        console.log('Updating user password...');
        user.password = password; // The model pre-save hook will hash this plain text password automatically
      }
      
      await user.save();
      console.log('\n======================================================');
      console.log('SUCCESS! Existing user elevated.');
      console.log(`User: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      if (password) console.log('Password has been updated successfully.');
      console.log('======================================================\n');
    } else {
      // If user does not exist, we need a password to create one
      if (!password) {
        console.log('\n======================================================');
        console.log('Error: User does not exist in the database.');
        console.log('To create a BRAND NEW Super Admin, please supply a password.');
        console.log('Usage: node makeSuperAdmin.js <email> <password>');
        console.log('======================================================\n');
        process.exit(1);
      }

      console.log('User does not exist. Creating a brand new Super Admin account...');
      user = await User.create({
        name: 'Super Admin',
        email: cleanEmail,
        password: password, // The model pre-save hook will hash this plain text password automatically
        role: 'super_admin',
        status: 'active',
      });

      console.log('\n======================================================');
      console.log('SUCCESS! Brand new Super Admin created.');
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log('======================================================\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\nError running script:', error.message);
    process.exit(1);
  }
};

makeSuperAdmin();
