import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export type MapMarker = {
	id?: string;
	lng: number;
	lat: number;
	popupHtml?: string;
	colorHex?: string;
};

type MapComponentProps = {
	center?: [number, number];
	zoom?: number;
	markers?: MapMarker[];
	mapboxToken?: string;
	styleUrl?: string;
};

export default function MapComponent({
	center = [100.5018, 13.7563],
	zoom = 10,
	markers = [],
	mapboxToken,
	styleUrl = 'mapbox://styles/mapbox/streets-v12'
}: MapComponentProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [loaded, setLoaded] = useState(false);

	const token = useMemo(() => {
		const envToken = (import.meta as any).env?.VITE_MAPBOX_TOKEN ?? '';
		const fallback =
			'pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ';
		return (mapboxToken && mapboxToken.trim()) || (envToken && envToken.trim()) || fallback;
	}, [mapboxToken]);

	useEffect(() => {
		if (!containerRef.current) return;
		if (mapRef.current) return;

		if (!token) {
			setErrorMessage('Missing Mapbox token. Set VITE_MAPBOX_TOKEN in .env');
			return;
		}

		mapboxgl.accessToken = token;
		const map = new mapboxgl.Map({
			container: containerRef.current,
			style: styleUrl,
			center,
			zoom
		});
		mapRef.current = map;
		map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

		map.on('load', () => {
			setLoaded(true);
			// ensure correct size if container computed later
			map.resize();
		});

		map.on('error', (e) => {
			const message =
				// @ts-expect-error event typing in v3
				(e?.error?.message as string | undefined) ||
				(typeof e?.error === 'string' ? (e.error as string) : null) ||
				'Map failed to load';
			setErrorMessage(message);
		});

		return () => {
			map.remove();
			mapRef.current = null;
			setLoaded(false);
		};
	}, [token, center, zoom, styleUrl]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const created: mapboxgl.Marker[] = [];
		markers.forEach((m) => {
			const marker = new mapboxgl.Marker({ color: m.colorHex ?? '#ff5bcd' })
				.setLngLat([m.lng, m.lat])
				.addTo(map);
			if (m.popupHtml) {
				const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(m.popupHtml);
				marker.setPopup(popup);
			}
			created.push(marker);
		});

		return () => {
			created.forEach((mk) => mk.remove());
		};
	}, [markers]);

	return (
		<div style={{ position: 'relative' }}>
			<div
				ref={containerRef}
				style={{
					width: '100%',
					height: 420,
					borderRadius: 12,
					overflow: 'hidden',
					background: '#0f1217',
					border: '1px solid rgba(255,255,255,0.08)'
				}}
			/>
			<div style={{ marginTop: 8, fontSize: 12, color: '#8b95a7' }}>
				Token: {token ? token.slice(0, 10) + '…' : '(empty)'} • Map loaded: {loaded ? 'yes' : 'no'}
			</div>
			{errorMessage ? (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: 'rgba(0,0,0,0.5)',
						color: 'white',
						fontWeight: 700,
						padding: 12,
						textAlign: 'center'
					}}
				>
					{errorMessage}
				</div>
			) : null}
		</div>
	);
}


