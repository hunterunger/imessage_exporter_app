export type MessageType = {
    associated_message_guid: null;
    associated_message_type: number;
    balloon_bundle_id: null;
    chat_id: number | null;
    date: string;
    date_delivered: number;
    date_edited: number;
    date_read: number;
    deleted_from: null;
    expressive_send_style_id: null;
    group_action_type: number;
    group_title: null;
    guid: string;
    handle_id: number;
    is_from_me: boolean;
    is_read: boolean;
    item_type: number;
    num_attachments: number;
    num_replies: number;
    rowid: number;
    service: string;
    subject: null;
    text: string;
    thread_originator_guid: null;
    thread_originator_part: null;
};

export type MessageGroupType = {
    message_group: number;
    messages: MessageType[];
    chat_type: "Individual" | "Group";
    address: string | number;
};
