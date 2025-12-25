import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/* =========================
   SUPABASE (SERVICE ROLE)
========================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ebookId,
      userId,
      amount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: "Missing payment identifiers" });
    }

    /* =========================
       1️⃣ VERIFY SIGNATURE
    ========================= */
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    /* =========================
       2️⃣ PREVENT DUPLICATES
    ========================= */
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("ebook_id", ebookId)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ success: true });
    }

    /* =========================
       3️⃣ INSERT PURCHASE
    ========================= */
    const { error } = await supabase.from("purchases").insert({
      user_id: userId,
      ebook_id: ebookId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount,
      payment_status: "paid"
    });

    if (error) {
      return res.status(500).json({ error: "DB insert failed" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed" });
  }
}
