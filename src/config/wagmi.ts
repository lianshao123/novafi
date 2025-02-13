import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { baseMsg } from "@/config/base"

import {
  arbitrum,
  // bsc,
  // mainnet,
  optimism,
  polygon,
  // sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Jeton Protocol',
  projectId: 'f3a855e63993e03d0cad20e991f2ca59', 
  chains: [
    // mainnet,
    // bsc,
    arbitrum,
    polygon,
    optimism,
    // ...(baseMsg.TESTNETS ? [sepolia] : []),
  ],
  ssr: true,
});