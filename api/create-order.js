import RazorpayPkg from "razorpay";

const Razorpay = RazorpayPkg.default || RazorpayPkg;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount } = req.body;

    const price = Number(amount);
    if (!price || price < 100) {
      return res.status(400).json({
        error: "Amount must be at least 100 paise (₹1)"
      });
    }

    const order = await razorpay.orders.create({
      amount: price,
      currency: "INR",
      receipt: `order_${Date.now()}`
    });

    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ error: "Order creation failed" });
  }
}
