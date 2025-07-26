import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
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

const allowedWards = ["中京区", "下京区", "上京区", "左京区", "右京区"];

const KyotoMapAnalytics: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedTown, setSelectedTown] = useState<TownInfo | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetch("./district/meshData_wgs84.geojson")
      .then((res) => res.json())
      .then((data) => {
        const towns: TownInfo[] = data.features
          .filter(
            (f: any) =>
              allowedWards.includes(f.properties.CITY_NAME) &&
              f.properties.MOJI &&
              f.properties.JINKO !== null
          )
          .map((f: any) => ({
            MOJI: f.properties.MOJI,
            CITY_NAME: f.properties.CITY_NAME,
            AREA: f.properties.AREA,
            JINKO: Number(f.properties.JINKO),
            SETAI: Number(f.properties.SETAI),
          }));

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
      });
  }, []);

  if (!isLoaded) {
    return <div>Loading...</div>;
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
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          onLoad={(map) => {
            mapRef.current = map;
            map.data.loadGeoJson(
              "./district/meshData_wgs84.geojson",
              null,
              () => {
                const featuresToRemove: any[] = [];
                map.data.forEach((feature) => {
                  const city = feature.getProperty("CITY_NAME") as string;
                  if (!allowedWards.includes(city)) {
                    featuresToRemove.push(feature);
                  }
                });
                featuresToRemove.forEach((f) => map.data.remove(f));

                map.data.setStyle({
                  fillColor: "#AEDFF7",
                  fillOpacity: 0.2,
                  strokeColor: "#0088E8",
                  strokeWeight: 1,
                });

                map.data.addListener("click", (event: any) => {
                  const moji = event.feature.getProperty("MOJI");
                  const area = event.feature.getProperty("AREA");
                  const setai = event.feature.getProperty("SETAI");
                  const jinko = event.feature.getProperty("JINKO");
                  const city = event.feature.getProperty("CITY_NAME") as string;
                  if (moji) {
                    setSelectedTown({
                      MOJI: moji,
                      CITY_NAME: city,
                      AREA: Number(area),
                      SETAI: Number(setai),
                      JINKO: Number(jinko),
                    });
                  }
                });
              }
            );
          }}
        />
      </div>
    </div>
  );
};

export default KyotoMapAnalytics;
