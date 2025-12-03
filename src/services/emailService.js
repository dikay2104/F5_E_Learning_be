// services/emailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

exports.sendVerificationCode = async (email, code) => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const html = `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #1a73e8;">F5 Online Learning</h2>
      <p>Your verification code:</p>
      <div style="padding: 12px; border: 1px solid #1a73e8; border-radius: 8px; display: inline-block;">
        <span style="font-size: 26px; font-weight: bold; color: #1a73e8; letter-spacing: 4px;">
          ${code}
        </span>
      </div>
      <p>This code will expire in 5 minutes. Do not share it with anyone.</p>
    </div>
  `;

  await apiInstance.sendTransacEmail({
    sender: {
      email: "duykhanhpham2004@gmail.com", // Bạn có thể dùng email cá nhân
      name: "F5 Online Learning"
    },
    to: [{ email }],
    subject: "Your Verification Code",
    htmlContent: html
  });
};
