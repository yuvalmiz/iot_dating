import variables from "./services/staticVariables";
const { local } = variables();

const uploadToBlob = async (uri, containerName = 'uploads', blobName = `${Date.now()}.png`) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];

        url = local ? 'http://localhost:7071/api/UploadToBlob' : 'https://functionappdatingiot.azurewebsites.net/api/uploadtoblob';

        const uploadResponse = await fetch(url, {
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

const insertIntoTable = async ({tableName, entity, action = "create"}) => {
  console.log('Inserting into table:', tableName, entity);
  url = local ? 'http://localhost:7071/api/InsertIntoTable' : 'https://functionappdatingiot.azurewebsites.net/api/insertintotable';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_name: tableName,
        entity: entity,
        action: action,
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
  url = local ? 'http://localhost:7071/api/ReadFromTable' : 'https://functionappdatingiot.azurewebsites.net/api/ReadFromTable?';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_name: tableName,
        query_filter: queryFilter,
      })
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Error reading from table:', error);
    throw error;
  }
};

const saveMessage = async (user1, user2, message) => {
  const users = [user1, user2].sort();
  const partitionKey = `${users[0]};${users[1]}`;
  const rowKey = `${Date.now()}`;
  const entity = {
    PartitionKey: partitionKey,
    RowKey: rowKey,
    User: user1,
    Message: message,
  };
  return await insertIntoTable('BarTable', entity);
};

const getMessages = async (user1, user2) => {
  const users = [user1, user2].sort();
  const partitionKey = `${users[0]};${users[1]}`;
  const queryFilter = `PartitionKey eq '${partitionKey}'`;
  return await readFromTable('BarTable', queryFilter);
};

const sendPdfViaEmail = async (pdfBase64, email) => {
  console.log('Sending PDF via email:', email);
  url = local ? 'http://localhost:7071/api/SendPDFByEmail' : 'https://functionappdatingiot.azurewebsites.net/api/sendpdfbyemail';
  try {
    const response = await fetch(url, {
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

export { saveMessage, getMessages, insertIntoTable, readFromTable, uploadToBlob, sendPdfViaEmail };
