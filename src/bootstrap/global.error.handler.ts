export const handleErrors = (errorMessage?: string) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ): TypedPropertyDescriptor<any> | void {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error:any) {
        console.error(`Error in ${propertyKey}:`, error?.message);
        return {
          status: false,
          message:
            errorMessage || error?.message  || "An error occurred while processing the request.",
          code: 500,
        };
      }
    };
    return descriptor;
  };
};

export const handleAnonymousFunctionErrors = <T extends (...args: any[]) => any>(
  fn: T,
  errorMessage?: string
): (...funcArgs: Parameters<T>) => ReturnType<T> | any => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | any> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in anonymous function:`, error);
      return {
        status: false,
        message: errorMessage || "An error occurred while processing",
        code: 500,
      };
    }
  };
};

