import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext({});

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  // Get initial role from localStorage or default to 'tasker'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('userRole') || 'tasker';
  });

  // Save role to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('userRole', currentRole);
  }, [currentRole]);

  const switchRole = (role) => {
    setCurrentRole(role);
  };

  const value = {
    currentRole,
    switchRole,
    isTasker: currentRole === 'tasker',
    isBuyer: currentRole === 'buyer',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
