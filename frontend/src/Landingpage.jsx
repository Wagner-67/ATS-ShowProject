import { useState, useEffect, useRef } from "react";
import "./Landingpage.css";

function Landingpage({ isLoggedIn, onGetStarted, onLogout, onNavigate }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Such-Filter States
  const [searchType, setSearchType] = useState("");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [whatSearch, setWhatSearch] = useState("");
  const [whereSearch, setWhereSearch] = useState("");

  // Copy-State für Application IDs
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const dropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const modalRef = useRef(null);

  const searchTypes = [
    { value: "", label: "Alle" },
    { value: "ausbildung", label: "Ausbildung/Duales Studium" },
    { value: "arbeit", label: "Arbeit" },
    { value: "praktikum", label: "Praktikum" }
  ];

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setTypeDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Schließe Modal mit Escape-Taste
  useEffect(() => {
    function handleEscKey(e) {
      if (e.key === 'Escape' && selectedApplication) {
        closeModal();
      }
    }

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [selectedApplication]);

  // Initial Load - nur beim ersten Rendern
  useEffect(() => {
    loadInitialApplications();
  }, []);

  const loadInitialApplications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/search?page=1&limit=10', {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApplications(data.data || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again later.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const searchData = {};
      
      if (searchType) searchData.applicationType = searchType;
      if (whatSearch) searchData.search = whatSearch;
      if (whereSearch) searchData.companyLocation = whereSearch;
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(searchData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApplications(data.data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Suche fehlgeschlagen. Bitte versuche es später erneut.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTypeLabel = () => {
    const type = searchTypes.find(t => t.value === searchType);
    return type ? type.label : "Alle";
  };

  // Copy Application ID to Clipboard mit Fallback
  const copyToClipboard = async (text, id) => {
    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Modal Funktionen
  const openModal = (application) => {
    setSelectedApplication(application);
    setIsFavorited(false);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedApplication(null);
    document.body.style.overflow = '';
  };

  // Markdown zu HTML konvertieren
  const renderMarkdown = (markdown) => {
    if (!markdown) return '<p>Keine Beschreibung vorhanden</p>';
    
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    html = '<p>' + html + '</p>';
    return html;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="lp-container">
      <nav className="lp-nav">
        <span className="lp-logo">ATS</span>

        <div className="lp-nav-right">
          <button className="lp-icon-btn" title="Saved">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          <div className="lp-user-wrap" ref={dropdownRef}>
            <button
              className={`lp-icon-btn lp-user-btn${dropdownOpen ? " open" : ""}`}
              onClick={() => setDropdownOpen(v => !v)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </button>

            {dropdownOpen && (
              <div className="lp-dropdown">
                {isLoggedIn ? (
                  <>
                    <button
                      className="lp-dd-item"
                      onClick={() => {
                        onNavigate?.("profile");
                        setDropdownOpen(false);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Profil anzeigen
                    </button>

                    <button
                      className="lp-dd-item danger"
                      onClick={() => {
                        onLogout?.();
                        setDropdownOpen(false);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16,17 21,12 16,7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="lp-dd-item"
                      onClick={() => {
                        onNavigate?.("login");
                        setDropdownOpen(false);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10,17 15,12 10,7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Login
                    </button>

                    <button
                      className="lp-dd-item"
                      onClick={() => {
                        onNavigate?.("register");
                        setDropdownOpen(false);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                      Registrieren
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="lp-main">
        <div className="lp-hero">
          <h1>Finde deine nächste Chance</h1>
          <p className="lp-hero-subtitle">Durchsuche tausende Bewerbungen und finde den perfekten Match</p>
        </div>

        {/* Search Bar - Suche nur bei Submit */}
        <form className="lp-search-bar" onSubmit={handleSearch}>
          <div className="lp-search-row">
            <div className="lp-search-field lp-search-what">
              <label className="lp-search-label">Was suchen Sie?</label>
              <div className="lp-search-inputs">
                <div className="lp-type-select" ref={typeDropdownRef}>
                  <button
                    type="button"
                    className={`lp-type-btn ${typeDropdownOpen ? 'open' : ''}`}
                    onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  >
                    <span>{getSelectedTypeLabel()}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  
                  {typeDropdownOpen && (
                    <div className="lp-type-dropdown">
                      {searchTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          className={`lp-type-option ${searchType === type.value ? 'active' : ''}`}
                          onClick={() => {
                            setSearchType(type.value);
                            setTypeDropdownOpen(false);
                          }}
                        >
                          {type.label}
                          {searchType === type.value && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <input
                  type="text"
                  className="lp-what-input"
                  placeholder="z.B. Beruf, Stichwort, Application ID"
                  value={whatSearch}
                  onChange={(e) => setWhatSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="lp-search-field lp-search-where">
              <label className="lp-search-label">Wo suchen Sie?</label>
              <input
                type="text"
                className="lp-where-input"
                placeholder="z.B. Ort, PLZ, Bundesland, Land"
                value={whereSearch}
                onChange={(e) => setWhereSearch(e.target.value)}
              />
            </div>

            <button type="submit" className="lp-search-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Stellen finden
            </button>
          </div>
        </form>

        {/* Applications Section */}
        <div className="lp-applications-section">
          <div className="lp-section-header">
            <h2 className="lp-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              {hasSearched ? 'Suchergebnisse' : 'Aktuelle Bewerbungen'}
            </h2>
            {hasSearched && (
              <span className="lp-results-count">
                {applications.length} Ergebnisse gefunden
              </span>
            )}
          </div>

          {loading && (
            <div className="lp-loading">
              <div className="lp-loader"></div>
              <p>Suche läuft...</p>
            </div>
          )}

          {error && (
            <div className="lp-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="lp-applications">
              {applications.length > 0 ? (
                applications.map(app => (
                  <div 
                    key={app.id} 
                    className="lp-card"
                    onClick={() => openModal(app)}
                  >
                    <h3 className="lp-card-title">
                      {app.jobName || 'Keine Position'}
                    </h3>
                    
                    <p className="lp-card-company">
                      {app.companyName || 'Unbekanntes Unternehmen'}
                    </p>
                    
                    <div className="lp-card-info-row">
                      <span className="lp-card-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {app.companyLocation || 'Standort unbekannt'}
                      </span>
                      
                      <span className="lp-card-type">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                        {app.companySector || 'Vollzeit'}
                      </span>
                      
                      <button
                        className={`lp-card-id-btn ${copiedId === app.id ? 'copied' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(app.applicationId, app.id);
                        }}
                        title="Klicken zum Kopieren"
                      >
                        {copiedId === app.id ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span>Kopiert!</span>
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            <span>{app.applicationId?.substring(0, 8) || 'N/A'}</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="lp-card-date-wrapper">
                      <span className="lp-card-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {app.createdAt ? formatRelativeDate(app.createdAt) : 'Kein Datum'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="lp-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  <p>Keine Bewerbungen gefunden</p>
                  <p className="lp-empty-hint">Versuche andere Suchkriterien</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal - unverändert */}
      {selectedApplication && (
        <div className="lp-modal-backdrop" onClick={closeModal}>
          <div 
            className="lp-modal" 
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="lp-modal-close" onClick={closeModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div className="lp-modal-header">
              <h2 className="lp-modal-title">
                {selectedApplication.jobName || 'Keine Position'}
              </h2>
              <p className="lp-modal-company">
                {selectedApplication.companyName || 'Unbekanntes Unternehmen'}
              </p>
            </div>

            <div className="lp-modal-info-grid">
              <div className="lp-modal-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div>
                  <span className="lp-modal-info-label">Standort</span>
                  <span className="lp-modal-info-value">
                    {selectedApplication.companyLocation || 'Standort unbekannt'}
                  </span>
                </div>
              </div>

              <div className="lp-modal-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <div>
                  <span className="lp-modal-info-label">Art der Anstellung</span>
                  <span className="lp-modal-info-value">
                    {selectedApplication.companySector || 'Vollzeit'}
                  </span>
                </div>
              </div>

              <div className="lp-modal-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <div>
                  <span className="lp-modal-info-label">Application ID</span>
                  <span className="lp-modal-info-value lp-modal-id">
                    {selectedApplication.applicationId || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="lp-modal-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div>
                  <span className="lp-modal-info-label">Erstellt am</span>
                  <span className="lp-modal-info-value">
                    {selectedApplication.createdAt 
                      ? formatDate(selectedApplication.createdAt) 
                      : 'Kein Datum'}
                  </span>
                </div>
              </div>
            </div>

            <div className="lp-modal-actions">
              <button 
                className={`lp-modal-action-btn lp-fav-btn ${isFavorited ? 'active' : ''}`}
                onClick={() => setIsFavorited(!isFavorited)}
              >
                <svg viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {isFavorited ? 'Gemerkt' : 'Merken'}
              </button>

              <button className="lp-modal-action-btn lp-apply-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="18" y1="8" x2="23" y2="13"/>
                  <line x1="23" y1="8" x2="18" y2="13"/>
                </svg>
                Jetzt bewerben
              </button>
            </div>

            <div className="lp-modal-markdown-section">
              <h3 className="lp-modal-markdown-title">Beschreibung</h3>
              <div 
                className="lp-modal-markdown-content"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(selectedApplication.description || '') 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landingpage;