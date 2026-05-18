import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./CreateJobModal.css";

export default function CreateJobModal({ open, onClose, onSubmit, editData }) {
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    companySector: "",
    street: "",
    houseNumber: "",
    city: "",
    postalCode: "",
    jobName: "",
    description: ""
  });

  const [showTips, setShowTips] = useState(false);
  const tipRef = useRef(null);

  const isEditing = !!editData;

  // Fill form with editData when available
  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || "",
        companyName: editData.companyName || "",
        companySector: editData.companySector || "",
        street: editData.street || "",
        houseNumber: editData.houseNumber || "",
        city: editData.city || "",
        postalCode: editData.postalCode || "",
        jobName: editData.jobName || "",
        description: editData.description || ""
      });
    } else if (open) {
      setForm({
        title: "",
        companyName: "",
        companySector: "",
        street: "",
        houseNumber: "",
        city: "",
        postalCode: "",
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
      if (!form.title) {
          alert("Title ist erforderlich");
          return;
      }
      onSubmit(form, editData?.id);
      onClose();
  };

  return (
    <div className="create-job-modal-backdrop">
      <div className="create-job-modal">

        <h2>{isEditing ? "Job bearbeiten" : "Job erstellen"}</h2>

        <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
        />

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
          name="street"
          placeholder="Street"
          value={form.street}
          onChange={handleChange}
        />

        <div className="address-row">
          <input
            name="houseNumber"
            placeholder="House Number"
            value={form.houseNumber}
            onChange={handleChange}
            className="house-number"
          />

          <input
            name="postalCode"
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={handleChange}
            className="postal-code"
          />
        </div>

        <input
          name="city"
          placeholder="City"
          value={form.city}
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