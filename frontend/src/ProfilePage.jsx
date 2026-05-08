import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ProfilePage.css";
import CreateJobModal from "./components/job/CreateJobModal";

function ProfilePage({ onBack }) {
  const [userType, setUserType] = useState(null);
  const [view, setView] = useState("bewerbungen");
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editJob, setEditJob] = useState(null); // Für Bearbeitung
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchJobs = async () => {
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
      
      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        console.warn('API did not return an array:', data);
        setJobs([]);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
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
      fetchJobs(); // Liste aktualisieren
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="pp-content-box">
          <p>Loading...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="pp-content-box">
          <p className="error-message">Error: {error}</p>
        </div>
      );
    }

    if (view === "bewerbungen") {
      return (
        <div className="pp-content-box">
          <h2>Bewerbungen</h2>

          {jobs.length === 0 ? (
            <p>Keine Stellen vorhanden</p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                onClick={() => setSelectedJob(job)}
              >
                <h3>{job.companyName}</h3>
                <p><strong>Position:</strong> {job.jobName}</p>
                <p><strong>Branche:</strong> {job.companySector}</p>
                <p><strong>Standort:</strong> {job.companyLocation}</p>
                <small>Application ID: {job.applicationId}</small>
                <small>Erstellt: {job.createdAt}</small>
              </div>
            ))
          )}
        </div>
      );
    }

    if (view === "bewerber") {
      return (
        <div className="pp-content-box">
          <h2>Bewerber</h2>
          <p>Platzhalter: Liste aller Bewerber</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pp-container">
      {userType === "company" && (
        <div className="pp-sidebar">
          <button
            className={`pp-side-item ${view === "bewerbungen" ? "active" : ""}`}
            onClick={() => {
              setView("bewerbungen");
              fetchJobs();
            }}
          >
            Bewerbungen
          </button>

          <button
            className={`pp-side-item ${view === "bewerber" ? "active" : ""}`}
            onClick={() => setView("bewerber")}
          >
            Bewerber
          </button>

          <button className="pp-back" onClick={onBack}>
            Zurück
          </button>
        </div>
      )}

      <div className="pp-main">
        {userType === "applicant" ? (
          <>
            <h1>Willkommen, Bewerber!</h1>
            <p>Verwalte deine Bewerbungen</p>

            <div className="pp-content-box">
              <h2>Meine Bewerbungen</h2>
              <p>Platzhalter: Liste deiner Bewerbungen</p>
            </div>
          </>
        ) : userType === "company" ? (
          <>
            <h1>Willkommen, Unternehmen!</h1>
            <p>Verwalte Stellen und Bewerber</p>
            {renderContent()}
          </>
        ) : (
          <>
            <h1>Willkommen!</h1>
            <p>Unbekannter Benutzertyp</p>
          </>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="job-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <span className="job-badge">Stellenanzeige</span>
                <h2>{selectedJob.jobName}</h2>
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
                  <span className="meta-label">Branche</span>
                  <span className="meta-value">{selectedJob.companySector}</span>
                </div>
                <div className="job-meta-item">
                  <span className="meta-label">Standort</span>
                  <span className="meta-value">{selectedJob.companyLocation}</span>
                </div>
                <div className="job-meta-item">
                  <span className="meta-label">Erstellt am</span>
                  <span className="meta-value">
                    {new Date(selectedJob.createdAt).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
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
              <button 
                className="btn-delete" 
                onClick={() => handleDeleteJob(selectedJob.id)}
              >
                <span className="btn-icon">🗑️</span>
                Löschen
              </button>
              
              <button 
                className="btn-edit" 
                onClick={() => handleEditClick(selectedJob)}
              >
                <span className="btn-icon">✏️</span>
                Bearbeiten
              </button>
              
              <button className="btn-secondary" onClick={() => setSelectedJob(null)}>
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
        }}>
          +
        </button>
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
  );
}

export default ProfilePage;