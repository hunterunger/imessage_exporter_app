export default async function getDataDir() {
    try {
        const dataDir = (await import("@tauri-apps/api/path")).appDataDir;

        const dir = await dataDir();

        return dir;
    } catch (error) {
        console.log(error);
    }
}
