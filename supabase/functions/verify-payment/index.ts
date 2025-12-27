import crypto from "node:crypto";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = await req.json();

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", Deno.env.get("RAZORPAY_KEY_SECRET")!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return new Response(
      JSON.stringify({ verified: false }),
      { status: 400, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ verified: true }),
    { status: 200, headers: corsHeaders }
  );
});
