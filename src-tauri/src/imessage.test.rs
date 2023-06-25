#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_messages_json() {
        let path = "/Users/hunterunger/Library/Messages/chat.db";
        let min_date_str = "2021-01-01 00:00:00";
        let max_date_str = "2021-01-31 23:59:59";

        let result = get_messages_json(path, min_date_str, max_date_str);

        assert!(result.is_ok());
        let messages_json = result.unwrap();
        assert!(!messages_json.is_empty());
    }
}
