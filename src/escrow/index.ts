import { listenToERC20, listenToETH } from "./services/blockchain.service";

export const startEscrowTransfersListeners = ()=>{
    listenToERC20();
    listenToETH();
}