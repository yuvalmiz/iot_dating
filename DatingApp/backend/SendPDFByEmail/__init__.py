import logging
import base64
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, Disposition, FileContent, FileName, FileType
import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
    email_from = os.getenv('SenderEmailAddress')

    req_body = req.get_json()
    pdf_base64 = req_body.get('pdf')
    email_to = req_body.get('email')

    if not all([sendgrid_api_key, email_from, pdf_base64, email_to]):
        return func.HttpResponse("Missing required fields", status_code=400)

    message = Mail(
        from_email=email_from,
        to_emails=email_to,
        subject='QR Code PDF',
        html_content='<strong>Please find the attached PDF with the QR codes.</strong>'
    )

    decoded_pdf = base64.b64decode(pdf_base64)
    attachment = Attachment(
        FileContent(pdf_base64),
        FileName('QRCode.pdf'),
        FileType('application/pdf'),
        Disposition('attachment')
    )

    message.attachment = attachment

    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        logging.info(response.status_code)
        logging.info(response.body)
        logging.info(response.headers)
        return func.HttpResponse("Email sent successfully", status_code=200)
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        return func.HttpResponse(f"Error sending email: {str(e)}", status_code=500)
