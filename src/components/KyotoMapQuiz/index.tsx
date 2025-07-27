import React, { useState, useRef, useEffect } from "react";
import Map, { Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./KyotoMapQuiz.css";
const mapContainerStyle = { width: "100%", height: "550px" };

const initialViewState = {
  longitude: 135.7588,
  latitude: 34.9858,
  zoom: 15
};

function KyotoMapQuiz() {

  const [hoveredTown, setHoveredTown] = useState<any>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [viewState, setViewState] = useState(initialViewState);

  // 参照
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetch("/district/meshData_wgs84.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const allowedWards = [
          "中京区", "下京区", "上京区", "左京区", "右京区",
          "伏見区", "北区", "山科区", "西京区", "東山区", "南区"
        ];
        
        console.log('Quiz - Original features count:', data.features.length);
        
        const filteredFeatures = data.features.filter(
          (f: any) => allowedWards.includes(f.properties.CITY_NAME)
        );
        
        console.log('Quiz - Filtered features count:', filteredFeatures.length);

        setGeoJsonData({
          type: "FeatureCollection",
          features: filteredFeatures
        });
      })
      .catch((error) => {
        console.error("GeoJSONデータの読み込みに失敗しました:", error);
      });
  }, []);

  if (!process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="loading-container">
        <p>Mapbox APIキーが設定されていません</p>
      </div>
    );
  }
  return (
    <div className="kyoto-map-quiz">
      <header className="quiz-header">
        <h1>京都町名当てクイズ</h1>
      </header>

      {/* ホバー情報表示エリア */}
      <div className="hover-info-panel">
        {hoveredTown ? (
          <div className="town-info">
            <h3 className="town-name">{hoveredTown.name}</h3>
            <div className="town-details">
              <p>
                <strong> 面積:</strong> {hoveredTown.area} m²
                <strong> 人口:</strong> {hoveredTown.jinko} 人
                <strong> 世帯:</strong>
                {hoveredTown.setai} 世帯
              </p>
            </div>
          </div>
        ) : (
          <p className="hover-instructions">
            地図上の地域にマウスを乗せると情報が表示されます
          </p>
        )}
      </div>

      <div className="map-container">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={mapContainerStyle}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
          onMouseMove={(event) => {
            if (event.features && event.features.length > 0) {
              const feature = event.features[0];
              const props = feature.properties;
              if (props?.MOJI) {
                setHoveredTown({
                  name: props.MOJI,
                  area: props.AREA,
                  setai: props.SETAI,
                  jinko: props.JINKO,
                });
              }
            } else {
              setHoveredTown(null);
            }
          }}
          interactiveLayerIds={['kyoto-districts']}
        >
          {geoJsonData && (
            <Source id="kyoto-districts-source" type="geojson" data={geoJsonData}>
              <Layer
                id="kyoto-districts"
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['!=', ['get', 'MOJI'], null],
                    [
                      'interpolate',
                      ['linear'],
                      ['get', 'JINKO'],
                      0, '#FFF9C4',
                      1000, '#FFEB3B', 
                      5000, '#FF9800',
                      10000, '#FF5722',
                      20000, '#D32F2F'
                    ],
                    'rgba(0,0,0,0)'
                  ],
                  'fill-opacity': 0.6
                }}
              />
              <Layer
                id="kyoto-districts-border"
                type="line"
                paint={{
                  'line-color': '#1976D2',
                  'line-width': 1
                }}
              />
            </Source>
          )}
        </Map>
      </div>
    </div>
  );
}

export default KyotoMapQuiz;
