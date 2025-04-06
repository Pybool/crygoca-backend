import jwthelper from "../../../helpers/jwt_helper";
import Accounts from "../../../models/accounts.model";
import { generateReferralCode } from "../helpers";
import { WalletService } from "../wallet/wallet.service";
import { Authentication } from "./auth.service";

interface IGoogleUser {
  email: string;
  firstname:string;
  lastname: string;
  fullname: string;
  avatar: string;
  googleId: string;
  createdAt?: Date;
  lastLogin?: Date;
}

async function generateRandomUserName(googleUser: any): Promise<string | null> {
  let username: string | null = null;
  let isUnique = false;

  while (!isUnique) {
    const shortTimestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
    let baseName = `${googleUser.firstname}${googleUser.lastname}`.toLowerCase();

    // Trim baseName to ensure total length does not exceed 10 characters
    baseName = baseName.slice(0, 10 - shortTimestamp.length);
    username = `${baseName}${shortTimestamp}`;

    // Check if username exists in MongoDB
    const existingUser = await Accounts.findOne({ username });

    if (!existingUser) {
      isUnique = true;
    }
  }

  return username;
}

export class SocialAuthentication {
  public static async googleAuthentication(req:any) {
    try {
      let firstTimeSignup = false
      const googleUser = req.gAccount;
      const referralCode = req.referralCode;
      console.log("googleUser ", googleUser,referralCode)
      if (!googleUser.googleId) {
        return {
          status: false,
          message: "Invalid google authentication profile",
        };
      }
      let user:any = await Accounts.findOne({
        $or: [
          { googleId: googleUser.googleId },
          { email: googleUser.email }
        ]
      }); 

      if (user) {
        user.lastLogin = new Date();
        await user.save();
      }

      if (!user) {
        firstTimeSignup = true
        if (referralCode) {
          const referrer = await Accounts.findOne({
            referralCode: referralCode,
          });
          if (referrer) {
            googleUser.referredBy = referrer.referralCode!;
            referrer.referralCount += 1; // Increment the referrer's referral count
            await referrer.save(); // Save the updated referrer
          }
        }
        let username:any = await generateRandomUserName(googleUser);
        if(!username){
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          username = `${googleUser.firstname}_${googleUser.lastname}_${randomNum}`
        }
        googleUser.username = username;
        googleUser.referralCode = await generateReferralCode(`${googleUser.firstname}${googleUser.lastname}`)
        googleUser.avatar = '/assets/images/avatar.jpg';
        googleUser.createdAt = new Date();
        googleUser.lastLogin = new Date();
        googleUser.provider = "GOOGLE";
        const newUser: any = await Accounts.create(googleUser);
        user = newUser;
        // newUser.email_confirmed = true;
        await newUser.save();
        
      }
      if(firstTimeSignup){
        req.body = {accountId: user._id.toString()}
        const auth = new Authentication(req);
        auth.sendEmailConfirmationOtp()
        const authResult = {
          status: true,
          message: "Complete Email 2fa Otp step",
          data: {accountId: user._id.toString()}
        };
        return authResult;
      }
      const accessToken = await jwthelper.signAccessToken(user._id!.toString());
      const refreshToken = await jwthelper.signRefreshToken(
        user._id!.toString()
      );
      const authResult = {
        status: true,
        message: "Google authentication was successful",
        data: user,
        accessToken,
        refreshToken,
        extraMessage: "",
      };
      return authResult;
    } catch (error: any) {
      console.log(error);
      return {
        status: false,
        message: "Google authentication was not successfull",
      };
    }
  }


}

