import { createAppKit } from "@reown/appkit/react";
import { bscTestnet, bsc } from "@reown/appkit/networks";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

const projectId = "11122997d03999ce33f0f85fb93ee6d7";
const networks = [bscTestnet, bsc];
const ethersAdapter = new EthersAdapter();

createAppKit({
  adapters: [ethersAdapter],
  networks,
  defaultNetwork: bscTestnet,
  projectId,
  metadata: {
    name: "HANA",
    description: "HANA Decentralized Ecosystem",
    url: typeof window !== "undefined" ? window.location.origin : "https://hana.io",
  },
  features: {
    analytics: true,
  },
});

export default function WalletProvider({ children }) {
  return children;
}
