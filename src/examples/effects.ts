import { createEffect, createSignal, onCleanup, RWRNodeEffect } from "../rwr";

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

    createEffect(() => {
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
