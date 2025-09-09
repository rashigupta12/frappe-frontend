import { Info } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { capitalizeFirstLetter } from "../../../helpers/helper";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { FormControl, FormField, FormItem, FormMessage } from "../../ui/form";
import { Textarea } from "../../ui/textarea";
import { formSchema } from "../components/utils/fileUpload";

interface NotesAccordionProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  isReadOnly: boolean;
}

const NotesAccordion = ({ form, isReadOnly }: NotesAccordionProps) => {
  return (
    <AccordionItem
      value="notes"
      className="border border-gray-200 rounded-lg"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">
            Inspection Notes
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
        <FormField
          control={form.control}
          name="inspection_notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional notes or observations..."
                  disabled={isReadOnly}
                  className="min-h-[100px] bg-white border-gray-300 resize-none"
                  {...field}
                  onChange={(e) => {
                    field.onChange(
                      capitalizeFirstLetter(e.target.value)
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default NotesAccordion;