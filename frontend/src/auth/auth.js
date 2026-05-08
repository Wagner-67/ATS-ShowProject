const BASE_URL = "";

export async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/api/token/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem("token", data.token);
    return true;
  }
  return false;
}

export async function login(username, password) {
  const res = await fetch(`/api/login_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const text = await res.text();
  console.log("RESPONSE:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (res.ok && data?.token) {
    localStorage.setItem("token", data.token);
    return true;
  }
  return false;
}

export async function logout() {
  try {
    const token = localStorage.getItem("token");
    
    const response = await fetch("/api/token/invalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      credentials: "include"
    });

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    
    if (!response.ok) {
      console.warn("Token invalidation failed but local data cleared");
    }
    
    return true;
  } catch (err) {
    console.error("Logout error:", err);

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    return false;
  }
}

export async function register(email, password, confirmPassword, type) {
  const res = await fetch(`${BASE_URL}/api/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, confirmPassword, type }),
  });

  const data = await res.json().catch(() => null);

  console.log(res.status, data);

  if (!res.ok) return false;

  if (data?.error || data?.errors) return false;

  return true;
}
