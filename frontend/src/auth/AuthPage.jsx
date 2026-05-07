import { useState } from "react";
import { login, register } from "./auth";

function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const success = await login(username, password);
    if (success) {
      onLogin();
    } else {
      setError("Login fehlgeschlagen.");
    }
  };

  const handleRegister = async () => {
    const success = await register(username, password, confirmPassword);
    if (success) {
      onLogin();
    } else {
      setError("Registrierung fehlgeschlagen.");
    }
  };

  if (isRegister) {
    return (
      <div>
        <h2>Registrieren</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <input
          placeholder="Email"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Passwort"
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Passwort bestätigen"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleRegister}>Registrieren</button>
        <button onClick={() => setIsRegister(false)}>Zurück zum Login</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        placeholder="Email"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <button onClick={() => setIsRegister(true)}>Registrieren</button>
    </div>
  );
}

export default AuthPage;