import UniversalProvider from "@walletconnect/universal-provider";
import { WalletConnectModal } from "@walletconnect/modal";
import { useEffect, useState } from "react";
import { TronService, TronChains } from "./utils/tronService";

const projectId = import.meta.env.VITE_PROJECT_ID;

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [provider, setProvider] = useState<UniversalProvider | null>(null);
  const [tronService, setTronService] = useState<TronService | null>(null);

  const methods = ["tron_signMessage", "tron_signTransaction"];
  const chains = [`tron:${TronChains.Mainnet}`];
  const modal = new WalletConnectModal({ projectId, chains });

  // Initialize UniversalProvider
  useEffect(() => {
    const initProvider = async () => {
      const providerInstance = await UniversalProvider.init({
        logger: "error",
        projectId,
        metadata: {
          name: "WalletConnect x Tron",
          description: "Tron integration with WalletConnect's Universal Provider",
          url: "https://walletconnect.com/",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
      });
      setProvider(providerInstance);

      providerInstance.on("display_uri", async (uri: string) => {
        console.log("WC URI:", uri);
        await modal.openModal({ uri });
      });
    };

    initProvider();
  }, []);

  // Set up TronService and address when connected
  useEffect(() => {
    if (!provider || !provider.session) return;

    const tronServiceInstance = new TronService(provider);
    setTronService(tronServiceInstance);

    const accountAddress = provider.session?.namespaces?.tron?.accounts[0]?.split(":")[2];
    setAddress(accountAddress || null);
    setIsConnected(true);
  }, [provider]);

  // Fetch balance when address is set
  useEffect(() => {
    const fetchBalance = async () => {
      if (!tronService || !address) return;
      const userBalance = await tronService.getBalance(address);
      setBalance(userBalance);
    };

    if (isConnected) fetchBalance();
  }, [tronService, address, isConnected]);

  const connect = async () => {
    if (!provider) return;

    try {
      await provider.connect({
        optionalNamespaces: {
          tron: {
            methods,
            chains,
            events: [],
          },
        },
      });
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      modal.closeModal();
    }
  };

  const disconnect = async () => {
    if (provider) {
      await provider.disconnect();
      setIsConnected(false);
      setAddress(null);
      setBalance(null);
    }
  };

  const handleSignMessage = async () => {
    if (!tronService || !address) return;
    const signedMessage = await tronService.signMessage(
      `Authorization Request - ${Date.now()}`,
      address
    );
    console.log("Signed Message:", signedMessage);
  };

  const handlesignTransaction = async () => {
    if (!tronService || !address) return;
    const result = await tronService.signTransaction(address, 100); // Example amount
    console.log("Transaction Result:", result);
  };

  return (
    <div className="App center-content">
      <h2>WalletConnect + TRON</h2>
      {isConnected ? (
        <>
          <p>
            <b>Address: </b>{address}<br />
            <b>Balance: </b>{balance ?? "Fetching..."}<br />
          </p>
          <div className="btn-container">
            <button onClick={() => tronService?.getBalance(address!).then(setBalance)}>
              Refresh Balance
            </button>
            <button onClick={handleSignMessage}>Sign Message</button>
            <button onClick={handlesignTransaction}>Sign Transaction</button>
            <button onClick={disconnect}>Disconnect</button>
          </div>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
      <div className="circle">
        <a href="https://github.com/WalletConnect/web-examples/tree/main/dapps/universal-provider-tron" target="_blank">
          <img src="/github.png" alt="GitHub" width="50" />
        </a>
      </div>
    </div>
  );
};

export default App;
