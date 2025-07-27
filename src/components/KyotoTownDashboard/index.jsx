import React, { useState, useEffect, useRef } from "react";
import Map, { Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import StatisticsSidebar from '../StatisticsSidebar';

const KyotoTownDashboard = ({ dashboardData }) => {
  const [selectedTown, setSelectedTown] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [stats, setStats] = useState(null);
  const mapRef = useRef(null);

  console.log("🔄 KyotoTownDashboard component loaded - NEW VERSION");
  console.log(
    "KyotoTownDashboard render, dashboardData:",
    dashboardData ? "exists" : "null"
  );
  console.log(
    "Mapbox API Key:",
    process.env.REACT_APP_MAPBOX_ACCESS_TOKEN ? "設定済み" : "未設定"
  );

  const [geoJsonData, setGeoJsonData] = useState(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 135.7681,
    latitude: 35.0116,
    zoom: 11
  });

  const allowedWards = React.useMemo(() => ["中京区", "下京区", "上京区", "左京区", "右京区", "伏見区", "北区", "山科区", "西京区", "東山区", "南区"], []);

  // 地図の設定をuseMemoで固定して再レンダリング時の初期化を防ぐ
  const mapContainerStyle = React.useMemo(
    () => ({
      width: "100%",
      height: "calc(100vh - 250px)",
      minHeight: "400px",
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
  }, [dashboardData, allowedWards]);

  // 町選択ハンドラー（地図連携用）
  const handleTownSelect = (town) => {
    setSelectedTown(town);
    // Mapboxでのフォーカス処理はシンプルにする
  };

  // App.tsxから渡されるdashboardDataを使用
  useEffect(() => {
    if (!dashboardData) {
      console.log('⏳ Waiting for dashboardData from App.tsx...');
      return;
    }
    
    console.log('✅ Dashboard - Using dashboardData from App.tsx');
    console.log('📊 Features count:', dashboardData.features?.length || 0);
    console.log('🔍 Sample feature:', dashboardData.features?.[0]?.properties);
    
    // フィルタリングでKyoto区データを取得
    const filteredFeatures = dashboardData.features.filter(
      (f) => allowedWards.includes(f.properties.CITY_NAME)
    );
    console.log('🎯 Filtered Kyoto ward features count:', filteredFeatures.length);
    console.log('🏛️ Allowed wards:', allowedWards);
    
    // 実際にどの区が見つかっているかチェック
    const foundWards = Array.from(new Set(dashboardData.features.map(f => f.properties.CITY_NAME)));
    console.log('🗾 All wards in data:', foundWards);
    const foundKyotoWards = foundWards.filter(ward => allowedWards.includes(ward));
    console.log('✅ Found Kyoto wards:', foundKyotoWards);
    
    // フィルタリングされた京都区データを設定
    if (filteredFeatures.length > 0) {
      console.log('🏙️ Setting filtered Kyoto ward data...');
      // feature idを追加してホバー機能を有効化
      const featuresWithId = filteredFeatures.map((feature, index) => ({
        ...feature,
        id: index
      }));
      const kyotoData = {
        type: 'FeatureCollection',
        features: featuresWithId
      };
      setGeoJsonData(kyotoData);
      console.log('📋 Kyoto GeoJSON data set with', filteredFeatures.length, 'features');
    } else {
      console.warn('⚠️ No Kyoto ward features found, using test data');
      const featuresWithId = dashboardData.features.slice(0, 100).map((feature, index) => ({
        ...feature,
        id: index
      }));
      const testData = {
        type: 'FeatureCollection',
        features: featuresWithId
      };
      setGeoJsonData(testData);
    }
  }, [dashboardData, allowedWards]);

  if (!process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) {
    return <div>Mapbox APIキーが設定されていません</div>;
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

        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={mapContainerStyle}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          transformRequest={(url, resourceType) => {
            if (resourceType === 'Style' && url.includes('mapbox://styles')) {
              return {
                url: url + '?language=ja'
              };
            }
          }}
          locale={{
            'NavigationControl.ZoomIn': 'ズームイン',
            'NavigationControl.ZoomOut': 'ズームアウト',
            'NavigationControl.Compass': 'コンパス'
          }}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
          onMouseMove={(event) => {
            if (event.features && event.features.length > 0) {
              const feature = event.features[0];
              const props = feature.properties;
              
              console.log('🖱️ Mouse over feature:', feature.id, props?.CITY_NAME);
              
              // ホバーエフェクト
              if (hoveredFeatureId !== null && hoveredFeatureId !== feature.id) {
                console.log('🔄 Removing hover from:', hoveredFeatureId);
                mapRef.current?.getMap().setFeatureState(
                  { source: 'kyoto-districts-source', id: hoveredFeatureId },
                  { hover: false }
                );
              }
              
              if (feature.id !== hoveredFeatureId) {
                console.log('✨ Setting hover on:', feature.id);
                setHoveredFeatureId(feature.id);
                mapRef.current?.getMap().setFeatureState(
                  { source: 'kyoto-districts-source', id: feature.id },
                  { hover: true }
                );
              }

              if (props?.MOJI) {
                setSelectedTown({
                  MOJI: props.MOJI,
                  CITY_NAME: props.CITY_NAME,
                  AREA: Number(props.AREA),
                  SETAI: Number(props.SETAI),
                  JINKO: Number(props.JINKO),
                });
              }
            } else {
              // マウスがフィーチャーから離れた場合
              if (hoveredFeatureId !== null) {
                console.log('🔄 Mouse left, removing hover from:', hoveredFeatureId);
                mapRef.current?.getMap().setFeatureState(
                  { source: 'kyoto-districts-source', id: hoveredFeatureId },
                  { hover: false }
                );
                setHoveredFeatureId(null);
              }
            }
          }}
          interactiveLayerIds={['kyoto-districts', 'kyoto-districts-hover']}
        >

          {geoJsonData && (
            <Source 
              id="kyoto-districts-source" 
              type="geojson" 
              data={geoJsonData}
              promoteId="id"
            >
              <Layer
                id="kyoto-districts"
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['has', 'JINKO'],
                    [
                      'interpolate',
                      ['linear'],
                      ['to-number', ['get', 'JINKO']],
                      0, '#E1F5FE',     // 薄い青
                      100, '#B3E5FC',   // 明るい青
                      500, '#81D4FA',   // 青
                      1000, '#4FC3F7',  // 中間の青
                      2000, '#29B6F6',  // 濃い青
                      5000, '#2196F3',  // 深い青
                      10000, '#1976D2', // とても濃い青
                      20000, '#0D47A1'  // 最も濃い青
                    ],
                    '#E0E0E0'  // JINKOがない場合のデフォルト色（薄いグレー）
                  ],
                  'fill-opacity': 0.1  // 極限まで薄く
                }}
              />
              {/* ホバー時の強調レイヤー（統一された目立つ赤色） */}
              <Layer
                id="kyoto-districts-hover"
                type="fill"
                paint={{
                  'fill-color': '#FF4444',  // 統一された目立つ赤色
                  'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.8,  // ホバー時は濃く
                    0     // 通常時は透明
                  ]
                }}
              />
              <Layer
                id="kyoto-districts-border"
                type="line"
                paint={{
                  'line-color': '#37474F',
                  'line-width': 1.5,    // 枠線を太く
                  'line-opacity': 0.6   // 枠線を少し濃く
                }}
              />
            </Source>
          )}
        </Map>
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
