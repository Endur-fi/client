import { ImageResponse } from "next/og";

import { PreviewImage } from "@/components/preview";
// import { PreviewImageDynamic } from "@/components/preview-image-dynamic";

export const size = {
  width: 256,
  height: 256,
};

export default async function Image({
  params,
}: {
  params: { allocation: string };
}) {
  // this is working ⬇️
  // return new ImageResponse(<PreviewImageDynamic allocation={params.allocation} />);

  // this is not working ⬇️
  return new ImageResponse(<PreviewImage allocation={params.allocation} />);
}
