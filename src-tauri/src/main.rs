// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod imessage;
use crate::imessage::get_messages_json;
use imessage_database::util::dirs::default_db_path;
use std;
use std::fs;

#[tauri::command]
fn get_messages(custompath: &str, fromdate: &str, todate: &str) -> String {
    /*
    Open the chat.db file, and read the messages table, converting it to a JSON string, and returning it to the frontend.
    */

    // default path to chat.db

    // if the user has specified a custom path, use that instead

    let path;

    if custompath != "" {
        path = custompath.to_string();
    } else {
        let default_path = default_db_path();

        path = default_path.to_str().unwrap().to_string();
    };

    // run the query
    let result = get_messages_json(&path, fromdate, todate);

    // ensure result is a string
    let result = result.unwrap();

    // return the JSON string to the frontend
    result
}

#[tauri::command]
fn test_disk_permission() -> bool {
    /*
    Test if the user has permission to read the chat.db file.
    */

    // default path to chat.db
    let secured_path = default_db_path();

    // try to open the file
    let file_exists = fs::File::open(&secured_path).is_ok();

    // return true if the app has permission to read the file
    file_exists
}

fn main() {
    // let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    // let close = CustomMenuItem::new("close".to_string(), "Close");
    // let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    // let menu = Menu::new()
    //     // .add_native_item(MenuItem::Copy)
    //     .add_item(CustomMenuItem::new("hide", "Hide"))
    //     .add_submenu(submenu);

    tauri::Builder::default()
        // .menu(menu)
        .invoke_handler(tauri::generate_handler![get_messages, test_disk_permission])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
