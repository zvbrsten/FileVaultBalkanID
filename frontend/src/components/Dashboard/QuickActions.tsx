import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  Upload, 
  FolderPlus, 
  Share2, 
  Search, 
  Download,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  gradient: string;
}

interface QuickActionsProps {
  onUpload: () => void;
  onCreateFolder: () => void;
  onSearch: () => void;
  isAdmin?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onUpload,
  onCreateFolder,
  onSearch,
  isAdmin = false
}) => {
  const actions: QuickAction[] = [
    {
      id: 'upload',
      label: 'Upload',
      icon: <Upload className="w-4 h-4" />,
      onClick: onUpload,
      gradient: 'from-primary to-primary/80'
    },
    {
      id: 'folder',
      label: 'New Folder',
      icon: <FolderPlus className="w-4 h-4" />,
      onClick: onCreateFolder,
      gradient: 'from-secondary to-secondary/80'
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-4 h-4" />,
      onClick: onSearch,
      gradient: 'from-muted to-muted/80'
    }
  ];

  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="w-full h-12 flex flex-col items-center justify-center space-y-1 bg-card hover:bg-accent border-border"
                onClick={action.onClick}
              >
                {action.icon}
                <span className="text-xs text-muted-foreground">{action.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
