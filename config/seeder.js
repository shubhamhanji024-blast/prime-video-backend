const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

const seedData = async () => {
  try {
    // Check if users already exist
    const userCount = await User.countDocuments({});
    if (userCount > 0) {
      console.log('Database already seeded. Skipping seeder.');
      return;
    }

    console.log('Seeding initial test users and subscriptions...');

    // 1. Create hashed passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 2. Create Users
    const alice = await User.create({
      name: 'Alice (No Subscription)',
      email: 'alice@prime.com',
      password: hashedPassword,
    });

    const bob = await User.create({
      name: 'Bob (Active Mini Plan)',
      email: 'bob@prime.com',
      password: hashedPassword,
    });

    const charlie = await User.create({
      name: 'Charlie (Expired Family Plan)',
      email: 'charlie@prime.com',
      password: hashedPassword,
    });

    // 3. Create Subscription for Bob (Active Mini Plan)
    await Subscription.create({
      userId: bob._id,
      planName: 'Mini',
      cost: 2.99,
      streamingQuality: 'SD (480p)',
      maxDevices: 1,
      validityDays: 30,
      watchlistLimit: 5,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'Active',
    });

    // 4. Create Subscription for Charlie (Expired Family Plan)
    await Subscription.create({
      userId: charlie._id,
      planName: 'Family',
      cost: 7.99,
      streamingQuality: 'Full HD (1080p)',
      maxDevices: 4,
      validityDays: 30,
      watchlistLimit: 15,
      expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 1 day ago
      status: 'Expired',
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
  }
};

module.exports = seedData;
