// src/MapComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const ENV_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN ?? "";
const USER_TOKEN =
  "pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ";
mapboxgl.accessToken = ENV_TOKEN || USER_TOKEN;

export default function MapComponent() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ สร้างแผนที่ “ครั้งเดียว” (กัน StrictMode/re-render)
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // มีแล้ว ไม่สร้างซ้ำ

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [100.523186, 13.736717],
      zoom: 14.5,
      pitch: 60,
      bearing: -17.6,
      antialias: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }));

    map.on("load", () => {
      setLoading(false);

      // ✅ เพิ่ม layer เฉพาะเมื่อ “ยังไม่มี” (กันกระพริบจากการ add ซ้ำ)
      if (!map.getLayer("sky")) {
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 10,
          },
        });
      }

      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });
      }

      const labelLayerId = (map.getStyle().layers || []).find(
        (l: any) => l.type === "symbol" && l.layout?.["text-field"]
      )?.id;

      if (!map.getLayer("3d-buildings")) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", ["get", "extrude"], "true"],
            type: "fill-extrusion",
            minzoom: 12,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                12,
                0,
                16,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                12,
                0,
                16,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.6,
            },
          },
          labelLayerId
        );
      }

      // marker (เพิ่มครั้งเดียว)
      new mapboxgl.Marker({ color: "#6959ff" })
        .setLngLat([100.523186, 13.736717])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML("<strong>Bangkok</strong>"))
        .addTo(map);
    });

    // ✅ ปรับขนาดแมพอย่างนุ่มนวลเมื่อ container เปลี่ยนขนาด (กันกระพริบจาก resize)
    const ro = new ResizeObserver(() => {
      if (map && map.isStyleLoaded()) map.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      // ปล่อย map เมื่อ component ถูกถอดจริง ๆ
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="panel">
      <div className="panel-title">Map (3D)</div>
      <div
        ref={containerRef}
        style={{
          height: "70vh",
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          // ช่วยลด jank ตอน transform
          willChange: "transform",
        }}
      />
      {loading && (
        <div className="submuted" style={{ marginTop: 6 }}>
          Loading map…
        </div>
      )}
    </div>
  );
}
