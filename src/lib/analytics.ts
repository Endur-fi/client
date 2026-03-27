import { userAddressAtom } from "@/store/common.store";
import { getDefaultStore } from "jotai";
import mixpanel from "mixpanel-browser";

const JOTAI_STORE = getDefaultStore();

const isBrowser = typeof window !== "undefined";

function isAnalyticsEnabled() {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return false;

  return true;
}

export class MyAnalytics {
  static init() {
    if (!isBrowser || !isAnalyticsEnabled()) return;

    try {
      mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!);
    } catch (e) {
      console.warn("Failed to initialize mixpanel", e);
    }
  }

  static track(eventName: string, props: any) {
    if (!isBrowser || !isAnalyticsEnabled()) return;

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
    if (!isBrowser || !isAnalyticsEnabled()) return;

    try {
      mixpanel.identify(address);
      mixpanel.people.set({ $distinct_id: address, address });
    } catch (e) {
      console.warn("Failed to set person", e);
    }
  }
}

