export default async function getPlatform() {
    try {
        const platform = (await import("@tauri-apps/api/os")).platform;

        const osName = await platform();

        return osName;
    } catch (error) {
        console.log(error);
    }
}
