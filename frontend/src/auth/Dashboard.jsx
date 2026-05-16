import { useState } from "react";
import { Helmet } from 'react-helmet-async';
import { logout } from "./auth";
import "./Dashboard.css";

function Dashboard({ onLogout }) {

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - ATS</title>
        <meta name="description" content="Übersicht deiner Aktivitäten bei ATS. Verwalte Bewerbungen, Stellenangebote und bleibe auf dem Laufenden." />
      </Helmet>
      <div className="dashboard-container">
        <div className="main-content">
          <h1>Dashboard</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
}

export default Dashboard;