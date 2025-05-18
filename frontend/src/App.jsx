import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import CartPage from './pages/CartPage'
import HomePage from './pages/HomePage'

function App() {
  return (
    
    <Router>
      <header className="home-header">
        <a href="/"><div className="logo">
          <h1 className="logo-text">EcoFinds</h1>
          <span className="logo-accent"></span>
        </div></a>
        <div className="auth-buttons">
          <a href="/login"><button className="secondary-btn">Log In</button></a>
          <a href="/login"><button className="primary-btn">Sign Up</button></a>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/cart" element={<ProfilePage />} />
      </Routes>
      <footer className="home-header2">
        <div className="footer-content">
          <div className="footer-logo">
            <h2 className="logo-text">EcoFinds</h2>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h3>Navigation</h3>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/cart">Cart</a></li>
                <li><a href="/login">Sign Up</a></li>
                <li><a href="/login">Log In</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Company</h3>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Mission</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        <br />
        <div className="footer-bottom">
          <p>&copy; 2025 EcoFinds. All rights reserved.</p>
        </div>
      </footer>
      
    </Router>
  )
}

export default App