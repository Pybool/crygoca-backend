import mongoose from "mongoose";

/**
 * Generic transaction decorator that:
 * - Starts a transaction
 * - Passes session automatically to all Mongoose queries
 * - Commits on success, rolls back on failure
 */
export function Transactional() {
  return function (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) {
    // ✅ For class methods
    if (descriptor) {
      const originalMethod = descriptor.value!;

      descriptor.value = async function (...args: any[]) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // ✅ Ensure session is explicitly passed to the original method
          const result = await originalMethod.apply(this, [...args, session]);
          await session.commitTransaction();
          return result;
        } catch (error) {
          await session.abortTransaction();
          throw error;
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
