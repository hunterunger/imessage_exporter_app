import { MessageGroupType } from "@/util/dataTypes";

const fakeMessageBase = {
    associated_message_guid: null,
    associated_message_type: 0,
    balloon_bundle_id: null,
    chat_id: 0,
    date: "2023-06-13 12:12:12",
    date_delivered: 0,
    date_edited: 0,
    date_read: 708325325148700000,
    deleted_from: null,
    expressive_send_style_id: null,
    group_action_type: 0,
    group_title: null,
    guid: "ABCDEF-123456-ABCDEF-123456",
    handle_id: 1,
    is_from_me: false,
    is_read: true,
    item_type: 0,
    num_attachments: 0,
    num_replies: 0,
    rowid: 0,
    service: "iMessage",
    subject: null,
    text: "Who’s free Friday for a hike?",
    thread_originator_guid: null,
    thread_originator_part: null,
};

const fakeMessageGroupBase: MessageGroupType = {
    message_group: 0,
    address: 0,
    messages: [],
    chat_type: "Group",
};

const fakeConversation: {
    is_from_me: boolean;
    text: string;
}[] = [
    {
        is_from_me: false,
        text: "Who’s free Friday for a hike?",
    },
    {
        is_from_me: true,
        text: "I’m free! 👍",
    },
    {
        is_from_me: false,
        text: "I’m free too!",
    },
    {
        is_from_me: true,
        text: "Awesome! Does 10am work for everyone?",
    },
    {
        is_from_me: false,
        text: "Sounds good to me!",
    },
    {
        is_from_me: true,
        text: "I’ll bring the snacks.",
    },
    {
        is_from_me: false,
        text: "Hopefully it doesn’t rain. The forecast says it might... :(",
    },
    {
        is_from_me: true,
        text: "I’ll bring a raincoat just in case.",
    },
];

export function generateFakeMessageGroup() {
    // compile fake message group
    const fakeMessages = [];

    for (let i = 0; i < fakeConversation.length; i++) {
        const fakeMessage = {
            ...fakeMessageBase,
            ...fakeConversation[i],
        };
        fakeMessages.push(fakeMessage);
    }

    const fakeMessageGroup: MessageGroupType = {
        ...fakeMessageGroupBase,
        messages: fakeMessages,
    };

    return fakeMessageGroup;
}
