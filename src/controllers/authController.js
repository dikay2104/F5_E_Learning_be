const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationCode } = require('../services/emailService');
const EmailPasswordStrategy = require('../services/loginStrategies/EmailPasswordStrategy');
const GoogleStrategy = require('../services/loginStrategies/GoogleStrategy');
const FacebookStrategy = require('../services/loginStrategies/FacebookStrategy');
const LoginContext = require('../services/loginStrategies/LoginContext');

exports.register = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  try {
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashed, role });
    await user.save();

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  let strategy;
  const { type } = req.body;
  switch (type) {
    case 'google':
      strategy = new GoogleStrategy();
      break;
    case 'facebook':
      strategy = new FacebookStrategy();
      break;
    default:
      strategy = new EmailPasswordStrategy();
  }

  const context = new LoginContext(strategy);

  try {
    const user = await context.login(req);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '2d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    res.status(401).json({ message: 'Login failed', error: err.message });
  }
};

exports.sendCode = async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  req.session = req.session || {};
  req.session[email] = code;

  await sendVerificationCode(email, code);
  res.json({ message: 'Verification code sent' });
}

// exports.login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: '2d',
//     });

//     res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
//   } catch (err) {
//     res.status(500).json({ message: 'Login failed', error: err.message });
//   }
// };