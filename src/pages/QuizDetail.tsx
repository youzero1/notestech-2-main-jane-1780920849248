import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}
interface Quiz {
  id: string;
  title: string;
  description: string;
  module_id: string;
  questions: Question[];
}
const QuizDetail = () => {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null | any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    fetchQuiz();
  }, [topicId]);
  const fetchQuiz = async () => {
    if (!topicId) return;
    
    setIsLoading(true);
    try {
      // Fetch quiz data
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', topicId)
        .single();
      if (quizError) throw quizError;
      setQuiz(quizData);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };
  const handleSubmitQuiz = async () => {
    if (!user || !topicId || !courseId || !quiz) return;
    
    // Check if all questions are answered
    const allAnswered = quiz.questions.every((_, index) => answers[index]);
    
    if (!allAnswered) {
      toast({
        title: "Warning",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Calculate score (number of correct answers)
      let score = 0;
      quiz.questions.forEach((question, index) => {
        if (answers[index] === question.correct_answer) {
          score++;
        }
      });
      // Save progress
      const { error } = await supabase
        .from('user_progress')
        .insert([
          {
            user_id: user.id,
            course_id: courseId,
            module_id: topicId,
            quiz_score: score,
            // quiz_id: quiz.id,
          }
        ]);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Quiz completed! Your score: ${score}/${quiz.questions.length}`,
      });
      // Navigate back to course
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Loading quiz...</div>
        </div>
      </DashboardLayout>
    );
  }
  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">No quiz found for this topic.</div>
          <Button 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mt-4"
          >
            Back to Course
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout showLink={true} redirectionLink={`/courses/${courseId}/topics/${topicId}`} linkText="Back">
      <div className="min-h-screen bg-[#161618]">
        <div className="container mx-auto px-4 py-6">
          {/* <Link 
            to={`/courses/${courseId}/topics/${topicId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link> */}
          <Card className="max-w-3xl mx-auto bg-[#1E1E1E] border-0">
            <CardContent className="p-6 md:p-8">
              <h1 className="text-2xl font-semibold text-center mb-12 text-white">Section Quiz</h1>
              <div className="space-y-16">
                {quiz.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="space-y-4">
                    <h2 className="text-lg font-normal text-[#E5E5E5] mb-6">{question.question}</h2>
                    
                    <RadioGroup
                      name={`question-${questionIndex}`}
                      value={answers[questionIndex] || ""}
                      onValueChange={(value) => handleAnswerChange(questionIndex, value)}
                      className="space-y-3"
                    >
                      {question.options.map((option, optionIndex) => (
                        <div 
                          key={optionIndex} 
                          className="flex items-center space-x-3 px-4 py-[14px] rounded-lg bg-[#1A1A1A] hover:bg-[#242424] transition-colors border border-[#2C2C2C]"
                        >
                          <RadioGroupItem
                            value={option}
                            id={`q${questionIndex}-option${optionIndex}`}
                            className="h-[18px] w-[18px] border-[#404040] text-[#E5E5E5] rounded-[4px]"
                          />
                          <Label
                            htmlFor={`q${questionIndex}-option${optionIndex}`}
                            className="text-[#E5E5E5] text-[15px] font-normal leading-tight cursor-pointer w-full pl-1"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="w-full mt-12 bg-[#8B7355] hover:bg-[#9E855F] text-white"
                variant="default"
              >
                {isSubmitting ? "Submitting..." : "Complete Section"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default QuizDetail;