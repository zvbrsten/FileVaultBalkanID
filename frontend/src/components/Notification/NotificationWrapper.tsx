import React from 'react';
import { useNotification } from '../../hooks/useNotification';
import NotificationContainer from './Notification';

const NotificationWrapper: React.FC = () => {
  const { notifications, removeNotification } = useNotification();
  
  return (
    <NotificationContainer 
      notifications={notifications} 
      onDismiss={removeNotification} 
    />
  );
};

export default NotificationWrapper;






