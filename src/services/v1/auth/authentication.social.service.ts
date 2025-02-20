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
        googleUser.referralCode = await generateReferralCode(`${googleUser.firstname}${googleUser.lastname}`)
        googleUser.avatar = googleUser.avatar;
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
        await auth.sendEmailConfirmationOtp()
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

