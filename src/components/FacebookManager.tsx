import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Facebook, Settings, MessageSquare, ThumbsUp, Send, RefreshCw, AlertCircle, HelpCircle, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FBPost {
  id: string;
  message?: string;
  created_time: string;
  comments?: { data: any[] };
}

export default function FacebookManager() {
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [posts, setPosts] = useState<FBPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'facebook');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAccessToken(data.accessToken);
        setPageId(data.pageId);
        setIsConfigured(true);
        fetchPosts(data.pageId, data.accessToken);
      }
    };
    fetchSettings();
  }, []);

  const fetchPosts = async (pid: string, token: string) => {
    if (!pid || !token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${pid}/posts?fields=id,message,created_time,comments{message,from,created_time}&access_token=${token}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      setPosts(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'facebook'), {
        accessToken,
        pageId,
        updatedAt: serverTimestamp(),
      });
      setIsConfigured(true);
      fetchPosts(pageId, accessToken);
      alert('Đã lưu cấu hình Facebook!');
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Facebook className="text-blue-600" /> Quản lý Facebook Page
        </h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHelp(true)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            <HelpCircle size={16} /> Hướng dẫn lấy API
          </button>
          <button 
            onClick={() => setIsConfigured(false)}
            className="text-sm text-neutral-500 hover:text-red-600 flex items-center gap-1"
          >
            <Settings size={16} /> Cấu hình API
          </button>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <HelpCircle className="text-blue-600" /> Hướng dẫn lấy Facebook Graph API
              </h3>

              <div className="space-y-6 text-neutral-600">
                <section>
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                    Tạo App trên Facebook Developers
                  </h4>
                  <p className="text-sm ml-8">
                    Truy cập <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Facebook Developers <ExternalLink size={12} /></a>. 
                    Nhấn <strong>"Create App"</strong>, chọn loại <strong>"Other"</strong> và sau đó chọn <strong>"Business"</strong>.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                    Thêm sản phẩm "Facebook Login for Business"
                  </h4>
                  <p className="text-sm ml-8">
                    Trong giao diện quản lý App, tìm mục <strong>"Add a product"</strong> và chọn <strong>"Facebook Login for Business"</strong>.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</span>
                    Lấy Page Access Token
                  </h4>
                  <div className="text-sm ml-8 space-y-2">
                    <p>Sử dụng công cụ <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Graph API Explorer <ExternalLink size={12} /></a>:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Chọn App bạn vừa tạo ở mục <strong>"Facebook App"</strong>.</li>
                      <li>Ở mục <strong>"User or Page"</strong>, chọn <strong>"Get Page Access Token"</strong>.</li>
                      <li>Cấp các quyền (Permissions): <code className="bg-neutral-100 px-1 rounded">pages_read_engagement</code>, <code className="bg-neutral-100 px-1 rounded">pages_manage_posts</code>, <code className="bg-neutral-100 px-1 rounded">pages_show_list</code>.</li>
                      <li>Nhấn <strong>"Generate Token"</strong> và copy mã token dài hiện ra.</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">4</span>
                    Lấy Page ID
                  </h4>
                  <p className="text-sm ml-8">
                    Vào trang Facebook của bạn, chọn mục <strong>"Giới thiệu" (About)</strong> &rarr; <strong>"Thông tin minh bạch của Trang" (Page Transparency)</strong>. 
                    Bạn sẽ thấy ID của Trang tại đây.
                  </p>
                </section>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs text-amber-700">
                  <strong>Lưu ý quan trọng:</strong> Access Token lấy từ Explorer thường chỉ có hạn 1-2 giờ. Để sử dụng lâu dài, bạn cần đổi sang <strong>Long-lived Token</strong> (hạn 60 ngày hoặc vĩnh viễn) thông qua công cụ Access Token Tool của Facebook.
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="mt-8 w-full bg-neutral-900 text-white font-bold py-3 rounded-xl hover:bg-neutral-800 transition-all"
              >
                Tôi đã hiểu
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!isConfigured ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 max-w-xl mx-auto"
        >
          <h3 className="text-xl font-bold mb-6">Cấu hình Facebook Graph API</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Page ID</label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="Nhập Page ID của bạn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Page Access Token</label>
              <textarea
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="Nhập Access Token từ Facebook Developers"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Lưu cấu hình
            </button>
            <p className="text-xs text-neutral-500 mt-4 italic">
              * Bạn cần tạo App trên Facebook Developers và lấy Page Access Token với các quyền: pages_read_engagement, pages_manage_posts, pages_manage_metadata.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Posts List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Bài viết gần đây</h3>
              <button 
                onClick={() => fetchPosts(pageId, accessToken)}
                className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                disabled={loading}
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-neutral-500">Đang tải bài viết...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 bg-white rounded-2xl border border-dashed border-neutral-200">
                Chưa có bài viết nào được tải.
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-neutral-800 font-medium line-clamp-3">{post.message || '(Không có nội dung)'}</p>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                      {new Date(post.created_time).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {post.comments && post.comments.data.length > 0 && (
                    <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1">
                        <MessageSquare size={12} /> Bình luận ({post.comments.data.length})
                      </h4>
                      {post.comments.data.slice(0, 3).map((comment, idx) => (
                        <div key={idx} className="text-sm border-b border-neutral-100 last:border-0 pb-2 last:pb-0">
                          <span className="font-bold text-neutral-700">{comment.from?.name || 'User'}: </span>
                          <span className="text-neutral-600">{comment.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t border-neutral-50">
                    <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-blue-600">
                      <ThumbsUp size={14} /> Thích
                    </button>
                    <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-blue-600">
                      <MessageSquare size={14} /> Phản hồi
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
              <h3 className="font-bold mb-4">Thông tin Page</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Page ID:</span>
                  <span className="font-mono">{pageId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Trạng thái:</span>
                  <span className="text-green-600 font-bold">Đã kết nối</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
              <h3 className="font-bold mb-2">Mẹo Quản lý</h3>
              <p className="text-sm text-blue-100">
                Sử dụng Facebook Graph API để tự động hóa việc phản hồi ứng viên qua tin nhắn và bình luận trên các bài đăng tuyển dụng.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
