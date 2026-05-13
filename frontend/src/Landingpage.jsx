// Landingpage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Landingpage.css";

// Leaflet Standard-Marker-Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom Marker für Bewerbungen (grün/gelb)
const applicationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Benutzerstandort-Marker (blau)
const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ==================== SUB-KOMPONENTEN ====================

// Komponente für Karten-Events (Bewegung, Zoom) - FIX: useRef für Callback
function MapEventHandler({ onMoveEnd }) {
  const onMoveEndRef = useRef(onMoveEnd);
  
  useEffect(() => {
    onMoveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);

  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      const bounds = map.getBounds();
      
      if (onMoveEndRef.current) {
        onMoveEndRef.current({
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
          bounds: {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          },
        });
      }
    },
  });
  return null;
}

// Komponente zum Setzen der Map-View - FIX: Vergleich mit prev-Werten
function MapViewSetter({ center, zoom }) {
  const map = useMap();
  const prevCenterRef = useRef(null);
  const prevZoomRef = useRef(null);

  useEffect(() => {
    if (
      center &&
      (prevCenterRef.current?.lat !== center[0] ||
       prevCenterRef.current?.lng !== center[1] ||
       prevZoomRef.current !== zoom)
    ) {
      map.setView(center, zoom || 13, { animate: true });
      prevCenterRef.current = { lat: center[0], lng: center[1] };
      prevZoomRef.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

// Umkreis-Visualisierung - FIX: Optimierte Dependencies
function RadiusCircle({ center, radius }) {
  const map = useMap();
  const circleRef = useRef(null);

  useEffect(() => {
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    if (center && radius && radius > 0) {
      circleRef.current = L.circle(center, {
        radius: radius * 1000,
        color: "#e8ff5a",
        fillColor: "#e8ff5a",
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: "5, 5",
      }).addTo(map);
    }

    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    };
  }, [center?.[0], center?.[1], radius, map]);

  return null;
}

// ==================== HAUPTKOMPONENTE ====================

function Landingpage({ isLoggedIn, onGetStarted, onLogout, onNavigate }) {
  // === STATES ===
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  // Such-Filter
  const [searchType, setSearchType] = useState("");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [whatSearch, setWhatSearch] = useState("");
  const [whereSearch, setWhereSearch] = useState("");

  // Geo-Filter
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [mapCenter, setMapCenter] = useState({ lat: 51.1657, lng: 10.4515 });
  const [mapZoom, setMapZoom] = useState(6);
  const [mapBounds, setMapBounds] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Refs
  const dropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const modalRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const isInitialMount = useRef(true);

  const searchTypes = [
    { value: "", label: "Alle" },
    { value: "ausbildung", label: "Ausbildung/Duales Studium" },
    { value: "arbeit", label: "Arbeit" },
    { value: "praktikum", label: "Praktikum" },
  ];

  // ==================== HILFSFUNKTIONEN ====================

  const deg2rad = useCallback((deg) => deg * (Math.PI / 180), []);

  const estimateRadiusFromBounds = useCallback((bounds) => {
    if (!bounds) return 50;
    const centerLat = (bounds.north + bounds.south) / 2;
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const latKm = latDiff * 111.32;
    const lngKm = lngDiff * (111.32 * Math.cos(deg2rad(centerLat)));
    return Math.round(Math.max(latKm, lngKm) / 2);
  }, [deg2rad]);

  const formatDistance = useCallback((distance) => {
    if (distance === null || distance === undefined) return null;
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance} km`;
  }, []);

  // ==================== API-FUNKTIONEN ====================

  const loadInitialApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 25 });
      if (userLocation) {
        params.append("latitude", userLocation.lat);
        params.append("longitude", userLocation.lng);
      }
      const response = await fetch(`/api/search?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setApplications(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalResults(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load applications. Please try again later.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, userLocation]);

  const fitMapToMarkers = useCallback((apps) => {
    if (!apps || apps.length === 0) return;
    const coords = apps.filter((a) => a.latitude && a.longitude);
    if (coords.length === 0) return;
    const lats = coords.map((a) => a.latitude);
    const lngs = coords.map((a) => a.longitude);
    const center = {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
    setMapCenter(center);
    if (coords.length === 1) {
      setMapZoom(15);
    }
  }, []);

  // searchByBounds mit useCallback stabilisieren
  const searchByBounds = useCallback(async () => {
    if (!mapBounds) return;
    setLoading(true);
    try {
      const searchData = {
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        radius: estimateRadiusFromBounds(mapBounds),
      };
      if (searchType) searchData.applicationType = searchType;
      if (whatSearch) searchData.search = whatSearch;

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setApplications(data.data || []);
      setHasSearched(true);
    } catch (err) {
      console.error("Bounds search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [mapBounds, mapCenter, searchType, whatSearch, estimateRadiusFromBounds]);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      const searchData = {};
      if (searchType) searchData.applicationType = searchType;
      if (whatSearch) searchData.search = whatSearch;
      if (whereSearch) searchData.companyLocation = whereSearch;

      if (userLocation && searchRadius) {
        searchData.latitude = userLocation.lat;
        searchData.longitude = userLocation.lng;
        searchData.radius = searchRadius;
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setApplications(data.data || []);

      if (viewMode === "map" && data.data?.length > 0) {
        const appsWithCoords = data.data.filter((a) => a.latitude && a.longitude);
        if (appsWithCoords.length > 0) {
          fitMapToMarkers(appsWithCoords);
        }
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Suche fehlgeschlagen. Bitte versuche es später erneut.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [searchType, whatSearch, whereSearch, userLocation, searchRadius, viewMode, fitMapToMarkers]);

  // ==================== GEO-FUNKTIONEN ====================

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setMapCenter(loc);
        setMapZoom(13);
        setLocatingUser(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Standort konnte nicht ermittelt werden.");
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // handleMapMove mit useCallback stabilisieren
  const handleMapMove = useCallback(({ lat, lng, zoom, bounds }) => {
    setMapCenter({ lat, lng });
    setMapZoom(zoom);
    setMapBounds(bounds);
  }, []);

  // ==================== EFFECTS ====================

  // Click-Outside für Dropdowns
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

  // Escape-Taste für Modal
  useEffect(() => {
    function handleEscKey(e) {
      if (e.key === "Escape" && selectedApplication) {
        closeModal();
      }
    }
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [selectedApplication]);

  // Initial Load
  useEffect(() => {
    loadInitialApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map-Bounds-Change → Automatische Suche (Debounced mit Änderungs-Check)
  useEffect(() => {
    if (viewMode !== "map" || !mapBounds) return;
    
    // Prüfen ob Bounds sich signifikant geändert haben
    const boundsKey = `${mapBounds.north.toFixed(4)}_${mapBounds.south.toFixed(4)}_${mapBounds.east.toFixed(4)}_${mapBounds.west.toFixed(4)}`;
    
    if (boundsKey === lastBoundsRef.current) {
      return; // Keine signifikante Änderung
    }
    
    lastBoundsRef.current = boundsKey;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchByBounds();
    }, 1000);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [mapBounds, viewMode, searchByBounds]);

  // ==================== SONSTIGE HILFSFUNKTIONEN ====================

  const getSelectedTypeLabel = () => {
    const type = searchTypes.find((t) => t.value === searchType);
    return type ? type.label : "Alle";
  };

  const copyToClipboard = async (text, id) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const openModal = (application) => {
    setSelectedApplication(application);
    setIsFavorited(false);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedApplication(null);
    document.body.style.overflow = "";
  };

  const renderMarkdown = (markdown) => {
    if (!markdown) return "<p>Keine Beschreibung vorhanden</p>";
    let html = markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    html = "<p>" + html + "</p>";
    return html;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ==================== RENDER ====================

  const applicationsWithCoords = applications.filter((a) => a.latitude && a.longitude);

  return (
    <div className="lp-container">
      {/* ========== NAVIGATION ========== */}
      <nav className="lp-nav">
        <span className="lp-logo">ATS</span>
        <div className="lp-nav-right">
          <button className="lp-icon-btn" title="Saved">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <div className="lp-user-wrap" ref={dropdownRef}>
            <button
              className={`lp-icon-btn lp-user-btn${dropdownOpen ? " open" : ""}`}
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="lp-dropdown">
                {isLoggedIn ? (
                  <>
                    <button className="lp-dd-item" onClick={() => { onNavigate?.("profile"); setDropdownOpen(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Profil anzeigen
                    </button>
                    <button className="lp-dd-item danger" onClick={() => { onLogout?.(); setDropdownOpen(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button className="lp-dd-item" onClick={() => { onNavigate?.("login"); setDropdownOpen(false); }}>
                      Login
                    </button>
                    <button className="lp-dd-item" onClick={() => { onNavigate?.("register"); setDropdownOpen(false); }}>
                      Registrieren
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ========== MAIN CONTENT ========== */}
      <div className="lp-main">
        <div className="lp-hero">
          <h1>Finde deine nächste Chance</h1>
          <p className="lp-hero-subtitle">Durchsuche tausende Bewerbungen und finde den perfekten Match</p>
        </div>

        {/* ========== SEARCH BAR ========== */}
        <form className="lp-search-bar" onSubmit={handleSearch}>
          <div className="lp-search-row">
            <div className="lp-search-field lp-search-what">
              <label className="lp-search-label">Was suchen Sie?</label>
              <div className="lp-search-inputs">
                <div className="lp-type-select" ref={typeDropdownRef}>
                  <button type="button" className={`lp-type-btn ${typeDropdownOpen ? "open" : ""}`} onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}>
                    <span>{getSelectedTypeLabel()}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {typeDropdownOpen && (
                    <div className="lp-type-dropdown">
                      {searchTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          className={`lp-type-option ${searchType === type.value ? "active" : ""}`}
                          onClick={() => { setSearchType(type.value); setTypeDropdownOpen(false); }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="text" className="lp-what-input" placeholder="z.B. Beruf, Stichwort, Application ID" value={whatSearch} onChange={(e) => setWhatSearch(e.target.value)} />
              </div>
            </div>

            <div className="lp-search-field lp-search-where">
              <label className="lp-search-label">Wo suchen Sie?</label>
              <input type="text" className="lp-where-input" placeholder="z.B. Ort, PLZ, Bundesland" value={whereSearch} onChange={(e) => setWhereSearch(e.target.value)} />
            </div>

            <div className="lp-search-field lp-search-radius">
              <label className="lp-search-label">Umkreis (km)</label>
              <input
                type="number"
                className="lp-radius-input"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                min="1"
                max="500"
                step="5"
              />
            </div>

            <button type="button" className="lp-locate-btn" onClick={locateUser} disabled={locatingUser} title="Meinen Standort verwenden">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
              {locatingUser ? "..." : ""}
            </button>

            <button type="submit" className="lp-search-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Stellen finden
            </button>
          </div>
        </form>

        {/* ========== VIEW TOGGLE ========== */}
        <div className="lp-view-toggle">
          <button className={`lp-view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Liste
          </button>
          <button className={`lp-view-btn ${viewMode === "map" ? "active" : ""}`} onClick={() => setViewMode("map")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Karte
          </button>
        </div>

        {/* ========== CONTENT BEREICH ========== */}
        <div className="lp-content-area">
          {/* Listenansicht */}
          {(viewMode === "list" || viewMode === "split") && (
            <div className={`lp-list-panel ${viewMode === "split" ? "split" : ""}`}>
              <div className="lp-section-header">
                <h2 className="lp-section-title">
                  {hasSearched ? "Suchergebnisse" : "Aktuelle Bewerbungen"}
                </h2>
                {hasSearched && (
                  <span className="lp-results-count">{applications.length} Ergebnisse</span>
                )}
              </div>

              {loading && (
                <div className="lp-loading">
                  <div className="lp-loader" />
                  <p>Suche läuft...</p>
                </div>
              )}

              {error && (
                <div className="lp-error">
                  <p>{error}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="lp-applications">
                  {applications.length > 0 ? (
                    applications.map((app) => (
                      <div key={app.id} className="lp-card" onClick={() => openModal(app)}>
                        <h3 className="lp-card-title">{app.title || app.jobName || "Keine Position"}</h3>
                        <p className="lp-card-company">{app.companyName || "Unbekanntes Unternehmen"}</p>
                        <div className="lp-card-info-row">
                          <span className="lp-card-location">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {app.postalCode} {app.city || "Standort unbekannt"}
                            {app.distance !== undefined && app.distance !== null && (
                              <span className="lp-distance-badge">({formatDistance(app.distance)})</span>
                            )}
                          </span>
                          <span className="lp-card-type">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            {app.companySector || "Branche nicht angegeben"}
                          </span>
                          <button
                            className={`lp-card-id-btn ${copiedId === app.id ? "copied" : ""}`}
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(app.applicationId, app.id); }}
                          >
                            <span>{app.applicationId?.substring(0, 8) || "N/A"}</span>
                          </button>
                        </div>
                        <div className="lp-card-date-wrapper">
                          <span className="lp-card-date">
                            {app.createdAt ? formatRelativeDate(app.createdAt) : "Kein Datum"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="lp-empty-state">
                      <p>Keine Bewerbungen gefunden</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Kartenansicht */}
          {(viewMode === "map" || viewMode === "split") && (
            <div className={`lp-map-panel ${viewMode === "split" ? "split" : ""}`}>
              <MapContainer
                key={`map-${viewMode}`}
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={mapZoom}
                className="lp-leaflet-map"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEventHandler onMoveEnd={handleMapMove} />

                <MapViewSetter center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom} />

                {mapBounds && (
                  <RadiusCircle
                    center={[mapCenter.lat, mapCenter.lng]}
                    radius={estimateRadiusFromBounds(mapBounds)}
                  />
                )}

                {/* Benutzerstandort */}
                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                    <Popup>
                      <strong>Dein Standort</strong>
                    </Popup>
                  </Marker>
                )}

                {/* Bewerbungs-Marker */}
                {applicationsWithCoords.map((app) => (
                  <Marker
                    key={app.id}
                    position={[app.latitude, app.longitude]}
                    icon={applicationIcon}
                  >
                    <Popup>
                      <div className="lp-map-popup">
                        <strong>{app.title || app.jobName || "Keine Position"}</strong>
                        <p>{app.companyName}</p>
                        <p>{app.postalCode} {app.city}</p>
                        {app.distance !== undefined && (
                          <p className="lp-popup-distance">📍 {formatDistance(app.distance)} entfernt</p>
                        )}
                        <button
                          className="lp-popup-detail-btn"
                          onClick={() => openModal(app)}
                        >
                          Details anzeigen
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Karten-Legende */}
              <div className="lp-map-legend">
                <div className="lp-legend-item">
                  <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="Bewerbung" width="20" height="32" />
                  <span>Bewerbung</span>
                </div>
                {userLocation && (
                  <div className="lp-legend-item">
                    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" alt="Dein Standort" width="20" height="32" />
                    <span>Dein Standort</span>
                  </div>
                )}
                <div className="lp-legend-item">
                  <div className="lp-legend-circle" />
                  <span>Kartenausschnitt</span>
                </div>
              </div>

              {/* Karten-Hinweis */}
              <div className="lp-map-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Karte bewegen = neue Suche im sichtbaren Bereich</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== DETAIL MODAL ========== */}
      {selectedApplication && (
        <div className="lp-modal-backdrop" onClick={closeModal}>
          <div className="lp-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={closeModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="lp-modal-header">
              <h2 className="lp-modal-title">{selectedApplication.title || selectedApplication.jobName || "Keine Position"}</h2>
              <p className="lp-modal-company">{selectedApplication.companyName || "Unbekanntes Unternehmen"}</p>
            </div>

            <div className="lp-modal-info-grid">
              <div className="lp-modal-info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <span className="lp-modal-info-label">Adresse</span>
                  <span className="lp-modal-info-value">
                    {selectedApplication.street} {selectedApplication.houseNumber}
                  </span>
                </div>
              </div>

              <div className="lp-modal-info-item">
                <div>
                  <span className="lp-modal-info-label">PLZ / Ort</span>
                  <span className="lp-modal-info-value">
                    {selectedApplication.postalCode} {selectedApplication.city || "Unbekannt"}
                    {selectedApplication.distance !== undefined && selectedApplication.distance !== null && (
                      <span className="lp-distance-badge">({formatDistance(selectedApplication.distance)})</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="lp-modal-info-item">
                <div>
                  <span className="lp-modal-info-label">Branche</span>
                  <span className="lp-modal-info-value">{selectedApplication.companySector || "Nicht angegeben"}</span>
                </div>
              </div>

              <div className="lp-modal-info-item">
                <div>
                  <span className="lp-modal-info-label">Application ID</span>
                  <span className="lp-modal-info-value lp-modal-id">{selectedApplication.applicationId || "N/A"}</span>
                </div>
              </div>

              <div className="lp-modal-info-item">
                <div>
                  <span className="lp-modal-info-label">Erstellt am</span>
                  <span className="lp-modal-info-value">
                    {selectedApplication.createdAt ? formatDate(selectedApplication.createdAt) : "Kein Datum"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mini-Map im Modal */}
            {selectedApplication.latitude && selectedApplication.longitude && (
              <div className="lp-modal-map-thumb">
                <MapContainer
                  center={[selectedApplication.latitude, selectedApplication.longitude]}
                  zoom={15}
                  className="lp-modal-leaflet-map"
                  scrollWheelZoom={false}
                  dragging={false}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[selectedApplication.latitude, selectedApplication.longitude]} />
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
                  )}
                </MapContainer>
              </div>
            )}

            <div className="lp-modal-actions">
              <button className={`lp-modal-action-btn lp-fav-btn ${isFavorited ? "active" : ""}`} onClick={() => setIsFavorited(!isFavorited)}>
                {isFavorited ? "Gemerkt" : "Merken"}
              </button>
              <button className="lp-modal-action-btn lp-apply-btn" onClick={() => { onNavigate?.("application", selectedApplication.applicationId); }}>
                Jetzt bewerben
              </button>
            </div>

            <div className="lp-modal-markdown-section">
              <h3 className="lp-modal-markdown-title">Beschreibung</h3>
              <div className="lp-modal-markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedApplication.description || "") }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landingpage;