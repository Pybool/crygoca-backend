import { config as dotenvConfig } from "dotenv";
import passport from "passport";
import { SocialAuthentication } from "./authentication.social.service";

dotenvConfig();
dotenvConfig({ path: `.env.${process.env.NODE_ENV}` });

const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Replace with your credentials
const GOOGLE_CLIENT_ID = process.env.OAUTH2_CLIENT_ID! as string;
const GOOGLE_CLIENT_SECRET = process.env.OAUTH2_CLIENT_SECRET! as string;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      // callbackURL: `http://localhost:${
      //   process.env.CRYGOCA_MAIN_SERVER_PORT || 8000
      // }/auth/google/callback`,
      callbackURL: `${process.env.CRYGOCA_SERVER_URL}/auth/google/callback`,
      passReqToCallback: true,
    },
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: (arg0: null, arg1: any) => any
    ) => {
      // Save user details to DB or session here
      const user = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
      const result = await SocialAuthentication.googleAuthentication(user);
      return done(null, profile);
    }
  )
);

passport.serializeUser((user: any, done: (arg0: null, arg1: any) => void) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done: (arg0: null, arg1: any) => void) => {
  done(null, obj);
});

export default passport;
