import { useState, useEffect, useRef } from "react";
import "./Landingpage.css";

function Landingpage({ isLoggedIn, onGetStarted, onLogout, onNavigate }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
              title="Account"
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
                    <button className="lp-dd-item" onClick={() => { onNavigate?.("profile"); setDropdownOpen(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                      Profil anzeigen
                    </button>
                    <button className="lp-dd-item danger" onClick={() => { onLogout?.(); setDropdownOpen(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button className="lp-dd-item" onClick={() => { onNavigate?.("login"); setDropdownOpen(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Login
                    </button>
                    <button className="lp-dd-item" onClick={() => { onNavigate?.("register"); setDropdownOpen(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/>
                        <line x1="22" y1="11" x2="16" y2="11"/>
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
        <h1>Welcome to the ATS 🔥</h1>
        <button className="lp-cta" onClick={onGetStarted}>Jetzt starten</button>
      </div>
    </div>
  );
}

export default Landingpage;