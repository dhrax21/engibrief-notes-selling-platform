const Razorpay = require("razorpay");

exports.handler = async (event) => {
  try {
    // 1. Validate HTTP method
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    // 2. Parse amount from frontend
    const { amount } = JSON.parse(event.body);

    if (!amount || amount < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid amount" }),
      };
    }

    // 3. Initialize Razorpay using Netlify env vars
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 4. Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // INR → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // 5. Return order to frontend
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    };

  } catch (error) {
    console.error("Create order error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to create order",
        details: error.message,
      }),
    };
  }
};
