import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Code, Zap, Users, Star, Folder } from 'lucide-react';

const TeamBalkanIdButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Special TeamBalkanId Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="fixed bottom-6 left-0 right-0 flex justify-center z-50"
      >
        <motion.button
          onClick={openModal}
          className="relative group"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {/* Animated Border */}
          <div 
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)',
              backgroundSize: '400% 400%',
              animation: 'gradientShift 3s ease infinite',
              padding: '2px',
              borderRadius: '10px'
            }}
          ></div>
          
          {/* Button Content */}
          <div 
            className="relative px-8 py-4 shadow-2xl bg-clip-padding"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              borderRadius: '8px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-2 h-2 bg-white rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              ></motion.div>
              <span 
                className="font-medium text-white text-sm tracking-wide transition-colors duration-300 group-hover:text-yellow-300"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                Click here BalkanId Team
              </span>
            </div>
          </div>
          
          {/* Pulsing Glow Effect */}
          <motion.div 
            className="absolute inset-0 rounded-lg -z-10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)',
              filter: 'blur(12px)'
            }}
          ></motion.div>
          
          {/* Hover Glow Effect */}
          <div 
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-40 transition-all duration-500 -z-10"
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)',
              filter: 'blur(15px)',
              transform: 'scale(1.1)'
            }}
          ></div>
        </motion.button>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: 'Helvetica, Arial, sans-serif',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    Hi there! I'm Yash Sharma
                  </h1>
                  <p className="text-lg font-medium text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    22BKT0074
                  </p>
                </motion.div>

                {/* Introduction */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8 p-6 rounded-lg relative"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative'
                  }}
                >
                  <p className="text-lg leading-relaxed font-light text-gray-200" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    I'm passionate about building amazing web applications and I'd love to join the 
                    <span className="font-medium text-white"> BalkanID team</span>! 
                    I believe in creating user-friendly, scalable solutions that make a real difference. 
                    This project showcases my skills in full-stack development, and I'm excited about the 
                    opportunity to contribute to your innovative team.
                  </p>
                </motion.div>

                {/* Features Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-light mb-6 text-center text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    Key Features
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Public File Sharing</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Publish files with public download/preview links
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Heart className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Private File Sharing</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Send files to specific users with TTL and messages
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Folder className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Folder Management</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Organize files in hierarchical folder structures
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Zap className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Advanced Search</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Powerful search with filters, tags, and content indexing
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Code className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>File Deduplication</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Automatic duplicate detection to save storage space
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Star className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Real-time Updates</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Live notifications and instant file synchronization
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Zap className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Cloud Storage</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        S3 integration for scalable file storage
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Star className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium text-lg text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Live Deployment</h3>
                      </div>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Production-ready with modern infrastructure
                      </p>
                    </motion.div>
                  </div>

                  {/* Navigation Sections */}
                  <h3 className="text-xl font-light mb-4 text-center text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    Navigation Sections
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <h4 className="font-medium text-lg text-white mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Dashboard</h4>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Overview, recent files, shared files, quick actions
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <h4 className="font-medium text-lg text-white mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Upload</h4>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Drag & drop, folder selection, progress tracking
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <h4 className="font-medium text-lg text-white mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Files</h4>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Browse, search, organize, manage files and folders
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg relative"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <h4 className="font-medium text-lg text-white mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Search</h4>
                      <p className="text-sm font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        Advanced search with filters, tags, and content search
                      </p>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <p className="text-lg font-light text-gray-300" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    Ready to build something amazing together?
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
};

export default TeamBalkanIdButton;


