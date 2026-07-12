import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.js";

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET
      })
    : null;

export async function createRazorpayOrder(amountRupees: number, receipt: string) {
  const amount = Math.round(amountRupees * 100);
  if (!razorpay) {
    return {
      id: `mock_order_${Date.now()}`,
      amount,
      currency: "INR",
      receipt,
      mocked: true
    };
  }

  return razorpay.orders.create({
    amount,
    currency: "INR",
    receipt,
    payment_capture: true
  });
}

export function verifyRazorpaySignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  if (input.razorpayOrderId.startsWith("mock_order_")) return true;
  if (!env.RAZORPAY_KEY_SECRET) throw new AppError(500, "Razorpay is not configured");

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.razorpaySignature));
}

export async function refundPayment(paymentId: string, amountRupees?: number) {
  if (!razorpay) {
    return {
      id: `mock_refund_${Date.now()}`,
      paymentId,
      amount: amountRupees ? Math.round(amountRupees * 100) : undefined,
      mocked: true
    };
  }
  return razorpay.payments.refund(paymentId, {
    amount: amountRupees ? Math.round(amountRupees * 100) : undefined
  });
}
