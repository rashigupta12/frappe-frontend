import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { FormSection } from "../../../helpers/helper";


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
  return (
    <button
      type="button"
      className={`w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors ${
        activeSection === section.id ? "bg-gray-50" : ""
      }`}
      onClick={() => onToggle(section.id)}
    >
      <div className="flex items-center gap-3">
        {section.icon}
        <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
          {section.title}
        </h4>
        {section.completed && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
      </div>
      {activeSection === section.id ? (
        <ChevronUp className="h-4 w-4 text-gray-500" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-500" />
      )}
    </button>
  );
};