"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwt_1 = require("../../middlewares/jwt");
const profile_controller_1 = require("../../controllers/v1/profile.controller");
const profileRouter = express_1.default.Router();
profileRouter.get("/get-user-profile", jwt_1.decode, profile_controller_1.profileController._getUserProfile);
profileRouter.put("/save-basic-info-preferences", jwt_1.decode, profile_controller_1.profileController._saveBasicInfoAndPreferences);
profileRouter.put("/save-2fa-auth", jwt_1.decode, profile_controller_1.profileController._saveSinglePreference);
profileRouter.put("/reassign-device-authorization", jwt_1.decode, profile_controller_1.profileController._reassignDeviceAuthorization);
profileRouter.put("/change-password", jwt_1.decode, profile_controller_1.profileController._changePassword);
exports.default = profileRouter;
