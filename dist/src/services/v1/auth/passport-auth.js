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
const dotenv_1 = require("dotenv");
const passport_1 = __importDefault(require("passport"));
const authentication_social_service_1 = require("./authentication.social.service");
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env.${process.env.NODE_ENV}` });
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// Replace with your credentials
const GOOGLE_CLIENT_ID = process.env.OAUTH2_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.OAUTH2_CLIENT_SECRET;
passport_1.default.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    // callbackURL: `http://localhost:${
    //   process.env.CRYGOCA_MAIN_SERVER_PORT || 8000
    // }/auth/google/callback`,
    callbackURL: `${process.env.CRYGOCA_SERVER_URL}/auth/google/callback`,
    passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    // Save user details to DB or session here
    const user = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        accessToken: accessToken,
        refreshToken: refreshToken,
        referralCode: req.referralCode
    };
    const result = yield authentication_social_service_1.SocialAuthentication.googleAuthentication(user);
    return done(null, profile);
})));
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((obj, done) => {
    done(null, obj);
});
exports.default = passport_1.default;
