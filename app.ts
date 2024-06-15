import express from "express";
import authRoutes from "./routes/authRoutes";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";
import postRoutes from "./routes/postRoutes";
import { createServer } from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import Stripe from "stripe";
const app = express();
const server = createServer(app);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
import { supabase } from "./db/supabase";
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL!,
    methods: ["GET", "POST"],
  },
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

app.use(cors());
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    config: {
      callbackUrl: "http://localhost:3000/post/create",
    },
  })
);
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});



app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event = req.body;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("event", event.type);
    } catch (err) {
      console.error(err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntentSucceeded = event.data.object;
          console.log("PaymentIntent was successful!", paymentIntentSucceeded);
          let receipt_email = paymentIntentSucceeded.receipt_email;
          const { data , error } = await supabase
          .from("users")
          .select("*")
          .eq("email", receipt_email)
          if (error) {
            console.error("Error verifying user:", error);
            return res.status(500).json({ error: "Internal server error" });
          }
          const transaction_id = paymentIntentSucceeded.id;
          const { data:boughtgifts, error:gifterror } = await supabase
          .from("gifts")
          .insert({
            id: transaction_id,
            gift_id: 1,
            buyer_id: data[0].id,
          })
          if (gifterror) {
            console.error("Error verifying user:", gifterror);
            return res.status(500).json({ error: "Internal server error" });
          }
          return res.send();
      }
    } catch (error) {
      console.log(error);
    }
  }
);



app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", postRoutes);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
