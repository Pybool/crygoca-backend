import mongoose from 'mongoose';
import Accounts from '../models/accounts.model';
import { Wallet } from '../models/wallet.model';

mongoose.connect(
  'mongodb+srv://10111011qweQWE:10111011qweQWE@all4one.fgxnfw3.mongodb.net/?retryWrites=true&w=majority&appName=All4One',
  {
    dbName: 'CRYGOCA-UAT',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 240000, // Set timeout to 4 minutes (240,000 milliseconds)
    serverSelectionTimeoutMS: 240000,
  } as mongoose.ConnectOptions
)
  .then(() => console.log('MongoDB Transaction Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

export async function runTransaction() {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start the transaction

  try {
    // ✅ Pass session in the query options (not inside projection)
    const user = await Accounts.findOne({ username: 'Eko@1011' }).session(session);

    if (!user) {
      throw new Error('User not found');
    }

    user.surname = 'Eko';
    await user.save({ session }); // ✅ Save inside the transaction session

    // ✅ Also pass session correctly in findOneAndUpdate
    const order = await Wallet.findOneAndUpdate(
      { user: user._id },
      { balance: 40000 },
      { session, new: true } // ✅ Correct session placement
    );

    if (order) {
      throw new Error('Wallet not found');
    }

    await session.commitTransaction(); // Commit if successful
    console.log('Transaction committed successfully!');
  } catch (error) {
    await session.abortTransaction(); // Rollback on failure
    console.error('Transaction aborted due to error:', error);
  } finally {
    session.endSession();
  }
}
