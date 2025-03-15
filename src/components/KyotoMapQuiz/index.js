import React, { useState, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import "./KyotoMapQuiz.css";
const mapContainerStyle = { width: "100%", height: "550px" };

function KyotoMapQuiz() {
  // Google Maps APIのロード状態
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const [hoveredTown, setHoveredTown] = useState(null);

  // 参照
  const mapRef = useRef(null);
  const dataLayerRef = useRef(null);

  // ジオメトリ内の全ての座標点をboundsに追加する再帰関数
  const processPoints = (geometry, callback, thisArg) => {
    if (geometry.getType() === "Point") {
      callback.call(thisArg, geometry.get());
    } else if (
      geometry.getType() === "MultiPoint" ||
      geometry.getType() === "LineString" ||
      geometry.getType() === "LinearRing"
    ) {
      geometry.getArray().forEach(callback, thisArg);
    } else if (
      geometry.getType() === "MultiLineString" ||
      geometry.getType() === "MultiPolygon"
    ) {
      geometry.getArray().forEach((g) => processPoints(g, callback, thisArg));
    } else if (geometry.getType() === "Polygon") {
      geometry.getArray().forEach((g) => processPoints(g, callback, thisArg));
    }
  };

  if (!isLoaded)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>地図を読み込み中...</p>
      </div>
    );
  const center = { lat: 34.9858, lng: 135.7588 }; // 京都駅付近
  const defaultZoom = 15; // より詳細なズームレベル
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
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          // center={center}
          zoom={defaultZoom}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
            // geometryライブラリを追加
            libraries: ["geometry"],
          }}
          onLoad={(map) => {
            mapRef.current = map;
            map.data.loadGeoJson(
              "./district/meshData_wgs84.geojson",
              null,
              (features) => {
                console.log(
                  "GeoJSON loaded. Number of features:",
                  features.length
                );
                // フィルタ: 指定された京都市の各区のみを残す
                const allowedWards = [
                  "中京区",
                  "下京区",
                  "上京区",
                  "左京区",
                  "右京区",
                ];
                const featuresToRemove = [];
                map.data.forEach((feature) => {
                  const cityName = feature.getProperty("CITY_NAME");
                  if (!allowedWards.includes(cityName)) {
                    featuresToRemove.push(feature);
                  }
                });
                featuresToRemove.forEach((feature) => {
                  map.data.remove(feature);
                });
                console.log(
                  "After filtering, number of features:",
                  features.length
                );

                // 全ての町名を収集
                const mojiNames = [];
                const featuresObject = {};

                map.data.forEach((feature) => {
                  const moji = feature.getProperty("MOJI");
                  if (moji) {
                    mojiNames.push(moji);
                    featuresObject[
                      feature.getId() || Math.random().toString(36).substr(2, 9)
                    ] = feature;
                  }
                });

                dataLayerRef.current = map.data;

                // 読み込んだフィーチャーに合わせて地図の表示範囲を調整する
                const bounds = new window.google.maps.LatLngBounds();
                map.data.forEach((feature) => {
                  processPoints(feature.getGeometry(), bounds.extend, bounds);
                });
                map.fitBounds(bounds);
                map.setZoom(defaultZoom);

                // スタイルの設定
                map.data.setStyle({
                  fillColor: "#AEDFF7",
                  fillOpacity: 0.1,
                  strokeColor: "#0088E8",
                  strokeWeight: 1,
                  visible: true,
                });

                // マウスオーバー時のスタイル変更
                map.data.addListener("mouseover", (event) => {
                  const townName = event.feature.getProperty("MOJI");
                  const area = event.feature.getProperty("AREA");
                  const setai = event.feature.getProperty("SETAI");
                  const jinko = event.feature.getProperty("JINKO");

                  // ホバー情報を更新
                  setHoveredTown({
                    name: townName,
                    area: area,
                    setai: setai,
                    jinko: jinko,
                  });

                  // ハイライト
                  map.data.overrideStyle(event.feature, {
                    fillColor: "#FF0000",
                    fillOpacity: 0.5,
                    strokeColor: "#FF0000",
                    strokeWeight: 2,
                  });
                });

                map.data.addListener("mouseout", (event) => {
                  // スタイルを元に戻す
                  map.data.revertStyle(event.feature);
                  // マウスが離れたらhoverInfoを空にする
                  setHoveredTown(null);
                });
              }
            );
          }}
        />
      </div>
    </div>
  );
}

export default KyotoMapQuiz;
