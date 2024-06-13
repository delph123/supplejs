import { onCleanup, onMount } from "../core";

export default function useCSS(cssFilePath: string) {
    let link;
    onMount(() => {
        // Creating link element
        link = document.createElement("link");
        link.href = cssFilePath;
        link.type = "text/css";
        link.rel = "stylesheet";
        document.head.append(link);
    });
    onCleanup(() => {
        document.head.removeChild(link);
    });
}
