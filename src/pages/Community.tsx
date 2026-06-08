import React, { useEffect, useState } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ArtistCard {
  id: string;
  name: string;
  image: string;
  bio: string;
  categories: string[];
}

const Community: React.FC = () => {
  const [artists, setArtists] = useState<ArtistCard[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, bio')
          .neq('id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedArtists: ArtistCard[] = data.map(profile => ({
            id:profile.id,
            name: profile.first_name + ' ' + profile.last_name || 'N/A',
            image: profile.avatar_url || '/lovable-uploads/thomas-performance.png',
            bio: profile.bio || 'N/A',
            categories:  ["Hip-Hop", "Rap", "R&B"],
          }));
          setArtists(formattedArtists);
        }
      } catch (error) {
        console.error('Error fetching artists:', error);
      }
    };

    fetchArtists();
  }, [user?.id]);

  return (
    <DashboardLayout headerTitle="NOTES Community">
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* <h1 className="text-4xl font-light tracking-tight text-white">NOTES Community</h1> */}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artists.map((artist, index) => (
            <div key={index} className="bg-[#1A1A1A] rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 relative">
                <img 
                  src={artist.image} 
                  alt={artist.name} 
                  className="w-full h-[200px] object-cover rounded-xl"
                />
              </div>
              
              <div className="px-6 pb-6 flex flex-col flex-1">
                {/* Artist Name */}
                <h3 className="text-xl font-bold text-white mb-2 truncate" title={artist.name}>
                  {artist.name}
                </h3>
                
                {/* Location */}
                <p className="text-gray-400 text-sm mb-4">
                  {artist.bio}
                </p>
                
                {/* Categories */}
                <div className="flex mb-6 flex-1">
                  <span className="text-[#b58d3c] text-sm">
                    Category: {artist.categories.join(", ")}
                  </span>
                </div>
                
                {/* Button */}
                <button onClick={() => navigate(`/profile/${artist.id}`)} className="w-[60%] py-2.5 text-center text-white bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg transition-colors mt-auto">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Community;
