
import React from 'react';
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  title: string;
  subject: string;
  chapters: number;
  enrolled_users: number;
  created_at: string;
  status: string;
}

interface CourseCardMobileProps {
  course: Course;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const CourseCardMobile = ({ course, onView, onDelete }: CourseCardMobileProps) => {
  return (
    <div className="bg-[#1E1E20] border border-[#2C2C30] rounded-lg p-4 mb-4">
      <h3 className="text-white font-medium text-lg mb-2">{course.title}</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-gray-400 text-xs">Subject</p>
          <p className="text-white text-sm">{course.subject}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Chapters</p>
          <p className="text-white text-sm">{course.chapters}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Enrolled</p>
          <p className="text-white text-sm">{course.enrolled_users}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Created</p>
          <p className="text-white text-sm">{course.created_at}</p>
        </div>
      </div>
      
      <div className="flex justify-between mt-3">
        <Button
          variant="outline"
          className="text-gray-300 border-gray-700 hover:bg-[#2C2C30]"
          onClick={() => onView(course.id)}
        >
          <img src="/lovable-uploads/view.png" alt="View" className="inline-block h-4 w-4 mr-2" />
          View
        </Button>
        <Button
          variant="outline"
          className="text-red-400 border-gray-700 hover:bg-[#2C2C30]"
          onClick={() => onDelete(course.id)}
        >
          <img src="/lovable-uploads/trash.png" alt="Delete" className="inline-block h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default CourseCardMobile;
