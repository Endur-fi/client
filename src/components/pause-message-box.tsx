import Link from "next/link";
import React from "react";

const PausedMessageBox: React.FC = () => (
  <div className="-top-[3.25rem] mt-2 w-fit text-balance rounded-lg border border-amber-600 bg-amber-200 px-5 py-2 text-center text-sm text-yellow-700 lg:absolute lg:mt-0">
    Endur is currently undergoing a scheduled upgrade to support Staking V3.{" "}
    <Link
      href="https://x.com/endurfi/status/1966140807968338110"
      target="_blank"
      className="text-blue-500 transition-all hover:underline"
    >
      Learn more
    </Link>
  </div>
);

export default PausedMessageBox;
