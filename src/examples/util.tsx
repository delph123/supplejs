import { h, createSignal, untrack } from "../rwr";

export function createIncrement(initialValue: number = 0) {
    const [value, setValue] = createSignal(initialValue);
    const [started, start] = createSignal(false);

    let timer;

    function toggle() {
        if (started()) {
            clearInterval(timer);
        } else {
            timer = setInterval(inc, 1000);
        }
        start((c) => !c);
    }

    function inc() {
        setValue((v) => v + 1);
    }

    function Player({ color = "grey", style = {}, pause = false }) {
        if (!pause) {
            untrack(toggle);
        }

        return () => (
            <div
                style={{
                    border: "1px solid " + color,
                    display: "flex",
                    gap: "5px",
                    padding: "3px",
                    width: "fit-content",
                    ...style,
                }}
            >
                <div
                    style={{
                        margin: "1px 0.3em 0px 0.3em",
                        textAlign: "center",
                        width: "2em",
                    }}
                >
                    {value}
                </div>
                <button onClick={toggle}>
                    <img
                        style={{
                            width: "1em",
                            height: "1em",
                            marginBottom: "-2px",
                        }}
                        src={() => (started() ? "pause.svg" : "play.svg")}
                    ></img>
                </button>

                <button onClick={inc}>
                    <img
                        style={{
                            width: "1em",
                            height: "1em",
                            marginBottom: "-2px",
                        }}
                        src="plus.svg"
                    ></img>
                </button>
            </div>
        );
    }

    return [value, inc, Player] as const;
}
