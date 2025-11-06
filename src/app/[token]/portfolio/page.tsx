import React from "react";

import StrkPortfolioPage from "@/features/portfolio/index";
import { TokenProps } from "@/types";

const PortfolioPage: React.FC<TokenProps> = ({ params }) => {
  const { token } = params;

  if (token === "strk") {
    return (
      <div className="h-full w-full">
        <StrkPortfolioPage />
      </div>
    );
  }

  if (token === "btc") {
    return <main className="pb-3">Coming soon</main>;
  }

  return <div>Page not found</div>;
};

export default PortfolioPage;
