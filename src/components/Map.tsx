import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

type MapProps = {
	mapboxToken: string;
	center?: [number, number];
	zoom?: number;
};

export default function Map({ mapboxToken, center = [100.5018, 13.7563], zoom = 10 }: MapProps) {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!mapContainerRef.current) return;
		if (mapRef.current) return;

		mapboxgl.accessToken = mapboxToken;
		mapRef.current = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: 'mapbox://styles/mapbox/streets-v12',
			center,
			zoom
		});

		mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

		mapRef.current.on('error', (e) => {
			// Show a human-readable error in the UI for easier debugging
			const message =
				// @ts-expect-error v3 error type isn't exported; fall back to any
				(e?.error?.message as string | undefined) ||
				(typeof e?.error === 'string' ? (e.error as string) : null) ||
				'Map failed to load';
			setErrorMessage(message);
		});

		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, [mapboxToken, center, zoom]);

	return (
		<div style={{ position: 'relative' }}>
			<div
				ref={mapContainerRef}
				style={{ width: '100%', height: '420px', borderRadius: 12, overflow: 'hidden', background: '#0f1217' }}
			/>
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


