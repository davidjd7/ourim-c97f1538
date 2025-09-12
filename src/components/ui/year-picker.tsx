import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface YearPickerProps {
  value: string; // Date string in YYYY-MM-DD format
  onChange: (date: string) => void; // Will return YYYY-12-31 format
  startYear?: number;
  endYear?: number;
}

export function YearPicker({ value, onChange, startYear = 2000, endYear = new Date().getFullYear() + 10 }: YearPickerProps) {
  // Extract year from the date string
  const currentYear = value ? new Date(value).getFullYear().toString() : '';
  
  // Generate year options
  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year.toString());
  }

  const handleYearChange = (selectedYear: string) => {
    // Always set to December 31st of the selected year
    const newDate = `${selectedYear}-12-31`;
    onChange(newDate);
  };

  return (
    <Select value={currentYear} onValueChange={handleYearChange}>
      <SelectTrigger className="w-24">
        <SelectValue placeholder="Année" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}