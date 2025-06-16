"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAnonymousFunctionErrors = exports.handleErrors = void 0;
const handleErrors = (errorMessage) => {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            try {
                return await originalMethod.apply(this, args);
            }
            catch (error) {
                console.error(`Error in ${propertyKey}:`, error?.message);
                return {
                    status: false,
                    message: errorMessage || error?.message || "An error occurred while processing the request.",
                    code: 500,
                };
            }
        };
        return descriptor;
    };
};
exports.handleErrors = handleErrors;
const handleAnonymousFunctionErrors = (fn, errorMessage) => {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            console.error(`Error in anonymous function:`, error);
            return {
                status: false,
                message: errorMessage || "An error occurred while processing",
                code: 500,
            };
        }
    };
};
exports.handleAnonymousFunctionErrors = handleAnonymousFunctionErrors;
