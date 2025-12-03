// services/emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendVerificationCode = async (email, code) => {
  if (!email) throw new Error('Email is required');

  const html = `
  <div style="
      font-family: Arial, sans-serif; 
      background: #f5f7fa;
      padding: 24px;
  ">
    <div style="
        max-width: 480px; 
        margin: auto; 
        background: #ffffff; 
        border-radius: 10px;
        padding: 32px;
        border: 1px solid #e6e6e6;
    ">
      <h2 style="text-align: center; color: #1a73e8; margin-bottom: 24px;">
        F5 Online Learning
      </h2>

      <p style="font-size: 15px; color: #333;">
        Here is your verification code:
      </p>

      <div style="
          text-align: center; 
          margin: 24px 0;
      ">
        <span style="
            display: inline-block;
            padding: 12px 24px;
            font-size: 26px;
            letter-spacing: 6px;
            font-weight: bold;
            color: #1a73e8;
            background: #f0f6ff;
            border: 1px solid #d0e3ff;
            border-radius: 8px;
        ">
          ${code}
        </span>
      </div>

      <p style="font-size: 14px; color: #555;">
        This verification code will expire in <b>5 minutes</b>.  
        Please do not share it with anyone.
      </p>

      <hr style="margin: 32px 0; opacity: 0.3;" />

      <p style="font-size: 12px; color: #888; text-align: center;">
        If you did not request this code, please ignore this email.
      </p>

      <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 8px;">
        © 2025 F5 Online Learning. All rights reserved.
      </p>
    </div>
  </div>
  `;

  await resend.emails.send({
    from: `"F5 Online Learning" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Your Verification Code",
    html,
  });
};
