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
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phonenumber: { type: String },
  isverified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

async function sendResetPasswordEmail(toEmail, otp) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size:16px; color:#222;">
      <h3>SolarPower-ML — Password Reset</h3>
      <p>Your password reset code is:</p>
      <p style="font-size:22px; letter-spacing:4px;"><strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    </div>
  `;
  return transporter.sendMail({
    from,
    to: toEmail,
    subject: "SolarPower-ML Password Reset",
    html,
  });
}


app.get('/', (req, res) => res.send('Hello from SolarPower-ML Back-end!'));

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
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const user = new User({
      fullname,
      email,
      password: passwordHash,
      phonenumber,
      otp,
      otpExpiry,
    });

    await user.save();
    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
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

app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'User does not exist' });
    if (!user.isverified) return res.status(401).json({ message: 'Email not verified' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    return res.status(200).json({
      message: 'Login successful',
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

app.delete('/api/signin/emailnotverified', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOneAndDelete({ email, isverified: false });
    if (!user) {
      return res.status(404).json({ message: 'No unverified user found with this email' });
    }
    return res.status(200).json({ message: 'Unverified user deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});


app.post('/api/signin/forgotpassword/auth', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    try {
      await sendResetPasswordEmail(email, otp);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }
    return res.status(200).json({ message: 'OTP sent to email' });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/signin/forgotpassword/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }
    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    return res.status(200).json({ message: 'OTP verified' });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}
);

app.patch('/api/signin/forgotpassword/reset', async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) return res.status(400).json({ message: 'Email, OTP and new password are required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }
    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return res.status(200).json({ message: 'Password reset successful' });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});


app.post("/api/predict/solarpower", async (req, res) => {
  const inputData = req.body;
  try {
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputData),
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Flask prediction server returned an error",
        error: data,
      });
    }
    return res.status(200).json(data);

  } catch (err) {
    console.error("Error communicating with Flask server:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching prediction", error: err.message });
  }
});

app.post("/api/predict/solarpowerforecast", async (req, res) => {
  const payloads = req.body;

  if (!Array.isArray(payloads) || payloads.length === 0) {
    return res.status(400).json({ message: "Invalid input: Expected an array of days." });
  }
  try {
    const predictionPromises = payloads.map(dayPayload => {
      return fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dayPayload),
      }).then(response => {
        if (!response.ok) {
          return response.json().then(err => Promise.reject(err));
        }
        return response.json();
      });
    });
    const results = await Promise.all(predictionPromises);
    res.status(200).json({ predictions: results });

  } catch (err) {
    console.error("Error communicating with Flask server:", err);
    res.status(500).json({
      message: "Server error while fetching prediction",
      error: err.message || err,
    });
  }
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

