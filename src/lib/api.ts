import axios from "axios";

export const checkSubscription = async (address: string) => {
  try {
    const response = await axios.post("/api/check-subscription", { address });
    return response.data;
  } catch (error) {
    console.error("Error checking subscription:", error);
    throw error;
  }
};

export const subscribeUser = async (
  email: string,
  address: string,
  listIDs: number[],
) => {
  try {
    const response = await axios.post("/api/send-email", {
      email,
      address,
      listIDs,
    });
    return response.data;
  } catch (error) {
    console.error("Error subscribing user:", error);
    throw error;
  }
};
