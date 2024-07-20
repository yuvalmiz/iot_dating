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
  
  export { insertIntoTable, readFromTable };
  