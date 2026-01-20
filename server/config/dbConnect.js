import mongoose from 'mongoose';

const dbConnect = async () => {
  const mongoUrl = process.env.MONGO_URI;
  try {
    const connect = await mongoose.connect(mongoUrl);
    console.log('MongoDb Connected', connect.connection.host);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default dbConnect;
