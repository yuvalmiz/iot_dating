import logging
import azure.functions as func
import os
from azure.data.tables import TableServiceClient

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Marking messages as read')

    try:
        req_body = req.get_json()
        user_email = req_body.get('user')  # The current user's email
        other_user_email = req_body.get('otherUser')  # The other participant's email

        if not user_email or not other_user_email:
            return func.HttpResponse("Invalid request: missing user or other user email", status_code=400)

        connection_string = os.getenv('AzureWebJobsStorage')
        table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        table_client = table_service_client.get_table_client(table_name="BarTable")

        # Construct the PartitionKey based on the two emails
        # users = sorted([user_email, other_user_email])
        # partition_key = f"{users[0]};{users[1]}"
        

        # Query to get all unread messages where the user is not the sender
        # query_filter = f"PartitionKey eq '{partition_key}' and Sender eq '{other_user_email}' and isRead eq false"
        query_filter = f"PartitionKey eq '{user_email}' and RowKey eq '{other_user_email}'"
        logging.info(f"Running query: {query_filter}")
        
        entities = table_client.query_entities(query_filter=query_filter)

        # Log the number of entities found
        entities_list = list(entities)  # Convert to a list to count
        logging.info(f"Number of unread messages found: {len(entities_list)}")

        if not entities_list:
            logging.info(f"No unread messages for {other_user_email} found.")
            return func.HttpResponse("No unread messages found", status_code=200)

        # Update all unread messages
        updated_count = 0
        for entity in entities_list:
            logging.info(f"Marking message as read: {entity}")
            entity["isRead"] = True
            # table_client.update_entity(entity, mode="Merge")
            table_client.update_entity(entity=entity)
            updated_count += 1

        logging.info(f"Total messages marked as read: {updated_count}")

        return func.HttpResponse(f"Messages marked as read: {updated_count}", status_code=200)

    except Exception as e:
        logging.error(f"Error marking messages as read: {e}")
        return func.HttpResponse(f"Error updating entities: {e}", status_code=500)
