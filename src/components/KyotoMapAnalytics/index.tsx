import React, { useState, useEffect, useRef } from "react";
import Map, { Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./KyotoMapAnalytics.css";

interface TownInfo {
  MOJI: string;
  CITY_NAME: string;
  AREA: number;
  JINKO: number;
  SETAI: number;
  rank?: number;
}

interface Stats {
  totalPopulation: number;
  totalTowns: number;
  top5: TownInfo[];
  ranking: Record<string, number>;
}

const mapContainerStyle = { width: "100%", height: "550px" };

const initialViewState = {
  longitude: 135.7681,
  latitude: 35.0116,
  zoom: 11
};

const allowedWards = ["中京区", "下京区", "上京区", "左京区", "右京区", "伏見区", "北区", "山科区", "西京区", "東山区", "南区"];

const KyotoMapAnalytics: React.FC = () => {
  console.log("🔄 KyotoMapAnalytics component loaded - NEW VERSION");
  console.log("Mapbox API Key:", process.env.REACT_APP_MAPBOX_ACCESS_TOKEN ? "設定済み" : "未設定");

  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedTown, setSelectedTown] = useState<TownInfo | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [viewState, setViewState] = useState(initialViewState);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    console.log('Fetching GeoJSON data...');
    fetch("/district/meshData_wgs84.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('GeoJSON data loaded:', data);
        console.log('Original features count:', data.features.length);
        console.log('Sample feature properties:', data.features[0]?.properties);
        
        // 全区の特徴を確認
        const cityNames = data.features.map((f: any) => f.properties.CITY_NAME);
        const uniqueCities = Array.from(new Set(cityNames));
        console.log('All unique cities in data:', uniqueCities);
        
        const filteredFeatures = data.features.filter(
          (f: any) => {
            const hasValidCity = allowedWards.includes(f.properties.CITY_NAME);
            if (hasValidCity) {
              console.log('Valid ward found:', f.properties.CITY_NAME, 'MOJI:', f.properties.MOJI, 'JINKO:', f.properties.JINKO);
            }
            return hasValidCity;
          }
        );
        
        // テスト用：フィルタリングされた特徴がない場合、最初の100個を表示
        if (filteredFeatures.length === 0) {
          console.warn('No filtered features found! Using first 100 features for testing...');
          const testFeatures = data.features.slice(0, 100);
          setGeoJsonData({
            type: "FeatureCollection",
            features: testFeatures
          });
          return;
        }
        
        console.log('Filtered features count:', filteredFeatures.length);
        console.log('First 5 filtered features:', filteredFeatures.slice(0, 5).map((f: any) => f.properties));
        
        // すべてのフィルタされた特徴を表示に含める
        const geoJson = {
          type: "FeatureCollection",
          features: filteredFeatures
        };
        console.log('Final GeoJSON for map:', geoJson);
        setGeoJsonData(geoJson);
        
        // 統計用の町データ（MOJIとJINKOがあるもののみ）
        const towns: TownInfo[] = filteredFeatures
          .filter((f: any) => f.properties.MOJI && f.properties.JINKO !== null)
          .map((f: any) => ({
            MOJI: f.properties.MOJI,
            CITY_NAME: f.properties.CITY_NAME,
            AREA: f.properties.AREA,
            JINKO: Number(f.properties.JINKO),
            SETAI: Number(f.properties.SETAI),
          }));

        console.log('Towns for stats:', towns.length);

        const totalPopulation = towns.reduce((s, t) => s + t.JINKO, 0);
        const totalTowns = towns.length;
        const sorted = [...towns].sort((a, b) => b.JINKO - a.JINKO);
        const ranking: Record<string, number> = {};
        sorted.forEach((t, i) => {
          ranking[t.MOJI] = i + 1;
        });

        setStats({
          totalPopulation,
          totalTowns,
          top5: sorted.slice(0, 5),
          ranking,
        });
      })
      .catch((error) => {
        console.error("GeoJSONデータの読み込みに失敗しました:", error);
        console.error('Error details:', error.message);
      });
  }, []);

  if (!process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) {
    return <div>Mapbox APIキーが設定されていません</div>;
  }

  return (
    <div className="analytics-container">
      <div className="sidebar">
        {selectedTown ? (
          <div className="town-details">
            <h3>{selectedTown.MOJI}</h3>
            <p>{selectedTown.CITY_NAME}</p>
            <p>人口: {selectedTown.JINKO}</p>
            {stats && (
              <p>
                人口順位: {stats.ranking[selectedTown.MOJI]} / {stats.totalTowns}
              </p>
            )}
            <p>世帯数: {selectedTown.SETAI}</p>
            <p>面積: {selectedTown.AREA} m²</p>
          </div>
        ) : (
          <p>地図で町をクリックしてください</p>
        )}
        {stats && (
          <div className="overall">
            <h3>全体統計</h3>
            <p>町数: {stats.totalTowns}</p>
            <p>総人口: {stats.totalPopulation}</p>
            <h4>人口上位5町</h4>
            <ol>
              {stats.top5.map((t) => (
                <li key={t.MOJI}>
                  {t.MOJI} ({t.JINKO})
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <div className="map-area">
        <div style={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px' }}>
          <p>Mapbox Test Status:</p>
          <p>API Key: {process.env.REACT_APP_MAPBOX_ACCESS_TOKEN ? '✅ 設定済み' : '❌ 未設定'}</p>
          <p>Map Loading Status: <span id="map-status">待機中...</span></p>
        </div>
        
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={mapContainerStyle}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
          onLoad={() => {
            console.log('✅ Map loaded successfully!');
            const statusEl = document.getElementById('map-status');
            if (statusEl) statusEl.textContent = '✅ マップ読み込み完了';
          }}
          onError={(error) => {
            console.error('❌ Map loading error:', error);
            const statusEl = document.getElementById('map-status');
            if (statusEl) statusEl.textContent = `❌ エラー: ${error.error || 'Unknown error'}`;
          }}
        >
          {/* 最もシンプルなテストレイヤー */}
          <Source
            id="simple-test"
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [135.7681, 35.0116]
              }
            }}
          >
            <Layer
              id="simple-circle"
              type="circle"
              paint={{
                'circle-radius': 30,
                'circle-color': '#FF0000'
              }}
            />
          </Source>
        </Map>
      </div>
    </div>
  );
};

export default KyotoMapAnalytics;
