import { Suspense } from "react";
import { EscrowContent } from "./EscrowContent";
import { EscrowSkeleton } from "@/components/Skeletons";

export default function EscrowPage() {
  return (
    <Suspense fallback={<EscrowSkeleton />}>
      <EscrowContent />
    </Suspense>
  );
}
