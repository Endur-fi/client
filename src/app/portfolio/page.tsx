import { NextPage } from "next";

import { getProvider } from "@/constants";

import PortfolioPage from "./_components/portfolio-page";

const Portfolio: NextPage = async () => {
  const provider = getProvider();
  const currentBlockNumber = await provider.getBlockNumber();
  const oldBlockNumber = currentBlockNumber - 1000;

  const currentBlockInfo = await provider.getBlockWithTxs(currentBlockNumber);
  const oldBlockInfo = await provider.getBlockWithTxs(oldBlockNumber);

  const avgWaitTime =
    (currentBlockInfo.timestamp - oldBlockInfo.timestamp) / 1000;

  const blockBefore1Day =
    currentBlockNumber - Math.floor((1 * 24 * 60 * 60) / avgWaitTime);

  const blockBefore7Day =
    currentBlockNumber - Math.floor((7 * 24 * 60 * 60) / avgWaitTime);

  const blockBefore30Day =
    currentBlockNumber - Math.floor((30 * 24 * 60 * 60) / avgWaitTime);

  const blockBefore90Day =
    currentBlockNumber - Math.floor((90 * 24 * 60 * 60) / avgWaitTime);

  const blockBefore180Day =
    currentBlockNumber - Math.floor((180 * 24 * 60 * 60) / avgWaitTime);

  return (
    <div className="h-full w-full">
      <PortfolioPage
        blockBefore1Day={blockBefore1Day}
        blockBefore7Day={blockBefore7Day}
        blockBefore30Day={blockBefore30Day}
        blockBefore90Day={blockBefore90Day}
        blockBefore180Day={blockBefore180Day}
      />
    </div>
  );
};

export default Portfolio;
