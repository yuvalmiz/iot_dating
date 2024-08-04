import logging
import azure.functions as func
import json

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    data = req.params.get('data')
    if not data:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            data = req_body.get('data')

    if data:
        logging.info(f'Received data: {data}')
        # Here we assume that the data is a JSON string. If it's not, you might need to adjust the parsing.
        try:
            embedded_info = json.loads(data)
        except json.JSONDecodeError:
            embedded_info = data

        return func.HttpResponse(
            json.dumps({"embedded_info": embedded_info}),
            mimetype="application/json"
        )
    else:
        return func.HttpResponse(
            "Please pass a data parameter in the query string or in the request body",
            status_code=400
        )
