// services/payosService.js

const axios = require("axios");
const crypto = require("crypto");

const CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const API_KEY = process.env.PAYOS_API_KEY;
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;

const PAYOS_URL = "https://api-merchant.payos.vn/v2/payment-requests";

/**
 * Tạo checksum PayOS: SHA256(key=value&key=value...)
 */
function createChecksum(params, checksumKey) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join("&");

  return crypto.createHmac("sha256", checksumKey).update(sorted).digest("hex");
}

async function createPaymentUrl(orderCode, amount, description, returnUrl, cancelUrl) {
  const body = {
    orderCode,
    amount,
    description,
    returnUrl,
    cancelUrl,
  };

  // Tạo checksum đúng chuẩn
  body.signature = createChecksum(body, CHECKSUM_KEY);

  const headers = {
    "x-client-id": CLIENT_ID,
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
  };

  const res = await axios.post(PAYOS_URL, body, { headers });

  if (!res.data?.data?.checkoutUrl) {
    console.error("PayOS error:", res.data);
    throw new Error("PayOS did not return checkoutUrl");
  }

  return res.data.data.checkoutUrl;
}

module.exports = { createPaymentUrl };
