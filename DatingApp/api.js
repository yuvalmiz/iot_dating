const uploadToBlob = async (uri, containerName = 'uploads', blobName = `${Date.now()}.png`) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];

        const uploadResponse = await fetch('http://localhost:7071/api/UploadToBlob', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_data: base64data,
            container_name: containerName, // Ensure this matches the container name used in your Azure Function
            blob_name: blobName, // Use the custom blob name
          }),
        });

        if (uploadResponse.ok) {
          const url = await uploadResponse.text();
          resolve(url);
        } else {
          reject('Error uploading image');
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error uploading to blob:', error);
    throw error;
  }
};

const insertIntoTable = async (tableName, entity) => {
  console.log('Inserting into table:', tableName, entity);
  try {
    const response = await fetch('http://localhost:7071/api/InsertIntoTable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_name: tableName,
        entity: entity,
      }),
    });
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error inserting into table:', error);
    throw error;
  }
};

const readFromTable = async (tableName, queryFilter = '') => {
  console.log('Reading from table:', tableName, queryFilter);
  try {
    const response = await fetch('http://localhost:7071/api/ReadFromTable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_name: tableName,
        query_filter: queryFilter,
      }),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Error reading from table:', error);
    throw error;
  }
};

const startChat = async (user1Id, user2Id) => {
  try {
    const response = await fetch('http://localhost:7071/api/startChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user1_id: user1Id,
        user2_id: user2Id,
      }),
    });
    const chatId = await response.text();
    return chatId;
  } catch (error) {
    console.error('Error starting chat:', error);
    throw error;
  }
};

const sendMessage = async (chatId, senderId, message) => {
  try {
    const response = await fetch('http://localhost:7071/api/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        sender_id: senderId,
        message: message,
      }),
    });
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

const getMessages = async (chatId) => {
  try {
    const response = await fetch(`http://localhost:7071/api/getMessages?chat_id=${chatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const messages = await response.json();
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

const sendPdfViaEmail = async (pdfBase64, email) => {
  try {
    const response = await fetch('http://localhost:7071/api/SendPDFByEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf: pdfBase64,
        email: email,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send PDF via email.');
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error sending PDF via email:', error);
    throw error;
  }
};

export { startChat, sendMessage, getMessages, insertIntoTable, readFromTable, uploadToBlob, sendPdfViaEmail };
