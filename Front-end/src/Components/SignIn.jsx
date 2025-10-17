import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import eyeOpen from '../assets/eye_open.png';
import eyeClose from '../assets/eye-close.svg';
import "./SignIn.css";

const SignIn = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Apply theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("sp_theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    const togglePassword = (e) => {
        e.preventDefault(); 
        setShowPassword(prev => !prev);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Login successful!");
        navigate("/commondashboard");
    };

    return (
        <div className="signin-wrapper">
            <section className="signin-left">
                <div className="signin-card">
                    <h2 className="form-title">Sign In</h2>

                    <form onSubmit={handleSubmit} className="signin-form">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <label htmlFor="password">Password</label>
                        <div className="password-field">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                className="toggle-password"
                                onClick={togglePassword}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <img
                                    src={showPassword ? eyeOpen : eyeClose}
                                    alt={showPassword ? "Hide" : "Show"}
                                />
                            </button>
                        </div>

                        <button type="submit" className="signin-btn">Sign In</button>
                    </form>

                    <span className="forget-password" onClick={() => navigate("/forgetpassword")}>
                        Forgot Password?
                    </span>

                    <p className="switch-text">
                        Don’t have an account? <span onClick={() => navigate("/signuppage")}>Sign Up</span>
                    </p>
                    <p className="switch-text-back">
                        <span onClick={() => navigate("/")}>Back to home</span>
                    </p>
                </div>
            </section>
        </div>
    );
};

export default SignIn;
