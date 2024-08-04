import { useEffect, useState, useContext } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import variables from './staticVariables';
import { SharedStateContext } from '../context';


const useSignalR = ({onMessageReceived, onConnectSeat, onDisconnectSeat, otherEmail }) => {
  const [connection, setConnection] = useState(null);
  const { local } = variables();
  const { email } = useContext(SharedStateContext)

  useEffect(() => {
    const negotiate = async () => {
      try {
        url = local ? 'http://localhost:7071/api/negotiate' : 'https://functionappdatingiot.azurewebsites.net/api/negotiate';
        const response = await fetch(url);
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

        newConnection.on('ReceiveMessage', (sender, reciver ,message, timestamp) => {
          console.log('Received message:', sender,reciver ,message, timestamp);
          user = [sender, reciver].sort().join(';');
          recivers = [email, otherEmail].sort().join(';');
          if (user !== recivers) {
            return;
          }
          onMessageReceived(sender, message, timestamp);
        });

        newConnection.on('connectSeat',(seat_id, user_id) => {
          onConnectSeat(seat_id, user_id);
        } )

        newConnection.on('disconnectSeat',(seat_id) => {
          onDisconnectSeat(seat_id, user_id);
        } )

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

  const joinGroup = async (groupName) => {
    if (connection) {
      await connection.invoke('JoinGroup', groupName);
    }
  };

  const leaveGroup = async (groupName) => {
    if (connection) {
      await connection.invoke('LeaveGroup', groupName);
    }
  };

  const sendMessage = async (user, otherUser, message, timestamp) => {
    url = local ? 'http://localhost:7071/api/sendMessage' : 'https://functionappdatingiot.azurewebsites.net/api/sendmessage';
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

  return { sendMessage, connection, joinGroup, leaveGroup };
};

export default useSignalR;
