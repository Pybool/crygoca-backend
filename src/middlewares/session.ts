import session from 'express-session';
import app from '../bootstrap/_app';

export const sessionMiddleware = session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set `secure: true` if using HTTPS
});

// Use this session middleware in Express
app.use(sessionMiddleware);
