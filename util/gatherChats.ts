import { MessageGroupType, MessageType } from "./dataTypes";

export default function gatherChats(chatData: MessageType[]) {
    // group by chat
    let groupedData: { [key: string]: MessageGroupType } = {};
    let count = 0;
    chatData.forEach((message: MessageType) => {
        if (message.chat_id === null) return;

        if (groupedData[message.chat_id]) {
            count++;
            groupedData[message.chat_id].messages.push(message);
        } else {
            groupedData[message.chat_id] = {
                message_group: message.chat_id,
                messages: [message],
                chat_type: message.chat_id === 0 ? "Group" : "Individual",
                address: message.chat_id,
            };
        }
    });

    return groupedData;
}
