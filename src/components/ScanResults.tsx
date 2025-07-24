import { ScannedData } from './DocumentScanner';

interface ScanResultsProps {
  data: ScannedData;
  onRescan: () => void;
}

export default function ScanResults({ data, onRescan }: ScanResultsProps) {
  const handleConfirm = (): void => {
    // Handle data submission to backend
    console.log('Submitting data:', data);
    // You would typically send this to your API here
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-center mb-8">
          Scan Results
        </h1>
        
        {/* Document Image */}
        <div className="mb-6">
          <img
            src={data.imageUrl}
            alt="Scanned document"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-700"
          />
        </div>
        
        {/* Extracted Data */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
          <h2 className="text-lg font-medium mb-4">Extracted Information</h2>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-gray-400">Document Number</label>
              <p className="text-white font-medium">{data.documentNumber}</p>
            </div>
            
            <div>
              <label className="text-gray-400">First Name</label>
              <p className="text-white font-medium">{data.firstName}</p>
            </div>
            
            <div>
              <label className="text-gray-400">Last Name</label>
              <p className="text-white font-medium">{data.lastName}</p>
            </div>
            
            <div>
              <label className="text-gray-400">Nationality</label>
              <p className="text-white font-medium">{data.nationality}</p>
            </div>
            
            <div>
              <label className="text-gray-400">Date of Birth</label>
              <p className="text-white font-medium">{data.dateOfBirth}</p>
            </div>
            
            <div>
              <label className="text-gray-400">Expiry Date</label>
              <p className="text-white font-medium">{data.expiryDate}</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-medium text-lg transition-colors"
          >
            Confirm & Submit
          </button>
          
          <button
            onClick={onRescan}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-full font-medium text-lg transition-colors"
          >
            Rescan Document
          </button>
        </div>
      </div>
    </div>
  );
}
