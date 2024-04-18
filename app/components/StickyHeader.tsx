/* eslint-disable react-hooks/exhaustive-deps */
import { stringToU8a, u8aToHex } from "@polkadot/util";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { getAdapter } from "../misc/adapter";
import { getAlephZero } from "../misc/alephZero";
import ActionStarryButton from "./ActionStarryButton";
import StarryButton from "./StarryButton";

const StickyHeader: React.FC = () => {
  const [address, setAddress] = React.useState<string | undefined>();
  const [receiverAddress, setReceiverAddress] = React.useState<string>(
    "5EnRWxJwqLuexBZtbJVTmfAzzc6Fwpw2Gv9AYs1gYHsgvzfH"
  );
  console.log(address);
  useEffect(() => {
    const init = async () => {
      const adapter = await getAdapter();
      // Eager connect
      if (await adapter.canEagerConnect()) {
        try {
          await adapter.connect();
          const publicKey = await adapter.accounts.get();
          if (publicKey.length > 0) {
            setAddress(publicKey[0].address);
          }
        } catch (error) {
          await adapter.disconnect().catch(() => {});
          console.log(error);
        }
      }
    };
    init();
    // Try eagerly connect
  }, []);
  return (
    <header className="fixed top-0 left-0 w-full bg-opacity-50  p-6 z-10">
      <div className="flex items-center justify-between">
        <div>
          {/* <Image
            style={{ width: '200px', cursor: 'pointer' }}
            src={NightlyLogo}
            alt='logo'
            onClick={() => {
              // redirect to nightly.app
              window.location.href = 'https://nightly.app'
            }}
          /> */}
        </div>
        <div className="flex flex-col space-y-4 justify-end items-end">
          <StarryButton
            connected={address !== undefined}
            onConnect={async () => {
              const adapter = await getAdapter();
              try {
                await adapter.connect();
                const publicKey = await adapter.accounts.get();
                if (publicKey.length > 0) {
                  setAddress(publicKey[0].address);
                  console.log(publicKey[0].address);
                }
              } catch (error) {
                await adapter.disconnect().catch(() => {});
                console.log(error);
              }
            }}
            onDisconnect={async () => {
              try {
                const adapter = await getAdapter();
                await adapter.disconnect();
                setAddress(undefined);
              } catch (error) {
                console.log(error);
              }
            }}
            publicKey={address}
          />
          {address && (
            <>
              <ActionStarryButton
                onClick={async () => {
                  const signMessage = async () => {
                    const message = stringToU8a("I love Nightly 🦊");
                    const adapter = await getAdapter();
                    const _signed = await adapter.signer.signRaw!({
                      address: address,
                      data: u8aToHex(message),
                      type: "bytes",
                    });
                  };
                  // TODO add validation
                  toast.promise(signMessage, {
                    loading: "Signing message...",
                    success: (_) => {
                      return `Message signed!`;
                    },
                    error: "Operation has been rejected!",
                  });
                }}
                name="Sign Message"
              ></ActionStarryButton>
              <div className="mt-10">
                <div className="flex flex-col gap-4 items-end">
                  <h4 className="text-slate-100">Send to: </h4>
                  <div>
                    <button
                      onClick={() =>
                        setReceiverAddress(
                          "5EnRWxJwqLuexBZtbJVTmfAzzc6Fwpw2Gv9AYs1gYHsgvzfH"
                        )
                      }
                      className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    >
                      Reset example address
                    </button>
                  </div>
                  <input
                    type="text"
                    id="first_name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Receiver Address"
                    required
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                  />

                  <ActionStarryButton
                    onClick={async () => {
                      const signTransaction = async () => {
                        const RECEIVER =
                          "5EnRWxJwqLuexBZtbJVTmfAzzc6Fwpw2Gv9AYs1gYHsgvzfH";

                        const api = await getAlephZero();
                        const adapter = await getAdapter();

                        const tx = await api.tx.balances.transferAllowDeath(
                          receiverAddress,
                          5_000_000_000
                        );

                        const signedTx = await tx.signAsync(address, {
                          signer: adapter.signer as any,
                        });
                        const txId = await signedTx.send();

                        toast.success("Transaction send!", {
                          action: {
                            label: "Show Transaction",
                            onClick: () => {
                              window.open(
                                `https://alephzero-testnet.subscan.io/extrinsic/${txId.toString()}`,
                                "_blank"
                              );
                            },
                          },
                        });
                      };
                      toast.promise(signTransaction, {
                        loading: "Signing Transaction...",
                        success: (_) => {
                          return `Transaction signed!`;
                        },
                        error: "Operation has been rejected!",
                      });
                    }}
                    name="Send Testnet Transaction"
                  ></ActionStarryButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default StickyHeader;
