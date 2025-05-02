"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const accounts_model_1 = __importDefault(require("../models/accounts.model"));
const wallet_model_1 = require("../models/wallet.model");
mongoose_1.default.connect('mongodb+srv://10111011qweQWE:10111011qweQWE@all4one.fgxnfw3.mongodb.net/?retryWrites=true&w=majority&appName=All4One', {
    dbName: 'CRYGOCA-UAT',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 240000, // Set timeout to 4 minutes (240,000 milliseconds)
    serverSelectionTimeoutMS: 240000,
})
    .then(() => console.log('MongoDB Transaction Connected'))
    .catch((err) => console.error('MongoDB Connection Error:', err));
function runTransaction() {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
        try {
            // ✅ Pass session in the query options (not inside projection)
            const user = yield accounts_model_1.default.findOne({ username: 'Eko@1011' }).session(session);
            if (!user) {
                throw new Error('User not found');
            }
            user.surname = 'Eko';
            yield user.save({ session }); // ✅ Save inside the transaction session
            // ✅ Also pass session correctly in findOneAndUpdate
            const order = yield wallet_model_1.Wallet.findOneAndUpdate({ user: user._id }, { balance: 40000 }, { session, new: true } // ✅ Correct session placement
            );
            if (order) {
                throw new Error('Wallet not found');
            }
            yield session.commitTransaction(); // Commit if successful
            console.log('Transaction committed successfully!');
        }
        catch (error) {
            yield session.abortTransaction(); // Rollback on failure
            console.error('Transaction aborted due to error:', error);
        }
        finally {
            session.endSession();
        }
    });
}
exports.runTransaction = runTransaction;
