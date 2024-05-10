import mongoose from 'mongoose';
import { config as dotenvConfig } from 'dotenv';
// import logger from './logger';
dotenvConfig()
// const uri = `mongodb+srv://ekoemmanueljavl:${process.env.MONGODB_PASSWORD}@cluster0.n8o8vva.mongodb.net/?retryWrites=true&w=majority`;

const mongouri:any = `mongodb+srv://10111011qweQWE:10111011qweQWE@all4one.fgxnfw3.mongodb.net/?retryWrites=true&w=majority&appName=All4One` || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
console.log(process.env.DB_NAME, mongouri)
mongoose 
  .connect(mongouri, {
    dbName: 'CRYGOCA',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions)
  .then(() => {
    console.log('MongoDB connected Successfully.')
  })
  .catch((err) => console.log(err.message))

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to db')
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
