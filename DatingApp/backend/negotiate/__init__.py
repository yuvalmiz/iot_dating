import azure.functions as func
import json
import logging

def main(req: func.HttpRequest, connectionInfo) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request - negotiate')
    connectionInfo = json.loads(connectionInfo)
    connection_info_dict = {
        "url": connectionInfo["url"],
        "accessToken": connectionInfo["accessToken"]
    }
    return func.HttpResponse(json.dumps(connection_info_dict))