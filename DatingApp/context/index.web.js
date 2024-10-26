import React, { createContext, useEffect, useState } from 'react';

const SharedStateContext = createContext();

const SharedStateProvider = ({ children }) => {
  const [email, setEmail] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [managedBars, setManagedBars] = useState([]);
  const [selectedBar, setSelectedBar] = useState('');
  const [selectedBarName, setSelectedBarName] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [connectedSeats, setConnectedSeats] = useState({});
  const [seats, setSeats] = useState([]);

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
    const storedManagedBars = localStorage.getItem('managedBars');
    if (storedManagedBars) {
      setManagedBars(JSON.parse(storedManagedBars));
    }
    const storedConnectedSeats = localStorage.getItem('connectedSeats');
    if (storedConnectedSeats) {
      setConnectedSeats(JSON.parse(storedConnectedSeats));
    }
    const storedSelectedBar = localStorage.getItem('selectedBar');
    if (storedSelectedBar) {
      setSelectedBar(storedSelectedBar);
    }
    const storedSelectedBarName = localStorage.getItem('selectedBarName');
    if (storedSelectedBarName) {
      setSelectedBarName(storedSelectedBarName);
    }

    const isManager = localStorage.getItem('isManager');
    if (storedSelectedBarName) {
      setIsManager(storedSelectedBarName);
    }

    const seats = localStorage.getItem('seats');
    if (seats) {
      setSeats(JSON.parse(seats));
    }
  }, []);

  const saveIsManager = (isManager) => {
    console.log('Saving to context - isManager:', isManager);
    setIsManager(isManager);
    localStorage.setItem('isManager', isManager);
  };

  const saveEmail = (email) => {
    console.log('Saving to context - email:', email);
    setEmail(email);
    localStorage.setItem('userEmail', email);
  };

  const saveFirstName = (firstName) => {
    console.log('Saving to context - first name:', firstName);
    setFirstName(firstName);
    localStorage.setItem('userFirstName', firstName);
  };

  const saveLastName = (lastName) => {
    console.log('Saving to context - last name:', lastName);
    setLastName(lastName);
    localStorage.setItem('userLastName', lastName);
  };

  const saveOtherEmail = async (otherEmail) => {
    console.log('Saving to context - other email:', otherEmail);
    setOtherEmail(otherEmail);
  };

  const saveSelectedBar = (barId) => {
    console.log('Saving to context - selected bar:', barId);
    setSelectedBar(barId);
    localStorage.setItem('selectedBar', barId);
  };

  const saveSelectedBarName = (barName) => {
    console.log('Saving to context - selected bar name:', barName);
    setSelectedBarName(barName);
    localStorage.setItem('selectedBarName', barName);
  };

  const saveConnectedSeats = (seats) => {
    console.log('Saving to context - connected seats:', seats);
    setConnectedSeats(seats);
    localStorage.setItem('connectedSeats', JSON.stringify(seats));
  }

  const saveSeats = (seats) => {
    console.log('Saving to context - seats:', seats);
    setSeats(seats);
    localStorage.setItem('seats', JSON.stringify(seats));
  }

  return (
    <SharedStateContext.Provider value={{
      email,
      setEmail: saveEmail,
      firstName,
      setFirstName: saveFirstName,
      lastName,
      setLastName: saveLastName,
      otherEmail,
      setOtherEmail: saveOtherEmail,
      managedBars, 
      setManagedBars, 
      selectedBar, 
      setSelectedBar: saveSelectedBar,
      selectedBarName,
      setSelectedBarName: saveSelectedBarName,
      connectedSeats,
      setConnectedSeats: saveConnectedSeats,
      seats,
      setSeats: saveSeats,
      isManager,
      setIsManager: saveIsManager,
    }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export { SharedStateContext, SharedStateProvider };
