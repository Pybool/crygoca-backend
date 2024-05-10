import axios from "axios";
import { Cache } from "../../middlewares/cache";
import { response } from "./mockcrypto.response";
const memCache = new Cache();

export const fetchCrypto = async (url: string, isTask=false) => {
  return new Promise((resolve: any, reject: any) => {

    if (memCache.get("crypto-currencies") && !isTask) {
        console.log(memCache.get("crypto-currencies"), typeof memCache.get("crypto-currencies"))
      resolve(memCache.get("crypto-currencies"));
    } else {
        memCache.set("crypto-currencies", response, 120);
      resolve(response)
      axios
        .get(url)
        .then((_response) => {
          memCache.set("crypto-currencies", _response.data, 120);
          resolve(_response.data);
        })
        .catch((error) => {
          resolve({
            status: false,
            data: null,
            error: error,
          });
        });
    }
  });
};

