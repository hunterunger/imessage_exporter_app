// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod exporters;

pub use exporters::{exporter::Exporter, html::HTML, txt::TXT};

use app::{
    options::{get_command, Options},
    runtime::Config,
};

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

#[tauri::command]
fn html_export(custompath: &str, customoutput: &str, fromdate: &str, todate: &str) -> Vec<String> {
    let path;

    if custompath != "" {
        path = custompath.to_string();
    } else {
        let default_path = default_db_path();

        path = default_path.to_str().unwrap().to_string();
    };

    // Get args from command line
    let cli_args: Vec<&str> = vec![
        "imessage-exporter",
        "-f",
        "html",
        "-c",
        "compatible",
        "-p",
        path.as_str(),
        "-o",
        customoutput,
        "--start-date",
        fromdate,
        "--end-date",
        todate,
        "--no-lazy",
    ];
    let command = get_command();
    let args = command.get_matches_from(cli_args);

    // Create application options
    let options = Options::from_args(&args);

    // Create app state and start
    if let Err(why) = &options {
        eprintln!("{why}");
    } else {
        match Config::new(options.unwrap()) {
            Ok(app) => {
                if let Err(why) = app.start() {
                    eprintln!("Unable to start: {why}");
                }
            }
            Err(why) => {
                eprintln!("Unable to launch: {why}");
            }
        }
    }

    // list all the files in the output directory
    let output = std::fs::read_dir(customoutput).unwrap();

    // create an empty vector to store the file names
    let mut files = Vec::new();

    // iterate over the files in the output directory
    for file in output {
        // get the file name
        let file = file.unwrap().file_name().into_string().unwrap();

        // add the file name to the vector
        files.push(file);
    }

    files.retain(|x| x != "orphaned");

    // return the file names to the frontend
    files
}

#[tauri::command]
fn run_shell_command(command: &str) -> String {
    /*
    Run a shell command and return the output.
    */

    // run the command
    let output = std::process::Command::new("sh")
        .arg("-c")
        .arg(command)
        .output()
        .expect("failed to execute sh");

    // convert the output to a string
    let output = String::from_utf8_lossy(&output.stdout).to_string();

    // return the output
    output
}

#[tauri::command]
fn copy_dir(src: &str, dest: &str) -> bool {
    /*
    Copy a directory from src to dest.
    */

    // copy the directory
    let result = fs_extra::dir::copy(src, dest, &fs_extra::dir::CopyOptions::new());

    // return true if the directory was copied successfully
    result.is_ok()
}

fn main() {
    // let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    // let close = CustomMenuItem::new("close".to_string(), "Close");
    // let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    // let menu = Menu::new()
    // .add_native_item(MenuItem::Copy)
    //     .add_item(CustomMenuItem::new("hide", "Hide"))
    //     .add_submenu(submenu);

    tauri::Builder::default()
        // .menu(menu)
        .invoke_handler(tauri::generate_handler![
            get_messages,
            test_disk_permission,
            run_shell_command,
            html_export,
            copy_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
