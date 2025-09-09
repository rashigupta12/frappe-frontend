import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/button";

interface PageHeaderProps {
  title: string;
  count: number;
  addButtonText: string;
  addButtonLink: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  count,
  addButtonText,
  addButtonLink,
}) => {
  return (
    <div className="flex items-center justify-between mb-3 ">
      <div className="flex items-center gap-3 p-2">
        <h2 className="text-xl pl-2 font-bold text-emerald-800 flex items-center gap-2">
          {title}
          <span className="bg-emerald-50 text-emerald-700 text-sm font-medium px-2 py-0.5 rounded-full border border-emerald-200">
            {count}
          </span>
        </h2>
      </div>
      <div className="flex gap-2">
        <Link to={addButtonLink} className="no-underline">
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-700 text-white rounded-md px-3 py-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            {addButtonText}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PageHeader;