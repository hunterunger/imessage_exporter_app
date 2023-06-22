export default async function openNewWindow(label: string, url: string) {
    try {
        const WebviewWindow = (await import("@tauri-apps/api/window"))
            .WebviewWindow;
        new WebviewWindow(label, { url: url });
    } catch (error) {
        console.log(error);
    }
}
