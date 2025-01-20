import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { baseMsg } from "@/config/base"

import {
  arbitrum,
  bsc,
  mainnet,
  optimism,
  polygon,
  // sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'jump3',
  projectId: 'uc5jc0bPlJnEz6EyHsMn-zPCu_XTMog-', 
  chains: [
    mainnet,
    bsc,
    arbitrum,
    polygon,
    optimism,
    // ...(baseMsg.TESTNETS ? [sepolia] : []),
  ],
  ssr: true,
});