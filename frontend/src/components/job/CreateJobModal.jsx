import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./CreateJobModal.css";

export default function CreateJobModal({ open, onClose, onSubmit, editData }) {
  const [form, setForm] = useState({
    companyName: "",
    companySector: "",
    companyLocation: "",
    jobName: "",
    description: ""
  });

  const [showTips, setShowTips] = useState(false);
  const tipRef = useRef(null);

  const isEditing = !!editData;

  // Formular mit editData füllen wenn vorhanden
  useEffect(() => {
    if (editData) {
      setForm({
        companyName: editData.companyName || "",
        companySector: editData.companySector || "",
        companyLocation: editData.companyLocation || "",
        jobName: editData.jobName || "",
        description: editData.description || ""
      });
    } else if (open) {
      setForm({
        companyName: "",
        companySector: "",
        companyLocation: "",
        jobName: "",
        description: ""
      });
    }
  }, [editData, open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tipRef.current && !tipRef.current.contains(e.target)) {
        setShowTips(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    onSubmit(form, editData?.id);
    onClose();
  };

  return (
    <div className="create-job-modal-backdrop">
      <div className="create-job-modal">

        <h2>{isEditing ? "Job bearbeiten" : "Job erstellen"}</h2>

        <input
          name="companyName"
          placeholder="Company Name"
          value={form.companyName}
          onChange={handleChange}
        />

        <input
          name="companySector"
          placeholder="Sector"
          value={form.companySector}
          onChange={handleChange}
        />

        <input
          name="companyLocation"
          placeholder="Location"
          value={form.companyLocation}
          onChange={handleChange}
        />

        <input
          name="jobName"
          placeholder="Job Name"
          value={form.jobName}
          onChange={handleChange}
        />

        <div className="markdown-header">
          <h3>Beschreibung</h3>

          <div className="tooltip-wrapper" ref={tipRef}>
            <span
              className="info-icon"
              onClick={() => setShowTips(!showTips)}
            >
              ❓
            </span>

            {showTips && (
              <div className="tooltip-box">
                <h4>Markdown Tipps</h4>
                <ul>
                  <li><b># Titel</b> → Überschrift</li>
                  <li><b>**text**</b> → fett</li>
                  <li><b>*text*</b> → kursiv</li>
                  <li><b>- item</b> → Liste</li>
                  <li><b>[link](url)</b> → Link</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="editor-split">

          <textarea
            className="markdown-input"
            name="description"
            placeholder="Job Beschreibung (Markdown)"
            value={form.description}
            onChange={handleChange}
          />

          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {form.description || "*Keine Vorschau...*"}
            </ReactMarkdown>
          </div>

        </div>

        <div className="modal-actions">
          <button onClick={handleSubmit}>
            {isEditing ? "Aktualisieren" : "Speichern"}
          </button>

          <button onClick={onClose}>
            Abbrechen
          </button>
        </div>

      </div>
    </div>
  );
}