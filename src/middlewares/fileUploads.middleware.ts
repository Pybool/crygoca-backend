import multer from "multer";
import path from "path";
import fs from "fs";
import { existsSync, mkdirSync } from "fs";
import Xrequest from "../interfaces/extensions.interface";
import sharp from "sharp";
const { v4: uuidv4 } = require("uuid");

function arraifyUploads(attachmentsFolder: string, type: string) {
  try {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, attachmentsFolder);
      },
      filename: function (req: Xrequest, file, cb) {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        const filePath = path.join(attachmentsFolder, uniqueFilename);
        req.attachments = req.attachments || [];
        if (type == "string") {
          req.attachments.push(
            filePath
              .replaceAll("..", "")
              .replaceAll("\\", "/")
              .replaceAll("crygoca-backend", "")
          );
        } else {
          req.attachments.push({
            type: "image",
            url: filePath
              .replaceAll("..", "")
              .replaceAll("\\", "/")
              .replaceAll("crygoca-backend", ""),
          });
        }

        cb(null, uniqueFilename);
      },
    });

    const config = multer({
      storage: storage,
      limits: {
        fieldSize: 20 * 1024 * 1024, // 9MB limit
      },
      // fileFilter: this.attachmentsFilter,
    });

    return async (req: Xrequest, res: any, next: any) => {
      const upload = config.array(
        "attachments",
        parseInt(process.env.CRYGOCA_MAX_IMAGES || "3")
      );

      upload(req, res, async (err) => {
        if (err) {
          console.error("Error during upload:", err);
          return res.status(500).send("Error during upload.");
        }
        // Resize images using Sharp
        if (req.files && req.files.length > 0) {
          await Promise.all(
            req.files.map(async (file: any) => {
              const filePath = path.join(attachmentsFolder, file.filename);
              const tempFilePath = `${filePath}-temp`;

              await sharp(filePath).resize(450, 300).toFile(tempFilePath);

              fs.renameSync(tempFilePath, filePath + "-450x300.png");
            })
          );
        }

        next();
      });
    };
  } catch (error) {
    console.error("Error during upload:", error);
    throw error; // Re-throw for potential handling in the route handler
  }
}

function singleUpload(attachmentsFolder: string) {
  try {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, attachmentsFolder);
      },
      filename: function (req: Xrequest, file, cb) {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`.replaceAll(
          " ",
          "-"
        );
        const filePath = path.join(attachmentsFolder, uniqueFilename);
        req.attachments = req.attachments || [];
        req.attachments.push(
          filePath
            .replaceAll("..", "")
            .replaceAll("\\", "/")
            .replaceAll("crygoca-backend", "")
        );
        cb(null, uniqueFilename);
      },
    });

    const config = multer({
      storage: storage,
      limits: {
        fieldSize: 20 * 1024 * 1024, // 9MB limit
      },
      // fileFilter: this.attachmentsFilter,
    });

    return async (req: Xrequest, res: any, next: any) => {
      const upload = config.single("attachments");
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error during upload:", err);
          return res.status(500).send("Error during upload.");
        }
        // Resize images using Sharp
        if (req.files && req.files.length > 0) {
          await Promise.all(
            req.files.map(async (file: any) => {
              const filePath = path.join(attachmentsFolder, file.filename);
              const tempFilePath = `${filePath}-temp`;

              await sharp(filePath).resize(450, 300).toFile(tempFilePath);

              fs.renameSync(tempFilePath, filePath + "-450x300.png");
            })
          );
        }

        next();
      });
    };
  } catch (error) {
    console.error("Error during upload:", error);
    throw error; // Re-throw for potential handling in the route handler
  }
}

function createfolder(folderUrl: string) {
  console.log("Checking if public directory exists:", folderUrl);
  if (!existsSync(folderUrl)) {
    console.log("Directory does not exist, creating:", folderUrl);
    try {
      mkdirSync(folderUrl, { recursive: true });
      console.log("Directory created successfully");
    } catch (err) {
      console.error("Error creating directory:", err);
    }
  } else {
    console.log("Directory already exists:", folderUrl);
  }
}

export function getMulterConfig(
  folder: string = "../public/accounts/",
  type = "string"
) {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Add leading zero for single-digit months
  const day = String(today.getDate()).padStart(2, "0");
  const year = today.getFullYear();
  const formattedDate2 = `${day}-${month}-${year}`;
  let attachmentsFolder = `${folder}${formattedDate2}`;
  createfolder(attachmentsFolder);
  const multerConfig = arraifyUploads(attachmentsFolder, type);
  return multerConfig;
}

export function getMulterConfigSingle(folder: string) {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Add leading zero for single-digit months
  const day = String(today.getDate()).padStart(2, "0");
  const year = today.getFullYear();
  const formattedDate2 = `${day}-${month}-${year}`;
  let attachmentsFolder = folder + `${formattedDate2}`;
  createfolder(attachmentsFolder);
  const multerConfig = singleUpload(attachmentsFolder);
  return multerConfig;
}
