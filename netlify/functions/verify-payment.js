const crypto = require("crypto");

exports.handler = async (event) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    ebookId,
  } = JSON.parse(event.body);

  const body = razorpay_order_id + "|" + razorpay_payment_id;

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

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
