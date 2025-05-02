// // deposit service placeholder// blockchain service placeholder
// import web3 from "../config/web3";
// import { AbiItem } from "web3-utils";
// import dotenv from "dotenv";
// import { BlockNumberOrTag, Bytes } from "web3";
// import { ERC20_TOKENS } from "../config/tokens.config";
// import { DepositIntent } from "../../models/depositIntent.model";
// import { sendTransferNotification } from "./notify-ui";
// import CryptoListing from "../../models/saleListing.model";
// import Escrow, { IEscrow } from "../../models/escrow.model";

// dotenv.config();

// const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS?.toLowerCase();

// const ERC20_ABI: AbiItem[] = [
//   {
//     anonymous: false,
//     inputs: [
//       { indexed: true, name: "from", type: "address" },
//       { indexed: true, name: "to", type: "address" },
//       { indexed: false, name: "value", type: "uint256" },
//     ],
//     name: "Transfer",
//     type: "event",
//   },
// ];

// export const listenToERC20 = async () => {
//   console.log("Starting erc20 listener");
//   const ERC20_TRANSFER_TOPIC = web3.utils.sha3(
//     "Transfer(address,address,uint256)"
//   )!;

//   const subscription = await web3.eth.subscribe("logs", {
//     address: ERC20_TOKENS.map((token) => token.address),
//     topics: [
//       ERC20_TRANSFER_TOPIC, // Transfer event signature
//       null, // from any address
//       web3.utils.padLeft(ESCROW_ADDRESS!, 64), // to the escrow address
//     ] as any, // ✅ explicitly typed
//   });

//   subscription.on("data", async (log) => {
//     const token = ERC20_TOKENS.find(
//       (t) => t.address.toLowerCase() === log.address.toLowerCase()
//     );
//     if (!token) return;

//     const decoded: any = web3.eth.abi.decodeLog(
//       [
//         { type: "address", name: "from", indexed: true },
//         { type: "address", name: "to", indexed: true },
//         { type: "uint256", name: "value" },
//       ],
//       log.data,
//       log.topics.slice(1)
//     );

//     const value = Number(decoded.value) / 10 ** token.decimals;
//     const filter = {
//       sender: decoded.from.toLowerCase(),
//       tokenAddress: token.address?.toLowerCase(),
//       status: "pending",
//       amount: value.toString(),
//       receivingAddress: decoded.to?.toLowerCase(),
//     };
//     const match = await DepositIntent.findOne(filter);
//     if (match) {
//       match.status = "confirmed";
//       match.txHash = decoded.hash;

//       const listing = await CryptoListing.findOne({ _id: match.listing });
//       if (listing) {
//         const data = {
//           account: listing.account?.toString(),
//           totalEscrowBalance: value,
//           availableEscrowBalance: value,
//           lockedEscrowBalance: 0,
//         };
//         const escrow = await Escrow.create([data], { session });
//         listing.depositConfirmed = true;
//         listing.escrow = escrow[0]._id;
//         await match.save();
//         await listing.save();
//       }
//       console.log(`ETH deposit confirmed for ${match.intentId}`);
//       sendTransferNotification(match.account.toString(), match);
//       console.log(
//         `📦 ERC20 (${token.symbol}) deposit: from ${decoded.from} → ${decoded.to} | amount: ${value}`
//       );
//     }
//   });
// };

// export const listenToETH = async () => {
//   web3.eth.subscribe("pendingTransactions", async (err: any, txHash: Bytes) => {
//     if (err) return;
//     const tx = await web3.eth.getTransaction(txHash);
//     console.log("txHash ", tx, txHash);
//     if (!tx || tx.to?.toLowerCase() !== ESCROW_ADDRESS) return;
//     console.log("Pending transaction ", tx);
//   });

//   (await web3.eth.subscribe("newBlockHeaders")).on(
//     "data",
//     async (blockHeader: any) => {
//       const block = await web3.eth.getBlock(blockHeader.hash, true);

//       block.transactions.forEach(async (tx: any) => {
//         if (tx.to?.toLowerCase() === ESCROW_ADDRESS) {
//           const value = Number(tx.value) / 10 ** 18;
//           const filter = {
//             sender: tx.from.toLowerCase(),
//             tokenAddress: "native_eth",
//             status: "pending",
//             amount: value,
//             receivingAddress: tx.to?.toLowerCase(),
//           };

//           const match = await DepositIntent.findOne(filter);
//           console.log("Matched intent ", filter, match);

//           if (match) {
//             match.status = "confirmed";
//             match.txHash = tx.hash;

//             const listing = await CryptoListing.findOne({ _id: match.listing });

//             if (listing) {
//               const data = {
//                 account: listing.account?.toString(),
//                 totalEscrowBalance: value,
//                 availableEscrowBalance: value,
//                 lockedEscrowBalance: 0,
//               };
//               const escrow = await Escrow.create([data], { session });
//               listing.depositConfirmed = true;
//               listing.escrow = escrow[0]._id;
//               await match.save();
//               await listing.save();
//               console.log(`ETH deposit confirmed for ${match.intentId}`);
//               console.log("💸 Escrow deposit detected!", tx);
//               sendTransferNotification(match.account.toString(), match);
//             }
//           }
//         }
//       });
//     }
//   );
// };

// // {
// //   "sender": '0x27cfd73fd672d37e4b780b97d7f5f0f9224d8c13',
// //   "tokenAddress": '0xa3927D18243662D39D673847207090522E53fA49',
// //   "status": 'pending',
// //   "amount": 5.001,
// //   "receivingAddress": '0xcd95290751636943dfd938ce823c6cb266a20e21'
// // }
