import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WelcomeModal from './components/WelcomeModal';
import KyotoTownDashboard from './components/KyotoTownDashboard';
import './App.css';

const App: React.FC = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // 初回訪問判定
  useEffect(() => {
    const hasVisited = localStorage.getItem('kyoto-map-visited');
    if (!hasVisited) {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    localStorage.setItem('kyoto-map-visited', 'true');
    setShowWelcome(false);
  };

  useEffect(() => {
    console.log("Starting to fetch GeoJSON data...");
    fetch(`${process.env.PUBLIC_URL}/district/meshData_wgs84.geojson`)
      .then((res) => {
        console.log("Fetch response:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("GeoJSON data loaded:", data);
        console.log("Number of features:", data?.features?.length);
        setDashboardData(data);
      })
      .catch((error) => {
        console.error("GeoJSONデータの読み込みに失敗しました:", error);
      });
  }, []);

  // bodyのスタイルを設定してスクロールを防ぐ
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="App" style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <KyotoTownDashboard dashboardData={dashboardData} />
      </div>
      {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
    </div>
  );
};

export default App;