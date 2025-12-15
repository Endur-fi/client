import { useConnect, useDisconnect, useAccount } from "@starknet-react/core";
import { connect, disconnect } from "starknetkit";
import {
  useLogin,
  useLogout,
  useUser,
  useWallets,
  usePrivy,
} from "@privy-io/react-auth";
import { useAtom } from "jotai";
import { useEffect, useCallback, useRef } from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { NETWORK } from "@/constants";
import { WalletConnector } from "@/services/wallet";
import { shortAddress } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  privyWalletAtom,
  walletSetupStepAtom,
  isLoadingWalletAtom,
  isWalletModalOpenAtom,
  type PrivyWalletData,
} from "@/store/privy-wallet.store";

// Logging utility
const log = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[WalletConnection] ${message}`, data || "");
  }
};

export function useWalletConnection() {
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { address: starknetAddress, isConnected: isStarknetConnected } =
    useAccount();
  const { isMobile } = useSidebar();

  // Privy hooks
  const { login } = useLogin();
  const { logout } = useLogout();
  const { user } = useUser();
  const { wallets: privyWallets } = useWallets();
  const { getAccessToken } = usePrivy();

  // Jotai atoms
  const [privyWallet, setPrivyWallet] = useAtom(privyWalletAtom);
  const [walletSetupStep, setWalletSetupStep] = useAtom(walletSetupStepAtom);
  const [isLoadingWallet, setIsLoadingWallet] = useAtom(isLoadingWalletAtom);
  const [isWalletModalOpen, setIsWalletModalOpen] = useAtom(
    isWalletModalOpenAtom,
  );

  // Ref to track if wallet setup is in progress
  const setupInProgressRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Check if any wallet is connected
  const isConnected = Boolean(user || isStarknetConnected);

  // Get active address (prioritize Privy wallet, then Starknet)
  const activeAddress =
    privyWallet?.address || (isStarknetConnected && starknetAddress) || null;

  // Get display address
  const displayAddress = activeAddress ? shortAddress(activeAddress, 4, 4) : "";

  // Connection type
  const connectionType = user
    ? "privy"
    : isStarknetConnected
      ? "starknet"
      : null;

  // Deploy wallet function (defined first)
  const deployWallet = useCallback(
    async (walletId: string, userJwt: string) => {
      log("Deploying wallet...", { walletId });
      setWalletSetupStep("deploying");

      try {
        const deployRes = await fetch("/api/privy/deploy-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt}`,
          },
          body: JSON.stringify({ walletId }),
        });

        if (!deployRes.ok) {
          const errorData = await deployRes.json().catch(() => ({}));
          throw new Error(errorData?.error || "Failed to deploy wallet");
        }

        const deployData = await deployRes.json();
        log("Wallet deployed", { transactionHash: deployData.transactionHash });

        // Update state with deployed wallet
        setPrivyWallet((prev) =>
          prev
            ? {
                ...prev,
                isDeployed: true,
              }
            : null,
        );

        setWalletSetupStep("complete");
        toast({
          description: "Wallet created and deployed successfully!",
        });
      } catch (error: any) {
        log("Error deploying wallet", error);
        throw error;
      }
    },
    [setPrivyWallet, setWalletSetupStep],
  );

  // Wallet setup functions
  const createAndDeployWallet = useCallback(
    async (userJwt: string) => {
      log("Creating wallet...");
      setWalletSetupStep("creating");

      try {
        const createRes = await fetch("/api/privy/create-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt}`,
          },
        });

        if (!createRes.ok) {
          const errorData = await createRes.json().catch(() => ({}));
          throw new Error(errorData?.error || "Failed to create wallet");
        }

        const createData = await createRes.json();
        log("Wallet created", { walletId: createData.walletId });

        // Update state with created wallet
        const newWallet: PrivyWalletData = {
          walletId: createData.walletId,
          address: createData.address,
          publicKey: createData.publicKey,
          isDeployed: false,
        };
        setPrivyWallet(newWallet);

        // Deploy wallet
        await deployWallet(createData.walletId, userJwt);
      } catch (error: any) {
        log("Error creating wallet", error);
        throw error;
      }
    },
    [setPrivyWallet, setWalletSetupStep, deployWallet],
  );

  // Setup wallet function
  const setupWallet = useCallback(
    async (userJwt: string) => {
      if (setupInProgressRef.current) {
        log("Wallet setup already in progress, skipping");
        return;
      }

      setupInProgressRef.current = true;
      setIsLoadingWallet(true);

      try {
        log("Fetching wallet from database...");

        // Check database for existing wallet
        const getWalletRes = await fetch("/api/privy/get-wallet", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userJwt}`,
          },
        });

        if (!getWalletRes.ok) {
          throw new Error("Failed to fetch wallet");
        }

        const { wallet } = await getWalletRes.json();

        if (wallet) {
          log("Wallet found in database", {
            walletId: wallet.walletId,
            isDeployed: wallet.isDeployed,
          });

          // Wallet exists in DB
          const walletData: PrivyWalletData = {
            walletId: wallet.walletId,
            address: wallet.address,
            publicKey: wallet.publicKey,
            isDeployed: wallet.isDeployed,
          };
          setPrivyWallet(walletData);

          if (wallet.isDeployed) {
            // Wallet is ready
            log("Wallet is already deployed");
            setWalletSetupStep("complete");
          } else {
            // Wallet exists but not deployed - deploy it
            log("Wallet exists but not deployed, deploying...");
            await deployWallet(wallet.walletId, userJwt);
          }
        } else {
          // No wallet exists - create and deploy
          log("No wallet found, creating new wallet...");
          await createAndDeployWallet(userJwt);
        }
      } catch (error: any) {
        log("Error setting up wallet", error);
        toast({
          description:
            error?.message || "Failed to setup wallet. Please try again.",
          variant: "destructive",
        });
        setWalletSetupStep("idle");
        setPrivyWallet(null);
      } finally {
        setIsLoadingWallet(false);
        setupInProgressRef.current = false;
      }
    },
    [
      setPrivyWallet,
      setWalletSetupStep,
      setIsLoadingWallet,
      deployWallet,
      createAndDeployWallet,
    ],
  );

  // Minimal useEffect - only runs when user changes
  useEffect(() => {
    if (!user || typeof window === "undefined") {
      log("User logged out, clearing wallet state");
      setPrivyWallet(null);
      setWalletSetupStep("idle");
      lastUserIdRef.current = null;
      setupInProgressRef.current = false;
      return;
    }

    // Only setup if user changed
    const currentUserId = user.id;
    if (lastUserIdRef.current === currentUserId) {
      log("Same user, skipping wallet setup");
      return;
    }

    lastUserIdRef.current = currentUserId;
    log("User changed, setting up wallet", { userId: currentUserId });

    // Get JWT and setup wallet
    getAccessToken()
      .then((userJwt) => {
        if (!userJwt) {
          log("Failed to get user JWT");
          return;
        }
        setupWallet(userJwt);
      })
      .catch((error) => {
        log("Error getting access token", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const connectWallet = async (modalMode: "canAsk" | "neverAsk" = "canAsk") => {
    try {
      // Ensure we're in a browser environment
      if (typeof window === "undefined") {
        console.warn("Wallet connection attempted in non-browser environment");
        return null;
      }

      const hostname = window.location.hostname;
      const walletConnector = new WalletConnector(isMobile);

      const result = await connect({
        modalMode,
        modalTheme: "light",
        webWalletUrl: "https://web.argent.xyz",
        argentMobileOptions: {
          dappName: "Endur.fi",
          chainId: NETWORK,
          url: hostname,
        },
        dappName: "Endur.fi",
        connectors: walletConnector.getConnectors() as any,
      });

      if (result?.connector) {
        // Disconnect Privy if connected
        if (user) {
          await logout();
          setPrivyWallet(null);
          setWalletSetupStep("idle");
          lastUserIdRef.current = null;
        }
        // Connect using starknet-react
        await connectAsync({ connector: result.connector });
        return result.connector;
      }

      console.warn("No connector returned from starknetkit connect");
      return null;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // Don't throw error for neverAsk mode to avoid breaking auto-connect
      if (modalMode === "neverAsk") {
        return null;
      }
      throw error;
    }
  };

  const connectPrivy = async () => {
    try {
      setIsWalletModalOpen(false);
      // Disconnect Starknet if connected
      if (isStarknetConnected) {
        await disconnect();
        await disconnectAsync();
      }
      login();
    } catch (error) {
      console.error("Failed to login with Privy:", error);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (user) {
        await logout();
        setPrivyWallet(null);
        setWalletSetupStep("idle");
        lastUserIdRef.current = null;
        setupInProgressRef.current = false;
      } else if (isStarknetConnected) {
        await disconnect();
        await disconnectAsync();
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  };

  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
  };

  const handleConnectStarknet = async () => {
    setIsWalletModalOpen(false);
    // Small delay to ensure modal overlay is removed before StarknetKit opens
    await new Promise((resolve) => setTimeout(resolve, 150));
    await connectWallet();
  };

  const handleConnectPrivy = async () => {
    await connectPrivy();
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  return {
    connectWallet,
    connectPrivy,
    disconnectWallet,
    handleConnectWallet,
    handleConnectStarknet,
    handleConnectPrivy,
    handleDisconnect,
    // State
    isConnected,
    isWalletModalOpen,
    setIsWalletModalOpen,
    activeAddress,
    displayAddress,
    connectionType,
    // Wallet setup states
    walletSetupStep,
    isLoadingWallet,
    privyWallet,
    // Privy state
    user,
    privyWallets,
    // Starknet state
    starknetAddress,
    isStarknetConnected,
  };
}
