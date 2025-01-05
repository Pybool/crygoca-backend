"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.validateBase64Images = exports.validateComment = exports.validatePhone = exports.validateEmail = void 0;
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.validateEmail = validateEmail;
function validatePhone(phoneNumber) {
    const numericPhoneNumber = phoneNumber.replace(/\D/g, '');
    const nigerianPhoneNumberRegex = /^(?:\+234|0)([789]\d{9})$/;
    return nigerianPhoneNumberRegex.test(numericPhoneNumber);
}
exports.validatePhone = validatePhone;
function validateComment(comment, wordLimit = 500) {
    const trimmedComment = comment.trim();
    const words = trimmedComment.split(/\s+/);
    return words.length <= wordLimit;
}
exports.validateComment = validateComment;
function validateBase64Images(base64Images) {
    if (!Array.isArray(base64Images)) {
        base64Images = [base64Images];
    }
    function isBase64JPEGImage(str) {
        const base64JPEGRegex = /^data:image\/jpeg;base64,([A-Za-z0-9+/=])+$/;
        return base64JPEGRegex.test(str);
    }
    for (const item of base64Images) {
        if (typeof item !== 'string' || !isBase64JPEGImage(item)) {
            return false;
        }
    }
    return true;
}
exports.validateBase64Images = validateBase64Images;
exports.utils = {
    joinStringsWithSpace: ((stringsArray) => {
        return stringsArray.join(" ");
    })
};
