// signature validation placeholder
import Web3 from 'web3';

const web3 = new Web3();

export const validateSignature = (
  address: string,
  signature: string,
  message: string
): boolean => {
  try {
    const signer = web3.eth.accounts.recover(message, signature);
    return signer.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
};