import React from "react";

import StrkPortfolioPage from "@/components/strk-portfolio-page";

import { TokenProps } from "../page";

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
