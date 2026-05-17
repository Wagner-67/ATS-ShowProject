import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { Helmet } from 'react-helmet-async';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Landingpage.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const applicationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

function Landingpage({ isLoggedIn, onGetStarted, onLogout, onNavigate }) {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const [searchType, setSearchType] = useState("");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [whatSearch, setWhatSearch] = useState("");
  const [whereSearch, setWhereSearch] = useState("");

  const [mapCenter, setMapCenter] = useState({ lat: 51.1657, lng: 10.4515 });
  const [mapZoom, setMapZoom] = useState(6);
  const [mapBounds, setMapBounds] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Umkreissuche States
  const [searchRadius, setSearchRadius] = useState(10);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCoords, setSearchCoords] = useState(null);

  const dropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const modalRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const lastBoundsRef = useRef(null);

  const searchTypes = [
    { value: "", label: "Alle" },
    { value: "ausbildung", label: "Ausbildung/Duales Studium" },
    { value: "arbeit", label: "Arbeit" },
    { value: "praktikum", label: "Praktikum" },
  ];

  const radiusOptions = [
    { value: 10, label: "10 km" },
    { value: 20, label: "20 km" },
    { value: 30, label: "30 km" },
    { value: 40, label: "40 km" },
    { value: 50, label: "50 km" },
    { value: 100, label: "100 km" },
  ];

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

  // Geocoding-Funktion: Adresse in Koordinaten umwandeln
  const geocodeAddress = useCallback(async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (err) {
      console.error("Geocoding failed:", err);
      return null;
    }
  }, []);

  const loadInitialApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 25 });
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
  }, [currentPage]);

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

      // Wenn Ort für Umkreissuche eingegeben wurde
      if (searchLocation && searchCoords) {
        searchData.latitude = searchCoords.lat;
        searchData.longitude = searchCoords.lng;
        searchData.radius = searchRadius;
        searchData.sortBy = 'distance';
        searchData.sortOrder = 'ASC';
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
      
      // Sortiere nach Distanz wenn Umkreissuche aktiv
      let resultData = data.data || [];
      if (searchLocation && searchCoords) {
        resultData = resultData.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
      
      setApplications(resultData);

      if (viewMode === "map" && searchLocation && searchCoords) {
        setMapCenter(searchCoords);
        const zoomLevel = searchRadius <= 10 ? 12 : searchRadius <= 30 ? 11 : searchRadius <= 50 ? 10 : 8;
        setMapZoom(zoomLevel);
      } else if (viewMode === "map" && resultData.length > 0) {
        const appsWithCoords = resultData.filter((a) => a.latitude && a.longitude);
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
  }, [searchType, whatSearch, whereSearch, searchLocation, searchCoords, searchRadius, viewMode, fitMapToMarkers]);

  // Geocoding durchführen wenn sich der Ort ändert
  const handleLocationChange = useCallback(async (value) => {
    setSearchLocation(value);
    if (value.length < 2) {
      setSearchCoords(null);
      return;
    }
    
    // Debounce für Geocoding
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      const coords = await geocodeAddress(value);
      setSearchCoords(coords);
    }, 500);
  }, [geocodeAddress]);

  const handleMapMove = useCallback(({ lat, lng, zoom, bounds }) => {
    setMapCenter({ lat, lng });
    setMapZoom(zoom);
    setMapBounds(bounds);
  }, []);

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

  useEffect(() => {
    function handleEscKey(e) {
      if (e.key === "Escape" && selectedApplication) {
        closeModal();
      }
    }
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [selectedApplication]);

  useEffect(() => {
    loadInitialApplications();
  }, []);

  useEffect(() => {
    if (viewMode !== "map" || !mapBounds) return;

    const boundsKey = `${mapBounds.north.toFixed(4)}_${mapBounds.south.toFixed(4)}_${mapBounds.east.toFixed(4)}_${mapBounds.west.toFixed(4)}`;
    
    if (boundsKey === lastBoundsRef.current) {
      return;
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

  const applicationsWithCoords = applications.filter((a) => a.latitude && a.longitude);

return (
      <>
      <Helmet>
        <title>Landing Page</title>
        <meta name="description" content="Willkommen auf der Startseite. Hier kannst du nach stellen suchen und dich Bewerben sowie Anmelden/Registrieren." />
      </Helmet>
    <div className="lp-container">
      {/* ========== NAVIGATION ========== */}
      <nav className="lp-nav" role="navigation" aria-label="Hauptnavigation">
        <span className="lp-logo">ATS</span>
        <div className="lp-nav-right">
          <button className="lp-icon-btn" title="Saved" aria-label="Gespeicherte anzeigen">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <div className="lp-user-wrap" ref={dropdownRef}>
            <button
              className={`lp-icon-btn lp-user-btn${dropdownOpen ? " open" : ""}`}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Benutzermenü öffnen"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="lp-dropdown" role="menu" aria-label="Benutzermenü">
                {isLoggedIn ? (
                  <>
                    <button className="lp-dd-item" role="menuitem" onClick={() => { onNavigate?.("profile"); setDropdownOpen(false); }}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Profil anzeigen
                    </button>
                    <button className="lp-dd-item danger" role="menuitem" onClick={() => { onLogout?.(); setDropdownOpen(false); }}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button className="lp-dd-item" role="menuitem" onClick={() => { onNavigate?.("login"); setDropdownOpen(false); }}>
                      Login
                    </button>
                    <button className="lp-dd-item" role="menuitem" onClick={() => { onNavigate?.("register"); setDropdownOpen(false); }}>
                      Registrieren
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ========== HEADER (BANNER) ========== */}
      <header className="lp-hero" role="banner">
        <h1>Finde deine nächste Chance</h1>
        <p className="lp-hero-subtitle">Durchsuche tausende Bewerbungen und finde den perfekten Match</p>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="lp-main" role="main" aria-label="Hauptinhalt">
        {/* ========== SEARCH BAR ========== */}
        <section aria-label="Suche">
          <form className="lp-search-bar" onSubmit={handleSearch} role="search" aria-label="Bewerbungssuche">
            <div className="lp-search-row">
              <div className="lp-search-field lp-search-what">
                <label className="lp-search-label" htmlFor="what-search">Was suchen Sie?</label>
                <div className="lp-search-inputs">
                  <div className="lp-type-select" ref={typeDropdownRef}>
                    <button 
                      type="button" 
                      className={`lp-type-btn ${typeDropdownOpen ? "open" : ""}`} 
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                      aria-label="Suchtyp auswählen"
                      aria-expanded={typeDropdownOpen}
                      aria-haspopup="listbox"
                    >
                      <span>{getSelectedTypeLabel()}</span>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {typeDropdownOpen && (
                      <div className="lp-type-dropdown" role="listbox" aria-label="Suchtyp">
                        {searchTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            role="option"
                            aria-selected={searchType === type.value}
                            className={`lp-type-option ${searchType === type.value ? "active" : ""}`}
                            onClick={() => { setSearchType(type.value); setTypeDropdownOpen(false); }}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input 
                    id="what-search"
                    type="text" 
                    className="lp-what-input" 
                    placeholder="z.B. Beruf, Stichwort, Application ID" 
                    value={whatSearch} 
                    onChange={(e) => setWhatSearch(e.target.value)} 
                  />
                </div>
              </div>

              <div className="lp-search-field lp-search-where">
                <label className="lp-search-label" htmlFor="where-search">Wo suchen Sie?</label>
                <div className="lp-search-inputs">
                  <input 
                    id="where-search"
                    type="text" 
                    className="lp-where-input" 
                    placeholder="z.B. Berlin, München, Hamburg" 
                    value={searchLocation} 
                    onChange={(e) => handleLocationChange(e.target.value)} 
                  />
                  <label htmlFor="radius-select" className="sr-only">Suchradius</label>
                  <select 
                    id="radius-select"
                    className="lp-radius-select"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    aria-label="Suchradius in Kilometern"
                  >
                    {radiusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {searchLocation && !searchCoords && (
                  <span className="lp-location-hint" role="status">Ort wird gesucht...</span>
                )}
                {searchCoords && (
                  <span className="lp-location-found" role="status">✓ Umkreissuche aktiv</span>
                )}
              </div>

              <button type="submit" className="lp-search-btn">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Stellen finden
              </button>
            </div>
          </form>
        </section>

        {/* ========== VIEW TOGGLE ========== */}
        <div className="lp-view-toggle" role="tablist" aria-label="Ansicht wechseln">
          <button 
            className={`lp-view-btn ${viewMode === "list" ? "active" : ""}`} 
            onClick={() => setViewMode("list")}
            role="tab"
            aria-selected={viewMode === "list"}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Liste
          </button>
          <button 
            className={`lp-view-btn ${viewMode === "map" ? "active" : ""}`} 
            onClick={() => setViewMode("map")}
            role="tab"
            aria-selected={viewMode === "map"}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <section className={`lp-list-panel ${viewMode === "split" ? "split" : ""}`} aria-label="Bewerbungsliste">
              <div className="lp-section-header">
                <h2 className="lp-section-title">
                  {hasSearched ? "Suchergebnisse" : "Aktuelle Bewerbungen"}
                </h2>
                {hasSearched && (
                  <span className="lp-results-count" aria-live="polite">{applications.length} Ergebnisse</span>
                )}
              </div>

              {loading && (
                <div className="lp-loading" role="status" aria-label="Lade Bewerbungen">
                  <div className="lp-loader" />
                  <p>Suche läuft...</p>
                </div>
              )}

              {error && (
                <div className="lp-error" role="alert">
                  <p>{error}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="lp-applications">
                  {applications.length > 0 ? (
                    applications.map((app) => (
                      <article 
                        key={app.id} 
                        className="lp-card"
                        aria-label={`${app.title || app.jobName || "Keine Position"} bei ${app.companyName || "Unbekanntes Unternehmen"}`}
                      >
                        <div className="lp-card-main" onClick={() => openModal(app)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(app); } }}>
                          <h3 className="lp-card-title">{app.title || app.jobName || "Keine Position"}</h3>
                          <p className="lp-card-company">{app.companyName || "Unbekanntes Unternehmen"}</p>
                          <div className="lp-card-info-row">
                            <span className="lp-card-location">
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {app.postalCode} {app.city || "Standort unbekannt"}
                              {app.distance !== undefined && app.distance !== null && (
                                <span className="lp-distance-badge">({formatDistance(app.distance)})</span>
                              )}
                            </span>
                            <span className="lp-card-type">
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                              </svg>
                              {app.companySector || "Branche nicht angegeben"}
                            </span>
                          </div>
                          <div className="lp-card-date-wrapper">
                            <span className="lp-card-date">
                              {app.createdAt ? formatRelativeDate(app.createdAt) : "Kein Datum"}
                            </span>
                          </div>
                        </div>
                        <button
                          className={`lp-card-id-btn ${copiedId === app.id ? "copied" : ""}`}
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(app.applicationId, app.id); }}
                          aria-label={`Application ID ${app.applicationId?.substring(0, 8) || "N/A"} kopieren`}
                        >
                          <span>{app.applicationId?.substring(0, 8) || "N/A"}</span>
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="lp-empty-state">
                      <p>Keine Bewerbungen gefunden</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Kartenansicht */}
          {(viewMode === "map" || viewMode === "split") && (
            <section className={`lp-map-panel ${viewMode === "split" ? "split" : ""}`} aria-label="Kartenansicht">
              <MapContainer
                key={`map-${viewMode}`}
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={mapZoom}
                className="lp-leaflet-map"
                scrollWheelZoom={true}
                aria-label="Interaktive Karte"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEventHandler onMoveEnd={handleMapMove} />

                <MapViewSetter center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom} />

                {/* Suchradius-Kreis */}
                {searchCoords && (
                  <RadiusCircle
                    center={[searchCoords.lat, searchCoords.lng]}
                    radius={searchRadius}
                  />
                )}

                {/* Suchzentrum Marker */}
                {searchCoords && (
                  <Marker position={[searchCoords.lat, searchCoords.lng]}>
                    <Popup>
                      <strong>Suchzentrum</strong>
                      <p>{searchLocation}</p>
                      <p>Umkreis: {searchRadius} km</p>
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
              <aside className="lp-map-legend" aria-label="Kartenlegende">
                <div className="lp-legend-item">
                  <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="Grüner Marker für Bewerbung" width="20" height="32" />
                  <span>Bewerbung</span>
                </div>
                {searchCoords && (
                  <>
                    <div className="lp-legend-item">
                      <div className="lp-legend-circle" aria-hidden="true" />
                      <span>Suchradius ({searchRadius} km)</span>
                    </div>
                  </>
                )}
              </aside>

              {/* Karten-Hinweis */}
              <div className="lp-map-hint" role="complementary" aria-label="Kartenhinweis">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{searchCoords ? `Umkreissuche: ${searchRadius} km um ${searchLocation}` : 'Karte bewegen = neue Suche im sichtbaren Bereich'}</span>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ========== DETAIL MODAL ========== */}
      {selectedApplication && (
        <div 
          className="lp-modal-backdrop" 
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="lp-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <button 
              className="lp-modal-close" 
              onClick={closeModal}
              aria-label="Modal schließen"
            >
              <svg 
                aria-hidden="true" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="lp-modal-header">
              <h2 id="modal-title" className="lp-modal-title">{selectedApplication.title || selectedApplication.jobName || "Keine Position"}</h2>
              <p className="lp-modal-company">{selectedApplication.companyName || "Unbekanntes Unternehmen"}</p>
            </div>

              <div className="lp-modal-info-grid">
                <div className="lp-modal-info-item">
                  <div className="lp-modal-info-header">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="lp-modal-info-label">Adresse</span>
                  </div>
                  <span className="lp-modal-info-value">
                    {selectedApplication.street} {selectedApplication.houseNumber}
                  </span>
                </div>

                <div className="lp-modal-info-item">
                  <div className="lp-modal-info-header">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span className="lp-modal-info-label">PLZ / Ort</span>
                  </div>
                  <span className="lp-modal-info-value">
                    {selectedApplication.postalCode} {selectedApplication.city || "Unbekannt"}
                    {selectedApplication.distance !== undefined && selectedApplication.distance !== null && (
                      <span className="lp-distance-badge">({formatDistance(selectedApplication.distance)})</span>
                    )}
                  </span>
                </div>

                <div className="lp-modal-info-item">
                  <div className="lp-modal-info-header">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="lp-modal-info-label">Branche</span>
                  </div>
                  <span className="lp-modal-info-value">{selectedApplication.companySector || "Nicht angegeben"}</span>
                </div>

                <div className="lp-modal-info-item">
                  <div className="lp-modal-info-header">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="lp-modal-info-label">Application ID</span>
                  </div>
                  <span className="lp-modal-info-value lp-modal-id">{selectedApplication.applicationId || "N/A"}</span>
                </div>

                <div className="lp-modal-info-item">
                  <div className="lp-modal-info-header">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="lp-modal-info-label">Erstellt am</span>
                  </div>
                  <span className="lp-modal-info-value">
                    {selectedApplication.createdAt ? formatDate(selectedApplication.createdAt) : "Kein Datum"}
                  </span>
                </div>
              </div>

            {/* Mini-Map im Modal */}
            {selectedApplication.latitude && selectedApplication.longitude && (
              <div className="lp-modal-map-thumb" aria-label="Standort auf Karte">
                <MapContainer
                  key={`map-${viewMode}`}
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={mapZoom}
                  className="lp-leaflet-map"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[selectedApplication.latitude, selectedApplication.longitude]} />
                </MapContainer>
              </div>
            )}

            <div className="lp-modal-actions">
              <button 
                className={`lp-modal-action-btn lp-fav-btn ${isFavorited ? "active" : ""}`} 
                onClick={() => setIsFavorited(!isFavorited)}
                aria-pressed={isFavorited}
              >
                {isFavorited ? "Gemerkt" : "Merken"}
              </button>
              <button 
                className="lp-modal-action-btn lp-apply-btn" 
                onClick={() => { onNavigate?.("application", selectedApplication.applicationId); }}
              >
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
    </>
  );
}

export default Landingpage;