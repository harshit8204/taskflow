import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) { api.get('/auth/me').then(r => { setUser(r.data.user); localStorage.setItem('user', JSON.stringify(r.data.user)); }).catch(() => { localStorage.clear(); setUser(null); }).finally(() => setLoading(false)); }
    else setLoading(false);
  }, []);
  const login = async (email, password) => { const r = await api.post('/auth/login', { email, password }); localStorage.setItem('token', r.data.token); localStorage.setItem('user', JSON.stringify(r.data.user)); setUser(r.data.user); return r.data.user; };
  const signup = async (name, email, password, role) => { const r = await api.post('/auth/signup', { name, email, password, role }); localStorage.setItem('token', r.data.token); localStorage.setItem('user', JSON.stringify(r.data.user)); setUser(r.data.user); return r.data.user; };
  const logout = () => { localStorage.clear(); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);