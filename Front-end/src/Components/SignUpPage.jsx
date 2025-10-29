import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import eyeOpen from '../assets/eye_open.png';
import eyeClose from '../assets/eye-close.svg';
import "./SignUpPage.css";

const API_BASE = "http://localhost:3011"; 

const SignUp = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
    });

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordValid, setPasswordValid] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false,
        match: false,
    });

    const OTP_LENGTH = 6;
    const [otpValues, setOtpValues] = useState(new Array(OTP_LENGTH).fill(""));
    const inputsRef = useRef([]); 
    const [maskAfterDelay, setMaskAfterDelay] = useState(false); 
    const [resendLoading, setResendLoading] = useState(false);
    const [otpError, setOtpError] = useState("");

    useEffect(() => {
        const savedTheme = localStorage.getItem("sp_theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    useEffect(() => {
        setPasswordValid((prev) => ({
            ...prev,
            match: formData.password === formData.confirmPassword && formData.password.length > 0,
        }));
    }, [formData.password, formData.confirmPassword]);

    const handlePasswordChange = (value) => {
        setFormData((prev) => ({ ...prev, password: value }));
        setPasswordValid((prev) => ({
            ...prev,
            length: value.length >= 8,
            upper: /[A-Z]/.test(value),
            lower: /[a-z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[!@#$%^&*]/.test(value),
            match: value === formData.confirmPassword,
        }));
    };

    const handleConfirmPasswordChange = (value) => {
        setFormData((prev) => ({ ...prev, confirmPassword: value }));
        setPasswordValid((prev) => ({ ...prev, match: value === formData.password }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setOtpError("");

        if (!passwordValid.match) {
            alert("Passwords do not match!");
            return;
        }
        if (!formData.name || !formData.email || !formData.password) {
            alert("Please fill required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullname: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phonenumber: formData.phone,
                }),
            });

            const data = await res.json();
            if (res.status === 201) {
                setUserId(data.user.id);
                setStep(2);
                setOtpValues(new Array(OTP_LENGTH).fill(""));
                setTimeout(() => inputsRef.current[0]?.focus(), 150);
            } else {
                alert(data.message || "Signup failed");
            }
        } catch (err) {
            console.error(err);
            alert("Server error");
        } finally {
            setLoading(false);
        }
    };

    const onOtpChange = (e, index) => {
        const val = e.target.value;
        if (!/^[0-9]?$/.test(val)) return; 
        
        const next = [...otpValues];
        next[index] = val;
        setOtpValues(next);
        setOtpError("");

        if (val && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const onOtpKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (otpValues[index] === "" && index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
            const next = [...otpValues];
            next[index] = "";
            setOtpValues(next);
            
            if (index > 0) {
                inputsRef.current[index - 1]?.focus();
            }

        } else if (e.key === "ArrowLeft" && index > 0) {
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };


    const assembleOtp = () => otpValues.join("");

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setOtpError("");
        const otp = assembleOtp();
        if (otp.length !== OTP_LENGTH) {
            setOtpError("Please enter full 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/signup/verify/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp }),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("fullname", data.user.fullname);
                localStorage.setItem("email", data.user.email);
                alert("Signup successful!");
                navigate("/MainDashboard");
            } else {
                setOtpError(data.message || "OTP verification failed");
            }
        } catch (err) {
            console.error(err);
            setOtpError("Server error");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!userId) return;
        setResendLoading(true);
        setOtpError("");
        try {
            const res = await fetch(`${API_BASE}/api/signup/resend-otp/${userId}`, {
                method: "GET",
            });
            const data = await res.json();
            if (res.status === 200) {
                setOtpValues(new Array(OTP_LENGTH).fill(""));
                inputsRef.current[0]?.focus();
                alert("OTP resent to your email");
            } else {
                setOtpError(data.message || "Failed to resend OTP");
            }
        } catch (err) {
            console.error(err);
            setOtpError("Server error while resending OTP");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="signup-wrapper">
            <div className="signup-card">
                {step === 1 && (
                    <>
                        <h2>Create Your Account</h2>
                        <form onSubmit={handleSubmit} className="signup-form">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />

                            <div className="password-wrapper">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    required
                                />
                                <span
                                    className="toggle-password"
                                    onClick={() => setPasswordVisible(!passwordVisible)}
                                    role="button"
                                >
                                    <img src={passwordVisible ? eyeOpen : eyeClose} alt={passwordVisible ? "Hide" : "Show"} />
                                </span>
                            </div>

                            <div className="password-rules">
                                <p style={{ color: passwordValid.length ? "green" : "red" }}>• Minimum 8 characters</p>
                                <p style={{ color: passwordValid.upper ? "green" : "red" }}>• Uppercase letter</p>
                                <p style={{ color: passwordValid.lower ? "green" : "red" }}>• Lowercase letter</p>
                                <p style={{ color: passwordValid.number ? "green" : "red" }}>• Number</p>
                                <p style={{ color: passwordValid.special ? "green" : "red" }}>• Special character (!@#$%^&*)</p>
                            </div>

                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                required
                            />
                            <div className="password-rules">
                                <p style={{ color: passwordValid.match ? "green" : "red" }}>• Passwords match</p>
                            </div>

                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />

                            <button type="submit" className="signup-btn" disabled={loading}>
                                {loading ? "Creating..." : "Sign Up"}
                            </button>
                        </form>

                        <p className="signup-switch-text">
                            Already have an account?{" "}
                            <span className="auth-link" onClick={() => navigate("/signinpage")}>
                                Sign In
                            </span>
                        </p>
                        <p className="switch-text-back">
                            <span onClick={() => navigate("/")}>Back to home</span>
                        </p>
                    </>
                )}

                {step === 2 && (
                    <div className="otp-screen">
                        <h2>Verify Your Email</h2>
                        <p>We sent a 6-digit OTP to <strong>{formData.email}</strong></p>

                        <form onSubmit={handleOtpSubmit} className="otp-form">
                            <div className="otp-inputs">
                                {otpValues.map((value, index) => (
                                    <input
                                        key={index}
                                        className="otp-input"
                                        type="text" 
                                        inputMode="numeric" 
                                        maxLength="1"
                                        value={value} 
                                        onChange={(e) => onOtpChange(e, index)}
                                        onKeyDown={(e) => onOtpKeyDown(e, index)}
                                        ref={(el) => (inputsRef.current[index] = el)}
                                    />
                                ))}
                            </div>

                            {otpError && <p className="otp-error">{otpError}</p>}

                            <div className="otp-actions">
                                <button type="submit" className="signup-btn" disabled={loading}>
                                    {loading ? "Verifying..." : "Verify OTP"}
                                </button>

                                <button
                                    type="button"
                                    className="resend-btn"
                                    onClick={handleResendOtp}
                                    disabled={resendLoading}
                                >
                                    {resendLoading ? "Resending..." : "Resend OTP"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignUp;

