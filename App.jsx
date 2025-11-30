import React, { useState, useEffect } from 'react';
import { Clipboard, Check, FileText, Settings, Shield, Mail, Users, Save, Trash2, Download, Lock, AlertCircle, X, CheckCircle, AlertTriangle, UserCheck, Menu } from 'lucide-react';

// 設定 API 網址 (請依據實際部署 IP 修改，若前後端在同一台則用 localhost)
const API_BASE_URL = '/api';

const App = () => {
  // --- Form State ---
  const [formData, setFormData] = useState({
    submitterName: '',
    submitterRole: '',
    office: '', 
    
    // Detection Policy - Blacklist
    blacklist_checked: false,
    blacklist_domain: false,
    blacklist_domain_val: '',
    blacklist_regex: false,
    blacklist_regex_val: '',

    // Detection Policy - Whitelist
    whitelist_checked: false,
    whitelist_domain: false,
    whitelist_domain_val: '',
    whitelist_regex: false,
    whitelist_regex_val: '',

    // Detection Policy - Sender/Receiver
    sender_checked: false,
    sender_domain: false,
    sender_domain_val: '',
    sender_regex: false,
    sender_regex_val: '',

    // Keywords
    keywords_checked: false,
    keywords_caseSensitive: false,
    keywords_subject: false,
    keywords_subject_val: '',
    keywords_content: false,
    keywords_content_val: '',
    keywords_attachment: false,
    keywords_attachment_val: '',

    // Attachments
    attachment_checked: false,
    attachment_size: false,
    attachment_size_val: '',
    attachment_count: false,
    attachment_count_val: '',
    attachment_compress: false,
    attachment_ext: false,
    attachment_ext_val: '',
    attachment_tamper: false,

    // Source Code & Text Deduplication
    sourcecode_checked: false,
    dedup_checked: false,

    // Control - Approval
    approval_checked: false,
    approval_time: '',
    approval_timeout_strategy: '自動通過',

    // Control - CC/BCC
    cc_checked: false,
    cc_val: '',
    bcc_checked: false,
    bcc_val: ''
  });

  const [submittedData, setSubmittedData] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('form'); 
  const [errors, setErrors] = useState([]);
  const [isBackendUnlocked, setIsBackendUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification Modal State
  const [notification, setNotification] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null 
  });

  // --- Fetch Data from Backend API ---
  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/records`);
      if (response.ok) {
        const data = await response.json();
        setSubmittedData(data);
      } else {
        console.error("Failed to fetch records");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  // Load data when entering backend tab
  useEffect(() => {
    if (activeTab === 'backend' && isBackendUnlocked) {
      fetchRecords();
      // Optional: Set up polling for real-time like updates (e.g., every 5 seconds)
      const interval = setInterval(fetchRecords, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, isBackendUnlocked]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors.length > 0) setErrors([]);
  };

  const validateForm = () => {
    const newErrors = [];
    if (!formData.submitterRole) newErrors.push("請選擇「填寫人職級」。");
    if (!formData.office) newErrors.push("請選擇「辦公室」。");

    if (formData.blacklist_checked) {
      if (!formData.blacklist_domain && !formData.blacklist_regex) newErrors.push("勾選「黑名單」後，請至少選擇一種過濾方式。");
      if (formData.blacklist_domain && !formData.blacklist_domain_val.trim()) newErrors.push("黑名單：請填寫「域名/信箱/IP」。");
      if (formData.blacklist_regex && !formData.blacklist_regex_val.trim()) newErrors.push("黑名單：請填寫「正規表達式」。");
    }

    if (formData.whitelist_checked) {
      if (!formData.whitelist_domain && !formData.whitelist_regex) newErrors.push("勾選「白名單」後，請至少選擇一種過濾方式。");
      if (formData.whitelist_domain && !formData.whitelist_domain_val.trim()) newErrors.push("白名單：請填寫「域名/信箱/IP」。");
      if (formData.whitelist_regex && !formData.whitelist_regex_val.trim()) newErrors.push("白名單：請填寫「正規表達式」。");
    }

    if (formData.keywords_checked) {
        if (!formData.keywords_subject && !formData.keywords_content && !formData.keywords_attachment) newErrors.push("勾選「關鍵字」後，請至少選擇一種檢查範圍。");
        if (formData.keywords_subject && !formData.keywords_subject_val.trim()) newErrors.push("關鍵字：請填寫「主題」關鍵字。");
        if (formData.keywords_content && !formData.keywords_content_val.trim()) newErrors.push("關鍵字：請填寫「內容」關鍵字。");
        if (formData.keywords_attachment && !formData.keywords_attachment_val.trim()) newErrors.push("關鍵字：請填寫「附件」關鍵字。");
    }

    if (formData.attachment_checked) {
        const hasSub = formData.attachment_size || formData.attachment_count || formData.attachment_compress || formData.attachment_ext || formData.attachment_tamper;
        if (!hasSub) newErrors.push("勾選「附件」後，請至少選擇一種檢查條件。");
        if (formData.attachment_size && !formData.attachment_size_val) newErrors.push("附件：請填寫「附件大小」。");
        if (formData.attachment_count && !formData.attachment_count_val) newErrors.push("附件：請填寫「附件數量」。");
        if (formData.attachment_ext && !formData.attachment_ext_val.trim()) newErrors.push("附件：請填寫「副檔名」。");
    }

    if (!formData.approval_checked) {
        newErrors.push("請勾選「審批」並填寫相關資訊（此為必選項目）。");
    } else {
        if (!formData.approval_time) newErrors.push("請填寫「審批時間」。");
    }

    if (formData.cc_checked && !formData.cc_val.trim()) newErrors.push("請填寫「抄送」目標用戶。");
    if (formData.bcc_checked && !formData.bcc_val.trim()) newErrors.push("請填寫「密送」目標用戶。");

    return newErrors;
  };

  const generateSummary = (data) => {
    const formatSection = (parentChecked, items) => {
      if (!parentChecked) return 'N/A';
      const result = items.filter(i => i).join('；');
      return result || '已啟用';
    };

    const blacklistItems = [];
    if (data.blacklist_domain) blacklistItems.push(`域名/IP: ${data.blacklist_domain_val}`);
    if (data.blacklist_regex) blacklistItems.push(`正則: ${data.blacklist_regex_val}`);

    const whitelistItems = [];
    if (data.whitelist_domain) whitelistItems.push(`域名/IP: ${data.whitelist_domain_val}`);
    if (data.whitelist_regex) whitelistItems.push(`正則: ${data.whitelist_regex_val}`);

    const senderItems = [];
    if (data.sender_domain) senderItems.push(`域名/IP: ${data.sender_domain_val}`);
    if (data.sender_regex) senderItems.push(`正則: ${data.sender_regex_val}`);

    const keywordItems = [];
    if (data.keywords_caseSensitive) keywordItems.push('大小寫/繁簡敏感');
    if (data.keywords_subject) keywordItems.push(`主題: ${data.keywords_subject_val}`);
    if (data.keywords_content) keywordItems.push(`內容: ${data.keywords_content_val}`);
    if (data.keywords_attachment) keywordItems.push(`附件: ${data.keywords_attachment_val}`);

    const attachmentItems = [];
    if (data.attachment_size) attachmentItems.push(`大小: ${data.attachment_size_val}MB`);
    if (data.attachment_count) attachmentItems.push(`數量: ${data.attachment_count_val}個`);
    if (data.attachment_compress) attachmentItems.push('壓縮檔');
    if (data.attachment_ext) attachmentItems.push(`副檔名: ${data.attachment_ext_val}`);
    if (data.attachment_tamper) attachmentItems.push('被竄改的副檔名');

    let approvalStr = 'N/A';
    if (data.approval_checked) {
      approvalStr = `時間: ${data.approval_time}分, 超時: ${data.approval_timeout_strategy}`;
    }

    return {
      submitterName: data.submitterName || '未填寫',
      submitterRole: data.submitterRole,
      office: data.office,
      blacklist: formatSection(data.blacklist_checked, blacklistItems),
      whitelist: formatSection(data.whitelist_checked, whitelistItems),
      sender: formatSection(data.sender_checked, senderItems),
      keywords: formatSection(data.keywords_checked, keywordItems),
      attachment: formatSection(data.attachment_checked, attachmentItems),
      sourcecode: data.sourcecode_checked ? '啟用' : 'N/A',
      dedup: data.dedup_checked ? '啟用' : 'N/A',
      approval: approvalStr,
      cc: data.cc_checked ? data.cc_val : 'N/A',
      bcc: data.bcc_checked ? data.bcc_val : 'N/A',
      // No timestamp generated here, backend will add it
    };
  };

  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  // --- Handle Submit (Send to API) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
        setErrors(validationErrors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setNotification({
          show: true,
          type: 'error',
          title: '資料驗證失敗',
          message: '表單中仍有未填寫的必填欄位，請檢查上方紅色提示訊息。',
          onConfirm: null
        });
        return;
    }

    setIsSubmitting(true);
    const newEntry = generateSummary(formData);

    try {
      // POST to backend
      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) {
        // Try to get error message from server
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server Error: ${response.status}`);
      }
      
      setErrors([]);
      setNotification({
        show: true,
        type: 'success',
        title: '策略已送出',
        message: '策略已送出，資料已成功儲存！',
        onConfirm: null
      });
      
    } catch (error) {
      console.error("Submit Error: ", error);
      setNotification({
        show: true,
        type: 'error',
        title: '儲存失敗',
        message: `無法連線到伺服器或資料庫寫入失敗。\n(${error.message})`,
        onConfirm: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handle Clear Data (Call API) ---
  const clearData = () => {
    setNotification({
      show: true,
      type: 'confirm',
      title: '確認清空資料',
      message: '這將會「永久刪除」資料庫中所有的紀錄，所有人的填寫內容都會消失，且無法復原。您確定要執行嗎？',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/clear`, { method: 'DELETE' });
          if(response.ok) {
             setSubmittedData([]);
             closeNotification();
          } else {
             alert('清空失敗');
          }
        } catch (error) {
           console.error("Clear Error:", error);
           alert("連線錯誤");
        }
      }
    });
  };

  const handleTabChange = (tab) => {
    if (tab === 'backend' && !isBackendUnlocked) {
        setShowPasswordModal(true);
    } else {
        setActiveTab(tab);
    }
  };

  const handlePasswordSubmit = (e) => {
      e.preventDefault();
      if (passwordInput === '500187') {
          setIsBackendUnlocked(true);
          setShowPasswordModal(false);
          setActiveTab('backend');
          setPasswordInput('');
          setPasswordError('');
      } else {
          setPasswordError('密碼錯誤，請重試。');
      }
  };

  const downloadCSV = () => {
    if (submittedData.length === 0) {
      setNotification({
        show: true,
        type: 'error',
        title: '無法匯出',
        message: '目前沒有任何資料可供匯出。',
        onConfirm: null
      });
      return;
    }

    const headers = [
      "填寫人", "職級", "辦公室", "黑名單", "白名單", "收/發件人", 
      "關鍵字", "附件", "源代碼", "文本查重", "審批", "抄送", "密送", "時間戳記"
    ];

    const csvRows = [
      headers.join(','),
      ...submittedData.map(row => {
        const values = [
          row.submitterName,
          row.submitterRole,
          row.office,
          row.blacklist,
          row.whitelist,
          row.sender,
          row.keywords,
          row.attachment,
          row.sourcecode,
          row.dedup, 
          row.approval,
          row.cc,
          row.bcc,
          row.timestamp
        ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`);
        return values.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eDLP_Strategy_Export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 relative">
      
      {/* Generic Notification Modal */}
      {notification.show && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative transform transition-all scale-100">
                  <button 
                    onClick={closeNotification}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-full mb-4 ${
                          notification.type === 'error' ? 'bg-red-100 text-red-500' : 
                          notification.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 
                          'bg-orange-100 text-orange-500'
                      }`}>
                          {notification.type === 'error' && <AlertCircle size={32} />}
                          {notification.type === 'success' && <CheckCircle size={32} />}
                          {notification.type === 'confirm' && <AlertTriangle size={32} />}
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{notification.title}</h3>
                      <p className="text-slate-600 mb-6 whitespace-pre-wrap">{notification.message}</p>
                      
                      <div className="flex gap-3 w-full">
                          {notification.type === 'confirm' ? (
                            <>
                              <button onClick={closeNotification} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">取消</button>
                              <button onClick={notification.onConfirm} className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors">確認清空</button>
                            </>
                          ) : (
                            <button onClick={closeNotification} className={`w-full py-2.5 rounded-lg text-white font-bold transition-colors ${notification.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>好的</button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
                  <button onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                  <div className="flex flex-col items-center mb-6"><div className="bg-red-100 p-3 rounded-full mb-4"><Lock size={32} className="text-red-500" /></div><h3 className="text-2xl font-bold text-slate-800">管理員驗證</h3><p className="text-slate-500 mt-2">請輸入密碼以查看後台資料</p></div>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="請輸入密碼" className="w-full text-center text-lg p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" autoFocus />
                          {passwordError && <p className="text-red-500 text-sm mt-2 text-center flex items-center justify-center gap-1"><AlertCircle size={14} /> {passwordError}</p>}
                      </div>
                      <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">確認</button>
                  </form>
              </div>
          </div>
      )}

      {/* RWD Header: Stack on mobile, Row on tablet/desktop */}
      <header className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-wide">eDLP 策略設定平台</h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            {/* RWD Button Styling & Active State Colors */}
            <button 
              onClick={() => handleTabChange('form')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm font-bold ${
                activeTab === 'form' 
                  ? 'bg-white text-emerald-700 shadow-md transform scale-105' 
                  : 'text-white bg-transparent hover:bg-emerald-500/50'
              }`}
            >
              <FileText size={18} /> 表單填寫
            </button>
            <button 
              onClick={() => handleTabChange('backend')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm font-bold ${
                activeTab === 'backend' 
                  ? 'bg-white text-emerald-700 shadow-md transform scale-105' 
                  : 'text-white bg-transparent hover:bg-emerald-500/50'
              }`}
            >
              {isBackendUnlocked ? <Settings size={18} /> : <Lock size={18} />} 
              後台資料 ({submittedData.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Validation Errors Banner */}
        {errors.length > 0 && activeTab === 'form' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm animate-in slide-in-from-top-2">
                <div className="flex items-start">
                    <div className="flex-shrink-0"><AlertCircle className="h-5 w-5 text-red-500" /></div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">請修正以下錯誤以送出表單：</h3>
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                            {errors.map((error, index) => (<li key={index}>{error}</li>))}
                        </ul>
                    </div>
                </div>
            </div>
        )}
        
        {/* FORM VIEW */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 0. Submitter Info Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <div className="bg-purple-500 text-white p-1.5 rounded-md"><UserCheck size={20} /></div>
                <h2 className="text-xl font-bold text-slate-700">0. 填寫人資訊 (Submitter Info)</h2>
              </div>
              <div className="p-6 space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="font-bold text-slate-700 min-w-[100px]">填寫人 <span className="text-slate-400 font-normal text-sm">(選填)</span>:</label>
                  <input type="text" name="submitterName" value={formData.submitterName} onChange={handleInputChange} maxLength={10} placeholder="限填10字" className="w-full md:w-48 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>

                <div className="flex flex-col md:flex-row md:items-start gap-4">
                   <label className="font-bold text-slate-700 min-w-[100px] mt-2">職級 <span className="text-red-500 text-sm align-top">*必選</span>:</label>
                   <div className="flex flex-wrap gap-4">
                      {['部門二級主管', '部門三級主管', '部門四級主管'].map((role) => (
                        <label key={role} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.submitterRole === role ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-purple-200'}`}>
                          <input type="radio" name="submitterRole" value={role} checked={formData.submitterRole === role} onChange={handleInputChange} className="w-4 h-4 text-purple-600 focus:ring-purple-500 mr-2" />
                          <span>{role}</span>
                        </label>
                      ))}
                   </div>
                </div>
              </div>
            </section>

            {/* 1. Office Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <div className="bg-emerald-500 text-white p-1.5 rounded-md"><Users size={20} /></div>
                <h2 className="text-xl font-bold text-slate-700">1. 辦公室選擇 (Office) <span className="text-red-500 text-sm align-top">*必選</span></h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['瑞三office', '瑞四office', '台元office', '其他office'].map((opt) => (
                  <label key={opt} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.office === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-200'}`}>
                    <input type="radio" name="office" value={opt} checked={formData.office === opt} onChange={handleInputChange} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 mr-3" />
                    <span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 2. Detection Policy */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <div className="bg-blue-500 text-white p-1.5 rounded-md"><Shield size={20} /></div>
                <h2 className="text-xl font-bold text-slate-700">2. 檢測策略 (Detection Policy)</h2>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* Blacklist */}
                <div className={`border rounded-lg p-4 transition-all ${formData.blacklist_checked ? 'border-blue-300 shadow-sm' : 'border-slate-200 hover:shadow-md'}`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input type="checkbox" name="blacklist_checked" checked={formData.blacklist_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-lg font-bold text-slate-800">黑名單 (Blacklist)</span>
                  </label>
                  {formData.blacklist_checked && (
                    <div className="ml-8 mt-3 space-y-3 pl-4 border-l-2 border-blue-200 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[200px]"><input type="checkbox" name="blacklist_domain" checked={formData.blacklist_domain} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>收、發件人域名/信箱/IP</span></label>
                        {formData.blacklist_domain && <input type="text" name="blacklist_domain_val" value={formData.blacklist_domain_val} onChange={handleInputChange} placeholder="例如: @badsite.com" className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[200px]"><input type="checkbox" name="blacklist_regex" checked={formData.blacklist_regex} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>正規表達式</span></label>
                        {formData.blacklist_regex && <input type="text" name="blacklist_regex_val" value={formData.blacklist_regex_val} onChange={handleInputChange} placeholder="輸入 Regex Pattern" className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Whitelist */}
                <div className={`border rounded-lg p-4 transition-all ${formData.whitelist_checked ? 'border-blue-300 shadow-sm' : 'border-slate-200 hover:shadow-md'}`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input type="checkbox" name="whitelist_checked" checked={formData.whitelist_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-lg font-bold text-slate-800">白名單 (Whitelist)</span>
                  </label>
                  {formData.whitelist_checked && (
                    <div className="ml-8 mt-3 space-y-3 pl-4 border-l-2 border-blue-200 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[200px]"><input type="checkbox" name="whitelist_domain" checked={formData.whitelist_domain} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>收、發件人域名/信箱/IP</span></label>
                        {formData.whitelist_domain && <input type="text" name="whitelist_domain_val" value={formData.whitelist_domain_val} onChange={handleInputChange} placeholder="例如: @trusted.com" className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[200px]"><input type="checkbox" name="whitelist_regex" checked={formData.whitelist_regex} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>正規表達式</span></label>
                        {formData.whitelist_regex && <input type="text" name="whitelist_regex_val" value={formData.whitelist_regex_val} onChange={handleInputChange} placeholder="輸入 Regex Pattern" className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                <div className={`border rounded-lg p-4 transition-all ${formData.keywords_checked ? 'border-blue-300 shadow-sm' : 'border-slate-200 hover:shadow-md'}`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input type="checkbox" name="keywords_checked" checked={formData.keywords_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-lg font-bold text-slate-800">關鍵字 (Keywords)</span>
                  </label>
                  {formData.keywords_checked && (
                    <div className="ml-8 mt-3 space-y-3 pl-4 border-l-2 border-blue-200 animate-in fade-in slide-in-from-top-2">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="keywords_caseSensitive" checked={formData.keywords_caseSensitive} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span className="text-slate-600">英文大小寫敏感，繁簡中敏感</span></label>
                      {['subject', 'content', 'attachment'].map(field => {
                         const labelMap = { subject: '主題', content: '內容', attachment: '附件' };
                         const fieldName = `keywords_${field}`;
                         const valName = `keywords_${field}_val`;
                         return (
                          <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer min-w-[100px]"><input type="checkbox" name={fieldName} checked={formData[fieldName]} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>{labelMap[field]}</span></label>
                            {formData[fieldName] && <input type="text" name={valName} value={formData[valName]} onChange={handleInputChange} placeholder={`輸入${labelMap[field]}關鍵字`} className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                          </div>
                         );
                      })}
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div className={`border rounded-lg p-4 transition-all ${formData.attachment_checked ? 'border-blue-300 shadow-sm' : 'border-slate-200 hover:shadow-md'}`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input type="checkbox" name="attachment_checked" checked={formData.attachment_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-lg font-bold text-slate-800">附件 (Attachment)</span>
                  </label>
                  {formData.attachment_checked && (
                    <div className="ml-8 mt-3 space-y-3 pl-4 border-l-2 border-blue-200 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[150px]"><input type="checkbox" name="attachment_size" checked={formData.attachment_size} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>附件大小</span></label>
                        {formData.attachment_size && <div className="flex items-center gap-2"><input type="number" name="attachment_size_val" value={formData.attachment_size_val} onChange={handleInputChange} className="w-24 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" /><span className="text-slate-500">MB</span></div>}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[150px]"><input type="checkbox" name="attachment_count" checked={formData.attachment_count} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>附件數量</span></label>
                        {formData.attachment_count && <div className="flex items-center gap-2"><input type="number" name="attachment_count_val" value={formData.attachment_count_val} onChange={handleInputChange} className="w-24 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" /><span className="text-slate-500">個</span></div>}
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="attachment_compress" checked={formData.attachment_compress} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>壓縮檔</span></label>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[150px]"><input type="checkbox" name="attachment_ext" checked={formData.attachment_ext} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>副檔名</span></label>
                        {formData.attachment_ext && <input type="text" name="attachment_ext_val" value={formData.attachment_ext_val} onChange={handleInputChange} placeholder="例如: exe;txt;ai" className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="attachment_tamper" checked={formData.attachment_tamper} onChange={handleInputChange} className="w-4 h-4 rounded text-blue-600" /><span>被竄改的副檔名</span></label>
                    </div>
                  )}
                </div>

                {/* Simple Checkboxes */}
                <div className="flex flex-col md:flex-row gap-6">
                  <label className="flex items-center gap-2 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50 w-full transition-all">
                    <input type="checkbox" name="sourcecode_checked" checked={formData.sourcecode_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-blue-600" />
                    <span className="font-bold">源代碼 (Source Code)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50 w-full transition-all">
                    <input type="checkbox" name="dedup_checked" checked={formData.dedup_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-blue-600" />
                    <span className="font-bold">文本查重 (Deduplication)</span>
                  </label>
                </div>

              </div>
            </section>

            {/* 3. Control Measures */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <div className="bg-orange-500 text-white p-1.5 rounded-md"><Settings size={20} /></div>
                <h2 className="text-xl font-bold text-slate-700">3. 管制措施 (Control)</h2>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* Approval */}
                <div className={`border rounded-lg p-4 transition-all ${formData.approval_checked ? 'border-orange-300 shadow-sm' : 'border-slate-200 hover:shadow-md'}`}>
                   <div className="flex flex-col md:flex-row md:items-start gap-4">
                     <label className="flex items-center gap-3 cursor-pointer mt-2 min-w-[100px]">
                        <input type="checkbox" name="approval_checked" checked={formData.approval_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500" />
                        <span className="text-lg font-bold text-slate-800">審批 <span className="text-red-500 text-sm align-top">*必選</span></span>
                     </label>

                     {formData.approval_checked && (
                       <div className="flex-1 bg-orange-50 p-4 rounded-lg space-y-4 border border-orange-100 animate-in fade-in slide-in-from-top-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-medium text-slate-700">審批時間 <span className="text-red-500">*</span>:</span>
                            <input type="number" name="approval_time" value={formData.approval_time} onChange={handleInputChange} className="w-24 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" placeholder="分鐘" />
                            <span className="text-slate-500">分鐘</span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <span className="font-medium text-slate-700">超時策略:</span>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="approval_timeout_strategy" value="自動通過" checked={formData.approval_timeout_strategy === '自動通過'} onChange={handleInputChange} className="text-orange-600" /><span>自動通過</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="approval_timeout_strategy" value="自動攔截" checked={formData.approval_timeout_strategy === '自動攔截'} onChange={handleInputChange} className="text-orange-600" /><span>自動攔截</span></label>
                            </div>
                          </div>
                       </div>
                     )}
                   </div>
                </div>

                {/* CC / BCC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CC */}
                  <div className={`border rounded-lg p-4 transition-all ${formData.cc_checked ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}`}>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                       <input type="checkbox" name="cc_checked" checked={formData.cc_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-orange-600" />
                       <span className="font-bold text-lg">抄送 (CC)</span>
                    </label>
                    {formData.cc_checked && (
                      <div className="pl-7 animate-in fade-in slide-in-from-top-1">
                        <label className="block text-sm text-slate-600 mb-1">目標用戶 (部門或個人) <span className="text-red-500">*</span>:</label>
                        <div className="flex items-center gap-2 bg-white rounded-md border border-slate-300 px-2 focus-within:ring-2 focus-within:ring-orange-500">
                           <Mail size={16} className="text-slate-400" />
                           <input type="text" name="cc_val" value={formData.cc_val} onChange={handleInputChange} placeholder="抄送給..." className="flex-1 p-2 outline-none text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BCC */}
                  <div className={`border rounded-lg p-4 transition-all ${formData.bcc_checked ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}`}>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                       <input type="checkbox" name="bcc_checked" checked={formData.bcc_checked} onChange={handleInputChange} className="w-5 h-5 rounded text-orange-600" />
                       <span className="font-bold text-lg">密送 (BCC)</span>
                    </label>
                    {formData.bcc_checked && (
                      <div className="pl-7 animate-in fade-in slide-in-from-top-1">
                        <label className="block text-sm text-slate-600 mb-1">目標用戶 (部門或個人) <span className="text-red-500">*</span>:</label>
                        <div className="flex items-center gap-2 bg-white rounded-md border border-slate-300 px-2 focus-within:ring-2 focus-within:ring-orange-500">
                           <Users size={16} className="text-slate-400" />
                           <input type="text" name="bcc_val" value={formData.bcc_val} onChange={handleInputChange} placeholder="密送給..." className="flex-1 p-2 outline-none text-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
               <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                 <Save size={24} /> {isSubmitting ? '處理中...' : '儲存並送出策略'}
               </button>
            </div>

          </form>
        )}

        {/* BACKEND VIEW */}
        {activeTab === 'backend' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={20} /> 後台資料模擬 (Backend Simulation)
                </h2>
                <div className="flex gap-2">
                   <button onClick={clearData} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded text-sm transition-colors flex items-center gap-1">
                     <Trash2 size={14} /> 清空
                   </button>
                   <button onClick={downloadCSV} className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 rounded text-sm transition-colors flex items-center gap-1">
                     <Download size={14} /> 匯出 CSV
                   </button>
                </div>
              </div>
              
              <div className="p-0 overflow-x-auto">
                {submittedData.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Settings size={48} className="mx-auto mb-4 opacity-20" />
                    <p>目前尚無資料，請先至「表單填寫」頁面送出策略。</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left text-slate-600 min-w-[1200px]">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-extrabold text-purple-700">填寫人</th>
                        <th className="px-6 py-4 font-extrabold text-purple-700">職級</th>
                        <th className="px-6 py-4 font-extrabold">辦公室</th>
                        <th className="px-6 py-4 font-extrabold">黑名單</th>
                        <th className="px-6 py-4 font-extrabold">白名單</th>
                        <th className="px-6 py-4 font-extrabold">收/發件人</th>
                        <th className="px-6 py-4 font-extrabold">關鍵字</th>
                        <th className="px-6 py-4 font-extrabold">附件</th>
                        <th className="px-6 py-4 font-extrabold">源代碼</th>
                        <th className="px-6 py-4 font-extrabold">審批</th>
                        <th className="px-6 py-4 font-extrabold">抄送</th>
                        <th className="px-6 py-4 font-extrabold">密送</th>
                        <th className="px-6 py-4 font-extrabold">時間戳記</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submittedData.map((row, index) => (
                        <tr key={index} className="bg-white hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{row.submitterName}</td>
                          <td className="px-6 py-4 text-purple-600 font-bold whitespace-nowrap">{row.submitterRole}</td>
                          <td className="px-6 py-4 font-medium text-emerald-700 whitespace-nowrap">{row.office}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate" title={row.blacklist}>{row.blacklist}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate" title={row.whitelist}>{row.whitelist}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate" title={row.sender}>{row.sender}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate" title={row.keywords}>{row.keywords}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate" title={row.attachment}>{row.attachment}</td>
                          <td className="px-6 py-4">{row.sourcecode}</td>
                          <td className="px-6 py-4 max-w-[200px] truncate" title={row.approval}>{row.approval}</td>
                          <td className="px-6 py-4">{row.cc}</td>
                          <td className="px-6 py-4">{row.bcc}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{row.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
