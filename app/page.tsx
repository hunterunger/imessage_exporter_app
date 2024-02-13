"use client";

import DiskAccessDialog from "@/components/DiskAccessDialog";
import { generateFakeMessageGroup } from "@/mocks/fakeMessages";
import { MessageGroupType, MessageType } from "@/util/dataTypes";
import trimTextPretty from "@/util/trimTextPretty";
import {
    ArrowUpOnSquareIcon,
    FolderIcon,
    PhotoIcon,
    PlayIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { open, save } from "@tauri-apps/api/dialog";
import { copyFile, exists, writeFile } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import moment from "moment";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { removeDir, BaseDirectory } from "@tauri-apps/api/fs";
import getDataDir from "@/util/getDataDir";

export default function Home() {
    const [filepath, setFilepath] = useState<string>("");
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
        dateFrom: moment().subtract(1, "week").format("YYYY-MM-DD"),
        dateTo: moment().format("YYYY-MM-DD"),
        chatId: "",
    });

    const [chatrooms, setChatrooms] = useState<string[]>();

    useEffect(() => {
        // check if development environment
        if (process.env.NODE_ENV === "production") {
            document.addEventListener("contextmenu", function (event) {
                event.preventDefault();
            });
        }
    }, []);

    useEffect(() => {
        try {
            if (!!navigator && permissionSuccess) {
                loadHtmlFiles();
            }
        } catch (e) {
            console.error(e);
        }
    }, [permissionSuccess]);

    const loadFile = () => {
        if (process.env.NEXT_PUBLIC_SCREENSHOT_MODE === "true") {
            setMessageGroups({
                "1": generateFakeMessageGroup(),
            });
            return;
        }

        invoke<string>("get_messages", {
            custompath: filepath,
            fromdate: filters.dateFrom,
            todate: filters.dateTo,
        }).then((data) => {
            let parsedData: MessageType[] = JSON.parse(data);

            // group by chat
            let groupedData: { [key: string]: MessageGroupType } = {};
            let count = 0;
            parsedData.forEach((message: MessageType) => {
                if (message.chat_id === null) return;

                if (groupedData[message.chat_id]) {
                    count++;
                    groupedData[message.chat_id].messages.push(message);
                } else {
                    groupedData[message.chat_id] = {
                        chat_id: message.chat_id,
                        messages: [message],
                        chat_type:
                            message.chat_id === 0 ? "Group" : "Individual",
                        address: message.chat_identifier,
                    };
                }
            });

            setMessageGroups(groupedData);
        });
    };

    const loadHtmlFiles = async (path?: string) => {
        if (!permissionSuccess || typeof window == "undefined") return;

        const outputFolderName = "html_export";

        const appDataDirPath = await getDataDir();

        const outputDataExists = await exists(outputFolderName, {
            dir: BaseDirectory.AppData,
        });

        if (!path && outputDataExists) {
            console.log("removing", outputFolderName);
            await removeDir(outputFolderName, {
                dir: BaseDirectory.AppData,
                recursive: true,
            });
        }

        const newChatrooms = await invoke<string[]>(outputFolderName, {
            custompath: "",
            customoutput: path
                ? path + "/" + outputFolderName
                : appDataDirPath + outputFolderName,
            fromdate: filters.dateFrom,
            todate: filters.dateTo,
        });

        setChatrooms(
            newChatrooms
                .sort((a, b) => a.toString().localeCompare(b.toString()))
                .filter((v) => !["attachments", "orphaned.html"].includes(v))
        );
    };

    return (
        <main className="flex min-h-screen flex-col p-3">
            <DiskAccessDialog setPermissionSuccess={setPermissionSuccess} />
            <div className="flex gap-2">
                <ThemedButton
                    onClick={async () => {
                        loadHtmlFiles();
                    }}
                >
                    <PlayIcon className="w-5" />
                    Reload
                </ThemedButton>
                <ThemedButton
                    onClick={async () => {
                        open({ directory: true }).then((result) => {
                            console.log(result);
                            if (typeof result != "string") return;

                            loadHtmlFiles(result);
                        });
                    }}
                >
                    <ArrowUpOnSquareIcon className="w-5" />
                    Export All With Attachments
                </ThemedButton>
            </div>
            <div className=" row gap-3 hidden">
                <ThemedButton
                    onClick={loadFile}
                    disabled={!permissionSuccess && filepath === ""}
                >
                    <PlayIcon className="w-5" />
                    Load
                </ThemedButton>
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
                                setFilepath(result[0]);
                            } else if (typeof result === "string") {
                                setFilepath(result);
                            }
                        });
                    }}
                >
                    <FolderIcon className="w-5" />
                    Custom
                </ThemedButton>
                <div>
                    {filepath === "" ? (
                        <></>
                    ) : (
                        <div className="text-sm text-gray-400">
                            {trimTextPretty(filepath, 30, true)}
                            <XCircleIcon
                                className="w-4 inline-block ml-1 cursor-pointer"
                                onClick={() => {
                                    setFilepath("");
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
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
            {chatrooms ? (
                <div>
                    <h3 className="leading-6 font-medium mb-2">Chat Groups</h3>
                    <div className="flex flex-col gap-2 mb-2">
                        {chatrooms.map((chatroom) => (
                            <div
                                className="w-full dark:bg-white dark:bg-opacity-20 bg-white rounded-lg p-2 hover:bg-opacity-20 flex flex-row justify-between items-center"
                                key={chatroom}
                            >
                                <p className=" whitespace-pre">
                                    {chatroom
                                        .replace(".html", "")
                                        .replaceAll(", ", "\n")}
                                </p>
                                <ArrowUpOnSquareIcon
                                    onClick={async () => {
                                        save({
                                            defaultPath: chatroom,
                                            filters: [
                                                {
                                                    name: "HTML",
                                                    extensions: ["html"],
                                                },
                                            ],
                                        }).then(async (filepath) => {
                                            if (!filepath) return;

                                            const appDataDirPath =
                                                await getDataDir();

                                            await copyFile(
                                                appDataDirPath +
                                                    "html_export/" +
                                                    chatroom,
                                                filepath
                                            );

                                            console.log({
                                                src:
                                                    appDataDirPath +
                                                    "html_export/attachments/",
                                                dest:
                                                    filepath?.split("/")[0] +
                                                    "_attachments/",
                                            });
                                        });
                                    }}
                                    className="w-5 cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <></>
            )}

            {!messagesGroups ? (
                <></>
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
            className=" flex gap-1 flex-row font-medium px-2 py-1 bg-opacity-10 dark:bg-white dark:bg-opacity-20 bg-black rounded-lg w-fit"
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

    return (
        <div
            className="bg-white shadow overflow-hidden sm:rounded-lg w-full relative"
            key={props.group.chat_id}
        >
            <div className="px-4 py-5 sm:px-6 flex flex-row justify-between sticky top-0">
                <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">
                    <span className=" text-gray-800 font-bold select-text">
                        {props.group.address}
                    </span>
                </h3>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            save({
                                defaultPath:
                                    "messages-" + group.address + ".json",
                                filters: [
                                    {
                                        name: "JSON",
                                        extensions: ["json"],
                                    },
                                ],
                            })
                                .then((filepath) => {
                                    console.log("filepath", filepath);
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
                        className=" hover:bg-opacity-30 text-black rounded"
                    >
                        <ArrowUpOnSquareIcon className="w-5" />
                    </button>
                </div>
            </div>
            <div className="border-t border-gray-200">
                <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                            Last Message
                        </dt>
                        <dd className="mt-1 sm:mt-0 sm:col-span-2 gap-1 flex flex-col">
                            {props.group.messages
                                .filter((v) => v.text != null)
                                .slice(0, 20)
                                .reverse()
                                .map((message) => (
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
                                    >
                                        {message.num_attachments > 0 && (
                                            <div>
                                                <PhotoIcon className="w-20 inline" />
                                            </div>
                                        )}
                                        {message.text}
                                    </div>
                                ))}
                        </dd>
                        <dt className="text-sm font-medium text-gray-500">
                            Last Message Date
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {moment(props.group.messages[0].date).format(
                                // "Sunday, February 14th 2010, 3:25:50 pm"
                                "MMMM Do YYYY, h:mma"
                            )}
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
                <h3 className=" leading-6 font-medium">From Date</h3>
                <DatePicker
                    selected={props.startDate}
                    onChange={props.setStartDate}
                    selectsStart
                    startDate={props.startDate}
                    endDate={props.endDate}
                    className="rounded-md text-black p-2"
                />
            </div>
            <div>
                <h3 className="leading-6 font-medium">To Date</h3>
                <DatePicker
                    selected={props.endDate}
                    onChange={props.setEndDate}
                    selectsEnd
                    startDate={props.startDate}
                    endDate={props.endDate}
                    minDate={props.startDate}
                    className="rounded-md text-black p-2 "
                />
            </div>
        </div>
    );
}
