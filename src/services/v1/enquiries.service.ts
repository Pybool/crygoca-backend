import ejs from "ejs";
import {
  validateComment,
  validateEmail,
  validatePhone,
} from "../../helpers/validators/validations_core";
import Xrequest from "../../interfaces/extensions.interface";
import Enquiries from "../../models/enquiries.model";
import sendMail from "./mailtrigger";
import { logo } from "./logo";
import juice from "juice";

export const enquiriesService = async (req: Xrequest, res: any) => {
  try {
    const isMailValid = validateEmail(req.body.email);
    const isPhoneValid = req.body.phone.length > 6;
    const isCommentvalid = validateComment(req.body.message);

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
    const enquiry = await Enquiries.create(data);
    if (enquiry) {
      thankUsermail(data.email, data.name);
      return res.status(200).send({
        status: true,
        message: "Your enquiry was received, Thank you!",
      });
    }

    return res.status(400).send({
      status: false,
      message:
        "Sorry we could not process your enquiry submission at this time.",
    });
  } catch (error: any) {
    res.status(500).send({status: false, error: error?.message})
  }
};

const thankUsermail = (email: string, name: string) => {
  return new Promise(async (resolve: any, reject: any) => {
    const responseTemplate = await ejs.renderFile(
      "dist/templates/enquiriesResponseTemplate.ejs",
      {
        email,
        name,
        logo,
      }
    );

    const mailOptions = {
      from: `info@crygoca.com`,
      to: email,
      subject: "Your Crygoca enquiries",
      text: `We received your enquiry!`,
      html: juice(responseTemplate),
    };

    sendMail(mailOptions)
      .then((response: any) => {
        resolve(console.log("Email sent successfully:", response));
      })
      .catch((error: any) => {
        reject(console.error("Failed to send email:", error));
      });
  });
};
