import logging
import azure.functions as func
import os
from azure.storage.blob import BlobServiceClient
import uuid
from io import BytesIO
import base64

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        req_body = req.get_json()
        image_data = req_body.get('image_data')
        container_name = req_body.get('container_name', 'uploads')
        blob_name = req_body.get('blob_name')

        if not image_data or not blob_name:
            logging.error('Missing required parameters')
            return func.HttpResponse("Missing required parameters", status_code=400)

        blob_service_client = BlobServiceClient.from_connection_string(os.getenv('AzureWebJobsStorage'))
        container_client = blob_service_client.get_container_client(container_name)

        blob_client = container_client.get_blob_client(blob_name)

        image_bytes = base64.b64decode(image_data)
        blob_client.upload_blob(BytesIO(image_bytes), overwrite=True)  # Ensure the blob is overwritten if it exists

        blob_url = blob_client.url
        logging.info(f'Image uploaded successfully: {blob_url}')
        return func.HttpResponse(blob_url, status_code=200)

    except Exception as e:
        logging.error(f"Error: {e}")
        return func.HttpResponse(f"Error: {e}", status_code=500)
