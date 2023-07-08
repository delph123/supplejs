import rainbowGradient from "rainbow-gradient";
import { h, createSignal, createEffect, onCleanup, For } from "../rwr";

import "./RainbowApp.css";

type ColorProps = { colors: () => string[] };

function ReactColors({ colors }: ColorProps) {
    //   const minWidth = `${100.0 / colors.length}vw`;
    return () => (
        <div class="flexcontainer">
            <For each={colors}>
                {(color) => (
                    <div
                        class="flexcol"
                        style={"background-color: " + color}
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
        new Array(360 * 30)
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
