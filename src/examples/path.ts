const BASE_URL = (() => {
    const globalBaseUrl = import.meta.env.BASE_URL;
    return globalBaseUrl.endsWith("/") ? globalBaseUrl : globalBaseUrl + "/";
})();

export function getRelativePathname() {
    if (document.location.pathname.startsWith(BASE_URL)) {
        return document.location.pathname.substring(BASE_URL.length);
    } else {
        return document.location.pathname;
    }
}

export function toRelativePath(path: string) {
    return BASE_URL + path;
}
