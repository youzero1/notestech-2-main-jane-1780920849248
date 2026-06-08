import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from 'sonner';
import { useIsMobile } from "@/hooks/use-mobile";
import ModuleCardMobile from '../../components/admin/ModuleCardMobile';
import CourseCardMobile from '../../components/admin/CourseCardMobile';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the course type 
interface Course {
  id: string;
  title: string;
  subject: string;
  chapters: number;
  enrolled_users: number;
  created_at: string;
  file_type: string;
  category: string;
  description: string;
  status: string;
  creator_id: string;
  updated_at: string;
  image_url: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
}

const LMS = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModuleContent, setSelectedModuleContent] = useState<string | null>(null);
  const coursesPerPage = 10;
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchCourses();
  }, [currentPage, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Calculate pagination ranges
      const from = (currentPage - 1) * coursesPerPage;
      const to = from + coursesPerPage - 1;
      
      // Count total courses for pagination
      const { count } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .ilike('title', `%${searchTerm}%`);
      
      setTotalCourses(count || 0);
      
      // Fetch courses with pagination and join with all module fields
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules:modules(*),
          user_progress: user_progress(course_id)
        `)
        .ilike('title', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        throw error;
      }
      
      // Transform data to match our Course interface and the table headers
      const formattedCourses = data.map(course => ({
        id: course.id,
        title: course.title,
        subject: course.subject || 'General',
        chapters: course.modules ? course.modules.length : 0,
        enrolled_users: course.user_progress ? course.user_progress.length : 0,
        created_at: new Date(course.created_at).toLocaleDateString(),
        file_type: 'PDF',
        category: course.category || 'Uncategorized',
        description: course.description || '',
        status: course.status || 'Inactive',
        creator_id: course.creator_id || '',
        updated_at: course.updated_at || '',
        image_url: course.image_url || '',
        modules: course.modules || []
      }));
      
      setCourses(formattedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleView = async (courseId: string) => {
    try {
      // Fetch full course details including all module fields
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules:modules(*),
          user_progress: user_progress(course_id)
        `)
        .eq('id', courseId)
        .single();

      if (error) {
        throw error;
      }

      const courseDetails = {
        id: data.id,
        title: data.title,
        subject: data.subject || 'General',
        chapters: data.modules ? data.modules.length : 0,
        enrolled_users: data.user_progress ? data.user_progress.length : 0,
        created_at: new Date(data.created_at).toLocaleDateString(),
        file_type: 'PDF',
        category: data.category || 'Uncategorized',
        description: data.description || '',
        status: data.status || 'Inactive',
        creator_id: data.creator_id || '',
        updated_at: data.updated_at || '',
        image_url: data.image_url || '',
        modules: data.modules || []
      };

      console.log('Course Details:', courseDetails); // Debugging line

      setSelectedCourse(courseDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error('Failed to load course details');
    }
  };

  const handleViewModuleContent = (content: string) => {
    setSelectedModuleContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
    setSelectedModuleContent(null);
  };

  const totalPages = Math.ceil(totalCourses / coursesPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    if (isMobile) {
      return (
        <div className="flex justify-between items-center mt-4">
          <Button
            className="w-12 h-10 flex items-center justify-center bg-transparent text-gray-400 border border-gray-600 rounded-lg"
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <img src="/lovable-uploads/left-btn.png" alt="Previous" className="h-4 w-4" />
          </Button>
          
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            className="w-12 h-10 flex items-center justify-center bg-transparent text-gray-400 border border-gray-600 rounded-lg"
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <img src="/lovable-uploads/right-btn.png" alt="Next" className="h-4 w-4" />
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex justify-between items-center bg-[#1E1E20] p-4 rounded-b-lg">
          <span className="text-gray-400">
            {totalCourses > 0 
              ? `Showing ${(currentPage - 1) * coursesPerPage + 1}-${Math.min(currentPage * coursesPerPage, totalCourses)} from ${totalCourses}`
              : 'No results'
            }
          </span>
          <div className="flex space-x-2">
            <button
              className={`w-8 h-8 flex items-center justify-center bg-transparent text-gray-400 border border-gray-600 rounded-[10px] ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            >
              <img src="/lovable-uploads/left-btn.png" alt="Previous" className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`w-8 h-8 flex items-center justify-center ${
                  currentPage === i + 1 ? 'bg-black text-[#987d4d]' : 'bg-transparent text-gray-400'
                } border border-gray-600 rounded-[10px]`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className={`w-8 h-8 flex items-center justify-center bg-transparent text-gray-400 border border-gray-600 rounded-[10px] ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            >
              <img src="/lovable-uploads/right-btn.png" alt="Next" className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }
  };

  const renderMobileView = () => {
    return (
      <div className="px-4 pb-4">
        <div className="w-full mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full h-10 p-2 pl-10 border border-gray-700 rounded-[27px] bg-[#161617] text-white"
            />
            <span className="absolute left-3 top-2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-medium">Learning Management</h2>
          <Link to="/create-course">
            <button className="bg-[#987d4d] text-white px-3 py-2 rounded-md text-sm font-normal">
              + Add LMS
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#987d4d]" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-[#1E1E20] border border-[#2C2C30] rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-2">No courses found</p>
            <Link to="/create-course">
              <button className="bg-[#987d4d] text-white px-3 py-2 rounded-md text-sm mt-2">
                Create your first course
              </button>
            </Link>
          </div>
        ) : (
          <div>
            {courses.map((course) => (
              <CourseCardMobile 
                key={course.id} 
                course={course} 
                onView={handleView} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
        )}

        {renderPagination()}
      </div>
    );
  };

  const renderDesktopView = () => {
    return (
      <div className="p-8">
        {/* Table Container */}
        <div className="overflow-hidden rounded-lg border border-[#1E1E20]">
          <Table className="min-w-full bg-[#1E1E20] text-white">
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: '#2C2C30' }}>
                <TableHead colSpan={5} className="py-2 px-4">
                  <div className="flex justify-between items-center mt-4 mb-5">
                    <div className="relative" style={{ width: '373px' }}>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full h-10 p-2 pl-10 border border-gray-700 rounded-[27px] bg-[#161617] text-white"
                      />
                      <span className="absolute left-3 top-2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                      </span>
                    </div>
                    <Link to="/create-course">
                      <button className="bg-[#987d4d] text-white px-4 py-2 rounded-md font-normal">
                        + Add LMS
                      </button>
                    </Link>
                  </div>
                </TableHead>
              </TableRow>
              <TableRow className="border-b" style={{ borderColor: '#2C2C30' }}>
                <TableHead className="py-2 px-4 text-left">Course Name</TableHead>
                <TableHead className="py-2 px-4 text-left">Subject</TableHead>
                <TableHead className="py-2 px-4 text-left">Chapters</TableHead>
                <TableHead className="py-2 px-4 text-center">Enrolled Users</TableHead>
                <TableHead className="py-2 px-4 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987d4d]"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No courses found
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id} className="border-b" style={{ borderColor: '#2C2C30' }}>
                    <TableCell className="py-4 px-4 flex items-center">
                      {course.title}
                    </TableCell>
                    <TableCell className="py-4 px-4">{course.subject}</TableCell>
                    <TableCell className="py-4 px-4">{course.chapters}</TableCell>
                    <TableCell className="py-4 px-4 text-center">{course.enrolled_users}</TableCell>
                    <TableCell className="py-4 px-4 text-center">
                      <button className="ml-4 mr-2" onClick={() => handleView(course.id)}>
                        <img src="/lovable-uploads/view.png" alt="View" className="inline-block h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(course.id)}>
                        <img src="/lovable-uploads/trash.png" alt="Delete" className="inline-block h-5 w-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Divider Line Before Footer */}
              <TableRow>
                <TableCell colSpan={5} className="border-t" style={{ borderColor: '#2C2C30' }}></TableCell>
              </TableRow>
            </TableBody>
            <tfoot>
              <tr>
                <td colSpan={5} className="py-0 px-4">
                  {renderPagination()}
                </td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout headerTitle="Learning Management System">
      {isMobile ? renderMobileView() : renderDesktopView()}

      {/* Modal - Responsive for both desktop and mobile */}
      {isModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1E1E20] rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto text-white">
            <div className="sticky top-0 bg-[#1E1E20] p-4 border-b border-[#2C2C30] flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
              <button 
                className="text-gray-400 hover:text-white p-2"
                onClick={closeModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {selectedCourse.image_url && (
                <img 
                  src={selectedCourse.image_url} 
                  alt={selectedCourse.title} 
                  className="w-full h-48 object-cover rounded-lg mb-4" 
                />
              )}
              
              <h3 className="text-xl font-bold mb-4 border-b border-[#2C2C30] pb-2">Chapters</h3>
              
              <div className="grid grid-cols-1 gap-6">
                {selectedCourse.modules.map((module) => (
                  isMobile ? (
                    <ModuleCardMobile 
                      key={module.id} 
                      module={module} 
                      onClose={closeModal} 
                    />
                  ) : (
                    <div key={module.id} className="bg-[#161617] p-6 rounded-lg shadow-md">
                      {module.image_url && (
                        <img src={module.image_url} alt={module.title} className="w-full h-32 object-cover rounded mb-4" />
                      )}
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#987D4D' }}>{module.title}</h3>
                      <p className="text-sm mb-4">{module.description}</p>
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: module.content }}
                      />
                    </div>
                  )
                ))}
              </div>
              
              <div className="mt-6 pb-4 flex justify-center">
                <Button 
                  className="bg-[#987d4d] text-white px-6 py-2 rounded-md hover:bg-[#876c3d]" 
                  onClick={closeModal}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LMS;
