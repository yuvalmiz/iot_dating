// context.js
import React, { createContext, useEffect, useState } from 'react';

const SharedStateContext = createContext();

const SharedStateProvider = ({ children }) => {
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  });
  const saveEmail = (email) => {
    console.log('Saving email:', email);
    setEmail(email);
    localStorage.setItem('userEmail', email);
  }


  return (
    <SharedStateContext.Provider value={{ email, setEmail: saveEmail }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export { SharedStateContext, SharedStateProvider };
