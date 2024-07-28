import logging
import azure.functions as func
import os
import json
from azure.data.tables import TableServiceClient
from datetime import datetime

def main(req: func.HttpRequest, signalRDatingChat: func.Out[str]) -> func.HttpResponse:
    logging.info('Sending message via SignalR and saving to table storage.')

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            "Invalid JSON body",
            status_code=400
        )

    user = req_body.get('user')
    message = req_body.get('message')
    sender = req_body.get('sender')

    if not user or not message or not sender:
        return func.HttpResponse(
            "Missing user, sender, or message",
            status_code=400
        )

    # Send the message via SignalR
    signalRMessage = {
        "target": "newMessage",
        "arguments": [sender, message]
    }
    signalRDatingChat.set(json.dumps(signalRMessage))

    # Save the message to Azure Table Storage
    try:
        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        table_client = table_service_client.get_table_client(table_name='BarTable')

        users = [user, sender]
        users.sort()
        partition_key = f"{users[0]};{users[1]}"
        row_key = str(int(datetime.utcnow().timestamp() * 1000))

        message_entity = {
            "PartitionKey": partition_key,
            "RowKey": row_key,
            "Sender": sender,
            "Message": message,
            "Timestamp": datetime.utcnow().isoformat()
        }

        table_client.create_entity(entity=message_entity)
    except Exception as e:
        logging.error(f"Error saving message to table storage: {e}")
        return func.HttpResponse("Error saving message", status_code=500)

    return func.HttpResponse(
        "Message sent and saved successfully",
        status_code=200
    )
