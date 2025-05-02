import web3 from "../config/web3";
import { AbiItem } from "web3-utils";
import dotenv from "dotenv";
import { Bytes } from "web3";
import { ERC20_TOKENS } from "../config/tokens.config";
import { DepositIntent } from "../../models/depositIntent.model";
import { sendTransferNotification } from "./notify-ui";
import CryptoListing from "../../models/saleListing.model";
import Escrow from "../../models/escrow.model";
import mongoose from "mongoose"; // ✅ added mongoose

dotenv.config();

const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS?.toLowerCase();

const ERC20_ABI: AbiItem[] = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

export const listenToERC20 = async () => {
  console.log("Starting erc20 listener");
  const ERC20_TRANSFER_TOPIC = web3.utils.sha3(
    "Transfer(address,address,uint256)"
  )!;

  const subscription = await web3.eth.subscribe("logs", {
    address: ERC20_TOKENS.map((token) => token.address),
    topics: [
      ERC20_TRANSFER_TOPIC,
      null,
      web3.utils.padLeft(ESCROW_ADDRESS!, 64),
    ] as any,
  });

  subscription.on("data", async (log) => {
    const token = ERC20_TOKENS.find(
      (t) => t.address.toLowerCase() === log.address.toLowerCase()
    );
    if (!token) return;

    const decoded: any = web3.eth.abi.decodeLog(
      [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value" },
      ],
      log.data,
      log.topics.slice(1)
    );

    const value = Number(decoded.value) / 10 ** token.decimals;
    const filter = {
      sender: decoded.from.toLowerCase(),
      tokenAddress: token.address?.toLowerCase(),
      status: "pending",
      amount: value.toString(),
      receivingAddress: decoded.to?.toLowerCase(),
    };
    const match = await DepositIntent.findOne(filter);
    if (match) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        match.status = "confirmed";
        match.txHash = log.transactionHash; // ✅ fixed from decoded.hash to log.transactionHash

        const listing = await CryptoListing.findOne({
          _id: match.listing,
        }).session(session);
        if (listing) {
          const data = {
            account: listing.account?.toString(),
            totalEscrowBalance: value,
            availableEscrowBalance: value,
            lockedEscrowBalance: 0,
          };
          const escrow = await Escrow.create([data], { session });
          listing.depositConfirmed = true;
          listing.escrow = escrow[0]._id;

          await match.save({ session });
          await listing.save({ session });
        }

        await session.commitTransaction();
        console.log(`ERC20 deposit confirmed for ${match.intentId}`);
        sendTransferNotification(match.account.toString(), match);
        console.log(
          `📦 ERC20 (${token.symbol}) deposit: from ${decoded.from} → ${decoded.to} | amount: ${value}`
        );
      } catch (error) {
        console.error("ERC20 Transaction error: ", error);
        await session.abortTransaction();
      } finally {
        session.endSession();
      }
    }
  });
};

export const listenToETH = async () => {
  web3.eth.subscribe("pendingTransactions", async (err: any, txHash: Bytes) => {
    if (err) return;
    const tx = await web3.eth.getTransaction(txHash);
    if (!tx || tx.to?.toLowerCase() !== ESCROW_ADDRESS) return;
    console.log("Pending transaction ", tx);
  });

  (await web3.eth.subscribe("newBlockHeaders")).on(
    "data",
    async (blockHeader: any) => {
      const block = await web3.eth.getBlock(blockHeader.hash, true);

      block.transactions.forEach(async (tx: any) => {
        if (tx.to?.toLowerCase() === ESCROW_ADDRESS) {
          const value = Number(tx.value) / 10 ** 18;
          const filter = {
            sender: tx.from.toLowerCase(),
            tokenAddress: "native_eth",
            status: "pending",
            amount: value,
            receivingAddress: tx.to?.toLowerCase(),
          };

          const match = await DepositIntent.findOne(filter);
          if (match) {
            const session = await mongoose.startSession();
            try {
              session.startTransaction();

              match.status = "confirmed";
              match.txHash = tx.hash;

              const listing = await CryptoListing.findOne({
                _id: match.listing,
              }).session(session);
              if (listing) {
                const data = {
                  account: listing.account?.toString(),
                  totalEscrowBalance: value,
                  availableEscrowBalance: value,
                  lockedEscrowBalance: 0,
                };
                const escrow = await Escrow.create([data], { session });
                listing.depositConfirmed = true;
                listing.escrow = escrow[0]._id;

                await match.save({ session });
                await listing.save({ session });

                await session.commitTransaction();
                console.log(`ETH deposit confirmed for ${match.intentId}`);
                console.log("💸 Escrow deposit detected!", tx);
                sendTransferNotification(match.account.toString(), match);
              }
            } catch (error) {
              console.error("ETH Transaction error: ", error);
              await session.abortTransaction();
            } finally {
              session.endSession();
            }
          }
        }
      });
    }
  );
};
