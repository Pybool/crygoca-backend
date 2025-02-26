import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
import logger from './logger';
import { startCryptoLiveUpdatesWorker } from "../services/v1/tasks/scripts/cryptoLiveUpdates";
import { startExchangeRatesUpdatesWorker } from '../services/v1/tasks/scripts/livecurrencies';
import { processRollbacks } from '../services/v1/wallet/rollback.service';
import { startAutoConfirmationTask } from '../services/v1/jobs/payment-verification/timeoutAutoComplete';
import { startTimeoutAutoCompleteWorker } from '../services/v1/jobs/payment-verification/timeoutAutoCompleteWorker';
dotenvConfig()

const mongouri:any = process.env.CRYGOCA_MONGODB_URI
logger.info("MONGO_URI: "+mongouri)
logger.info("DATABASE NAME "+process.env.CRYGOCA_DATABASE_NAME)

mongoose 
  .connect(mongouri, {
    dbName: process.env.CRYGOCA_DATABASE_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 240000, // Set timeout to 4 minutes (240,000 milliseconds)
    serverSelectionTimeoutMS: 240000, // Optionally ensure server selection timeout matches
  } as mongoose.ConnectOptions)
  .then(async() => {
    logger.info('MongoDB connected Successfully.')
    
    if(process.env.NODE_ENV=='dev' || process.env.NODE_ENV=='prod'){
      // startCryptoLiveUpdatesWorker();
      startExchangeRatesUpdatesWorker();
      startAutoConfirmationTask();
      startTimeoutAutoCompleteWorker();
      
    }
    processRollbacks()
  })
  .catch((err:any) => logger.info(err.message))

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to db')
})

mongoose.connection.on('error', (err) => {
  logger.info(err.message)
})

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose connection is disconnected')
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  process.exit(0)
})
