import Accounts from "../../models/accounts.model";
import JWT from "jsonwebtoken";
import createError from "http-errors";
import message from "../../helpers/messages";
import { utils } from "../../helpers/validators/validations_core";
import jwthelper from "../../helpers/jwt_helper";
import mailActions from "./mailservice";
import validations from "../../helpers/validators/joiAuthValidators";
import Xrequest from "../../interfaces/extensions.interface";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { generateOtp, getExpirableCode, setExpirableCode } from "./helper";

export class Authentication {
  req: Xrequest;
  payload: { email: string; password: string };

  constructor(req: Xrequest) {
    this.req = req;
    this.payload = req.body || {};
  }

  public async register() {
    try {
      const session = await mongoose.startSession();
      const result = await validations.authSchema.validateAsync(this.req.body);
      const user = await Accounts.findOne({ email: result.email }).session(
        session
      );
      if (user) {
        throw createError.Conflict(message.auth.alreadyExistPartText);
      }
      const pendingAccount = new Accounts(result);
      // pendingAccount.email_confirmed = true; //Remove this line
      const savedUser: any = await pendingAccount.save();

      if (savedUser._id.toString()) {
        const otp: string = generateOtp();
        await setExpirableCode(result.email, "account-verification", otp);
        mailActions.auth.sendEmailConfirmationOtp(result.email, otp);
        return {
          status: true,
          data: savedUser._id,
          message: "Registration successful",
        };
      }
      return { status: false, message: "Registration was unsuccessful!" };
    } catch (error: any) {
      let msg: string = "Registration was unsuccessful!";
      if (error.message.includes("already exists!")) {
        error.status = 200;
        msg = error.message || "User with email address already exists!";
      }
      return { status: false, message: msg };
    }
  }

  public async sendEmailConfirmationOtp() {
    try {
      const result =
        await validations.authSendEmailConfirmOtpSchema.validateAsync(
          this.req.body
        );
      const user: any = await Accounts.findOne({ email: result.email });
      if (!user) {
        throw createError.NotFound(
          utils.joinStringsWithSpace([
            result.email,
            message.auth.notRegisteredPartText,
          ])
        );
      }

      if (user.email_confirmed) {
        return { status: false, message: message.auth.emailAlreadyVerified };
      }
      const otp: string = generateOtp();
      await setExpirableCode(result.email, "account-verification", otp);
      return await mailActions.auth.sendEmailConfirmationOtp(result.email, otp);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async sendPasswordResetLink() {
    try {
      const result = await validations.authSendResetPasswordLink.validateAsync(
        this.req.body
      );
      const user = await Accounts.findOne({ email: result.email });
      if (!user) {
        throw createError.NotFound(
          utils.joinStringsWithSpace([
            result.email,
            message.auth.notRegisteredPartText,
          ])
        );
      }
      return mailActions.auth.sendPasswordResetMail(result, user);
    } catch (error: any) {
      console.log(error);
      throw error.message;
    }
  }

  public async resetPassword() {
    try {
      if (!this.req.query.token)
        throw createError.BadRequest(message.auth.invalidTokenSupplied);
      const result = await validations.authResetPassword.validateAsync(
        this.req.body
      );
      const account = await Accounts.findOne({
        reset_password_token: this.req.query.token,
        reset_password_expires: { $gt: Date.now() },
      });
      if (!account) {
        throw createError.NotFound(
          utils.joinStringsWithSpace([
            result.email,
            message.auth.userNotRequestPasswordReset,
          ])
        );
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(result.password, salt);
      account.password = hashedPassword; // Set to the new password provided by the account
      account.reset_password_token = undefined;
      account.reset_password_expires = undefined;
      await account.save();
      return { status: true, message: message.auth.passwordResetOk };
    } catch (error) {
      console.log(error);
      return { status: false, message: message.auth.passwordResetFailed };
    }
  }

  public async verifyEmail() {
    const { otp, email } = this.req.body as any;
    if (!otp) {
      return { status: false, message: message.auth.missingConfToken };
    }
    const cachedOtp = await getExpirableCode("account-verification", email);
    if (!cachedOtp || cachedOtp?.code.toString() !== otp.toString()) {
      return {
        status: false,
        message: "This otp is incorrect or has expired...",
      };
    }

    try {
      const account: any = await Accounts.findOne({ email });
      if (!account.email_confirmed) {
        account.email_confirmed = true;
        await account.save();

        return { status: true, message: message.auth.emailVerifiedOk };
      }
      return { status: false, message: "Account already verified!" };
    } catch (error) {
      console.log(error);
      return { status: false, message: message.auth.invalidConfToken };
    }
  }

  public async login() {
    try {
      const result = await validations.authSchema.validateAsync(this.req.body);
      console.log("Login pauyload ", result);
      const account: any = await Accounts.findOne({ email: result.email });
      if (!account) return createError.NotFound(message.auth.userNotRegistered);

      const isMatch = await account.isValidPassword(result.password);
      if (!isMatch)
        return createError.Unauthorized(message.auth.invalidCredentials);

      if (!account.email_confirmed) {
        const otp: string = generateOtp();
        await setExpirableCode(result.email, "account-verification", otp);
        await mailActions.auth.sendEmailConfirmationOtp(result.email, otp);
        return {
          status: false,
          code: 1001, //Code 101 is code to restart otp verification...
          data: account._id,
          message: "Please verify your account",
        };
      }

      const accessToken = await jwthelper.signAccessToken(account.id);
      const refreshToken = await jwthelper.signRefreshToken(account.id);
      return { status: true, data: account, accessToken, refreshToken };
    } catch (error) {
      console.log(error);
      return { status: false, message: message.auth.loginError };
    }
  }

  public async getRefreshToken(next: any) {
    try {
      const { refreshToken } = this.req.body;
      if (!refreshToken) throw createError.BadRequest();
      const { aud } = (await jwthelper.verifyRefreshToken(
        refreshToken,
        next
      )) as any;
      if (aud) {
        const accessToken = await jwthelper.signAccessToken(aud);
        // const refToken = await jwthelper.signRefreshToken(aud);
        return { status: true, accessToken: accessToken };
      }
    } catch (error: any) {
      console.log(error);
      return { status: false, message: error.mesage };
    }
  }

  public async getUserProfile() {
    try {
      const account: any = await Accounts.findOne({ _id: this.req.accountId });
      if (!account) {
        throw createError.NotFound("User was not found");
      }
      return await account.getProfile();
    } catch (error: any) {
      console.log(error);
      throw error.message;
    }
  }

  public async saveUserProfile() {
    try {
      const patchData = this.req.body;
      if (!patchData) {
        throw createError.NotFound("No data was provided");
      }
      const account: any = await Accounts.findOne({ _id: this.req.accountId });
      if (!account) {
        throw createError.NotFound("Account was not found");
      }
      // Add fields validation
      Object.keys(patchData).forEach((field) => {
        if (field != "email") account[field] = patchData[field];
      });
      await account.save();
      return {
        status: true,
        data: await account.getProfile(),
        message: "Profile updated successfully..",
      };
    } catch (error) {
      console.log(error);
      return { status: false, message: "Profile update failed.." };
    }
  }

  public async toggleUserAdminStatus() {
    try {
      const accountId = this.req.body.accountId;
      const account: any = await Accounts.findById(accountId);
      account.isAdmin = !account.isAdmin;
      const savedUser = await account.save();
      return {
        status: savedUser.isAdmin,
        message: "Sucessfull",
        data: savedUser,
      };
    } catch (error: any) {
      console.log(error);
      return {
        status: false,
        message: error.message,
      };
    }
  }
}
