const Razorpay = require("razorpay");

exports.handler = async (event) => {
  try {
    // 1️⃣ Allow only POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { Allow: "POST" },
        body: "Method Not Allowed",
      };
    }

    // 2️⃣ Ensure body exists
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body missing" }),
      };
    }

    // 3️⃣ Parse request
    const { amount } = JSON.parse(event.body);

    if (typeof amount !== "number" || amount < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid amount" }),
      };
    }

    // 4️⃣ Ensure env vars exist
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Razorpay keys not configured" }),
      };
    }

    // 5️⃣ Init Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 6️⃣ Create order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // 7️⃣ Success response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
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
