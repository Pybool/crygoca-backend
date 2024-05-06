export class Cache {
    cache: any;
    constructor() {
      this.cache = {};
    }
  
    set(key: string | number, value: any, expirationTime: number) {
      this.cache[key] = {
        value: value,
        expirationTime: Date.now() + expirationTime * 1000 // Convert seconds to milliseconds
      };
      setTimeout(() => {
        this.delete(key);
      }, expirationTime * 1000);
    }
  
    get(key: string | number) {
      const item = this.cache[key];
      if (item && item.expirationTime > Date.now()) {
        return item.value;
      } else {
        this.delete(key);
        return null;
      }
    }
  
    delete(key: string | number) {
      delete this.cache[key];
    }
  }
 