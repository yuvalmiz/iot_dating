import logging
import azure.functions as func
import json
import os
from azure.data.tables import TableServiceClient

def main(req: func.HttpRequest, signalRDatingChat: func.Out[str]) -> func.HttpResponse:
    logging.info('Sending message via SignalR.')

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON body", status_code=400)

    user = req_body.get('user')
    other_user = req_body.get('otherUser')
    message = req_body.get('message')
    timestamp = req_body.get('timestamp')

    if not user or not other_user or not message or not timestamp:
        return func.HttpResponse("Missing user, otherUser, message, or timestamp", status_code=400)

    groupName = f"{sorted([user, other_user])[0]};{sorted([user, other_user])[1]}"
    logging.info(f"sending message toGroup name: {groupName}")
    signalRMessage = {
        "target": "ReceiveMessage_" + groupName,
        "arguments": [user, other_user ,message, timestamp],
    }
    
    signalRDatingChat.set(json.dumps(signalRMessage))
    
    try:
        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        table_client = table_service_client.get_table_client(table_name='BarTable')

        users = sorted([user, other_user])
        partition_key = f"{users[0]};{users[1]}"
        row_key = f"{timestamp}"

        entity = {
            "PartitionKey": partition_key,
            "RowKey": row_key,
            "Sender": user,
            "Message": message,
            "Timestamp": timestamp
        }

        table_client.create_entity(entity)

    except Exception as e:
        logging.error(f"Error inserting entity into table: {e}")
        return func.HttpResponse("Error inserting entity into table", status_code=500)

    return func.HttpResponse("Message sent successfully", status_code=200)
