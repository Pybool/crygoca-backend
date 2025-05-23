"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiriesService = void 0;
const ejs_1 = __importDefault(require("ejs"));
const validations_core_1 = require("../../../helpers/validators/validations_core");
const enquiries_model_1 = __importDefault(require("../../../models/enquiries.model"));
const mailtrigger_1 = __importDefault(require("../mail/mailtrigger"));
const logo_1 = require("../logo");
const juice_1 = __importDefault(require("juice"));
const enquiriesService = async (req, res) => {
    try {
        const isMailValid = (0, validations_core_1.validateEmail)(req.body.email);
        const isPhoneValid = req.body.phone.length > 6;
        const isCommentvalid = (0, validations_core_1.validateComment)(req.body.message);
        if (!isMailValid) {
            return res.status(400).send({
                status: false,
                message: "Please enter a valid email address",
            });
        }
        if (!isPhoneValid) {
            return res.status(400).send({
                status: false,
                message: "Please enter a valid phone number",
            });
        }
        if (!isCommentvalid) {
            return res.status(400).send({
                status: false,
                message: "Please enter your enquiries",
            });
        }
        let data = req.body;
        data.createdAt = new Date();
        const enquiry = await enquiries_model_1.default.create(data);
        if (enquiry) {
            thankUsermail(data.email, data.name);
            return res.status(200).send({
                status: true,
                message: "Your enquiry was received, Thank you!",
            });
        }
        return res.status(400).send({
            status: false,
            message: "Sorry we could not process your enquiry submission at this time.",
        });
    }
    catch (error) {
        res.status(500).send({ status: false, error: error?.message });
    }
};
exports.enquiriesService = enquiriesService;
const thankUsermail = (email, name) => {
    return new Promise(async (resolve, reject) => {
        const responseTemplate = await ejs_1.default.renderFile("dist/templates/enquiriesResponseTemplate.ejs", {
            email,
            name,
            logo: logo_1.logo,
        });
        const mailOptions = {
            from: `info@crygoca.com`,
            to: email,
            subject: "Your Crygoca enquiries",
            text: `We received your enquiry!`,
            html: (0, juice_1.default)(responseTemplate),
        };
        (0, mailtrigger_1.default)(mailOptions)
            .then((response) => {
            resolve(console.log("Email sent successfully:", response));
        })
            .catch((error) => {
            reject(console.error("Failed to send email:", error));
        });
    });
};
