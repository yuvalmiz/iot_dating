import logging
import azure.functions as func
import os
import json
from azure.data.tables import TableServiceClient

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        req_body = req.get_json()
        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str = connection_string)
        table_client = table_service_client.get_table_client(table_name=req_body['table_name'])

        query_filter = req_body.get('query_filter', '')
        entities = table_client.query_entities(query_filter=query_filter)

        entities_list = [entity for entity in entities]
        return func.HttpResponse(json.dumps(entities_list), status_code=200)
    except Exception as e:
        logging.error(f"Error: {e}")
        return func.HttpResponse("Error reading entities", status_code=500)
