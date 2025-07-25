import { useRef, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Image from 'next/image';

interface ScanFrameProps {
    isScanning: boolean;
    repeat: number;
    setIsScanning: (value: boolean) => void;
    onScanComplete: () => void;
}

export default function ScanFrame({ isScanning, repeat, setIsScanning, onScanComplete }: ScanFrameProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [currentScanCount, setCurrentScanCount] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isScanning) {
            startCamera();
            // Reset scan count when starting new scanning session
            setCurrentScanCount(0);
        } else {
            stopCamera();
        }

        return () => stopCamera();
    }, [isScanning]);

    const startCamera = async (): Promise<void> => {
        try {
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported');
            }

            // First check camera permissions
            const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log('Camera permission state:', permissions.state);

            // For mobile browsers, try multiple camera configurations
            const constraints = [
                // Try environment camera first (back camera)
                {
                    video: {
                        facingMode: { exact: 'environment' },
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 }
                    }
                },
                // Fallback to any environment camera
                {
                    video: {
                        facingMode: 'environment',
                        width: { min: 640, ideal: 1280 },
                        height: { min: 480, ideal: 720 }
                    }
                },
                // Fallback to any camera
                {
                    video: {
                        width: { min: 640, ideal: 1280 },
                        height: { min: 480, ideal: 720 }
                    }
                }
            ];

            let mediaStream: MediaStream | null = null;
            let lastError: Error | null = null;

            // Try each constraint configuration
            for (const constraint of constraints) {
                try {
                    console.log('Trying camera constraint:', constraint);
                    mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
                    break;
                } catch (error: unknown) {
                    console.log('Camera constraint failed:', error);
                    lastError = error as Error;
                    continue;
                }
            }

            if (!mediaStream) {
                throw lastError || new Error('No camera configuration worked');
            }

            setStream(mediaStream);
            setHasPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;

                // Ensure video plays on mobile
                videoRef.current.setAttribute('playsinline', 'true');
                videoRef.current.setAttribute('webkit-playsinline', 'true');

                try {
                    await videoRef.current.play();
                } catch (playError) {
                    console.log('Video play error (this is often normal):', playError);
                }
            }
        } catch (error: unknown) {
            console.error('Error accessing camera:', error);
            setHasPermission(false);

            if (typeof error === 'object' && error !== null && 'name' in error) {
                const err = error as { name: string };

                if (err.name === 'NotAllowedError') {
                    console.log('Camera permission denied by user');
                } else if (err.name === 'NotFoundError') {
                    console.log('No camera found on device');
                } else if (err.name === 'NotReadableError') {
                    console.log('Camera is being used by another application');
                } else if (err.name === 'OverconstrainedError') {
                    console.log('Camera constraints not supported');
                }
            }
        }

    };

    const stopCamera = (): void => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureImage = (): void => {
        if (!videoRef.current || !canvasRef.current || isProcessing) return;

        setIsProcessing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Convert to blob and process
        canvas.toBlob((blob) => {
            if (blob) {
                processPassportImage(blob);
            }
        }, 'image/jpeg', 0.8);
    };

    const processPassportImage = async (imageBlob: Blob): Promise<void> => {
        const link_id = sessionStorage.getItem("link_id")
        const formData = new FormData();
        formData.append("api_key", "k38djv9gwe8fbvtmh28rfqwev7xg63hjfd");
        formData.append("link_id", link_id || "");
        formData.append("image", imageBlob, "passport.jpg");

        try {
            const response = await fetch("/api/process-passport", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            if (!response.ok || result.data.status === false) {
                console.error("Server Error:", result.data.message);
                throw new Error(result.data.message)
            }
            console.log(result.data)
            // Successful scan - increment count
            const newScanCount = currentScanCount + 1;
            setCurrentScanCount(newScanCount);

            console.log(`Scan ${newScanCount} of ${repeat} completed`);

            // Check if we've completed all required scans
            if (newScanCount >= repeat) {
                // All scans completed
                setIsProcessing(false);
                setIsScanning(false);

                // Call onScanComplete
                onScanComplete();

                router.push("/checkedin");
            } else {
                // More scans needed - continue scanning
                setIsProcessing(false);
                // Keep camera running for next scan
                console.log(`Preparing for scan ${newScanCount + 1} of ${repeat}`);

                // Optional: Add a brief delay between scans
                setTimeout(() => {
                    // Ready for next scan
                }, 1000);
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Network Error:", message);
            setErrorMessage(message);

            if (error instanceof Error && error.message === "MRZ not found or invalid") {
                console.log(`Scan ${currentScanCount + 1} failed: ${error.message}`);
                setIsProcessing(false);
                // Continue scanning without incrementing count
                // Camera stays active for retry
            }
            setIsProcessing(false);
        }
    };

    if (hasPermission === false) {
        return (
            <div className="flex flex-col items-center text-center">
                <div className="w-80 h-60 border-2 border-red-500 rounded-lg flex items-center justify-center">
                    <div className="text-red-500 p-6">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                        <h3 className="text-lg font-medium mb-2">Camera Access Required</h3>
                        <p className="text-sm mb-4">Please enable camera permissions to scan your passport</p>

                        <div className="text-left text-xs space-y-2 bg-gray-800 p-3 rounded">
                            <p className="font-medium text-white">How to enable:</p>
                            <p>• Click the camera icon in address bar</p>
                            <p>• Select &quot;Allow&quot; when prompted</p>
                            <p>• Refresh the page if needed</p>
                        </div>

                        <button
                            onClick={startCamera}
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Main Scanner UI */}
            <div className="flex flex-col items-center">
                <p className="text-gray-400 text-center mb-4 text-lg leading-relaxed">
                    Move passport inside the<br />
                    blue square
                </p>

                {/* Scan Progress Indicator */}
                {repeat > 1 && (
                    <div className="mb-4 text-center">
                        <p className="text-sm text-gray-500">
                            Scan {currentScanCount + 1} of {repeat}
                        </p>
                        <div className="w-48 bg-gray-700 rounded-full h-2 mt-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(currentScanCount / repeat) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="relative">
                    {/* Scan Frame */}
                    <div className="w-80 h-60 border-2 border-blue-500 rounded-lg bg-transparent relative overflow-hidden">
                        {/* Camera Video */}
                        {isScanning && (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                webkit-playsinline="true"
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Corner Brackets */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-blue-500 z-10"></div>
                        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-blue-500 z-10"></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-blue-500 z-10"></div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-blue-500 z-10"></div>

                        {/* Processing Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                                <div className="text-white text-center">
                                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p>Processing scan {currentScanCount + 1}...</p>
                                </div>
                            </div>
                        )}

                        {/* Scanning Animation */}
                        {isScanning && !isProcessing && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 animate-pulse z-10"></div>
                        )}
                    </div>
                </div>
                {
                    errorMessage && (
                        <div className="mt-4 text-red-500 text-center">
                            {errorMessage}
                        </div>
                    )
                }

                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Fixed Bottom Capture Button */}
            {isScanning && !isProcessing && (
                <button
                    onClick={captureImage}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full font-medium transition-colors z-50"
                >
                    <Image
                        width={63}
                        height={20}
                        src="/images/camera.svg"
                        alt="Logo"
                    />
                </button>
            )}
        </>
    );
}