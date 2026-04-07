import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { requestOtp } from '../slices/authSlice';
import { motion } from 'framer-motion';
import { Utensils, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const role = isAdmin ? 'admin' : 'user';
    const res = await dispatch(requestOtp({ ...formData, role }));
    if (res.meta.requestStatus === 'fulfilled') {
      console.log('✅ OTP Verification Code:', res.payload.otp);
      navigate('/verify-otp', { state: { mobile: formData.mobile, tempToken: res.payload.tempToken, role, from } });
    } else {
      alert('Failed to send OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
      {/* Visual Polish: Soft Glass Circle Decoration */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'rgba(184, 19, 14, 0.05)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(140, 80, 0, 0.05)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }}></div>

      <main style={{ width: '100%', maxWidth: '400px', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'var(--primary-container)', borderRadius: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 10px 20px rgba(184, 19, 14, 0.2)', transform: 'rotate(3deg)' 
          }}>
            <Utensils color="white" size={32} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h1 className="display-sm" style={{ color: 'var(--primary)', margin: 0 }}>Zestful</h1>
            <p className="body-md" style={{ maxWidth: '280px', margin: '0 auto', fontSize: '1.1rem', fontWeight: 500 }}>
              A bespoke digital lookbook of artisanal flavors.
            </p>
          </div>
        </header>

        <section className="editorial-shadow" style={{ background: 'var(--surface-container-lowest)', padding: '2rem', borderRadius: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-full)', padding: '4px' }}>
            <button 
              onClick={() => setIsAdmin(false)} 
              style={{ 
                flex: 1, padding: '10px', borderRadius: 'var(--radius-full)', 
                background: !isAdmin ? 'var(--primary)' : 'transparent',
                color: !isAdmin ? 'white' : 'var(--on-surface-variant)',
                fontSize: '0.875rem'
              }}
            >Diner</button>
            <button 
              onClick={() => setIsAdmin(true)}
              style={{ 
                flex: 1, padding: '10px', borderRadius: 'var(--radius-full)', 
                background: isAdmin ? 'var(--primary)' : 'transparent',
                color: isAdmin ? 'white' : 'var(--on-surface-variant)',
                fontSize: '0.875rem'
              }}
            >Curator</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', paddingLeft: '0.25rem' }}>Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your name" 
                className="input-field" 
                required 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', paddingLeft: '0.25rem' }}>Editorial Email</label>
                <input 
                  type="email" 
                  placeholder="name@zestful.com" 
                  className="input-field" 
                  required 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', paddingLeft: '0.25rem' }}>Mobile Number</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-highest)', borderRadius: '1rem', fontWeight: 600 }}>+91</div>
                <input 
                  type="tel" 
                  placeholder="000 000 0000" 
                  className="input-field" 
                  required 
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.25rem' }}>
              <span>Send OTP</span>
              <ArrowRight size={20} />
            </button>
          </form>
        </section>

        <footer style={{ textAlign: 'center' }}>
          <p className="body-md" style={{ fontSize: '0.875rem' }}>
            Ready to explore? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Discover Artisanal Flavors</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
