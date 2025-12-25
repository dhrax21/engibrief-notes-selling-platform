const Razorpay = require("razorpay");

exports.handler = async (event) => {
  try {
    // Allow only POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { Allow: "POST" },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body missing" }),
      };
    }

    const { amount } = JSON.parse(event.body);

    // Amount validation (₹)
    if (typeof amount !== "number" || amount < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Amount must be at least ₹1",
        }),
      };
    }

    // Env validation
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Razorpay keys not configured",
        }),
      };
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Convert rupees → paise (ONCE)
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      }),
    };
  } catch (error) {
    console.error("Razorpay create-order error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Order creation failed",
        message: error.message,
      }),
    };
  }
};
