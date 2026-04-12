import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testMongo = async () => {
  const uri = process.env.MONGO_URI;
  console.log('Testing connection to:', uri.replace(/:([^:@]{3,})@/, ':***@')); // Hide password
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log('✅✅✅ MONGODB SUCCESSFULLY CONNECTED! ✅✅✅');
    process.exit(0);
  } catch (error) {
    console.error('❌ MONGODB CONNECTION FAILED:');
    console.error(error.message);
    if (error.name === 'MongoServerError') {
      console.error('Code:', error.code);
      console.error('CodeName:', error.codeName);
    }
    process.exit(1);
  }
};

testMongo();
