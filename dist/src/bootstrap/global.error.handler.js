"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAnonymousFunctionErrors = exports.handleErrors = void 0;
const handleErrors = (errorMessage) => {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield originalMethod.apply(this, args);
                }
                catch (error) {
                    console.error(`Error in ${propertyKey}:`, error === null || error === void 0 ? void 0 : error.message);
                    return {
                        status: false,
                        message: errorMessage || (error === null || error === void 0 ? void 0 : error.message) || "An error occurred while processing the request.",
                        code: 500,
                    };
                }
            });
        };
        return descriptor;
    };
};
exports.handleErrors = handleErrors;
const handleAnonymousFunctionErrors = (fn, errorMessage) => {
    return (...args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield fn(...args);
        }
        catch (error) {
            console.error(`Error in anonymous function:`, error);
            return {
                status: false,
                message: errorMessage || "An error occurred while processing",
                code: 500,
            };
        }
    });
};
exports.handleAnonymousFunctionErrors = handleAnonymousFunctionErrors;
