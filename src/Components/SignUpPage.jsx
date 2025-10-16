import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import eyeOpen from '../assets/eye_open.png';
import eyeClose from '../assets/eye-close.svg';
import "./SignUpPage.css";

const SignUp = () => {
    const navigate = useNavigate();
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

    useEffect(() => {
        const savedTheme = localStorage.getItem("sp_theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, password: value });
        setPasswordValid({
            length: value.length >= 8,
            upper: /[A-Z]/.test(value),
            lower: /[a-z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[!@#$%^&*]/.test(value),
            match: value === formData.confirmPassword,
        });
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, confirmPassword: value });
        setPasswordValid({ ...passwordValid, match: value === formData.password });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!passwordValid.match) return alert("Passwords do not match!");
        alert("Form submitted successfully!");
        console.log(formData);
    };

    return (
        <div className="signup-wrapper">
            <div className="signup-card">
                <h2>Create Your Account</h2>

                <form onSubmit={handleSubmit} className="signup-form">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        required
                    />

                    <div className="password-wrapper">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handlePasswordChange}
                            required
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                            <img
                                src={passwordVisible ? eyeOpen : eyeClose}  // fixed here
                                alt={passwordVisible ? "Hide" : "Show"}
                            />
                        </span>
                    </div>

                    <div className="password-rules">
                        <p style={{ color: passwordValid.length ? "green" : "red" }}>
                            • Minimum 8 characters
                        </p>
                        <p style={{ color: passwordValid.upper ? "green" : "red" }}>
                            • Uppercase letter
                        </p>
                        <p style={{ color: passwordValid.lower ? "green" : "red" }}>
                            • Lowercase letter
                        </p>
                        <p style={{ color: passwordValid.number ? "green" : "red" }}>
                            • Number
                        </p>
                        <p style={{ color: passwordValid.special ? "green" : "red" }}>
                            • Special character (!@#$%^&*)
                        </p>
                    </div>

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required
                    />
                    <div className="password-rules">
                        <p style={{ color: passwordValid.match ? "green" : "red" }}>
                            • Passwords match
                        </p>
                    </div>

                    <input
                        type="text"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />

                    <button type="submit" className="signup-btn">
                        Sign Up
                    </button>
                </form>

                <p className="signup-switch-text">
                    Already have an account? <a href="/signinpage">Sign In</a>
                </p>
                <p className="switch-text-back">
                    <span onClick={() => navigate("/")}>Back to home</span>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
