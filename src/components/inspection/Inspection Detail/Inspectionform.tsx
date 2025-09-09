/* eslint-disable @typescript-eslint/no-explicit-any */

import * as z from "zod";
import {
  Accordion
} from "../../ui/accordion";
import BasicInfoAccordion from "./BasicInfoAccordion";
import CustomImagesAccordion from "./CustomImagesAccordion";

import NotesAccordion from "./NotesAccordion";
import type { UseFormReturn } from "react-hook-form";
import type { formSchema } from "../components/utils/fileUpload";
import SiteDimensionsAccordion from "./SitedimensionAccordion";
import MeasurementSketchAccordion from "./MeasurmentAccordion";


interface InspectionFormProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  fields: any[];
  append: (value: any) => void;
  remove: (index: number) => void;
  isReadOnly: boolean;
  onDeleteAreaDimension: (index: number) => void;
}

const InspectionForm = ({
  form,
  fields,
  append,
  remove,
  isReadOnly,
  onDeleteAreaDimension,
}: InspectionFormProps) => {
  // Memoize default accordion value to prevent recreation
  const defaultAccordionValue = ["dimensions"];

  return (
    <form className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={defaultAccordionValue}
        className="space-y-3"
      >
        {/* Basic Info Accordion */}
        <BasicInfoAccordion form={form} />

        {/* Site Dimensions Section */}
        <SiteDimensionsAccordion
          form={form}
          fields={fields}
          append={append}
          remove={remove}
          isReadOnly={isReadOnly}
          onDeleteAreaDimension={onDeleteAreaDimension}
        />

        {/* Custom Images Section */}
        <CustomImagesAccordion form={form} isReadOnly={isReadOnly} />

        {/* Measurement Sketch Section */}
        <MeasurementSketchAccordion form={form} isReadOnly={isReadOnly} />

        {/* Notes Section */}
        <NotesAccordion form={form} isReadOnly={isReadOnly} />
      </Accordion>
    </form>
  );
};

export default InspectionForm;