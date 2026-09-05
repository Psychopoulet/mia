// module

/**
 * Saves an already fetched text content as a flat file (no server round-trip:
 * the content lives in memory, it is only wrapped in a temporary object URL).
 */
export default function downloadTextFile (content: string, fileName: string): void {

    const url: string = URL.createObjectURL(new Blob([ content ], {
        "type": "text/plain;charset=utf-8"
    }));

    const link: HTMLAnchorElement = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}
