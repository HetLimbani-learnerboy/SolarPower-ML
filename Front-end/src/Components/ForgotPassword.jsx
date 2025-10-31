import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const otpRefs = useRef([]);


  
  const passwordValid = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
  const isPasswordMatch = password && password === confirmPassword;

  // Handle OTP input
  const handleOtpChange = (value, i) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[i] = value;
      setOtp(newOtp);
      if (value && i < 5) otpRefs.current[i + 1].focus();
    }
  };

  // Send OTP
  const sendOtp = async () => {
    setSending(true);
    try {
      const res = await fetch("http://localhost:3011/api/signin/forgotpassword/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.message);
      else {
        setStep(2);
        setResendTimer(30);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
    setSending(false);
  };

  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer, step]);

  // Verify OTP
  const verifyOtp = async () => {
    try {
      const res = await fetch("http://localhost:3011/api/signin/forgotpassword/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join("") }),
      });
      const data = await res.json();
      if (res.ok) setStep(3);
      else alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  useEffect(() => {
    if (step === 2 && otp.join("").length === 6) {
      verifyOtp();
    }
  }, [otp]);

  // Reset password
  const resetPassword = async () => {
    try {
      const res = await fetch("http://localhost:3011/api/signin/forgotpassword/reset", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(""), password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        navigate("/signinpage");
      } else alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="forgetpassword-wrapper">
      {step === 1 && (
        <div className="forgetpassword-card">
          <h2>Forgot Password</h2>
          <input
            type="email"
            placeholder="Enter your email"
            className="forgetpassword-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="forgetpassword-btn" onClick={sendOtp} disabled={sending}>
            {sending ? <span className="forgetpassword-loader" /> : "Send OTP"}
          </button>
          <span className="forgetpassword-back" onClick={() => navigate(-1)}>
            Go Back
          </span>
        </div>
      )}

      {step === 2 && (
        <div className="forgetpassword-card">
          <h2>Enter OTP</h2>
          <div className="forgetpassword-otp-wrapper">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                value={d}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                maxLength={1}
                className="forgetpassword-otpbox"
              />
            ))}
          </div>
          <p>OTP will be verified automatically</p>
          {resendTimer > 0 ? (
            <button className="forgetpassword-resend1" disabled>
              Resend OTP in {resendTimer}s
            </button>
          ) : (
            <button className="forgetpassword-resend2" onClick={sendOtp}>
              Resend OTP
            </button>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="forgetpassword-card">
          <h2>Reset Password</h2>
          <div className="forgetpassword-input-wrapper">
            <input
              type={passwordVisible ? "text" : "password"}
              placeholder="New Password"
              className="forgetpassword-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="forgetpassword-toggle-btn"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>
          <div className="forgetpassword-validation">
            <p style={{ color: passwordValid.length ? "green" : "red" }}>• Minimum 8 characters</p>
            <p style={{ color: passwordValid.upper ? "green" : "red" }}>• Uppercase letter</p>
            <p style={{ color: passwordValid.lower ? "green" : "red" }}>• Lowercase letter</p>
            <p style={{ color: passwordValid.number ? "green" : "red" }}>• Number</p>
            <p style={{ color: passwordValid.special ? "green" : "red" }}>
              • Special character (!@#$%^&*)
            </p>
          </div>

          <input
            type="password"
            placeholder="Confirm Password"
            className="forgetpassword-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {!isPasswordMatch && confirmPassword && (
            <p className="forgetpassword-validation-message" style={{ color: "red" }}>
              Passwords do not match
            </p>
          )}

          <button
            className="forgetpassword-btn"
            disabled={!Object.values(passwordValid).every(Boolean) || !isPasswordMatch}
            onClick={resetPassword}
          >
            Reset Password
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;