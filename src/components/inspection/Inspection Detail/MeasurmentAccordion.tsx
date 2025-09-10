import { Ruler } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { capitalizeFirstLetter } from "../../../helpers/helper";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { FormField, FormItem, FormMessage } from "../../ui/form";
import MediaUpload from "../components/MediaUpload/MediaUpload";
import { formSchema, type MediaItem } from "../components/utils/fileUpload";

interface MeasurementSketchAccordionProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  isReadOnly: boolean;
}

const MeasurementSketchAccordion = ({ form, isReadOnly }: MeasurementSketchAccordionProps) => {
  return (
    <AccordionItem
      value="measurement-sketch"
      className="border border-gray-200 rounded-lg"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">
            Measurement Sketch
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
        <FormField
          control={form.control}
          name="measurement_sketch"
          render={({ field }) => (
            <FormItem>
              <MediaUpload
                label="Upload Measurement Sketch"
                multiple={false}
                allowedTypes={["image", "video"]}
                value={field.value as MediaItem | undefined}
                onChange={(newMedia) => {
                  field.onChange(newMedia);
                }}
                inspectionStatus={form.watch("inspection_status")}
                isReadOnly={isReadOnly}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="custom_measurement_notes"
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel className="text-gray-700 text-xs font-medium">
                📝 Notes
              </FormLabel> */}
              <textarea
                className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter any Notes"
                {...field}
                disabled={isReadOnly}
                onChange={(e) => {
                  field.onChange(
                    capitalizeFirstLetter(e.target.value)
                  );
                }}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default MeasurementSketchAccordion;