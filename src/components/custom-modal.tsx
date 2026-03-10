import { useLogin, useLogout, useUser } from "@privy-io/react-auth";
import { Connector, useConnect } from "@starknet-react/core";
import { type PropsWithChildren, useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePrivyConnection } from "@/hooks/use-privy-connection";

export function CustomModal({ children }: PropsWithChildren) {
  // const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { logout } = useLogout();
  const { user } = useUser();
  const { login } = useLogin();

  const availableConnectors = useMemo(
    () => connectors.filter((connector) => connector.available),
    [connectors],
  );

  usePrivyConnection();

  function handleConnection(connector: Connector) {
    if (connector.id === "email_google") {
      if (!user?.id) {
        login();
      } else {
        logout(); // TODO: remove this else block
      }
    } else {
      connect({ connector });
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Connect To <br /> Endur.fi
          </DialogTitle>
          <DialogDescription>
            <div className="flex flex-col gap-2">
              {availableConnectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnection(connector)}
                  className="rounded-lg bg-blue-600 p-4 text-white transition-colors hover:bg-blue-700"
                >
                  Connect with {connector.name}
                </button>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
