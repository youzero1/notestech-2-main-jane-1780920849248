
import React from 'react';
import { Button } from "@/components/ui/button";

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
}

interface ModuleCardMobileProps {
  module: Module;
  onClose: () => void;
}

const ModuleCardMobile = ({ module, onClose }: ModuleCardMobileProps) => {
  return (
    <div className="bg-[#161617] p-4 rounded-lg shadow-md mb-4">
      {/* Module Image */}
      {module.image_url && (
        <img src={module.image_url} alt={module.title} className="w-full h-32 object-cover rounded mb-3" />
      )}
      
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#987D4D' }}>{module.title}</h3>
      
      <p className="text-sm text-gray-300 mb-3">{module.description}</p>
      
      <div
        className="text-sm text-gray-400 mb-4 line-clamp-3"
        dangerouslySetInnerHTML={{ __html: module.content }}
      />
      
      <Button 
        className="w-full bg-[#987d4d] hover:bg-[#876c3d] text-white"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );
};

export default ModuleCardMobile;
