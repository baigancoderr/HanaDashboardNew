import { useEffect, useRef, useState } from "react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
  useAppKitNetwork,
} from "@reown/appkit/react";
import { bscTestnet } from "@reown/appkit/networks";
import { isAddress, getAddress } from "ethers";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Wallet,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  referralStorageKey,
  dummyRegistrationStorageKey,
} from "../dashboard/referralStorage";
import {
  useIsRegistered,
  useRegisterWallet,
} from "../contracts/hooks";
import {
  BSC_TESTNET_CHAIN_ID,
  getExplorerTxUrl,
  ZERO_ADDRESS,
} from "../contracts/config";
import "./AuthPage.css";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const [searchParams] = useSearchParams();
  const [referral, setReferral] = useState(searchParams.get("ref") ?? "");
  const [localError, setLocalError] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disconnectPending, setDisconnectPending] = useState(false);
  const [switchPending, setSwitchPending] = useState(false);
  const modalWasOpen = useRef(false);

  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });
  const { open: modalOpen } = useAppKitState();
  const { disconnect } = useDisconnect();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const navigate = useNavigate();

  // On-chain registration checks and register action
  const {
    isRegistered,
    isLoading: isCheckingRegistration,
    refetch: refetchRegistration,
  } = useIsRegistered(address);

  const {
    register: executeRegister,
    step: registerStep,
    error: registerError,
    txHash,
  } = useRegisterWallet();

  const isWrongNetwork = isConnected && Number(chainId) !== BSC_TESTNET_CHAIN_ID;

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setLocalError("");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDisconnect = async () => {
    setLocalError("");
    setPending(false);
    setCopied(false);
    setDisconnectPending(true);
    try {
      await disconnect();
    } catch (disconnectError) {
      setLocalError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Could not disconnect wallet."
      );
    } finally {
      setDisconnectPending(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setSwitchPending(true);
    try {
      if (switchNetwork) {
        await switchNetwork(bscTestnet);
      }
    } catch (err) {
      console.warn("Could not switch network:", err);
    } finally {
      setSwitchPending(false);
    }
  };

  const handleConnect = async () => {
    setLocalError("");
    if (isConnected && address) {
      if (!isRegister) {
        if (isRegistered) {
          navigate("/dashboard");
        } else {
          navigate("/register");
        }
      }
      return;
    }

    setPending(true);
    try {
      await open({ view: "Connect", namespace: "eip155" });
    } catch (connectError) {
      setPending(false);
      setLocalError(
        connectError instanceof Error
          ? connectError.message
          : "Could not open wallet connection."
      );
    }
  };

  // Keep track of AppKit modal open state
  useEffect(() => {
    if (!pending) {
      modalWasOpen.current = false;
      return;
    }

    if (isConnected && address && !isCheckingRegistration) {
      modalWasOpen.current = false;
      setPending(false);
      return;
    }

    if (modalOpen) {
      modalWasOpen.current = true;
    } else if (modalWasOpen.current) {
      modalWasOpen.current = false;
      setPending(false);
    }
  }, [address, isConnected, modalOpen, pending, isCheckingRegistration]);

  // Handle on-chain registration submit
  const handleRegister = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!isConnected || !address) {
      setLocalError("Connect your wallet before creating your account.");
      return;
    }

    let finalReferrer = ZERO_ADDRESS;
    if (referral.trim() !== "") {
      try {
        if (!isAddress(referral.trim())) {
          setLocalError("Enter a valid EVM referral wallet address or leave blank.");
          return;
        }
        finalReferrer = getAddress(referral.trim());
        if (finalReferrer.toLowerCase() === address.toLowerCase()) {
          setLocalError("You cannot refer your own wallet address.");
          return;
        }
      } catch {
        setLocalError("Enter a valid EVM referral wallet address.");
        return;
      }
    } else {
      if (finalReferrer.toLowerCase() === address.toLowerCase()) {
        finalReferrer = "0x0000000000000000000000000000000000000000";
      }
    }

    try {
      await executeRegister(address, finalReferrer);
      await refetchRegistration();
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  const activeError = localError || registerError;

  return (
    <main className="hana-auth">
      <div className="hana-auth__backdrop" aria-hidden="true" />
      <div className="hana-auth__layout">
        <section className="hana-auth__story" aria-label="Welcome to HANA">
          <Link className="hana-auth__logo" to="/" aria-label="HANA home">
            <img src={logo} alt="HANA Decentralized Token" />
          </Link>
          <div className="hana-auth__story-copy">
            <span className="hana-auth__eyebrow">
              <span className="hana-auth__eyebrow-dot" />
              BSC Testnet · HANA Smart Contracts
            </span>
            <h1>
              {isRegister ? (
                <>Make your move <span>count.</span></>
              ) : (
                <>Welcome back to <span>HANA.</span></>
              )}
            </h1>
            <p>
              {isRegister
                ? "Create your on-chain account with a secure wallet connection to participate in HANA staking and decentralized rewards."
                : "Connect your wallet to securely access your HANA dashboard and active staking positions."}
            </p>
          </div>
          <div className="hana-auth__trust">
            <div className="hana-auth__trust-icon"><ShieldCheck size={19} /></div>
            <div>
              <strong>Verified Staking Contract</strong>
              <span>Direct BSC Testnet smart contract registration. Zero custodial risk.</span>
            </div>
          </div>
        </section>

        <section className="hana-auth__panel" aria-labelledby="hana-auth-title">
          <Link className="hana-auth__mobile-logo" to="/" aria-label="HANA home">
            <img src={logo} alt="HANA Decentralized Token" />
          </Link>
          <Link className="hana-auth__back" to="/">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="hana-auth__form-wrap">
            <div className="hana-auth__tabs" aria-label="Account access">
              <Link
                className={!isRegister ? "is-active" : ""}
                to="/login"
                aria-current={!isRegister ? "page" : undefined}
              >
                Login
              </Link>
              <Link
                className={isRegister ? "is-active" : ""}
                to="/register"
                aria-current={isRegister ? "page" : undefined}
              >
                Create account
              </Link>
            </div>

            <div className="hana-auth__heading">
              <span className="hana-auth__heading-icon">
                {isRegister ? <Wallet size={20} /> : <LockKeyhole size={20} />}
              </span>
              <div>
                <h2 id="hana-auth-title">
                  {isRegister ? "Join HANA Staking" : "Sign in to HANA"}
                </h2>
                <p>
                  {isRegister
                    ? "Register your wallet on the Staking contract."
                    : "Your wallet is your secure decentralized ID."}
                </p>
              </div>
            </div>

            {isRegister && (
              <div className="hana-auth__steps" aria-label="Registration steps">
                <span className={isConnected ? "is-complete" : "is-current"}>
                  <CheckCircle2 size={15} /> Wallet
                </span>
                <i />
                <span className={isConnected && !isRegistered ? "is-current" : isRegistered ? "is-complete" : ""}>
                  Register
                </span>
                <i />
                <span className={isRegistered ? "is-complete" : ""}>Dashboard</span>
              </div>
            )}

            {/* Wallet Info Box */}
            <div className="hana-auth__wallet">
              <span className="hana-auth__wallet-mark"><Wallet size={18} /></span>
              <div className="hana-auth__wallet-info">
                <strong>{isConnected ? "Wallet connected" : "Connect your wallet"}</strong>
                {isConnected && address ? (
                  <div className="hana-auth__address-row">
                    <span className="hana-auth__address" title={address}>
                      {address.slice(0, 10)}...{address.slice(-8)}
                    </span>
                    <button
                      aria-label={copied ? "Wallet address copied" : "Copy full wallet address"}
                      className={`hana-auth__copy ${copied ? "is-copied" : ""}`}
                      onClick={handleCopyAddress}
                      title={copied ? "Copied!" : "Copy full wallet address"}
                      type="button"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ) : (
                  <span>Secure Web3 connection (BSC Testnet)</span>
                )}
              </div>
              <span
                className={`hana-auth__status ${isConnected ? "is-connected" : ""}`}
                aria-label={isConnected ? "Connected" : "Not connected"}
              />
            </div>

            {/* Network Warning Banner */}
            {isWrongNetwork && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-[#FFB51D]" />
                  <span>Switch network to BSC Testnet (Chain ID 97)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchNetwork}
                  disabled={switchPending}
                  className="rounded bg-[#FFB51D] px-2.5 py-1 text-[11px] font-bold text-black hover:brightness-110 disabled:opacity-50"
                >
                  {switchPending ? "Switching..." : "Switch"}
                </button>
              </div>
            )}

            {/* Registration State or Form */}
            {isRegister ? (
              isConnected && isRegistered ? (
                <div className="hana-auth__form">
                  <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
                    <h3 className="text-base font-bold text-white">Wallet Already Registered!</h3>
                    <p className="mt-1 text-xs text-neutral-300">
                      This address is already registered in the HANA Staking contract.
                    </p>
                  </div>
                  <div className="hana-auth__actions mt-4">
                    <button
                      className="hana-auth__submit"
                      type="button"
                      onClick={() => navigate("/dashboard")}
                    >
                      Proceed to Dashboard <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <form className="hana-auth__form" onSubmit={handleRegister}>
                  <label htmlFor="hana-referral">
                    Referral wallet address <span className="text-xs text-neutral-400">(optional)</span>
                  </label>
                  <input
                    autoComplete="off"
                    id="hana-referral"
                    onChange={(event) => {
                      setReferral(event.target.value);
                      setLocalError("");
                    }}
                    placeholder="0x... (leave empty if no referrer)"
                    spellCheck="false"
                    value={referral}
                    disabled={registerStep === "submitting" || registerStep === "confirming"}
                  />
                  <span className="hana-auth__hint">
                    Enter the wallet address of the member who referred you, or leave blank to register directly.
                  </span>

                  {/* Registering Status Steps */}
                  {registerStep !== "idle" && registerStep !== "error" && (
                    <div className="my-3 rounded-lg border border-[#FFB51D]/30 bg-[#FFB51D]/10 p-3 text-xs text-[#FFB51D] flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin shrink-0" />
                      <span>
                        {registerStep === "checking" && "Validating network and parameters..."}
                        {registerStep === "submitting" && "Please confirm the transaction in your wallet..."}
                        {registerStep === "confirming" && "Transaction submitted! Waiting for BSC Testnet block confirmation..."}
                        {registerStep === "success" && "Registered successfully! Loading your dashboard..."}
                      </span>
                    </div>
                  )}

                  {txHash && (
                    <a
                      href={getExplorerTxUrl(txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="my-2 inline-flex items-center gap-1.5 text-xs text-[#FFB51D] underline hover:brightness-110"
                    >
                      <span>View transaction on BSCScan</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {activeError && (
                    <p className="hana-auth__error" role="alert">
                      {activeError}
                    </p>
                  )}

                  <div className="hana-auth__actions">
                    {isConnected ? (
                      <button
                        className="hana-auth__submit"
                        type="submit"
                        disabled={
                          registerStep === "submitting" ||
                          registerStep === "confirming" ||
                          isCheckingRegistration
                        }
                      >
                        {registerStep === "submitting" || registerStep === "confirming" ? (
                          <>
                            <Loader2 size={18} className="animate-spin" /> Registering on BSC...
                          </>
                        ) : (
                          <>
                            Register On-Chain <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        className="hana-auth__submit"
                        disabled={pending}
                        onClick={handleConnect}
                        type="button"
                      >
                        {pending ? "Waiting for wallet..." : "Connect wallet"} <ArrowRight size={18} />
                      </button>
                    )}

                    {isConnected && (
                      <button
                        className="hana-auth__disconnect"
                        disabled={disconnectPending}
                        onClick={handleDisconnect}
                        type="button"
                      >
                        <LogOut size={15} />
                        {disconnectPending ? "Disconnecting..." : "Disconnect wallet"}
                      </button>
                    )}
                  </div>
                </form>
              )
            ) : (
              <div className="hana-auth__form">
                <p className="hana-auth__description">
                  Connect your Web3 wallet to access your HANA staking account and positions on BSC Testnet.
                </p>

                {isConnected && !isCheckingRegistration && (
                  <div className="my-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
                    {isRegistered ? (
                      <p className="text-green-400 flex items-center gap-1.5">
                        <CheckCircle2 size={15} /> Account registered on Staking Contract
                      </p>
                    ) : (
                      <p className="text-amber-400 flex items-center gap-1.5">
                        <AlertCircle size={15} /> This wallet is not registered yet.
                      </p>
                    )}
                  </div>
                )}

                {activeError && <p className="hana-auth__error" role="alert">{activeError}</p>}

                <div className="hana-auth__actions">
                  <button
                    className="hana-auth__submit"
                    disabled={pending || isCheckingRegistration}
                    onClick={handleConnect}
                    type="button"
                  >
                    {pending
                      ? "Waiting for wallet..."
                      : isConnected
                      ? isRegistered
                        ? "Enter Dashboard"
                        : "Go to Register"
                      : "Connect wallet"}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="hana-auth__security">
              <ShieldCheck size={15} />
              <span>BSC Testnet (Chain ID 97) · Non-Custodial</span>
            </div>
            <p className="hana-auth__switch">
              {isRegister ? "Already part of HANA?" : "New to HANA?"}{" "}
              <Link to={isRegister ? "/login" : "/register"}>
                {isRegister ? "Login instead" : "Create an account"}
              </Link>
            </p>
          </div>
          <p className="hana-auth__copyright">© {new Date().getFullYear()} HANA Ecosystem</p>
        </section>
      </div>
    </main>
  );
}
