import {
    h,
    createSignal,
    createEffect,
    onCleanup,
    RWRNodeEffect,
    For,
    Input,
} from "../rwr";

import "./todo.css";

interface TodoItem {
    key: string;
    done: () => boolean;
    label: string;
    setDone: (b: boolean) => void;
    edit: () => boolean;
    setEdit: (b: boolean) => void;
}

let currentKey = 0;

function nextKey() {
    currentKey++;
    return `todo-${currentKey}`;
}

function createItem(label, completed = false): TodoItem {
    const [done, setDone] = createSignal(completed);
    const [edit, setEdit] = createSignal(false);

    return {
        key: nextKey(),
        label,
        done,
        setDone,
        edit,
        setEdit,
    };
}

const DEFAULT_TODO_LIST = [
    createItem("react-without-react", true),
    createItem("solidjs", false),
    createItem("vue + Mobx", false),
];

enum Filters {
    All = "All",
    Active = "Active",
    Completed = "Completed",
    Editing = "Editing",
}

type FiltersStrings = keyof typeof Filters;

const FILTER_MAP: { [k in FiltersStrings]: (i: TodoItem) => boolean } = {
    All: () => true,
    Active: (task) => !task.done(),
    Completed: (task) => task.done(),
    Editing: (task) => task.edit(),
};

export function Todo(): RWRNodeEffect {
    const [selectedFilter, setSelectedFilter] = createSignal("All");
    const [value, setValue] = createSignal("");
    const [list, setList] = createSignal(DEFAULT_TODO_LIST);

    const filteredList = () => list().filter(FILTER_MAP[selectedFilter()]);

    return () => (
        <div class="todoapp stack-large">
            <Form value={value} setValue={setValue} setList={setList} />

            <FilterBar
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
            />

            {() => (
                <h3>
                    {selectedFilter()} Task
                    {filteredList().length !== 1 ? "s" : ""}
                </h3>
            )}

            <For
                anchor={() => (
                    <ul class="todo-list stack-large stack-exception"></ul>
                )}
                each={filteredList}
            >
                {(item: TodoItem) => (
                    <TodoListItem item={item} setList={setList} />
                )}
            </For>

            {() => (
                <p class="task-completed">
                    {list().filter((t) => !t.done()).length} task
                    {list().filter((t) => !t.done()).length !== 1
                        ? "s"
                        : ""}{" "}
                    remaining.
                </p>
            )}
        </div>
    );
}

function TodoListItem({ item, setList }) {
    return () => (
        <li class="todo stack-small">
            <div class="c-cb">
                {() => (
                    <input
                        type="checkbox"
                        onchange={(e) => item.setDone(e.target.checked)}
                        {...(item.done() && {
                            checked: "checked",
                        })}
                    />
                )}
                {() =>
                    item.edit() ? (
                        <Input
                            class="todo-label"
                            id={"input-" + item.key}
                            value={() => item.label}
                            oninput={(e) => {
                                item.label = e.target.value;
                            }}
                        />
                    ) : (
                        <label
                            class="todo-label"
                            style={
                                item.done()
                                    ? "text-decoration: line-through;"
                                    : ""
                            }
                        >
                            {item.label}
                        </label>
                    )
                }
            </div>
            <div class="btn-group">
                <button
                    class="btn"
                    onclick={() => {
                        item.setEdit(!item.edit());
                    }}
                >
                    {() => (item.edit() ? "Update" : "Edit")}
                </button>
                <button
                    class="btn btn__danger"
                    onclick={() => {
                        setList((l) => l!.filter((it) => it.key !== item.key));
                    }}
                >
                    Delete
                </button>
            </div>
        </li>
    );
}

function Form({ value, setValue, setList }) {
    return () => (
        <form>
            <h2 class="label-wrapper">
                <label htmlFor="new-todo-input" class="label__lg">
                    What needs to be done?
                </label>
            </h2>
            <div class="form-input">
                <Input
                    type="text"
                    id="new-todo-input"
                    name="text"
                    class="input input__lg"
                    value={value}
                    oninput={(e) => setValue(e.target.value)}
                />
                <button
                    type="submit"
                    class="btn btn__primary btn__lg"
                    onclick={(e) => {
                        e.preventDefault();
                        setList((l) => [...l!, createItem(value())]);
                        setValue("");
                    }}
                >
                    Add
                </button>
            </div>
        </form>
    );
}

function FilterButton({ label, pressed, onpress }) {
    return () => (
        <button
            type="button"
            class="btn toggle-btn"
            onclick={(e) => {
                onpress(label);
            }}
            aria-pressed={pressed() === label}
        >
            <span class="visually-hidden">Show </span>
            <span>{label}</span>
            <span class="visually-hidden"> tasks</span>
        </button>
    );
}

function FilterBar({ selectedFilter, setSelectedFilter }) {
    return () => (
        <div class="filters btn-group stack-exception">
            {Object.keys(Filters).map((f) => (
                <FilterButton
                    label={f}
                    pressed={selectedFilter}
                    onpress={setSelectedFilter}
                />
            ))}
        </div>
    );
}
