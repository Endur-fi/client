import React from "react";

import Defi from "@/components/defi";
import BtcDefi from "@/components/btc-defi";
import { TokenProps } from "@/types";

const DefiPage: React.FC<TokenProps> = ({ params }) => {
  const { token } = params;

  if (token === "strk") {
    return (
      <main className="pb-3">
        <Defi />
      </main>
    );
  }

  if (token === "btc") {
    return (
      <main className="pb-3">
        <BtcDefi />
      </main>
    );
  }

  return <div>Page not found</div>;
};

export default DefiPage;
