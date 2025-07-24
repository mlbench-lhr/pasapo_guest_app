import { useState, ChangeEvent } from 'react';

interface PrivacyModalProps {
  onAgree: () => void;
}

export default function PrivacyModal({ onAgree }: PrivacyModalProps) {
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setIsChecked(e.target.checked);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white text-black rounded-t-3xl p-6 w-full">
        {/* Expiry Notice */}
        <div className="mb-4">
          <p className="text-red-500 font-medium">Link will expire after 72 hrs.</p>
        </div>
        
        {/* Privacy Text */}
        <div className="mb-6 text-gray-700 text-sm leading-relaxed">
          <p className="mb-3">
            To meet Türkiye's legal guest registration rules, your 
            passport info will be submitted to the police KBS system.
          </p>
          <p className="mb-3">
            Your data is processed securely under KVKK, stored only 
            in Türkiye, and never used for ads or other purposes.
          </p>
          <p className="mb-3">
            It is sent over encrypted channels and kept temporarily 
            for police use only.
          </p>
          <p>
            By continuing, you agree to this use during your stay.
          </p>
        </div>
        
        {/* Checkbox */}
        <div className="mb-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded ${
                isChecked 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-300'
              }`}>
                {isChecked && (
                  <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-blue-500 text-sm">
              I agree to the use of my personal data under KVKK.
            </span>
          </label>
        </div>
        
        {/* Agree Button */}
        <button
          onClick={onAgree}
          disabled={!isChecked}
          className={`w-full py-4 rounded-full text-white font-medium text-lg ${
            isChecked 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-300 cursor-not-allowed'
          } transition-colors`}
        >
          Agree & Continue
        </button>
      </div>
    </div>
  );
}