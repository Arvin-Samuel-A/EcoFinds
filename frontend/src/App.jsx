import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import CartPage from './pages/CartPage'
import HomePage from './pages/HomePage'
import Contact from './pages/Contact'
import Support from './pages/Support'
import AboutUs from './pages/AboutUs'
import OurMission from './pages/OurMission'
import AddNewProduct from './pages/AddNewProduct'

function App() {
  return (
    <Router>
      <header className="home-header">
        <a href="/" className="logo-container">
          <h1 className="logo-text">EcoFinds</h1>
        </a>
        <nav className="main-nav">
          <a href="/abtus" className="nav-link">Listings</a>
          <a href="/mission" className="nav-link">Add Products</a>
          <a href="/contact" className="nav-link">Cart</a>
        </nav>
        <div className="auth-buttons">
          <a href="/cart" className="cart-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </a>
          <a href="/login"><button className="secondary-btn">Log In</button></a>
          <a href="/login"><button className="primary-btn">Sign Up</button></a>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/abtus" element={<AboutUs />} />
          <Route path="/support" element={<Support />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mission" element={<OurMission />} />
          <Route path="/addproduct" element={<AddNewProduct />} />
        </Routes>
      </main>
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2 className="logo-text">EcoFinds</h2>
            <p>Connecting eco-conscious consumers with sustainable products.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h3>Navigation</h3>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/cart">Cart</a></li>
                <li><a href="/login">Sign Up</a></li>
                <li><a href="/login">Log In</a></li>
                <li><a href="/addproduct">Add Your Products</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Company</h3>
              <ul>
                <li><a href="/abtus">About Us</a></li>
                <li><a href="/mission">Our Mission</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/support">Support</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Connect</h3>
              <ul className="social-links">
                <li><a href="#" className="social-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a></li>
                <li><a href="#" className="social-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a></li>
                <li><a href="#" className="social-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 EcoFinds. All rights reserved.</p>
        </div>
      </footer>
    </Router>
  )
}

export default App
