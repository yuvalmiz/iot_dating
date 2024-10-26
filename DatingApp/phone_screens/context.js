import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SharedStateContext = createContext();

const SharedStateProvider = ({ children }) => {
  const [email, setEmail] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [managedBars, setManagedBars] = useState([]);
  const [selectedBar, setSelectedBar] = useState('');
  const [selectedBarName, setSelectedBarName] = useState('');
  const [connectedSeats, setConnectedSeats] = useState({});
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) setEmail(storedEmail);

        const storedFirstName = await AsyncStorage.getItem('userFirstName');
        if (storedFirstName) setFirstName(storedFirstName);

        const storedLastName = await AsyncStorage.getItem('userLastName');
        if (storedLastName) setLastName(storedLastName);

        const storedManagedBars = await AsyncStorage.getItem('managedBars');
        if (storedManagedBars) setManagedBars(JSON.parse(storedManagedBars));

        const storedConnectedSeats = await AsyncStorage.getItem('connectedSeats');
        if (storedConnectedSeats) setConnectedSeats(JSON.parse(storedConnectedSeats));

        const storedSelectedBar = await AsyncStorage.getItem('selectedBar');
        if (storedSelectedBar) setSelectedBar(storedSelectedBar);

        const storedSelectedBarName = await AsyncStorage.getItem('selectedBarName');
        if (storedSelectedBarName) setSelectedBarName(storedSelectedBarName);

        const storedSeats = await AsyncStorage.getItem('seats');
        if (storedSeats) setSeats(JSON.parse(storedSeats));
      } catch (error) {
        console.error('Failed to load stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  const saveEmail = async (email) => {
    setEmail(email);
    await AsyncStorage.setItem('userEmail', email);
  };

  const saveFirstName = async (firstName) => {
    setFirstName(firstName);
    await AsyncStorage.setItem('userFirstName', firstName);
  };

  const saveLastName = async (lastName) => {
    setLastName(lastName);
    await AsyncStorage.setItem('userLastName', lastName);
  };

  const saveOtherEmail = async (otherEmail) => {
    setOtherEmail(otherEmail);
    // Add storage if needed
  };

  const saveSelectedBar = async (barId) => {
    setSelectedBar(barId);
    await AsyncStorage.setItem('selectedBar', barId);
  };

  const saveSelectedBarName = async (barName) => {
    setSelectedBarName(barName);
    await AsyncStorage.setItem('selectedBarName', barName);
  };

  const saveConnectedSeats = async (seats) => {
    setConnectedSeats(seats);
    await AsyncStorage.setItem('connectedSeats', JSON.stringify(seats));
  };

  const saveSeats = async (seats) => {
    setSeats(seats);
    await AsyncStorage.setItem('seats', JSON.stringify(seats));
  };

  return (
    <SharedStateContext.Provider
      value={{
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
      }}
    >
      {children}
    </SharedStateContext.Provider>
  );
};

export { SharedStateContext, SharedStateProvider };
