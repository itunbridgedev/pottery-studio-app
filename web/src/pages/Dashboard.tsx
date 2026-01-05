import React from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Pottery Studio Dashboard</h1>
        <div className="user-info">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="user-avatar"
            />
          )}
          <div className="user-details">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome back, {user.name.split(" ")[0]}!</h2>
          <p>You're successfully authenticated with Google OAuth.</p>
          {user.roles.length > 0 && (
            <div className="roles">
              <strong>Roles:</strong> {user.roles.join(", ")}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
