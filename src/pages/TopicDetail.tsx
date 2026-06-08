import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp,
  FileText,
  FileImage,
  FileVideo,
  Presentation,
  FileCheck,
  PenLine
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Course, Module, Quiz } from "@/types/knowledge";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";

const TopicDetail = () => {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [topic, setTopic] = useState<Module | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileCheck className="h-5 w-5" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-5 w-5" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <FileVideo className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        // Fetch topic details
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', topicId)
          .single();

        if (moduleError) throw moduleError;

        // Parse JSON fields
        const parsedModule: any = {
          ...moduleData,
          key_points: [],
          content_files: Array.isArray(moduleData.content_files)
            ? moduleData.content_files
            : JSON.parse(moduleData.content_files as string || '[]')
        };

        setTopic(parsedModule);

        // Check if there's a quiz
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('id')
          .eq('module_id', topicId)
          .single();

        setHasQuiz(!!quizData);

        // Fetch progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('module_id', topicId)
          .eq('user_id', user?.id)
          .maybeSingle();

        setProgress(progressData ? 100 : 0);

      } catch (error) {
        console.error('Error fetching topic:', error);
        toast({
          title: "Error",
          description: "Failed to load topic details",
          variant: "destructive",
        });
      }
    };

    if (topicId && user) {
      fetchTopicDetails();
    }
  }, [topicId, user]);

  const handleMarkComplete = async () => {
    if (!user || !topicId || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_progress')
        .insert([
          {
            user_id: user.id,
            course_id: courseId,
            module_id: topicId,
          }
        ]);

      if (error) throw error;

      setProgress(100);
      toast({
        title: "Success",
        description: "Topic marked as complete",
      });

      // If there's no quiz, navigate back to course
      if (!hasQuiz) {
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Error marking topic as complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark topic as complete",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!topic) return null;

  return (
    <DashboardLayout showLink={true} redirectionLink={`/courses/${courseId}`} linkText="Back to Course">
      <div className="min-h-screen bg-[#161618]">
        <div className="container mx-auto px-8 py-6">
          {/* <Link 
            to={`/courses/${courseId}`} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Course
          </Link> */}

          <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
            {/* Main Content */}
            <div className="space-y-6">
              {/* {topic.video_url && (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <video 
                    src={topic.video_url} 
                    controls 
                    className="w-full h-full"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )} */}

              {/* Topic Content Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[18px]">Welcome to this section! Let's dive deep into {topic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none border border-border/40 rounded-lg p-4 bg-[#161617]">
                    <div className="relative">
                      <p className={`text-muted-foreground ${!isExpanded ? "line-clamp-2" : ""}`}>
                        {topic.description}
                      </p>
                      {topic.description.length > 100 && (
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-primary hover:text-primary/80 flex items-center gap-1 mt-2"
                        >
                          {isExpanded ? (
                            <>Read less <ChevronUp className="h-4 w-4" /></>
                          ) : (
                            <>Read more <ChevronDown className="h-4 w-4" /></>
                          )}
                        </button>
                      )}
                    </div>

                    {topic.content && (
                      <div className="mt-6" dangerouslySetInnerHTML={{ __html: topic.content }} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resources Card */}
              {/* {topic.content_files && topic.content_files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {topic.content_files.map((file, index) => (
                        <a
                          key={index}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
                        >
                          {getFileIcon(file)}
                          <span className="text-sm">Resource {index + 1}</span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )} */}

              {/* Completion Button */}
              {progress < 100 && (
                <Button 
                  className="inline-flex"
                  size="lg"
                  onClick={()=>{
                    if(hasQuiz)
                      navigate(`/courses/${courseId}/quiz/${topicId}`);
                    else
                      handleMarkComplete();
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Loading..."
                  ) : hasQuiz ? (
                    <>
                      Take Quiz to Complete Section
                    </>
                  ) : (
                    <>
                      Mark as Completed
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 overflow-hidden">
                <div className="aspect-video relative p-4">
                  <img 
                    src={topic?.image_url || "/placeholder.svg"}
                    alt={topic.title}
                    className="object-cover rounded-lg w-full h-full"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{topic.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className=" text-muted-foreground font-medium">
                      Your Progress
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="">
                      {progress}% completed
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

export default TopicDetail;
