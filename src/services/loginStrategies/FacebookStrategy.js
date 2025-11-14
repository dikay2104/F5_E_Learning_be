const ILoginStrategy = require('./ILoginStrategy');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

class FacebookStrategy extends ILoginStrategy {
  async login(req) {
    const { token } = req.body;
    if (!token) throw new Error('Token không được cung cấp');

    const fbRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`
    );

    const { email, name } = fbRes.data;
    if (!email) throw new Error('Không thể lấy email từ Facebook');

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        fullName: name,
        password: await bcrypt.hash('facebook123', 10),
        role: 'student',
      });
    }

    return user;
  }
}

module.exports = FacebookStrategy;
