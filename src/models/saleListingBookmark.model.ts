import mongoose from "mongoose";
const Schema = mongoose.Schema;

const CryptoListingBookmarksSchema = new Schema({
  account: {
    type: String,
    required: true,
  },
  cryptoListing: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
});

const CryptoListingBookmarks = mongoose.model("cryptolistingbookmarks", CryptoListingBookmarksSchema);
export default CryptoListingBookmarks;
