import rainbowGradient from "rainbow-gradient";
import { h, createSignal, createEffect, onCleanup, For } from "../rwr";

import "./RainbowApp.css";

type ColorProps = { colors: () => string[] };

const NB_COLORS = 360 * 8;

function ReactColors({ colors }: ColorProps) {
    const minWidth = `${100.0 / NB_COLORS}vw`;
    return () => (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
            }}
        >
            <For each={colors}>
                {(color) => (
                    <div
                        style={{
                            minHeight: "100vh",
                            minWidth,
                            backgroundColor: color,
                        }}
                    ></div>
                )}
            </For>
        </div>
    );
}

const rainbowColors = (rainbowGradient(360) as number[][]).map(
    ([r, g, b]) => `rgb(${r},${g},${b})`
);

function RainbowApp() {
    const [colors, setColors] = createSignal(
        new Array(NB_COLORS)
            .fill(0)
            .map((_, i) => rainbowColors[i % rainbowColors.length])
    );

    createEffect(() => {
        let mounted = true;
        const update = () => {
            if (mounted) {
                setColors((colors) => {
                    const newColors = [...colors!];
                    newColors.push(newColors.shift()!);
                    return newColors;
                });
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
        onCleanup(() => {
            mounted = false;
        });
    });

    return () => <ReactColors colors={colors} />;
}

export default RainbowApp;