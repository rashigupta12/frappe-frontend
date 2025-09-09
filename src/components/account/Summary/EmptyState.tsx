import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  addButtonText: string;
  addButtonLink: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  addButtonText,
  addButtonLink,
}) => {
  return (
    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
      <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <Link to={addButtonLink} className="no-underline">
        <Button
          size="sm"
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          {addButtonText}
        </Button>
      </Link>
    </div>
  );
};

export default EmptyState;