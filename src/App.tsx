import React from "react";
import MapComponent from "./MapComponent";
import DashboardCards from "./components/DashboardCards";

export default function App() {
  return (
    <div className="layout">
      <header className="header"><div className="logo">Drone Dashboard</div></header>
      <main className="content">
        <DashboardCards />
        <section className="panel">
          <MapComponent />
        </section>
      </main>
    </div>
  );
}
