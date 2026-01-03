import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Product Categories' },
    { number: 2, label: 'Item Categories' },
    { number: 3, label: 'Sub-Categories' },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const isUpcoming = currentStep < step.number;

        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Step Circle */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                {/* Step Label */}
                <div className="ml-3 flex-1">
                  <div
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    Step {step.number}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              </div>
            </div>
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;

