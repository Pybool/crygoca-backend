import { ERC20_TOKENS } from "../config/tokens.config"

export const getChainId = (tokenAddress: string): number | null => {
  const token = ERC20_TOKENS.find(
    (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return token ? token.chainId : null;
};
