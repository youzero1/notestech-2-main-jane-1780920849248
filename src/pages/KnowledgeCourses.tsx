import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { Search, DollarSign, Briefcase, Music, GraduationCap, Plus } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const KnowledgeCourses = () => {
    const { categoryId } = useParams();
    const [courses, setCourses] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("courses");
    const navigate = useNavigate();
    const [userProgress, setUserProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);
    const {user}=useAuth();

     // Map URL parameter to actual category names
     const categoryMap: { [key: string]: string } = {
        'music-business': 'Music Business',
        'financial-literacy': 'Financial Literacy',
        'entrepreneurship': 'Entrepreneurship'
    };

    useEffect(() => {
        fetchCourses();
    }, [categoryId]);

    const fetchCourses = async () => {
        setIsCoursesLoading(true); // Start loading
        let query = supabase
            .from('courses')
            .select(`
                *,
                modules (
                    title,
                    order_index
                )
            `);
        
        if (categoryId && categoryMap[categoryId]) {
            query = query.eq('category', categoryMap[categoryId]);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching courses:', error);
            setIsCoursesLoading(false); // End loading on error
            return;
        }

        // Process the data to format topics from modules
        const processedData = data?.map(course => ({
            ...course,
            topics: course.modules
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((module: any) => module.title)
        }));

        // Filter courses based on search query if it exists
        const filteredData = processedData?.filter(course => 
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setCourses(filteredData || []);
        setIsCoursesLoading(false); // End loading after data is processed
    };

    // Add useEffect for search query changes
    useEffect(() => {
        fetchCourses();
    }, [searchQuery]);

    // Add new function to fetch user progress
    const fetchUserProgress = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // First get all courses with their total module count
        let coursesQuery = supabase
            .from('courses')
            .select(`
                id,
                title,
                category,
                image_url,
                modules (count)
            `);

        if (categoryId && categoryMap[categoryId]) {
            coursesQuery = coursesQuery.eq('category', categoryMap[categoryId]);
        }

        const { data: coursesData, error: coursesError } = await coursesQuery;
        if (coursesError) {
            console.error('Error fetching courses:', coursesError);
            return;
        }

        // Then get user progress for these courses
        const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('course_id, module_id')
            .eq('user_id', user.id);

        if (progressError) {
            console.error('Error fetching user progress:', progressError);
            return;
        }

        // Calculate progress for each course
        const courseProgress = coursesData.map(course => {
            const completedModules = progressData?.filter(p => p.course_id === course.id) || [];
            const totalModules = course.modules[0].count;
            const uniqueCompletedModules = [...new Set(completedModules.map(p => p.module_id))];

            return {
                    course: {
                        id: course.id,
                        title: course.title,
                        category: course.category,
                        image_url: course.image_url || "/lovable-uploads/image1.png",
                    },
                progress: {
                    completedModules: uniqueCompletedModules.length,
                    totalModules: totalModules,
                    percentComplete: Math.round((uniqueCompletedModules.length / totalModules) * 100)
                }
            };
        });

        // Filter out courses with no progress if needed
        const coursesWithProgress = courseProgress.filter(cp => cp.progress.completedModules > 0);
        setUserProgress(coursesWithProgress);
        setIsLoading(false);
    };

    // Add useEffect to fetch progress
    useEffect(() => {
        fetchUserProgress();
    }, [categoryId]);

    // Add useQuery hook for admin check
    const { data: isAdmin } = useQuery({
        queryKey: ['user-role', user?.id],
        queryFn: async () => {
            if (!user) return false;
            const { data, error } = await supabase.rpc('has_role', {
                user_id: user.id,
                role: 'admin'
            });
            if (error) {
                console.error('Error checking admin role:', error);
                return false;
            }
            if(data){
                return true;
            }
            return false;
        },
        enabled: !!user
    });

    const resourceCards = [
        {
            id: 1,
            title: "Industry Templates",
            image_url: "/knowledge/financial.png", // Add your dummy image path
            items: [
                "Contract Templates",
                "Release Planning Sheets",
                "Budget Calculators",
                "Marketing Plan Templates"
            ]
        },
        {
            id: 2,
            title: "Expert Interviews",
            image_url: "/knowledge/ep.png", // Add your dummy image path
            items: [
                "A&R Perspectives",
                "Producer Stories",
                "Label Insights",
                "Artist Journeys"
            ]
        },
        {
            id: 3,
            title: "Tools & Software",
            image_url: "/knowledge/music.png", // Add your dummy image path
            items: [
                "DAW Comparisons",
                "Plugin Reviews",
                "Equipment Guides",
                "Studio Setup Tips"
            ]
        }
    ];

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Financial Literacy':
                return <DollarSign className="w-5 h-5 text-white" />;
            case 'Entrepreneurship':
                return <Briefcase className="w-5 h-5 text-white" />;
            case 'Music Business':
                return <Music className="w-5 h-5 text-white" />;
            default:
                return <Music className="w-5 h-5 text-white" />;
        }
    };

    // Add certificate generation function
    const generateCertificate = async (courseData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([842, 595]); // A4 landscape
            const { width, height } = page.getSize();
            
            const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

            // Helper function to center text
            const centerText = (text: string, font: any, size: number) => {
                const textWidth = font.widthOfTextAtSize(text, size);
                return (width - textWidth) / 2;
            };

            // Draw colorful border at top and bottom
            const borderHeight = 40;
            const colors = [
                rgb(0.8, 0.6, 0.2),
                rgb(0.7, 0.4, 0.3),
                rgb(0.5, 0.6, 0.7),
                rgb(0.6, 0.4, 0.5),
                rgb(0.4, 0.7, 0.8),
            ];

            // Top border
            colors.forEach((color, index) => {
                page.drawRectangle({
                    x: 0,
                    y: height - (index + 1) * (borderHeight / colors.length),
                    width: width,
                    height: borderHeight / colors.length,
                    color: color,
                });
            });

            // Bottom border
            colors.forEach((color, index) => {
                page.drawRectangle({
                    x: 0,
                    y: index * (borderHeight / colors.length),
                    width: width,
                    height: borderHeight / colors.length,
                    color: color,
                });
            });

            // Title - centered
            const titleText = 'CERTIFICATE OF TRAINING';
            page.drawText(titleText, {
                x: centerText(titleText, timesRomanBold, 40),
                y: height - 150,
                size: 40,
                font: timesRomanBold,
                color: rgb(0, 0, 0),
            });

            // "Presented to" text - centered
            const presentedText = 'Presented to';
            page.drawText(presentedText, {
                x: centerText(presentedText, timesRomanFont, 30),
                y: height - 250,
                size: 30,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
            });

            // Name - centered
            // Get full name from user metadata or fallback to first part of email
            const displayName = user.user_metadata?.full_name || 
                              user.email?.split('@')[0]?.split('.')
                                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');
            page.drawText(displayName, {
                x: centerText(displayName, timesRomanBold, 35),
                y: height - 300,
                size: 35,
                font: timesRomanBold,
                color: rgb(0, 0, 0),
            });

            // "for completing" text - centered
            const forCompletingText = 'for completing';
            page.drawText(forCompletingText, {
                x: centerText(forCompletingText, timesRomanFont, 25),
                y: height - 350,
                size: 25,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
            });

            // Course title - centered
            const courseTitle = courseData.course.title;
            page.drawText(courseTitle, {
                x: centerText(courseTitle, timesRomanBold, 30),
                y: height - 400,
                size: 30,
                font: timesRomanBold,
                color: rgb(0, 0, 0),
            });

            // Course details - centered
            const modulesText = `Modules Completed: ${courseData.progress.completedModules}/${courseData.progress.totalModules}`;
            page.drawText(modulesText, {
                x: centerText(modulesText, timesRomanFont, 15),
                y: height - 450,
                size: 15,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
            });

            if (courseData.quizResults) {
                const quizText = `Quiz Score: ${courseData.quizResults.score}%`;
                page.drawText(quizText, {
                    x: centerText(quizText, timesRomanFont, 15),
                    y: height - 475,
                    size: 15,
                    font: timesRomanFont,
                    color: rgb(0, 0, 0),
                });
            }

            // Date section - positioned on the left side
            const date = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            // Position date on the left side
            const dateLabel = 'Date';
            const dateX = width * 0.2; // Position date at 20% of page width
            
            page.drawText(dateLabel, {
                x: dateX,
                y: 120,
                size: 20,
                font: timesRomanBold,
                color: rgb(0, 0, 0),
            });

            page.drawText(date, {
                x: dateX - 20, // Adjust date position to align with label
                y: 150,
                size: 15,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
            });

            // // Draw decorative seal - commented out
            // page.drawCircle({
            //     x: width * 0.6,
            //     y: 150,
            //     size: 40,
            //     color: rgb(0.1, 0.4, 0.8),
            //     borderWidth: 2,
            //     borderColor: rgb(0.8, 0.7, 0.3),
            // });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, `${courseData.course.title.replace(/\s+/g, '_')}_Certificate.pdf`);

        } catch (error) {
            console.error('Error generating certificate:', error);
        }
    };

    const renderContent = () => {
        if (activeTab === "resources") {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resourceCards.map((resource) => (
                        <div key={resource.id} className="bg-[#1E1E20] rounded-2xl overflow-hidden flex flex-col">
                            <div className="p-4">
                                <img 
                                    src={resource.image_url} 
                                    alt={resource.title}
                                    className="w-full h-[167px] object-cover rounded-xl"
                                />
                            </div>
                            <div className="px-6 pb-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold text-white mb-2 truncate" title={resource.title}>
                                    {resource.title}
                                </h3>
                                <ul className="space-y-2 mb-6 flex-1">
                                    {resource.items.map((item, index) => (
                                        <li key={index} className="text-gray-400 text-sm truncate" title={item}>
                                            • {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === "progress") {
            if (isLoading) {
                return (
                    <div className="flex items-center justify-center w-full h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#B69C6C]"></div>
                    </div>
                );
            }

            if (!userProgress.length) {
                return (
                    <div className="flex items-center justify-center w-full">
                        <div className="bg-[#1E1E20] rounded-2xl p-8 sm:p-16 flex flex-col items-center justify-center w-full sm:w-auto">
                            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-6">
                               <GraduationCap className="text-white" />
                            </div>
                            <h2 className="text-xl text-white font-medium mb-2">
                                Start Your Learning Journey
                            </h2>
                            <p className="text-gray-400 text-center text-sm mb-6">
                                Enroll in courses to track your progress<br />
                                and earn certificates
                            </p>
                            <button 
                                onClick={() => setActiveTab("courses")}
                                className="px-6 py-2.5 bg-[#B69C6C] text-white rounded-lg hover:bg-[#A38B5B] transition-colors"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userProgress.map((item) => (
                        <div key={item.course.id} className="bg-[#1E1E20] rounded-2xl overflow-hidden">
                            <div className="p-4 relative">
                                <img 
                                    src={item.course.image_url || `/knowledge/financial.png`}
                                    alt={item.course.title}
                                    className="w-full h-[167px] object-cover rounded-xl"
                                />
                                <div className="absolute top-8 right-8 bg-black p-2 rounded-full">
                                    {getCategoryIcon(item.course.category)}
                                </div>
                                {item.progress.percentComplete === 100 && (
                                    <div className="absolute top-8 left-8 bg-[#B69C6C] px-3 py-1 rounded-full">
                                        <span className="text-white text-sm">Completed</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 pb-6">
                                <h3 className="text-[16px] font-[500] font-[satoshi] text-white mb-4 truncate" title={item.course.title}>
                                    {item.course.title}
                                </h3>
                                <div className="mb-2">
                                    <div className="w-full bg-[#2A2A2A] rounded-full h-1">
                                        <div 
                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                item.progress.percentComplete === 100 
                                                    ? 'bg-green-500' 
                                                    : 'bg-[#B69C6C]'
                                            }`}
                                            style={{ width: `${item.progress.percentComplete}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm mb-1 mt-[16px]">
                                        <span className="text-[12px] font-[400] font-[satoshi]">{item.progress.percentComplete}% Completed</span>
                                        <div className="flex items-center gap-2 flex-col">
                                            <StarRating
                                                readOnly
                                                initialRating={3}
                                                size={13}
                                                className="mb-1"
                                            />
                                            <span className="text-[10px] font-[400] font-[satoshi]">
                                               Your Rating
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* <div className="text-sm text-gray-400 mb-6">
                                    {item.progress.completedModules} of {item.progress.totalModules} modules completed
                                    {item.quizResults && (
                                        <div className="mt-1">
                                            Quiz Score: {item.quizResults.score}%
                                        </div>
                                    )}
                                </div> */}
                                {/* {item.progress.percentComplete === 100 ? (
                                    <button 
                                        disabled={true}
                                        onClick={() => generateCertificate(item)}
                                        className="w-full py-2.5 text-center text-white bg-[#B69C6C] hover:bg-[#A38B5B] rounded-lg transition-colors"
                                    >
                                        Completed 
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => navigate(`/courses/${item.course.id}`)}
                                        className="w-full py-2.5 text-center text-white bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg transition-colors"
                                    >
                                        Continue Learning
                                    </button>
                                )} */}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Courses tab
        if (isCoursesLoading) {
            return (
                <div className="flex items-center justify-center w-full h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#B69C6C]"></div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses?.map((course) => (
                    <div key={course.id} className="bg-[#1E1E20] rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-4 relative">
                            <img 
                                src={course.image_url || `/knowledge/financial.png`}
                                alt={course.title}
                                className="w-full h-[167px] object-cover rounded-xl"
                            />
                            <div className="absolute top-8 right-8 bg-black p-2 rounded-full">
                                {getCategoryIcon(course.category)}
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 truncate" title={course.title}>
                                {course.title}
                            </h3>
                            <ul className="space-y-2 mb-6 flex-1">
                                {course.topics?.map((topic: string, index: number) => (
                                    <li key={index} className="text-gray-400 text-sm truncate" title={topic}>
                                        • {topic}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate(`/courses/${course.id}`)} className="w-full py-2.5 text-center text-white bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg transition-colors mt-auto">
                                Start Learning
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <DashboardLayout headerTitle="Knowledge Base" headerDescription="Learn everything about the music industry, from production to business">
            <div className="px-8 sm:px-8 py-6 bg-[#161618]">
                {/* <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
                    {isAdmin && (
                        <Button
                            onClick={() => navigate('/create-course')}
                            className="bg-[#B69C6C] hover:bg-[#A38B5B] text-white px-4 py-2 rounded-lg flex items-center gap-2 w-full md:w-auto justify-center md:justify-start"
                        >
                            <Plus className="h-4 w-4" />
                            Create Course
                        </Button>
                    )}
                </div> */}
                
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-8">
                    <div className="flex gap-1 border border-[#2A2A2A] rounded-full overflow-hidden w-full sm:w-auto">
                        <button 
                            onClick={() => setActiveTab("courses")}
                            className={`px-4 sm:px-6 py-2.5 font-medium transition-colors flex-1 sm:flex-none ${
                                activeTab === "courses" 
                                    ? "bg-[#B69C6C] text-white" 
                                    : "text-gray-400 hover:bg-[#2A2A2A]"
                            }`}
                        >
                            Courses
                        </button>
                        <button 
                            onClick={() => setActiveTab("resources")}
                            className={`px-4 sm:px-6 py-2.5 font-medium transition-colors flex-1 sm:flex-none ${
                                activeTab === "resources" 
                                    ? "bg-[#B69C6C] text-white" 
                                    : "text-gray-400 hover:bg-[#2A2A2A]"
                            }`}
                        >
                            Resources
                        </button>
                        <button 
                            onClick={() => setActiveTab("progress")}
                            className={`px-4 sm:px-6 py-2.5 font-medium transition-colors flex-1 sm:flex-none ${
                                activeTab === "progress" 
                                    ? "bg-[#B69C6C] text-white" 
                                    : "text-gray-400 hover:bg-[#2A2A2A]"
                            }`}
                        >
                            My Progress
                        </button>
                    </div>
                    
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search courses and resources..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#2A2A2A] text-white placeholder-gray-400 focus:outline-none border border-transparent focus:border-[#B69C6C]"
                        />
                    </div>
                </div>

                <hr className="border-b border-[#2C2C30] mt-[24px] mb-[36px]" />

                {renderContent()}
            </div>
        </DashboardLayout>
    );
}

export default KnowledgeCourses;