
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrackFiltersProps {
  onSortChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
}

export const TrackFilters = ({ onSortChange, onGenreChange, onPeriodChange }: TrackFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-light text-xl">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select onValueChange={onSortChange} defaultValue="date-new">
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-new">Date Added (Newest)</SelectItem>
              <SelectItem value="date-old">Date Added (Oldest)</SelectItem>
              <SelectItem value="plays">Most Played</SelectItem>
              {/* <SelectItem value="revenue">Highest Revenue</SelectItem> */}
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Genre</Label>
          <Select onValueChange={onGenreChange} defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="hiphop">Hip Hop</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="jazz">Jazz</SelectItem>
              <SelectItem value="classical">Classical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Time Period</Label>
          <Select onValueChange={onPeriodChange} defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
