import { IuploadRequest, ValidationStatus } from "../../interfaces/upload.interface";
import {
  validateBase64Images,
  validateComment,
  validateEmail,
  validatePhone,
} from "./validations_core";

const validators = {
  newUploadRequest: (payload: IuploadRequest) => {
    const validation: Record<string, ValidationStatus> = {
      email: {
        status: validateEmail(payload.email),
        error: "A valid email address is required",
      },
      phone: {
        status: validatePhone(payload.phone),
        error: "A valid nigerian phone number is required",
      },
      comment: {
        status: validateComment(payload.comment),
        error: "Your comment cannot be more than 100 words",
      },
      images: {
        status: true || validateBase64Images(payload.images),
        error: "Only JPG images are allowed",
      },
    };
    // Check if any validation failed
    const failedValidations = Object.entries(validation).filter(
        ([, { status }]) => !status
      );
      if (failedValidations.length > 0) {
        const [, { error }] = failedValidations[0];
        return { success: false, error };
      }
      return { success: true };
  },
};

export default validators;
