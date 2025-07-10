import { ImageResponse } from "next/og";

import { PreviewImage } from "@/components/preview";

export const alt = "Fee Rebate rewards allocation image";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { allocation: string };
}) {
  return new ImageResponse(<PreviewImage allocation={params.allocation} />);
}
