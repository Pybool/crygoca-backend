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
import {
  deleteExpirableCode,
  generateOtp,
  generatePasswordResetHash,
  getExpirableCode,
  setExpirableCode,
} from "./helper";

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
      const user: any = await Accounts.findOne({ _id: result.accountId });
      if (!user) {
        throw createError.NotFound(
          utils.joinStringsWithSpace([
            result.accountId,
            message.auth.notRegisteredPartText,
          ])
        );
      }

      if (user.email_confirmed) {
        return { status: false, message: message.auth.emailAlreadyVerified };
      }
      const otp: string = generateOtp();
      await setExpirableCode(user.email, "account-verification", otp);
      return await mailActions.auth.sendEmailConfirmationOtp(user.email, otp);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async sendPasswordResetOtp() {
    try {
      const result = await validations.authSendResetPasswordOtp.validateAsync(
        this.req.body
      );
      const user = await Accounts.findOne({ email: result.email });
      if (!user) {
        return {
          status: false,
          message: utils.joinStringsWithSpace([
            result.email,
            message.auth.notRegisteredPartText,
          ]),
        };
      }
      const otp: string = generateOtp();
      await setExpirableCode(user._id.toString(), "password-reset", otp);
      console.log("Password reset otp: ", otp);
      return mailActions.auth.sendPasswordResetMail(result, user);
    } catch (error: any) {
      console.log(error);
      throw error.message;
    }
  }

  public async verifyPasswordResetOtp() {
    try {
      const result = this.req.body;
      const user = await Accounts.findOne({ email: result.email });
      if (!user) {
        return {
          status: false,
          message: utils.joinStringsWithSpace([
            result.email,
            message.auth.notRegisteredPartText,
          ]),
        };
      }
      const cachedOtp = await getExpirableCode(
        "password-reset",
        user._id.toString()
      );
      if (!cachedOtp || cachedOtp?.code.toString() !== result.otp.toString()) {
        return {
          status: false,
          message:
            "This otp is incorrect or has expired, please resend an otp...",
        };
      }
      // await deleteExpirableCode(`password-reset${result.email}`);
      const hash = generatePasswordResetHash(result.email, result.otp);
      await setExpirableCode(user._id.toString(), "password-reset-token", hash);
      return {
        status: true,
        message: "Otp has been verified successfully.",
        data: { uid: user._id.toString(), token: hash },
      };
    } catch (error: any) {
      console.log(error);
      throw error.message;
    }
  }

  public async resetPassword() {
    try {
      const result = await validations.authResetPassword.validateAsync(
        this.req.body
      );
      const cachedToken = await getExpirableCode(
        "password-reset-token",
        result.uid! as string
      );

      if (
        !cachedToken ||
        cachedToken?.code.toString() !== result.token
      ) {
        throw createError.BadRequest(message.auth.invalidTokenSupplied);
      }

      const account = await Accounts.findOne({
        _id: result.uid as string,
      });
      if (!account) {
        return {
          status: false,
          message: utils.joinStringsWithSpace([
            result.uid,
            message.auth.userNotRequestPasswordReset,
          ]),
        };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(result.password, salt);
      account.password = hashedPassword; // Set to the new password provided by the account
      await account.save();
      await deleteExpirableCode(`password-reset-token${result.uid}`);
      return { status: true, message: message.auth.passwordResetOk };
    } catch (error) {
      console.log(error);
      return { status: false, message: message.auth.passwordResetFailed };
    }
  }

  public async verifyEmail() {
    const { otp, accountId } = this.req.body as any;
    if (!otp) {
      return { status: false, message: message.auth.missingConfToken };
    }
    const account: any = await Accounts.findOne({ _id: accountId });
    if (!account) {
      return {
        status: false,
        message:
          "No account is associated with this request, please create an account.",
      };
    }
    const email = account.email;
    const cachedOtp = await getExpirableCode("account-verification", email);
    if (!cachedOtp || cachedOtp?.code.toString() !== otp.toString()) {
      return {
        status: false,
        message:
          "This otp is incorrect or has expired, please resend an otp...",
      };
    }

    try {
      if (!account.email_confirmed) {
        account.email_confirmed = true;
        await account.save();
        await deleteExpirableCode(`account-verification${email}`);
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

  async checkUserName() {
    try {
      const { userName } = this.req.body;
      const users = await Accounts.find({
        username: { $regex: `^${userName}$`, $options: "i" },
      });

      return {
        status: true,
        data: users.length,
      };
    } catch (error: any) {
      return { status: false, message: error.message };
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
      return { status: false, message: error.message };
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
