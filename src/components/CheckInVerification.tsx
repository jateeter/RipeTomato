import React, { useState, useRef } from 'react';
import { BedReservation, CheckInSession } from '../types/Shelter';

interface CheckInVerificationProps {
  reservation: BedReservation;
  onCheckInComplete: (session: CheckInSession) => void;
  onCancel: () => void;
}

const CheckInVerification: React.FC<CheckInVerificationProps> = ({
  reservation,
  onCheckInComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [session, setSession] = useState<CheckInSession>({
    id: `checkin-${Date.now()}`,
    reservationId: reservation.id,
    clientId: reservation.clientId,
    startTime: new Date(),
    status: 'in-progress',
    verificationSteps: {
      identityVerified: false,
      photoTaken: false,
      rulesAcknowledged: false,
      medicalScreening: false,
      belongingsChecked: false
    }
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      id: 'identity',
      title: 'Identity Verification',
      description: 'Verify client identity with ID or photo',
      icon: '🪪'
    },
    {
      id: 'photo',
      title: 'Check-in Photo',
      description: 'Take a photo for tonight\'s records',
      icon: '📸'
    },
    {
      id: 'rules',
      title: 'Rules Acknowledgment',
      description: 'Client acknowledges shelter rules',
      icon: '📋'
    },
    {
      id: 'medical',
      title: 'Medical Screening',
      description: 'Basic health and wellness check',
      icon: '🏥'
    },
    {
      id: 'belongings',
      title: 'Belongings Check',
      description: 'Review and secure personal items',
      icon: '🎒'
    }
  ];

  const updateVerificationStep = (step: keyof CheckInSession['verificationSteps'], value: boolean) => {
    setSession(prev => ({
      ...prev,
      verificationSteps: {
        ...prev.verificationSteps,
        [step]: value
      }
    }));
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
        updateVerificationStep('photoTaken', true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepComplete = (stepId: string) => {
    const stepMapping: { [key: string]: keyof CheckInSession['verificationSteps'] } = {
      'identity': 'identityVerified',
      'photo': 'photoTaken',
      'rules': 'rulesAcknowledged',
      'medical': 'medicalScreening',
      'belongings': 'belongingsChecked'
    };

    const sessionKey = stepMapping[stepId];
    if (sessionKey) {
      updateVerificationStep(sessionKey, true);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeCheckIn();
    }
  };

  const completeCheckIn = () => {
    const completedSession: CheckInSession = {
      ...session,
      completedTime: new Date(),
      status: 'completed',
      notes
    };

    onCheckInComplete(completedSession);
  };

  const isStepComplete = (stepId: string) => {
    const stepMapping: { [key: string]: keyof CheckInSession['verificationSteps'] } = {
      'identity': 'identityVerified',
      'photo': 'photoTaken',
      'rules': 'rulesAcknowledged',
      'medical': 'medicalScreening',
      'belongings': 'belongingsChecked'
    };

    const sessionKey = stepMapping[stepId];
    return sessionKey ? session.verificationSteps[sessionKey] : false;
  };

  const allStepsComplete = Object.values(session.verificationSteps).every(Boolean);
  const currentStepData = steps[currentStep];

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'identity':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">Please verify the client's identity using one of the following methods:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleStepComplete('identity')}
                className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-2xl mb-2">🪪</div>
                <div className="font-medium">Government ID</div>
                <div className="text-sm text-gray-500">Driver's license, state ID, etc.</div>
              </button>
              <button
                onClick={() => handleStepComplete('identity')}
                className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-medium">Staff Recognition</div>
                <div className="text-sm text-gray-500">Staff member recognizes client</div>
              </button>
            </div>
          </div>
        );

      case 'photo':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">Take a check-in photo for tonight's records:</p>
            
            <div className="flex flex-col items-center space-y-4">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Client check-in"
                    className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    onClick={() => {
                      setPhotoPreview(null);
                      updateVerificationStep('photoTaken', false);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-2">📸</div>
                    <p className="text-gray-500">No photo taken</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoCapture}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {photoPreview ? 'Retake Photo' : 'Take Photo'}
              </button>

              {photoPreview && (
                <button
                  onClick={() => handleStepComplete('photo')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Use This Photo
                </button>
              )}
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Shelter Rules & Policies</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 max-h-64 overflow-y-auto">
              <div className="text-sm space-y-2">
                <p><strong>Check-in:</strong> Must check in by 7:00 PM. Late arrivals subject to availability.</p>
                <p><strong>Check-out:</strong> Must vacate by 7:00 AM. Personal items left behind will be disposed of.</p>
                <p><strong>Conduct:</strong> Respectful behavior required. No violence, threats, or disruptive behavior.</p>
                <p><strong>Substances:</strong> No alcohol or illegal substances on premises.</p>
                <p><strong>Visitors:</strong> No visitors allowed in sleeping areas.</p>
                <p><strong>Personal Items:</strong> Shelter not responsible for lost or stolen items.</p>
                <p><strong>Medical:</strong> Report any medical concerns to staff immediately.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rules-acknowledgment"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleStepComplete('rules');
                  }
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor="rules-acknowledgment" className="text-sm">
                Client acknowledges understanding and agrees to follow all shelter rules
              </label>
            </div>
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Medical Screening</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Any symptoms?
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="none">None</option>
                    <option value="cold">Cold symptoms</option>
                    <option value="flu">Flu-like symptoms</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="medical-clear" className="rounded border-gray-300" />
                  <label htmlFor="medical-clear" className="text-sm">Client appears medically stable</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="medical-meds" className="rounded border-gray-300" />
                  <label htmlFor="medical-meds" className="text-sm">Medications secured (if applicable)</label>
                </div>
              </div>

              <button
                onClick={() => handleStepComplete('medical')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Medical Check
              </button>
            </div>
          </div>
        );

      case 'belongings':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Belongings Check</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="bag-searched" className="rounded border-gray-300" />
                    <label htmlFor="bag-searched" className="text-sm">Bags inspected</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="prohibited-items" className="rounded border-gray-300" />
                    <label htmlFor="prohibited-items" className="text-sm">No prohibited items</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="valuables-secured" className="rounded border-gray-300" />
                    <label htmlFor="valuables-secured" className="text-sm">Valuables secured</label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="bedding-issued" className="rounded border-gray-300" />
                    <label htmlFor="bedding-issued" className="text-sm">Clean bedding issued</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="locker-assigned" className="rounded border-gray-300" />
                    <label htmlFor="locker-assigned" className="text-sm">Storage locker assigned</label>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStepComplete('belongings')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Belongings Check
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Check-In Verification</h1>
            <p className="text-blue-100">Bed {reservation.bedId} • Client ID: {reservation.clientId}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-blue-100 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center space-y-1 ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                isStepComplete(step.id)
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}>
                {isStepComplete(step.id) ? '✓' : step.icon}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{currentStepData.title}</h2>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>

        {renderStepContent()}

        {/* Notes Section */}
        {currentStep === steps.length - 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this check-in..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-none"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-6 bg-gray-50 rounded-b-lg flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel Check-In
        </button>

        <div className="space-x-2">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
          )}

          {allStepsComplete && currentStep === steps.length - 1 ? (
            <button
              onClick={completeCheckIn}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Complete Check-In
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
              disabled={currentStep >= steps.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInVerification;