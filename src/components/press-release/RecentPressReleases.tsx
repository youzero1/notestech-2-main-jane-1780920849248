
import React from 'react';
import { Link } from 'react-router-dom';
import { PressRelease } from '@/types/press-release';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface RecentPressReleasesProps {
  pressReleases: PressRelease[];
}

const RecentPressReleases: React.FC<RecentPressReleasesProps> = ({ pressReleases }) => {
  if (!pressReleases.length) {
    return null;
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-white mb-4">Recent posts</h2>
      
      <div className="space-y-6">
        {pressReleases.map((pressRelease, index) => (
          <div key={pressRelease.id}>
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <Link to={`/press-releases/${pressRelease.slug}`} className="group flex items-start gap-4">
                  {pressRelease.thumbnail_image && (
                    <div className="shrink-0 h-12 w-12 overflow-hidden rounded-full">
                      <img 
                        src={pressRelease.thumbnail_image} 
                        alt={pressRelease.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <h3 className="font-medium text-white text-[18px] line-clamp-2 group-hover:text-[#987d4d] transition-colors">
                      {pressRelease.title}
                    </h3>
                    <p className="text-sm text-[#A3A3A3] line-clamp-2">
                      {pressRelease.description || 'Learn more about this press release'}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
            {index < pressReleases.length - 1 && <hr className="border-gray-700 my-4" />}
          </div>
        ))}
      </div>
      
      <Link to="/press-releases" className="mt-4 flex items-center justify-end text-sm font-medium text-primary hover:underline">
        View all press releases
        <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
};

export default RecentPressReleases;
