import {
    h,
    Fragment,
    createComputed,
    createEffect,
    createReaction,
    createSignal,
    onCleanup,
    RWRNodeEffect,
    getOwner,
    createMemo,
    runWithOwner,
} from "../rwr";

export function NestedEffect(): RWRNodeEffect {
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
                onCleanup(() =>
                    console.log(`Cleaning-up effect ${a()}.${b()}.${c()}`)
                );
            });

            createEffect(() => {
                console.log(`Effect ${a()}.${b()}.2`);
                onCleanup(() =>
                    console.log(`Cleaning-up effect ${a()}.${b()}.2`)
                );
            });
        });

        createEffect(() => {
            console.log(`Effect ${a()}.${b() + 1}`);
            onCleanup(() =>
                console.log(`Cleaning-up effect ${a()}.${b() + 1}`)
            );

            createEffect(() => {
                console.log(`Effect ${a()}.${b() + 1}.${c()}`);
                onCleanup(() =>
                    console.log(`Cleaning-up effect ${a()}.${b() + 1}.${c()}`)
                );
            });

            createEffect(() => {
                console.log(`Effect ${a()}.${b() + 1}.2`);
                onCleanup(() =>
                    console.log(`Cleaning-up effect ${a()}.${b() + 1}.2`)
                );
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

    return () => 123456789012345678901234567890n;
}

export function MyNameIs(): RWRNodeEffect {
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

    return () => "Hello world!";
}

export function CounterButton({ onexit, nb }) {
    const [count, setCount] = createSignal(nb);
    const increment = () => {
        if (counter() < 7) {
            setTimeout(() => runWithOwner(owner!, () => track(counter)), 200);
        }
        setCount(count() + 1);
    };

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
            <button type="button" onclick={increment}>
                {count()}
            </button>
            <br />
            <button type="button" onclick={onexit}>
                Exit
            </button>
        </>
    );
}
