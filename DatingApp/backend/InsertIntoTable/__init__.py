import logging
import azure.functions as func
import os
from azure.data.tables import TableServiceClient, TableEntity

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        req_body = req.get_json()
        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str = connection_string)
        table_client = table_service_client.get_table_client(table_name=req_body['table_name'])

        entity = TableEntity(req_body['entity'])
        table_client.create_entity(entity=entity)

        return func.HttpResponse("Entity added successfully", status_code=200)
    except Exception as e:
        logging.error(f"Error: {e}")
        return func.HttpResponse("Error adding entity", status_code=500)
