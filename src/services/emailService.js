const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

exports.sendVerificationCode = async (email, code) => {
      if (!email) throw new Error('Email is required');

    await transporter.sendMail({
        from: `"F5 Online Learning" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification Code',
        html: `<p>Your verification code is: <b>${code}</b></p>`,
    })
}