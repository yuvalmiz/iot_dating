import logging
import qrcode
import io
import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    data = req.params.get('data')
    if not data:
        logging.info('no datat')
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            data = req_body.get('data')

    if data:
        logging.info('datat is ' + data)
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        logging.info('QR code created')
        qr.add_data(data)
        logging.info('data added')
        qr.make(fit=True)
        logging.info('QR code made')
        img = qr.make_image(fill='black', back_color='white')
        logging.info('QR code image')
        buf = io.BytesIO()
        logging.info('buffer created')
        img.save(buf)
        logging.info('QR code saved')
        buf.seek(0)
        logging.info('QR code generated')
        return func.HttpResponse(buf.read(), mimetype="image/png")
    else:
        return func.HttpResponse(
            "Please pass a data parameter in the query string or in the request body",
            status_code=400
        )
