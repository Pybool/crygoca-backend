import bcrypt from "bcryptjs";
import MerchantAccounts from "../../../models/accounts-merchant.model";
import { WalletService } from "../wallet/wallet.service";
import MerchantCredentials from "../../../models/merchant-credentials.model";

export interface ImerchantAuth {
    email: string;
    password: string;
    confirmPassword: string;
    businessName: string;
    phone: string;
    username: string;
    address: string;
    geoData: any;
}

export class MerchantAuthService {
    /**
     * Register a new merchant account
     * @param email - Merchant's email
     * @param password - Merchant's password
     * @param confirmPassword - Confirm password
     * @param businessName - Business name
     * @param phone - Merchant's phone number
     * @param username - Unique username
     * @param address - Business address
     * @param geoData - Business geodata
     */
    static async register({
        email,
        password,
        confirmPassword,
        businessName,
        phone,
        username,
        address,
        geoData
    }: ImerchantAuth): Promise<{ status: boolean; message: string; data?: any }> {
        try {
            // Check if email already exists
            const existingEmail = await MerchantAccounts.findOne({ email });
            if (existingEmail) {
                return { status: false, message: "Email already exists" };
            }

            // Check if username already exists
            const existingUsername = await MerchantAccounts.findOne({ username });
            if (existingUsername) {
                return { status: false, message: "Username already taken" };
            }

            // Check if passwords match
            if (password !== confirmPassword) {
                return { status: false, message: "Passwords do not match" };
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create a new merchant account
            const newMerchant = await MerchantAccounts.create({
                email,
                password: hashedPassword,
                businessName,
                phone,
                username,
                address,
                isVerified: true, // Set default to false
                walletCreated: false,
                geoData,
                createdAt: new Date()
            });

            const wallet = await WalletService.createWallet(newMerchant._id, true)
            const merchantCredentials = await MerchantCredentials.create({account: newMerchant._id })

            // Return success response
            return {
                status: true,
                message: "Merchant account registered successfully",
                data: {
                    id: newMerchant._id,
                    email: newMerchant.email,
                    username: newMerchant.username,
                    businessName: newMerchant.businessName,
                    phone: newMerchant.phone,
                    address: newMerchant.address,
                    avatar: newMerchant.avatar,
                    createdAt: newMerchant.createdAt,
                    wallet,
                    merchantCredentials: {
                        account: merchantCredentials.account,
                        testPublicKey: merchantCredentials.testPublicKey,
                        testSecretKey: merchantCredentials.testSecretKey,
                        livePublicKey: merchantCredentials.livePublicKey,
                        liveSecretKey: "******************************", // Hide secret key
                        createdAt: merchantCredentials.createdAt,
                        updatedAt: merchantCredentials.updatedAt,
                    }
                },
            };
        } catch (error: any) {
            console.error("Error registering merchant:", error);
            return { status: false, message: "Error registering merchant" };
        }
    }
}
