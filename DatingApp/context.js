import React, { createContext, useEffect, useState } from 'react';

const SharedStateContext = createContext();

const SharedStateProvider = ({ children }) => {
  const [email, setEmail] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [seats, setSeats] = useState('');
  const [managedBars, setManagedBars] = useState([]); // New state for managed bars
  const [selectedBar, setSelectedBar] = useState(''); // New state for the selected bar

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
  };

  const saveFirstName = (firstName) => {
    console.log('Saving first name:', firstName);
    setFirstName(firstName);
    localStorage.setItem('userFirstName', firstName);
  };

  const saveLastName = (lastName) => {
    console.log('Saving last name:', lastName);
    setLastName(lastName);
    localStorage.setItem('userLastName', lastName);
  };

  const saveSeats = (seats) => {
    console.log('Saving seats:', seats);
    setSeats(seats);
  };

  const saveOtherEmail = async (otherEmail) => {
    console.log('Saving other email:', otherEmail);
    setOtherEmail(otherEmail);
  };

  const saveSelectedBar = (barId) => {
    console.log('Saving selected bar:', barId);
    setSelectedBar(barId);
  };

  return (
    <SharedStateContext.Provider value={{
      email,
      setEmail: saveEmail,
      firstName,
      setFirstName: saveFirstName,
      lastName,
      setLastName: saveLastName,
      seats,
      setSeats: saveSeats,
      otherEmail,
      setOtherEmail: saveOtherEmail,
      managedBars, // Provide managedBars
      setManagedBars, // Provide setManagedBars
      selectedBar, // Provide selectedBar
      setSelectedBar: saveSelectedBar, // Provide setSelectedBar
    }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export { SharedStateContext, SharedStateProvider };
