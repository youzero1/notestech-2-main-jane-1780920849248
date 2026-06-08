
import React from 'react';
import { Button } from "@/components/ui/button";

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
}

interface ModuleCardProps {
  module: Module;
}

const ModuleCard = ({ module }: ModuleCardProps) => {
  return (
    <div className="bg-[#161617] p-6 rounded-lg shadow-md">
      {/* Module Image */}
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
  );
};

export default ModuleCard;
