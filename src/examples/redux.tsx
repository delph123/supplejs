import {
    h,
    ActionPayload,
    createReduxSlice,
    createReduxSelector,
} from "../rwr";

interface Slice {
    some: number;
    other: string;
    table: string[];
}

export function ReduxSlice() {
    const initialValue: Slice = {
        some: 0,
        other: "like",
        table: [],
    };

    const [store, dispatch] = createReduxSlice(initialValue, {
        addSome(state, action: ActionPayload<number>) {
            let some = state.some + action.payload;
            return { ...state, some };
        },
        changeOther(state, action: ActionPayload<string>) {
            return { ...state, other: action.payload };
        },
        push(state, action: ActionPayload<string>) {
            return { ...state, table: [...state.table, action.payload] };
        },
    });

    return () => {
        return (
            <div>
                <p>
                    There is {createReduxSelector(store, (s) => s.some)}{" "}
                    oranges.
                </p>
                <button
                    onclick={() => dispatch({ type: "addSome", payload: 3 })}
                >
                    Increment
                </button>
                <div>
                    <input
                        type="text"
                        id="other"
                        name="other"
                        value={createReduxSelector(store, (s) => s.other)}
                        oninput={(e) =>
                            dispatch({
                                type: "changeOther",
                                payload: e.currentTarget.value,
                            })
                        }
                    ></input>
                </div>
            </div>
        );
    };
}
