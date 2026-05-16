import { useState, useEffect, useCallback } from "react";
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ProfilePage.css";
import CreateJobModal from "./components/job/CreateJobModal";

function ProfilePage({ onBack }) {
  const [userType, setUserType] = useState(null);
  const [view, setView] = useState("applications");
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companyApplications, setCompanyApplications] = useState([]);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch user data');
        const data = await res.json();
        setUserType(data.type);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.message);
      }
    }

    fetchMe();
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/company", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (res.status === 404) {
        setJobs([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompanyApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/company/application", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (res.status === 404) {
        setCompanyApplications([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setCompanyApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch company applications:", err);
      setError(err.message);
      setCompanyApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/applications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (res.status === 404) {
        setApplications([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError(err.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApplication = useCallback(async (applicationId) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/application/${applicationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setSelectedApplication(data);
    } catch (err) {
      console.error('Failed to fetch application:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userType) return;
    
    if (userType === "applicant" && view === "applications") {
      fetchApplications();
    } else if (userType === "company" && view === "bewerbungen") {
      fetchJobs();
    } else if (userType === "company" && view === "bewerber") {
      fetchCompanyApplications();
    }
  }, [userType, view, fetchApplications, fetchJobs, fetchCompanyApplications]);

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Möchtest du diese Bewerbung wirklich löschen?')) return;
    
    try {
      const res = await fetch(`/api/application/${applicationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete application');
      }

      setSelectedApplication(null);
      fetchApplications();
    } catch (err) {
      console.error('Error deleting application:', err);
      setError(err.message);
    }
  };

  const handleCreateOrUpdateJob = async (data, id) => {
    try {
      const url = id ? `/api/company/${id}` : "/api/company";
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save job');
      }

      setOpen(false);
      setEditJob(null);
      fetchJobs();
    } catch (err) {
      console.error('Error saving job:', err);
      setError(err.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const res = await fetch(`/api/company/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete job');
      }

      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err.message);
    }
  };

  const handleEditClick = (job) => {
    setEditJob(job);
    setSelectedJob(null);
    setOpen(true);
  };

  const handleCloseApplicationModal = () => {
    setSelectedApplication(null);
  };

  const handleOpenPDF = async (documentId) => {
    try {
      const res = await fetch(`/api/document/${documentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error("Fehler beim Laden der Datei");
      }

      const blob = await res.blob();
      const fileURL = window.URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    } catch (err) {
      console.error(err);
      alert("Datei konnte nicht geöffnet werden");
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const res = await fetch(`/api/company/status/${applicationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      fetchCompanyApplications();

      if (selectedApplication) {
        setSelectedApplication(null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    }
  };

  const renderCompanyContent = () => {
    if (loading) {
      return <div className="pp-content-box"><p>Loading...</p></div>;
    }

    if (error) {
      return <div className="pp-content-box"><p className="error-message">Error: {error}</p></div>;
    }

    if (view === "bewerbungen") {
      return (
        <>
          <Helmet>
            <title>Meine Stellenangebote - ATS</title>
            <meta name="description" content="Verwalte deine Stellenangebote: Erstelle, bearbeite oder lösche Positionen und finde die passenden Kandidaten." />
          </Helmet>
          <div className="pp-content-box">
            <h2>Stellenangebote</h2>
            {jobs.length === 0 ? (
              <p>Keine Stellen vorhanden</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="job-card" onClick={() => setSelectedJob(job)}>
                  <h3>{job.title || job.jobName}</h3>
                  <p><strong>Unternehmen:</strong> {job.companyName}</p>
                  <p><strong>Position:</strong> {job.jobName}</p>
                  <p><strong>Branche:</strong> {job.companySector}</p>
                  <p><strong>Adresse:</strong> {job.street} {job.houseNumber}</p>
                  <p><strong>PLZ / Ort:</strong> {job.postalCode} {job.city}</p>
                  <small>Application ID: {job.applicationId}</small>
                  <small>Erstellt am: {new Date(job.createdAt).toLocaleDateString('de-DE')}</small>
                </div>
              ))
            )}
          </div>
        </>
      );
    }

    if (view === "bewerber") {
      return (
        <>
          <Helmet>
            <title>Bewerber verwalten - ATS</title>
            <meta name="description" content="Übersicht aller Bewerber auf deine Stellenangebote. Bewerte Profile, verwalte Dokumente und ändere den Bewerbungsstatus." />
          </Helmet>
          <div className="pp-content-box">
            <h2>Bewerber</h2>

            {companyApplications.length === 0 ? (
              <p>Keine Bewerbungen vorhanden</p>
            ) : (
              companyApplications.map((application) => (
                <div
                  key={application.id}
                  className="job-card"
                  onClick={() => setSelectedApplication(application)}
                >
                  <h3>
                    {application.firstname} {application.lastname}
                  </h3>

                  <p>
                    <strong>Job:</strong> {application.jobName}
                  </p>

                  <p>
                    <strong>E-Mail:</strong> {application.email}
                  </p>

                  <p>
                    <strong>Telefon:</strong> {application.phoneNumber}
                  </p>

                  <p>
                    <strong>Adresse:</strong>{" "}
                    {application.street} {application.houseNumber}
                  </p>

                  <p>
                    <strong>Ort:</strong> {application.city}
                  </p>

                  {application.documents && application.documents.length > 0 && (
                    <div className="document-preview">
                      <strong>Dokumente:</strong>
                      <div className="document-list">
                        {application.documents.map((doc, index) => (
                          <div 
                            key={index} 
                            className="document-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPDF(doc.id);
                            }}
                          >
                            <span className="document-icon">📄</span>
                            <span className="document-name">{doc.fileName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div 
                    className="status-section"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="current-status">
                      <span className="status-label">Status:</span>
                      <span className={`status-badge status-${application.status || 'pending'}`}>
                        {application.status === 'pending' && '⏳ Ausstehend'}
                        {application.status === 'review' && '👁️ In Prüfung'}
                        {application.status === 'approved' && '✅ Angenommen'}
                        {application.status === 'rejected' && '❌ Abgelehnt'}
                        {!application.status && '⏳ Ausstehend'}
                      </span>
                    </div>

                    <div className="status-actions">
                      <button 
                        className={`status-action-btn status-pending ${application.status === 'pending' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(application.id, 'pending')}
                      >
                        <span className="status-icon">⏳</span>
                        Ausstehend
                      </button>

                      <button 
                        className={`status-action-btn status-review ${application.status === 'review' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(application.id, 'review')}
                      >
                        <span className="status-icon">👁️</span>
                        In Prüfung
                      </button>

                      <button 
                        className={`status-action-btn status-approved ${application.status === 'approved' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(application.id, 'approved')}
                      >
                        <span className="status-icon">✅</span>
                        Annehmen
                      </button>

                      <button 
                        className={`status-action-btn status-rejected ${application.status === 'rejected' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(application.id, 'rejected')}
                      >
                        <span className="status-icon">❌</span>
                        Ablehnen
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      );
    }

    return null;
  };
  
  const renderApplicantContent = () => {
    if (loading) {
      return <div className="pp-content-box"><p>Loading...</p></div>;
    }

    if (error) {
      return <div className="pp-content-box"><p className="error-message">Error: {error}</p></div>;
    }

    if (view === "applications") {
      return (
        <>
          <Helmet>
            <title>Meine Bewerbungen - ATS</title>
            <meta name="description" content="Verfolge den Status deiner Bewerbungen, rufe Dokumente auf und verwalte deine Bewerbungsunterlagen." />
          </Helmet>
          <div className="pp-content-box">
            <h2>Meine Bewerbungen</h2>
            {applications.length === 0 ? (
              <p>Keine Bewerbungen vorhanden</p>
            ) : (
              applications.map((app) => (
                <div 
                  key={app.id} 
                  className="job-card" 
                  onClick={() => fetchApplication(app.id)}
                >
                  <h3>{app.jobName || `Bewerbung #${app.id}`}</h3>
                  <p><strong>Unternehmen:</strong> {app.companyName || 'Unbekannt'}</p>
                  <p><strong>Beworben am:</strong> {new Date(app.createdAt).toLocaleDateString('de-DE')}</p>
                  
                  <div className="current-status" style={{ marginTop: '12px', marginBottom: '0' }}>
                    <span className="status-label">Status:</span>
                    <span className={`status-badge status-${app.status || 'pending'}`}>
                      {app.status === 'pending' && '⏳ Ausstehend'}
                      {app.status === 'review' && '👁️ In Prüfung'}
                      {app.status === 'approved' && '✅ Angenommen'}
                      {app.status === 'rejected' && '❌ Abgelehnt'}
                      {!app.status && '⏳ Ausstehend'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      );
    }

    if (view === "profile") {
      return (
        <>
          <Helmet>
            <title>Mein Benutzerprofil - ATS</title>
            <meta name="description" content="Verwalte deine persönlichen Daten, Passwort und Einstellungen in deinem ATS-Benutzerkonto." />
          </Helmet>
          <div className="pp-content-box">
            <h2>Mein Profil</h2>
            <p>Profil-Einstellungen (coming soon)</p>
          </div>
        </>
      );
    }

    return null;
  };

  const isCompany = userType === "company";

  return (
    <>
      <Helmet>
        <title>Mein Profil - ATS</title>
        <meta name="description" content="Verwalte deine Bewerbungen, Stellenangebote und persönlichen Daten in deinem ATS-Profil." />
      </Helmet>

      <div className="pp-container">
        {userType && (
          <div className="pp-sidebar">
            {userType === "company" ? (
              <>
                <button
                  className={`pp-side-item ${view === "bewerbungen" ? "active" : ""}`}
                  onClick={() => {
                    setView("bewerbungen");
                    fetchJobs();
                  }}
                >
                  Stellenangebote
                </button>

                <button
                  className={`pp-side-item ${view === "bewerber" ? "active" : ""}`}
                  onClick={() => setView("bewerber")}
                >
                  Bewerber
                </button>
              </>
            ) : (
              <>
                <button
                  className={`pp-side-item ${view === "applications" ? "active" : ""}`}
                  onClick={() => {
                    setView("applications");
                    fetchApplications();
                  }}
                >
                  Meine Bewerbungen
                </button>

                <button
                  className={`pp-side-item ${view === "profile" ? "active" : ""}`}
                  onClick={() => setView("profile")}
                >
                  Mein Profil
                </button>
              </>
            )}

            <button className="pp-back" onClick={onBack}>
              ← Zurück
            </button>
          </div>
        )}

        <div className="pp-main">
          {userType === "applicant" ? (
            <>
              <h1>Willkommen zurück!</h1>
              <p>Verwalte deine Bewerbungen und Profil</p>
              {renderApplicantContent()}
            </>
          ) : userType === "company" ? (
            <>
              <h1>Willkommen, Unternehmen!</h1>
              <p>Verwalte Stellen und Bewerber</p>
              {renderCompanyContent()}
            </>
          ) : (
            <>
              <h1>Willkommen!</h1>
              <p>Lade Benutzerdaten...</p>
            </>
          )}
        </div>

        {selectedJob && (
          <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
            <div className="job-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-left">
                  <span className="job-badge">Stellenanzeige</span>
                  <h2>{selectedJob.title || selectedJob.jobName}</h2>
                </div>
                <button className="modal-close" onClick={() => setSelectedJob(null)}>×</button>
              </div>

              <div className="modal-body">
                <div className="job-meta-grid">
                  <div className="job-meta-item">
                    <span className="meta-label">Unternehmen</span>
                    <span className="meta-value">{selectedJob.companyName}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Position</span>
                    <span className="meta-value">{selectedJob.jobName}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Branche</span>
                    <span className="meta-value">{selectedJob.companySector}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Straße</span>
                    <span className="meta-value">{selectedJob.street} {selectedJob.houseNumber}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">PLZ</span>
                    <span className="meta-value">{selectedJob.postalCode}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Ort</span>
                    <span className="meta-value">{selectedJob.city}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Erstellt am</span>
                    <span className="meta-value">
                      {new Date(selectedJob.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="description-section">
                  <h3>Beschreibung</h3>
                  <div className="description-content">
                    {selectedJob.description ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedJob.description}
                      </ReactMarkdown>
                    ) : (
                      <p className="no-description">Keine Beschreibung vorhanden</p>
                    )}
                  </div>
                </div>

                {selectedJob.applicationId && (
                  <div className="job-footer-info">
                    <span className="job-id">Application-ID: {selectedJob.applicationId}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-delete" onClick={() => handleDeleteJob(selectedJob.id)}>
                  <span className="btn-icon">🗑️</span> Löschen
                </button>
                <button className="btn-edit" onClick={() => handleEditClick(selectedJob)}>
                  <span className="btn-icon">✏️</span> Bearbeiten
                </button>
                <button className="btn-secondary" onClick={() => setSelectedJob(null)}>
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedApplication && (
          <div className="modal-overlay" onClick={handleCloseApplicationModal}>
            <div className="job-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-left">
                  <span className="job-badge">
                    {isCompany ? "Bewerber-Details" : "Bewerbungs-Details"}
                  </span>
                  <h2>
                    {isCompany 
                      ? `${selectedApplication.firstname} ${selectedApplication.lastname}`
                      : (selectedApplication.jobName || `Bewerbung #${selectedApplication.id}`)
                    }
                  </h2>
                </div>
                <button className="modal-close" onClick={handleCloseApplicationModal}>×</button>
              </div>

              <div className="modal-body">
                <div className="job-meta-grid">
                  {isCompany ? (
                    <>
                      <div className="job-meta-item">
                        <span className="meta-label">E-Mail</span>
                        <span className="meta-value">{selectedApplication.email}</span>
                      </div>
                      <div className="job-meta-item">
                        <span className="meta-label">Telefon</span>
                        <span className="meta-value">{selectedApplication.phoneNumber}</span>
                      </div>
                      <div className="job-meta-item">
                        <span className="meta-label">Adresse</span>
                        <span className="meta-value">
                          {selectedApplication.street} {selectedApplication.houseNumber}
                        </span>
                      </div>
                      <div className="job-meta-item">
                        <span className="meta-label">Ort</span>
                        <span className="meta-value">{selectedApplication.city}</span>
                      </div>
                      <div className="job-meta-item">
                        <span className="meta-label">Job</span>
                        <span className="meta-value">{selectedApplication.jobName}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="job-meta-item">
                        <span className="meta-label">Unternehmen</span>
                        <span className="meta-value">{selectedApplication.companyName || 'Unbekannt'}</span>
                      </div>
                      <div className="job-meta-item">
                        <span className="meta-label">Beworben am</span>
                        <span className="meta-value">
                          {new Date(selectedApplication.createdAt).toLocaleDateString('de-DE', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="description-section">
                  <h3>Aktueller Status</h3>
                  <div className="current-status" style={{ marginTop: '0', marginBottom: '0' }}>
                    <span className={`status-badge status-${selectedApplication.status || 'pending'}`}>
                      {selectedApplication.status === 'pending' && '⏳ Ausstehend'}
                      {selectedApplication.status === 'review' && '👁️ In Prüfung'}
                      {selectedApplication.status === 'approved' && '✅ Angenommen'}
                      {selectedApplication.status === 'rejected' && '❌ Abgelehnt'}
                      {!selectedApplication.status && '⏳ Ausstehend'}
                    </span>
                  </div>
                  {!isCompany && (
                    <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {selectedApplication.status === 'pending' && 'Deine Bewerbung wird noch bearbeitet.'}
                      {selectedApplication.status === 'review' && 'Deine Bewerbung wird aktuell geprüft.'}
                      {selectedApplication.status === 'approved' && 'Herzlichen Glückwunsch! Deine Bewerbung wurde angenommen.'}
                      {selectedApplication.status === 'rejected' && 'Deine Bewerbung wurde leider abgelehnt.'}
                      {!selectedApplication.status && 'Status wird geladen...'}
                    </p>
                  )}
                </div>

                {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                  <div className="description-section">
                    <h3>📄 {isCompany ? 'Dokumente des Bewerbers' : 'Deine Dokumente'}</h3>
                    <div className="documents-list">
                      {selectedApplication.documents.map((doc, index) => (
                        <div 
                          key={index} 
                          className="document-card"
                          onClick={() => handleOpenPDF(doc.id)}
                        >
                          <div className="document-preview">
                            <div className="document-icon-large">📑</div>
                            <div className="document-info">
                              <div className="document-filename">{doc.fileName}</div>
                              <div className="document-action">Klicken zum Öffnen</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedApplication.documents && (
                  <div className="description-section">
                    <h3>📄 Dokumente</h3>
                    <p>Keine Dokumente vorhanden</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {!isCompany && (
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteApplication(selectedApplication.id)}
                  >
                    <span className="btn-icon">🗑️</span> Bewerbung zurückziehen
                  </button>
                )}
                <button className="btn-secondary" onClick={handleCloseApplicationModal}>
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}

        {userType === "company" && (
          <button className="pp-fab" onClick={() => {
            setEditJob(null);
            setOpen(true);
          }}>+</button>
        )}

        {userType === "company" && (
          <CreateJobModal
            open={open}
            onClose={() => {
              setOpen(false);
              setEditJob(null);
            }}
            onSubmit={handleCreateOrUpdateJob}
            editData={editJob}
          />
        )}
      </div>
    </>
  );
}

export default ProfilePage;