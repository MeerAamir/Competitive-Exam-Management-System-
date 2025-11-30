import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import styles from './Login.module.css';

// Eye icons for password toggle
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const Login = ({ onLogin }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(''); // Clear error on typing
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Post to centralized API
            const res = await api.post('/auth/login', formData);

            // Handle successful login
            if (onLogin) onLogin(res.data);
            navigate(res.data.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            // Generic error message for security
            setError('Invalid email or password. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            {/* Left Panel: Art & Info */}
            <div className={styles.leftPanel}>
                <div className={styles.swirlContainer}>
                    <div className={styles.swirl}></div>
                </div>

                <div className={styles.projectInfo}>
                    <h1 className={styles.title}>Competitive Exam<br />Management System</h1>
                    <p className={styles.description}>
                        Experience the future of secure, randomized, and timed competitive examinations.
                        A seamless platform for administrators and students alike.
                    </p>

                    <ul className={styles.features}>
                        <li>Role-Based Access Control</li>
                        <li>Randomized Question Generation</li>
                        <li>Real-time Exam Timer</li>
                        <li>Instant Performance Analytics</li>
                    </ul>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className={styles.rightPanel}>
                <div className={styles.loginCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Welcome Back</h2>
                        <p className={styles.cardSubtitle}>Enter your credentials to access your account.</p>
                    </div>

                    {error && (
                        <div className={styles.errorMsg} role="alert" aria-live="assertive">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>Email Address</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={styles.input}
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    className={styles.input}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.togglePassword}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <div className={styles.formFooter}>
                            <label className={styles.rememberMe}>
                                <input type="checkbox" className={styles.checkbox} />
                                Remember me
                            </label>
                            <a href="#" onClick={(e) => e.preventDefault()} className={styles.forgotLink}>Forgot Password?</a>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Authenticating...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className={styles.createAccount}>
                            Don't have an account?
                            <Link to="/register" className={styles.createLink}>Create account</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
