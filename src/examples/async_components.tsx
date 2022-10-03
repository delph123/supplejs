import {
    h,
    createResource,
    createEffect,
    createSignal,
    onCleanup,
    createChainedList,
    RWRNodeEffect,
    Input,
} from "../rwr";

function Dog(): RWRNodeEffect {
    const [dog, { mutate, refetch }] = createResource(() => {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const res = await fetch(
                        "https://dog.ceo/api/breeds/image/random"
                    );
                    const resJson = await res.json();
                    resolve(resJson.message);
                } catch (e) {
                    reject(e);
                }
            }, 3000);
        });
    });

    return () => {
        const errorBlock = () => {
            if (dog.error || !dog()) {
                return <p>ERROR!!</p>;
            } else {
                return null;
            }
        };

        const imgBlock = () => {
            if (dog()) {
                return <img src={dog()} height="100" />;
            } else {
                return null;
            }
        };

        const refreshingBlock = () => {
            if (dog.state === "refreshing") {
                return <button disabled>Refreshing...</button>;
            } else {
                return <button onclick={refetch}>Another dog?</button>;
            }
        };

        if (dog.loading) return "Loading...";
        return (
            <div class="card">
                {errorBlock}
                {imgBlock}
                {refreshingBlock}
                <button
                    onclick={() =>
                        mutate(
                            "https://images.dog.ceo/breeds/hound-plott/hhh_plott002.JPG"
                        )
                    }
                >
                    Jose
                </button>
            </div>
        );
    };
}

export function AsyncApp(): RWRNodeEffect {
    const [ChainedList, push, pop] = createChainedList();

    return () => (
        <div>
            <ChainedList />
            <button
                onclick={() => {
                    push(() => <Dog />);
                }}
            >
                More dogs!
            </button>
            <button onclick={pop}>Less dogs!</button>
        </div>
    );
}

export function AutoCounter(): RWRNodeEffect {
    const [count, setCount] = createSignal(0);
    const [delay, setDelay] = createSignal(1000);
    createEffect(() => {
        const interval = setInterval(() => setCount(count() + 1), delay());
        onCleanup(() => clearInterval(interval));
    });
    return () => (
        <div>
            <h1>{count}</h1>
            <Input
                id="hello"
                value={() => delay().toString()}
                oninput={(e) => setDelay(e.target.value)}
            />
        </div>
    );
}
