import { useEffect, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const useSignalR = (onMessageReceived) => {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const negotiate = async () => {
      try {
        const response = await fetch('http://localhost:7071/api/negotiate');
        if (!response.ok) {
          throw new Error(`Negotiation error: ${response.statusText}`);
        }
        const connectionInfo = await response.json();

        const newConnection = new HubConnectionBuilder()
          .withUrl(connectionInfo.url, {
            accessTokenFactory: () => connectionInfo.accessToken,
          })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        newConnection.on('ReceiveMessage', (user, message, timestamp) => {
          console.log('Received message:', user, message, timestamp);
          onMessageReceived(user, message, timestamp);
        });

        await newConnection.start();
        setConnection(newConnection);
      } catch (error) {
        console.error('Negotiation error:', error);
      }
    };

    negotiate();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  const sendMessage = async (user, otherUser, message, timestamp) => {
    try {
      const response = await fetch('http://localhost:7071/api/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user,
          otherUser,
          message,
          timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error(`Send Message Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Send Message Error:', error);
    }
  };

  return { sendMessage, connection };
};

export default useSignalR;
