import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SendHorizontal } from "lucide-react";

const CATEGORIES = [
  {
    id: "financial-literacy",
    title: "Financial Literacy",
    description: "Master your finances and build wealth",
    image: "/knowledge/financial.png",
  },
  {
    id: "entrepreneurship",
    title: "Entrepreneurship",
    description: "Learn to build and grow successful businesses",
    image: "/knowledge/ep.png",
  },
  {
    id: "music-business",
    title: "Music Business",
    description: "Navigate the music industry like a pro",
    image: "/knowledge/music.png",
  }
];

const Knowledge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/knowledge/${categoryId}`);
  };

  const handleAskNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Navigate to AskNotes page with the question as a query parameter
    navigate(`/asknotes?question=${encodeURIComponent(question)}`);
  };

  return (
    <DashboardLayout headerTitle="Knowledge Base" headerDescription="Learn everything about the music industry, from production to business">
      <div className="bg-[#161618]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {CATEGORIES.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>

        {/* Chat Section - Bottom left positioning */}
        <div className="w-full md:w-[400px] bg-[#1A1A1A] border-t border border-gray-800 rounded-lg shadow-lg z-10 mt-12">
          <div className="p-4">
            <div className="mb-4">
              <p className="text-[#987D4D] text-lg">
                Hello {user?.user_metadata?.first_name || 'there'},
              </p>
              <p className="text-white text-xl">How can I help you today?</p>
            </div>

            <hr className="border-gray-800 mb-4" />

            <form onSubmit={handleAskNotes} className="relative">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <img 
                    src="/knowledge/ai-icon.png" 
                    alt="AI" 
                    className="w-5 h-5"
                  />
                </div>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask Notes Anything"
                  className="w-full bg-[#141414] border-0 text-white pl-10 pr-4 py-3 rounded-full placeholder:text-gray-500"
                />
              </div>
              <p className="text-gray-400 text-sm mt-2 text-center">
              </p>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Simplified CategoryCard props
interface CategoryCardProps {
  category: {
    id: string;
    title: string;
    description: string;
    image: string;
  };
  onClick: () => void;
}

// Updated CategoryCard component with dot indicator
const CategoryCard = ({ category, onClick }: CategoryCardProps) => {
  return (
    <Card 
      className="group cursor-pointer overflow-hidden bg-[#1A1A1A] border-gray-800 hover:border-[#B8860B] transition-all rounded-lg"
      onClick={onClick}
    >
      <div className="relative h-[180px] sm:h-[200px] md:h-[220px] lg:h-[450px]">
        <img
          src={category.image}
          alt={category.title}
          className="w-full h-full object-cover"
        />
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Additional darker gradient for text area */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black to-transparent" />
        
        {/* Content positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B8860B]"></span>
            <h3 className="text-lg font-semibold text-white">
              {category.title}
            </h3>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Knowledge;
