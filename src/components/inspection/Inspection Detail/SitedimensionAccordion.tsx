/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plus, PlusCircle, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { capitalizeFirstLetter } from "../../../helpers/helper";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Button } from "../../ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import MediaUpload from "../components/MediaUpload/MediaUpload";
import { formSchema, type MediaItem } from "../components/utils/fileUpload";

interface SiteDimensionsAccordionProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  fields: any[];
  append: (value: any) => void;
  remove: (index: number) => void;
  isReadOnly: boolean;
  onDeleteAreaDimension: (index: number) => void;
}

const SiteDimensionsAccordion = ({
  form,
  fields,
  append,
  // remove,
  isReadOnly,
  onDeleteAreaDimension,
}: SiteDimensionsAccordionProps) => {
  const handleAppendDimension = () => {
    append({
      area_name: "",
      dimensionsunits: "",
      images: [],
      media_2: undefined,
    });
  };

  const handleDeleteAreaDimension = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    e.stopPropagation();
    onDeleteAreaDimension(index);
  };

  return (
    <AccordionItem
      value="dimensions"
      className="border border-gray-200 rounded-lg"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">Site Dimensions</span>
          <span className="text-sm text-gray-500">
            ({fields.length} areas)
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 bg-white rounded-b-lg">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              {/* Header with Area Name and Delete Button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 text-sm bg-white px-2 py-1 rounded">
                    Area {index + 1}
                  </span>
                  <span className="text-xs text-gray-500">
                    {form.watch(`site_dimensions.${index}.room`) || ""}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isReadOnly}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                  onClick={(e) => handleDeleteAreaDimension(e, index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Compact Form Grid */}
              <div className="space-y-3">
                {/* Row 1: Floor and Room */}
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    control={form.control}
                    name={`site_dimensions.${index}.floor`}
                    render={({ field: floorField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-xs font-medium">
                          Line 1
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Line 1"
                            disabled={isReadOnly}
                            className="bg-white border-gray-300 h-8 text-sm"
                            {...floorField}
                            onChange={(e) => {
                              floorField.onChange(
                                capitalizeFirstLetter(e.target.value)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`site_dimensions.${index}.room`}
                    render={({ field: roomField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-xs font-medium">
                          Line 2
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Line 2"
                            disabled={isReadOnly}
                            className="bg-white border-gray-300 h-8 text-sm"
                            {...roomField}
                            onChange={(e) => {
                              roomField.onChange(
                                capitalizeFirstLetter(e.target.value)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Entity and Area Name */}
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    control={form.control}
                    name={`site_dimensions.${index}.area_name`}
                    render={({ field: areaNameField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-xs font-medium">
                          Item Name{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Right side"
                            disabled={isReadOnly}
                            className="bg-white border-gray-300 h-8 text-sm"
                            {...areaNameField}
                            onChange={(e) => {
                              areaNameField.onChange(
                                capitalizeFirstLetter(e.target.value)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`site_dimensions.${index}.dimensionsunits`}
                    render={({ field: dimensionsField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-xs font-medium">
                          Dimensions/Units{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="e.g., 10x12 ft"
                            disabled={isReadOnly}
                            className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm min-h-[80px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            rows={3}
                            {...dimensionsField}
                            onChange={(e) => {
                              dimensionsField.onChange(
                                capitalizeFirstLetter(e.target.value)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Media Upload - Compact Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`site_dimensions.${index}.images`}
                    render={({ field: imagesField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-xs font-medium">
                          📷 Photos/Videos
                        </FormLabel>
                        <MediaUpload
                          label=""
                          multiple={true}
                          allowedTypes={["image", "video"]}
                          value={imagesField.value as MediaItem[] | undefined}
                          onChange={(newMedia) => {
                            imagesField.onChange(newMedia);
                          }}
                          inspectionStatus={form.watch("inspection_status")}
                          isReadOnly={isReadOnly}
                        />
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`site_dimensions.${index}.media_2`}
                    render={({ field: mediaField }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-xs font-medium">
                          🎤 Audio Notes
                        </FormLabel>
                        <MediaUpload
                          label=""
                          multiple={false}
                          allowedTypes={["audio"]}
                          value={mediaField.value as MediaItem | undefined}
                          onChange={(newMedia) => {
                            mediaField.onChange(newMedia);
                          }}
                          inspectionStatus={form.watch("inspection_status")}
                          isReadOnly={isReadOnly}
                        />
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-2">
                  <FormField
                    control={form.control}
                    name={`site_dimensions.${index}.notes`}
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
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add New Area Button */}
          <Button
            type="button"
            variant="outline"
            disabled={isReadOnly}
            onClick={handleAppendDimension}
            className="w-full border-dashed border-gray-300 text-gray-600 hover:text-emerald-700 hover:border-emerald-700 hover:bg-emerald-50 transition-colors h-10"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Area
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SiteDimensionsAccordion;