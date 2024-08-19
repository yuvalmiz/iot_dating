import logging
import azure.functions as func
import os
from azure.data.tables import TableServiceClient

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        req_body = req.get_json()
        table_name = req_body.get('table_name')
        partition_key = req_body.get('partition_key')
        row_key = req_body.get('row_key')
        logging.info(f'Deleting entity with PartitionKey: {partition_key}, RowKey: {row_key} from table: {table_name}')

        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        table_client = table_service_client.get_table_client(table_name=table_name)

        # Delete the entity from the table
        table_client.delete_entity(partition_key, row_key)

        return func.HttpResponse("Entity deleted successfully", status_code=200)
    except Exception as e:
        logging.error(f"Error: {e}")
        return func.HttpResponse(f"Error: {e}", status_code=500)
