'use client'
import { useRef, useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import SocketLoadingModal from './modal';
import Swal from 'sweetalert2';

interface ScanFrameProps {
    isScanning: boolean;
    repeat: number;
    setIsScanning: (value: boolean) => void;
    onScanComplete: () => void;
}

type Country = {
    country_name: string;
    country_code: string;
};

interface PassportData {
    first_name?: string;
    last_name?: string;
    dateOfBirth?: string;
    country?: string;
    passportNumber?: string;
    gender?: string;
    documentType?: string;
    guest_add_type?: "scan";
    force_unarchive?: boolean;
    tckNumber?: string;
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const showSocketModal = useRef<boolean>(false);
    const [socketInfo, setSocketInfo] = useState<string>('');
    const [socketStatus, setSocketStatus] = useState<string>('');
    const [passportData, setPassportData] = useState<PassportData | null>();
    const [editedPassportData, setEditedPassportData] = useState<PassportData | null>();
    const [countries, setCountries] = useState<Country[]>([]);
    const searchParams = useSearchParams();
    const [capturedImage, setCapturedImage] = useState<string>();
    const [isAddingGuest, setIsAddingGuest] = useState<boolean>(false);


    useEffect(() => {
        if (passportData) {
            setEditedPassportData(passportData);
        }
    }, [passportData]);


    useEffect(() => {
        if (isScanning) {
            startCamera();
            setCurrentScanCount(0);
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
            if (socket) {
                socket.disconnect();
            }
        };
    }, [isScanning]);

    const startCamera = async (): Promise<void> => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported');
            }

            const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log('Camera permission state:', permissions.state);

            const constraints = [
                {
                    video: {
                        facingMode: { exact: 'environment' },
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 }
                    }
                },
                {
                    video: {
                        facingMode: 'environment',
                        width: { min: 640, ideal: 1280 },
                        height: { min: 480, ideal: 720 }
                    }
                },
                {
                    video: {
                        width: { min: 640, ideal: 1280 },
                        height: { min: 480, ideal: 720 }
                    }
                }
            ];

            let mediaStream: MediaStream | null = null;
            let lastError: Error | null = null;

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

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0);

        // Store the captured image as base64
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);

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
            console.log(result.data.data)

            // Store passport data to display
            setPassportData(result.data.data);

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Network Error:", message);
            setErrorMessage(message);

            if (error instanceof Error && error.message === "MRZ not found or invalid") {
                console.log(`Scan ${currentScanCount + 1} failed: ${error.message}`);
                setIsProcessing(false);
            }
            setIsProcessing(false);
        }
    };

    const getCountries = async () => {
        try {
            const session_id = searchParams.get('session_id');
            const api_key = searchParams.get('api_key');
            const response = await fetch("/api/get-countries", {
                method: "POST",
                body: JSON.stringify({ api_key, session_id }),
            });
            console.log("getting countries after api")


            const result = await response.json();

            if (!response.ok) {
                if (result.error === "Link Expired") {
                    router.push("/linkExpiredPage");
                }
                throw new Error(result.data.data.message || 'Unexpected error');
            }
            setCountries(result.data.data)

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Network Error:", message);
        }
    };
    useEffect(() => {
        getCountries();
    }, []);
    const connectToSocket = (guestId: string): Promise<{ kbs_socket_info: string, status_on_kbs: string }> => {
        return new Promise((resolve, reject) => {
            showSocketModal.current = true;
            setSocketInfo('');
            setSocketStatus('connecting');

            const newSocket = io('https://ws.pasistan.com', {
                transports: ["websocket"],
            });

            newSocket.on('connect', () => {
                console.log('Connected to socket for guest:', guestId);
                setSocketStatus('connected');
                newSocket.emit('join_guest', { guest_id: guestId });
            });

            newSocket.on('guest_data', (data) => {
                const kbs_socket_info = data.data?.kbs_socket_info || '';
                const status_on_kbs = data.data?.status_on_kbs || '';

                console.log('Received guest data:', { kbs_socket_info, status_on_kbs });

                setSocketInfo(kbs_socket_info);
                setSocketStatus(status_on_kbs);

                if (status_on_kbs === 'failed') {
                    newSocket.disconnect();
                    resolve({ kbs_socket_info, status_on_kbs });
                } else if (status_on_kbs === 'checkedin') {
                    newSocket.disconnect();
                    resolve({ kbs_socket_info, status_on_kbs });
                }
            });

            newSocket.on('guest_updated', (data) => {
                const kbs_socket_info = data.data?.kbs_socket_info || '';
                const status_on_kbs = data.data?.status_on_kbs || '';

                console.log('Guest updated:', { kbs_socket_info, status_on_kbs });

                setSocketInfo(kbs_socket_info);
                setSocketStatus(status_on_kbs);

                if (status_on_kbs === 'failed') {
                    newSocket.disconnect();
                    resolve({ kbs_socket_info, status_on_kbs });
                } else if (status_on_kbs === 'checkedin') {
                    newSocket.disconnect();
                    resolve({ kbs_socket_info, status_on_kbs });
                }
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
                newSocket.disconnect();
                reject(new Error('Socket connection error'));
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            setSocket(newSocket);
        });
    };

    // const testWithImageFile = (): void => {
    //     const input: HTMLInputElement = document.createElement('input');
    //     input.type = 'file';
    //     input.accept = 'image/*';

    //     input.onchange = async (e: Event): Promise<void> => {
    //         const target = e.target as HTMLInputElement;
    //         const file: File | null = target.files?.[0] || null;

    //         if (file) {
    //             console.log('Testing with file:', file.name, file.size, 'bytes');
    //             setCurrentScanCount(0);

    //             try {
    //                 await processPassportImage(file as Blob);
    //                 console.log('Test completed successfully!');
    //             } catch (error: unknown) {
    //                 const errorMessage = error instanceof Error ? error.message : String(error);
    //                 console.error('Test failed:', errorMessage);
    //             }
    //         }
    //     };

    //     input.click();
    // };

    const handleInputChange = (field: keyof PassportData, value: string | boolean) => {
        setEditedPassportData(prev => {
            if (!prev) return { [field]: value } as PassportData;
            return {
                ...prev,
                [field]: value,
            };
        });
    };

    const handleRescan = () => {
        setPassportData(null);
        setEditedPassportData(null);
        setErrorMessage(null);
        setIsProcessing(false);
        setCapturedImage("");

        // Restart the video element
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(error => {
                console.log('Error restarting video:', error);
            });
        }
    };

    const handleContinue = async () => {
        console.log('Continuing with data:', editedPassportData);

        setIsAddingGuest(true); // Show loading

        try {
            const session_id = searchParams.get('session_id');
            const api_key = searchParams.get('api_key');
            const data = {
                "link_id": session_id,
                "first_name": editedPassportData?.first_name,
                "last_name": editedPassportData?.last_name,
                "date_of_birth": editedPassportData?.dateOfBirth,
                "issuing_country": editedPassportData?.country,
                "document_number": editedPassportData?.passportNumber,
                "sex": editedPassportData?.gender,
                "document_type": editedPassportData?.documentType,
                "guest_add_type": "scan",
                "force_unarchive": true,
                "tck_number": editedPassportData?.tckNumber
            }

            console.log(editedPassportData);

            const response = await fetch("/api/add_guest", {
                method: "POST",
                body: JSON.stringify({ api_key, data }),
            });
            console.log("response",response);

            const result = await response.json();
            console.log("result",result);
            if (!response.ok || result.status === false) {
                throw new Error(result.error || 'Unexpected error');
            }

            // Success
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Guest added successfully',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'OK'
            });

            // Clear states after success
            setPassportData(null);
            setEditedPassportData(null);
            setErrorMessage(null);
            setIsProcessing(false);
            setCapturedImage("");

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error:', errorMessage);

            // Show error alert
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage || 'Failed to add guest',
                confirmButtonColor: '#EF4444',
                confirmButtonText: 'OK'
            });
        } finally {
            setIsAddingGuest(false); // Hide loading
        }
    };

    const onCloseModal = () => {
        showSocketModal.current = false
        setSocketInfo('');
        setSocketStatus('');
        const newScanCount = currentScanCount + 1;
        console.log(`Scan ${newScanCount} of ${repeat} completed`);

        if (newScanCount >= repeat) {
            setIsProcessing(false);
            setIsScanning(false);
            onScanComplete();
            console.log(showSocketModal)

            if (!showSocketModal.current) {
                router.push("/checkedin");
            }
        } else {
            setIsProcessing(false);
            console.log(`Preparing for scan ${newScanCount + 1} of ${repeat}`);

            setTimeout(() => {
            }, 1000);
            setCurrentScanCount(newScanCount);
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
            <div className="flex flex-col items-center">
                <p className="text-gray-400 text-center mb-4 text-lg leading-relaxed">
                    Move passport inside the<br />
                    blue square
                </p>

                {repeat > 0 && (
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
                    <div className="w-80 h-60 border-2 border-blue-500 rounded-lg bg-transparent relative overflow-hidden">
                        {/* Always render video, control visibility with CSS */}
                        {isScanning && (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                webkit-playsinline="true"
                                className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
                            />
                        )}



                        {/* Corner brackets with glow */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-blue-500 z-10  shadow-blue-500/50"></div>
                        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-blue-500 z-10  shadow-blue-500/50"></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-blue-500 z-10  shadow-blue-500/50"></div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-blue-500 z-10  shadow-blue-500/50"></div>

                        {/* Processing overlay - shows on top of captured image */}

                        {isProcessing && !passportData ? (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20">
                                <div className="text-white text-center">
                                    <div className="relative w-12 h-12 mx-auto mb-2">
                                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <div className="absolute inset-2 border-4 border-blue-300 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                                    </div>
                                    <p className="text-sm font-medium">Processing scan {currentScanCount + 1}...</p>
                                </div>
                            </div>
                        ) : capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured passport"
                                className="absolute inset-0 w-full h-full object-cover z-5"
                            />
                        ) : (null)}


                        {/* Show scanning animations only when scanning and no captured image */}
                        {isScanning && !capturedImage && (
                            <>
                                {/* Vertical sweep line */}
                                <div
                                    className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent z-10"
                                    style={{
                                        animation: 'scanVertical 3s ease-in-out infinite',
                                        boxShadow: '0 0 10px 2px rgba(59, 130, 246, 0.5)'
                                    }}
                                ></div>

                                {/* Horizontal sweep line */}
                                <div
                                    className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent z-10"
                                    style={{
                                        animation: 'scanHorizontal 3s ease-in-out infinite',
                                        animationDelay: '1.5s',
                                        boxShadow: '0 0 10px 2px rgba(59, 130, 246, 0.5)'
                                    }}
                                ></div>

                                {/* Pulsing overlay */}
                                <div className="absolute inset-0 bg-blue-500 bg-opacity-5 z-10" style={{ animation: 'pulse 3s ease-in-out infinite' }}></div>

                                {/* Grid pattern overlay */}
                                <div
                                    className="absolute inset-0 z-10 opacity-20"
                                    style={{
                                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, .3) 25%, rgba(59, 130, 246, .3) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, .3) 75%, rgba(59, 130, 246, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, .3) 25%, rgba(59, 130, 246, .3) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, .3) 75%, rgba(59, 130, 246, .3) 76%, transparent 77%, transparent)',
                                        backgroundSize: '20px 20px'
                                    }}
                                ></div>
                            </>
                        )}
                    </div>


                    <style jsx>{`
        @keyframes scanVertical {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            40% { opacity: 1; }
            50% { transform: translateY(240px); opacity: 0; }
            60% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(0); opacity: 0; }
        }
        
        @keyframes scanHorizontal {
            0% { transform: translateX(0); opacity: 0; }
            10% { opacity: 1; }
            40% { opacity: 1; }
            50% { transform: translateX(320px); opacity: 0; }
            60% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateX(0); opacity: 0; }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.15; }
        }
    `}</style>
                </div>

                {errorMessage && (
                    <div className="mt-4 text-red-500 text-center">
                        {errorMessage}
                    </div>
                )}

                {passportData && (
                    <div className="mt-6 w-80 bg-gray-800 rounded-lg p-4 text-sm">

                        <h3 className="text-white font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                            Extracted Information
                        </h3>
                        <div className="space-y-3 text-gray-300">
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">First Name:</label>
                                <input
                                    type="text"
                                    value={editedPassportData?.first_name || ''}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">Last Name:</label>
                                <input
                                    type="text"
                                    value={editedPassportData?.last_name || ''}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">Passport Number:</label>
                                <input
                                    type="text"
                                    value={editedPassportData?.passportNumber?.replace(/</g, '') || ''}
                                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                                    className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">Gender:</label>
                                <div className="relative">
                                    <select
                                        value={editedPassportData?.gender || 'M'}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className="appearance-none bg-gray-700 text-white px-3 py-2 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                    >
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">Date of Birth:</label>
                                <input
                                    type="text"
                                    value={editedPassportData?.dateOfBirth || ''}
                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                    placeholder="DD-MM-YYYY"
                                    className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">Country:</label>
                                <div className="relative">
                                    <select
                                        value={editedPassportData?.country || ''}
                                        onChange={(e) => handleInputChange('country', e.target.value)}
                                        className="bg-gray-700 text-white px-3 py-2 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full"
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country, index) => (
                                            <option key={index} value={country.country_name}>
                                                {country.country_name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs mb-1">Document Type:</label>
                                <input
                                    type="text"
                                    value={editedPassportData?.documentType || ''}
                                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                                    className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {editedPassportData?.tckNumber !== null && (
                                <div className="flex flex-col">
                                    <label className="text-gray-400 text-xs mb-1">TCK Number:</label>
                                    <input
                                        type="text"
                                        value={editedPassportData?.tckNumber || ''}
                                        onChange={(e) => handleInputChange('tckNumber', e.target.value)}
                                        className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleRescan}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium transition-colors"
                            >
                                Rescan
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={isAddingGuest}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium transition-colors flex items-center justify-center"
                            >
                                {isAddingGuest ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Continue'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>

            {isScanning && !isProcessing && !passportData && (
                <>
                    {!errorMessage ? (
                        <>
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

                            {/* <button
                                onClick={testWithImageFile}
                                className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50"
                                type="button"
                            >
                                Test Image Upload
                            </button> */}

                        </>
                    ) : (
                        <button
                            onClick={handleRescan}
                            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full font-medium transition-colors z-50 w-25 h-25 text-xl"
                        >
                            Rescan
                        </button>
                    )}
                </>
            )}


            <SocketLoadingModal
                isOpen={showSocketModal.current}
                kbsSocketInfo={socketInfo}
                status={socketStatus}
                onClose={onCloseModal}
            />
        </>
    );
}