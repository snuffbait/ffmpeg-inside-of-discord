import definePlugin from "@utils/types";
import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { Toasts, React, SelectedChannelStore, DraftType } from "@webpack/common";
import { findByProps } from "@webpack";

const SIZEEEE = 8 * 1024 * 1024; // you tell me lol
const ffmpeg = "http://127.0.0.1:7123/compress";

async function upload(files: File[], channelId: string) {
    const uploader = findByProps("addFiles");
    if (!uploader?.addFiles) {
        console.error("error or something");
        return;
    }
    uploader.addFiles({
        files: files.map(f => ({ file: f, platform: 1, isThumbnail: false })),
        channelId,
        draftType: DraftType.ChannelMessage
    });
}

async function idk(channelId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,.mp4";

    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        if (file.size <= SIZEEEE) {
            await upload([file], channelId);
            return;
        }

        Toasts.show({
            message: `Compressing ${file.name}`,
            type: Toasts.Type.MESSAGE,
            id: Toasts.genId()
        });

        try {
            const form = new FormData();
            form.append("file", file, file.name);

            const res = await fetch(ffmpeg, { method: "POST", body: form });
            if (!res.ok) throw new Error(`Helper returned ${res.status}`);

            const blob = await res.blob();
            const named = file.name.replace(/\.mp4$/i, "_Fae_was_here.mp4");
            const compressed = new File([blob], named, { type: "video/mp4" });

            Toasts.show({
                message: `Done ${(file.size / 1024 / 1024).toFixed(1)}MB > ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
                type: Toasts.Type.SUCCESS,
                id: Toasts.genId()
            });

            await upload([compressed], channelId);
        } catch (e) {
            console.error("errorrr", e);
            Toasts.show({
                message: "Retard start the bat file inside of the helper file called yes.bat",
                type: Toasts.Type.FAILURE,
                id: Toasts.genId()
            });
        }
    };

    input.click();
}

const buton: ChatBarButtonFactory = ({ isMainChat, channel }) => {
    if (!isMainChat) return null;

    return React.createElement(ChatBarButton, {
        tooltip: "Compress",
        onClick: () => idk(channel?.id ?? SelectedChannelStore.getChannelId())
    }, React.createElement("div", { style: { fontSize: "20px" } }, "🏁"));
};

export default definePlugin({
 name: "FFMPEG INSIDE OF DISCORD (LEAKED METHOD)",
    description: "fuck your nitro lmao",
    authors: [{ id: "832999544844845056", name: "Fae" }],

    chatBarButton: {
        render: buton
    }
});
