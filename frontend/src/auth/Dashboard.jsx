import { useState } from "react";
import { logout } from "./auth";
import "./Dashboard.css";

function Dashboard({ onLogout }) {

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <h1>Dashboard 🔥</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Dashboard;