import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import '../pages/DocumentCategories.css';
import Layout from '../components/Layout';
import { PDFDocument } from 'pdf-lib';
import * as pako from 'pako';
import { saveFileBlob, getFileBlob, deleteFileBlob } from '../utils/indexedDBUtils';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';


const categories = [
  { key: 'Reports', title: 'Reports', icon: 'fa-file-alt', bg: '#4CAF50' },
  { key: 'Contracts', title: 'Contracts', icon: 'fa-file-signature', bg: '#2196F3' },
  { key: 'Invoices', title: 'Invoices', icon: 'fa-file-invoice-dollar', bg: '#FFA726' },
  { key: 'Receipts', title: 'Receipts', icon: 'fa-receipt', bg: '#FF9800' },
  { key: 'Presentations', title: 'Presentations', icon: 'fa-file-powerpoint', bg: '#9C27B0' },
  { key: 'Others', title: 'Others', icon: 'fa-ellipsis-h', bg: '#9E9E9E' }
];

const DocumentCategories = () => {
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    author: '',
    date: '',
    description: '',
    file: null
  });

  // Function to notify other components about document updates
  const notifyDocumentUpdate = () => {
    window.dispatchEvent(new CustomEvent('documentsUpdated'));
  };

  // Load documents when component mounts
  useEffect(() => {
    loadDocuments();
    
    const handleDocumentUpdate = () => {
      loadDocuments();
    };

    window.addEventListener('documentsUpdated', handleDocumentUpdate);

    return () => {
      window.removeEventListener('documentsUpdated', handleDocumentUpdate);
    };
  }, []);

  const compressPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

    Swal.fire('Info', 'PDF was compressed before uploading.', 'info');

    return new File([compressedBytes], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  };

  const compressGenericFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const compressed = pako.deflate(new Uint8Array(arrayBuffer));

    Swal.fire('Info', 'Document was compressed before uploading.', 'info');

    return new File([compressed], file.name + '.gz', {
      type: 'application/gzip',
      lastModified: Date.now(),
    });
  };

  const loadDocuments = () => {
    try {
      const stored = localStorage.getItem('documents');
      const docs = stored ? JSON.parse(stored) : [];
      setAllDocuments(docs);
      console.log('Loaded documents:', docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setAllDocuments([]);
    }
  };

  const saveDocuments = (documents) => {
    try {
      localStorage.setItem('documents', JSON.stringify(documents));
      setAllDocuments(documents);
      notifyDocumentUpdate();
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  };

  const handleCategoryClick = (categoryKey, categoryTitle) => {
    setSelectedCategory({ key: categoryKey, title: categoryTitle });
    setShowOptionsDialog(true);
  };

  const handleViewDocuments = () => {
    setShowOptionsDialog(false);
    showDocuments(selectedCategory.key, selectedCategory.title);
  };

  const handleAddDocument = () => {
    setShowOptionsDialog(false);
    setShowAddForm(true);
    setFormData({
      name: '',
      author: '',
      date: '',
      description: '',
      file: null
    });
  };

  const validateFile = (file) => {
    const maxSizeMB = 10;
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg', 
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      Swal.fire('Invalid File Type', 'Only PDF, DOC, DOCX, PPT, PPTX, TXT, CSV, JPG, PNG, GIF files are allowed.', 'error');
      return false;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      Swal.fire('File Too Large', `File size exceeds ${maxSizeMB}MB. Please choose a smaller file.`, 'warning');
      return false;
    }

    return true;
  };

  // Dropzone handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setFormData(prev => ({ ...prev, file }));
        // Auto-fill name if empty
        if (!formData.name) {
          const fileName = file.name.split('.')[0];
          setFormData(prev => ({ ...prev, name: fileName, file }));
        }
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setFormData(prev => ({ ...prev, file }));
      // Auto-fill name if empty
      if (!formData.name) {
        const fileName = file.name.split('.')[0];
        setFormData(prev => ({ ...prev, name: fileName, file }));
      }
    }
  };

  const showDocuments = (categoryKey, categoryTitle) => {
    try {
      console.log("All docs:", allDocuments);
      console.log("Looking for category:", categoryKey);
      
      const categoryDocs = allDocuments.filter(doc => {
        console.log("Doc category:", doc.category, "Looking for:", categoryKey);
        return doc.category === categoryKey;
      });
      
      console.log("Category docs found:", categoryDocs);
      
      if (categoryDocs.length === 0) {
        Swal.fire('No Documents', `No documents found in ${categoryTitle} category.`, 'info');
        return;
      }

      setSelectedDocs(categoryDocs);
      setModalTitle(categoryTitle);
    } catch (error) {
      console.error("Error fetching documents:", error);
      Swal.fire("Error", "Failed to fetch documents", "error");
    }
  };

  const previewDocument = (doc) => {
  if (doc.fileDataUrl) {
    const newWindow = window.open('', '_blank', 'width=900,height=700');

    if (newWindow) {
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      const secureHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${escapeHtml(doc.name)}</title>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              box-sizing: border-box;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              height: 100%;
              overflow: auto;
              user-select: none !important;
            }
            
            .main-container {
              display: flex;
              flex-direction: column;
              height: 100vh;
              backdrop-filter: blur(10px);
            }
            
            .header {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
              padding: 20px 30px;
              box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
              position: relative;
              z-index: 10;
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: 600;
              color: #2d3748;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            .header h1::before {
              content: "📄";
              font-size: 28px;
            }
            
            .header-meta {
              display: flex;
              gap: 30px;
              font-size: 14px;
              color: #718096;
              align-items: center;
            }
            
            .meta-item {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .meta-item::before {
              width: 4px;
              height: 4px;
              background: #667eea;
              border-radius: 50%;
              content: "";
            }
            
            .security-badge {
              background: rgba(255, 107, 107, 0.1);
              color: #e53e3e;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 107, 107, 0.3);
              display: flex;
              align-items: center;
              gap: 6px;
              margin-left: auto;
            }
            
            .content-area {
              flex: 1;
              padding: 30px;
              display: flex;
              flex-direction: column;
            }
            
            .document-container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
              flex: 1;
              overflow: auto;
              position: relative;
              transition: all 0.3s ease;
              border: 1px solid rgba(255, 255, 255, 0.3);
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
            
            .document-container:hover {
              box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
              transform: translateY(-2px);
            }

            .document-container::-webkit-scrollbar {
              width: 12px;
            }

            .document-container::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }

            .document-container::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
            }

            .document-container::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            }
            
            iframe, img {
              width: 100%;
              height: auto;
              min-height: 100%;
              border: none;
              border-radius: 16px;
              display: block;
              object-fit: contain;
              pointer-events: auto;
            }

            .security-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: transparent;
              z-index: 5;
              cursor: pointer;
              pointer-events: none;
            }
            
            .custom-alert {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0.8);
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              z-index: 100000;
              max-width: 450px;
              text-align: center;
              opacity: 0;
              transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              border: 2px solid #667eea;
            }
            
            .custom-alert.warning {
              border-color: #ff6b6b;
              background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            }
            
            .dialog-box {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0.9);
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              border-radius: 16px;
              box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
              z-index: 100001;
              max-width: 350px;
              text-align: center;
              opacity: 0;
              transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
              color: white;
            }
            
            .dialog-box.show {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            
            .dialog-loader {
              width: 50px;
              height: 50px;
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-top: 4px solid white;
              border-radius: 50%;
              animation: dialogSpin 1s linear infinite;
              margin: 0 auto 20px;
            }
            
            @keyframes dialogSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .dialog-title {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            
            .dialog-message {
              font-size: 14px;
              opacity: 0.9;
              line-height: 1.4;
            }
            
            .custom-alert.show {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            
            .custom-alert-backdrop {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              z-index: 99999;
              opacity: 0;
              transition: opacity 0.3s ease;
              backdrop-filter: blur(5px);
            }
            
            .custom-alert-backdrop.show {
              opacity: 1;
            }
            
            .alert-icon {
              font-size: 48px;
              margin-bottom: 20px;
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            
            .alert-title {
              font-size: 24px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 10px;
            }
            
            .alert-title.warning {
              color: #e53e3e;
            }
            
            .alert-message {
              font-size: 16px;
              color: #718096;
              line-height: 1.5;
              margin-bottom: 25px;
            }
            
            .alert-message.warning {
              color: #c53030;
            }
            
            .alert-button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              outline: none;
              margin: 0 8px;
            }
            
            .alert-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .alert-button.warning {
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            }
            
            .alert-button.warning:hover {
              box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
            }
            
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 20px;
              color: rgba(255, 107, 107, 0.1);
              z-index: 4;
              pointer-events: none;
              user-select: none;
              white-space: nowrap;
              font-weight: 600;
            }

            .scroll-container {
              flex: 1;
              overflow-y: auto;
              padding: 20px;
              border-radius: 0 0 12px 12px;
            }
            
            .loading-spinner {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              z-index: 6;
            }
            
            @keyframes spin {
              0% { transform: translate(-50%, -50%) rotate(0deg); }
              100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="custom-alert-backdrop" id="alertBackdrop"></div>
          
          <!-- First Warning Dialog -->
          <div class="custom-alert" id="firstWarningAlert">
            <div class="alert-icon">🤝</div>
            <div class="alert-title">Please Respect Content Privacy</div>
            <div class="alert-message">We kindly request that you do not take screenshots or record this document. This helps us protect the content and maintain security. Thank you for your understanding!</div>
            <button class="alert-button" onclick="closeFirstWarning()">Understood</button>
          </div>

          <!-- Second Warning Dialog -->
          <div class="custom-alert warning" id="secondWarningAlert">
            <div class="alert-icon">⚠️</div>
            <div class="alert-title warning">Security Violation Detected</div>
            <div class="alert-message warning">You are violating our content protection policy. Continued attempts will result in immediate closure of this document.</div>
            
          </div>

          <!-- Regular Interaction Alert -->
          <div class="custom-alert" id="customAlert">
            <div class="alert-icon">🔒</div>
            <div class="alert-title">Document Protected</div>
            <div class="alert-message">This document is in secure preview mode. Interaction is restricted to protect content integrity.</div>
            <button class="alert-button" onclick="closeAlert()">Got it!</button>
          </div>

          <div class="dialog-box" id="dialogBox">
            <div class="dialog-loader"></div>
            <div class="dialog-title">Processing Request</div>
            <div class="dialog-message">Analyzing document interaction...</div>
          </div>

          <div class="main-container">
            <div class="header">
              <h1>${escapeHtml(doc.name)}</h1>
              <div class="header-meta">
                <div class="meta-item">
                  <span><strong>Author:</strong> ${escapeHtml(doc.author)}</span>
                </div>
                <div class="meta-item">
                  <span><strong>Date:</strong> ${escapeHtml(doc.date)}</span>
                </div>
                <div class="meta-item">
                  <span><strong>Status:</strong> Secure Preview</span>
                </div>
                <div class="security-badge">
                  🔐 Protected
                </div>
              </div>
            </div>
            
            <div class="content-area">
              <div class="document-container" id="documentContainer">
                <div class="loading-spinner" id="loadingSpinner"></div>
                <div class="security-overlay" onclick="showDialogBox()" onmousedown="showDialogBox()" oncontextmenu="showDialogBox()"></div>
                <div class="watermark">SECURE PREVIEW</div>
                 ${
                  doc.fileDataUrl.startsWith('data:image')
                    ? `<img src="${doc.fileDataUrl}" draggable="false" onload="hideLoading()" />`
                    : `<iframe src="${doc.fileDataUrl}#toolbar=0&navpanes=0&view=FitH" tabindex="-1" onload="hideLoading()"></iframe>`
                }
              </div>
            </div>
          </div>

          <script>
            // Alert elements
            const customAlert = document.getElementById('customAlert');
            const firstWarningAlert = document.getElementById('firstWarningAlert');
            const secondWarningAlert = document.getElementById('secondWarningAlert');
            const alertBackdrop = document.getElementById('alertBackdrop');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const dialogBox = document.getElementById('dialogBox');
            const documentContainer = document.getElementById('documentContainer');
            
            // Warning state tracking
            let screenshotAttempts = 0;
            let dialogShown = false;
            
            // Screenshot/Recording Detection Functions
            function handleScreenshotAttempt() {
              screenshotAttempts++;
              
              if (screenshotAttempts === 1) {
                showFirstWarning();
              } else if (screenshotAttempts >= 2) {
                showSecondWarning();
              }
            }
            
            function showFirstWarning() {
              if (dialogShown) return;
              dialogShown = true;
              alertBackdrop.classList.add('show');
              firstWarningAlert.classList.add('show');
            }
            
            function showSecondWarning() {
              if (dialogShown) return;
              dialogShown = true;
              alertBackdrop.classList.add('show');
              secondWarningAlert.classList.add('show');
            }
            
            function closeFirstWarning() {
              alertBackdrop.classList.remove('show');
              firstWarningAlert.classList.remove('show');
              dialogShown = false;
            }
            
            function closeSecondWarning() {
              alertBackdrop.classList.remove('show');
              secondWarningAlert.classList.remove('show');
              dialogShown = false;
            }
            
            function closeWindow() {
              document.body.innerHTML = '<div style="color:red;text-align:center;padding-top:50px;font-family:Inter,sans-serif;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);height:100vh;display:flex;align-items:center;justify-content:center;"><div style="background:white;padding:50px;border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,0.4);"><h1 style="color:#e53e3e;margin-bottom:20px;">❌ Document Closed</h1><p style="color:#718096;font-size:18px;">Security policy violation detected.</p></div></div>';
              setTimeout(() => window.close(), 2000);
            }
            
            // Regular interaction functions
            function showCustomAlert() {
              if (dialogShown) return;
              dialogShown = true;
              alertBackdrop.classList.add('show');
              customAlert.classList.add('show');
              setTimeout(() => { dialogShown = false; }, 1500);
            }
            
            function showDialogBox() {
              if (dialogShown) return;
              dialogShown = true;
              alertBackdrop.classList.add('show');
              dialogBox.classList.add('show');
              
              setTimeout(() => {
                dialogBox.classList.remove('show');
                setTimeout(() => {
                  customAlert.classList.add('show');
                }, 100);
                setTimeout(() => { dialogShown = false; }, 500);
              }, 1000);
            }
            
            function closeAlert() {
              alertBackdrop.classList.remove('show');
              customAlert.classList.remove('show');
              dialogBox.classList.remove('show');
              dialogShown = false;
            }
            
            function hideLoading() {
              if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
              }
            }
            
            // Close alert when clicking backdrop
            alertBackdrop.addEventListener('click', (e) => {
              if (e.target === alertBackdrop) {
                closeAlert();
                closeFirstWarning();
                closeSecondWarning();
              }
            });

            
            // Auto-hide loading after 3 seconds as fallback
            setTimeout(hideLoading, 3000);

            // Enhanced keyboard blocking with screenshot detection
            document.addEventListener('keydown', (e) => {
              // Print Screen detection
              if (e.key === 'PrintScreen') {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                handleScreenshotAttempt();
                return false;
              }
              
              // Screenshot combinations
              if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                handleScreenshotAttempt();
                return false;
              }
              
              // Windows + Print Screen
              if (e.key === 'Meta' && e.code === 'PrintScreen') {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                handleScreenshotAttempt();
                return false;
              }
              
              // Alt + Print Screen
              if (e.altKey && e.key === 'PrintScreen') {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                handleScreenshotAttempt();
                return false;
              }
              
              // macOS screenshot shortcuts
              if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                handleScreenshotAttempt();
                return false;
              }
              
              // General blocking for other shortcuts
              if (e.ctrlKey || e.metaKey || e.altKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                showDialogBox();
                return false;
              }
              
              // Block function keys
              if (e.key.startsWith('F')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                showDialogBox();
                return false;
              }
            }, { capture: true, passive: false });

            // Additional Print Screen detection on keyup
            document.addEventListener('keyup', (e) => {
              if (e.key === 'PrintScreen') {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                handleScreenshotAttempt();
                // Try to clear clipboard
                try { 
                  navigator.clipboard.writeText('').catch(() => {}); 
                } catch {}
                return false;
              }
            }, { capture: true, passive: false });

            // Window-level screenshot detection
            window.addEventListener('keydown', (e) => {
              if (e.key === 'PrintScreen' || 
                  (e.ctrlKey && e.shiftKey && e.key === 'S') ||
                  (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                handleScreenshotAttempt();
                return false;
              }
            }, { capture: true, passive: false });

            // Mouse event blocking (unchanged)
            const mouseEvents = ['mousedown', 'mouseup', 'click', 'contextmenu', 'dblclick', 'mouseenter', 'mouseleave'];
            
            mouseEvents.forEach(eventType => {
              document.addEventListener(eventType, (e) => {
                if (e.target === documentContainer) return true;
                
                if (e.target.closest('.document-container') && !e.target.closest('.custom-alert') && !e.target.closest('.dialog-box')) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                  showDialogBox();
                  return false;
                }
              }, { capture: true, passive: false });
            });

            // Allow scrolling in document container
            documentContainer.addEventListener('scroll', (e) => {
              return true;
            }, { passive: true });

            // Modify wheel event to allow scrolling
            document.addEventListener('wheel', (e) => {
              if (e.target.closest('.document-container')) {
                e.stopPropagation();
                return;
              } else {
                e.preventDefault();
                e.stopPropagation();
              }
            }, { passive: false });

            // Drag and drop blocking
            const dragEvents = ['dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop'];
            
            dragEvents.forEach(evt => {
              document.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                showDialogBox();
                return false;
              }, { capture: true, passive: false });
            });

            // Clipboard and selection blocking
            const clipboardEvents = ['copy', 'cut', 'paste', 'selectstart', 'select', 'selectionchange'];
            
            clipboardEvents.forEach(evt => {
              document.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                showDialogBox();
                return false;
              }, { capture: true, passive: false });
            });

            // High-frequency selection clearing
            const clearSelection = () => {
              try {
                if (window.getSelection) {
                  const selection = window.getSelection();
                  if (selection.toString().length > 0) {
                    selection.removeAllRanges();
                    if (!dialogShown) showDialogBox();
                  }
                }
                if (document.selection && document.selection.clear) {
                  document.selection.clear();
                }
              } catch (e) {}
            };
            
            setInterval(clearSelection, 16);
            
            const frameCheck = () => {
              clearSelection();
              requestAnimationFrame(frameCheck);
            };
            requestAnimationFrame(frameCheck);

            // Focus/blur handling with screenshot attempt detection
            window.addEventListener('blur', () => {
              document.body.style.filter = 'blur(12px)';
              
              // Check if blur might be due to screenshot tool
              setTimeout(() => {
                if (!document.hasFocus()) {
                  handleScreenshotAttempt();
                  
                  // Close window after multiple attempts
                  if (screenshotAttempts >= 3) {
                    closeWindow();
                  }
                }
              }, 1000);
            }, { capture: true });

            window.addEventListener('focus', () => {
              document.body.style.filter = 'none';
            }, { capture: true });

            // Fullscreen change detection
            document.addEventListener('fullscreenchange', () => {
              if (!document.fullscreenElement) {
                showDialogBox();
                setTimeout(() => window.close(), 1000);
              }
            });

            // Override selection methods
            Object.defineProperty(document, 'onselectstart', {
              value: () => {
                showDialogBox();
                return false;
              },
              writable: false,
              configurable: false
            });

            // Additional system shortcut blocking
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Meta' || e.metaKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showDialogBox();
                return false;
              }
              
              if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                e.stopImmediatePropagation();
                showDialogBox();
                return false;
              }
            }, true);

            // Visibility change detection (another screenshot detection method)
            document.addEventListener('visibilitychange', () => {
              if (document.hidden) {
                // Document became hidden, might indicate screenshot tool
                setTimeout(() => {
                  if (document.hidden) {
                    handleScreenshotAttempt();
                  }
                }, 500);
              }
            });
          </script>
        </body>
        </html>
      `;

      try {
        newWindow.document.write(secureHTML);
        newWindow.document.close();
      } catch (error) {
        console.error('Error creating preview:', error);
        alert('Error creating document preview');
      }
    } else {
      alert('Unable to open preview window. Please disable popup blockers.');
    }
  } else {
    alert('Document preview not available');
  }
};

  const simulateUploadProgress = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const handleFormSubmit = async () => {
  if (!formData.name || !formData.author || !formData.date || !formData.description || !formData.file) {
    Swal.fire('Error', 'Please fill all fields and select a file', 'error');
    return;
  }

  simulateUploadProgress();

  const isPDF = formData.file.type === 'application/pdf';
  const isImage = formData.file.type.startsWith('image/');
  const isLarge = formData.file.size > 10 * 1024 * 1024;

  let uploadFile = formData.file;

  // Compress if needed
  if (isLarge && !isImage) {
    try {
      if (isPDF) {
        uploadFile = await compressPDF(formData.file);
      } else {
        uploadFile = await compressGenericFile(formData.file);
      }
    } catch (err) {
      console.error('Compression failed:', err);
      Swal.fire('Warning', 'File compression failed. Uploading original file.', 'warning');
    }
  }

  // ✅ VALIDATION BEFORE LOADING FILE INTO MEMORY
  const MAX_DOCS = 10;
  const MAX_FILE_SIZE_MB = 5;

  const stored = JSON.parse(localStorage.getItem('documents')) || [];

  if (uploadFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    Swal.fire('File too large', `Max allowed size is ${MAX_FILE_SIZE_MB} MB`, 'error');
    return;
  }

  if (stored.length >= MAX_DOCS) {
    Swal.fire('Storage full', `You can only save ${MAX_DOCS} documents. Please delete some.`, 'warning');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const newDocument = {
      id: Date.now() + Math.random(),
      name: formData.name,
      author: formData.author,
      date: formData.date,
      description: formData.description,
      category: selectedCategory.key,
      fileDataUrl: e.target.result,
      fileName: uploadFile.name,
      fileSize: uploadFile.size,
      fileType: uploadFile.type,
      uploadDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedDocs = [...stored, newDocument];
      localStorage.setItem("documents", JSON.stringify(updatedDocs));

      console.log('New document added:', newDocument);

      setTimeout(() => {
        setShowAddForm(false);
        setUploadProgress(0);
        Swal.fire('Success!', 'Document uploaded successfully!', 'success').then(() => {
          previewDocument(newDocument);
          showDocuments(selectedCategory.key, selectedCategory.title);
        });
      }, 1000);
    } catch (error) {
      console.error("Error saving document:", error);
      Swal.fire('Error', 'Failed to save document', 'error');
      setIsUploading(false);
    }
  };

  reader.readAsDataURL(uploadFile);
};


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showDescription = (doc) => {
    Swal.fire('Description', doc.description || 'No description available.', 'info');
  };

  






  const shareDocument = (doc) => {
    if (!doc.fileDataUrl) {
      Swal.fire('Error', 'No file data available to share', 'error');
      return;
    }

    const base64ToBlob = (base64, mime = 'application/pdf') => {
      const byteChars = atob(base64.split(',')[1]);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mime });
    };

    const blob = base64ToBlob(doc.fileDataUrl, doc.fileType);
    const fileURL = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = fileURL;
    link.download = doc.fileName || `${doc.name}.pdf`;
    link.click();

    Swal.fire({
      title: "Document Downloaded",
      icon: "success",
      html: `
        <p>The document <b>${doc.name}</b> has been downloaded to your device.</p>
        <p>You can now share it via email or messaging apps.</p>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "📧 Email",
      denyButtonText: "💬 WhatsApp",
      cancelButtonText: "Close"
    }).then((result) => {
      if (result.isConfirmed) {
        const subject = encodeURIComponent(`Shared Document: ${doc.name}`);
        const body = encodeURIComponent(`Hi,\n\nPlease find the attached document: ${doc.name}.\n\nDescription: ${doc.description}\n\nBest regards!`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      } else if (result.isDenied) {
        const text = encodeURIComponent(`📄 *${doc.name}*\n\n${doc.description}\n\nDocument downloaded and ready to share!`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
      }
    });
  };


  const editDocument = (doc) => {
    Swal.fire({
      title: 'Edit Document',
      html: `
        <div style="text-align: left; padding: 20px; backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); border-radius: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.2);">
          <div style="margin-bottom: 15px;">
            <label><b>Document Name:</b></label>
            <input type="text" id="edit-name" value="${doc.name}" style="width: 100%; padding: 10px; border-radius: 8px; border: none; background: rgba(255,255,255,0.2); color: #000;">
          </div>
          <div style="margin-bottom: 15px;">
            <label><b>Category:</b></label>
            <select id="edit-category" style="width: 100%; padding: 10px; border-radius: 8px; border: none; background: rgba(255,255,255,0.2); color: #000;">
              ${categories.map(cat => `
                <option value="${cat.key}" ${doc.category === cat.key ? 'selected' : ''}>${cat.title}</option>`).join("")}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label><b>Author:</b></label>
            <input type="text" id="edit-author" value="${doc.author || ''}" style="width: 100%; padding: 10px; border-radius: 8px; border: none; background: rgba(255,255,255,0.2); color: #000;">
          </div>
          <div style="margin-bottom: 15px;">
            <label><b>Date:</b></label>
            <input type="date" id="edit-date" value="${doc.date || ''}" style="width: 100%; padding: 10px; border-radius: 8px; border: none; background: rgba(255,255,255,0.2); color: #000;">
          </div>
          <div style="margin-bottom: 15px;">
            <label><b>Description:</b></label>
            <textarea id="edit-description" rows="4" style="width: 100%; padding: 10px; border-radius: 8px; border: none; background: rgba(255,255,255,0.2); color: #000;">${doc.description || ''}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      width: '650px',
      preConfirm: () => {
        const name = document.getElementById('edit-name').value.trim();
        const category = document.getElementById('edit-category').value;
        const author = document.getElementById('edit-author').value.trim();
        const date = document.getElementById('edit-date').value;
        const description = document.getElementById('edit-description').value.trim();

        if (!name || !author || !date || !description) {
          return Swal.showValidationMessage('Please fill all fields');
        }

        return { name, category, author, date, description };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { name, category, author, date, description } = result.value;
        const updatedDoc = { ...doc, name, category, author, date, description };

        const docs = JSON.parse(localStorage.getItem("documents")) || [];
        const updatedDocs = docs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
        localStorage.setItem("documents", JSON.stringify(updatedDocs));

        Swal.fire('Success', 'Document updated successfully!', 'success');
        loadDocuments();
        showDocuments(selectedCategory.key, selectedCategory.title);
      }
    });
  };

  const deleteDocument = (docId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the document permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      confirmButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {
        try {
          const updatedDocs = allDocuments.filter(doc => doc.id !== docId);
          saveDocuments(updatedDocs);
          setSelectedDocs(prev => prev.filter(doc => doc.id !== docId));
          
          Swal.fire('Deleted!', 'Document has been deleted.', 'success');
        } catch (error) {
          console.error("Error deleting document:", error);
          Swal.fire('Error', 'Failed to delete document', 'error');
        }
      }
    });
  };

  const getDocumentCount = (categoryKey) => {
    return allDocuments.filter(doc => doc.category === categoryKey).length;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Layout>
      <div className="document-categories">
        <h1>Document Categories</h1>
        <p>Total Documents: {allDocuments.length}</p>

        <div className="categories-grid">
          {categories.map(cat => (
            <div
              key={cat.key}
              className="category-card"
              onClick={() => handleCategoryClick(cat.key, cat.title)}
            >
              <div className="category-header">
                <div className="category-icon" style={{ background: cat.bg }}>
                  <i className={`fas ${cat.icon}`}></i>
                </div>
                <h2 className="category-title">{cat.title}</h2>
                <span className="document-count">{getDocumentCount(cat.key)} documents</span>
              </div>
            </div>
          ))}
        </div>

        {/* Options Dialog */}
        {showOptionsDialog && (
          <div className="modal-overlay">
            <div className="options-dialog">
              <div className="dialog-header">
                <h2>{selectedCategory?.title}</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowOptionsDialog(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="dialog-content">
                <div className="option-card" onClick={handleAddDocument}>
                  <div className="option-icon add-icon">
                    <i className="fas fa-plus"></i>
                  </div>
                  <h3>Add New Document</h3>
                  <p>Upload a new document to this category</p>
                </div>
                <div className="option-card" onClick={handleViewDocuments}>
                  <div className="option-icon view-icon">
                    <i className="fas fa-folder-open"></i>
                  </div>
                  <h3>View Documents</h3>
                  <p>See all uploaded documents in this category ({getDocumentCount(selectedCategory?.key || '')} documents)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Document Form */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="add-form-dialog">
              <div className="form-header">
                <h2>Add New Document to {selectedCategory?.title}</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="add-document-form">
                <div className="form-group">
                  <label htmlFor="doc-name">
                    <i className="fas fa-file-alt"></i>
                    Document Name
                  </label>
                  <input
                    type="text"
                    id="doc-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter document name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-author">
                    <i className="fas fa-user"></i>
                    Author
                  </label>
                  <input
                    type="text"
                    id="doc-author"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder="Enter author name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-date">
                    <i className="fas fa-calendar"></i>
                    Date
                  </label>
                  <input
                    type="date"
                    id="doc-date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-description">
                    <i className="fas fa-align-left"></i>
                    Description
                  </label>
                  <textarea
                    id="doc-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter document description"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group file-upload">
                  <label htmlFor="doc-file">
                    <i className="fas fa-upload"></i>
                    Upload File
                  </label>
                  <div className="file-input-wrapper">
                    <input
  type="file"
  accept=".pdf,.doc,.docx,.txt,.csv"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
    }
  }}
/>


                    <div className="file-input-display">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>
                        {formData.file ? formData.file.name : 'Choose file or drag & drop'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="button" className="submit-btn" onClick={handleFormSubmit}>
                    <i className="fas fa-save"></i>
                    Save Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document List Modal */}
        {selectedDocs.length > 0 && (
          <div className="document-modal">
            <h2>{modalTitle} Documents ({selectedDocs.length})</h2>
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedDocs.map(doc => (
                  <tr key={doc.id}>
                    <td>{doc.name}</td>
                    <td>{doc.author}</td>
                    <td>{new Date(doc.date).toLocaleDateString()}</td>
                    <td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => previewDocument(doc)} title="Preview">
                        <i className="fas fa-eye" />
                      </button>
                      <button onClick={() => editDocument(doc)} title="Edit">
                        <i className="fas fa-edit" />
                      </button>
                      <button onClick={() => shareDocument(doc)} title="Share">
                        <i className="fas fa-share" />
                      </button>
                      <button onClick={() => deleteDocument(doc.id)} title="Delete">
                        <i className="fas fa-trash" />
                      </button>
                      <button onClick={() => showDescription(doc)} title="Info">
                        <i className="fas fa-circle-info" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setSelectedDocs([])} className="close-modal-btn">Close</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DocumentCategories;