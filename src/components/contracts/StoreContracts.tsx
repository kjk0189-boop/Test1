"use client";

import { useEffect, useState } from "react";
import SealManager from "@/components/contracts/SealManager";
import ContractListPanel from "@/components/contracts/ContractListPanel";

type UserRow = { id: string; name: string; role: string; storeId: string | null; hourlyWage: number | null };

export default function StoreContracts({
  storeId,
  storeName,
  storeAddress,
  initialSealImage,
}: {
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  initialSealImage: string | null;
}) {
  const [crewList, setCrewList] = useState<UserRow[]>([]);
  const [sealImage, setSealImage] = useState(initialSealImage);

  useEffect(() => {
    setSealImage(initialSealImage);
  }, [initialSealImage, storeId]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      setCrewList((d.users ?? []).filter((u: UserRow) => u.role === "crew" && u.storeId === storeId));
    });
  }, [storeId]);

  return (
    <div className="max-w-3xl">
      <SealManager storeId={storeId} sealImage={sealImage} onUpdated={setSealImage} />
      <ContractListPanel
        employees={crewList}
        payMode="hourly"
        sealImage={sealImage}
        defaultWorkplace={storeAddress ?? ""}
        storeName={storeName}
      />
    </div>
  );
}
