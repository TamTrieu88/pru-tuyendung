import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Home as HomeIcon, Users, Facebook, LogIn, LogOut, Menu, X, ShieldCheck, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './components/Home';
import RecruitmentForm from './components/RecruitmentForm';
import AdminDashboard from './components/AdminDashboard';
import FacebookManager from './components/FacebookManager';
import AccountManager from './components/AccountManager';
import { Wrench } from 'lucide-react';

type Page = 'home' | 'apply' | 'admin' | 'facebook' | 'accounts';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const savedAdmin = localStorage.getItem('isPrudentialAdmin') === 'true';
    const savedUser = localStorage.getItem('prudentialUsername');
    if (savedAdmin && savedUser) {
      setIsAdmin(true);
      setCurrentUser(savedUser);
      signInAnonymously(auth).catch(console.error);
    }

    // Seed initial admin if not exists (for demo purposes)
    const seedAdmin = async () => {
      const q = query(collection(db, 'users'), where('username', '==', 'admin'));
      const snap = await getDocs(q);
      if (snap.empty) {
        await setDoc(doc(db, 'users', 'admin'), {
          username: 'admin',
          password: '123',
          role: 'admin',
          createdAt: serverTimestamp()
        });
      }
    };
    seedAdmin();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const q = query(collection(db, 'users'), where('username', '==', loginData.username), where('password', '==', loginData.password));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userData = snap.docs[0].data();
        if (userData.role === 'admin') {
          setIsAdmin(true);
          localStorage.setItem('isPrudentialAdmin', 'true');
        } else {
          setIsAdmin(false);
          localStorage.setItem('isPrudentialAdmin', 'false');
        }
        
        setCurrentUser(loginData.username);
        localStorage.setItem('prudentialUsername', loginData.username);
        setShowLoginModal(false);
        setLoginData({ username: '', password: '' });
        await signInAnonymously(auth);
      } else {
        setLoginError('Tài khoản hoặc mật khẩu không chính xác');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Có lỗi xảy ra khi đăng nhập');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem('isPrudentialAdmin');
    localStorage.removeItem('prudentialUsername');
    setCurrentPage('home');
  };

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: HomeIcon },
    { id: 'apply', label: 'Ứng tuyển', icon: Users },
    ...(isAdmin ? [
      { id: 'admin', label: 'Quản lý ứng viên', icon: Users },
      { id: 'facebook', label: 'Facebook Page', icon: Facebook },
      { id: 'accounts', label: 'Quản lý tài khoản', icon: UserCog },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage('home')}>
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all shadow-md shadow-red-600/20">
                <span className="text-white font-black text-xl tracking-tighter">P</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-neutral-900">PRUDENTIAL</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as Page)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    currentPage === item.id ? 'text-red-600' : 'text-neutral-600 hover:text-red-600'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
              {currentUser ? (
                <div className="flex items-center gap-4 pl-4 border-l border-neutral-200">
                  <a
                    href="https://fbtool.net/post"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-blue-600 transition-colors"
                  >
                    <Wrench size={18} />
                    FB Tool
                  </a>
                  <div className="w-px h-4 bg-neutral-200" />
                  <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                    <ShieldCheck size={18} />
                    {currentUser}
                  </div>
                  <button onClick={handleLogout} className="text-neutral-600 hover:text-red-600">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  <LogIn size={18} />
                  Đăng nhập Admin
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-600">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-neutral-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id as Page);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-base font-medium ${
                      currentPage === item.id ? 'bg-red-50 text-red-600' : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                ))}
                {!currentUser && (
                  <button
                    onClick={() => {
                      setShowLoginModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-base font-medium bg-red-600 text-white"
                  >
                    <LogIn size={20} />
                    Đăng nhập Admin
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2rem] p-10 w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-neutral-100"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-red-500 bg-neutral-50 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-600/20">
                  <span className="text-white font-black text-2xl">P</span>
                </div>
                <h2 className="text-2xl font-bold text-neutral-900">Đăng nhập Quản trị</h2>
                <p className="text-neutral-500 text-sm mt-1">Hệ thống tuyển dụng bảo hiểm</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Tài khoản</label>
                  <input
                    type="text"
                    required
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder-neutral-400"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder-neutral-400"
                    placeholder="••••••••"
                  />
                </div>
                {loginError && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center justify-center font-medium">
                    {loginError}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-red-600/20 mt-2"
                >
                  Đăng nhập
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage === 'home' && <Home onApply={() => setCurrentPage('apply')} />}
            {currentPage === 'apply' && <RecruitmentForm isAdmin={isAdmin} onSuccess={() => setCurrentPage('home')} />}
            {currentPage === 'admin' && isAdmin && <AdminDashboard />}
            {currentPage === 'facebook' && isAdmin && <FacebookManager />}
            {currentPage === 'accounts' && isAdmin && <AccountManager currentAdminUsername={currentUser || ''} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-red-600">PRUDENTIAL</span>
          </div>
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Prudential Vietnam Assurance Private Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
