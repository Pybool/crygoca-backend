import { Request, Response } from "express";
import { ProfileService } from "../../services/v1/auth/profile.service";

interface Xrequest extends Request {
  body: any;
  accountId?:string;
}

export const profileController: any = {
  _getUserProfile: async (req: Xrequest, res: Response) => {
    try {
      const result = await ProfileService.getUserProfile(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _saveBasicInfoAndPreferences: async (req: Xrequest, res: Response) => {
    try {
      const result = await ProfileService.saveBasicInfoAndPreferences(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _saveSinglePreference: async (req: Xrequest, res: Response) => {
    try {
      const result = await ProfileService.saveSinglePreference(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _reassignDeviceAuthorization: async (req: Xrequest, res: Response) => {
    try {
      const result = await ProfileService.reassignDeviceAuthorization(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _changePassword: async (req: Xrequest, res: Response) => {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const accountId = req.accountId!; 

      const result = await ProfileService.changePassword(
        accountId,
        oldPassword,
        newPassword,
        confirmPassword
      );

      if (result.status) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _sendAddPasswordCode: async (req: Xrequest, res: Response) => {
    try {
      const accountId = req.accountId!; 
      const result = await ProfileService.sendAddPasswordCode(accountId);

      if (result.status) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _addPassword: async (req: Xrequest, res: Response) => {
    try {
      const { otp, newPassword, confirmPassword } = req.body;
      const accountId = req.accountId!; 

      const result = await ProfileService.addPassword(
        accountId,
        newPassword,
        confirmPassword,
        otp
      );

      if (result.status) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },
};
