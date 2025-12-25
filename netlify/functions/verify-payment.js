const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing body" }),
      };
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ebookId,
    } = JSON.parse(event.body);

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing payment fields" }),
      };
    }

    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Compare signatures
    if (expectedSignature !== razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid payment signature" }),
      };
    }

    // ✅ PAYMENT VERIFIED
    // Here you can:
    // - store purchase in DB
    // - unlock ebook
    // - send email

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ebookId,
      }),
    };
  } catch (error) {
    console.error("Verify payment error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Payment verification failed",
      }),
    };
  }
};
