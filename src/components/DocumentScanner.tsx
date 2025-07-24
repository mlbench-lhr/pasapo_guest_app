'use client'
import { useEffect, useState } from 'react';
import ScanFrame from './ScanFrame';
import PrivacyModal from './PrivacyModal';
import ScanResults from './ScanResults';
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";

export interface ScannedData {
  documentNumber: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  imageUrl: string;
}

export default function DocumentScanner() {
  const [showModal, setShowModal] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasMissingParams, setHasMissingParams] = useState(false);
  const [repeat, setRepeat] = useState(0)
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleAgree = (): void => {
    setShowModal(false);
    setIsScanning(true);
  };

  const handleScanComplete = (): void => {
    setIsScanning(false);
  };

  useEffect(() => {
    const session_id = searchParams.get('session_id');
    const api_key = searchParams.get('api_key');

    // If either parameter is missing, handle it early
    if (!session_id || !api_key) {
      setHasMissingParams(true)
      return;
    }
    sessionStorage.setItem("link_id", session_id)
    const getlinkStatus = async () => {
      try {
        const response = await fetch("/api/get_link_status", {
          method: "POST",
          body: JSON.stringify({ api_key, session_id }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.data?.message || 'Unexpected error');
        }

        if (result.data.data.status === "expired") {
          router.push("/linkExpiredPage");
        }

        if (result.data.data.number_of_guests === 0) {
          router.push("/checkedin");
        }

        setRepeat(result.data.data.number_of_guests)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Network Error:", message);
      }
    };

    getlinkStatus();
  }, [searchParams, router]);



  if (hasMissingParams) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%' }}>
        ❌ There are no search params
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Main Content */}
      <div className="px-6 pt-16">
        <h1 className="text-2xl font-semibold text-center mb-16">
          Scan Document
        </h1>

        <ScanFrame
          isScanning={isScanning}
          repeat={repeat}
          setIsScanning={setIsScanning}
          onScanComplete={handleScanComplete}
        />
      </div>

      {/* Privacy Modal */}
      {showModal && (
        <PrivacyModal onAgree={handleAgree} />
      )}
    </div>
  );
}