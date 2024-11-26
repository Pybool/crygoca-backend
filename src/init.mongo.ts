import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
import { insertLogos, onBoardCryptos } from "./services/v2/onboardCrypto";
// import logger from './logger';
dotenvConfig()

const mongouri:any = process.env.MONGODB_URI
mongoose 
  .connect(mongouri, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions)
  .then(async() => {
    console.log('MongoDB connected Successfully.')
  })
  .catch((err:any) => console.log(err.message))

mongoose.connection.on('connected', async() => {
  console.log('Mongoose connected to db')
  // const result = await onBoardCryptos()
  const result = await insertLogos()
  console.log(result)
})

mongoose.connection.on('error', (err) => {
  console.log(err.message)
})

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose connection is disconnected')
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  process.exit(0)
})
