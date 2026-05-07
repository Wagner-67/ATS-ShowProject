import { useState } from "react";
import { logout } from "./auth";
import "./Dashboard.css";

function Dashboard({ onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Dropdown Menü - links, mit Bild in der Ecke */}
      <div className={`menu ${isMenuOpen ? "open" : "closed"}`}>
        <button className="menu-toggle" onClick={toggleMenu}>
          ☰
        </button>
        
        {/* Menü Inhalt */}
        {isMenuOpen && (
          <div className="menu-content">
            <h3>Menü</h3>
            <ul>
              <li>Start</li>
              <li>Profil</li>
              <li>Einstellungen</li>
              <li onClick={handleLogout} style={{ cursor: "pointer" }}>
                Logout
              </li>
            </ul>
          </div>
        )}
        
        {/* Bild in der unteren linken Ecke des Menüs - IMMER sichtbar */}
        <img 
          src="https://www.w3schools.com/images/w3schools_logo_436_2.png"
          alt="Logo"
          className="menu-corner-image"
        />
      </div>

      {/* Hauptinhalt */}
      <div className="main-content">
        <h1>Dashboard 🔥</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Dashboard;