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
    groupName = req_body.get('groupName')

    if not groupName:
        return func.HttpResponse("Missing user, otherUser, message, or timestamp", status_code=400)

    logging.info(f"sending message toGroup name: {groupName}")
    signalRMessage = {
        "target": "ReceiveMessage_" + groupName,
        "arguments": [user, other_user ,message, timestamp],
    }
    
    signalRDatingChat.set(json.dumps(signalRMessage))
    


    return func.HttpResponse("Message sent successfully", status_code=200)
