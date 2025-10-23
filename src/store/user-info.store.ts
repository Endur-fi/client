import axios from "axios";
import { atomWithQuery } from "jotai-tanstack-query";

import { userAddressAtom } from "./common.store";
import { referralCodeAtom } from "./referral.store";

//TODO: not used anywhere - remove
export const UserInfoAtom = atomWithQuery((get) => {
  return {
    // we use referral code atom as key to ensure user exisits in db by then
    queryKey: ["tnc", get(userAddressAtom), get(referralCodeAtom)],
    queryFn: async (): Promise<any> => {
      const address: string | undefined = get(userAddressAtom);

      if (!address) return null;

      const res = await axios.get(`/api/getUser/${address}`);
      return res.data;
    },
  };
});
