import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { login, register } from "./auth";
import "./AuthPage.css";

function AuthPage({ onLogin, initialTab = "login", onBack }) {
  const [isRegister, setIsRegister] = useState(initialTab === "register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileType, setType] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsRegister(initialTab === "register");
  }, [initialTab]);

  const handleLogin = async () => {
    const success = await login(username, password);
    if (success) {
      onLogin();
    } else {
      setError("Login fehlgeschlagen.");
    }
  };

  const handleRegister = async () => {
    if (!profileType) {
      setError("Bitte wähle eine Profilart.");
      return;
    }
    const success = await register(username, password, confirmPassword, profileType);
    if (success) {
      onLogin();
    } else {
      setError("Registrierung fehlgeschlagen.");
    }
  };

  if (isRegister) {
    return (
      <>
        <Helmet>
          <title>Registrierung - ATS</title>
          <meta name="description" content="Erstelle ein neues Benutzerkonto bei ATS. Registriere dich als Bewerber oder Unternehmen und finde passende Stellen oder Talente." />
        </Helmet>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <span className="auth-logo">ATS</span>
              <h2>Konto erstellen</h2>
              <p>Registriere dich um loszulegen</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-fields">
              <div className="auth-field">
                <label>Email</label>
                <input placeholder="deine@email.de" onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="auth-field">
                <label>Passwort</label>
                <input type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="auth-field">
                <label>Passwort bestätigen</label>
                <input type="password" placeholder="••••••••" onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="auth-field">
                <label>Ich bin...</label>
                <div className="auth-profile-select">
                  <button
                    className={`auth-profile-btn${profileType === "applicant" ? " selected" : ""}`}
                    onClick={() => setType("applicant")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    Bewerber
                  </button>
                  <button
                    className={`auth-profile-btn${profileType === "company" ? " selected" : ""}`}
                    onClick={() => setType("company")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/>
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      <line x1="12" y1="12" x2="12" y2="16"/>
                      <line x1="10" y1="14" x2="14" y2="14"/>
                    </svg>
                    Unternehmen
                  </button>
                </div>
              </div>
            </div>

            <button className="auth-submit" onClick={handleRegister}>Registrieren</button>

            <div className="auth-footer">
              <span>Bereits ein Konto?</span>
              <button className="auth-link" onClick={() => { setIsRegister(false); setError(""); }}>Einloggen</button>
            </div>
            <button className="auth-back" onClick={onBack}>← Zurück</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Anmelden - ATS</title>
        <meta name="description" content="Melde dich bei deinem ATS-Konto an. Verwalte deine Bewerbungen, Stellenangebote und finde die nächste Karrierechance." />
      </Helmet>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">ATS</span>
            <h2>Willkommen zurück</h2>
            <p>Melde dich an um fortzufahren</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-fields">
            <div className="auth-field">
              <label>Email</label>
              <input placeholder="deine@email.de" onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="auth-field">
              <label>Passwort</label>
              <input type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button className="auth-submit" onClick={handleLogin}>Einloggen</button>

          <div className="auth-footer">
            <span>Noch kein Konto?</span>
            <button className="auth-link" onClick={() => { setIsRegister(true); setError(""); }}>Registrieren</button>
          </div>
          <button className="auth-back" onClick={onBack}>← Zurück</button>
        </div>
      </div>
    </>
  );
}

export default AuthPage;