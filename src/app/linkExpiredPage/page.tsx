import Image from "next/image";

export default function linkExpiredPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
            <div className="flex items-center justify-center w-75 h-20 mb-6">
                <Image
                    width={105}
                    height={20}
                    src="/images/linkExpire.svg"
                    alt="Logo"
                />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Link Expired</h1>
            <p className="text-xs text-gray-600 max-w-sm">
                Looks like this link has expired or been used. Ask your host to send a new one to continue your check-in.
            </p>
        </div>
    );
}
