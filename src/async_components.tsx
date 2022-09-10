import { h, createRenderEffect, createResource, createSignal } from "./rwr";

export function AsyncApp() {
  const [subscribe, refetch] = createSignal(true);
  const { data, loading, error, state } = createResource(subscribe, () => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const res = await fetch("https://dog.ceo/api/breeds/image/random");
          const resJson = await res.json();
          resolve(resJson.message);
        } catch (e) {
          reject(e);
        }
      }, 1000);
    });
  });

  return createRenderEffect(() => {
    const errorBlock = createRenderEffect(() => {
      if (error()) {
        return <p>ERROR!!</p>;
      } else {
        return null;
      }
    });

    const imgBlock = createRenderEffect(() => {
      if (data()) {
        return <img src={data()} height="300" />;
      } else {
        return null;
      }
    });

    const refreshingBlock = createRenderEffect(() => {
      if (state() === "refreshing") {
        return <button disabled>Refreshing...</button>;
      } else {
        return <button onclick={refetch}>New dog!</button>;
      }
    });

    if (loading()) return "Loading...";
    return (
      <div>
        {errorBlock}
        {imgBlock}
        <div>{refreshingBlock}</div>
      </div>
    );
  });
}
