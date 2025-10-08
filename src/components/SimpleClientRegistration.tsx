/**
 * Simple Client Registration Component
 *
 * iPad-optimized interface for homeless population
 * - Large touch targets (minimum 60px)
 * - Simple, linear workflow
 * - Clear, non-technical language
 * - Progress indicators
 * - Auto-save on each step
 * - Works on 5G-only connectivity
 */

import React, { useState } from 'react';
import {
  MinimalClientInput,
  AugmentedClientProfile,
  simpleClientRegistration
} from '../services/simpleClientRegistration';

interface RegistrationStep {
  step: number;
  title: string;
  description: string;
}

const REGISTRATION_STEPS: RegistrationStep[] = [
  {
    step: 1,
    title: "What's your name?",
    description: "We just need your first name. You can share more if you're comfortable."
  },
  {
    step: 2,
    title: "How long have you been on the streets?",
    description: "This helps us find the right services for you."
  },
  {
    step: 3,
    title: "Do you have children?",
    description: "We have special family services available."
  },
  {
    step: 4,
    title: "Do you have a partner or spouse?",
    description: "We can help couples stay together."
  },
  {
    step: 5,
    title: "Do you have family you can contact?",
    description: "Family support can make a big difference."
  },
  {
    step: 6,
    title: "How can we reach you?",
    description: "Optional - only if you want us to contact you."
  }
];

export const SimpleClientRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<MinimalClientInput>>({
    hasChildren: false,
    hasPartner: false,
    hasOtherFamily: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [clientProfile, setClientProfile] = useState<AugmentedClientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-save to localStorage on each step
  const saveProgress = (data: Partial<MinimalClientInput>) => {
    localStorage.setItem('registration_in_progress', JSON.stringify(data));
  };

  // Load saved progress (if iPad browser refreshed)
  React.useEffect(() => {
    const saved = localStorage.getItem('registration_in_progress');
    if (saved) {
      const data = JSON.parse(saved);
      setFormData(data);
      // Resume at last complete step
      if (data.firstName) setCurrentStep(2);
      if (data.streetDuration) setCurrentStep(3);
      if (data.hasChildren !== undefined) setCurrentStep(4);
      if (data.hasPartner !== undefined) setCurrentStep(5);
      if (data.hasOtherFamily !== undefined) setCurrentStep(6);
    }
  }, []);

  const handleNext = () => {
    saveProgress(formData);
    setCurrentStep(prev => Math.min(prev + 1, REGISTRATION_STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate minimum required fields
      if (!formData.firstName) {
        throw new Error('First name is required');
      }
      if (!formData.streetDuration) {
        throw new Error('Street duration is required');
      }
      if (formData.hasChildren === undefined) {
        throw new Error('Please answer about children');
      }
      if (formData.hasPartner === undefined) {
        throw new Error('Please answer about partner');
      }
      if (formData.hasOtherFamily === undefined) {
        throw new Error('Please answer about family');
      }

      // Register client (all complexity hidden)
      const profile = await simpleClientRegistration.registerClient(formData as MinimalClientInput);

      // Clear saved progress
      localStorage.removeItem('registration_in_progress');

      // Show success
      setClientProfile(profile);
      setRegistrationComplete(true);

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationComplete && clientProfile) {
    return <RegistrationSuccess profile={clientProfile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 md:p-12">
      {/* iPad-optimized container */}
      <div className="max-w-3xl mx-auto">

        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-semibold text-gray-700">
              Step {currentStep} of {REGISTRATION_STEPS.length}
            </span>
            <span className="text-lg text-gray-500">
              {Math.round((currentStep / REGISTRATION_STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / REGISTRATION_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current step content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {REGISTRATION_STEPS[currentStep - 1].title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12">
            {REGISTRATION_STEPS[currentStep - 1].description}
          </p>

          {/* Step-specific content */}
          {renderStepContent(currentStep, formData, setFormData)}

          {/* Error message */}
          {error && (
            <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
              <p className="text-xl text-red-700">{error}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-12">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 h-20 text-2xl font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
                style={{ minHeight: '60px' }}
              >
                ← Back
              </button>
            )}

            {currentStep < REGISTRATION_STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={!isStepComplete(currentStep, formData)}
                className="flex-1 h-20 text-2xl font-semibold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                style={{ minHeight: '60px' }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isStepComplete(currentStep, formData)}
                className="flex-1 h-20 text-2xl font-semibold text-white bg-green-600 rounded-2xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                style={{ minHeight: '60px' }}
              >
                {isSubmitting ? 'Registering...' : 'Complete Registration ✓'}
              </button>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="mt-8 text-center">
          <p className="text-xl text-gray-500">
            Need help? Ask any staff member for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Render step-specific content
 */
function renderStepContent(
  step: number,
  data: Partial<MinimalClientInput>,
  setData: React.Dispatch<React.SetStateAction<Partial<MinimalClientInput>>>
) {
  switch (step) {
    case 1: // Name
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-2xl font-semibold text-gray-700 mb-4">
              First Name *
            </label>
            <input
              type="text"
              value={data.firstName || ''}
              onChange={(e) => setData({ ...data, firstName: e.target.value })}
              placeholder="Enter your first name"
              className="w-full h-20 px-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
              style={{ minHeight: '60px' }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-2xl font-semibold text-gray-700 mb-4">
              Last Name (Optional)
            </label>
            <input
              type="text"
              value={data.lastName || ''}
              onChange={(e) => setData({ ...data, lastName: e.target.value })}
              placeholder="Optional"
              className="w-full h-20 px-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
              style={{ minHeight: '60px' }}
            />
          </div>

          <div>
            <label className="block text-2xl font-semibold text-gray-700 mb-4">
              What name do you prefer? (Optional)
            </label>
            <input
              type="text"
              value={data.preferredName || ''}
              onChange={(e) => setData({ ...data, preferredName: e.target.value })}
              placeholder="What should we call you?"
              className="w-full h-20 px-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
              style={{ minHeight: '60px' }}
            />
          </div>
        </div>
      );

    case 2: // Street duration
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'first-time', label: 'This is my first time', icon: '🆕' },
            { value: 'less-than-month', label: 'Less than a month', icon: '📅' },
            { value: '1-6-months', label: '1 to 6 months', icon: '📆' },
            { value: '6-12-months', label: '6 months to a year', icon: '🗓️' },
            { value: 'over-year', label: 'Over a year', icon: '⏳' },
            { value: 'chronic', label: 'Several years', icon: '⌛' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setData({ ...data, streetDuration: option.value as any })}
              className={`h-28 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                data.streetDuration === option.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ minHeight: '80px' }}
            >
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl">{option.icon}</span>
                <span>{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      );

    case 3: // Children
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setData({ ...data, hasChildren: false, childrenWithClient: undefined, childrenElsewhere: undefined })}
              className={`h-24 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                data.hasChildren === false
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ minHeight: '60px' }}
            >
              No
            </button>
            <button
              onClick={() => setData({ ...data, hasChildren: true })}
              className={`h-24 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                data.hasChildren === true
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ minHeight: '60px' }}
            >
              Yes
            </button>
          </div>

          {data.hasChildren && (
            <div className="space-y-6 mt-8 p-6 bg-blue-50 rounded-2xl">
              <div>
                <label className="block text-2xl font-semibold text-gray-700 mb-4">
                  How many children are with you now?
                </label>
                <input
                  type="number"
                  min="0"
                  value={data.childrenWithClient || 0}
                  onChange={(e) => setData({ ...data, childrenWithClient: parseInt(e.target.value) || 0 })}
                  className="w-full h-20 px-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div>
                <label className="block text-2xl font-semibold text-gray-700 mb-4">
                  How many children are somewhere else?
                </label>
                <input
                  type="number"
                  min="0"
                  value={data.childrenElsewhere || 0}
                  onChange={(e) => setData({ ...data, childrenElsewhere: parseInt(e.target.value) || 0 })}
                  className="w-full h-20 px-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                  style={{ minHeight: '60px' }}
                />
              </div>
            </div>
          )}
        </div>
      );

    case 4: // Partner
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setData({ ...data, hasPartner: false, partnerWithClient: undefined })}
              className={`h-24 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                data.hasPartner === false
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ minHeight: '60px' }}
            >
              No
            </button>
            <button
              onClick={() => setData({ ...data, hasPartner: true })}
              className={`h-24 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                data.hasPartner === true
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ minHeight: '60px' }}
            >
              Yes
            </button>
          </div>

          {data.hasPartner && (
            <div className="space-y-4 mt-8 p-6 bg-blue-50 rounded-2xl">
              <p className="text-2xl font-semibold text-gray-700 mb-4">
                Is your partner with you?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setData({ ...data, partnerWithClient: false })}
                  className={`h-20 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                    data.partnerWithClient === false
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  No
                </button>
                <button
                  onClick={() => setData({ ...data, partnerWithClient: true })}
                  className={`h-20 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                    data.partnerWithClient === true
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  Yes
                </button>
              </div>
            </div>
          )}
        </div>
      );

    case 5: // Other family
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setData({ ...data, hasOtherFamily: false, familyContact: undefined })}
              className={`h-24 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                data.hasOtherFamily === false
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ minHeight: '60px' }}
            >
              No
            </button>
            <button
              onClick={() => setData({ ...data, hasOtherFamily: true })}
              className={`h-24 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                data.hasOtherFamily === true
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ minHeight: '60px' }}
            >
              Yes
            </button>
          </div>

          {data.hasOtherFamily && (
            <div className="space-y-4 mt-8 p-6 bg-blue-50 rounded-2xl">
              <p className="text-2xl font-semibold text-gray-700 mb-4">
                Can we help you contact them?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setData({ ...data, familyContact: 'yes' })}
                  className={`h-20 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                    data.familyContact === 'yes'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setData({ ...data, familyContact: 'maybe' })}
                  className={`h-20 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                    data.familyContact === 'maybe'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  Maybe
                </button>
                <button
                  onClick={() => setData({ ...data, familyContact: 'no' })}
                  className={`h-20 px-6 text-2xl font-semibold rounded-2xl border-4 transition-all ${
                    data.familyContact === 'no'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      );

    case 6: // Contact info
      return (
        <div className="space-y-6">
          <p className="text-xl text-gray-600 mb-6">
            This is completely optional. We'll only use this to contact you about services.
          </p>

          <div>
            <label className="block text-2xl font-semibold text-gray-700 mb-4">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={data.phoneNumber || ''}
              onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
              placeholder="(Optional)"
              className="w-full h-20 px-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
              style={{ minHeight: '60px' }}
            />
          </div>

          <div>
            <label className="block text-2xl font-semibold text-gray-700 mb-4">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="(Optional)"
              className="w-full h-20 px-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
              style={{ minHeight: '60px' }}
            />
          </div>

          <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-2xl">
            <p className="text-xl text-green-800">
              ✓ You're ready to complete registration! Click the green button below.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Check if current step is complete
 */
function isStepComplete(step: number, data: Partial<MinimalClientInput>): boolean {
  switch (step) {
    case 1:
      return !!data.firstName && data.firstName.trim().length > 0;
    case 2:
      return !!data.streetDuration;
    case 3:
      return data.hasChildren !== undefined;
    case 4:
      return data.hasPartner !== undefined;
    case 5:
      return data.hasOtherFamily !== undefined;
    case 6:
      return true; // Contact info is always optional
    default:
      return false;
  }
}

/**
 * Registration Success Component
 */
const RegistrationSuccess: React.FC<{ profile: AugmentedClientProfile }> = ({ profile }) => {
  const handleViewServices = () => {
    // Navigate to client dashboard
    if (window.setActiveView) {
      window.setActiveView('client-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
          {/* Success icon */}
          <div className="w-32 h-32 mx-auto mb-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-6xl">✓</span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome, {profile.clientInput.preferredName || profile.clientInput.firstName}!
          </h1>

          <p className="text-2xl text-gray-600 mb-12">
            Your registration is complete. We've found some services that can help you right away.
          </p>

          {/* Your ID */}
          <div className="mb-12 p-8 bg-blue-50 rounded-2xl">
            <p className="text-xl text-gray-700 mb-2">Your ID:</p>
            <p className="text-4xl font-bold text-blue-600">{profile.clientId}</p>
            <p className="text-lg text-gray-600 mt-4">
              Show this to staff when you visit services
            </p>
          </div>

          {/* Priority level indicator */}
          <div className={`mb-12 p-8 rounded-2xl ${
            profile.riskProfile.urgency === 'critical' ? 'bg-red-50 border-4 border-red-300' :
            profile.riskProfile.urgency === 'high' ? 'bg-orange-50 border-4 border-orange-300' :
            profile.riskProfile.urgency === 'moderate' ? 'bg-yellow-50 border-4 border-yellow-300' :
            'bg-green-50 border-4 border-green-300'
          }`}>
            <p className="text-2xl font-semibold mb-4">
              {profile.riskProfile.urgency === 'critical' ? '🚨 Urgent Help Available' :
               profile.riskProfile.urgency === 'high' ? '⚠️ High Priority Services' :
               profile.riskProfile.urgency === 'moderate' ? '📋 Services Ready for You' :
               '✅ Services Available'}
            </p>
          </div>

          {/* Top recommendations */}
          <div className="mb-12 text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Recommended Services:
            </h2>
            <div className="space-y-4">
              {profile.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center text-3xl ${
                      rec.priority === 'immediate' ? 'bg-red-100' :
                      rec.priority === 'high' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      {rec.serviceType === 'shelter' ? '🏠' :
                       rec.serviceType === 'meals' ? '🍽️' :
                       rec.serviceType === 'family-services' ? '👨‍👩‍👧‍👦' :
                       rec.serviceType === 'health' ? '🏥' :
                       rec.serviceType === 'counseling' ? '💬' :
                       '💼'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        {rec.providerName}
                      </h3>
                      <p className="text-xl text-gray-700 mb-2">{rec.reason}</p>
                      <p className="text-lg text-gray-600">📍 {rec.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleViewServices}
            className="w-full h-24 text-3xl font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-colors mb-6"
            style={{ minHeight: '80px' }}
          >
            View All Services →
          </button>

          <p className="text-xl text-gray-500">
            Staff are here to help. Don't hesitate to ask questions!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleClientRegistration;
