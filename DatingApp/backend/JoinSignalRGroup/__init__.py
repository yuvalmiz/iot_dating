import logging
import azure.functions as func
import json
import os
from azure.data.tables import TableServiceClient

def main(req: func.HttpRequest, signalRDatingChat: func.Out[str]) -> func.HttpResponse:
    logging.info('joining group.')

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON body", status_code=400)

    user = req_body.get('user')
    other_user = req_body.get('otherUser')

    if not user or not other_user:
        return func.HttpResponse("Missing user, otherUser, message, or timestamp", status_code=400)

    groupName = f"{sorted([user, other_user])[0]};{sorted([user, other_user])[1]}"
    logging.info(f"sending message to group name: {groupName}")

    signalRDatingChat.set(json.dumps({
        'userId': user,
        'groupName': groupName,
        'action': 'add'
    }))
    

    return func.HttpResponse("group added successfully", status_code=200)
