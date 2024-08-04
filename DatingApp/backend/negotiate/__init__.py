import azure.functions as func
import json
import logging


def main(req: func.HttpRequest, connectionInfo) -> func.HttpResponse:
    return func.HttpResponse(
        connectionInfo.get_body().decode(),
        status_code=200,
        headers={
            'Content-type': 'application/json'
        }
    )