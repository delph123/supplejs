import {
  h,
  createRenderEffect,
  createResource,
  createEffect,
  createSignal,
  onCleanup,
  createChainedList,
} from "../rwr";

function Dog() {
  const [dog, { mutate, refetch }] = createResource(() => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const res = await fetch("https://dog.ceo/api/breeds/image/random");
          const resJson = await res.json();
          resolve(resJson.message);
        } catch (e) {
          reject(e);
        }
      }, 3000);
    });
  });

  return createRenderEffect(() => {
    const errorBlock = createRenderEffect(() => {
      if (dog.error || !dog()) {
        return <p>ERROR!!</p>;
      } else {
        return null;
      }
    });

    const imgBlock = createRenderEffect(() => {
      if (dog()) {
        return <img src={dog()} height="100" />;
      } else {
        return null;
      }
    });

    const refreshingBlock = createRenderEffect(() => {
      if (dog.state === "refreshing") {
        return <button disabled>Refreshing...</button>;
      } else {
        return <button onclick={refetch}>Another dog?</button>;
      }
    });

    if (dog.loading) return "Loading...";
    return (
      <div class="card">
        {errorBlock}
        {imgBlock}
        {refreshingBlock}
        <button
          onclick={() =>
            mutate("https://images.dog.ceo/breeds/hound-plott/hhh_plott002.JPG")
          }
        >
          Jose
        </button>
      </div>
    );
  });
}

export function AsyncApp() {
  const [ChainedList, push, pop] = createChainedList();

  return createRenderEffect(() => (
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
  ));
}

export function NestedEffect() {
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
        onCleanup(() =>
          console.log(`Cleaning-up effect ${a()}.${b() + 1}.${c()}`)
        );
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

  return createRenderEffect(() => 123456789012345678901234567890n);
}

export function MyNameIs() {
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

  return createRenderEffect(() => "Hello world!");
}
