// InspectionHeader.tsx
interface InspectionHeaderProps {
  inProgressCount: number;
  pendingCount: number;
  totalCount: number;
}

export const InspectionHeader = ({
  inProgressCount,
  pendingCount,
  totalCount,
}: InspectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <h1 className="text-lg lg:text-xl font-bold text-gray-900">Inspections</h1>
      <div className="flex items-center space-x-2 text-xs lg:text-sm">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
          P {inProgressCount}
        </span>
        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
          S {pendingCount}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
          Total {totalCount}
        </span>
      </div>
    </div>
  );
};