"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

export default function KakaoMapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapObjRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !window.kakao) return;

    window.kakao.maps.load(() => {
      const center = new window.kakao.maps.LatLng(latitude ?? 37.5665, longitude ?? 126.978);
      const map = new window.kakao.maps.Map(mapRef.current, { center, level: 3 });
      const marker = new window.kakao.maps.Marker({ position: center, draggable: true });
      marker.setMap(map);

      window.kakao.maps.event.addListener(marker, "dragend", () => {
        const pos = marker.getPosition();
        onChange(pos.getLat(), pos.getLng());
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.kakao.maps.event.addListener(map, "click", (e: any) => {
        marker.setPosition(e.latLng);
        onChange(e.latLng.getLat(), e.latLng.getLng());
      });

      mapObjRef.current = map;
      markerRef.current = marker;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  function handleSearch() {
    if (!window.kakao || !addressQuery.trim()) return;
    setSearchError("");
    const geocoder = new window.kakao.maps.services.Geocoder();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geocoder.addressSearch(addressQuery, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);
        const pos = new window.kakao.maps.LatLng(lat, lng);
        mapObjRef.current?.setCenter(pos);
        markerRef.current?.setPosition(pos);
        onChange(lat, lng);
      } else {
        setSearchError("주소를 찾지 못했어요. 다른 표현으로 시도해보세요.");
      }
    });
  }

  if (!KAKAO_KEY) {
    return (
      <div className="rounded-lg border p-4 text-xs" style={{ borderColor: "#DDE1D8", color: "#A64B3A" }}>
        카카오맵 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 설정되지 않았어요. 환경변수를 등록하고 다시 배포해주세요.
      </div>
    );
  }

  return (
    <div>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div className="flex gap-2 mb-2">
        <input
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
          placeholder="주소 검색 (예: 서울 강남구 테헤란로 123)"
          className="flex-1 px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: "#DDE1D8" }}
        />
        <button type="button" onClick={handleSearch} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "#EEF0EA", color: "#1B2420" }}>
          검색
        </button>
      </div>
      {searchError && <p className="text-xs mb-2" style={{ color: "#A64B3A" }}>{searchError}</p>}
      <div ref={mapRef} style={{ width: "100%", height: "280px", borderRadius: "12px", overflow: "hidden", background: "#EEF0EA" }} />
      <p className="text-xs mt-2" style={{ color: "#8A9088" }}>지도를 클릭하거나 마커를 드래그해서 정확한 위치로 조정할 수 있어요.</p>
    </div>
  );
}
