"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Multi-Select Dropdown Component for Job Types with Chips Display
export const MultiSelectJobTypes = ({
  jobTypes,
  selectedJobTypes,
  onSelectionChange,
  placeholder = "Select job types",
}: {
  jobTypes: { name: string }[];
  selectedJobTypes: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Adjust dropdown position on open to ensure it's visible on mobile
  useEffect(() => {
    if (isOpen && dropdownMenuRef.current) {
      const dropdownRect = dropdownMenuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // If dropdown is going to be cut off at the bottom
      if (dropdownRect.bottom > viewportHeight) {
        dropdownMenuRef.current.style.maxHeight = `${
          viewportHeight - dropdownRect.top - 20
        }px`;
        dropdownMenuRef.current.style.overflowY = "auto";
      }
    }
  }, [isOpen]);

  const handleToggle = (jobTypeName: string) => {
    const isSelected = selectedJobTypes.includes(jobTypeName);
    if (isSelected) {
      onSelectionChange(
        selectedJobTypes.filter((type) => type !== jobTypeName)
      );
    } else {
      onSelectionChange([...selectedJobTypes, jobTypeName]);
    }
  };

  const removeJobType = (jobTypeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedJobTypes.filter((type) => type !== jobTypeName));
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the input click event
    setIsOpen(!isOpen);

    if (!isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" &&
      inputValue === "" &&
      selectedJobTypes.length > 0
    ) {
      // Remove the last chip when backspace is pressed on empty input
      onSelectionChange(selectedJobTypes.slice(0, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const filteredJobTypes = jobTypes.filter((jobType) =>
    jobType.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex flex-wrap gap-2 min-h-10 w-full items-center rounded-md border border-gray-800 bg-white px-3 py-2 text-md cursor-text hover:bg-gray-50 "
        onClick={handleInputClick}
      >
        {/* Selected job types as chips */}
        {selectedJobTypes.map((jobType) => (
          <div
            key={jobType}
            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm"
          >
            <span>{jobType}</span>
            <X
              className="h-3 w-3 text-gray-500 cursor-pointer hover:text-gray-700"
              onClick={(e) => removeJobType(jobType, e)}
            />
          </div>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="flex-1 min-w-20 outline-none bg-transparent text-sm"
          placeholder={selectedJobTypes.length === 0 ? placeholder : ""}
        />

        {/* Dropdown indicator */}
        {isOpen ? (
          <X
            className="h-4 w-4 text-gray-600 cursor-pointer"
            onClick={handleChevronClick}
          />
        ) : (
          <ChevronDown
            className="h-4 w-4 text-gray-600 cursor-pointer"
            onClick={handleChevronClick}
          />
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          ref={dropdownMenuRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto pb-20"
          style={{ bottom: "auto" }}
        >
          {filteredJobTypes.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No options found
            </div>
          ) : (
            filteredJobTypes.map((jobType) => (
              <div
                key={jobType.name}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleToggle(jobType.name)}
              >
                <div className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded text-md">
                  {selectedJobTypes.includes(jobType.name) && (
                    <Check className="h-3 w-3 text-emerald-600" />
                  )}
                </div>
                <span className="text-sm">{jobType.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};