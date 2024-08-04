import logging
import azure.functions as func
import json
import os
from azure.data.tables import TableServiceClient, UpdateMode

def main(req: func.HttpRequest, signalRDatingChat: func.Out[str]) -> func.HttpResponse:
    logging.info('seats via SignalR.')

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON body", status_code=400)

    user = req_body.get('user')
    seat = req_body.get('seat')
    action = req_body.get('action')

    if not user or not seat or not action:
        return func.HttpResponse("Missing user, otherUser, message, or timestamp", status_code=400)

    if action == 'add':
        logging.info(f"adding user: {user} to seat: {seat}")
        signalRMessage = {
            "target": "connectSeat",
            "arguments": [seat, user],
        }
    if action == "remove":
        logging.info(f"removing user: {user} from seat: {seat}")
        signalRMessage = {
            "target": "disconnectSeat",
            "arguments": [seat],
        }
    
    signalRDatingChat.set(json.dumps(signalRMessage))
    
    try:
        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        table_client = table_service_client.get_table_client(table_name='BarTable')
        
        partition_key = f"bar_1"
        row_key = seat

        entity = {
            "PartitionKey": partition_key,
            "RowKey": row_key,
        }

        if action == 'add':
            entity["connectedUser"] = user
        elif action == 'remove':
            entity["connectedUser"] = ""

        table_client.update_entity(mode=UpdateMode.MERGE, entity=entity)


    except Exception as e:
        logging.error(f"Error inserting entity into table: {e}")
        return func.HttpResponse("Error inserting entity into table", status_code=500)

    return func.HttpResponse("Message sent successfully", status_code=200)
