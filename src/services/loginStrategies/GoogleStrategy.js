const ILoginStrategy = require('./ILoginStrategy');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Sử dụng từ biến môi trường
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

class GoogleStrategy extends ILoginStrategy {
  async login(req) {
    const { token } = req.body;
    console.log(token);
    if (!token) throw new Error("Google token missing");

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        fullName: payload.name,
        password: await bcrypt.hash('f5pass', 10), // Dummy password
        role: 'student'
      });
    }
    return user;
  }
}
module.exports = GoogleStrategy;
