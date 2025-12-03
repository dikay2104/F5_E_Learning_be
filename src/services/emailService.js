// services/emailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

exports.sendVerificationCode = async (email, code) => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const html = `
    <div style="font-family: Arial; padding: 20px; background: #f5f7fa;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #e0e0e0;">
        
        <h2 style="color: #1a73e8; text-align: center; margin-bottom: 20px;">
          Learning For Parent
        </h2>

        <p style="font-size: 15px; color: #333;">
          Here is your verification code:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <span style="
            padding: 12px 24px;
            font-size: 26px;
            font-weight: bold;
            color: #1a73e8;
            letter-spacing: 6px;
            background: #e8f1ff;
            border: 1px solid #bcd4ff;
            border-radius: 8px;
            display: inline-block;
          ">
            ${code}
          </span>
        </div>

        <p style="font-size: 14px; color: #555;">
          This code will expire in <b>5 minutes</b>. Please do not share it with anyone.
        </p>

        <hr style="opacity: 0.3; margin: 32px 0;" />

        <p style="font-size: 12px; text-align: center; color: #888;">
          If you did not request this code, you can safely ignore this email.
        </p>

        <p style="font-size: 12px; text-align: center; color: #aaa; margin-top: 8px;">
          © 2025 Learning For Parent. All rights reserved.
        </p>

      </div>
    </div>
  `;

  await apiInstance.sendTransacEmail({
    sender: {
      email: "duykhanhpham2004@gmail.com", 
      name: "Learning For Parent"
    },
    to: [{ email }],
    subject: "Your Verification Code – Learning For Parent",
    htmlContent: html
  });
};
