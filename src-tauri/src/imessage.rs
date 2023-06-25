use chrono::{Duration, NaiveDateTime};
use imessage_database::util::query_context::QueryContext;
use imessage_database::{
    error::table::TableError,
    tables::{
        messages::Message,
        table::{get_connection, Table},
    },
};
use serde_json;
use serde_json::json;
use std::path::Path;

pub fn get_messages_json(
    path: &str,
    min_date_str: &str,
    max_date_str: &str,
) -> Result<String, TableError> {
    /*
    path: &str - the path to the iMessage database
    min_date_str: &str - the minimum date to get messages from in the format "YYYY-MM-DD HH:MM:SS"
    max_date_str: &str - the maximum date to get messages from in the format "YYYY-MM-DD HH:MM:SS"
    */

    // Create a read-only connection to an iMessage database
    let db_path = Path::new(path);
    let db = get_connection(db_path).unwrap();

    //
    let mut query_context = QueryContext::default();
    let _ = query_context.set_start(min_date_str);
    let _ = query_context.set_end(max_date_str);

    // Create SQL statement
    let mut statement = Message::stream_rows(&db, &query_context).map_err(|e| {
        println!("Error: {:?}", e);
        e
    })?;

    // get count of messages
    let total_messages = Message::get_count(&db, &query_context).map_err(|e| {
        println!("Error: {:?}", e);
        e
    })?;

    println!("Total Messages: {}", total_messages);

    // Execute statement
    let messages = statement
        .query_map([], |row| Ok(Message::from_row(row)))
        .unwrap();

    // create an empty vector to store the messages in a hashmap
    let mut messages_vec = Vec::new();

    for message in messages {
        let mut msg = Message::extract(message)?;
        let _ = msg.gen_text(&db);

        // convert the Unix timestamp to a NaiveDateTime object
        let date = msg.date;
        let unix_epoch = NaiveDateTime::from_timestamp_opt(0, 0).unwrap();
        let date_time =
            unix_epoch + Duration::seconds(date / 1_000_000_000) + Duration::seconds(978_307_200);

        // convert the NaiveDateTime object to a string
        let date_str = date_time.to_string();

        // create empty hashmap to store the message.
        let message_json = json!({
            "rowid": msg.rowid,
            "guid": msg.guid,
            "text": msg.text,
            "service": msg.service,
            "handle_id": msg.handle_id,
            "subject": msg.subject,
            "date": date_str,
            "date_read": msg.date_read,
            "date_delivered": msg.date_delivered,
            "is_from_me": msg.is_from_me,
            "is_read": msg.is_read,
            "item_type": msg.item_type,
            "group_title": msg.group_title,
            "group_action_type": msg.group_action_type,
            "associated_message_guid": msg.associated_message_guid,
            "associated_message_type": msg.associated_message_type,
            "balloon_bundle_id": msg.balloon_bundle_id,
            "expressive_send_style_id": msg.expressive_send_style_id,
            "thread_originator_guid": msg.thread_originator_guid,
            "thread_originator_part": msg.thread_originator_part,
            "date_edited": msg.date_edited,
            "chat_id": msg.chat_id,
            "num_attachments": msg.num_attachments,
            "deleted_from": msg.deleted_from,
            "num_replies": msg.num_replies,
        });

        // insert the hashmap into the vector
        messages_vec.push(message_json);
    }

    // reverse the vector so that the messages are in chronological order
    messages_vec.reverse();

    if total_messages > 1500 {
        // warn and cut off the messages
        println!("Warning: More than 1500 messages. Only the last 1500 messages will be saved.");
        messages_vec.truncate(1500);
    }

    // convert the Vec<Message> to a json string
    let json_string = serde_json::to_string(&messages_vec).unwrap();

    // to make a pretty json string
    // let json_string = serde_json::to_string_pretty(&messages_vec).unwrap();

    // return the json string
    Ok(json_string)
}
