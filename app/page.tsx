"use client";

import DiskAccessDialog from "@/components/DiskAccessDialog";
import { generateFakeMessageGroup } from "@/mocks/fakeMessages";
import { MessageGroupType, MessageType, SavefileType } from "@/util/dataTypes";
import trimTextPretty from "@/util/trimTextPretty";
import {
    DocumentArrowUpIcon,
    FolderIcon,
    PhotoIcon,
    PlayIcon,
    XCircleIcon,
} from "@heroicons/react/24/solid";
import { open, save } from "@tauri-apps/api/dialog";
import { writeFile } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import moment from "moment";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import gatherChats from "../util/gatherChats";

export default function Home() {
    const [exportFilepath, setExportFilepath] = useState<string>("");
    const [messagesGroups, setMessageGroups] = useState<{
        [key: string]: MessageGroupType;
    }>();
    const [permissionSuccess, setPermissionSuccess] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<"Date" | "Name">("Date");
    const [filters, setFilters] = useState<{
        dateFrom: string;
        dateTo: string;
        chatId: string;
    }>({
        dateFrom: moment().subtract(1, "months").format("YYYY-MM-DD"),
        dateTo: moment().format("YYYY-MM-DD"),
        chatId: "",
    });

    useEffect(() => {
        // check if development environment
        if (process.env.NODE_ENV === "production") {
            document.addEventListener("contextmenu", function (event) {
                event.preventDefault();
            });
        }
    }, []);

    const loadFile = () => {
        if (process.env.NEXT_PUBLIC_SCREENSHOT_MODE === "true") {
            setMessageGroups({
                "1": generateFakeMessageGroup(),
            });
            return;
        }

        invoke<string>("get_messages", {
            custompath: exportFilepath,
            fromdate: filters.dateFrom,
            todate: filters.dateTo,
        }).then((data) => {
            let parsedData: MessageType[] = JSON.parse(data);

            // group by chat
            let groupedData = gatherChats(parsedData);

            setMessageGroups(groupedData);
        });
    };

    return (
        <main className="flex min-h-screen flex-col p-3">
            <DiskAccessDialog setPermissionSuccess={setPermissionSuccess} />
            <div className=" flex flex-row justify-between items-center ">
                <DatesSelector
                    startDate={moment(filters.dateFrom).toDate()}
                    endDate={moment(filters.dateTo).toDate()}
                    setStartDate={(date: Date) =>
                        setFilters({
                            ...filters,
                            dateFrom: moment(date).format("YYYY-MM-DD"),
                        })
                    }
                    setEndDate={(date: Date) =>
                        setFilters({
                            ...filters,
                            dateTo: moment(date).format("YYYY-MM-DD"),
                        })
                    }
                />
                <div className=" flex flex-row h-min gap-3 items-center flex-wrap ">
                    {exportFilepath != "" && (
                        <div className="text-sm text-gray-400">
                            {trimTextPretty(exportFilepath, 30, true)}
                            <XCircleIcon
                                className="w-4 inline-block ml-1 cursor-pointer"
                                onClick={() => {
                                    setExportFilepath("");
                                }}
                            />
                        </div>
                    )}
                    <ThemedButton
                        onClick={() => {
                            open({
                                filters: [
                                    {
                                        name: "Database",
                                        extensions: ["db"],
                                    },
                                ],
                            }).then((result) => {
                                if (result === undefined) return;
                                // result is either an array, string, or undefined
                                if (Array.isArray(result)) {
                                    setExportFilepath(result[0]);
                                } else if (typeof result === "string") {
                                    setExportFilepath(result);
                                }
                            });
                        }}
                    >
                        <FolderIcon className="w-5" />
                        Open
                    </ThemedButton>
                    <ThemedButton
                        onClick={loadFile}
                        disabled={!permissionSuccess && exportFilepath === ""}
                    >
                        <PlayIcon className="w-5" />
                        Load
                    </ThemedButton>
                </div>
            </div>

            {!messagesGroups ? (
                // centre in absolute centre
                <p className="text-center text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    Press <PlayIcon className="w-5 inline-block" /> to load
                </p>
            ) : (
                <div className="flex flex-col gap-3 w-full relative">
                    {Object.values(messagesGroups)
                        .sort((a, b) => {
                            if (sortBy === "Date") {
                                return (
                                    new Date(b.messages[0].date).getTime() -
                                    new Date(a.messages[0].date).getTime()
                                );
                            } else {
                                return a.address
                                    .toString()
                                    .localeCompare(b.address.toString());
                            }
                        })
                        .map((group) => (
                            <GroupItem group={group} key={group.address} />
                        ))}
                </div>
            )}
        </main>
    );
}

function ThemedButton(props: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            disabled={props.disabled}
            className=" flex gap-1 flex-row font-medium px-2 py-1 items-center bg-opacity-10 dark:bg-white dark:bg-opacity-20 bg-black rounded-lg w-fit"
            {...props}
            style={{
                opacity: props.disabled ? 0.5 : 1,
            }}
        />
    );
}

function GroupItem(props: { group: MessageGroupType }) {
    // get 5 latest messages
    const { group } = props;

    const [messagesShown, setMessagesShown] = useState<number>(3);

    return (
        <div
            className="bg-white shadow overflow-hidden sm:rounded-lg w-full relative"
            key={props.group.message_group}
        >
            <div className="px-4 py-5 sm:px-6 flex flex-row justify-between sticky top-0">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        <span className=" text-gray-800 font-bold select-text">
                            {moment(props.group.messages[0].date).format(
                                // "Sunday, February 14th 2010, 3:25:50 pm"
                                "MMMM Do, YYYY"
                            )}
                        </span>
                    </h3>
                    <h3 className="text-sm leading-6 font-medium text-gray-500">
                        <span className=" font-medium">
                            {"Chat " + props.group.message_group}
                        </span>
                    </h3>
                </div>
                <div className="flex gap-3">
                    {/* <button
                        onClick={() => {
                            save({
                                defaultPath:
                                    "messages-" + group.message_group + ".json",
                                filters: [
                                    {
                                        name: "JSON",
                                        extensions: ["json"],
                                    },
                                ],
                            })
                                .then((filepath) => {
                                    console.log(filepath);
                                    if (!filepath) return;
                                    writeFile(
                                        filepath,
                                        JSON.stringify(group)
                                    ).then(() => {
                                        console.log("done");
                                    });
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                        }}
                        className=" text-black rounded"
                    >
                        <ArrowUpOnSquareIcon className="w-5" />
                    </button> */}
                    <button
                        onClick={async () => {
                            const filepath = await save({
                                defaultPath:
                                    "messages-" +
                                    group.message_group +
                                    ".msgai",
                                filters: [
                                    {
                                        name: "Message AI Config File",
                                        extensions: ["msgai"],
                                    },
                                ],
                            });

                            if (!filepath) return;

                            const newSavefile: SavefileType = {
                                version: "0.1.0",
                                originalGroup: group,
                                generatedMessages: [],
                            };

                            await writeFile(
                                filepath,
                                JSON.stringify(newSavefile)
                            );
                            // await openNewWindow(
                            //     "Chat",
                            //     "/chat?file=" + filepath
                            // );
                        }}
                        className=" text-black"
                    >
                        <DocumentArrowUpIcon className="w-6" />
                    </button>
                </div>
            </div>
            <div className="border-t border-gray-200">
                <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                            Latest Messages
                        </dt>
                        <dd className="mt-1 sm:mt-0 sm:col-span-2 gap-2 flex flex-col">
                            {group.messages.length >= messagesShown && (
                                <button
                                    onClick={() => {
                                        setMessagesShown(messagesShown + 5);
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Show More
                                </button>
                            )}
                            {props.group.messages
                                .filter((v) => v.text != null)
                                .slice(0, messagesShown)
                                .reverse()
                                .map((message, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col gap-1"
                                    >
                                        <button
                                            className=" text-xs text-gray-500 text-right"
                                            style={{
                                                alignSelf: message.is_from_me
                                                    ? "flex-end"
                                                    : "flex-start",
                                            }}
                                            disabled
                                            onClick={() => {
                                                // copy date to clipboard in the format mm/dd/yyyy
                                                // clipboard.writeText(
                                                //     moment(message.date).format(
                                                //         "MM/DD/YYYY"
                                                //     )
                                                // );
                                            }}
                                        >
                                            {moment(message.date).format(
                                                // "Sunday, February 14th 2010, 3:25:50 pm"
                                                "MMMM Do YYYY, h:mma"
                                            )}
                                        </button>
                                        <div
                                            className=" rounded-lg text-sm p-3 w-fit select-text"
                                            style={{
                                                // gradient
                                                background: message.is_from_me
                                                    ? "linear-gradient(0deg, #30a0fd 0%, #46b3fb 100%)"
                                                    : "linear-gradient(0deg, #e9e9eb 0%, #e9e9eb 100%)",
                                                color: message.is_from_me
                                                    ? "white"
                                                    : "black",

                                                textAlign: message.is_from_me
                                                    ? "right"
                                                    : "left",
                                                alignSelf: message.is_from_me
                                                    ? "flex-end"
                                                    : "flex-start",
                                            }}
                                            key={message.guid}
                                        >
                                            {message.num_attachments > 0 && (
                                                <div>
                                                    <PhotoIcon className="w-20 inline" />
                                                </div>
                                            )}
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

function DatesSelector(props: {
    startDate: Date;
    setStartDate: (date: Date) => void;
    endDate: Date;
    setEndDate: (date: Date) => void;
}) {
    return (
        <div className="flex flex-row gap-2 items-center my-3 flex-wrap">
            <div>
                <h3 className="font-medium text-xs">From Date</h3>
                <DatePicker
                    selected={props.startDate}
                    onChange={props.setStartDate}
                    selectsStart
                    startDate={props.startDate}
                    endDate={props.endDate}
                    className="rounded-md text-black p-2 w-32"
                    title="From Date"
                />
            </div>
            <div>
                <h3 className="font-medium text-xs">To Date</h3>
                <DatePicker
                    selected={props.endDate}
                    onChange={props.setEndDate}
                    selectsEnd
                    startDate={props.startDate}
                    endDate={props.endDate}
                    minDate={props.startDate}
                    className="rounded-md text-black p-2 w-32"
                />
            </div>
        </div>
    );
}
