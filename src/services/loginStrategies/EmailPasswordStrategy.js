// services/loginStrategies/EmailPasswordStrategy.js

const ILoginStrategy = require('./ILoginStrategy');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

class EmailPasswordStrategy extends ILoginStrategy {
  async login(req) {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error('Email và mật khẩu là bắt buộc');
    }

    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Sai mật khẩu');

    return user;
  }
}

module.exports = EmailPasswordStrategy;
