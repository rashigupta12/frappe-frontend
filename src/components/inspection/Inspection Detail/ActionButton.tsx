import { Button } from "../../ui/button";

interface ActionButtonsProps {
  isReadOnly: boolean;
  loading: boolean;
  storeLoading: boolean;
  isUpdateMode: boolean;
  displayData: {
    showTodoActions: boolean;
  };
  cancelling: boolean;
  onSubmit: () => void;
  onCancelTodo: () => void;
}

const ActionButtons = ({
  isReadOnly,
  loading,
  storeLoading,
  isUpdateMode,
  displayData,
  cancelling,
  onSubmit,
  onCancelTodo,
}: ActionButtonsProps) => {
  if (isReadOnly) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      <Button
        type="submit"
        disabled={loading || storeLoading}
        onClick={onSubmit}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {isUpdateMode ? "Updating..." : "Creating..."}
          </>
        ) : (
          <>
            {isUpdateMode
              ? "Update Inspection"
              : "Create Inspection"}
          </>
        )}
      </Button>

      {displayData.showTodoActions && (
        <Button
          type="button"
          variant="outline"
          disabled={cancelling}
          onClick={onCancelTodo}
          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium py-2 px-4 rounded-md transition-colors"
        >
          {cancelling ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              Cancelling...
            </>
          ) : (
            "Cancel Inspection"
          )}
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;