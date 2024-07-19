import {
    h,
    Fragment,
    createComputed,
    createEffect,
    createReaction,
    createSignal,
    onCleanup,
    SuppleComponentReturn,
    getOwner,
    createMemo,
    runWithOwner,
    createSelector,
    createRef,
    onMount,
} from "../core";

export function NestedEffect(): SuppleComponentReturn {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(10);
    const [c, setC] = createSignal(100);

    createEffect(() => {
        console.log(`Effect ${a()}`);
        onCleanup(() => console.log(`Cleaning-up effect ${a()}`));

        createEffect(() => {
            console.log(`Effect ${a()}.${b()}`);
            onCleanup(() => console.log(`Cleaning-up effect ${a()}.${b()}`));

            createEffect(() => {
                console.log(`Effect ${a()}.${b()}.${c()}`);
                onCleanup(() => console.log(`Cleaning-up effect ${a()}.${b()}.${c()}`));
            });

            createEffect(() => {
                console.log(`Effect ${a()}.${b()}.2`);
                onCleanup(() => console.log(`Cleaning-up effect ${a()}.${b()}.2`));
            });
        });

        createEffect(() => {
            console.log(`Effect ${a()}.${b() + 1}`);
            onCleanup(() => console.log(`Cleaning-up effect ${a()}.${b() + 1}`));

            createEffect(() => {
                console.log(`Effect ${a()}.${b() + 1}.${c()}`);
                onCleanup(() => console.log(`Cleaning-up effect ${a()}.${b() + 1}.${c()}`));
            });

            createEffect(() => {
                console.log(`Effect ${a()}.${b() + 1}.2`);
                onCleanup(() => console.log(`Cleaning-up effect ${a()}.${b() + 1}.2`));
            });
        });
    });

    setTimeout(() => {
        setC(c() + 5);
    }, 10);

    setTimeout(() => {
        setA(a() + 1);
    }, 1000);

    setTimeout(() => {
        setB(b() + 2);
    }, 2000);

    setTimeout(() => {
        setA(a() + 1);
    }, 3000);

    setTimeout(() => {
        setB(b() + 2);
    }, 4000);

    setTimeout(() => {
        setA(a() + 1);
    }, 5000);

    return 123456789012345678901234567890n;
}

export function MyNameIs(): SuppleComponentReturn {
    const [firstName, setFirstName] = createSignal("John");
    const [lastName, setLastName] = createSignal("Doe");
    const [showLastName, setShowLastName] = createSignal(true);

    createComputed(() => {
        if (showLastName()) {
            console.log(firstName(), lastName());
        } else {
            console.log(firstName());
        }
    });

    setLastName("A");
    setShowLastName(false);
    setLastName("B");
    setFirstName("Marc");

    return "Hello world!";
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface ExplicitProperties {
            autofocus: boolean;
        }
    }
}

export function CounterButton({ onexit, nb }: { onexit?: () => void; nb: number }) {
    const [count, setCount] = createSignal(nb);
    const increment = () => {
        if (counter() < 7) {
            setTimeout(() => runWithOwner(owner!, () => track(counter)), 200);
        }
        setCount(count() + 1);
    };

    const selector = createSelector(count);
    createComputed(() => console.log(selector(8), selector(10)));

    const counter = createMemo(() => {
        onCleanup(() => console.log("cleaning tracking"));
        console.log("tracking activated", getOwner());
        return count();
    });

    const track = createReaction(() => {
        onCleanup(() => console.log("cleaning reaction"));
        console.log("reaction!", getOwner());
    });

    const owner = getOwner();

    track(counter);

    return () => (
        <>
            <button
                attr:data-count={count}
                data-count-twice={() => 2 * count()}
                prop:autofocus={() => count() % 2 === 0}
                class={() => (count() % 3 === 0 ? null : count() % 3 === 2 ? "" : count().toString())}
                type="button"
                onclick={increment}
            >
                {count()}
            </button>
            <br />
            <button type="button" onclick={onexit}>
                Exit
            </button>
        </>
    );
}

export function Referencing() {
    const ref = createRef<HTMLDivElement>();

    onMount(() => console.log("After mount:", ref.current));
    createEffect(() => console.log("Effect:", ref.current));
    createComputed(() => console.log("Computed:", ref.current));

    return (
        <>
            <div ref={ref}>Hello!</div>
            <div ref={(el: HTMLDivElement) => console.log("Assigning ref:", el)}>How are you?</div>
        </>
    );
}
