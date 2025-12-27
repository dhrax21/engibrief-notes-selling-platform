import crypto from "node:crypto";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  console.log("VERIFY PAYMENT HIT");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", Deno.env.get("RAZORPAY_KEY_SECRET")!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await admin
      .from("purchases")
      .update({
        payment_status: "paid",
        payment_id: razorpay_payment_id,
        purchased_at: new Date().toISOString(),
      })
      .eq("order_id", razorpay_order_id)
      .eq("payment_status", "pending")
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Order ID not found or already processed");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: corsHeaders }
    );
  }
});
