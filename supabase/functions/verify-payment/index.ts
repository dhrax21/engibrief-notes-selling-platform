import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import crypto from "node:crypto";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ebookId,
      userId,
      amount,
    } = payload;

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

  const { error } = await supabase
  .from("purchases")
  .upsert(
    {
      user_id: userId,
      ebook_id: ebookId,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount,
      payment_status: "paid",
    },
    { onConflict: "user_id,ebook_id" }
  );


    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: corsHeaders }
    );
  }
});
