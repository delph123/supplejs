const BASE_URL = (() => {
    const globalBaseUrl = import.meta.env.BASE_URL;
    return globalBaseUrl.endsWith("/") ? globalBaseUrl : globalBaseUrl + "/";
})();

export function toRelativePath(path: string) {
    return BASE_URL + path.replaceAll(" ", "_").replaceAll("/", "-").toLowerCase();
}
