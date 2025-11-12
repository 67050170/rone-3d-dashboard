import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const ENV_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN ?? "";
const USER_TOKEN = "pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ";
mapboxgl.accessToken = ENV_TOKEN || USER_TOKEN;

export default function MapComponent() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

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

      // sky
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 10,
        },
      });

      // terrain
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });

      // 3D buildings
      const labelLayerId = (map.getStyle().layers || []).find(
        (l: any) => l.type === "symbol" && l.layout?.["text-field"]
      )?.id;
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
              "interpolate", ["linear"], ["zoom"], 12, 0, 16, ["get", "height"]
            ],
            "fill-extrusion-base": [
              "interpolate", ["linear"], ["zoom"], 12, 0, 16, ["get", "min_height"]
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );

      // marker
      new mapboxgl.Marker({ color: "#6959ff" })
        .setLngLat([100.523186, 13.736717])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML("<strong>Bangkok</strong>"))
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="panel">
      <div className="panel-title">Map (3D)</div>
      <div ref={containerRef} className="h-[70vh] w-full rounded-2xl overflow-hidden" />
      {loading && <div className="submuted" style={{ marginTop: 6 }}>Loading map…</div>}
    </div>
  );
}
