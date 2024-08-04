import logging
import azure.functions as func
import os
from azure.data.tables import TableServiceClient, TableEntity, UpdateMode

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        req_body = req.get_json()
        action = req_body.get('action')
        table_name = req_body.get('table_name')
        logging.info(f'Request body: {req_body}')
        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        table_client = table_service_client.get_table_client(table_name=table_name)

        entity = TableEntity(req_body['entity'])
        logging.info(f'Inserting entity: {entity}')
        if action == 'create':
            table_client.create_entity(entity=entity)
        elif action == 'update':
            existing_entity = table_client.get_entity(entity['PartitionKey'], entity['RowKey'])
            for key, value in entity.items():
                if key not in ['PartitionKey', 'RowKey']:
                    existing_entity[key] = value

        # Update the entity in the table
            table_client.update_entity(entity=entity)

        return func.HttpResponse("Entity added successfully", status_code=200)
    except Exception as e:
        logging.error(f"Error: {e}")
        return func.HttpResponse(f"Error: {e}", status_code=500)
