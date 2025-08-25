"use client"

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function OutboundCallPage() {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/user-dashboard/profile");
    }
  }, [user, router]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Outbound Call Request</h1>
      <p className="mb-4 text-gray-600">Please fill out the form below for an outbound call request.</p>
      <div className="rounded-lg overflow-hidden border shadow">
        <iframe
          ref={iframeRef}
          src="https://tally.so/embed/mO2RWK?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
          width="100%"
          height="600"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="Outbound Call Form"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
