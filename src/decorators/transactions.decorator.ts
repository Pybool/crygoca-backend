import mongoose from "mongoose";
import { ClientSession } from "mongodb"; // Import ClientSession from mongodb


/**
 * Generic transaction decorator that:
 * - Starts a transaction
 * - Passes session automatically to all Mongoose queries
 * - Commits on success, rolls back on failure
 */
export function MongooseTransaction() {
  return function (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) {
    // ✅ For class methods
    if (descriptor) {
      const originalMethod = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        let session: ClientSession | null = args.find(arg => arg instanceof ClientSession) || null;

        // Start a new session only if one doesn't exist
        if (!session) {
            session = await mongoose.startSession();
            session.startTransaction();
            args.push(session); // Pass the session to the original function
        }

        try {
            const result = await originalMethod.apply(this, args);
            await session.commitTransaction();
            return result;
        } catch (error:any) {
            await session.abortTransaction();
            return {
              status:false,
              message:"An error has occured, please try again later.",
              error: error?.message
            }
        } finally {
            session.endSession();
        }
    };
      return descriptor;
    }

    // ❌ TypeScript does not support decorators on standalone functions.
    // ✅ Wrap standalone functions manually when exporting them.
  };
}



