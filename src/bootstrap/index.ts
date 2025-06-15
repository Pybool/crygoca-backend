import { setUpSecrets } from "../../env/decrypt-env";

const bootstrapServer = async()=>{
    await setUpSecrets();
    require("./server")
}

bootstrapServer()