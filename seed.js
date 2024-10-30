const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing
require('dotenv').config();

const uri = process.env.MONGODB_URI; // Your MongoDB connection string
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const sampleUsers = [
  {
    username: 'admin1',
    password: '1123'
  },
  {
    username: 'admin2',
    password: '2123'
  }
];

async function run() {
  try {
    await client.connect();
    const database = client.db('webapp'); // Your database name
    const collection = database.collection('admins'); // Your collection name

    // Hash passwords and prepare users for insertion
    const hashedUsers = await Promise.all(sampleUsers.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10); // Hashing the password
      return { username: user.username, password: hashedPassword }; // Return the user object with the hashed password
    }));

    // Insert the sample users with hashed passwords
    const result = await collection.insertMany(hashedUsers);
    console.log(`${result.insertedCount} users were inserted.`);
  } catch (error) {
    console.error('Error inserting users:', error);
  } finally {
    await client.close();
  }
}

run().catch(console.error);
