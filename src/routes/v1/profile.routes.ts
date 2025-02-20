import express from "express";
import { decode, decodeExt } from "../../middlewares/jwt";
import { profileController } from "../../controllers/v1/profile.controller";

const profileRouter = express.Router();
profileRouter.get(
  "/get-user-profile",
  decode,
  profileController._getUserProfile
);

profileRouter.put(
  "/save-basic-info-preferences",
  decode,
  profileController._saveBasicInfoAndPreferences
);

profileRouter.put(
  "/save-2fa-auth",
  decode,
  profileController._saveSinglePreference
);

profileRouter.put(
  "/reassign-device-authorization",
  decode,
  profileController._reassignDeviceAuthorization
);

profileRouter.put(
  "/change-password",
  decode,
  profileController._changePassword
);

profileRouter.get(
  "/get-add-password-otp",
  decode,
  profileController._sendAddPasswordCode
);

profileRouter.put(
  "/add-password",
  decode,
  profileController._addPassword
);

export default profileRouter;
