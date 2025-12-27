import Razorpay from "https://esm.sh/razorpay@2.9.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, ebookId } = await req.json();

    if (!amount || amount < 100 || !ebookId) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // user auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!
          }
        }
      }
    );

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET")!,
    });

      const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `eb_${ebookId.slice(0, 6)}_${user.id.slice(0, 6)}`,
    });


    // store pending purchase
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await admin.from("purchases").insert({
      user_id: user.id,
      ebook_id: ebookId,
      amount,
      order_id: order.id,
      payment_status: "pending",
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
