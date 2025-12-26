import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import crypto from "node:crypto";

Deno.serve(async (req) => {
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
        { status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("purchases").insert({
      user_id: userId,
      ebook_id: ebookId,
      razorpay_order_id,
      razorpay_payment_id,
      amount,
      status: "SUCCESS",
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Verify payment error:", err);
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500 }
    );
  }
});
