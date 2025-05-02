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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMulterConfigSingle = exports.getMulterConfig = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fs_2 = require("fs");
const sharp_1 = __importDefault(require("sharp"));
const { v4: uuidv4 } = require("uuid");
function arraifyUploads(attachmentsFolder, type) {
    try {
        const storage = multer_1.default.diskStorage({
            destination: function (req, file, cb) {
                cb(null, attachmentsFolder);
            },
            filename: function (req, file, cb) {
                const uniqueFilename = `${uuidv4()}-${file.originalname}`;
                const filePath = path_1.default.join(attachmentsFolder, uniqueFilename);
                req.attachments = req.attachments || [];
                if (type == "string") {
                    req.attachments.push(filePath
                        .replaceAll("..", "")
                        .replaceAll("\\", "/")
                        .replaceAll("crygoca-backend", ""));
                }
                else {
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
        const config = (0, multer_1.default)({
            storage: storage,
            limits: {
                fieldSize: 20 * 1024 * 1024, // 9MB limit
            },
            // fileFilter: this.attachmentsFilter,
        });
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const upload = config.array("attachments", parseInt(process.env.CRYGOCA_MAX_IMAGES || "3"));
            upload(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.error("Error during upload:", err);
                    return res.status(500).send("Error during upload.");
                }
                // Resize images using Sharp
                if (req.files && req.files.length > 0) {
                    yield Promise.all(req.files.map((file) => __awaiter(this, void 0, void 0, function* () {
                        const filePath = path_1.default.join(attachmentsFolder, file.filename);
                        const tempFilePath = `${filePath}-temp`;
                        yield (0, sharp_1.default)(filePath).resize(450, 300).toFile(tempFilePath);
                        fs_1.default.renameSync(tempFilePath, filePath + "-450x300.png");
                    })));
                }
                next();
            }));
        });
    }
    catch (error) {
        console.error("Error during upload:", error);
        throw error; // Re-throw for potential handling in the route handler
    }
}
function singleUpload(attachmentsFolder) {
    try {
        const storage = multer_1.default.diskStorage({
            destination: function (req, file, cb) {
                cb(null, attachmentsFolder);
            },
            filename: function (req, file, cb) {
                const uniqueFilename = `${uuidv4()}-${file.originalname}`.replaceAll(" ", "-");
                const filePath = path_1.default.join(attachmentsFolder, uniqueFilename);
                req.attachments = req.attachments || [];
                req.attachments.push(filePath
                    .replaceAll("..", "")
                    .replaceAll("\\", "/")
                    .replaceAll("crygoca-backend", ""));
                cb(null, uniqueFilename);
            },
        });
        const config = (0, multer_1.default)({
            storage: storage,
            limits: {
                fieldSize: 20 * 1024 * 1024, // 9MB limit
            },
            // fileFilter: this.attachmentsFilter,
        });
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const upload = config.single("attachments");
            upload(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.error("Error during upload:", err);
                    return res.status(500).send("Error during upload.");
                }
                // Resize images using Sharp
                if (req.files && req.files.length > 0) {
                    yield Promise.all(req.files.map((file) => __awaiter(this, void 0, void 0, function* () {
                        const filePath = path_1.default.join(attachmentsFolder, file.filename);
                        const tempFilePath = `${filePath}-temp`;
                        yield (0, sharp_1.default)(filePath).resize(450, 300).toFile(tempFilePath);
                        fs_1.default.renameSync(tempFilePath, filePath + "-450x300.png");
                    })));
                }
                next();
            }));
        });
    }
    catch (error) {
        console.error("Error during upload:", error);
        throw error; // Re-throw for potential handling in the route handler
    }
}
function createfolder(folderUrl) {
    console.log("Checking if public directory exists:", folderUrl);
    if (!(0, fs_2.existsSync)(folderUrl)) {
        console.log("Directory does not exist, creating:", folderUrl);
        try {
            (0, fs_2.mkdirSync)(folderUrl, { recursive: true });
            console.log("Directory created successfully");
        }
        catch (err) {
            console.error("Error creating directory:", err);
        }
    }
    else {
        console.log("Directory already exists:", folderUrl);
    }
}
function getMulterConfig(folder = "../public/accounts/", type = "string") {
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
exports.getMulterConfig = getMulterConfig;
function getMulterConfigSingle(folder) {
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
exports.getMulterConfigSingle = getMulterConfigSingle;
