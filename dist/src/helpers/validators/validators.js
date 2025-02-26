"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validations_core_1 = require("./validations_core");
const validators = {
    newUploadRequest: (payload) => {
        const validation = {
            email: {
                status: (0, validations_core_1.validateEmail)(payload.email),
                error: "A valid email address is required",
            },
            phone: {
                status: (0, validations_core_1.validatePhone)(payload.phone),
                error: "A valid nigerian phone number is required",
            },
            comment: {
                status: (0, validations_core_1.validateComment)(payload.comment),
                error: "Your comment cannot be more than 100 words",
            },
            images: {
                status: true || (0, validations_core_1.validateBase64Images)(payload.images),
                error: "Only JPG images are allowed",
            },
        };
        // Check if any validation failed
        const failedValidations = Object.entries(validation).filter(([, { status }]) => !status);
        if (failedValidations.length > 0) {
            const [, { error }] = failedValidations[0];
            return { success: false, error };
        }
        return { success: true };
    },
};
exports.default = validators;
