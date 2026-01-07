"use client";

import { useAuth } from "@/context/AuthContext";
import "@/styles/Login.css";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const { login, loginWithApple, loginWithEmail, register } = useAuth();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password);
      } else {
        await loginWithEmail(formData.email, formData.password);
      }
      // Successfully authenticated, navigate to home
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Kiln Agent</h1>
        <p>
          {isRegistering
            ? "Create your account"
            : "Sign in to manage your kiln"}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegistering
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button onClick={login} className="google-login-btn">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <button onClick={loginWithApple} className="apple-login-btn">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.48 7.08c-.08-1.98 1.61-2.93 1.69-2.98-.93-1.35-2.37-1.54-2.87-1.56-1.21-.12-2.38.72-3 .72-.63 0-1.58-.7-2.6-.68-1.34.02-2.57.78-3.26 1.98-1.4 2.42-.36 6.02 1 7.99.66.97 1.46 2.06 2.5 2.02 1-.04 1.38-.64 2.59-.64 1.2 0 1.55.64 2.59.62 1.07-.02 1.78-.99 2.45-1.97.77-1.12 1.09-2.21 1.11-2.27-.02-.01-2.13-.82-2.15-3.23z"
              fill="currentColor"
            />
            <path
              d="M11.23 3.48c.55-.67.92-1.59.82-2.52-.79.03-1.77.53-2.34 1.19-.51.59-.96 1.54-.84 2.45.89.07 1.8-.45 2.36-1.12z"
              fill="currentColor"
            />
          </svg>
          Continue with Apple
        </button>

        <div className="toggle-mode">
          {isRegistering
            ? "Already have an account? "
            : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
              setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
              });
            }}
            className="link-btn"
          >
            {isRegistering ? "Sign in" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
