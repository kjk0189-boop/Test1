"use client";

import { useState } from "react";
import SealManager from "@/components/contracts/SealManager";
import ContractListPanel from "@/components/contracts/ContractListPanel";

type Employee = { id: string; name: string; hourlyWage: number | null };

export default function ManagerContractsClient({
  storeId,
  storeName,
  storeAddress,
  initialSealImage,
  crewList,
}: {
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  initialSealImage: string | null;
  crewList: Employee[];
}) {
  const [sealImage, setSealImage] = useState(initialSealImage);

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
