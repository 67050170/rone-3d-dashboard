import React, { useEffect, useMemo, useRef, useState } from 'react';
import MapComponent from './MapComponent';
import DashboardCards from './components/DashboardCards';

type DroneCameraConfig = {
  cameraId: string;          // กล้องเดียวเท่านั้น
  cameraApiToken: string;
};

const ENV_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN ?? '';

function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState] as const;
}

export default function App() {
  // ===== กล้องเดียว =====
  const [cam, setCam] = usePersistentState<DroneCameraConfig>('droneCam', {
    cameraId: '',
    cameraApiToken: ''
  });

  const [isRunning, setIsRunning] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string>('');
  const pollRef = useRef<number | null>(null);

  // เงื่อนไขเริ่มระบบ: ต้องกรอกให้ครบ
  const canStart = useMemo(
    () => cam.cameraId.trim() !== '' && cam.cameraApiToken.trim() !== '',
    [cam]
  );

  // ตัวอย่าง endpoint (แก้เป็นของจริงของคุณ):
  // - snapshot:   GET /api/cameras/:id/snapshot?token=...
  // - stream:     GET /api/cameras/:id/stream?token=...
  const mkSnapshotUrl = () =>
    `/api/cameras/${encodeURIComponent(cam.cameraId)}/snapshot?token=${encodeURIComponent(
      cam.cameraApiToken
    )}&_ts=${Date.now()}`; // ป้องกัน cache

  // ควบคุมการ “รันกล้องเดียว”
  useEffect(() => {
    if (isRunning) {
      // เริ่ม polling รูปจากกล้องเดียว
      const tick = () => setSnapshotUrl(mkSnapshotUrl());
      tick();
      pollRef.current = window.setInterval(tick, 1500);
      return () => {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
      };
    } else {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isRunning, cam.cameraId, cam.cameraApiToken]);

  return (
    <div className="layout">
      <header className="header">
        <div className="logo">Drone Dashboard (Single Camera)</div>
      </header>

      <main className="content">
        {/* ===== ตั้งค่ากล้องเดียว ===== */}
        <section className="panel">
          <div className="panel-title">Single Camera Configuration</div>
          <div className="config-grid">
            <div className="field">
              <label>Drone Camera ID</label>
              <input
                placeholder="Enter camera ID"
                value={cam.cameraId}
                onChange={(e) => setCam({ ...cam, cameraId: e.target.value })}
              />
            </div>
            <div className="field">
              <label>API Token</label>
              <input
                type="password"
                placeholder="Enter camera API token"
                value={cam.cameraApiToken}
                onChange={(e) => setCam({ ...cam, cameraApiToken: e.target.value })}
              />
            </div>
            <div className="actions">
              <button
                className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => setIsRunning((v) => !v)}
                disabled={!isRunning && !canStart}
                title={!isRunning && !canStart ? 'กรอก Camera ID และ Token ก่อน' : undefined}
              >
                {isRunning ? 'STOP' : 'START (Single)'}
              </button>
            </div>
          </div>
          <div className="submuted" style={{ marginTop: 6 }}>
            โหมดนี้รองรับ “กล้องเดียว” เท่านั้น หากมีหลายกล้อง ให้เลือกเพียงตัวเดียวมาใส่ ID/Token
          </div>
        </section>

        {/* การ์ดสถานะ/สรุป */}
        <DashboardCards />

        {/* แผนที่ */}
        <section className="panel">
          <div className="panel-title">Map</div>
          <MapComponent
            mapboxToken={
              ENV_TOKEN ||
              'pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ'
            }
            markers={[
              {
                lng: 100.523186,
                lat: 13.736717,
                popupHtml: '<strong>Bangkok</strong><br/>ตัวอย่างปักหมุด',
                colorHex: '#6959ff'
              }
            ]}
          />
          <div
            style={{ marginTop: 8, color: ENV_TOKEN ? 'var(--muted)' : '#ff8080', fontSize: 12 }}
          >
            {ENV_TOKEN
              ? 'Mapbox token loaded from .env'
              : 'ไม่พบ VITE_MAPBOX_TOKEN ใน .env (restart server หลังเพิ่มไฟล์)'}
          </div>
        </section>

        {/* พรีวิวจาก “กล้องเดียว” */}
        <section className="panel">
          <div className="panel-title">Live (Single Camera)</div>
          {isRunning ? (
            <div className="live-wrap">
              {/* ตัวอย่างแบบ snapshot; ถ้ามี HLS/WebRTC เปลี่ยนเป็น <video> ได้ */}
              <img
                src={snapshotUrl}
                alt="camera snapshot"
                style={{ width: '100%', borderRadius: 8 }}
              />
              <div className="submuted" style={{ marginTop: 6 }}>
                แสดงผลจากกล้อง ID: <strong>{cam.cameraId}</strong>
              </div>
            </div>
          ) : (
            <div className="empty">กด START เพื่อเริ่มพรีวิวกล้องเดียว</div>
          )}
        </section>

        {/* โครงสร้างอื่น ๆ */}
        <section className="panel two-col">
          <div>
            <div className="panel-title">Object Types</div>
            <div className="empty">No data available</div>
          </div>
          <div>
            <div className="panel-title">Objectives</div>
            <div className="empty">No data available</div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">Recent Detections</div>
          <div className="empty">No detections found</div>
        </section>
      </main>
    </div>
  );
}
