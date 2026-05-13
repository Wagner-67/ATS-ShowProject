import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Application.css";

function Application({ onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    salutation: "",
    firstname: "",
    lastname: "",
    email: "",
    phoneNumber: "",
    street: "",
    houseNumber: "",
    city: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    files.forEach(file => {
      formDataToSend.append('documents[]', file);
    });

    const accessToken = localStorage.getItem('token');
    
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    try {
      const response = await fetch(`/api/application/${id}`, {
        method: 'POST',
        headers: headers,
        body: formDataToSend,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            navigate('/');
          }
        }, 2000);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
    const droppedFiles = [...e.dataTransfer.files];
    const validFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    if (validFiles.length !== droppedFiles.length) {
      setError('Only PDF files are allowed');
    }
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = [...e.target.files];
    const validFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    if (validFiles.length !== selectedFiles.length) {
      setError('Only PDF files are allowed');
    }
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (success) {
    return (
      <div className="ap-container">
        <nav className="ap-nav">
          <button onClick={onBack} className="ap-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <span className="ap-logo">ATS</span>
          <div className="ap-nav-spacer"></div>
        </nav>
        <main className="ap-main">
          <div className="ap-success-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2>Application sent successfully!</h2>
            <p>We will contact you.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ap-container">
      <nav className="ap-nav">
        <button onClick={onBack} className="ap-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <span className="ap-logo">ATS</span>
        <div className="ap-nav-spacer"></div>
      </nav>

      <main className="ap-main">
        <form className="ap-form" onSubmit={handleSubmit}>
          <h2 className="ap-form-title">Application Form</h2>

          {error && (
            <div className="ap-error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Personal Data */}
          <div className="ap-form-section">
            <h3 className="ap-section-title">Personal Data</h3>
            
            <div className="ap-form-group">
              <label className="ap-label">Salutation</label>
              <select 
                name="salutation" 
                className="ap-input"
                value={formData.salutation}
                onChange={handleInputChange}
                required
              >
                <option value="">Please select</option>
                <option value="Herr">Mr.</option>
                <option value="Frau">Mrs.</option>
                <option value="Divers">Other</option>
              </select>
            </div>

            <div className="ap-form-row">
              <div className="ap-form-group">
                <label className="ap-label">First Name *</label>
                <input
                  type="text"
                  name="firstname"
                  className="ap-input"
                  placeholder="Max"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Last Name *</label>
                <input
                  type="text"
                  name="lastname"
                  className="ap-input"
                  placeholder="Mustermann"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Data */}
          <div className="ap-form-section">
            <h3 className="ap-section-title">Contact Data</h3>
            
            <div className="ap-form-row">
              <div className="ap-form-group">
                <label className="ap-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className="ap-input"
                  placeholder="max@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Phone *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className="ap-input"
                  placeholder="+49 123 456789"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="ap-form-section">
            <h3 className="ap-section-title">Address</h3>
            
            <div className="ap-form-group">
              <label className="ap-label">Street *</label>
              <input
                type="text"
                name="street"
                className="ap-input"
                placeholder="Main Street"
                value={formData.street}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="ap-form-row">
              <div className="ap-form-group">
                <label className="ap-label">House Number *</label>
                <input
                  type="text"
                  name="houseNumber"
                  className="ap-input"
                  placeholder="42"
                  value={formData.houseNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">City *</label>
                <input
                  type="text"
                  name="city"
                  className="ap-input"
                  placeholder="Berlin"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="ap-form-section">
            <h3 className="ap-section-title">Documents *</h3>
            
            <div 
              className={`ap-upload-zone ${dragActive ? 'drag-active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="ap-file-input"
                accept=".pdf"
              />
              
              <div className="ap-upload-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17,8 12,3 7,8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="ap-upload-text">
                  <strong>Drop PDF files here</strong> or click to select
                </p>
                <p className="ap-upload-hint">Only PDF files (max. 20MB per file)</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="ap-file-list">
                {files.map((file, index) => (
                  <div key={index} className="ap-file-item">
                    <div className="ap-file-info">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      <span className="ap-file-name">{file.name}</span>
                      <span className="ap-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button 
                      type="button" 
                      className="ap-file-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="ap-form-submit">
            <button 
              type="submit" 
              className="ap-submit-btn"
              disabled={loading || files.length === 0}
            >
              {loading ? (
                <>
                  <svg className="ap-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8"/>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Submit Application
                </>
              )}
            </button>
            {files.length === 0 && (
              <p className="ap-hint-text">Please upload at least one PDF file</p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

export default Application;