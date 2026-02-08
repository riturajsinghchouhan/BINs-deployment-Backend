import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BarChart3,
    Map,
    Truck,
    CheckCircle2,
    Recycle,
    ShieldCheck,
    Mail,
    Phone,
    MapPin
} from 'lucide-react';
import Login from '../Login/Login';
import Register from '../Register/Register';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-container" id='home'>
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-nav-content">
                    <div className="landing-logo">
                        <Recycle className="landing-logo-icon" />
                        <span className="landing-logo-text">SmartBin</span>
                    </div>
                    <div className="landing-nav-actions">
                        <button
                            className="landing-btn landing-btn-ghost"
                            onClick={() => document.getElementById('home').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Home
                        </button>
                        <button
                            className="landing-btn landing-btn-ghost"
                            onClick={() => document.getElementById('login').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Sign In
                        </button>
                        <button
                            className="landing-btn landing-btn-ghost"
                            onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Contact
                        </button>
                        <button
                            className="landing-btn landing-btn-primary"
                            onClick={() => document.getElementById('register').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="landing-hero">
                <div className="landing-hero-content">
                    <div className="landing-hero-text">
                        <div className="landing-badge">
                            <span className="landing-badge-dot"></span>
                            Smart Waste Management System
                        </div>
                        <h1 className="landing-title">
                            Revolutionizing <br />
                            <span className="gradient-text">Urban Cleanliness</span>
                        </h1>
                        <p className="landing-subtitle">
                            An intelligent waste management solution that optimizes collection routes, monitors bin levels in real-time, and creates cleaner, smarter cities.
                        </p>
                        <div className="landing-cta-group">
                            <button
                                className="landing-btn landing-btn-lg landing-btn-primary"
                                onClick={() => document.getElementById('register').scrollIntoView({ behavior: 'smooth' })}
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                            <button
                                className="landing-btn landing-btn-lg landing-btn-outline"
                                onClick={() => {
                                    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Learn More
                            </button>
                        </div>
                        <div className="landing-hero-stats">
                            <div className="stat-item">
                                <span className="stat-value">30%</span>
                                <span className="stat-label">Cost Reduction</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">50%</span>
                                <span className="stat-label">Efficiency Boost</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">24/7</span>
                                <span className="stat-label">Real-time Monitoring</span>
                            </div>
                        </div>
                    </div>
                    <div className="landing-hero-visual">
                        <div className="hero-card-stack">
                            <div className="hero-card hero-card-1">
                                <div className="card-header">
                                    <div className="card-icon bg-green-100 text-green-600">
                                        <Recycle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="card-title">Bin Status</div>
                                        <div className="card-subtitle">Area - Downtown</div>
                                    </div>
                                </div>
                                <div className="bin-level-indicator">
                                    <div className="level-bar">
                                        <div className="level-fill" style={{ width: '85%' }}></div>
                                    </div>
                                    <div className="level-info">
                                        <span>85% Full</span>
                                        <span className="text-red-500">Pickup Required</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hero-card hero-card-2">
                                <div className="card-header">
                                    <div className="card-icon bg-blue-100 text-blue-600">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="card-title">Route Optimization</div>
                                        <div className="card-subtitle">Driver: John Doe</div>
                                    </div>
                                </div>
                                <div className="route-preview">
                                    <div className="route-point completed"></div>
                                    <div className="route-line completed"></div>
                                    <div className="route-point active"></div>
                                    <div className="route-line pending"></div>
                                    <div className="route-point pending"></div>
                                </div>
                            </div>
                        </div>
                        <div className="hero-glow"></div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="landing-features">
                <div className="section-header">
                    <h2 className="section-title">Why Choose SmartBin?</h2>
                    <p className="section-subtitle">
                        Our platform provides comprehensive tools to manage waste collection efficiently and sustainably.
                    </p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper bg-blue-100 text-blue-600">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="feature-title">Real-time Analytics</h3>
                        <p className="feature-desc">
                            Monitor bin fill levels, collection times, and worker performance with detailed dashboards and reports.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper bg-green-100 text-green-600">
                            <Map className="w-6 h-6" />
                        </div>
                        <h3 className="feature-title">Smart Routing</h3>
                        <p className="feature-desc">
                            AI-powered route optimization ensures workers take the most efficient path, saving fuel and time.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper bg-purple-100 text-purple-600">
                            <Truck className="w-6 h-6" />
                        </div>
                        <h3 className="feature-title">Fleet Management</h3>
                        <p className="feature-desc">
                            Track collection vehicles in real-time and manage workforce assignments effortlessly.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper bg-orange-100 text-orange-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="feature-title">Secure Platform</h3>
                        <p className="feature-desc">
                            Enterprise-grade security with role-based access control for admins, managers, and field workers.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper bg-teal-100 text-teal-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="feature-title">Automated Alerts</h3>
                        <p className="feature-desc">
                            Receive instant notifications when bins are full, damaged, or require maintenance.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper bg-pink-100 text-pink-600">
                            <Recycle className="w-6 h-6" />
                        </div>
                        <h3 className="feature-title">Sustainability Goals</h3>
                        <p className="feature-desc">
                            Track your environmental impact and optimize waste diversion strategies.
                        </p>
                    </div>
                </div>
            </section>

            {/* Banner Section */}
            <section className="landing-banner">
                <div className="banner-content">
                    <h2 className="banner-title">Ready to transform your city?</h2>
                    <p className="banner-subtitle">
                        Join hundreds of municipalities and organizations using SmartBin today.
                    </p>
                    <button
                        className="landing-btn landing-btn-lg landing-btn-white"
                        onClick={() => document.getElementById('register').scrollIntoView({ behavior: 'smooth' })}
                    >
                        Get Started Now
                    </button>
                </div>
                <div className="banner-pattern"></div>
            </section>

            {/* Login Section */}
            <section id="login" className="landing-section">
                <Login />
            </section>

            {/* Contact Section */}
            <section id="contact" className="landing-contact">
                <div className="section-header">
                    <h2 className="section-title">Get in Touch</h2>
                    <p className="section-subtitle">
                        Have questions? Our team is here to help you optimize your waste management.
                    </p>
                </div>
                <div className="contact-grid">
                    <div className="contact-card">
                        <div className="contact-icon bg-blue-100 text-blue-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3>Email Us</h3>
                        <p>support@smartbin.com</p>
                        <p>sales@smartbin.com</p>
                    </div>
                    <div className="contact-card">
                        <div className="contact-icon bg-green-100 text-green-600">
                            <Phone className="w-6 h-6" />
                        </div>
                        <h3>Call Us</h3>
                        <p>+1 (555) 123-4567</p>
                        <p>Mon-Fri 9am-6pm EST</p>
                    </div>
                    <div className="contact-card">
                        <div className="contact-icon bg-purple-100 text-purple-600">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <h3>Visit Us</h3>
                        <p>123 Innovation Drive</p>
                        <p>Smart City, SC 12345</p>
                    </div>
                </div>
            </section>

            {/* Register Section */}
            <section id="register" className="landing-section">
                <Register />
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="landing-logo">
                            <Recycle className="landing-logo-icon" />
                            <span className="landing-logo-text">SmartBin</span>
                        </div>
                        <p className="footer-desc">
                            Making waste management smarter, cleaner, and more efficient for everyone.
                        </p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-col">
                            <h4>Product</h4>
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <a href="#">Case Studies</a>
                        </div>
                        <div className="footer-col">
                            <h4>Company</h4>
                            <a href="#">About Us</a>
                            <a href="#">Careers</a>
                            <a href="#">Contact</a>
                        </div>
                        <div className="footer-col">
                            <h4>Resources</h4>
                            <a href="#">Blog</a>
                            <a href="#">Documentation</a>
                            <a href="#">Support</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} SmartBin. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
