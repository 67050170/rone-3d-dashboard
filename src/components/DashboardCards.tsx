import React, { useEffect, useMemo, useState } from 'react'; 
import MapComponent from './MapComponent';
import DashboardCards from './components/DashboardCards';

type ApiConfig = {
	cameraId: string;
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
		} catch {
			// ignore quota errors for now
		}
	}, [key, state]);

	return [state, setState] as const;
}

export default function App() {
	const [apiConfig, setApiConfig] = usePersistentState<ApiConfig>('apiConfig', {
		cameraId: '',
		cameraApiToken: ''
	});
	const [isRunning, setIsRunning] = useState(false);

	const canStart = useMemo(() => apiConfig.cameraId.trim() !== '' && apiConfig.cameraApiToken.trim() !== '', [apiConfig]);

	return (
		<div className="layout">
			<header className="header">
				<div className="logo">Dashboard</div>
			</header>

			<main className="content">
				<section className="panel">
					<div className="panel-title">API Configuration</div>
					<div className="config-grid">
						<div className="field">
							<label>Camera ID</label>
							<input
								placeholder="Enter camera ID"
								value={apiConfig.cameraId}
								onChange={(e) => setApiConfig({ ...apiConfig, cameraId: e.target.value })}
							/>
						</div>
						<div className="field">
							<label>Authentication Token</label>
							<input
								type="password"
								placeholder="Enter camera API token"
								value={apiConfig.cameraApiToken}
								onChange={(e) => setApiConfig({ ...apiConfig, cameraApiToken: e.target.value })}
							/>
						</div>
						<div className="actions">
							<button
								className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
								onClick={() => setIsRunning((v) => !v)}
								disabled={!isRunning && !canStart}
								title={!isRunning && !canStart ? 'กรอก Camera ID และ Token ก่อน' : undefined}
							>
								{isRunning ? 'STOP' : 'START'}
							</button>
						</div>
					</div>
				</section>

				<DashboardCards />

				<section className="panel">
					<div className="panel-title">Map</div>
					<MapComponent
						mapboxToken={ENV_TOKEN || 'pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ'}
						markers={[
							{
								lng: 100.523186,
								lat: 13.736717,
								popupHtml: '<strong>Bangkok</strong><br/>ตัวอย่างปักหมุด',
								colorHex: '#6959ff'
							}
						]}
					/>
					<div style={{ marginTop: 8, color: ENV_TOKEN ? 'var(--muted)' : '#ff8080', fontSize: 12 }}>
						{ENV_TOKEN ? 'Mapbox token loaded from .env' : 'ไม่พบ VITE_MAPBOX_TOKEN ใน .env (restart server หลังเพิ่มไฟล์)'}
					</div>
				</section>

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


