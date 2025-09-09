import { FileText } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { capitalizeFirstLetter } from "../../../helpers/helper";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import MediaUpload from "../components/MediaUpload/MediaUpload";
import { formSchema, type MediaItem } from "../components/utils/fileUpload";

interface CustomImagesAccordionProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  isReadOnly: boolean;
}

const CustomImagesAccordion = ({ form, isReadOnly }: CustomImagesAccordionProps) => {
  return (
    <AccordionItem
      value="custom-images"
      className="border border-gray-200 rounded-lg"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">
            Custom Images/Media
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
        <FormField
          control={form.control}
          name="custom_site_images"
          render={({ field }) => (
            <FormItem>
              <MediaUpload
                label="Additional Site Images/Media"
                multiple={true}
                allowedTypes={["image", "video"]}
                value={field.value as MediaItem[] | undefined}
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
          name="custom_site_images_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 text-xs font-medium">
                📝 Notes
              </FormLabel>
              <textarea
                className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter any notes"
                {...field}
                disabled={isReadOnly}
                onChange={(e) => {
                  field.onChange(
                    capitalizeFirstLetter(e.target.value)
                  );
                }}
              />
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default CustomImagesAccordion;