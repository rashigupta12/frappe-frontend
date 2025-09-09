import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Button } from "../../ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Popover, PopoverTrigger } from "../../ui/popover";
import { formSchema } from "../components/utils/fileUpload";

interface BasicInfoAccordionProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
}

const BasicInfoAccordion = ({ form }: BasicInfoAccordionProps) => {
  return (
    <AccordionItem
      value="basic"
      className="border border-gray-200 rounded-lg overflow-hidden"
    >
      <AccordionTrigger className="px-5 py-2 hover:no-underline bg-gray-50 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-gray-800">
            Inspection Details
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="bg-white">
        <fieldset disabled>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 px-5 py-2">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="inspection_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 text-sm font-medium">
                      Inspection Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-between text-left font-normal bg-gray-100 border-gray-300 cursor-not-allowed h-10"
                          >
                            {field.value ? (
                              <span className="text-gray-900">
                                {format(field.value, "dd/MM/yyyy")}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                Select date
                              </span>
                            )}
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="inspection_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 text-sm font-medium">
                      Inspection Time
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="time"
                          className="pl-3 bg-gray-100 border-gray-300 text-gray-900 cursor-not-allowed h-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </fieldset>
      </AccordionContent>
    </AccordionItem>
  );
};

export default BasicInfoAccordion;