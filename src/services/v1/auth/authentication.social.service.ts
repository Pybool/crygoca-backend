import jwthelper from "../../../helpers/jwt_helper";
import Accounts from "../../../models/accounts.model";

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
  public static async googleAuthentication(googleUser: any) {
    try {
      console.log("googleUser ", googleUser)
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
        googleUser.avatar = googleUser.avatar;
        googleUser.createdAt = new Date();
        googleUser.lastLogin = new Date();
        googleUser.provider = "GOOGLE";
        const newUser: any = await Accounts.create(googleUser);
        user = newUser;
      }
      const accessToken = await jwthelper.signAccessToken(user._id!.toString());
      const refreshToken = await jwthelper.signRefreshToken(
        user._id!.toString()
      );
      const authResult = {
        status: true,
        message: "google authentication was successful",
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
        message: "google authentication was not successfull",
      };
    }
  }


}
