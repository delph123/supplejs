import { createChainedList } from "./chain";
import { h, createRenderEffect, createResource } from "./rwr";

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
