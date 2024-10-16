import { useEffect, useState, useContext } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import variables from './staticVariables';
import { SharedStateContext } from '../context';


const useSignalR = ({onMessageReceived, onConnectSeat, onDisconnectSeat, groupName = "" }) => {
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

        newConnection.on('ReceiveMessage_' + groupName, (sender, reciver ,message, timestamp) => {
          console.log('Received message:', sender,reciver ,message, timestamp);
          if (onMessageReceived) {
            onMessageReceived(sender, message, timestamp);
          }
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
    if (groupName) {
      negotiate();
    }
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

  return { connection, joinGroup, leaveGroup };
};

export default useSignalR;
