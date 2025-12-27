import crypto from "node:crypto";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) {
    return new Response("Webhook secret missing", { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  if (payload.event === "payment.captured") {
    const payment = payload.payload.payment.entity;

    console.log("Webhook received:", payload.event);
    console.log("Order ID:", payment.order_id);

    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/purchases?order_id=eq.${payment.order_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
        body: JSON.stringify({
          payment_status: "paid",
          payment_id: payment.id,
        }),
      }
    );
  }

  return new Response("OK", { status: 200 });
};
