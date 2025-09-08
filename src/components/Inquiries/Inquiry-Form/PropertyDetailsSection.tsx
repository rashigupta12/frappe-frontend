import PropertyAddressSection from "../../common/PropertyAddress";
import type { LeadFormData } from "../../../context/LeadContext";

interface PropertyDetailsSectionProps {
  formData: LeadFormData;
  handleSelectChange: (name: string, value: string) => void;
}

export const PropertyDetailsSection: React.FC<PropertyDetailsSectionProps> = ({
  formData,
  handleSelectChange,
}) => {
  return (
    <PropertyAddressSection
      formData={formData}
      handleSelectChange={handleSelectChange}
      fieldNames={{
        propertyNumber: "custom_property_name__number",
        emirate: "custom_emirate",
        area: "custom_area",
        community: "custom_community",
        streetName: "custom_street_name",
        propertyArea: "custom_property_area",
        propertyCategory: "custom_property_category",
        propertyType: "custom_property_type",
      }}
    />
  );
};
