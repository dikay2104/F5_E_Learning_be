// services/zalopayService.js

const axios = require("axios");
const CryptoJS = require("crypto-js");
const moment = require("moment");

// ENV
const ZP_APP_ID = process.env.ZP_APP_ID;            // app_id
const ZP_KEY1 = process.env.ZP_KEY1;                // key1 (for create order)
const ZP_KEY2 = process.env.ZP_KEY2;                // key2 (for callback verify)
const ZP_CALLBACK_URL = process.env.ZP_CALLBACK_URL;

// ZaloPay API Endpoint (sandbox)
const ZP_ENDPOINT = "https://sandbox.zalopay.com.vn/v001/tpe/createorder";

/**
 * Tạo đơn hàng ZaloPay
 * @param {*} course - course object chứa price, title, _id
 * @param {*} orderId - mã đơn hàng mapping với enrollment
 */
async function createPaymentOrder(course, orderId) {
    try {
        const timestamp = Date.now();

        // Mã giao dịch theo chuẩn ZaloPay
        const appTransId = `${moment().format("YYMMDD")}_${timestamp}`;

        const embedData = { orderId };
        const items = [
            {
                courseId: course._id.toString(),
                courseName: course.title,
                price: course.price
            }
        ];

        // Payload gửi sang ZaloPay
        const payload = {
            app_id: ZP_APP_ID,
            app_trans_id: appTransId,
            app_time: timestamp,
            app_user: "user_default", // tuỳ chỉnh nếu muốn
            amount: course.price,
            item: JSON.stringify(items),
            description: `Payment for course: ${course.title}`,
            embed_data: JSON.stringify(embedData),
            callback_url: ZP_CALLBACK_URL,
            bank_code: ""
        };

        // Chuỗi cần ký Key1
        const dataToSign =
            `${payload.app_id}|${payload.app_trans_id}|${payload.app_user}|${payload.amount}|${payload.app_time}|${payload.embed_data}`;

        payload.mac = CryptoJS.HmacSHA256(dataToSign, ZP_KEY1).toString();

        // Gửi request tạo order
        const response = await axios.post(ZP_ENDPOINT, null, { params: payload });

        return response.data; // trả về order_url, zp_trans_token, return_code...
    } catch (error) {
        console.error("Error creating ZaloPay order:", error.message);
        return null;
    }
}

/**
 * Xác thực callback từ ZaloPay gửi về (dùng KEY2)
 * @param {*} callbackData - object từ req.body
 */
function verifyCallback(callbackData) {
    try {
        const data = { ...callbackData }; // clone
        const mac = data.mac;
        delete data.mac;

        // Chuỗi theo đúng format doc của ZaloPay
        const dataToSign =
            `${data.app_id}|${data.app_trans_id}|${data.app_user}|${data.amount}|${data.app_time}|${data.embed_data}|${data.item}`;

        const expectedMac = CryptoJS.HmacSHA256(dataToSign, ZP_KEY2).toString();

        return mac === expectedMac;
    } catch (error) {
        console.error("ZaloPay verifyCallback error:", error);
        return false;
    }
}

module.exports = {
    createPaymentOrder,
    verifyCallback
};
