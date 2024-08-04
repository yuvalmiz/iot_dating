// context.js
import React, { createContext, useEffect, useState } from 'react';

const SharedStateContext = createContext();

const SharedStateProvider = ({ children }) => {
  const [email, setEmail] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    const storedFirstName = localStorage.getItem('userFirstName');
    if (storedFirstName) {
      setFirstName(storedFirstName);
    }
    const storedLastName = localStorage.getItem('userLastName');
    if (storedLastName) {
      setLastName(storedLastName);
    }
  }, []);
  const saveEmail = (email) => {
    console.log('Saving email:', email);
    setEmail(email);
    localStorage.setItem('userEmail', email);
  }
  const saveFirstName = (firstName) => {
    console.log('Saving first name:', firstName);
    setFirstName(firstName);
    localStorage.setItem('userFirstName', firstName);
  }
  const saveLastName = (lastName) => {
    console.log('Saving last name:', lastName);
    setLastName(lastName);
    localStorage.setItem('userLastName', lastName);
  }


  return (
    <SharedStateContext.Provider value={{ email, setEmail: saveEmail, firstName, setFirstName: saveFirstName, lastName, setLastName: saveLastName }}>

      {children}
    </SharedStateContext.Provider>
  );
};

export { SharedStateContext, SharedStateProvider };
