import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users2, ChevronLeft, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Course, Module } from "@/types/knowledge";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [currentFiles, setCurrentFiles] = useState<string[]>([]);
  const [showContent, setShowContent] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

  const fetchUserProgress = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('module_id')
        .eq('user_id', user.id)
        .eq('course_id', id);

      if (error) throw error;

      const completedModuleIds = data.map(progress => progress.module_id);
      setCompletedModules(completedModuleIds);
      
      const progressObj: { [key: string]: boolean } = {};
      completedModuleIds.forEach(moduleId => {
        if (moduleId) progressObj[moduleId] = true;
      });
      setProgress(progressObj);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const markModuleComplete = async (moduleId: string) => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .insert([
          {
            user_id: user.id,
            course_id: id,
            module_id: moduleId,
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module marked as complete",
      });

      setProgress(prev => ({
        ...prev,
        [moduleId]: true
      }));
      setCompletedModules(prev => [...prev, moduleId]);
    } catch (error) {
      console.error('Error marking module as complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark module as complete",
        variant: "destructive",
      });
    }
  };

  const handleViewContent = (content: string) => {
    setCurrentContent(content);
    setShowContent(true);
  };

  const handleWatchVideo = (videoUrl: string) => {
    setCurrentContent(videoUrl);
    setShowVideo(true);
  };

  const toggleDescription = (sectionId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        console.log('CourseDetail component mounted');
        setIsLoading(true);
        setError(null);
        
        console.log('Attempting to fetch course with ID:', id);
        if (!id) {
          console.error('No courseId provided in URL parameters');
          setError("Course ID is missing");
          return;
        }

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (courseError) {
          console.error('Course fetch error:', courseError);
          throw courseError;
        }
        
        console.log('Course data received:', courseData);
        
        if (!courseData) {
          console.error('No course found with ID:', id);
          throw new Error('Course not found');
        }

        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', id)
          .order('order_index');

        if (modulesError) {
          console.error('Modules fetch error:', modulesError);
          throw modulesError;
        }

        console.log('Modules data received:', modulesData);

        const transformedModules = modulesData?.map((module: Module) => {
          let keyPoints: string[] = [];
          let contentFiles: string[] = [];
          
          try {
            keyPoints = Array.isArray(module.key_points) ? module.key_points : 
                       typeof module.key_points === 'string' ? JSON.parse(module.key_points) : [];
            
            contentFiles = Array.isArray(module.content_files) ? module.content_files :
                         typeof module.content_files === 'string' ? JSON.parse(module.content_files) : [];
          } catch (error) {
            console.error(`Error parsing module ${module.id} data:`, error);
          }

          return {
            id: module.id,
            title: module.title,
            description: module.description,
            content: module.content,
            keyPoints,
            content_files: contentFiles,
            video_url: module.video_url,
            image_url: module.image_url,
          };
        }) || [];

        const fullCourse: any = {
          ...courseData,
          topics: [{
            title: courseData.title,
            sections: transformedModules
          }]
        };

        console.log('Setting course state with:', fullCourse);
        setCourse(fullCourse);
      } catch (error: any) {
        console.error('Error in fetchCourse:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCourse();
      fetchUserProgress();
    }
  }, [id, user]);

  const calculateProgress = () => {
    if (!course?.topics?.[0]?.sections) return 0;
    const totalModules = course.topics[0].sections.length;
    const completed = completedModules.length;
    return Math.round((completed / totalModules) * 100);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-semibold">Error Loading Course</h1>
          <p className="text-muted-foreground mt-2">
            {error || "The course you're looking for doesn't exist or has been removed."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showLink={true} redirectionLink="/knowledge" linkText="Back">
      <div className="min-h-screen bg-[#161618]">
        <div className="container mx-auto px-8 py-6">
          {/* <Link to="/knowledge" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link> */}

          <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
            {/* Main Content - Topics List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Topics</h2>
              {course?.topics?.[0]?.sections.map((section, index) => (
                  <Card className="group relative overflow-hidden border-0 bg-[#1E1E20] hover:bg-card/70 transition-colors">
                    <CardContent className="p-6">
                      <div className="grid gap-6 sm:grid-cols-[240px,1fr] items-start">
                        <div className="relative aspect-video overflow-hidden rounded-lg">
                          <img 
                            src={section.image_url || "/placeholder.svg"} 
                            alt={section.title}
                            className="object-cover w-full h-full"
                          />
                          {/* <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Badge variant="secondary" className="pointer-events-none">
                              Topic {index + 1}
                            </Badge>
                          </div> */}
                        </div>
                        <div className="flex flex-col h-full">
                          <div className="flex-grow space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-semibold text-lg">{section.title}</h3>
                              <div className="w-32 space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{progress[section.id] ? "100%" : "0%"}</span>
                                </div>
                                <Progress value={progress[section.id] ? 100 : 0} className="h-1" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="relative">
                                <p className={`text-sm text-muted-foreground ${!expandedDescriptions[section.id] ? "line-clamp-2" : ""}`}>
                                  {section.description}
                                </p>
                                {section.description.length > 100 && (
                                  <button
                                    onClick={() => toggleDescription(section.id)}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1"
                                  >
                                    {expandedDescriptions[section.id] ? (
                                      <>Read less <ChevronUp className="h-3 w-3" /></>
                                    ) : (
                                      <>Read more <ChevronDown className="h-3 w-3" /></>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            {!progress[section.id] && (
                              <Button
                                onClick={() => navigate(`/courses/${id}/topics/${section.id}`)}
                                className="gap-2"
                                size="sm"
                              >
                                Start
                              </Button>
                            )}
                            {progress[section.id] && (
                              <Badge variant="secondary">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>

            {/* Sidebar - Course Details */}
            <div className="space-y-6">
              <Card className="border-0 bg-[#1E1E20] overflow-hidden">
                <div className="aspect-video relative p-4">
                  <img 
                    src={course?.image_url || "/placeholder.svg"}
                    alt={course?.title}
                    className="object-cover rounded-lg w-full h-full"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{course?.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">{course?.description}</p>
                  
                  <div className="space-y-3">
                    <div className="text-muted-foreground font-medium">
                      Your Progress
                    </div>
                    <Progress value={calculateProgress()} className="h-2" />
                    <div className="">
                      {calculateProgress()}% completed
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Course Details</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {course?.topics?.[0]?.sections.length || 0} Topics
                      </div>
                      <div className="flex items-center gap-2">
                        <Users2 className="h-4 w-4" />
                        For all skill levels
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
