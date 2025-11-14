const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

// Hàm tạo URL thanh toán
function createPaymentUrl(req, amount, orderInfo, orderId) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    
    const ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    const tmnCode = process.env.VNPAY_TMNCODE;
    const secretKey = process.env.VNPAY_HASHSECRET;
    let vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;
    const locale = 'vn';
    const currCode = 'VND';
    
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId; // Mã tham chiếu của giao dịch
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other'; // Loại hàng hóa
    vnp_Params['vnp_Amount'] = amount * 100; // Số tiền (nhân 100)
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sắp xếp các tham số theo alphabet
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi query và chữ ký
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
}

// Hàm xác thực chữ ký từ VNPay IPN
function verifyReturn(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp lại các tham số
    const sortedParams = sortObject(vnp_Params);
    
    const secretKey = process.env.VNPAY_HASHSECRET;
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 

    return secureHash === signed;
}

// Hàm sắp xếp object
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = { createPaymentUrl, verifyReturn };