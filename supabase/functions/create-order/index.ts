import Razorpay from "https://esm.sh/razorpay@2.9.4";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();

    if (!amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET")!,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
    });

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Create order failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
