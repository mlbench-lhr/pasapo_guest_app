interface SocketLoadingModalProps {
    isOpen: boolean;
    kbsSocketInfo: string;
    status: string;
    onClose: () => void;
}

export default function SocketLoadingModal({ isOpen, kbsSocketInfo, status, onClose }: SocketLoadingModalProps) {
    if (!isOpen) return null;

    const isFailed = status === 'failed';
    const isPassed = status === 'checkedin';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
                <div className="mb-4">
                    {!isFailed && !isPassed ? (
                        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    ) : isPassed ? (
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {isFailed ? 'Check-in Failed' : isPassed ? 'Check-in Successful' : 'Processing your passport scan...'}
                    </h3>
                    {isFailed && (
                        <p className="text-sm text-gray-600 mb-4">
                            Please Contact Your Property Host
                        </p>
                    )}
                    {isPassed && (
                        <p className="text-sm text-gray-600 mb-4">
                            Your passport scan was processed successfully
                        </p>
                    )}
                </div>

                {kbsSocketInfo && (
                    <div className=" p-3 rounded-lg mb-4">
                        <p className="text-lg font-medium text-gray-700 mb-1">KBS Socket Info:</p>
                        <p className="text-lg text-gray-600 break-all">{kbsSocketInfo}</p>
                    </div>
                )}

                {(isFailed || isPassed) && (
                    <button
                        onClick={onClose}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}