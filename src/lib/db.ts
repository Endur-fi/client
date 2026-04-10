import { connect, model, models, Schema, type Mongoose } from "mongoose";

let connection: Mongoose | null = null;

// Connect to MongoDB Atlas
export async function connectDB() {
  if (connection) return connection;

  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    throw Error("Database URI not provided in variables");
  }

  try {
    connection = await connect(dbUri);
    return connection;
  } catch (error) {
    console.log("Unable to connect database:", error);
  }
}

// Wallet model
const walletSchema = new Schema(
  {
    privyUserId: { type: String, required: [true, "Please enter privyUserId"] },
    walletId: { type: String, required: [true, "Please enter walletId"] },
    address: { type: String, required: [true, "Please enter address"] },
    publicKey: { type: String, required: [true, "Please enter publicKey"] },
    isDeployed: { type: Boolean, required: [true, "Please enter isDeployed"] },
  },
  { timestamps: true },
);

export const WalletModel = models.wallets ?? model("wallets", walletSchema);
