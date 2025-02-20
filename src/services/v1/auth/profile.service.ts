import { handleErrors } from "../../../bootstrap/global.error.handler";
import Xrequest from "../../../interfaces/extensions.interface";
import Accounts from "../../../models/accounts.model";
import Devices from "../../../models/devices.model";
import mailActions from "../mail/mailservice";
import { generateOtp, getExpirableCode, setExpirableCode } from "./helper";

export class ProfileService {
  public static async getUserProfile(req: Xrequest) {
    const preferences = {};
    const accountId: string = req.accountId! as string;
    if (!accountId) {
      return {
        status: false,
        message: "No valid identity for request.",
        data: null,
        code: 200,
      };
    }

    const account: any = await Accounts.findOne({ _id: accountId });
    if (!account) {
      return {
        status: false,
        message: "No account found for identity.",
        data: null,
        code: 200,
      };
    }
    const devices = await Devices.find({ account: accountId });

    return {
      status: true,
      message: "User profile was fetched succesfully.",
      data: {
        account,
        devices,
        preferences,
      },
    };
  }

  public static async saveBasicInfoAndPreferences(req: Xrequest) {
    const payload = req.body!;
    const accountId: string = req.accountId! as string;
    if (!accountId) {
      return {
        status: false,
        message: "No valid identity for request.",
        data: null,
        code: 200,
      };
    }

    const Account: any = await Accounts.findOne(
      { _id: accountId }
    )

    if(Account){
      if(Account?.geoData?.code){
        delete payload.geoData
      }
    }

    const updatedAccount: any = await Accounts.findOneAndUpdate(
      { _id: accountId },
      payload,
      { new: true }
    );
    if (!updatedAccount) {
      return {
        status: false,
        message: "User profile update failed",
        data: null,
        code: 200,
      };
    }

    return {
      status: true,
      message: "User profile was updated succesfully.",
      data: updatedAccount,
    };
  }

  public static async saveSinglePreference(req: Xrequest) {
    const payload = req.body!;
    const accountId: string = req.accountId! as string;
    if (!accountId) {
      return {
        status: false,
        message: "No valid identity for request.",
        data: null,
        code: 200,
      };
    }

    const updatedAccount: any = await Accounts.findOneAndUpdate(
      { _id: accountId },
      payload,
      { new: true }
    );
    if (!updatedAccount) {
      return {
        status: false,
        message: "Preference update failed",
        data: null,
        code: 200,
      };
    }

    return {
      status: true,
      message: "Preference was updated succesfully.",
      data: updatedAccount,
    };
  }

  public static async reassignDeviceAuthorization(req: Xrequest) {
    const payload = req.body;
    const accountId: string = req.accountId! as string;
    if (!accountId) {
      return {
        status: false,
        message: "No valid identity for request.",
        data: null,
        code: 200,
      };
    }

    const account: any = await Accounts.findOne({ _id: accountId });
    if (!account) {
      return {
        status: false,
        message: "No account found for identity.",
        data: null,
        code: 200,
      };
    }
    const device = await Devices.findOne({
      account: accountId,
      fingerprint: payload.fingerprint,
    });
    if (!device) {
      return {
        status: false,
        message: "No device found for identity.",
        data: null,
        code: 200,
      };
    }
    device.canLogin = payload.canLogin;
    const savedDevice = await device.save();

    return {
      status: true,
      message: "Device authorization was updated succesfully.",
      data: savedDevice,
    };
  }

  public static async changePassword(
    accountId: string,
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) {
    const result = await Accounts.changePassword(
      accountId,
      oldPassword,
      newPassword,
      confirmPassword
    );
    return result;
  }

  public static async sendAddPasswordCode(accountId: string ){
    const otp:string = generateOtp();
    const user =  await Accounts.findOne({_id:accountId})
    if(!user){
      return {
        status: false,
        message: "No user was found for this session"
      }
    }
    if(user?.password){
      return {
        status: false,
        message: "You already have an existing password, you can only change this password.",
      };
    }
    await setExpirableCode(accountId, "add-password", otp);
    mailActions.auth.sendAddPasswordMail(user.email, otp);
    return {
      status: true,
      message: "Add Password Otp Sent Successfully."
    }
  }

  public static async addPassword(
    accountId: string,
    newPassword: string,
    confirmPassword: string,
    otp?:string
  ) {
    const cachedOtp = await getExpirableCode(
      "add-password",
      accountId
    );
    if (!cachedOtp || cachedOtp?.code.toString() !== otp) {
      return {
        status: false,
        data: null,
        message: "Invalid or expired otp, please request for a new otp",
      };
    }
    const result = await Accounts.addPassword(
      accountId,
      newPassword,
      confirmPassword
    );
    return result;
  }
}
