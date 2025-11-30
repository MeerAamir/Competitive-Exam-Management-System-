import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css'; // Reuse Login styles for consistency

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'student' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic Validation
        if (!formData.username || !formData.email || !formData.password) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            setLoading(false);
            return;
        }

        try {
            await axios.post('http://localhost:5000/auth/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            {/* Left Panel - Art/Info (Hidden on mobile, similar to Login) */}
            <div className={styles.leftPanel}>
                <div className={styles.artContent}>
                    <h1 className={styles.projectTitle}>Join the Platform</h1>
                    <p className={styles.projectDesc}>
                        Create an account to access competitive exams, track your progress, and analyze your performance.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🚀</span>
                            <span>Instant Access to Exams</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>📊</span>
                            <span>Detailed Performance Analytics</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🔒</span>
                            <span>Secure & Private</span>
                        </div>
                    </div>
                </div>
                <div className={styles.gradientSwirl}></div>
            </div>

            {/* Right Panel - Register Form */}
            <div className={styles.rightPanel}>
                <div className={styles.loginCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Create Account</h2>
                        <p className={styles.cardSubtitle}>Sign up to get started</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert" aria-live="assertive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className={styles.label}>Username</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Choose a username"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className={styles.label}>Email Address</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className={styles.label}>Password</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Min. 8 characters"
                                required
                            />
                        </div>

                        {/* Role selection hidden for self-registration, defaults to student */}
                        {/* If admin wants to create admin, they use the dashboard */}

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating Account...
                                </>
                            ) : (
                                'Sign Up'
                            )}
                        </button>
                    </form>

                    <div className={styles.footerLinks}>
                        <p>Already have an account? <Link to="/login" className={styles.link}>Sign In</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
