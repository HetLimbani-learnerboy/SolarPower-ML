// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3011;

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'SolarPower-ML',
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phonenumber: { type: String },
  isverified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // or use other SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// helper
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(toEmail, otp) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size:16px; color:#222;">
      <h3>SolarPower-ML — Email Verification</h3>
      <p>Your verification code is:</p>
      <p style="font-size:22px; letter-spacing:4px;"><strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    </div>
  `;
  return transporter.sendMail({
    from,
    to: toEmail,
    subject: "Verify your SolarPower-ML account",
    html,
  });
}

// routes
app.get('/', (req, res) => res.send('Hello from SolarPower-ML Back-end!'));

// POST /api/signup --> create user, generate & send otp
app.post('/api/signup', async (req, res) => {
  const { fullname, email, password, phonenumber } = req.body;
  if (!fullname || !email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = new User({
      fullname,
      email,
      password: passwordHash,
      phonenumber,
      otp,
      otpExpiry,
    });

    await user.save();

    // send OTP email (production)
    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
      // optionally: delete user if email fails — here we inform client
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    return res.status(201).json({
      message: 'User registered. Verification OTP sent to email.',
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phonenumber: user.phonenumber,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/signup/resend-otp/:id -> regenerate OTP, send email
app.get('/api/signup/resend-otp/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isverified) return res.status(400).json({ message: 'User already verified' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendOtpEmail(user.email, otp);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    return res.status(200).json({ message: 'OTP resent to email' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/signup/verify/:id -> verify OTP
app.post('/api/signup/verify/:id', async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ message: 'OTP is required' });

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isverified) return res.status(400).json({ message: 'User already verified' });

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isverified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({
      message: 'OTP verified. Account activated.',
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phonenumber: user.phonenumber,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});