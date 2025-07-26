import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import StatisticsSidebar from '../StatisticsSidebar';

const KyotoTownDashboard = ({ dashboardData }) => {
  const [selectedTown, setSelectedTown] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [stats, setStats] = useState(null);
  const mapRef = useRef(null);

  console.log(
    "KyotoTownDashboard render, dashboardData:",
    dashboardData ? "exists" : "null"
  );
  console.log(
    "Google Maps API Key:",
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? "設定済み" : "未設定"
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const allowedWards = ["中京区", "下京区", "上京区", "左京区", "右京区"];

  // 地図の設定をuseMemoで固定して再レンダリング時の初期化を防ぐ
  const mapContainerStyle = React.useMemo(
    () => ({
      width: "100%",
      height: "calc(100vh - 250px)",
      minHeight: "400px",
    }),
    []
  );

  const center = React.useMemo(
    () => ({
      lat: 35.0116,
      lng: 135.7681,
    }),
    []
  );

  const mapOptions = React.useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
    }),
    []
  );

  // 分析データの計算
  useEffect(() => {
    console.log("Stats useEffect triggered, dashboardData:", dashboardData);
    if (!dashboardData || !dashboardData.features) {
      console.log("No dashboardData for stats calculation");
      return;
    }

    const towns = dashboardData.features
      .filter(
        (f) =>
          allowedWards.includes(f.properties.CITY_NAME) &&
          f.properties.MOJI &&
          f.properties.JINKO !== null
      )
      .map((f) => ({
        MOJI: f.properties.MOJI,
        CITY_NAME: f.properties.CITY_NAME,
        AREA: f.properties.AREA,
        JINKO: Number(f.properties.JINKO),
        SETAI: Number(f.properties.SETAI),
      }));

    const totalPopulation = towns.reduce((s, t) => s + t.JINKO, 0);
    const totalTowns = towns.length;
    const sorted = [...towns].sort((a, b) => b.JINKO - a.JINKO);
    const ranking = {};
    sorted.forEach((t, i) => {
      ranking[t.MOJI] = i + 1;
    });

    setStats({
      totalPopulation,
      totalTowns,
      top5: sorted.slice(0, 5),
      ranking,
    });
  }, [dashboardData]);

  // 町選択ハンドラー（地図連携用）
  const handleTownSelect = (town) => {
    setSelectedTown(town);
    if (mapRef.current && town) {
      // 地図上で町を見つけてフォーカス
      const townFeature = findTownFeature(town.MOJI);
      if (townFeature) {
        focusOnTownFeature(townFeature);
      }
    }
  };

  // 地図上の町フィーチャーを検索
  const findTownFeature = (townName) => {
    let foundFeature = null;
    mapRef.current?.data.forEach((feature) => {
      if (feature.getProperty('MOJI') === townName) {
        foundFeature = feature;
      }
    });
    return foundFeature;
  };

  // 町フィーチャーにフォーカス
  const focusOnTownFeature = (feature) => {
    if (!mapRef.current || !window.google?.maps) return;
    
    try {
      // 既存のハイライトをクリア
      mapRef.current.data.revertStyle();
      
      // 新しいハイライト
      mapRef.current.data.overrideStyle(feature, {
        fillColor: "#FF6B35",
        fillOpacity: 0.6,
        strokeColor: "#FF6B35",
        strokeWeight: 3
      });
      
      // 地図を町の位置に移動
      const geometry = feature.getGeometry();
      if (geometry && geometry.getType() === 'Polygon') {
        const bounds = new window.google.maps.LatLngBounds();
        const coordinates = geometry.getAt(0);
        if (coordinates) {
          coordinates.forEach(coord => {
            if (coord && typeof coord.lat === 'function' && typeof coord.lng === 'function') {
              bounds.extend({ lat: coord.lat(), lng: coord.lng() });
            }
          });
          mapRef.current.fitBounds(bounds);
          // ズームレベルを適切に設定
          setTimeout(() => {
            if (mapRef.current) {
              const currentZoom = mapRef.current.getZoom();
              if (currentZoom > 16) {
                mapRef.current.setZoom(16);
              }
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('地図フォーカス処理でエラーが発生しました:', error);
    }
  };

  console.log("Render state - isLoaded:", isLoaded, "loadError:", loadError);

  if (loadError) {
    console.error("Map load error:", loadError);
    return <div>地図の読み込みに失敗しました: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>地図を読み込み中...</div>;
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: showAnalytics ? 
          (window.innerWidth < 768 ? "1fr" : "1fr 350px") : "1fr",
      }}
    >
      {/* 町名情報表示エリア */}
      <div
        style={{
          gridColumn: "1 / -1",
          gridRow: "1",
          padding: "16px",
          background: selectedTown
            ? "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
            : "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          borderBottom: "1px solid #ddd",
          borderLeft:
            selectedTown && stats
              ? `3px solid ${getRankColor(selectedTown, stats)}`
              : "none",
          minHeight: "100px",
          maxHeight: "130px",
          zIndex: 1
        }}
      >
        {selectedTown ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#333",
                    lineHeight: "1.2",
                  }}
                >
                  {selectedTown.MOJI}
                </h3>
                <p
                  style={{
                    margin: "0 0 12px 0",
                    color: "#8B5A3C",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {selectedTown.CITY_NAME}
                </p>
              </div>

              {stats && (
                <div
                  style={{
                    backgroundColor: getRankBgColor(selectedTown, stats),
                    padding: "8px 12px",
                    borderRadius: "20px",
                    textAlign: "center",
                    minWidth: "80px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: getRankColor(selectedTown, stats),
                    }}
                  >
                    #{stats.ranking[selectedTown.MOJI]}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      marginTop: "2px",
                    }}
                  >
                    {stats.totalTowns}町中
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <StatCard
                icon="👥"
                label="人口"
                value={selectedTown.JINKO.toLocaleString() + "人"}
              />
              <StatCard
                icon="🏠"
                label="世帯数"
                value={selectedTown.SETAI.toLocaleString()}
              />
              <StatCard
                icon="📐"
                label="面積"
                value={selectedTown.AREA.toLocaleString() + " m²"}
              />
              <StatCard
                icon="📊"
                label="人口密度"
                value={
                  Math.round(
                    selectedTown.JINKO / (selectedTown.AREA / 1000000)
                  ).toLocaleString() + "/km²"
                }
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "24px",
                marginBottom: "8px",
                color: "#8B5A3C",
              }}
            >
              🗾
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                color: "#8B5A3C",
                marginBottom: "4px",
              }}
            >
              町を探索してください
            </h3>
            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "12px",
              }}
            >
              地図上の町エリアにマウスを乗せると詳細情報が表示されます
            </p>
          </div>
        )}
      </div>

      {/* 分析ボタン */}
      {!showAnalytics && (
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          style={{
            position: "absolute",
            top: window.innerWidth < 768 ? "150px" : "140px",
            right: window.innerWidth < 768 ? "16px" : "20px",
            zIndex: 5,
            backgroundColor: "#8B5A3C",
            color: "white",
            border: "none",
            padding: window.innerWidth < 768 ? "8px 12px" : "10px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: window.innerWidth < 768 ? "12px" : "13px",
            fontWeight: "500",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span style={{ fontSize: window.innerWidth < 768 ? "12px" : "14px" }}>
            📈
          </span>
          {window.innerWidth < 768 ? "分析" : "分析を見る"}
        </button>
      )}

      {/* 統計サイドバー */}
      {showAnalytics && stats && (
        <div style={{
          gridColumn: window.innerWidth < 768 ? "1 / -1" : "2",
          gridRow: window.innerWidth < 768 ? "1 / -1" : "1 / -1",
          position: window.innerWidth < 768 ? "absolute" : "relative",
          top: window.innerWidth < 768 ? "0" : "auto",
          left: window.innerWidth < 768 ? "0" : "auto",
          width: window.innerWidth < 768 ? "100%" : "auto",
          height: window.innerWidth < 768 ? "100%" : "auto",
          zIndex: 10
        }}>
          <StatisticsSidebar 
            townData={dashboardData}
            onTownSelect={handleTownSelect}
            selectedTown={selectedTown}
            onClose={() => setShowAnalytics(false)}
          />
        </div>
      )}

      {/* 地図エリア */}
      <div style={{ 
        gridColumn: showAnalytics ? "1" : "1 / -1",
        gridRow: "2",
        position: "relative",
        overflow: "hidden"
      }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={(map) => {
            console.log("Map loaded");
            mapRef.current = map;

            // 直接GeoJSONファイルをロード（dashboardDataに依存しない）
            const geoJsonUrl = `${process.env.PUBLIC_URL}/district/meshData_wgs84.geojson`;
            console.log("Loading GeoJSON from:", geoJsonUrl);

            map.data.loadGeoJson(geoJsonUrl, {}, (features) => {
              console.log(
                `読み込まれた地図データ: ${features.length} features`
              );
              if (features.length === 0) {
                console.warn("GeoJSONデータが空です");
                return;
              }

              const featuresToRemove = [];
              map.data.forEach((feature) => {
                const city = feature.getProperty("CITY_NAME");
                if (!allowedWards.includes(city)) {
                  featuresToRemove.push(feature);
                }
              });
              console.log("Removing features:", featuresToRemove.length);
              featuresToRemove.forEach((f) => map.data.remove(f));

              map.data.setStyle({
                fillColor: "#AEDFF7",
                fillOpacity: 0.2,
                strokeColor: "#0088E8",
                strokeWeight: 1,
              });

              console.log("Setting up event listeners");

              // ホバー効果を追加
              map.data.addListener("mouseover", (event) => {
                console.log("Mouseover event triggered");
                map.data.overrideStyle(event.feature, {
                  fillColor: "#ff0000",
                  fillOpacity: 0.4,
                });

                const moji = event.feature.getProperty("MOJI");
                const cityName = event.feature.getProperty("CITY_NAME");
                const area = event.feature.getProperty("AREA");
                const jinko = event.feature.getProperty("JINKO");
                const setai = event.feature.getProperty("SETAI");

                console.log("Feature properties:", {
                  moji,
                  cityName,
                  area,
                  jinko,
                  setai,
                });

                if (moji) {
                  setSelectedTown({
                    MOJI: moji,
                    CITY_NAME: cityName,
                    AREA: Number(area),
                    SETAI: Number(setai),
                    JINKO: Number(jinko),
                  });
                }
              });

              map.data.addListener("mouseout", (event) => {
                console.log("Mouseout event triggered");
                map.data.revertStyle(event.feature);
              });

              console.log("Event listeners set up complete");
            });
          }}
        />
      </div>
    </div>
  );
};

// 補助関数とコンポーネント
const getRankColor = (selectedTown, stats) => {
  const populationRank = stats?.ranking[selectedTown.MOJI] || 0;
  const totalTowns = stats?.totalTowns || 0;
  const rankPercentile = ((totalTowns - populationRank + 1) / totalTowns) * 100;

  return rankPercentile > 80
    ? "#FF6B35"
    : rankPercentile > 50
    ? "#2E7D32"
    : "#8B5A3C";
};

const getRankBgColor = (selectedTown, stats) => {
  const populationRank = stats?.ranking[selectedTown.MOJI] || 0;
  const totalTowns = stats?.totalTowns || 0;
  const rankPercentile = ((totalTowns - populationRank + 1) / totalTowns) * 100;

  return rankPercentile > 80
    ? "#FFF3E0"
    : rankPercentile > 50
    ? "#E8F5E8"
    : "#F3F2F1";
};

const StatCard = ({ icon, label, value }) => (
  <div
    style={{
      backgroundColor: "white",
      padding: "6px",
      borderRadius: "4px",
      border: "1px solid #e9ecef",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "10px", marginBottom: "1px" }}>{icon}</div>
    <div style={{ fontSize: "8px", color: "#666", marginBottom: "1px" }}>
      {label}
    </div>
    <div style={{ fontSize: "9px", fontWeight: "bold", color: "#333" }}>
      {value}
    </div>
  </div>
);

export default KyotoTownDashboard;
