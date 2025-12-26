const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ebookId,
      userId,
      amount,
    } = JSON.parse(event.body || "{}");

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false }),
      };
    }

    const { error } = await supabase.from("purchases").insert({
      user_id: userId,
      ebook_id: ebookId,
      razorpay_order_id,
      razorpay_payment_id,
      amount,
      status: "SUCCESS",
      purchased_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Purchase insert error:", error);
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Verify payment error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false }),
    };
  }
};
