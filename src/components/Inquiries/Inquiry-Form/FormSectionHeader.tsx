// src/components/FormSectionHeader.tsx

import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { FormSection } from "../../../helpers/helper";
import React from "react";

interface FormSectionHeaderProps {
  section: FormSection;
  activeSection: string;
  onToggle: (sectionId: string) => void;
}

export const FormSectionHeader: React.FC<FormSectionHeaderProps> = ({
  section,
  activeSection,
  onToggle,
}) => {
  const isActive = activeSection === section.id;
  const isCompleted = section.completed;

  return (
    <button
      type="button"
      className={`w-full flex justify-between items-center p-5 transition-all duration-300 ease-in-out border-b border-gray-200 
        ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}
      `}
      onClick={() => onToggle(section.id)}
    >
      <div className="flex items-center gap-4">
        <div
          className={`h-9 w-9 flex items-center justify-center rounded-full transition-colors duration-300
            ${isActive ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}
          `}
        >
          {section.icon}
        </div>
        <div className="flex items-center gap-2">
          <h4
            className={`text-base font-semibold transition-colors duration-300
              ${isActive ? "text-emerald-700" : "text-gray-800"}
            `}
          >
            {section.title}
          </h4>
          {isCompleted && (
            <CheckCircle2
              className={`h-5 w-5 transition-transform duration-300 ${
                isActive ? "text-emerald-700" : "text-emerald-500"
              }`}
            />
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {isActive ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </div>
    </button>
  );
};