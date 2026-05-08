import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { refreshAccessToken, logout } from "./auth/auth"; // logout importieren
import AuthPage from "./auth/AuthPage";
import Landingpage from "./Landingpage";
import ProfilePage from "./ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authTab, setAuthTab] = useState("login");
  const navigate = useNavigate();

  useEffect(() => {
    async function restoreSession() {
      const success = await refreshAccessToken();
      setIsLoggedIn(success);
      setLoading(false);
    }
    restoreSession();
  }, []);

  const handleLogout = async () => {
    await logout(); // Backend-Logout mit Cookie-Löschung
    setIsLoggedIn(false);
    navigate("/");
  };

  if (loading) return <div className="loading-screen">Laden...</div>;

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Landingpage
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            onNavigate={(page) => {
              if (page === "profile") {
                navigate("/profile");
              } else if (page === "login") {
                setAuthTab("login");
                navigate("/auth");
              } else if (page === "register") {
                setAuthTab("register");
                navigate("/auth");
              }
            }}
            onGetStarted={() => {
              setAuthTab("login");
              navigate("/auth");
            }}
          />
        } 
      />

      <Route 
        path="/auth" 
        element={
          !isLoggedIn ? (
            <AuthPage 
              initialTab={authTab}
              onLogin={() => {
                setIsLoggedIn(true);
                navigate("/");
              }}
              onBack={() => navigate("/")}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <ProfilePage onBack={() => navigate("/")} />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;