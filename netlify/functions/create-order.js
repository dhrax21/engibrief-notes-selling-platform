const Razorpay = require("razorpay");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { amount } = JSON.parse(event.body);

  if (typeof amount !== "number" || amount < 1) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Minimum ₹1 required" }),
    };
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    }),
  };
};
