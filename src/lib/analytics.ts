import { userAddressAtom } from "@/store/common.store";
import { getDefaultStore } from "jotai";
import mixpanel from "mixpanel-browser";

const JOTAI_STORE = getDefaultStore();

export class MyAnalytics {
  static init() {
    try {
      mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!);
    } catch (e) {
      console.warn("Failed to initialize mixpanel", e);
    }
  }

  static track(eventName: string, props: any) {
    try {
      const distinct_id = JOTAI_STORE.get(userAddressAtom);
      let _props = props;
      if (distinct_id) {
        _props = { ...props, $distinct_id: distinct_id };
      }
      mixpanel.track(eventName, _props);
    } catch (e) {
      console.warn("Failed to track event", e);
    }
  }

  static setPerson(address: string) {
    mixpanel.identify(address);
    mixpanel.people.set({ $distinct_id: address, address });
  }
}
