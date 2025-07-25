import Image from "next/image";

export default function checkedin() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
            <div className="flex items-center justify-center w-75 h-20 mb-6">
                <Image
                    width={105}
                    height={20}
                    src="/images/checkedin.svg"
                    alt="Logo"
                />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Check-In Complete!</h1>
            <p className="text-xs text-gray-600 max-w-sm">
                Thank you. Your documents were submitted successfully.
            </p>
        </div>
    );
}
