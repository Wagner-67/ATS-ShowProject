import { useState, useEffect } from "react";
import { refreshAccessToken } from "./auth/auth";
import AuthPage from "./auth/AuthPage";
import Dashboard from "./auth/Dashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const success = await refreshAccessToken();
      setIsLoggedIn(success);
      setLoading(false);
    }
    restoreSession();
  }, []);

  if (loading) return <div>Laden...</div>;

  return isLoggedIn
    ? <Dashboard onLogout={() => setIsLoggedIn(false)} />
    : <AuthPage onLogin={() => setIsLoggedIn(true)} />;
}

export default App;